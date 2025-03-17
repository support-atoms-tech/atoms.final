// components/canvas/table/TableView.tsx
'use client';

import { useState, useRef, useMemo, useCallback, memo, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useTable } from '@/components/Canvas/lib/providers/TableContext';
import { useDocument } from '@/components/Canvas/lib/providers/DocumentContext';
import { useTableColumns } from '@/components/Canvas/lib/hooks/canvas/useTableColumns';
import { TableHeader } from '@/components/Canvas/components/TableBlock/table/TableHeader';
import { TableRow } from '@/components/Canvas/components/TableBlock/table/TableRow';
import { AddRowButton } from '@/components/Canvas/components/TableBlock/menu/AddRowButton';
import { useTableBlockEditor } from '@/components/Canvas/lib/hooks/canvas/useTableBlockEditor';
import { Column, Requirement } from '@/components/Canvas/types';

// Custom hook to stabilize array references when only length changes
function useStableArray<T>(array: T[]): T[] {
  const previousArrayRef = useRef<T[]>(array);
  const currentLengthRef = useRef<number>(array.length);
  
  // Only update the reference if something other than length has changed
  useEffect(() => {
    const lengthChanged = currentLengthRef.current !== array.length;
    const contentChanged = array.some((item, index) => {
      return index >= previousArrayRef.current.length || 
             item !== previousArrayRef.current[index];
    });
    
    if (contentChanged || !lengthChanged) {
      previousArrayRef.current = array;
    }
    
    currentLengthRef.current = array.length;
  }, [array]);
  
  return previousArrayRef.current;
}

interface TableViewProps {
  blockId: string;
}

export const TableView = memo(function TableView({ blockId }: TableViewProps) {
  const { editMode } = useDocument();
  const { addRequirement, canEdit } = useTableBlockEditor(blockId);
  const { columns, isLoading: isColumnsLoading } = useTableColumns({ blockId });
  const { filteredRequirements } = useTable();
  
  // Stabilize the filteredRequirements reference
  const stableRequirements = useStableArray(filteredRequirements);
  
  // Virtual scrolling for rows
  const parentRef = useRef<HTMLDivElement>(null);
  const [isAddingRow, setIsAddingRow] = useState(false);
  
  // Get visible columns based on display settings
  const visibleColumns = useMemo(() => {
    return columns.filter((column) => !column.is_hidden);
  }, [columns]);
  
  // Memoize filteredRequirements length to prevent unnecessary virtualizer recreations
  const requirementsCount = useMemo(() => stableRequirements.length, [stableRequirements.length]);
  
  // Memoize the virtualizer configuration to prevent recreation on each render
  const rowVirtualizer = useVirtualizer({
    count: requirementsCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5
  });

  // Handle adding new requirement - memoize to prevent recreation on each render
  const handleAddRow = useCallback(async () => {
    if (isAddingRow) return; // Prevent multiple simultaneous adds
    
    setIsAddingRow(true);
    try {
      const newRequirement = await addRequirement();
      // Scroll to the new row after it's added
      if (newRequirement) {
        const newIndex = stableRequirements.length;
        rowVirtualizer.scrollToIndex(newIndex);
      }
    } finally {
      setIsAddingRow(false);
    }
  }, [addRequirement, stableRequirements.length, isAddingRow, rowVirtualizer]);
  
  // Memoize the loading state component
  const loadingComponent = useMemo(() => (
    <div className="p-4 text-center text-gray-500">
      Loading table columns...
    </div>
  ), []);
  
  // Memoize virtual items to prevent unnecessary calculations
  const virtualItems = useMemo(() => rowVirtualizer.getVirtualItems(), [rowVirtualizer]);
  
  // Memoize total size calculation
  const totalSize = useMemo(() => rowVirtualizer.getTotalSize(), [rowVirtualizer]);
  
  // Memoize the add row button to prevent unnecessary re-renders
  const addRowButton = useMemo(() => {
    if (!canEdit) return null;
    
    return (
      <div className="add-row-container p-2 border-t">
        <button
          onClick={handleAddRow}
          disabled={isAddingRow}
          className={`w-full py-2 px-4 text-sm text-gray-600 hover:bg-gray-50 
            border border-dashed border-gray-300 rounded-lg transition-colors
            flex items-center justify-center gap-2
            ${isAddingRow ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}`}
        >
          {isAddingRow ? (
            <>
              <span className="animate-spin">⌛</span>
              Adding row...
            </>
          ) : (
            <>
              <span>+</span>
              Add row
            </>
          )}
        </button>
      </div>
    );
  }, [canEdit, handleAddRow, isAddingRow]);
  
  // Memoize the row rendering function to prevent unnecessary re-renders
  const renderRow = useCallback((virtualRow: any) => {
    const requirement = stableRequirements[virtualRow.index];
    
    return (
      <div
        key={requirement.id}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${virtualRow.size}px`,
          transform: `translateY(${virtualRow.start}px)`
        }}
      >
        <TableRow 
          requirement={requirement}
          columns={visibleColumns}
        />
      </div>
    );
  }, [stableRequirements, visibleColumns]);
  
  if (isColumnsLoading) {
    return loadingComponent;
  }
  
  return (
    <div className="table-view">
      <div className="table-container">
        <TableHeader columns={visibleColumns} />
        
        <div 
          ref={parentRef}
          className="table-body max-h-[500px] overflow-auto"
        >
          <div
            style={{
              height: `${totalSize}px`,
              width: '100%',
              position: 'relative'
            }}
          >
            {virtualItems.map(virtualRow => renderRow(virtualRow))}
          </div>
          
          {addRowButton}
        </div>
      </div>
    </div>
  );
});

