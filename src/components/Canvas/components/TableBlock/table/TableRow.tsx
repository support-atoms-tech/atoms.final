// components/canvas/table/TableRow.tsx
'use client';

import React, { memo, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Requirement, Column } from '@/components/Canvas/types';
import { useTable } from '@/components/Canvas/lib/providers/TableContext';
import { useDocument } from '@/components/Canvas/lib/providers/DocumentContext';
import { TableCell } from '@/components/Canvas/components/TableBlock/table/TableCell';

interface TableRowProps {
  requirement: Requirement;
  columns: Column[];
}

export const TableRow = memo(function TableRow({ requirement, columns }: TableRowProps) {
  const { editMode } = useDocument();
  const { pinnedRows, toggleRowPin } = useTable();
  
  // Draggable setup - memoize to prevent unnecessary recreations
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: requirement.id,
    disabled: !editMode
  });
  
  const isPinned = useMemo(() => {
    return pinnedRows.includes(requirement.id);
  }, [pinnedRows, requirement.id]);
  
  // Memoize cells to prevent unnecessary re-renders
  const tableCells = useMemo(() => {
    return columns.map(column => (
      <TableCell
        key={column.id}
        requirementId={requirement.id}
        column={column}
        propertyId={column.property_id}
        width={column.width || 150}
      />
    ));
  }, [columns, requirement.id]);
  
  // Memoize the row styles and class to prevent unnecessary recalculations
  const rowClassNames = useMemo(() => {
    return `table-row flex border-b hover:bg-gray-50 ${
      isDragging ? 'opacity-50' : ''
    } ${isPinned ? 'bg-yellow-50' : ''}`;
  }, [isDragging, isPinned]);
  
  // Memoize the transform style to prevent unnecessary recreations
  const transformStyle = useMemo(() => {
    return transform ? { transform: CSS.Transform.toString(transform) } : undefined;
  }, [transform]);
  
  // Memoize attributes and listeners to prevent unnecessary recreations
  const dragProps = useMemo(() => {
    return editMode ? { ...attributes, ...listeners } : {};
  }, [editMode, attributes, listeners]);
  
  return (
    <div
      ref={setNodeRef}
      className={rowClassNames}
      style={transformStyle}
      {...dragProps}
    >
      {tableCells}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  if (prevProps.requirement.id !== nextProps.requirement.id) {
    return false;
  }
  
  // Check if columns array has changed in a way that would affect rendering
  if (prevProps.columns.length !== nextProps.columns.length) {
    return false;
  }
  
  // Check if any relevant properties of the requirement have changed
  const prevReq = prevProps.requirement;
  const nextReq = nextProps.requirement;
  
  // Compare only the properties that affect rendering
  const hasRequirementChanged = 
    prevReq.updated_at !== nextReq.updated_at ||
    prevReq.status !== nextReq.status ||
    prevReq.priority !== nextReq.priority;
    
  if (hasRequirementChanged) {
    return false;
  }
  
  // Check if column IDs or order has changed
  for (let i = 0; i < prevProps.columns.length; i++) {
    if (
      prevProps.columns[i].id !== nextProps.columns[i].id ||
      prevProps.columns[i].property_id !== nextProps.columns[i].property_id ||
      prevProps.columns[i].is_hidden !== nextProps.columns[i].is_hidden
    ) {
      return false;
    }
  }
  
  return true;
});