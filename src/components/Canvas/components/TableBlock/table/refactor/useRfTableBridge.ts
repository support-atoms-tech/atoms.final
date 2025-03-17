// useTableBridge.ts - Connect existing hooks with our store
import { useEffect } from 'react';
import { useTableStore } from './tableStore';
import { useTableBlockEditor } from '@/components/Canvas/lib/hooks/canvas/useTableBlockEditor';
import { useTableColumns } from '@/components/Canvas/lib/hooks/canvas/useTableColumns';
import { useBlock } from '@/components/Canvas/lib/providers/BlockContext';
import { useTable } from '@/components/Canvas/lib/providers/TableContext';

/**
 * Bridge between existing hooks/contexts and our new store
 * This ensures backward compatibility while we move to the new architecture
 */
export function useTableBridge(blockId: string) {
  const { columns, isLoading: isColumnsLoading } = useTableColumns({ blockId });
  const { requirements } = useBlock();
  const { 
    addRequirement, canEdit,
    title, isEditingTitle, setTitle, startTitleEdit, stopTitleEdit,
    availableProperties,
    addColumn, handleColumnDragEnd, handleRowDragEnd
  } = useTableBlockEditor(blockId);
  
  const {
    sortColumn, sortDirection, setSort,
    filteredRequirements, pinnedRows, toggleRowPin,
    columnWidths, setColumnWidth,
    viewMode, setViewMode
  } = useTable();
  
  const store = useTableStore();
  
  // Sync data from hooks to store
  useEffect(() => {
    if (columns) store.setColumns(columns);
  }, [columns, store]);
  
  useEffect(() => {
    if (requirements) store.setRequirements(requirements);
  }, [requirements, store]);
  
  useEffect(() => {
    if (availableProperties) store.setProperties(availableProperties);
  }, [availableProperties, store]);
  
  useEffect(() => {
    store.setViewMode(viewMode);
  }, [viewMode, store]);
  
  useEffect(() => {
    if (sortColumn && sortDirection) {
      store.setSort(sortColumn, sortDirection);
    } else {
      store.clearSort();
    }
  }, [sortColumn, sortDirection, store]);
  
  // Return original methods plus store for direct access
  return {
    // Original methods
    addRequirement,
    canEdit,
    title,
    isEditingTitle,
    setTitle,
    startTitleEdit,
    stopTitleEdit,
    addColumn,
    handleColumnDragEnd,
    handleRowDragEnd,
    setViewMode,
    setSort,
    toggleRowPin,
    setColumnWidth,
    
    // Data
    columns,
    requirements: filteredRequirements,
    pinnedRows,
    columnWidths,
    viewMode,
    
    // Loading states
    isColumnsLoading,
    
    // Store for direct access
    store
  };
}

