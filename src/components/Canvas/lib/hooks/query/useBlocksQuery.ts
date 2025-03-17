'use client';

// hooks/query/useBlocksQuery.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Block, BlockCreateData } from '@/components/Canvas/types';
import { getQueryClient } from '@/lib/constants/queryClient';
import { useCanvasStore } from '@/components/Canvas/lib/store/canvasStore';

export function useBlocksQuery(documentId: string | null, initialBlocks: Block[] = []) {
  const queryClient = getQueryClient();
  const { clientId } = useCanvasStore();
  
  // Fetch blocks for document
  const query = useQuery<Block[]>({
    queryKey: ['blocks', documentId],
    queryFn: async () => {
      if (!documentId) return [];
      
      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('document_id', documentId)
        .order('position');
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!documentId,
    initialData: initialBlocks.length > 0 ? initialBlocks : undefined
  });
  
  // Create block mutation
  const createMutation = useMutation({
    mutationFn: async (newBlock: BlockCreateData) => {
      const { data, error } = await supabase
        .from('blocks')
        .insert({
          ...newBlock,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Update query cache with new block
      queryClient.setQueryData(['blocks', documentId], (old: Block[] = []) => {
        const newBlocks = [...old, data];
        // Sort by position to maintain order
        return newBlocks.sort((a, b) => a.position - b.position);
      });
    }
  });
  
  // Update block mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Block> & { id: string }) => {
      const { id, ...rest } = updates;
      
      const { data, error } = await supabase
        .from('blocks')
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
      await queryClient.cancelQueries({ queryKey: ['blocks', documentId] });
      
      // Snapshot the previous value
      const previousBlocks = queryClient.getQueryData<Block[]>(['blocks', documentId]);
      
      // Optimistically update the cache
      queryClient.setQueryData(['blocks', documentId], (old: Block[] = []) => {
        return old.map(block => 
          block.id === updates.id ? { ...block, ...updates } : block
        );
      });
      
      return { previousBlocks };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousBlocks) {
        queryClient.setQueryData(['blocks', documentId], context.previousBlocks);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['blocks', documentId] });
    }
  });
  
  // Delete block mutation
  const deleteMutation = useMutation({
    mutationFn: async (blockId: string) => {
      const { data, error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', blockId)
        .single();
        
      if (error) throw error;
      return { id: blockId };
    },
    onMutate: async (blockId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['blocks', documentId] });
      
      // Snapshot the previous value
      const previousBlocks = queryClient.getQueryData<Block[]>(['blocks', documentId]);
      
      // Optimistically update the cache
      queryClient.setQueryData(['blocks', documentId], (old: Block[] = []) => {
        return old.filter(block => block.id !== blockId);
      });
      
      // Find the deleted block to get its position
      const deletedBlock = previousBlocks?.find(block => block.id === blockId);
      
      if (deletedBlock) {
        // Update positions of blocks after the deleted one
        queryClient.setQueryData(['blocks', documentId], (old: Block[] = []) => {
          return old.map(block => {
            if (block.position > deletedBlock.position) {
              return {
                ...block,
                position: block.position - 1
              };
            }
            return block;
          });
        });
      }
      
      return { previousBlocks };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousBlocks) {
        queryClient.setQueryData(['blocks', documentId], context.previousBlocks);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['blocks', documentId] });
    }
  });
  
  // Reorder blocks mutation
  const reorderMutation = useMutation({
    mutationFn: async (reorderedBlocks: { id: string, position: number }[]) => {
      // Create an array of update promises
      const updatePromises = reorderedBlocks.map(({ id, position }) => 
        supabase
          .from('blocks')
          .update({ 
            position,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
      );
      
      // Execute all promises
      await Promise.all(updatePromises);
      
      // Return the reordered blocks for cache update
      return reorderedBlocks;
    },
    onMutate: async (reorderedBlocks) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['blocks', documentId] });
      
      // Snapshot the previous value
      const previousBlocks = queryClient.getQueryData<Block[]>(['blocks', documentId]);
      
      // Create a map of id -> position for quick lookup
      const positionMap = new Map(
        reorderedBlocks.map(({ id, position }) => [id, position])
      );
      
      // Optimistically update the cache
      queryClient.setQueryData(['blocks', documentId], (old: Block[] = []) => {
        return old.map(block => {
          const newPosition = positionMap.get(block.id);
          if (newPosition !== undefined) {
            return { ...block, position: newPosition };
          }
          return block;
        }).sort((a, b) => a.position - b.position);
      });
      
      return { previousBlocks };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousBlocks) {
        queryClient.setQueryData(['blocks', documentId], context.previousBlocks);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['blocks', documentId] });
    }
  });
  
  return {
    blocks: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createBlock: createMutation.mutateAsync,
    updateBlock: updateMutation.mutateAsync,
    deleteBlock: deleteMutation.mutateAsync,
    reorderBlocks: reorderMutation.mutateAsync,
  };
}