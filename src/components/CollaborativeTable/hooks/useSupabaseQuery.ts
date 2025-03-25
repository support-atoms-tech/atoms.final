// hooks/useSupabaseQuery.ts
import { useQuery, useMutation, useQueryClient, UseQueryOptions, useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query';
import { PostgrestError } from '@supabase/supabase-js';
import { Requirement, Column, Property } from '@/components/CollaborativeTable/types';
import { useOptimisticStore } from '@/components/CollaborativeTable/store/optimisticStore';
import { supabase } from '@/lib/supabase/supabaseBrowser';

// QUERY HOOKS

/**
 * Hook to fetch table columns with caching
 */
export function useTableColumns(
  blockId: string,
  options?: UseQueryOptions<Column[], PostgrestError>
) {
  return useQuery<Column[], PostgrestError>({
    queryKey: ['columns', blockId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('columns')
        .select('*, property:properties(*)')
        .eq('block_id', blockId)
        .order('position');
        
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    ...options
  });
}

/**
 * Hook to fetch table rows with sorting, filtering, and infinite scrolling pagination
 */
export function useTableRows(
  blockId: string,
  {
    sortColumn,
    sortDirection,
    filters,
    pageSize = 100,
    cursor
  }: {
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    filters?: Record<string, any>;
    pageSize?: number;
    cursor?: string;
  },
  options?: Omit<UseInfiniteQueryOptions<{ rows: Requirement[]; nextCursor: string | null }, PostgrestError, unknown>, 'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'>
) {
  return useInfiniteQuery({
    queryKey: ['requirements', blockId, sortColumn, sortDirection, JSON.stringify(filters), pageSize],
    initialPageParam: cursor || null,
    queryFn: async ({ pageParam }) => {
      // Start building the query
      let query = supabase
        .from('requirements')
        .select('*, properties')
        .eq('block_id', blockId);
      
      // Apply sorting if specified
      if (sortColumn && sortDirection) {
        // Check if we're sorting by a regular column or a property
        if (['id', 'created_at', 'updated_at', 'name', 'position'].includes(sortColumn)) {
          query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
        } else {
          // Sort by a property in the properties JSONB column
          query = query.order(`properties->>'${sortColumn}'`, { ascending: sortDirection === 'asc' });
        }
      } else {
        // Default sort by position
        query = query.order('position', { ascending: true });
      }
      
      // Apply filters if any
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // Check if we're filtering on a regular column or a property
            if (['id', 'name', 'status', 'created_at', 'updated_at'].includes(key)) {
              query = query.eq(key, value);
            } else {
              // Filter by a property in the properties JSONB column
              query = query.eq(`properties->>${key}`, value);
            }
          }
        });
      }
      
      // Apply pagination using cursor from pageParam
      if (pageParam) {
        query = query.lt('id', pageParam);
      }
      
      // Limit results
      query = query.limit(pageSize);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Determine the next cursor from the results
      const nextCursor = data && data.length === pageSize ? data[data.length - 1].id : null;
      
      return { 
        rows: data || [],
        nextCursor
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    ...options
  });
}

/**
 * Hook to fetch a single row by ID with full property data
 */
export function useTableRow(
  rowId: string,
  options?: UseQueryOptions<Requirement, PostgrestError>
) {
  return useQuery<Requirement, PostgrestError>({
    queryKey: ['requirements', rowId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requirements')
        .select('*')
        .eq('id', rowId)
        .single();
        
      if (error) throw error;
      return data;
    },
    ...options
  });
}

// MUTATION HOOKS

/**
 * Hook to update a cell value with optimistic updates and version checking
 */
export function useUpdateCell() {
  const queryClient = useQueryClient();
  const optimisticStore = useOptimisticStore();
  
  return useMutation({
    mutationFn: async ({ 
      rowId, 
      columnId, // This is the column ID (not property_id)
      value, 
      version 
    }: { 
      rowId: string; 
      columnId: string; // Using columnId to match what's stored in properties JSONB
      value: any;
      version: number;
    }) => {
      console.log(`Updating cell: rowId=${rowId}, columnId=${columnId}, value=`, value);
      
      // First check if the row version matches
      const { data: currentRow, error: fetchError } = await supabase
        .from('requirements')
        .select('version, properties')
        .eq('id', rowId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching row version:', fetchError);
        throw fetchError;
      }
      
      // If version mismatch, someone else updated the row
      if (currentRow.version !== version) {
        throw new Error('Row has been modified by another user. Please refresh and try again.');
      }
      
      // Create an updated properties object with the new value
      const updatedProperties = {
        ...currentRow.properties,
        [columnId]: value
      };
      
      // Update the properties JSONB field with the new properties object
      const { data, error } = await supabase
        .from('requirements')
        .update({ 
          properties: updatedProperties,
          version: version + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', rowId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating cell:', error);
        throw error;
      }
      
      console.log('Updated row:', data);
      return data;
    },
    
    // When mutation is called
    onMutate: async ({ rowId, columnId, value }) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['requirements', rowId] });
      
      // Save previous state
      const previousRow = queryClient.getQueryData<Requirement>(['requirements', rowId]);
      
      // Add to optimistic store
      const changeId = optimisticStore.addPendingChange(rowId, columnId, value);
      
      // Update row in cache optimistically
      if (previousRow) {
        queryClient.setQueryData<Requirement>(['requirements', rowId], {
          ...previousRow,
          properties: {
            ...previousRow.properties,
            [columnId]: value
          }
        });
      }
      
      return { previousRow, changeId };
    },
    
    // If mutation fails, revert to previous state
    onError: (err, variables, context) => {
      if (context?.previousRow) {
        queryClient.setQueryData(['table-row', context.previousRow.id], context.previousRow);
      }
      
      if (context?.changeId) {
        optimisticStore.markChangeError(context.changeId, err.message);
      }
      
      console.error('Error in useUpdateCell:', err);
    },
    
    // After success or error, invalidate queries to refetch fresh data
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['table-row', variables.rowId] });
      
      // Mark change as successful in optimistic store
      if (!error && context?.changeId) {
        optimisticStore.markChangeSuccess(context.changeId);
        
        // Clean up resolved changes to prevent memory leaks
        setTimeout(() => {
          optimisticStore.clearResolvedChanges();
        }, 5000);
      }
    }
  });
}

