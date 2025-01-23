-- ===================================================================================================
-- HELPER: generate_slug(name)
-- Generates a URL-safe slug from organization name
-- ===================================================================================================
create or replace function generate_slug(name text)
returns text
language plpgsql
as $$
declare
  base_slug text;
  temp_slug text;
  counter integer := 1;
begin
  -- Convert to lowercase, replace spaces and special chars with hyphens
  base_slug := lower(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Ensure slug meets length requirements
  if length(base_slug) < 2 then
    base_slug := base_slug || '-org';
  elsif length(base_slug) > 63 then
    base_slug := substring(base_slug, 1, 63);
  end if;
  
  -- Ensure uniqueness
  temp_slug := base_slug;
  while exists (select 1 from organizations where slug = temp_slug) loop
    temp_slug := base_slug || '-' || counter;
    counter := counter + 1;
  end loop;
  
  return temp_slug;
end;
$$;

-- ===================================================================================================
-- Function
-- ===================================================================================================
create or replace function handle_entity_update()
returns trigger
language plpgsql
as $$
begin
    if NEW.version <= OLD.version then
        raise exception 'Concurrent update detected';
    end if;
    new.updated_at = timezone('utc'::text, now());
    new.updated_by = auth.uid();
    new.version = old.version + 1;
    -- Handle soft delete
    if (new.is_deleted = true and old.is_deleted = false) then
        new.deleted_at = timezone('utc'::text, now());
        new.deleted_by = auth.uid();
    elsif (new.is_deleted = false and old.is_deleted = true) then
        new.deleted_at = null;
        new.deleted_by = null;
    end if;
    return new;
end;
$$;




-- ===================================================================================================
-- ORGANIZATIONS TABLE (no version)
-- ===================================================================================================
create or replace function handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc'::text, now());

    -- Handle soft delete
    if (new.is_deleted = true and old.is_deleted = false) then
        new.deleted_at = timezone('utc'::text, now());
        new.deleted_by = auth.uid();
    elsif (new.is_deleted = false and old.is_deleted = true) then
        new.deleted_at = null;
        new.deleted_by = null;
    end if;
    return new;
end;
$$;

create or replace function handle_updated_by()
returns trigger
language plpgsql
as $$
begin
    -- Update timestamps and user
    new.updated_at = timezone('utc'::text, now());
    new.updated_by = auth.uid();
    
    -- Handle soft delete
    if (new.is_deleted = true and old.is_deleted = false) then
        new.deleted_at = timezone('utc'::text, now());
        new.deleted_by = auth.uid();
    elsif (new.is_deleted = false and old.is_deleted = true) then
        new.deleted_at = null;
        new.deleted_by = null;
    end if;
    
    return new;
end;
$$;

-- ===================================================================================================
-- AUDIT LOGGING (remains centralized as it's consistent across tables)
-- ===================================================================================================
create or replace function handle_audit_log()
returns trigger
language plpgsql
as $$
declare
  old_data jsonb;
  new_data jsonb;
  changed_fields jsonb;
  actor_id uuid;
begin
  -- Determine the actor_id
  actor_id := coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000');

  -- Prepare the data based on operation type
  if (TG_OP = 'DELETE') then
    old_data = row_to_json(old)::jsonb;
    new_data = null;
  elsif (TG_OP = 'UPDATE') then
    old_data = row_to_json(old)::jsonb;
    new_data = row_to_json(new)::jsonb;
  elsif (TG_OP = 'INSERT') then
    old_data = null;
    new_data = row_to_json(new)::jsonb;
  end if;

  -- Insert audit log
  insert into audit_logs (
    entity_id,
    entity_type,
    action,
    actor_id,
    old_data,
    new_data
  )
  values (
    coalesce(new.id, old.id),
    TG_TABLE_NAME,
    TG_OP,
    actor_id,  -- Use the determined actor_id
    old_data,
    new_data
  );

  return coalesce(new, old);
end;
$$;