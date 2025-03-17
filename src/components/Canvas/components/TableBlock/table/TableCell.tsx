// components/canvas/table/TableCell.tsx
'use client';

import { useMemo, memo } from 'react';
import { Column, Property } from '@/components/Canvas/types';
import { useBlock } from '@/components/Canvas/lib/providers/BlockContext';
import { useCellEditor } from '@/components/Canvas/lib/hooks/canvas/useCellEditor';
import { useTable } from '@/components/Canvas/lib/providers/TableContext';
import { CellRenderer } from '@/components/Canvas/components/TableBlock/table/CellRenderer';
import { CellEditor } from '@/components/Canvas/components/TableBlock/table/CellEditor';
import { useTableCollaboration } from '@/components/Canvas/components/TableBlock/TableBlock';

interface TableCellProps {
  requirementId: string;
  column: Column;
  propertyId: string;
  width: number;
}

export const TableCell = memo(function TableCell({ requirementId, column, propertyId, width }: TableCellProps) {
  const { columnWidths } = useTable();
  
  // Get requirement and property
  const { requirements } = useBlock();
  const requirement = useMemo(() => 
    requirements.find(req => req.id === requirementId), 
    [requirements, requirementId]
  );
  
  // Ensure column.property exists before using it
  const property = useMemo(() => column.property, [column]);
  
  // Use cell editor hook - we don't need to pass contextId since we're using the shared collaboration context
  const {
    value,
    isEditing,
    canEdit,
    inputRef,
    startEditing,
    stopEditing,
    handleValueChange,
    handleKeyDown,
    handleClickOutside
  } = useCellEditor(requirementId, propertyId, property);
  
  // Get cell width from store or use default
  const cellWidth = columnWidths[column.id] || width;
  
  return (
    <div
      className={`table-cell flex-shrink-0 p-2 ${
        isEditing ? 'editing' : canEdit ? 'can-edit' : ''
      }`}
      style={{ width: `${cellWidth}px` }}
      onClick={() => canEdit && !isEditing && startEditing()}
    >
      {isEditing ? (
        <CellEditor
          value={value}
          property={property!}
          onChange={handleValueChange}
          onKeyDown={handleKeyDown}
          onClickOutside={handleClickOutside}
          ref={inputRef as React.RefObject<HTMLInputElement>}
        />
      ) : (
        <CellRenderer
          value={requirement?.properties?.[propertyId]}
          property={property!}
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.requirementId === nextProps.requirementId &&
    prevProps.propertyId === nextProps.propertyId &&
    prevProps.column.id === nextProps.column.id &&
    prevProps.width === nextProps.width &&
    // Deep comparison of column properties that might affect rendering
    prevProps.column.property_id === nextProps.column.property_id &&
    prevProps.column.is_hidden === nextProps.column.is_hidden
  );
});