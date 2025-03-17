// hooks/query/usePropertiesQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Property, PropertyCreateData } from '@/components/Canvas/types';
import { getQueryClient } from '@/lib/constants/queryClient';
import { useCanvasStore } from '@/components/Canvas/lib/store/canvasStore';
import { useMemo } from 'react';

interface UsePropertiesQueryProps {
  orgId: string;
  projectId?: string;
  documentId?: string;
}

// Define property scope type
export type PropertyScope = 'org' | 'project' | 'document';

export function usePropertiesQuery({ orgId, projectId, documentId }: UsePropertiesQueryProps) {
  const queryClient = useQueryClient();
  const { clientId } = useCanvasStore();
  
  // Validate orgId silently without console logs
  const isOrgIdValid = !!orgId;
  
  // Fetch base properties (org-wide, is_base=true)
  const basePropertiesQuery = useQuery({
    queryKey: ['properties', 'base', orgId],
    queryFn: async () => {
      if (!orgId) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('org_id', orgId)
        .eq('scope', 'org')
        .eq('is_base', true)
        .order('name');
      
      if (error) {
        throw error;
      }
      
      // Add scope field to each property
      return (data || []).map(prop => ({
        ...prop,
        scope: prop.scope as PropertyScope
      }));
    },
    enabled: isOrgIdValid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });

  // Fetch project properties if projectId is provided
  const projectPropertiesQuery = useQuery({
    queryKey: ['properties', 'project', orgId, projectId],
    queryFn: async () => {
      if (!orgId || !projectId) return [];
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('org_id', orgId)
        .eq('project_id', projectId)
        .eq('scope', 'project')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      // Add scope field to each property
      return (data || []).map(prop => ({
        ...prop,
        scope: prop.scope as PropertyScope
      }));
    },
    enabled: isOrgIdValid && !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });

  // Fetch document properties if documentId is provided
  const documentPropertiesQuery = useQuery({
    queryKey: ['properties', 'document', orgId, documentId],
    queryFn: async () => {
      if (!orgId || !documentId) return [];
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('org_id', orgId)
        .eq('document_id', documentId)
        .eq('scope', 'document')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      // Add scope field to each property
      return (data || []).map(prop => ({
        ...prop,
        scope: prop.scope as PropertyScope
      }));
    },
    enabled: isOrgIdValid && !!documentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });

  // Combine all properties - memoize to prevent recreation on each render
  const allProperties = useMemo(() => [
    ...(basePropertiesQuery.data || []),
    ...(projectPropertiesQuery.data || []),
    ...(documentPropertiesQuery.data || [])
  ], [basePropertiesQuery.data, projectPropertiesQuery.data, documentPropertiesQuery.data]);
  
  // Create new property
  const createProperty = useMutation({
    mutationFn: async (newProperty: Partial<Property> & { scope?: PropertyScope }) => {
      // Extract scope from the input if provided
      const { scope, ...propertyData } = newProperty;
      
      // Determine the correct scope values based on the scope field
      let propertyWithScope: Partial<Property> = { ...propertyData };
      
      if (scope === 'org') {
        propertyWithScope.is_base = false;
      } else if (scope === 'project') {
        propertyWithScope.is_base = false;
        propertyWithScope.project_id = projectId;
      } else if (scope === 'document') {
        propertyWithScope.is_base = false;
        propertyWithScope.document_id = documentId;
      }
      
      const { data, error } = await supabase
        .from('properties')
        .insert([propertyWithScope])
        .select()
        .single();
      
      if (error) throw error;
      
      // Add scope to the returned property
      return {
        ...data,
        scope: scope || (data.is_base ? 'org' : data.project_id ? 'project' : 'document')
      };
    },
    onSuccess: (newProperty) => {
      // Invalidate relevant queries based on scope
      if (newProperty.scope === 'org') {
        queryClient.invalidateQueries({ queryKey: ['properties', 'base', orgId] });
      } else if (newProperty.scope === 'project') {
        queryClient.invalidateQueries({ 
          queryKey: ['properties', 'project', orgId, newProperty.project_id] 
        });
      } else if (newProperty.scope === 'document') {
        queryClient.invalidateQueries({ 
          queryKey: ['properties', 'document', orgId, newProperty.document_id] 
        });
      }
    }
  });
  
  // Update property mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Property> & { id: string, scope?: PropertyScope }) => {
      const { id, scope, ...rest } = updates;
      
      // Determine the correct scope values based on the scope field
      let updatesWithScope: any = { ...rest };
      
      if (scope === 'org') {
        updatesWithScope.is_base = true;
        updatesWithScope.project_id = null;
        updatesWithScope.document_id = null;
      } else if (scope === 'project') {
        updatesWithScope.is_base = false;
        updatesWithScope.project_id = projectId || null;
        updatesWithScope.document_id = null;
      } else if (scope === 'document') {
        updatesWithScope.is_base = false;
        updatesWithScope.project_id = null;
        updatesWithScope.document_id = documentId || null;
      }
      
      const { data, error } = await supabase
        .from('properties')
        .update({
          ...updatesWithScope,
          updated_at: new Date().toISOString(),
          client_id: clientId // For real-time identification
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Add scope to the returned property
      return {
        ...data,
        scope: scope || (data.is_base ? 'org' : data.project_id ? 'project' : 'document')
      };
    },
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['properties', orgId, documentId] });
      
      // Snapshot the previous value
      const previousProperties = queryClient.getQueryData<Property[]>(['properties', orgId, documentId]);
      
      // Optimistically update the cache
      queryClient.setQueryData(['properties', orgId, documentId], (old: Property[] = []) => {
        return old.map(prop => 
          prop.id === updates.id ? { ...prop, ...updates } : prop
        );
      });
      
      return { previousProperties };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProperties) {
        queryClient.setQueryData(['properties', orgId, documentId], context.previousProperties);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['properties', orgId, documentId] });
    }
  });
  
  // Delete property mutation
  const deleteMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const { data, error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)
        .single();
        
      if (error) throw error;
      return { id: propertyId };
    },
    onMutate: async (propertyId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['properties', orgId, documentId] });
      
      // Snapshot the previous value
      const previousProperties = queryClient.getQueryData<Property[]>(['properties', orgId, documentId]);
      
      // Optimistically update the cache
      queryClient.setQueryData(['properties', orgId, documentId], (old: Property[] = []) => {
        return old.filter(prop => prop.id !== propertyId);
      });
      
      return { previousProperties };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProperties) {
        queryClient.setQueryData(['properties', orgId, documentId], context.previousProperties);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['properties', orgId, documentId] });
      
      // Also invalidate columns, since they reference properties
      queryClient.invalidateQueries({ queryKey: ['columns'] });
    }
  });
  
  return {
    baseProperties: basePropertiesQuery.data || [],
    projectProperties: projectPropertiesQuery.data || [],
    documentProperties: documentPropertiesQuery.data || [],
    allProperties,
    isLoading: basePropertiesQuery.isLoading || 
               projectPropertiesQuery.isLoading || 
               documentPropertiesQuery.isLoading,
    createProperty: createProperty.mutateAsync,
    updateProperty: updateMutation.mutateAsync,
    deleteProperty: deleteMutation.mutateAsync,
  };
}