-- ===================================================================================================
-- STRIPE CUSTOMERS
-- Maps organizations to Stripe customers
-- Note: This is our source of truth for billing status
-- ===================================================================================================
create type subscription_status as enum ('active', 'inactive', 'trialing', 'past_due', 'canceled', 'paused');

create table stripe_customers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations,
  stripe_customer_id text unique,
  -- Current subscription info
  stripe_subscription_id text unique,
  subscription_status subscription_status,
  price_id text,
  -- Billing period
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  -- Payment method
  payment_method_last4 text,
  payment_method_brand text,
  -- Timestamps
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now()),
  -- Constraints
  unique(organization_id)
);
-- ===================================================================================================
-- Enable RLS
-- ===================================================================================================
alter table stripe_customers enable row level security;

-- FUNCTION
create or replace function handle_stripe_customer_update()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := timezone('utc'::text, now());
    return new;
end;
$$;

-- TRIGGER
create or replace trigger tr_update_stripe_customers
    before update on stripe_customers
    for each row
    execute function handle_stripe_customer_update();

create or replace trigger tr_log_stripe_customers
    after insert or update or delete on stripe_customers
    for each row
    execute function handle_audit_log();

-- ===================================================================================================
-- BILLING CACHE
-- Stores current billing status and limits for fast access
-- Updated by syncBillingData() function
-- ===================================================================================================
create table billing_cache (
  organization_id uuid primary key references organizations,
  -- Current billing status
  billing_status jsonb not null default '{
    "status": "inactive",
    "plan": "free",
    "features": {
      "max_members": 1,
      "max_monthly_tokens": 0,
      "max_storage": 1,
      "max_api_calls": 50
    }
  }'::jsonb,
  -- Usage tracking
  current_period_usage jsonb not null default '{
    "tokens_used": 0,
    "storage_used": 0,
    "api_calls": 0
  }'::jsonb,
  -- Timestamps
  synced_at timestamptz not null default timezone('utc'::text, now()),
  period_start timestamptz not null default timezone('utc'::text, now()),
  period_end timestamptz not null default timezone('utc'::text, now())
);
-- ===================================================================================================
-- Enable RLS
-- ===================================================================================================
alter table billing_cache enable row level security;

-- TRIGGER
create or replace trigger tr_log_billing_cache
    after insert or update or delete on billing_cache
    for each row
    execute function handle_audit_log();

-- ===================================================================================================
-- USAGE TRACKING
-- Detailed usage logs per organization
-- ===================================================================================================
create table usage_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations,
  user_id uuid not null references auth.users,
  -- Usage details
  feature text not null,
  quantity integer not null,
  unit_type text not null, -- 'tokens', 'storage', 'api_calls'
  -- Metadata
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now())
);
-- ===================================================================================================
-- Enable RLS
alter table usage_logs enable row level security;
-- ===================================================================================================

-- ===================================================================================================
-- SYNC BILLING DATA
-- Single source of truth function that syncs Stripe data to our database
-- ===================================================================================================

create or replace function sync_billing_data(org_id uuid)
returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
  stripe_data record;
  current_usage record;
  new_status jsonb;
begin
  -- Get current Stripe data
  select * into stripe_data
  from stripe_customers
  where organization_id = org_id;

  -- Calculate current usage
  select 
    coalesce(sum(case when unit_type = 'tokens' then quantity else 0 end), 0) as tokens_used,
    coalesce(sum(case when unit_type = 'storage' then quantity else 0 end), 0) as storage_used,
    coalesce(sum(case when unit_type = 'api_calls' then quantity else 0 end), 0) as api_calls
  into current_usage
  from usage_logs
  where organization_id = org_id
  and created_at >= stripe_data.current_period_start
  and created_at < stripe_data.current_period_end;

  -- Build new status
  new_status := jsonb_build_object(
    'status', stripe_data.subscription_status,
    'plan', (
      select billing_plan
      from organizations
      where id = org_id
    ),
    'features', (
      case when stripe_data.subscription_status = 'active' then
        case (select billing_plan from organizations where id = org_id)
          when 'free' then '{"max_members": 1, "max_monthly_tokens": 100000}'
          when 'pro' then '{"max_members": 5, "max_monthly_tokens": 1000000}'
          when 'enterprise' then '{"max_members": null, "max_monthly_tokens": null}'
        end
      else
        '{"max_members": 1, "max_monthly_tokens": 100000}'
      end
    )::jsonb
  );

  -- Update billing cache
  insert into billing_cache (
    organization_id,
    billing_status,
    current_period_usage,
    synced_at,
    period_start,
    period_end
  ) values (
    org_id,
    new_status,
    jsonb_build_object(
      'tokens_used', current_usage.tokens_used,
      'storage_used', current_usage.storage_used,
      'api_calls', current_usage.api_calls
    ),
    timezone('utc'::text, now()),
    stripe_data.current_period_start,
    stripe_data.current_period_end
  )
  on conflict (organization_id) do update
  set
    billing_status = excluded.billing_status,
    current_period_usage = excluded.current_period_usage,
    synced_at = excluded.synced_at,
    period_start = excluded.period_start,
    period_end = excluded.period_end;

  return new_status;
