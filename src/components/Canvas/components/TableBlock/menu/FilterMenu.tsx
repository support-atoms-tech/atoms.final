// components/canvas/TableBlock/menu/FilterMenu.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useTable } from '@/components/Canvas/lib/providers/TableContext';
import { useBlock } from '@/components/Canvas/lib/providers/BlockContext';
import { Property, RequirementPriority, RequirementStatus } from '@/components/Canvas/types';
import { useOnClickOutside } from '@/components/Canvas/lib/hooks/utils/useOnClickOutside';

interface FilterMenuProps {
  onClose: () => void;
  blockId: string;
}

export function FilterMenu({ onClose, blockId }: FilterMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { columns } = useBlock();
  const { filters, setFilter, setCustomFilter, clearFilters } = useTable();
  
  // Track search input separately to avoid filtering on every keystroke
  const [searchInput, setSearchInput] = useState(filters.search || '');
  
  // Close on click outside
  useOnClickOutside(menuRef as React.RefObject<HTMLElement>, onClose);
  
  // Apply search filter when user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilter('search', searchInput);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchInput, setFilter]);
  
  return (
    <div 
      ref={menuRef}
      className="filter-menu absolute right-0 top-8 w-72 bg-white border rounded-md shadow-lg z-10"
    >
      <div className="menu-header p-2 border-b bg-gray-50">
        <h3 className="font-medium text-sm">Filter</h3>
      </div>
      
      <div className="menu-body p-2 max-h-80 overflow-y-auto">
        <div className="search-filter mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full p-1 border rounded text-sm"
            placeholder="Search in table..."
          />
        </div>
        
        <div className="status-filter mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <div className="flex flex-wrap gap-1">
            {['todo', 'in_progress', 'review', 'done'].map((status) => (
              <label key={status} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={filters.status?.includes(status as RequirementStatus) || false}
                  onChange={(e) => {
                    const currentStatus = filters.status || [];
                    if (e.target.checked) {
                      setFilter('status', [...currentStatus, status as RequirementStatus]);
                    } else {
                      setFilter('status', currentStatus.filter(s => s !== status));
                    }
                  }}
                  className="form-checkbox h-3 w-3"
                />
                <span className="ml-1 text-xs capitalize">{status.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="priority-filter mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <div className="flex flex-wrap gap-1">
            {['low', 'medium', 'high', 'critical'].map((priority) => (
              <label key={priority} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={filters.priority?.includes(priority as RequirementPriority) || false}
                  onChange={(e) => {
                    const currentPriority = filters.priority || [];
                    if (e.target.checked) {
                      setFilter('priority', [...currentPriority, priority as RequirementPriority]);
                    } else {
                      setFilter('priority', currentPriority.filter(p => p !== priority));
                    }
                  }}
                  className="form-checkbox h-3 w-3"
                />
                <span className="ml-1 text-xs capitalize">{priority}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Show filters for custom properties */}
        {columns
          .filter(col => col.property?.property_type === 'select')
          .map(col => {
            const property = col.property!;
            const propId = property.id;
            const values = property.options?.values || [];
            
            return (
              <div key={propId} className="custom-filter mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {property.name}
                </label>
                <div className="flex flex-wrap gap-1">
                  {values.map((value: string) => (
                    <label key={value} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.customFilters[propId]?.includes(value) || false}
                        onChange={(e) => {
                          const currentValues = filters.customFilters[propId] || [];
                          if (e.target.checked) {
                            setCustomFilter(propId, [...currentValues, value]);
                          } else {
                            setCustomFilter(propId, currentValues.filter(v => v !== value));
                          }
                        }}
                        className="form-checkbox h-3 w-3"
                      />
                      <span className="ml-1 text-xs">{value}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
      
      <div className="menu-footer p-2 border-t flex justify-between">
        <button
          className="text-xs text-gray-600 hover:text-gray-900"
          onClick={clearFilters}
        >
          Clear all filters
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

