// components/CollaborativeTable/index.tsx
import { memo, useMemo, useCallback, useEffect, useRef } from 'react';
import { EnhancedCollaborativeTable } from './components/Table';
import { EnhancedTableToolbar } from './components/TableToolbar';
import { useAddRow, useDeleteRow, useTableColumns } from '@/components/CollaborativeTable/hooks/useSupabaseQuery';
import { useTableStore } from '@/components/CollaborativeTable/store/tableStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Column } from '@/components/CollaborativeTable/types';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

interface CollaborativeTableContainerProps {
  blockId: string;
  documentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title?: string;
  showToolbar?: boolean;
  showCollaborators?: boolean;
  height?: number;
  width?: number | string;
  onRowSelect?: (rowId: string) => void;
  className?: string;
}

/**
 * Enhanced collaborative table container component
 * - Integrates TanStack Table with shadcn/ui for a responsive and accessible UI
 * - Implements virtualization for handling large datasets
 * - Provides real-time collaboration features
 * - Uses optimistic updates for a fluid UX
 */
export const EnhancedCollaborativeTableContainer = memo(function EnhancedCollaborativeTableContainer({
  blockId,
  documentId,
  userId,
  userName,
  userAvatar,
  title,
  showToolbar = true,
  showCollaborators = true,
  height,
  width,
  onRowSelect,
  className = ''
}: CollaborativeTableContainerProps) {
  const tableStore = useTableStore();
  const addRow = useAddRow();
  const deleteRow = useDeleteRow();
  const { data: columns } = useTableColumns(blockId);
  
  // Use refs to track previous values and prevent unnecessary updates
  const prevColumnsRef = useRef<Column[] | null>(null);
  const prevVisibleColumnsRef = useRef<string[]>([]);
  const initializedRef = useRef(false);
  
  // Initialize table state with appropriate visible columns
  useEffect(() => {
    if (!columns || columns.length === 0) return;
    
    // Skip if columns haven't changed
    if (
      prevColumnsRef.current === columns &&
      prevVisibleColumnsRef.current === tableStore.visibleColumns && 
      initializedRef.current
    ) {
      return;
    }
    
    // Update refs with current values
    prevColumnsRef.current = columns;
    prevVisibleColumnsRef.current = tableStore.visibleColumns;
    
    // Validate sort column exists in the current columns
    if (tableStore.sortColumn) {
      const sortColumnExists = columns.some(
        (col: Column) => col.id === tableStore.sortColumn || col.property_id === tableStore.sortColumn
      );
      
      if (!sortColumnExists) {
        tableStore.clearSort();
      }
    }
    
    // Handle visible columns initialization and validation
    if (tableStore.visibleColumns.length === 0) {
      // No visible columns set, initialize with defaults
      const defaultVisibleColumns = columns
        .filter((col: Column) => !col.is_hidden)
        .map((col: Column) => col.id);
      
      if (defaultVisibleColumns.length > 0) {
        tableStore.setVisibleColumns(defaultVisibleColumns);
        initializedRef.current = true;
      }
    } else {
      // Validate existing visible columns
      const validVisibleColumns = tableStore.visibleColumns.filter(
        columnId => columns.some((col: Column) => col.id === columnId)
      );
      
      const needsUpdate = 
        validVisibleColumns.length !== tableStore.visibleColumns.length;
      
      if (needsUpdate) {
        tableStore.setVisibleColumns(validVisibleColumns);
      }
      
      initializedRef.current = true;
    }
  }, [columns]); // Only depend on columns changing
  
  // Handle adding a new row
  const handleAddRow = useCallback(() => {
    addRow.mutate({
      documentId,
      blockId,
      userId,
      properties: {}
    });
  }, [addRow, blockId, userId, documentId]);
  
  // Handle deleting selected rows
  const handleDeleteSelected = useCallback(() => {
    if (tableStore.selectedRowIds.length === 0) return;
    
    // Confirm deletion
    if (window.confirm(`Delete ${tableStore.selectedRowIds.length} selected row(s)?`)) {
      // Delete rows one by one
      tableStore.selectedRowIds.forEach(rowId => {
        deleteRow.mutate({ rowId });
      });
      
      // Clear selection
      tableStore.clearSelection();
    }
  }, [deleteRow, tableStore]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className={`rounded-lg shadow bg-white flex flex-col ${className}`} style={{ height }}>
        {/* Optional header with title */}
        {title && (
          <div className="border-b px-4 py-2">
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
        )}
        
        {/* Optional toolbar with controls */}
        {showToolbar && (
          <EnhancedTableToolbar 
            blockId={blockId}
            showCollaborators={showCollaborators}
            onAddRow={handleAddRow}
            onDeleteSelected={handleDeleteSelected}
          />
        )}
        
        {/* Main table component */}
        <div className="flex-grow overflow-hidden">
          <EnhancedCollaborativeTable
            blockId={blockId}
            userId={userId}
            userName={userName}
            userAvatar={userAvatar}
            height={height}
            width={width}
            onRowSelect={onRowSelect}
          />
        </div>
      </div>
    </QueryClientProvider>
  );
});

// Export the main component
export { EnhancedCollaborativeTableContainer as CollaborativeTable };

// Also export individual components for direct usage
export { EnhancedCollaborativeTable } from './components/Table';
export { EnhancedTableToolbar } from './components/TableToolbar';
export { CellRenderer } from './components/CellRenderer';
export { CellEditor } from './components/CellEditor';
export { PresenceIndicator } from './components/PresenceIndicator';

// Export hooks and stores
export { useOptimisticUpdates } from '@/components/CollaborativeTable/hooks/useOptimisticUpdates';
export { useTableStore } from '@/components/CollaborativeTable/store/tableStore';
export { useOptimisticStore } from '@/components/CollaborativeTable/store/optimisticStore';
export { usePresenceStore } from '@/components/CollaborativeTable/store/presenceStore';