/**
 * Hook to add a new row to the table
 */
export function useAddRow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      documentId,
      blockId,
      properties = {},
      userId
    }: { 
      documentId: string;
      blockId: string;
      properties?: Record<string, any>;
      userId: string;
    }) => {
      console.log('Creating new row for block:', blockId);
      
      // First, fetch all columns with their properties to get their IDs and default values
      const { data: columns, error: columnsError } = await supabase
        .from('columns')
        .select('id, property_id, property:properties(id, name, property_type, options)')
        .eq('block_id', blockId)
        .order('position');
        
      if (columnsError) {
        console.error('Error fetching columns:', columnsError);
        throw columnsError;
      }
      
      console.log('Fetched columns:', columns);
      
      // Initialize properties JSONB with default values for all columns
      const initializedProperties: Record<string, any> = {};
      
      columns?.forEach(column => {
        // Use the column.id as the key in the properties JSONB
        const columnId = column.id;
        const property = column.property as any; // Using any here as the property structure might vary
        
        // Get default value from property options if available
        // Default to null if not specified
        let defaultValue = null;
        
        if (property?.options?.default_value !== undefined) {
          defaultValue = property.options.default_value;
        } else if (property?.property_type === 'select' && 
                  property?.options?.values && 
                  property.options.values.length > 0) {
          // For select fields, use the first option as default if no specific default
          defaultValue = property.options.values[0];
        } else if (property?.property_type === 'multi_select') {
          // For multi-select, default to empty array
          defaultValue = [];
        } else if (property?.property_type === 'checkbox') {
          // For checkbox, default to false
          defaultValue = false;
        }
        
        // If properties were passed in, use those values instead
        initializedProperties[columnId] = properties[columnId] ?? defaultValue;
        
        console.log(`Setting property ${columnId} to:`, initializedProperties[columnId]);
      });
      
      console.log('Initialized properties:', initializedProperties);
      
      // Get the highest position value to place the new row at the end
      const { data: lastRow, error: positionError } = await supabase
        .from('requirements')
        .select('position')
        .eq('block_id', blockId)
        .order('position', { ascending: false })
        .limit(1)
        .single();
        
      if (positionError && positionError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error getting last row position:', positionError);
        throw positionError;
      }
      
      const newPosition = lastRow ? lastRow.position + 1 : 0;
      
      // Create the new row with initialized properties
      const { data, error } = await supabase
        .from('requirements')
        .insert({
          name: 'New Row',
          block_id: blockId,
          document_id: documentId,
          properties: initializedProperties,
          created_by: userId,
          updated_by: userId,
          version: 1,
          position: newPosition,
          status: 'active' // Set a default status
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating new row:', error);
        throw error;
      }
      
      console.log('Created new row:', data);
      return data as Requirement;
    },
    
    onSuccess: (newRow) => {
      // Invalidate table rows query to refetch with new row
      queryClient.invalidateQueries({ queryKey: ['requirements', newRow.block_id] });
    },
    
    onError: (error) => {
      console.error('Failed to add row:', error);
    }
  });
}

/**
 * Hook to delete a row from the table
 */
export function useDeleteRow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ rowId }: { rowId: string }) => {
      // Get the row first to know which table to invalidate
      const { data: row, error: fetchError } = await supabase
        .from('requirements')
        .select('block_id')
        .eq('id', rowId)
        .single();
        
      if (fetchError) throw fetchError;
      
      const { error } = await supabase
        .from('requirements')
        .delete()
        .eq('id', rowId);

      if (error) throw error;
      return { rowId, blockId: row.block_id };
    },
    
    onSuccess: ({ rowId, blockId }) => {
      // Remove row from cache
      queryClient.removeQueries({ queryKey: ['requirements', rowId] });
      
      // Invalidate table rows query to refetch without deleted row
      queryClient.invalidateQueries({ queryKey: ['requirements', blockId] });
    }
  });
}