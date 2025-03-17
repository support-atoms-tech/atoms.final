// lib/supabase/server-queries.ts
import { createClient } from '@/lib/supabase/supabaseServer';
import { Organization, Project, Document, Block, Column, Requirement, Property } from '@/components/Canvas/types';
import { cache } from 'react';

// Create cached server client
const createServerClient = cache(async () => {
  return await createClient();
});

// Fetch organizations for the current user
export async function getOrganizations() {
  const supabase = await createServerClient();
  
  // Get user for filtering organizations
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Get organizations where user is a member
  const { data: memberships, error: membershipError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_deleted', false);
    
  if (membershipError) {
    throw membershipError;
  }
  
  const orgIds = memberships.map(m => m.organization_id);
  
  if (orgIds.length === 0) {
    return [];
  }
  
  // Get organization details
  const { data: organizations, error } = await supabase
    .from('organizations')
    .select('*')
    .in('id', orgIds)
    .eq('is_deleted', false)
    .order('name');
    
  if (error) {
    throw error;
  }
  
  return organizations as Organization[];
}

// Fetch a single organization
export async function getOrganization(orgId: string) {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .eq('is_deleted', false)
    .single();
    
  if (error) {
    throw error;
  }
  
  return data as Organization;
}

// Fetch projects for an organization
export async function getProjects(orgId: string) {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_deleted', false)
    .order('name');
    
  if (error) {
    throw error;
  }
  
  return data as Project[];
}

// Fetch a single project
export async function getProject(projectId: string) {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('is_deleted', false)
    .single();
    
  if (error) {
    throw error;
  }
  
  return data as Project;
}

// Fetch documents for a project
export async function getDocuments(projectId: string) {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .order('name');
    
  if (error) {
    throw error;
  }
  
  return data as Document[];
}

// Fetch a single document
export async function getDocument(documentId: string) {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('is_deleted', false)
    .single();
    
  if (error) {
    throw error;
  }
  
  return data as Document;
}

// Fetch blocks for a document
export async function getBlocks(documentId: string) {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('blocks')
    .select('*')
    .eq('document_id', documentId)
    .order('position');
    
  if (error) {
    throw error;
  }
  
  return data as Block[];
}

// Fetch a single block
export async function getBlock(blockId: string) {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('blocks')
    .select('*')
    .eq('id', blockId)
    .single();
    
  if (error) {
    throw error;
  }
  
  return data as Block;
}

// Fetch columns for a block with properties joined
export async function getColumns(blockId: string) {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('columns')
    .select(`
      *,
      property:property_id (*)
    `)
    .eq('block_id', blockId)
    .order('position');
    
  if (error) {
    throw error;
  }
  
  return data as Column[];
}

// Fetch requirements for a block
export async function getRequirements(blockId: string) {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('requirements')
    .select('*')
    .eq('block_id', blockId)
    .order('position');
    
  if (error) {
    throw error;
  }
  
  return data as Requirement[];
}

// Fetch properties for an organization or document
export async function getProperties(orgId: string, documentId?: string) {
  const supabase = await createServerClient();
  
  let query = supabase
    .from('properties')
    .select('*')
    .eq('org_id', orgId);
  
  // If documentId is provided, include document-specific properties
  if (documentId) {
    query = query.or(`document_id.eq.${documentId},document_id.is.null`);
  }
  
  const { data, error } = await query.order('name');
    
  if (error) {
    throw error;
  }
  
  return data as Property[];
}

// Get user profile for the current user
export async function getCurrentUser() {
  const supabase = await createServerClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw authError || new Error('User not authenticated');
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (error) {
    throw error;
  }
  
  return data;
}

// Get complete document data (document, blocks, columns, requirements)
export async function getCompleteDocument(orgId: string, documentId: string) {
  const document = await getDocument(documentId);
  const blocks = await getBlocks(documentId);
  
  // Get columns and requirements for each block
  const blocksWithData = await Promise.all(
    blocks.map(async (block) => {
      const columns = await getColumns(block.id);
      const requirements = await getRequirements(block.id);
      
      return {
        ...block,
        columns,
        requirements
      };
    })
  );
  
  // Get properties for the document
  const properties = await getProperties(orgId, documentId);
  
  return {
    document,
    blocks: blocksWithData,
    properties
  };
}
