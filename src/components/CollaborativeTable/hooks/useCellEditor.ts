
// hooks/useCellEditor.ts
import { useState, useCallback } from 'react';
import { useTableStore } from '@/components/CollaborativeTable/store/tableStore';
import { useUpdateCell } from '@/components/CollaborativeTable/hooks/useSupabaseQuery';
import { Property } from '@/components/CollaborativeTable/types';
import { useTableRow } from '@/components/CollaborativeTable/hooks/useSupabaseQuery';

/**
 * Hook to manage cell editing state and operations
 */
export function useCellEditor(rowId: string, propertyId: string, property: Property) {
  const tableStore = useTableStore();
  const updateCell = useUpdateCell();
  
  // Get current row data for version
  const { data: row } = useTableRow(rowId, {
    // Don't refetch on window focus for better editing experience
    refetchOnWindowFocus: false,
    queryKey: ['requirements', rowId],
  });
  
  // Check if this cell is being edited
  const isEditing = tableStore.editingCell?.rowId === rowId && 
                    tableStore.editingCell?.columnId === propertyId;
  
  // Start editing this cell
  const startEditing = useCallback(() => {
    tableStore.setEditingCell(rowId, propertyId);
  }, [tableStore, rowId, propertyId]);
  
  // Handle value change and submit to backend
  const handleValueChange = useCallback((value: any) => {
    if (!row) return;
    
    // Submit the change to the backend
    updateCell.mutate({
      rowId,
      propertyId,
      value,
      version: row.version || 1
    });
  }, [updateCell, rowId, propertyId, row]);
  
  // Handle keyboard events (Enter to save, Escape to cancel)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      tableStore.clearEditingCell();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      tableStore.clearEditingCell();
    }
  }, [tableStore]);
  
  // Handle click outside the editor
  const handleClickOutside = useCallback(() => {
    tableStore.clearEditingCell();
  }, [tableStore]);
  
  return {
    isEditing,
    startEditing,
    handleValueChange,
    handleKeyDown,
    handleClickOutside
  };
}