// components/canvas/table/TableHeader.tsx
'use client';

import React, { useState, useRef, useMemo, memo, useCallback, useEffect } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Column } from '@/components/Canvas/types';
import { useTable } from '@/components/Canvas/lib/providers/TableContext';
import { useBlock } from '@/components/Canvas/lib/providers/BlockContext';
import { useDocument } from '@/components/Canvas/lib/providers/DocumentContext';

// Debounce function to limit the frequency of updates
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface TableHeaderProps {
  columns: Column[];
}

export const TableHeader = memo(function TableHeader({ columns }: TableHeaderProps) {
  const { sortColumn, sortDirection, setSort } = useTable();
  const { editMode } = useDocument();
  
  // Memoize the sort handler creation for each column
  const createSortHandler = useCallback((columnPropertyId: string) => {
    return () => {
      if (sortColumn === columnPropertyId) {
        setSort(
          columnPropertyId, 
          sortDirection === 'asc' ? 'desc' : 'asc'
        );
      } else {
        setSort(columnPropertyId, 'asc');
      }
    };
  }, [sortColumn, sortDirection, setSort]);
  
  // Memoize the column headers to prevent unnecessary re-renders
  const columnHeaders = useMemo(() => {
    return columns.map(column => (
      <ColumnHeader 
        key={column.id} 
        column={column}
        isSort={sortColumn === column.property_id}
        sortDirection={sortColumn === column.property_id ? sortDirection : undefined}
        onSort={createSortHandler(column.property_id)}
        canDrag={editMode}
      />
    ));
  }, [columns, sortColumn, sortDirection, createSortHandler, editMode]);
  
  return (
    <div className="table-header flex border-b bg-gray-50">
      {columnHeaders}
    </div>
  );
});

interface ColumnHeaderProps {
  column: Column;
  isSort?: boolean;
  sortDirection?: 'asc' | 'desc';
  onSort: () => void;
  canDrag: boolean;
}

const ColumnHeader = memo(function ColumnHeader({ 
  column, 
  isSort, 
  sortDirection, 
  onSort, 
  canDrag 
}: ColumnHeaderProps) {
  const { columnWidths, setColumnWidth } = useTable();
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [localWidth, setLocalWidth] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Get column width from store or use default
  const width = columnWidths[column.id] || column.width || 150;
  
  // Initialize local width when width changes
  useEffect(() => {
    setLocalWidth(width);
  }, [width]);
  
  // Debounce the local width to reduce updates to the store
  const debouncedWidth = useDebounce(localWidth, 100);
  
  // Update the store when debounced width changes
  useEffect(() => {
    if (debouncedWidth !== width && debouncedWidth > 0) {
      setColumnWidth(column.id, debouncedWidth);
    }
  }, [debouncedWidth, column.id, setColumnWidth, width]);
  
  // Draggable setup
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `col-${column.id}`,
    disabled: !canDrag || isResizing
  });
  
  // Start resize handler - memoize to prevent recreation
  const handleResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(localWidth);
    
    // Add event listeners for mousemove and mouseup
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  }, [localWidth]);
  
  // Resize move handler - defined outside component to prevent recreation
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const diff = e.clientX - startX;
    const newWidth = Math.max(80, startWidth + diff); // Minimum 80px width
    
    // Update local width only during resize
    setLocalWidth(newWidth);
  }, [isResizing, startX, startWidth]);
  
  // Resize end handler - defined outside component to prevent recreation
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);
  
  // Add event listeners when isResizing changes
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);
  
  // Memoize the sort indicator
  const sortIndicator = useMemo(() => {
    if (!isSort) return null;
    
    return (
      <div className="sort-indicator ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </div>
    );
  }, [isSort, sortDirection]);
  
  // Memoize the resize handle
  const resizeHandle = useMemo(() => {
    return (
      <div
        className="resize-handle absolute top-0 right-0 w-3 h-full cursor-col-resize"
        onMouseDown={handleResizeStart}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }, [handleResizeStart]);
  
  // Use local width for display during resize, but width from store otherwise
  const displayWidth = isResizing ? localWidth : width;
  
  return (
    <div
      ref={setNodeRef}
      className={`column-header flex-shrink-0 relative px-3 py-2 cursor-pointer select-none ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{
        width: `${displayWidth}px`,
        transform: transform ? CSS.Transform.toString(transform) : undefined
      }}
      onClick={onSort}
      {...(canDrag ? attributes : {})}
      {...(canDrag ? listeners : {})}
    >
      <div className="flex items-center justify-between">
        <div className="font-medium truncate">
          {column.property?.name || 'Column'}
        </div>
        
        {sortIndicator}
      </div>
      
      {resizeHandle}
    </div>
  );
});

