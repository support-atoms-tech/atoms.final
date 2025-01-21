--! 13_orgs_profiles_helpers.sql
--! Common helper functions, triggers, and utilities

/**
* ORGANIZATION HELPERS
*/
create or replace function get_user_organizations(
  user_id uuid,
  include_inactive boolean default false
)
returns table (
  id uuid,
  name text,
  slug text,
  role user_role,
  type organization_type,
  billing_plan billing_plan,
  member_count integer,
  is_personal boolean,
  status user_status
)
language sql
security definer
stable
as $$
  select 
    o.id,
    o.name,
    o.slug,
    om.role,
    o.type,
    o.billing_plan,
    o.member_count,
    o.type = 'personal' as is_personal,
    o.status
  from organizations o
  join organization_members om on om.organization_id = o.id
  where om.user_id = user_id
  and (include_inactive or o.status = 'active')
  order by 
    o.type = 'personal' desc,  -- Personal org first
    o.name asc;                -- Then alphabetically
$$;

create or replace function switch_organization(
  user_id uuid,
  org_id uuid
)
returns boolean
language plpgsql
security definer
as $$
begin
  -- Verify user is a member of the organization
  if not exists (
    select 1 from organization_members
    where organization_id = org_id
    and user_id = user_id
    and status = 'active'
  ) then
    return false;
  end if;

  -- Update current organization
  update profiles
  set current_organization_id = org_id
  where id = user_id;

  return true;
end;
$$;

/**
* MEMBER MANAGEMENT
*/
create or replace function invite_organization_member(
  org_id uuid,
  email text,
  role user_role default 'member'
)
returns uuid
language plpgsql
security definer
as $$
declare
  invitation_id uuid;
begin
  -- Verify invoker has permission
  if not exists (
    select 1 from organization_members
    where organization_id = org_id
    and user_id = auth.uid()
    and role in ('owner', 'admin')
    and status = 'active'
  ) then
    raise exception 'Insufficient permissions';
  end if;

  -- Check organization type
  if exists (
    select 1 from organizations
    where id = org_id
    and type = 'personal'
  ) then
    raise exception 'Cannot invite members to personal organizations';
  end if;

  -- Create invitation
  insert into organization_invitations (
    organization_id,
    email,
    role,
    invited_by
  ) values (
    org_id,
    email,
    role,
    auth.uid()
  )
  returning id into invitation_id;

  return invitation_id;
end;
$$;

create or replace function accept_invitation(
  invitation_token uuid
)
returns boolean
language plpgsql
security definer
as $$
declare
  inv record;
begin
  -- Get and validate invitation
  select * into inv
  from organization_invitations
  where token = invitation_token
  and status = 'pending'
  and expires_at > now();

  if not found then
    return false;
  end if;

  -- Add member
  insert into organization_members (
    organization_id,
    user_id,
    role
  ) values (
    inv.organization_id,
    auth.uid(),
    inv.role
  );

  -- Update invitation status
  update organization_invitations
  set status = 'accepted'
  where token = invitation_token;

  return true;
end;
$$;

/**
* USAGE AND LIMITS
*/
create or replace function get_organization_usage(
  org_id uuid,
  start_date timestamptz default date_trunc('month', current_timestamp),
  end_date timestamptz default (date_trunc('month', current_timestamp) + interval '1 month')
)
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  usage_data jsonb;
begin
  select jsonb_build_object(
    'period', jsonb_build_object(
      'start', start_date,
      'end', end_date
    ),
    'usage', jsonb_build_object(
      'tokens', sum(case when unit_type = 'tokens' then quantity else 0 end),
      'storage', sum(case when unit_type = 'storage' then quantity else 0 end),
      'api_calls', sum(case when unit_type = 'api_calls' then quantity else 0 end)
    ),
    'features', jsonb_agg(distinct feature),
    'users', jsonb_agg(distinct user_id)
  )
  into usage_data
  from usage_logs
  where organization_id = org_id
  and created_at >= start_date
  and created_at < end_date;

  return usage_data;
end;
$$;

/**
* COMMON TRIGGERS
*/

create or replace function check_organization_limits()
returns trigger
language plpgsql
security definer
as $$
declare
  member_count integer;
  max_members integer;
begin
  -- Get current member count and limit
  select 
    o.member_count,
    (bc.billing_status->'features'->>'max_members')::integer
  into member_count, max_members
  from organizations o
  join billing_cache bc on bc.organization_id = o.id
  where o.id = new.organization_id;

  -- Check if adding member would exceed limit
  if max_members is not null and member_count >= max_members then
    raise exception 'Organization member limit reached';
  end if;

  return new;
end;
$$;

/**
* VALIDATION HELPERS
*/
create or replace function is_valid_email(email text)
returns boolean
language plpgsql
immutable
as $$
begin
  return email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
end;
$$;

create or replace function is_valid_slug(slug text)
returns boolean
language plpgsql
immutable
as $$
begin
  return slug ~* '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$';
end;
$$;



/**
* NOTIFICATION HELPERS
*/


create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  type notification_type not null,
  title text not null,
  unread boolean default false,
  message text,
  metadata jsonb default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now())
);

create or replace function create_notification(
  user_id uuid,
  type notification_type,
  title text,
  message text default null,
  metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  notification_id uuid;
begin
  insert into notifications (
    user_id,
    type,
    title,
    message,
    metadata
  ) values (
    user_id,
    type,
    title,
    message,
    metadata
  )
  returning id into notification_id;

  return notification_id;
end;
$$;

-- Enable RLS for notifications
alter table notifications enable row level security;

-- Notification policies
create policy "Users can view own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on notifications for update
  using (auth.uid() = user_id);

/**
* APPLY TRIGGERS
*/
-- Organization member limits
create trigger check_member_limits
  before insert on organization_members
  for each row
  execute function check_organization_limits();
