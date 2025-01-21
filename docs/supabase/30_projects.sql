-- ===================================================================================================
-- PROJECTS
-- Core table for organization projects
-- ===================================================================================================
create table projects (
  -- Identity
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations not null,
  name text not null,
  slug text not null,
  description text,
  
  -- Access control
  visibility visibility not null default 'organization',
  status project_status not null default 'active',
  
  -- Configuration
  settings jsonb default '{
    "default_branch": "main",
    "allow_issues": true
  }'::jsonb,
  
  -- Statistics and metadata
  star_count integer default 0,
  tags text[] default '{}',
  metadata jsonb default '{}'::jsonb,
  
  -- Ownership
  created_by uuid references auth.users not null,
  updated_by uuid references auth.users not null,
  owned_by uuid references auth.users not null,

  version integer default 1,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),

  -- Soft delete fields
  is_deleted boolean default false,
  deleted_at timestamp with time zone,
  deleted_by uuid references auth.users,

  -- Constraints
  constraint valid_project_slug check (slug ~* '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$'),
  constraint valid_project_name check (char_length(name) between 2 and 255),
  unique(organization_id, slug)
);

-- Enable RLS
alter table projects enable row level security;

-- ===================================================================================================
-- PROJECT_MEMBERS
-- Manages user access and roles within projects
-- ===================================================================================================
create table project_members (
  -- Identity
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects not null,
  user_id uuid references auth.users not null,
  
  -- Access control
  role project_role not null default 'viewer',
  status user_status default 'active',
  
  -- Custom permissions
  permissions jsonb default '{}'::jsonb,
  
  -- Stats
  last_accessed_at timestamp with time zone,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),

  -- Soft delete fields
  is_deleted boolean default false,
  deleted_at timestamp with time zone,
  deleted_by uuid references auth.users,
  
  -- Constraints
  unique(project_id, user_id)
);

-- Enable RLS
alter table project_members enable row level security;

-- ===================================================================================================
-- PROJECT_INVITATIONS
-- Manages invitations to projects
-- ===================================================================================================
create table project_invitations (
  -- Identity
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects not null,
  email text not null,
  
  -- Invitation details
  role project_role not null default 'contributor',
  token uuid not null default uuid_generate_v4(),
  status invitation_status not null default 'pending',
  
  -- Meta
  invited_by uuid references auth.users not null,
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

-- Enable RLS
alter table project_invitations enable row level security;

-- ===================================================================================================
-- RLS POLICIES
-- ===================================================================================================

-- Projects
create policy "Can view projects they have access to" on projects
  for select using (
    exists (
      select 1 from project_members
      where project_id = id
      and user_id = auth.uid()
      and status = 'active'
    ) or (
      visibility = 'public'
    ) or (
      visibility = 'organization' and
      exists (
        select 1 from organization_members
        where organization_id = projects.organization_id
        and user_id = auth.uid()
        and status = 'active'
      )
    )
  );

create policy "Can update projects they own or admin" on projects
  for update using (
    exists (
      select 1 from project_members
      where project_id = id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
      and status = 'active'
    )
  );

-- Project Members
create policy "Can view project members if they have access" on project_members
  for select using (
    exists (
      select 1 from project_members member
      where member.project_id = project_id
      and member.user_id = auth.uid()
      and member.status = 'active'
    )
  );

create policy "Project owners and admins can manage members" on project_members
  for all using (
    exists (
      select 1 from project_members member
      where member.project_id = project_id
      and member.user_id = auth.uid()
      and member.role in ('owner', 'admin')
      and member.status = 'active'
    )
  );

-- ===================================================================================================
-- HELPER FUNCTIONS
-- ===================================================================================================

-- Function to check if a user has access to a project
create or replace function has_project_access(
  project_id uuid,
  user_id uuid,
  required_role project_role default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  project_record projects%rowtype;
  member_role project_role;
begin
  -- Get project details
  select * into project_record from projects where id = project_id;
  
  -- Check if project exists
  if project_record is null then
    return false;
  end if;
  
  -- Check public access
  if project_record.visibility = 'public' and required_role is null then
    return true;
  end if;
  
  -- Get user's role in project
  select role into member_role
  from project_members
  where project_id = project_id
  and user_id = user_id
  and status = 'active';
  
  -- If no specific role required, any membership is sufficient
  if required_role is null then
    return member_role is not null;
  end if;
  
  -- Check if user's role meets the required level
  return case member_role
    when 'owner' then true
    when 'admin' then required_role != 'owner'
    when 'maintainer' then required_role in ('maintainer', 'contributor', 'viewer')
    when 'contributor' then required_role in ('contributor', 'viewer')
    when 'viewer' then required_role = 'viewer'
    else false
  end;
end;
$$;

-- ===================================================================================================
-- TRIGGERS
-- ===================================================================================================

-- Projects
create trigger tr_update_projects
after insert or update or delete on projects
for each row execute function handle_entity_update();

-- Project Members
create trigger tr_update_project_members
after insert or update or delete on project_members
for each row execute function handle_updated_by();

-- Project Invitations
create trigger tr_update_project_invitations
after insert or update or delete on project_invitations
for each row execute function handle_updated_by();




