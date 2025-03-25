// components/CollaborativeTable/EnhancedCollaborativeTable.tsx
import { memo, useMemo, useCallback, useEffect, useState, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  flexRender,
  ColumnDef,
  Row,
  RowData,
  Table as TanstackTable,
  VisibilityState
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTableColumns, useTableRows } from '@/components/CollaborativeTable/hooks/useSupabaseQuery';
import { useOptimisticStore } from '@/components/CollaborativeTable/store/optimisticStore';
import { useTableStore } from '@/components/CollaborativeTable/store/tableStore';
import { useRealtimeSubscription, useCursorTracking } from '@/components/CollaborativeTable/hooks/useRealtimeSubscription';
import { Requirement, Column as ColumnType, Property } from '@/components/CollaborativeTable/types';
import { CellRenderer } from './CellRenderer';
import { CellEditor } from './CellEditor';
import { PresenceIndicator } from './PresenceIndicator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useResizeObserver } from '@/components/CollaborativeTable/hooks/useResizeObserver';
import { InfiniteData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/supabaseBrowser';

// Import shadcn/ui table components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
    startEditing: (rowId: string, columnId: string) => void;
    isEditing: (rowId: string, columnId: string) => boolean;
    handleCellHover: (rowId: string, columnId: string, event: React.MouseEvent) => void;
    getCellStatus: (rowId: string, propertyId: string) => { 
      hasPendingChanges: boolean; 
      hasError: boolean;
      errorMessage?: string;
    };
  }
  
  interface ColumnMeta<TData extends RowData, TValue> {
    propertyId?: string;
    property?: Property;
  }
}

interface EnhancedCollaborativeTableProps {
  blockId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  initialPageSize?: number;
  height?: number;
  width?: number | string;
  onRowSelect?: (rowId: string) => void;
}

/**
 * Enhanced collaborative table component using shadcn/ui + TanStack Table
 * - Implements virtualization for large datasets
 * - Integrates real-time collaboration
 * - Uses optimistic updates for a responsive UX
 * - Follows modern React patterns for optimal performance
 */
