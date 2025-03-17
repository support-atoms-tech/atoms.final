// hooks/query/useOrganizationsQuery.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Organization } from '@/components/Canvas/types';
import { getQueryClient } from '@/lib/constants/queryClient';    
import { useCanvasStore } from '@/components/Canvas/lib/store/canvasStore';

export function useOrganizationsQuery() {
  const queryClient = getQueryClient();
  const { clientId } = useCanvasStore();
  
  // Fetch organizations
  const query = useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('is_deleted', false)
        .order('name');
        
      if (error) throw error;
      return data || [];
    }
  });
  
  // Create organization mutation
  const createMutation = useMutation({
    mutationFn: async (newOrg: Omit<Organization, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          ...newOrg,
          client_id: clientId // For real-time identification
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Update query cache with new org
      queryClient.setQueryData(['organizations'], (old: Organization[] = []) => {
        return [...old, data];
      });
    }
  });
  
  // Update organization mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Organization> & { id: string }) => {
      const { id, ...rest } = updates;
      
      const { data, error } = await supabase
        .from('organizations')
        .update({
          ...rest,
          updated_at: new Date().toISOString(),
          client_id: clientId // For real-time identification
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['organizations'] });
      
      // Snapshot the previous value
      const previousOrgs = queryClient.getQueryData<Organization[]>(['organizations']);
      
      // Optimistically update the cache
      queryClient.setQueryData(['organizations'], (old: Organization[] = []) => {
        return old.map(org => 
          org.id === updates.id ? { ...org, ...updates } : org
        );
      });
      
      return { previousOrgs };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousOrgs) {
        queryClient.setQueryData(['organizations'], context.previousOrgs);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    }
  });
  
  // Delete (soft) organization mutation
  const deleteMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const { data, error } = await supabase
        .from('organizations')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          client_id: clientId // For real-time identification
        })
        .eq('id', orgId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onMutate: async (orgId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['organizations'] });
      
      // Snapshot the previous value
      const previousOrgs = queryClient.getQueryData<Organization[]>(['organizations']);
      
      // Optimistically update the cache
      queryClient.setQueryData(['organizations'], (old: Organization[] = []) => {
        return old.filter(org => org.id !== orgId);
      });
      
      return { previousOrgs };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousOrgs) {
        queryClient.setQueryData(['organizations'], context.previousOrgs);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    }
  });
  
  return {
    organizations: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createOrganization: createMutation.mutateAsync,
    updateOrganization: updateMutation.mutateAsync,
    deleteOrganization: deleteMutation.mutateAsync,
  };
}

export function useOrganizationQuery(orgId: string | null) {
  return useQuery<Organization | null>({
    queryKey: ['organization', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!orgId
  });
}