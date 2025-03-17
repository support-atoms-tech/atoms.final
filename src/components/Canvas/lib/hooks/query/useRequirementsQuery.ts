// hooks/query/useRequirementsQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Requirement, RequirementCreateData } from '@/components/Canvas/types';
import { getQueryClient } from '@/lib/constants/queryClient';
import { useCanvasStore } from '@/components/Canvas/lib/store/canvasStore';

export function useRequirementsQuery(blockId: string | null) {
  const queryClient = getQueryClient();
  const { clientId } = useCanvasStore();
  
  // Fetch requirements for block
  const query = useQuery<Requirement[]>({
    queryKey: ['requirements', blockId],
    queryFn: async () => {
      if (!blockId) return [];
      
      const { data, error } = await supabase
        .from('requirements')
        .select('*')
        .eq('block_id', blockId)
        .order('position');
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!blockId
  });
  
  // Create requirement mutation
  const createMutation = useMutation({
    mutationFn: async (newRequirement: RequirementCreateData) => {
      const { data, error } = await supabase
        .from('requirements')
        .insert({
          ...newRequirement,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Update query cache with new requirement
      queryClient.setQueryData(['requirements', blockId], (old: Requirement[] = []) => {
        const newRequirements = [...old, data];
        // Sort by position to maintain order
        return newRequirements.sort((a, b) => a.position - b.position);
      });
    }
  });
  
  // Update requirement mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Requirement> & { id: string }) => {
      const { id, ...rest } = updates;
      
      const { data, error } = await supabase
        .from('requirements')
        .update({
          ...rest,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['requirements', blockId] });
      
      // Snapshot the previous value
      const previousRequirements = queryClient.getQueryData<Requirement[]>(['requirements', blockId]);
      
      // Optimistically update the cache
      queryClient.setQueryData(['requirements', blockId], (old: Requirement[] = []) => {
        return old.map(req => 
          req.id === updates.id ? { ...req, ...updates } : req
        );
      });
      
      return { previousRequirements };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousRequirements) {
        queryClient.setQueryData(['requirements', blockId], context.previousRequirements);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['requirements', blockId] });
    }
  });
  
  // Delete requirement mutation
  const deleteMutation = useMutation({
    mutationFn: async (requirementId: string) => {
      const { data, error } = await supabase
        .from('requirements')
        .delete()
        .eq('id', requirementId)
        .single();
        
      if (error) throw error;
      return { id: requirementId };
    },
    onMutate: async (requirementId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['requirements', blockId] });
      
      // Snapshot the previous value
      const previousRequirements = queryClient.getQueryData<Requirement[]>(['requirements', blockId]);
      
      // Find the deleted requirement to get its position
      const deletedRequirement = previousRequirements?.find(req => req.id === requirementId);
      
      // Optimistically update the cache
      queryClient.setQueryData(['requirements', blockId], (old: Requirement[] = []) => {
        return old.filter(req => req.id !== requirementId);
      });
      
      if (deletedRequirement) {
        // Update positions of requirements after the deleted one
        queryClient.setQueryData(['requirements', blockId], (old: Requirement[] = []) => {
          return old.map(req => {
            if (req.position > deletedRequirement.position) {
              return {
                ...req,
                position: req.position - 1
              };
            }
            return req;
          });
        });
      }
      
      return { previousRequirements };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousRequirements) {
        queryClient.setQueryData(['requirements', blockId], context.previousRequirements);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['requirements', blockId] });
    }
  });
  
  // Reorder requirements mutation
  const reorderMutation = useMutation({
    mutationFn: async (reorderedRequirements: { id: string, position: number }[]) => {
      // Create an array of update promises
      const updatePromises = reorderedRequirements.map(({ id, position }) => 
        supabase
          .from('requirements')
          .update({ 
            position,
            updated_at: new Date().toISOString(),
            client_id: clientId // For real-time identification
          })
          .eq('id', id)
      );
      
      // Execute all promises
      await Promise.all(updatePromises);
      
      // Return the reordered requirements for cache update
      return reorderedRequirements;
    },
    onMutate: async (reorderedRequirements) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['requirements', blockId] });
      
      // Snapshot the previous value
      const previousRequirements = queryClient.getQueryData<Requirement[]>(['requirements', blockId]);
      
      // Create a map of id -> position for quick lookup
      const positionMap = new Map(
        reorderedRequirements.map(({ id, position }) => [id, position])
      );
      
      // Optimistically update the cache
      queryClient.setQueryData(['requirements', blockId], (old: Requirement[] = []) => {
        return old.map(req => {
          const newPosition = positionMap.get(req.id);
          if (newPosition !== undefined) {
            return { ...req, position: newPosition };
          }
          return req;
        }).sort((a, b) => a.position - b.position);
      });
      
      return { previousRequirements };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousRequirements) {
        queryClient.setQueryData(['requirements', blockId], context.previousRequirements);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['requirements', blockId] });
    }
  });
  
  // Bulk update properties for requirements
  const bulkUpdatePropertiesMutation = useMutation({
    mutationFn: async (updates: { id: string, properties: Record<string, any> }[]) => {
      // Create an array of update promises
      const updatePromises = updates.map(({ id, properties }) => 
        supabase
          .from('requirements')
          .update({ 
            properties,
            updated_at: new Date().toISOString(),
            client_id: clientId // For real-time identification
          })
          .eq('id', id)
      );
      
      // Execute all promises
      await Promise.all(updatePromises);
      
      // Return the updates for cache update
      return updates;
    },
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['requirements', blockId] });
      
      // Snapshot the previous value
      const previousRequirements = queryClient.getQueryData<Requirement[]>(['requirements', blockId]);
      
      // Create a map of id -> properties for quick lookup
      const propertiesMap = new Map(
        updates.map(({ id, properties }) => [id, properties])
      );
      
      // Optimistically update the cache
      queryClient.setQueryData(['requirements', blockId], (old: Requirement[] = []) => {
        return old.map(req => {
          const newProperties = propertiesMap.get(req.id);
          if (newProperties) {
            return { 
              ...req, 
              properties: {
                ...req.properties,
                ...newProperties
              }
            };
          }
          return req;
        });
      });
      
      return { previousRequirements };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousRequirements) {
        queryClient.setQueryData(['requirements', blockId], context.previousRequirements);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['requirements', blockId] });
    }
  });
  
  return {
    requirements: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createRequirement: createMutation.mutateAsync,
    updateRequirement: updateMutation.mutateAsync,
    deleteRequirement: deleteMutation.mutateAsync,
    reorderRequirements: reorderMutation.mutateAsync,
    bulkUpdateProperties: bulkUpdatePropertiesMutation.mutateAsync,
  };
}