export const EnhancedCollaborativeTable = memo(function EnhancedCollaborativeTable({
  blockId,
  userId,
  userName,
  userAvatar,
  initialPageSize = 100,
  height = 500,
  width = '100%',
  onRowSelect
}: EnhancedCollaborativeTableProps) {
  const tableStore = useTableStore();
  const optimisticStore = useOptimisticStore();
  
  // Container ref for virtualization
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Container dimensions for virtualization calculations
  const [containerHeight, setContainerHeight] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Observer to detect container size changes
  useResizeObserver(containerRef as React.RefObject<HTMLElement>, (entry) => {
    setContainerHeight(entry.contentRect.height);
    setContainerWidth(entry.contentRect.width);
  });
  
  // Fetch table schema (columns)
  const {
    data: columnsData,
    isLoading: isColumnsLoading,
    error: columnsError
  } = useTableColumns(blockId);
  
  // Fetch table data (rows) with pagination
  const {
    data: rowsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isRowsLoading,
    error: rowsError
  } = useTableRows(blockId, {
    sortColumn: tableStore.sortColumn || undefined,
    sortDirection: tableStore.sortDirection || undefined,
    filters: tableStore.filters,
    pageSize: initialPageSize
  });
  
  // Connect to Supabase Realtime for live updates
  const {
    isConnected,
    broadcastCursorPosition,
    updateActivity
  } = useRealtimeSubscription({
    blockId,
    userId,
    userName,
    userAvatar
  });
  
  // Track cursor movement for collaboration
  const { handleCellHover } = useCursorTracking(
    blockId,
    userId,
    isConnected,
    broadcastCursorPosition
  );
  
  // Update user activity on interactions
  useEffect(() => {
    const activityInterval = setInterval(() => {
      updateActivity();
    }, 30000); // Update presence every 30 seconds
    
    return () => clearInterval(activityInterval);
  }, [updateActivity]);
  
  // Process columns for table
  const columns = useMemo(() => {
    if (!columnsData) return [];
    
    // Filter and sort columns
    const visibleColumns = [...columnsData]
      .filter(col => !col.is_hidden && tableStore.visibleColumns.includes(col.id))
      .sort((a, b) => {
        // First try to sort by the user-defined order
        const orderA = tableStore.columnOrder.indexOf(a.id);
        const orderB = tableStore.columnOrder.indexOf(b.id);
        
        if (orderA !== -1 && orderB !== -1) {
          return orderA - orderB;
        } else if (orderA !== -1) {
          return -1;
        } else if (orderB !== -1) {
          return 1;
        }
        
        // Fall back to the original order
        return a.position - b.position;
      });
    
    // Validate the sort column exists to prevent TanStack Table errors
    // This check runs when the columns data changes
    if (tableStore.sortColumn) {
      // Check if the sort column exists in the columnsData
      const sortColumnExists = columnsData.some(
        col => col.id === tableStore.sortColumn || col.property_id === tableStore.sortColumn
      );
      
      // If the sort column doesn't exist, clear the sort to prevent errors
      if (!sortColumnExists) {
        // We need to clear the sort in a timeout to avoid state updates during render
        setTimeout(() => {
          tableStore.clearSort();
        }, 0);
      }
    }
    
    // Map to TanStack column definitions
    return visibleColumns.map((column): ColumnDef<Requirement> => {
      const propertyId = column.property_id;
      const property = column.property;
      const columnId = column.id; // The column ID is what we use as the key in the properties JSONB
      
      return {
        id: column.id,
        accessorFn: (row) => {
          // Get optimistic value if there's a pending change
          // Use the column.id as the key to access the property value in the JSONB
          const rawValue = row.properties?.[columnId];
          return optimisticStore.getOptimisticValue(row.id, columnId, rawValue);
        },
        header: property?.name || 'Column',
        size: tableStore.columnWidths[column.id] || column.width || 150,
        meta: {
          propertyId,
          property
        },
        cell: ({ row, column, table }) => {
          const value = row.getValue(column.id);
          const rowId = row.original.id;
          
          const isEditing = table.options.meta?.isEditing(rowId, column.id);
          const { hasPendingChanges, hasError, errorMessage } = 
            table.options.meta?.getCellStatus(rowId, columnId) || 
            { hasPendingChanges: false, hasError: false };
            
          return (
            <div 
              className={`cell-wrapper relative w-full h-full
                ${hasPendingChanges ? 'bg-yellow-50' : ''} 
                ${hasError ? 'bg-red-50' : ''}`}
              onClick={() => table.options.meta?.startEditing(rowId, column.id)}
              onMouseMove={(e) => table.options.meta?.handleCellHover(rowId, column.id, e)}
            >
              {isEditing ? (
                <CellEditor
                  value={value}
                  rowId={rowId}
                  property={property!}
                  onChange={(newValue) => {
                    const rowIndex = row.index;
                    table.options.meta?.updateData(rowIndex, column.id, newValue);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      tableStore.clearEditingCell();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      tableStore.clearEditingCell();
                    }
                  }}
                  onClickOutside={() => tableStore.clearEditingCell()}
                />
              ) : (
                <CellRenderer
                  value={value}
                  property={property!}
                />
              )}
              
              {/* Show pending changes indicator */}
              {hasPendingChanges && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500 rounded-full m-1" />
              )}
              
              {/* Show error indicator */}
              {hasError && (
                <div 
                  className="absolute bottom-0 left-0 right-0 text-xs text-red-600 bg-white p-1 border-t border-red-200 truncate"
                  title={errorMessage}
                >
                  {errorMessage}
                </div>
              )}
              
              {/* Cursor indicators from other users would go here */}
              <PresenceIndicator 
                rowId={rowId}
                columnId={column.id}
              />
            </div>
          );
        }
      };
    });
  }, [columnsData, tableStore.visibleColumns, tableStore.columnOrder, tableStore.columnWidths, optimisticStore]);
  
  // Process rows for table
  const flatRows = useMemo(() => {
    const data = rowsData as InfiniteData<{ rows: Requirement[]; nextCursor: string | null }> | undefined;
    if (!data?.pages) return [];
    
    return data.pages.flatMap((page: { rows: Requirement[] }) => page.rows);
  }, [rowsData]);
  
  // Update column visibility state
  const columnVisibility = useMemo<VisibilityState>(() => {
    const visibilityState: VisibilityState = {};
    if (!columnsData) return visibilityState;
    
    columnsData.forEach(column => {
      visibilityState[column.id] = tableStore.visibleColumns.includes(column.id);
    });
    
    return visibilityState;
  }, [columnsData, tableStore.visibleColumns]);
  
  // Set up TanStack table instance
  const table = useReactTable({
    data: flatRows,
    columns,
    state: {
      sorting: tableStore.sortColumn && columns.some(col => {
        // Check if the column ID or property ID matches the sort column
        return col.id === tableStore.sortColumn || 
          (col.meta?.propertyId === tableStore.sortColumn);
      }) ? [{ 
        id: tableStore.sortColumn, 
        desc: tableStore.sortDirection === 'desc' 
      }] : [],
      columnVisibility
    },
    onSortingChange: (updater) => {
      // Extract the new sorting state
      const newSorting = typeof updater === 'function' 
        ? updater([{ id: tableStore.sortColumn || '', desc: tableStore.sortDirection === 'desc' }]) 
        : updater;
      
      // Update tableStore
      if (newSorting.length > 0) {
        tableStore.setSort(
          newSorting[0].id,
          newSorting[0].desc ? 'desc' : 'asc'
        );
      } else {
        tableStore.clearSort();
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    enableSorting: true,
    manualPagination: true,
    // Meta data for cell operations
    meta: {
      updateData: (rowIndex: number, columnId: string, value: unknown) => {
        const rowId = flatRows[rowIndex]?.id;
        if (!rowId) return;
        
        // Get current row version
        const currentRow = flatRows.find((r: Requirement) => r.id === rowId);
        if (!currentRow) return;
        
        console.log(`Updating cell: ${rowId}.${columnId} = ${value}`);
        
        // Use the updateCell hook to handle updates
        const updateCell = async (rowId: string, columnId: string, value: any) => {
          try {
            // Find the version of the current row
            const version = currentRow.version || 1;
            
            // Add to optimistic store for immediate UI update
            optimisticStore.addPendingChange(rowId, columnId, value);
            
            // Call the update mutation (this is handled by your useUpdateCell hook)
            const updateMutation = async () => {
              try {
                // This would be your actual API call
                const result = await supabase
                  .from('requirements')
                  .update({
                    properties: {
                      ...currentRow.properties,
                      [columnId]: value
                    },
                    version: version + 1,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', rowId)
                  .select()
                  .single();
                
                console.log('Update successful:', result);
                return result.data;
              } catch (error) {
                console.error('Error updating cell:', error);
                throw error;
              }
            };
            
            // Execute the update
            await updateMutation();
          } catch (error) {
            console.error(`Failed to update cell ${rowId}.${columnId}:`, error);
            // Mark the change as failed in the optimistic store
            const pendingChange = optimisticStore.pendingChanges.find(
              change => change.rowId === rowId && change.propertyId === columnId
            );
            
            if (pendingChange) {
              optimisticStore.markChangeError(
                pendingChange.id, 
                error instanceof Error ? error.message : 'Unknown error'
              );
            }
          }
        };
        
        // Call update function
        updateCell(rowId, columnId, value);
      },
      startEditing: (rowId, columnId) => {
        tableStore.setEditingCell(rowId, columnId);
      },
      isEditing: (rowId, columnId) => {
        return tableStore.editingCell?.rowId === rowId && 
               tableStore.editingCell?.columnId === columnId;
      },
      handleCellHover,
      getCellStatus: (rowId, columnId) => {
        const pendingChange = optimisticStore.pendingChanges.find(
          change => change.rowId === rowId && 
                  change.propertyId === columnId
        );
        
        return {
          hasPendingChanges: !!pendingChange && pendingChange.status === 'pending',
          hasError: !!pendingChange && pendingChange.status === 'error',
          errorMessage: pendingChange?.errorMessage
        };
      }
    }
  });
  
  // Set up row virtualizer
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 48, // row height estimate
    overscan: 10
  });
  
  // Auto-load more rows when scrolling near the bottom
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight * 0.9;
      
      if (isNearBottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };
    
    const scrollEl = containerRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll);
      return () => scrollEl.removeEventListener('scroll', handleScroll);
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  
  // Store column widths when resizing columns
  const saveColumnWidth = useCallback((columnId: string, width: number) => {
    tableStore.setColumnWidth(columnId, width);
  }, [tableStore]);
  
  // Loading state
  if (isColumnsLoading || isRowsLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner />
        <span className="ml-2 font-mono text-sm">Loading table data...</span>
      </div>
    );
  }
  
  // Error state
  if (columnsError || rowsError) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 text-red-500 rounded-md">
        Error loading table data. Please try refreshing the page.
      </div>
    );
  }
  
  // Virtualized table with shadcn/ui styling
  return (
    <div
      ref={containerRef}
      className="relative overflow-auto border rounded-md font-mono text-sm"
      style={{ 
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width
      }}
    >
      <Table className="w-full table-fixed">
        {/* Header */}
        <TableHeader className="sticky top-0 z-10 bg-gray-50">
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id} className="border-b">
              {headerGroup.headers.map(header => (
                <TableHead
                  key={header.id}
                  className={`h-12 px-3 ${
                    header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                  }`}
                  style={{ width: header.getSize() }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center justify-between">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    
                    {/* Sort indicator */}
                    {header.column.getIsSorted() === 'asc' && (
                      <span className="ml-1 text-xs">↑</span>
                    )}
                    {header.column.getIsSorted() === 'desc' && (
                      <span className="ml-1 text-xs">↓</span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        {/* Virtualized Body */}
        <TableBody
          className="relative"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative'
          }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const row = rows[virtualRow.index];
            if (!row) return null;
            
            const rowId = row.original.id;
            const isSelected = tableStore.selectedRowIds.includes(rowId);
            const isPinned = tableStore.pinnedRows.includes(rowId);
            const hasPendingChanges = optimisticStore.hasRowPendingChanges(rowId);
            
            return (
              <TableRow
                key={row.id}
                className={`
                  absolute top-0 left-0 right-0
                  ${isSelected ? 'bg-blue-50' : isPinned ? 'bg-yellow-50' : 'hover:bg-gray-50'}
                  ${hasPendingChanges ? 'border-l-2 border-l-yellow-400' : ''}
                `}
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                  height: `${virtualRow.size}px`                }}
                onClick={() => onRowSelect?.(rowId)}
                data-state={isSelected ? 'selected' : undefined}
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell
                    key={cell.id}
                    className="px-3 py-2 overflow-hidden"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {/* Loading indicator for infinite scrolling */}
      {isFetchingNextPage && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-white bg-opacity-80 text-center z-10">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-xs">Loading more rows...</span>
        </div>
      )}
    </div>
  );
});
