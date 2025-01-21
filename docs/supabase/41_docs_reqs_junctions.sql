-- Trace Links table to track relationships between entities
create table trace_links (
    id uuid primary key default uuid_generate_v4(),
    source_id uuid not null, -- Can be either document_id or requirement_id
    target_id uuid not null, -- Can be either document_id or requirement_id
    source_type entity_type not null,
    target_type entity_type not null,
    link_type trace_link_type not null,
    
    -- Metadata
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    created_by uuid references auth.users on delete set null,
    updated_by uuid references auth.users on delete set null,
    
    version bigint not null default 1,
    
    -- Soft delete
    is_deleted boolean default false,
    deleted_at timestamp with time zone,
    deleted_by uuid references auth.users on delete set null,
    
    -- Ensure we don't create duplicate links
    constraint unique_trace_link unique (source_id, target_id, link_type) where is_deleted = false
);

-- Index for better query performance
create index idx_trace_links_source on trace_links (source_id, source_type) where not is_deleted;
create index idx_trace_links_target on trace_links (target_id, target_type) where not is_deleted;

-- Assignments table to track assignments and reviews
create table assignments (
    id uuid primary key default uuid_generate_v4(),
    entity_id uuid not null, -- Can be document_id or requirement_id
    entity_type entity_type not null,
    assignee_id uuid references auth.users not null,
    role assignment_role not null,
    status requirement_status not null,
    
    -- Review/Approval metadata
    comment text,
    due_date timestamp with time zone,
    completed_at timestamp with time zone,
    
    -- Standard metadata
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    created_by uuid references auth.users on delete set null,
    updated_by uuid references auth.users on delete set null,
    
    version bigint not null default 1,
    
    -- Soft delete
    is_deleted boolean default false,
    deleted_at timestamp with time zone,
    deleted_by uuid references auth.users on delete set null,
    
    -- Ensure no duplicate assignments
    constraint unique_assignment unique (entity_id, assignee_id, role) where is_deleted = false
);

-- Index for better query performance
create index idx_assignments_entity on assignments (entity_id, entity_type) where not is_deleted;
create index idx_assignments_assignee on assignments (assignee_id) where not is_deleted;
create index idx_assignments_status on assignments (status) where not is_deleted;

-- Function to validate trace link cycles
create or replace function validate_trace_link_insert_update()
returns trigger as $$
begin
    -- Prevent self-referential links
    if NEW.source_id = NEW.target_id then
        raise exception 'Self-referential links are not allowed';
    end if;

    -- Prevent cyclic relationships for parent/child relationships
    if NEW.link_type in ('parent_of', 'child_of') then
        if exists (
            with recursive cycle_check as (
                -- Base case
                select 
                    target_id as id,
                    array[NEW.source_id, NEW.target_id] as path
                from 
                    trace_links
                where 
                    source_id = NEW.target_id
                    and link_type in ('parent_of', 'child_of')
                    and not is_deleted
                
                union all
                
                -- Recursive case
                select 
                    tl.target_id,
                    cc.path || tl.target_id
                from 
                    trace_links tl
                    join cycle_check cc on cc.id = tl.source_id
                where 
                    tl.link_type in ('parent_of', 'child_of')
                    and not tl.is_deleted
                    and not tl.target_id = any(cc.path)
            )
            select 1 from cycle_check where id = NEW.source_id
        ) then
            raise exception 'Cyclic relationship detected';
        end if;
    end if;

    handle_entity_update();

    return NEW;
end;
$$ language plpgsql;

-- Trigger for trace link validation
create trigger tr_validate_trace_link_insert_update
before insert or update on trace_links
for each row
execute function validate_trace_link();

-- RLS Policies

-- Trace Links
create policy "Users can view trace links they have access to" on trace_links
    for select using (
        exists (
            select 1 from project_members pm
            join documents d on d.project_id = pm.project_id
            where (
                (trace_links.source_type = 'document' and trace_links.source_id = d.id) or
                (trace_links.target_type = 'document' and trace_links.target_id = d.id) or
                exists (
                    select 1 from requirements r
                    where ((trace_links.source_type = 'requirement' and trace_links.source_id = r.id) or
                          (trace_links.target_type = 'requirement' and trace_links.target_id = r.id))
                    and r.document_id = d.id
                )
            )
            and pm.user_id = auth.uid()
            and pm.status = 'active'
        )
    );

-- Assignments
create policy "Users can view assignments they have access to" on assignments
    for select using (
        assignee_id = auth.uid() or
        exists (
            select 1 from project_members pm
            join documents d on d.project_id = pm.project_id
            where (
                (assignments.entity_type = 'document' and assignments.entity_id = d.id) or
                (assignments.entity_type = 'requirement' and
                 exists (
                     select 1 from requirements r
                     where assignments.entity_id = r.id
                     and r.document_id = d.id
                 ))
            )
            and pm.user_id = auth.uid()
            and pm.status = 'active'
        )
    );

-- Enable RLS
alter table trace_links enable row level security;
alter table assignments enable row level security;