
-- DOCUMENTS TABLE
create table documents (
  -- Identity
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects not null,
  name text not null,
  description text,
  slug text not null,
  tags text[] default '{}',
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid references auth.users on delete set null,
  updated_by uuid references auth.users on delete set null,

  version bigint not null default 1,

  -- Soft delete fields
  is_deleted boolean default false,
  deleted_at timestamp with time zone,
  deleted_by uuid references auth.users on delete set null,
  
  -- Constraints
  constraint valid_document_name check (char_length(trim(name)) between 2 and 255)
);

-- Indexes for documents
create index idx_documents_project on documents (project_id);
create index idx_documents_created_by on documents (created_by);
create index idx_documents_is_deleted on documents (is_deleted) where is_deleted = false;

create trigger tr_update_documents
after insert or update or delete on documents
for each row execute function handle_entity_update();



-- DOCUMENT_PROPERTY_SCHEMAS TABLE
create table document_property_schemas (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references documents not null,
  name text not null,
  data_type property_type not null default 'string',

  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid references auth.users on delete set null,
  updated_by uuid references auth.users on delete set null,
  
  version bigint not null default 1,

  is_deleted boolean default false,
  deleted_at timestamp with time zone,
  deleted_by uuid references auth.users on delete set null,

  constraint valid_property_name check (char_length(trim(name)) between 2 and 255),
  unique(document_id, name) where is_deleted = false
);

-- Indexes for document_property_schemas
create index idx_doc_prop_schemas_document on document_property_schemas (document_id);

-- BLOCKS TABLE
create table blocks (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references documents not null,
  type text not null,
  position integer not null,
  
  content jsonb default '{}'::jsonb,
  
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid references auth.users on delete set null,
  updated_by uuid references auth.users on delete set null,
  
  version bigint not null default 1,

  is_deleted boolean default false,
  deleted_at timestamp with time zone,
  deleted_by uuid references auth.users on delete set null,
  
  constraint valid_block_type check (type in ('text', 'image', 'table')),
  constraint valid_position check (position >= 0)
);

-- Indexes for blocks
create index idx_blocks_document on blocks (document_id);
create index idx_blocks_position on blocks (position);
create index idx_blocks_content on blocks using gin (content);

-- BLOCK_PROPERTY_SCHEMAS TABLE
create table block_property_schemas (
  id uuid primary key default uuid_generate_v4(),
  block_id uuid references blocks on delete cascade not null,
  name text not null,
  data_type text not null,
  
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid references auth.users on delete set null,
  updated_by uuid references auth.users on delete set null,
  
  version bigint not null default 1,

  is_deleted boolean default false,
  deleted_at timestamp with time zone,
  deleted_by uuid references auth.users on delete set null,
  
  constraint valid_property_name check (char_length(trim(name)) between 2 and 255),
  unique(block_id, name) where is_deleted = false
);

-- Indexes for block_property_schemas
create index idx_block_prop_schemas_block on block_property_schemas (block_id);

-- REQUIREMENTS TABLE
create table requirements (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references documents not null,
  block_id uuid references blocks not null,
  external_id text,
  name text not null,
  description text,

  status requirement_status not null default 'active',
  format requirement_format not null default 'incose',
  priority requirement_priority not null default 'low',
  level requirement_level not null default 'component',
  tags text[] default '{}',

  original_requirement text,
  enchanced_requirement text,

  ai_analysis jsonb default '{}'::jsonb,
  
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid references auth.users on delete set null,
  updated_by uuid references auth.users on delete set null,
  
  version bigint not null default 1,

  is_deleted boolean default false,
  deleted_at timestamp with time zone,
  deleted_by uuid references auth.users on delete set null,
  
  constraint valid_requirement_name check (char_length(trim(name)) between 2 and 255),
  unique(document_id, block_id) where is_deleted = false
);

-- Indexes for requirements
create index idx_requirements_document on requirements (document_id);
create index idx_requirements_block on requirements (block_id);

-- PROPERTY_KV TABLE
create table requirement_property_kv (
  id uuid primary key default uuid_generate_v4(),
  block_id uuid references blocks not null,
  requirement_id uuid references requirements not null,
  property_name text not null,
  property_value text not null,
  position integer not null,

  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid references auth.users on delete set null,
  updated_by uuid references auth.users on delete set null,
  
  version bigint not null default 1,

  is_deleted boolean default false,
  deleted_at timestamp with time zone,
  deleted_by uuid references auth.users on delete set null,
  
  constraint valid_position check (position >= 0),
  unique(block_id, requirement_id, property_name) where is_deleted = false
);

-- Indexes for property_kv
create index idx_property_kv_block on requirement_property_kv (block_id);
create index idx_property_kv_requirement on requirement_property_kv (requirement_id);
create index idx_property_kv_position on requirement_property_kv (position);

create trigger tr_update_documents
after insert or update or delete on documents
for each row execute function handle_entity_update();

create trigger tr_update_document_property_schemas
after insert or update or delete on document_property_schemas
for each row execute function handle_entity_update();

create trigger tr_update_blocks
after insert or update or delete on blocks
for each row execute function handle_entity_update();

create trigger tr_update_block_property_schemas
after insert or update or delete on block_property_schemas
for each row execute function handle_entity_update();

