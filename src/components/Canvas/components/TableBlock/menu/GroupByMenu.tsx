// components/canvas/TableBlock/menu/GroupByMenu.tsx
'use client';

import { useRef } from 'react';
import { useTable } from '@/components/Canvas/lib/providers/TableContext';
import { useBlock } from '@/components/Canvas/lib/providers/BlockContext';
import { useOnClickOutside } from '@/components/Canvas/lib/hooks/utils/useOnClickOutside';

interface GroupByMenuProps {
  onClose: () => void;
  blockId: string;
}

export function GroupByMenu({ onClose, blockId }: GroupByMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { columns } = useBlock();
  const { groupByProperty, setGroupByProperty } = useTable();
  
  // Close on click outside
  useOnClickOutside(menuRef as React.RefObject<HTMLElement>, onClose);
  
  return (
    <div 
      ref={menuRef}
      className="group-by-menu absolute right-0 top-8 w-64 bg-white border rounded-md shadow-lg z-10"
    >
      <div className="menu-header p-2 border-b bg-gray-50">
        <h3 className="font-medium text-sm">Group By</h3>
      </div>
      
      <div className="menu-body p-2 max-h-80 overflow-y-auto">
        <div className="group-options space-y-1">
          <label className="flex items-center p-1 hover:bg-gray-50 rounded">
            <input
              type="radio"
              name="group-by"
              value=""
              checked={!groupByProperty}
              onChange={() => setGroupByProperty(null)}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-sm">None</span>
          </label>
          
          <label className="flex items-center p-1 hover:bg-gray-50 rounded">
            <input
              type="radio"
              name="group-by"
              value="status"
              checked={groupByProperty === 'status'}
              onChange={() => setGroupByProperty('status')}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-sm">Status</span>
          </label>
          
          <label className="flex items-center p-1 hover:bg-gray-50 rounded">
            <input
              type="radio"
              name="group-by"
              value="priority"
              checked={groupByProperty === 'priority'}
              onChange={() => setGroupByProperty('priority')}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-sm">Priority</span>
          </label>
          
          {/* Show options for select properties that can be used for grouping */}
          {columns
            .filter(col => col.property?.property_type === 'select')
            .map(col => (
              <label 
                key={col.id} 
                className="flex items-center p-1 hover:bg-gray-50 rounded"
              >
                <input
                  type="radio"
                  name="group-by"
                  value={col.property_id}
                  checked={groupByProperty === col.property_id}
                  onChange={() => setGroupByProperty(col.property_id)}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm">{col.property?.name}</span>
              </label>
            ))}
        </div>
      </div>
      
      <div className="menu-footer p-2 border-t flex justify-between">
        <button
          className="text-xs text-gray-600 hover:text-gray-900"
          onClick={() => setGroupByProperty(null)}
        >
          Clear grouping
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


