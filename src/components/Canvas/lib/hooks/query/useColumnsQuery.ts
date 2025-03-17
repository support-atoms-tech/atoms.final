// hooks/query/useColumnsQuery.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Column, ColumnCreateData } from '@/components/Canvas/types';
import { getQueryClient } from '@/lib/constants/queryClient';
import { useCanvasStore } from '@/components/Canvas/lib/store/canvasStore';

export function useColumnsQuery(blockId: string | null) {
  const queryClient = getQueryClient();
  const { clientId } = useCanvasStore();
  
  // Fetch columns for block with related property data
  const query = useQuery<Column[]>({
    queryKey: ['columns', blockId],
    queryFn: async () => {
      if (!blockId) return [];
      
      const { data, error } = await supabase
        .from('columns')
        .select(`
          *,
          property:property_id (*)
        `)
        .eq('block_id', blockId)
        .order('position');
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!blockId
  });
  
  // Create column mutation
  const createMutation = useMutation({
    mutationFn: async (newColumn: ColumnCreateData) => {
      const { data, error } = await supabase
        .from('columns')
        .insert({
          ...newColumn,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          client_id: clientId // For real-time identification
        })
        .select(`
          *,
          property:property_id (*)
        `)
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Update query cache with new column
      queryClient.setQueryData(['columns', blockId], (old: Column[] = []) => {
        const newColumns = [...old, data];
        // Sort by position to maintain order
        return newColumns.sort((a, b) => a.position - b.position);
      });
    }
  });
  
  // Update column mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Column> & { id: string }) => {
      const { id, ...rest } = updates;
      
      const { data, error } = await supabase
        .from('columns')
        .update({
          ...rest,
          updated_at: new Date().toISOString(),
          client_id: clientId // For real-time identification
        })
        .eq('id', id)
        .select(`
          *,
          property:property_id (*)
        `)
        .single();
        
      if (error) throw error;
      return data;
    },
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['columns', blockId] });
      
      // Snapshot the previous value
      const previousColumns = queryClient.getQueryData<Column[]>(['columns', blockId]);
      
      // Optimistically update the cache
      queryClient.setQueryData(['columns', blockId], (old: Column[] = []) => {
        return old.map(column => {
          if (column.id === updates.id) {
            return { 
              ...column, 
              ...updates,
              // Preserve property data in the optimistic update
              property: column.property 
            };
          }
          return column;
        });
      });
      
      return { previousColumns };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousColumns) {
        queryClient.setQueryData(['columns', blockId], context.previousColumns);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['columns', blockId] });
    }
  });
  
  // Delete column mutation
  const deleteMutation = useMutation({
    mutationFn: async (columnId: string) => {
      const { data, error } = await supabase
        .from('columns')
        .delete()
        .eq('id', columnId)
        .single();
        
      if (error) throw error;
      return { id: columnId };
    },
    onMutate: async (columnId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['columns', blockId] });
      
      // Snapshot the previous value
      const previousColumns = queryClient.getQueryData<Column[]>(['columns', blockId]);
      
      // Find the deleted column to get its position
      const deletedColumn = previousColumns?.find(column => column.id === columnId);
      
      // Optimistically update the cache
      queryClient.setQueryData(['columns', blockId], (old: Column[] = []) => {
        return old.filter(column => column.id !== columnId);
      });
      
      if (deletedColumn) {
        // Update positions of columns after the deleted one
        queryClient.setQueryData(['columns', blockId], (old: Column[] = []) => {
          return old.map(column => {
            if (column.position > deletedColumn.position) {
              return {
                ...column,
                position: column.position - 1
              };
            }
            return column;
          });
        });
      }
      
      return { previousColumns };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousColumns) {
        queryClient.setQueryData(['columns', blockId], context.previousColumns);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['columns', blockId] });
    }
  });
  
  // Reorder columns mutation
  const reorderMutation = useMutation({
    mutationFn: async (reorderedColumns: { id: string, position: number }[]) => {
      // Create an array of update promises
      const updatePromises = reorderedColumns.map(({ id, position }) => 
        supabase
          .from('columns')
          .update({ 
            position,
            updated_at: new Date().toISOString(),
            client_id: clientId // For real-time identification
          })
          .eq('id', id)
      );
      
      // Execute all promises
      await Promise.all(updatePromises);
      
      // Return the reordered columns for cache update
      return reorderedColumns;
    },
    onMutate: async (reorderedColumns) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['columns', blockId] });
      
      // Snapshot the previous value
      const previousColumns = queryClient.getQueryData<Column[]>(['columns', blockId]);
      
      // Create a map of id -> position for quick lookup
      const positionMap = new Map(
        reorderedColumns.map(({ id, position }) => [id, position])
      );
      
      // Optimistically update the cache
      queryClient.setQueryData(['columns', blockId], (old: Column[] = []) => {
        return old.map(column => {
          const newPosition = positionMap.get(column.id);
          if (newPosition !== undefined) {
            return { ...column, position: newPosition };
          }
          return column;
        }).sort((a, b) => a.position - b.position);
      });
      
      return { previousColumns };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousColumns) {
        queryClient.setQueryData(['columns', blockId], context.previousColumns);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['columns', blockId] });
    }
  });
  
  return {
    columns: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createColumn: createMutation.mutateAsync,
    updateColumn: updateMutation.mutateAsync,
    deleteColumn: deleteMutation.mutateAsync,
    reorderColumns: reorderMutation.mutateAsync,
  };
}