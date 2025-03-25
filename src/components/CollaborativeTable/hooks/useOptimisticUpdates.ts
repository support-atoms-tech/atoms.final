// hooks/useOptimisticUpdates.ts
import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTableStore } from '@/components/CollaborativeTable/store/tableStore';
import { useOptimisticStore } from '@/components/CollaborativeTable/store/optimisticStore';
import { Requirement } from '@/components/CollaborativeTable/types';
import { supabase } from '@/lib/supabase/supabaseBrowser';

interface UseOptimisticUpdatesOptions {
  blockId: string;
  userId: string;
}

/**
 * Hook for managing optimistic updates to table cells
 * - Provides optimistic UI updates that improve perceived performance
 * - Handles conflict resolution when multiple users edit the same cell
 * - Provides retry functionality for failed operations
 */
export function useOptimisticUpdates({ blockId, userId }: UseOptimisticUpdatesOptions) {
  const queryClient = useQueryClient();
  const optimisticStore = useOptimisticStore();
  const tableStore = useTableStore();
  
  // Track active update operations to prevent duplicates
  const activeUpdates = useRef<Record<string, boolean>>({});

  /**
   * Update a cell with optimistic UI update and server persistence
   */
  const updateCell = useCallback(async (
    rowId: string,
    propertyId: string,
    value: any
  ) => {
    // Create a unique key for this update operation
    const updateKey = `${rowId}-${propertyId}`;
    
    // Skip if already processing an update for this cell
    if (activeUpdates.current[updateKey]) {
      return;
    }
    
    // Mark update as active
    activeUpdates.current[updateKey] = true;
    
    try {
      // Cancel any in-flight requests for this cell
      await queryClient.cancelQueries({ queryKey: ['requirements', rowId] });

      // Get the current row to check version
      const previousRow = queryClient.getQueryData<Requirement>(['requirements', rowId]);
      if (!previousRow) {
        throw new Error('Row not found in cache');
      }

      // Add optimistic update to store
      const changeId = optimisticStore.addPendingChange(rowId, propertyId, value);
      
      // Update locally in cache immediately for responsive UI
      queryClient.setQueryData<Requirement>(['requirements', rowId], {
        ...previousRow,
        properties: {
          ...previousRow.properties,
          [propertyId]: value
        }
      });

      // Now update on the server
      const { data: currentRow, error: fetchError } = await supabase
        .from('table_rows')
        .select('version')
        .eq('id', rowId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Determine if we have a version conflict
      const hasVersionConflict = currentRow.version !== previousRow.version;
      
      if (hasVersionConflict) {
        // Get the latest version of the row
        const { data: latestRow, error: latestRowError } = await supabase
          .from('table_rows')
          .select('*')
          .eq('id', rowId)
          .single();
          
        if (latestRowError) throw latestRowError;
        
        // Check if the specific property was changed by someone else
        const propertyWasChanged = 
          latestRow.properties && 
          latestRow.properties[propertyId] !== previousRow.properties?.[propertyId];
        
        if (propertyWasChanged) {
          throw new Error('This field was updated by another user. Please refresh and try again.');
        }
        
        // If our specific property wasn't changed, proceed with the update but use the latest version
        const { data, error } = await supabase
          .from('table_rows')
          .update({ 
            properties: {
              ...latestRow.properties,
              [propertyId]: value
            },
            version: latestRow.version + 1,
            updated_at: new Date().toISOString(),
            updated_by: userId
          })
          .eq('id', rowId)
          .select()
          .single();
        
        if (error) throw error;
        
        // Update with complete row data
        queryClient.setQueryData(['requirements', rowId], data);
        optimisticStore.markChangeSuccess(changeId);
        
        return data;
      } else {
        // No conflict, proceed normally
        const { data, error } = await supabase
          .from('table_rows')
          .update({ 
            properties: {
              ...previousRow.properties,
              [propertyId]: value
            },
            version: previousRow.version ? previousRow.version + 1 : 1, // Handle case where version is undefined
            updated_at: new Date().toISOString(),
            updated_by: userId
          })
          .eq('id', rowId)
          .select()
          .single();
        
        if (error) throw error;
        
        // Update with complete row data
        queryClient.setQueryData(['requirements', rowId], data);
        optimisticStore.markChangeSuccess(changeId);
        
        return data;
      }
    } catch (error) {
      // Get the current row again - it might have changed during our operation
      const currentRow = queryClient.getQueryData<Requirement>(['requirements', rowId]);
      
      // Find the pending change
      const pendingChange = optimisticStore.pendingChanges.find(
        change => change.rowId === rowId && change.propertyId === propertyId && change.status === 'pending'
      );
      
      if (pendingChange) {
        // Mark change as error
        optimisticStore.markChangeError(
          pendingChange.id, 
          error instanceof Error ? error.message : 'Failed to update'
        );
        
        // Revert to previous state in cache
        if (currentRow) {
          queryClient.setQueryData<Requirement>(['requirements', rowId], {
            ...currentRow,
            properties: {
              ...currentRow.properties,
              [propertyId]: currentRow.properties?.[propertyId]
            }
          });
        }
      }
      
      throw error;
    } finally {
      // Clear active update flag
      delete activeUpdates.current[updateKey];
      
      // Clean up resolved changes after a delay
      setTimeout(() => {
        optimisticStore.clearResolvedChanges();
      }, 5000);
      
      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['requirements', rowId] });
    }
  }, [queryClient, optimisticStore, userId]);

  /**
   * Retry a failed cell update
   */
  const retryUpdate = useCallback(async (changeId: string) => {
    const change = optimisticStore.pendingChanges.find(c => c.id === changeId);
    if (!change || change.status !== 'error') {
      return;
    }
    
    // Reset to pending state
    optimisticStore.resetPendingChange(changeId);
    
    try {
      await updateCell(change.rowId, change.propertyId, change.value);
    } catch (error) {
      // Error is already handled in updateCell
      console.error('Retry failed:', error);
    }
  }, [optimisticStore, updateCell]);

  /**
   * Cancel a pending change
   */
  const cancelUpdate = useCallback((changeId: string) => {
    const change = optimisticStore.pendingChanges.find(c => c.id === changeId);
    if (!change) return;
    
    // Get the current row from cache
    const row = queryClient.getQueryData<Requirement>(['requirements', change.rowId]);
    if (!row) return;
    
    // Remove the change from store
    optimisticStore.removePendingChange(changeId);
    
    // If currently editing this cell, exit edit mode
    if (
      tableStore.editingCell?.rowId === change.rowId && 
      tableStore.editingCell?.columnId === change.propertyId
    ) {
      tableStore.clearEditingCell();
    }
    
    // Invalidate the row to refetch the correct data
    queryClient.invalidateQueries({ queryKey: ['requirements', change.rowId] });
  }, [optimisticStore, queryClient, tableStore]);

  /**
   * Get pending changes for a specific row
   */
  const getRowPendingChanges = useCallback((rowId: string) => {
    return optimisticStore.pendingChanges.filter(
      change => change.rowId === rowId
    );
  }, [optimisticStore]);

  /**
   * Batch update multiple cells at once with optimistic updates
   */
  const batchUpdateCells = useCallback(async (
    updates: Array<{ rowId: string; propertyId: string; value: any }>
  ) => {
    // Group updates by row for efficiency
    const updatesByRow = updates.reduce((acc, update) => {
      if (!acc[update.rowId]) {
        acc[update.rowId] = [];
      }
      acc[update.rowId].push({ propertyId: update.propertyId, value: update.value });
      return acc;
    }, {} as Record<string, Array<{ propertyId: string; value: any }>>);
    
    // Process each row's updates
    const promises = Object.entries(updatesByRow).map(async ([rowId, rowUpdates]) => {
      try {
        // Get current row data
        const previousRow = queryClient.getQueryData<Requirement>(['requirements', rowId]);
        if (!previousRow) {
          throw new Error(`Row ${rowId} not found in cache`);
        }
        
        // Create optimistic updates and track change IDs
        const changeIds = rowUpdates.map(update => 
          optimisticStore.addPendingChange(rowId, update.propertyId, update.value)
        );
        
        // Update locally in cache
        const updatedProperties = { ...previousRow.properties };
        rowUpdates.forEach(update => {
          updatedProperties[update.propertyId] = update.value;
        });
        
        queryClient.setQueryData<Requirement>(['requirements', rowId], {
          ...previousRow,
          properties: updatedProperties
        });
        
        // Get current version from server
        const { data: currentRow, error: fetchError } = await supabase
          .from('table_rows')
          .select('version')
          .eq('id', rowId)
          .single();
        
        if (fetchError) throw fetchError;
        
        // Update on server
        const { data, error } = await supabase
          .from('table_rows')
          .update({ 
            properties: updatedProperties,
            version: currentRow.version + 1,
            updated_at: new Date().toISOString(),
            updated_by: userId
          })
          .eq('id', rowId)
          .select()
          .single();
        
        if (error) throw error;
        
        // Mark all changes as successful
        changeIds.forEach(id => optimisticStore.markChangeSuccess(id));
        
        // Update with complete row data
        queryClient.setQueryData(['requirements', rowId], data);
        
        return { rowId, success: true, data };
      } catch (error) {
        // Mark optimistic changes as errors
        const failedChanges = optimisticStore.pendingChanges.filter(
          change => change.rowId === rowId && change.status === 'pending'
        );
        
        failedChanges.forEach(change => {
          optimisticStore.markChangeError(
            change.id,
            error instanceof Error ? error.message : 'Failed to update in batch operation'
          );
        });
        
        return { 
          rowId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      } finally {
        // Invalidate row data
        queryClient.invalidateQueries({ queryKey: ['requirements', rowId] });
      }
    });
    
    return Promise.all(promises);
  }, [queryClient, optimisticStore, userId]);

  return {
    updateCell,
    retryUpdate,
    cancelUpdate,
    getRowPendingChanges,
    batchUpdateCells
  };
}