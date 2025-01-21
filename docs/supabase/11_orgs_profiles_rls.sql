-- ===================================================================================================
-- Enable RLS
-- ===================================================================================================
alter table profiles enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table organization_invitations enable row level security;

-- ===================================================================================================
-- RLS POLICIES
-- ===================================================================================================
-- Profiles
-- ===================================================================================================

create policy "Can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Can update own profile" on profiles
  for update using (auth.uid() = id);


-- ===================================================================================================
-- Organizations
-- ===================================================================================================
create policy "Can view organizations they belong to" on organizations
  for select using (
    exists (
      select 1 from organization_members
      where organization_id = id
      and user_id = auth.uid()
      and status = 'active'
    )
  );

create policy "Can update organizations they own or admin" on organizations
  for update using (
    exists (
      select 1 from organization_members
      where organization_id = id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
      and status = 'active'
    )
  );

-- Organization Members
create policy "Can view members of their organizations" on organization_members
  for select using (
    exists (
      select 1 from organization_members member
      where member.organization_id = organization_id
      and member.user_id = auth.uid()
      and member.status = 'active'
    )
  );

create policy "Owners and admins can manage members" on organization_members
  for all using (
    exists (
      select 1 from organization_members member
      where member.organization_id = organization_id
      and member.user_id = auth.uid()
      and member.role in ('owner', 'admin')
      and member.status = 'active'
    )
  );

-- Organization Invitations
create policy "Can view invitations for their organizations" on organization_invitations
  for select using (
    exists (
      select 1 from organization_members member
      where member.organization_id = organization_id
      and member.user_id = auth.uid()
      and member.status = 'active'
    )
  );

create policy "Owners and admins can manage invitations" on organization_invitations
  for all using (
    exists (
      select 1 from organization_members member
      where member.organization_id = organization_id
      and member.user_id = auth.uid()
      and member.role in ('owner', 'admin')
      and member.status = 'active'
    )
  );
