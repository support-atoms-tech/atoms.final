// components/canvas/TableBlock/menu/ColumnVisibilityMenu.tsx
'use client';

import { useRef } from 'react';
import { useTable } from '@/components/Canvas/lib/providers/TableContext';
import { useBlock } from '@/components/Canvas/lib/providers/BlockContext';
import { Column } from '@/components/Canvas/types';
import { useOnClickOutside } from '@/components/Canvas/lib/hooks/utils/useOnClickOutside';

interface ColumnVisibilityMenuProps {
  onClose: () => void;
  blockId: string;
}

export function ColumnVisibilityMenu({ onClose, blockId }: ColumnVisibilityMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { columns } = useBlock();
  const { visibleColumns, toggleColumnVisibility, setVisibleColumns } = useTable();
  
  // Close on click outside
  useOnClickOutside(menuRef as React.RefObject<HTMLElement>, onClose);
  
  // Check if column is visible
  const isColumnVisible = (column: Column) => {
    return visibleColumns.some(col => col.id === column.id);
  };
  
  // Select all columns
  const selectAll = () => {
    setVisibleColumns(columns.map(col => col.id));
  };
  
  // Deselect all columns
  const deselectAll = () => {
    setVisibleColumns([]);
  };
  
  return (
    <div 
      ref={menuRef}
      className="column-visibility-menu absolute right-0 top-8 w-64 bg-white border rounded-md shadow-lg z-10"
    >
      <div className="menu-header p-2 border-b bg-gray-50 flex justify-between items-center">
        <h3 className="font-medium text-sm">Columns</h3>
        <div className="flex space-x-2">
          <button
            className="text-xs text-blue-600 hover:text-blue-800"
            onClick={selectAll}
          >
            All
          </button>
          <button
            className="text-xs text-gray-600 hover:text-gray-900"
            onClick={deselectAll}
          >
            None
          </button>
        </div>
      </div>
      
      <div className="menu-body p-2 max-h-80 overflow-y-auto">
        <div className="column-list space-y-1">
          {columns.map(column => (
            <label key={column.id} className="flex items-center p-1 hover:bg-gray-50 rounded">
              <input
                type="checkbox"
                checked={isColumnVisible(column)}
                onChange={() => toggleColumnVisibility(column.id)}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm">{column.property?.name || 'Column'}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div className="menu-footer p-2 border-t flex justify-end">
        <button
          className="text-xs text-blue-600 hover:text-blue-800"
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </div>
  );
}

