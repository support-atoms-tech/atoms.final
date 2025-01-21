
-- ===================================================================================================
-- HELPER: create_personal_organization(user_id, name)
-- Creates a personal organization for a new user
-- ===================================================================================================
create or replace function create_personal_organization(user_id uuid, name text)
returns uuid
security definer
set search_path = public
language plpgsql
as $$
declare
  org_id uuid;
begin
  -- Create the personal organization
  insert into organizations (
    name,
    slug,
    type,
    created_by,
    billing_plan,
    settings,
    max_members,
    max_monthly_tokens
  ) values (
    name || '''s Organization',
    generate_slug(name || '''s Organization'),
    'personal',
    user_id,
    'free',
    jsonb_build_object(
      'default_access_level', 'private',
      'allow_public_projects', false,
      'require_2fa', false
    ),
    1,  -- personal orgs limited to 1 member
    100000  -- 100k tokens for free tier
  )
  returning id into org_id;

  -- Add the user as owner
  insert into organization_members (
    organization_id,
    user_id,
    role,
    status
  ) values (
    org_id,
    user_id,
    'owner',
    'active'
  );

  return org_id;
end;
$$;

-- ===================================================================================================
-- MAIN: handle_new_user()
-- Triggered when a new user signs up via Supabase Auth
-- ===================================================================================================
create or replace function handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  personal_org_id uuid;
begin
  -- Create personal organization first
  personal_org_id := create_personal_organization(
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User')
  );

  -- Create profile
  insert into profiles (
    id,
    email,
    full_name,
    avatar_url,
    personal_organization_id,
    current_organization_id,
    preferences
  ) values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    personal_org_id,
    personal_org_id,  -- Set personal org as current
    jsonb_build_object(
      'theme', 'light',
      'notifications', 'all',
      'email_frequency', 'daily'
    )
  );

  -- Initialize billing/subscription records if needed
  perform initialize_billing(new.id, personal_org_id);

  return new;
exception
  when others then
    -- Log the error
    insert into audit_logs (
      entity_id,
      entity_type,
      action,
      actor_id,
      metadata
    ) values (
      new.id,
      'auth.users',
      'registration_error',
      new.id,
      jsonb_build_object(
        'error', SQLERRM,
        'error_detail', SQLSTATE
      )
    );
    -- Re-raise the exception
    raise;
end;
$$;

/**
* HELPER: handle_user_login()
* Updates login statistics when user logs in
*/
create or replace function handle_user_login()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  update profiles
  set 
    last_login_at = timezone('utc'::text, now()),
    login_count = login_count + 1
  where id = new.user_id;
  return new;
end;
$$;

/**
* HELPER: handle_deleted_user()
* Cleans up user data when account is deleted
*/
create or replace function handle_deleted_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  personal_org_id uuid;
begin
  -- Get personal organization ID
  select personal_organization_id into personal_org_id
  from profiles
  where id = old.id;

  -- Soft delete the profile
  update profiles
  set status = 'inactive',
      updated_at = timezone('utc'::text, now())
  where id = old.id;

  -- Remove from all organizations except personal
  update organization_members
  set status = 'inactive',
      updated_at = timezone('utc'::text, now())
  where user_id = old.id
  and organization_id != personal_org_id;

  -- Log the deletion
  insert into audit_logs (
    entity_id,
    entity_type,
    action,
    actor_id,
    metadata
  ) values (
    old.id,
    'auth.users',
    'user_deleted',
    old.id,
    jsonb_build_object(
      'email', old.email,
      'deleted_at', timezone('utc'::text, now())
    )
  );

  return old;
end;
$$;

/**
* TRIGGERS
*/
-- Create user trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Login trigger
create trigger on_auth_user_login
  after insert on auth.sessions
  for each row execute function handle_user_login();

-- Delete user trigger
create trigger on_auth_user_deleted
  before delete on auth.users
  for each row execute function handle_deleted_user();

  