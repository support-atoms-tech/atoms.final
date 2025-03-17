// components/canvas/TableBlock/menu/SortMenu.tsx
'use client';

import { useRef } from 'react';
import { useTable } from '@/components/Canvas/lib/providers/TableContext';
import { useBlock } from '@/components/Canvas/lib/providers/BlockContext';
import { useOnClickOutside } from '@/components/Canvas/lib/hooks/utils/useOnClickOutside';

interface SortMenuProps {
  onClose: () => void;
  blockId: string;
}

export function SortMenu({ onClose, blockId }: SortMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { columns } = useBlock();
  const { sortColumn, sortDirection, setSort } = useTable();
  
  // Close on click outside
  useOnClickOutside(menuRef as React.RefObject<HTMLElement>, onClose);
  
  return (
    <div 
      ref={menuRef}
      className="sort-menu absolute right-0 top-8 w-64 bg-white border rounded-md shadow-lg z-10"
    >
      <div className="menu-header p-2 border-b bg-gray-50">
        <h3 className="font-medium text-sm">Sort</h3>
      </div>
      
      <div className="menu-body p-2 max-h-80 overflow-y-auto">
        <div className="sort-options">
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort by
            </label>
            <select
              value={sortColumn || ''}
              onChange={(e) => setSort(e.target.value || null, sortDirection)}
              className="w-full p-1 border rounded text-sm"
            >
              <option value="">None</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="priority">Priority</option>
              {columns.map(col => (
                <option key={col.id} value={col.property_id}>
                  {col.property?.name}
                </option>
              ))}
            </select>
          </div>
          
          {sortColumn && (
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Direction
              </label>
              <div className="flex space-x-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="direction"
                    value="asc"
                    checked={sortDirection === 'asc'}
                    onChange={() => setSort(sortColumn, 'asc')}
                    className="form-radio h-3 w-3"
                  />
                  <span className="ml-1 text-xs">Ascending (A-Z, 1-9)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="direction"
                    value="desc"
                    checked={sortDirection === 'desc'}
                    onChange={() => setSort(sortColumn, 'desc')}
                    className="form-radio h-3 w-3"
                  />
                  <span className="ml-1 text-xs">Descending (Z-A, 9-1)</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="menu-footer p-2 border-t flex justify-between">
        <button
          className="text-xs text-gray-600 hover:text-gray-900"
          onClick={() => setSort(null)}
        >
          Clear sort
        </button>
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

