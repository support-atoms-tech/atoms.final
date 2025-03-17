// RefactoredTableView.tsx - Main table view using Tanstack Table and shadcn UI
'use client';

import { useRef, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
  Row,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useTableBridge } from './useRfTableBridge';
import { Requirement, Column as TableColumn } from '@/components/Canvas/types';
import { CellRenderer } from '@/components/Canvas/components/TableBlock/table/CellRenderer';
import { useTableStore } from './tableStore';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { RefactoredCellEditor } from './RfCellEditor';
import { useRefactoredCellEditor } from './useRfCellEditor';

interface RefactoredTableViewProps {
  blockId: string;
}

/**
 * Modern table implementation using Tanstack Table and shadcn UI
 * Features virtualization, sorting, filtering, and a clean monospaced design
 */
export function RefactoredTableView({ blockId }: RefactoredTableViewProps) {
  const {
    columns,
    requirements,
    isColumnsLoading,
    addRequirement,
    canEdit,
    handleColumnDragEnd,
    handleRowDragEnd,
  } = useTableBridge(blockId);
  
  const tableStore = useTableStore();
  
  // Convert our columns to Tanstack Table column definitions
  const tableColumns = useMemo(() => {
    if (!columns) return [];
    
    const columnHelper = createColumnHelper<Requirement>();
    
    return columns
      .filter((col: TableColumn) => !col.is_hidden)
      .map((col: TableColumn) => {
        const propertyId = col.property_id;
        const property = col.property;
        
        return columnHelper.accessor(
          (row) => row.properties?.[propertyId],
          {
            id: col.id,
            header: property?.name || 'Column',
            cell: (info) => {
              const rowId = info.row.original.id;
              const { 
                isEditing, 
                startEditing, 
                handleValueChange, 
                handleKeyDown, 
                handleClickOutside 
              } = useRefactoredCellEditor(rowId, propertyId, property!);
              
              return isEditing ? (
                <RefactoredCellEditor
                  value={info.getValue()}
                  property={property!}
                  onChange={handleValueChange}
                  onKeyDown={handleKeyDown}
                  onClickOutside={handleClickOutside}
                />
              ) : (
                <div onClick={() => startEditing()}>
                  <CellRenderer
                    value={info.getValue()}
                    property={property!}
                  />
                </div>
              );
            },
            enableSorting: true,
            meta: {
              propertyId,
              property,
              columnWidth: tableStore.columnWidths[col.id] || col.width || 150,
            },
          }
        );
      });
  }, [columns, tableStore.columnWidths]);
  
  // Set up Tanstack Table
  const table = useReactTable({
    data: requirements || [],
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    state: {
      sorting: tableStore.sortColumn ? 
        [{ id: tableStore.sortColumn, desc: tableStore.sortDirection === 'desc' }] : 
        [],
    },
    onSortingChange: (sorting) => {
      const sortingArr = sorting as { id: string; desc: boolean }[];
      if (sortingArr.length > 0) {
        const { id, desc } = sortingArr[0];
        tableStore.setSort(id, desc ? 'desc' : 'asc');
      } else {
        tableStore.clearSort();
      }
    },
  });
  
  // Set up virtualization for performance with large datasets
  const { rows } = table.getRowModel();
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // Estimated row height
    overscan: 5, // Number of items to render outside of the visible area
  });
  
  // Handle drag and drop operations
  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const id = String(e.active.id);
    if (id.startsWith('col-')) {
      handleColumnDragEnd(e);
    } else {
      handleRowDragEnd(e);
    }
  }, [handleColumnDragEnd, handleRowDragEnd]);
  
  // Add row handler
  const handleAddRow = useCallback(async () => {
    if (canEdit) {
      const newRequirement = await addRequirement();
      if (newRequirement) {
        // Scroll to the new row
        const newIndex = requirements?.length || 0;
        rowVirtualizer.scrollToIndex(newIndex);
      }
    }
  }, [addRequirement, canEdit, requirements?.length, rowVirtualizer]);
  
  if (isColumnsLoading) {
    return (
      <div className="p-4 text-center text-gray-500 font-mono">
        Loading table columns...
      </div>
    );
  }
  
  // Calculate padding for virtual list
  const paddingTop = rowVirtualizer.getVirtualItems()[0]?.start || 0;
  const paddingBottom =
    rowVirtualizer.getTotalSize() -
    (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end || 0);
  
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="border rounded-md font-mono">
        <Table>
          {/* Header */}
          <TableHeader className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as { columnWidth: number } | undefined;
                  return (
                    <TableHead 
                      key={header.id}
                      style={{ width: `${meta?.columnWidth || 150}px` }}
                      className="font-mono text-sm text-gray-700 font-medium py-3"
                    >
                      <div 
                        className="flex items-center cursor-pointer" 
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.getIsSorted() && (
                          <span className="ml-1">
                            {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          
          {/* Body with virtualization */}
          <TableBody className="max-h-[500px] overflow-auto">
            <div ref={parentRef} className="relative">
              {/* Top padding for virtual list */}
              {paddingTop > 0 && (
                <div style={{ height: `${paddingTop}px` }} />
              )}
              
              {/* Virtualized rows */}
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                if (!row) return null;
                
                return (
                  <TableRow 
                    key={row.id}
                    data-state={tableStore.pinnedRows.includes(row.original.id) ? 'pinned' : ''}
                    className={
                      tableStore.pinnedRows.includes(row.original.id) 
                        ? 'bg-yellow-50 hover:bg-yellow-100' 
                        : 'hover:bg-gray-50'
                    }
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id}
                        className="font-mono text-sm py-2 align-middle"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
              
              {/* Bottom padding for virtual list */}
              {paddingBottom > 0 && (
                <div style={{ height: `${paddingBottom}px` }} />
              )}
            </div>
          </TableBody>
        </Table>
        
        {/* Add Row Button */}
        {canEdit && (
          <div className="p-2 border-t">
            <Button
              variant="outline"
              onClick={handleAddRow}
              className="w-full py-2 font-mono text-sm text-gray-600 hover:bg-gray-50 
                border border-dashed border-gray-300 rounded-lg"
            >
              + Add row
            </Button>
          </div>
        )}
      </div>
    </DndContext>
  );
}