create trigger tr_update_requirements
after insert or update or delete on requirements
for each row execute function handle_entity_update();

create trigger tr_update_requirement_property_kv
after insert or update or delete on requirement_property_kv
for each row execute function handle_entity_update();

-- Function for handling optimistic locking
create or replace function check_version_and_update() returns trigger as $$
begin
  if NEW.version <= OLD.version then
    raise exception 'Concurrent update detected';
  end if;
  handle_entity_update();
  return NEW;
end;
$$ language plpgsql;

-- Optimistic locking triggers
create trigger tr_check_document_version
before update on documents
for each row execute function check_version_and_update();

create trigger tr_check_doc_prop_schema_version
before update on document_property_schemas
for each row execute function check_version_and_update();

create trigger tr_check_block_version
before update on blocks
for each row execute function check_version_and_update();

create trigger tr_check_block_prop_schema_version
before update on block_property_schemas
for each row execute function check_version_and_update();

create trigger tr_check_requirement_version
before update on requirements
for each row execute function check_version_and_update();

create trigger tr_check_requirement_property_kv_version
before update on requirement_property_kv
for each row execute function check_version_and_update();

-- Updated RLS policies with better performance
create policy "Can view documents they have access to" on documents
  for select using (
    exists (
      select 1 from project_members
      where project_id = documents.project_id
      and user_id = auth.uid()
      and status = 'active'
    )
  );

create policy "Can modify documents they have access to" on documents
  for all using (
    exists (
      select 1 from project_members
      where project_id = documents.project_id
      and user_id = auth.uid()
      and status = 'active'
      and role in ('admin', 'editor')
    )
  );

-- Enable RLS on all tables
alter table documents enable row level security;
alter table document_property_schemas enable row level security;
alter table blocks enable row level security;
alter table block_property_schemas enable row level security;
alter table requirements enable row level security;
alter table requirement_property_kv enable row level security;

-- Create materialized view for common document queries
create materialized view document_summary as
select 
  d.id as document_id,
  d.name as document_name,
  d.project_id,
  count(distinct b.id) as block_count,
  count(distinct r.id) as requirement_count,
  d.updated_at
from documents d
left join blocks b on b.document_id = d.id and not b.is_deleted
left join requirements r on r.document_id = d.id and not r.is_deleted
where not d.is_deleted
group by d.id, d.name, d.project_id, d.updated_at;

-- Create index on materialized view
create index idx_doc_summary_project on document_summary (project_id);

-- Function to refresh materialized view
create or replace function refresh_document_summary()
returns trigger as $$
begin
  refresh materialized view concurrently document_summary;
  return null;
end;
$$ language plpgsql;

-- Trigger to refresh materialized view
create trigger refresh_doc_summary
after insert or update or delete
on documents
for each statement
execute function refresh_document_summary();

-- Function to handle cascading soft deletes
create or replace function handle_soft_delete() returns trigger as $$
begin
  if NEW.is_deleted = true and OLD.is_deleted = false then
    -- Set deleted_at and deleted_by if they're not set
    NEW.deleted_at = COALESCE(NEW.deleted_at, now());
    NEW.deleted_by = COALESCE(NEW.deleted_by, auth.uid());
    
    -- Documents cascade to blocks, document_property_schemas, and requirements
    if TG_TABLE_NAME = 'documents' then
      update blocks 
      set is_deleted = true, deleted_at = NEW.deleted_at, deleted_by = NEW.deleted_by
      where document_id = NEW.id and is_deleted = false;
      
      update document_property_schemas 
      set is_deleted = true, deleted_at = NEW.deleted_at, deleted_by = NEW.deleted_by
      where document_id = NEW.id and is_deleted = false;
      
      update requirements 
      set is_deleted = true, deleted_at = NEW.deleted_at, deleted_by = NEW.deleted_by
      where document_id = NEW.id and is_deleted = false;
    
    -- Blocks cascade to block_property_schemas and property_kv
    elsif TG_TABLE_NAME = 'blocks' then
      update block_property_schemas 
      set is_deleted = true, deleted_at = NEW.deleted_at, deleted_by = NEW.deleted_by
      where block_id = NEW.id and is_deleted = false;
      
      update property_kv 
      set is_deleted = true, deleted_at = NEW.deleted_at, deleted_by = NEW.deleted_by
      where block_id = NEW.id and is_deleted = false;
    
    -- Requirements cascade to property_kv
    elsif TG_TABLE_NAME = 'requirements' then
      update property_kv 
      set is_deleted = true, deleted_at = NEW.deleted_at, deleted_by = NEW.deleted_by
      where requirement_id = NEW.id and is_deleted = false;
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql;

-- Add soft delete triggers to tables
create trigger tr_soft_delete_documents
before update on documents
for each row
when (NEW.is_deleted is distinct from OLD.is_deleted)
execute function handle_soft_delete();

create trigger tr_soft_delete_blocks
before update on blocks
for each row
when (NEW.is_deleted is distinct from OLD.is_deleted)
execute function handle_soft_delete();

create trigger tr_soft_delete_requirements
before update on requirements
for each row
when (NEW.is_deleted is distinct from OLD.is_deleted)
execute function handle_soft_delete();