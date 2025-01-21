-- ===================================================================================================
-- PROFILES
-- Extends auth.users with additional profile information
-- Note: This table contains user data. Users should only be able to view and update their own data.
-- ===================================================================================================
create table profiles (
  -- UUID from auth.users
  id uuid references auth.users primary key,
  full_name text,
  avatar_url text check (avatar_url ~ '^https?://'),
  -- Profile fields
  email text not null,
  personal_organization_id uuid,
  current_organization_id uuid,
  job_title text,
  -- User preferences and settings
  preferences jsonb default '{
    "theme": "light",
    "notifications": "all",
    "email_frequency": "daily"
  }'::jsonb,
  -- Meta fields
  status user_status default 'active',
  last_login_at timestamp with time zone,
  login_count integer default 0,
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  -- Soft delete fields
  is_deleted boolean default false,
  deleted_at timestamp with time zone,
  deleted_by uuid references auth.users,
  -- Constraints
  constraint valid_email check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  constraint one_active_organization check (
    case when status = 'active' then current_organization_id is not null else true end
  )
);
-- ===================================================================================================
-- ORGANIZATIONS
-- Core table for organizations (both personal and team)
-- ===================================================================================================
create table organizations (
  -- Identity
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  type organization_type not null default 'personal',
  -- Branding
  logo_url text check (logo_url ~ '^https?://'),
  -- Billing
  billing_plan billing_plan not null default 'free',
  billing_cycle pricing_plan_interval not null default 'none',
  max_members integer not null default 1,
  max_monthly_requests bigint not null default 50,
  -- Settings and metadata
  settings jsonb default '{
    "default_access_level": "private",
    "allow_public_projects": false,
    "require_2fa": false
  }'::jsonb,
  metadata jsonb default '{}'::jsonb,
  -- Stats
  member_count integer default 0,
  storage_used bigint default 0,
  -- Meta fields
  created_by uuid references auth.users not null default auth.id,
  updated_by uuid references auth.users not null,
  status user_status default 'active',
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  -- Soft delete fields
  is_deleted boolean default false,
  deleted_at timestamp with time zone,
  deleted_by uuid references auth.users,
  -- Constraints
  constraint valid_slug check (slug ~* '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$'),
  constraint valid_name check (char_length(name) between 2 and 255)
);
-- ===================================================================================================
-- ORGANIZATION MEMBERS
-- Represents the relationship between users and organizations
-- ===================================================================================================
CREATE TABLE organization_members (
    -- Identity
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid REFERENCES organizations NOT NULL,
    user_id uuid REFERENCES auth.users NOT NULL,
    -- Access control
    role user_role_type NOT NULL DEFAULT 'member',
    -- Status and activity 
    status user_status DEFAULT 'active',
    last_active_at timestamp with time zone,
    -- Permissions and metadata
    permissions jsonb DEFAULT '{}'::jsonb,
    -- Timestamps
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    -- Soft delete fields
    is_deleted boolean DEFAULT false,
    deleted_at timestamp with time zone,
    deleted_by uuid REFERENCES auth.users,
    -- Constraints
    UNIQUE (organization_id, user_id)
);

create or replace function enforce_personal_org_member_limit() 
returns trigger as $$
begin
    if (
        select o.type = 'personal'
        from organizations o
        where o.id = NEW.organization_id
    ) then
        if (
            select count(*) > 0
            from organization_members om 
            where om.organization_id = NEW.organization_id
            and om.status = 'active'
            and om.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
        ) then
            raise exception 'Personal organizations can only have one member';
        end if;
    end if;
    return new;
end;
$$ language plpgsql;

create trigger tr_check_personal_org_member_limit
    before insert or update on organization_members
    for each row 
    execute function enforce_personal_org_member_limit();
-- ===================================================================================================
-- ORGANIZATION INVITATIONS
-- Manages invitations to organizations
-- ===================================================================================================
create table organization_invitations (
  -- Identity
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations not null,
  email text not null,
  -- Invitation details
  role user_role not null default 'member',
  token uuid not null default uuid_generate_v4(),
  status invitation_status not null default 'pending',
  -- Meta
  created_by uuid references auth.users not null default auth.id,
  updated_by uuid references auth.users not null default auth.id,
  expires_at timestamp with time zone not null default (now() + interval '7 days'),
  metadata jsonb default '{}'::jsonb,
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  -- Soft delete fields
  is_deleted boolean default false,
  deleted_at timestamp with time zone,
  deleted_by uuid references auth.users,
  -- Constraints
  constraint valid_email check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

