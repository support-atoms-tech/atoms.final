
// lib/supabase/server-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/supabaseServer';
import { v4 as uuidv4 } from 'uuid';

// Helper to get supabase client for server actions
function getServerActionClient() {
  return createClient();
}

// Create a new document with initial blocks
export async function createDocumentWithBlocks(data: {
  name: string;
  description?: string;
  project_id: string;
  blocks?: { type: string; content?: any }[];
}) {
  const supabase = await getServerActionClient();
  
  // Get user for tracking creation
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Start a transaction
  const { data: document, error } = await supabase
    .from('documents')
    .insert({
      name: data.name,
      description: data.description || null,
      project_id: data.project_id,
      slug: data.name.toLowerCase().replace(/\s+/g, '-'),
      created_by: user.id,
      updated_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (error) {
    throw error;
  }
  
  // Create blocks if provided
  if (data.blocks && data.blocks.length > 0) {
    const blocksToInsert = data.blocks.map((block, index) => ({
      document_id: document.id,
      type: block.type,
      position: index,
      content: block.content || {},
      created_by: user.id,
      updated_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { error: blocksError } = await supabase
      .from('blocks')
      .insert(blocksToInsert);
      
    if (blocksError) {
      throw blocksError;
    }
  }
  
  // Create default properties for new document
  await createDefaultProperties(document.id, user.id);
  
  // Revalidate paths
  revalidatePath(`/dashboard/*/projects/${data.project_id}`);
  revalidatePath(`/dashboard/*/projects/${data.project_id}/${document.id}`);
  
  return document;
}

// Create default properties for a document
async function createDefaultProperties(documentId: string, userId: string) {
  const supabase = await getServerActionClient();
  
  // Get document to get org_id
  const { data: document, error } = await supabase
    .from('documents')
    .select('project_id')
    .eq('id', documentId)
    .single();
    
  if (error) {
    throw error;
  }
  
  // Get project to get org_id
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('organization_id')
    .eq('id', document.project_id)
    .single();
    
  if (projectError) {
    throw projectError;
  }
  
  // Default properties
  const defaultProperties = [
    {
      name: 'Status',
      property_type: 'select',
      org_id: project.organization_id,
      document_id: documentId,
      is_base: true,
      options: {
        values: ['Todo', 'In Progress', 'Review', 'Done']
      },
      created_by: userId,
      updated_by: userId
    },
    {
      name: 'Priority',
      property_type: 'select',
      org_id: project.organization_id,
      document_id: documentId,
      is_base: true,
      options: {
        values: ['Low', 'Medium', 'High', 'Critical']
      },
      created_by: userId,
      updated_by: userId
    },
    {
      name: 'Assignee',
      property_type: 'user',
      org_id: project.organization_id,
      document_id: documentId,
      is_base: true,
      options: {},
      created_by: userId,
      updated_by: userId
    },
    {
      name: 'Due Date',
      property_type: 'date',
      org_id: project.organization_id,
      document_id: documentId,
      is_base: true,
      options: {},
      created_by: userId,
      updated_by: userId
    }
  ];
  
  // Insert default properties
  const { error: propertiesError } = await supabase
    .from('properties')
    .insert(defaultProperties);
    
  if (propertiesError) {
    throw propertiesError;
  }
}

// Create a new table block with default columns
export async function createTableBlockWithColumns(data: {
  document_id: string;
  position: number;
  title?: string;
}) {
  const supabase = await getServerActionClient();
  
  // Get user for tracking creation
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Create the table block
  const { data: block, error } = await supabase
    .from('blocks')
    .insert({
      document_id: data.document_id,
      type: 'table',
      position: data.position,
      content: {
        title: data.title || 'New Table'
      },
      created_by: user.id,
      updated_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (error) {
    throw error;
  }
  
  // Get default properties for this document
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .eq('document_id', data.document_id)
    .eq('is_base', true)
    .order('name');
    
  if (propertiesError) {
    throw propertiesError;
  }
  
  // Create default columns based on properties
  if (properties.length > 0) {
    const columnsToInsert = properties.map((property, index) => ({
      block_id: block.id,
      property_id: property.id,
      position: index,
      width: 150, // Default width
      is_hidden: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { error: columnsError } = await supabase
      .from('columns')
      .insert(columnsToInsert);
      
    if (columnsError) {
      throw columnsError;
    }
  }
  
  // Revalidate path
  revalidatePath(`/dashboard/*/projects/*/documents/${data.document_id}`);
  
  return block;
}

// Reorder blocks in a document
export async function reorderDocumentBlocks(data: {
  document_id: string;
  blocks: { id: string; position: number }[];
}) {
  const supabase = await getServerActionClient();
  
  // Update each block's position
  const updatePromises = data.blocks.map(({ id, position }) => 
    supabase
      .from('blocks')
      .update({ 
        position,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
  );
  
  // Execute all promises
  await Promise.all(updatePromises);
  
  // Revalidate path
  revalidatePath(`/dashboard/*/projects/*/documents/${data.document_id}`);
  
  return { success: true };
}

// Reorder columns in a table
export async function reorderTableColumns(data: {
  block_id: string;
  document_id: string;
  columns: { id: string; position: number }[];
}) {
  const supabase = await getServerActionClient();
  
  // Update each column's position
  const updatePromises = data.columns.map(({ id, position }) => 
    supabase
      .from('columns')
      .update({ 
        position,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
  );
  
  // Execute all promises
  await Promise.all(updatePromises);
  
  // Revalidate path
  revalidatePath(`/dashboard/*/projects/*/documents/${data.document_id}`);
  
  return { success: true };
}

// Bulk update requirements
export async function bulkUpdateRequirements(data: {
  document_id: string;
  requirements: { id: string; properties: Record<string, any> }[];
}) {
  const supabase = await getServerActionClient();
  
  // Update each requirement's properties
  const updatePromises = data.requirements.map(({ id, properties }) => 
    supabase
      .from('requirements')
      .update({ 
        properties,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
  );
  
  // Execute all promises
  await Promise.all(updatePromises);
  
  // Revalidate path
  revalidatePath(`/dashboard/*/projects/*/documents/${data.document_id}`);
  
  return { success: true };
}