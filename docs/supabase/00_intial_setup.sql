-- ===================================================================================================
-- Enable necessary extensions
-- ===================================================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";
create extension if not exists "btree_gin";
-- ===================================================================================================
-- Type Enums
-- ===================================================================================================
create type user_status as enum ('active', 'inactive');
create type user_role_type as enum ('member', 'admin', 'owner', 'super_admin');
create type organization_type as enum ('personal', 'team');
create type pricing_plan_interval as enum ('none', 'month', 'year');
create type billing_plan as enum ('free', 'pro', 'enterprise');
create type invitation_status as enum ('pending', 'accepted', 'rejected', 'revoked');
create type notification_type as enum ('invitation', 'mention', 'system');
create type visibility as enum ('private', 'team', 'organization', 'public');
create type project_status as enum ('active', 'archived', 'draft', 'deleted');
create type property_type as enum ('string', 'number', 'boolean', 'date', 'url','array', 'enum', 'entity_reference');
create type project_role as enum ('owner', 'admin', 'maintainer', 'editor', 'viewer');
create type requirement_status as enum ('active', 'archived', 'draft', 'deleted', 'pending', 'in_progress', 'approved', 'rejected');
create type requirement_format as enum ('incose', 'ears', 'other');
create type requirement_priority as enum ('low', 'medium', 'high');
create type assignment_role as enum ('assignee', 'reviewer', 'approver');
create type trace_link_type as enum ('derives_from', 'implements', 'relates_to', 'conflicts_with', 'is_related_to', 'parent_of', 'child_of');
create type requirement_level as enum ('component', 'system', 'subsystem');
create type entity_type as enum ('document', 'requirement');
-- ===================================================================================================
-- Create base tables
-- ===================================================================================================

-- User roles table
create table user_roles (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users not null,
    role user_role_type not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id)
);

-- ===================================================================================================
-- AUDIT LOG
-- Track important changes across the system
-- ===================================================================================================
create table audit_logs (
    id uuid primary key default uuid_generate_v4(),
    entity_id uuid not null,
    entity_type text not null,
    action text not null,
    actor_id uuid references auth.users not null,
    old_data jsonb,
    new_data jsonb,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ===================================================================================================
-- Row Level Security Policies
-- ===================================================================================================

-- Enable RLS on tables
alter table audit_logs enable row level security;
alter table user_roles enable row level security;

-- Audit logs policies
create policy "Super admins can view audit logs" on audit_logs
    for select using (
        auth.uid() in (
            select user_id from user_roles where role = 'super_admin'::user_role_type
        )
    );

-- User roles policies
create policy "Users can view their own roles" on user_roles
    for select using (auth.uid() = user_id);

create policy "Only super admins can create user roles" on user_roles
    for insert with check (
        auth.uid() in (
            select user_id from user_roles where role = 'super_admin'::user_role_type
        )
    );

create policy "Only super admins can update user roles" on user_roles
    for update using (
        auth.uid() in (
            select user_id from user_roles where role = 'super_admin'::user_role_type
        )
    );