end;
$$;

/**
* CHECK RESOURCE ACCESS
* Verifies if an organization can use a specific amount of resources
*/
create or replace function can_use_resource(
  org_id uuid,
  resource_type text,
  quantity integer
)
returns boolean
security definer
set search_path = public
language plpgsql
as $$
declare
  cache record;
  current_usage integer;
  max_allowed integer;
begin
  -- Get current billing cache
  select * into cache
  from billing_cache
  where organization_id = org_id;

  -- Get current usage for the resource type
  current_usage := (cache.current_period_usage->>resource_type)::integer;
  
  -- Get max allowed for the resource type
  max_allowed := (cache.billing_status->'features'->>'max_' || resource_type)::integer;

  -- If max_allowed is null, it means unlimited
  if max_allowed is null then
    return true;
  end if;

  -- Check if adding quantity would exceed limit
  return (current_usage + quantity) <= max_allowed;
end;
$$;

/**
* LOG RESOURCE USAGE
* Records usage and updates cache
*/
create or replace function log_resource_usage(
  org_id uuid,
  user_id uuid,
  feature text,
  quantity integer,
  unit_type text,
  metadata jsonb default '{}'::jsonb
)
returns boolean
security definer
set search_path = public
language plpgsql
as $$
begin
  -- First check if we can use this resource
  if not can_use_resource(org_id, unit_type, quantity) then
    return false;
  end if;

  -- Log the usage
  insert into usage_logs (
    organization_id,
    user_id,
    feature,
    quantity,
    unit_type,
    metadata
  ) values (
    org_id,
    user_id,
    feature,
    quantity,
    unit_type,
    metadata
  );

  -- Trigger billing cache update
  perform sync_billing_data(org_id);

  return true;
end;
$$;

/**
* RLS POLICIES
*/
-- Stripe Customers
create policy "Organization admins can view stripe data"
  on stripe_customers for select
  using (exists (
    select 1 from organization_members
    where organization_id = stripe_customers.organization_id
    and user_id = auth.uid()
    and role in ('owner', 'admin')
  ));

-- Billing Cache
create policy "Members can view their organization's billing"
  on billing_cache for select
  using (exists (
    select 1 from organization_members
    where organization_id = billing_cache.organization_id
    and user_id = auth.uid()
  ));

-- Usage Logs
create policy "Members can view their organization's usage"
  on usage_logs for select
  using (exists (
    select 1 from organization_members
    where organization_id = usage_logs.organization_id
    and user_id = auth.uid()
  ));

/**
* HELPER: initialize_billing()
* Called by handle_new_user() to set up initial billing records
*/
create or replace function initialize_billing(user_id uuid, org_id uuid)
returns void
security definer
set search_path = public
language plpgsql
as $$
begin
  -- Initialize billing cache with free tier
  insert into billing_cache (
    organization_id,
    billing_status,
    current_period_usage,
    period_start,
    period_end
  ) values (
    org_id,
    '{
      "status": "inactive",
      "plan": "free",
      "features": {
        "max_members": 1,
        "max_monthly_tokens": 0,
        "max_storage": 1,
        "max_api_calls": 50
      }
    }'::jsonb,
    '{
      "tokens_used": 0,
      "storage_used": 0,
      "api_calls": 0
    }'::jsonb,
    timezone('utc'::text, now()),
    timezone('utc'::text, now()) + interval '1 month'
  );
end;
$$;