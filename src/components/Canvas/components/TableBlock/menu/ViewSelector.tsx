// components/canvas/TableBlock/menu/ViewSelector.tsx
'use client';

import { useState, useRef } from 'react';
import { useOnClickOutside } from '@/components/Canvas/lib/hooks/utils/useOnClickOutside';

interface ViewSelectorProps {
  currentView: 'table' | 'kanban' | 'gantt' | 'calendar';
  onViewChange: (view: 'table' | 'kanban' | 'gantt' | 'calendar') => void;
}

export function ViewSelector({ currentView, onViewChange }: ViewSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Close on click outside
  useOnClickOutside(menuRef as React.RefObject<HTMLElement>, () => setIsOpen(false));
  
  const viewOptions = [
    { id: 'table', label: 'Table', icon: '📊' },
    { id: 'kanban', label: 'Kanban', icon: '📋' },
    { id: 'gantt', label: 'Gantt', icon: '📅' },
    { id: 'calendar', label: 'Calendar', icon: '📆' }
  ];
  
  const currentViewOption = viewOptions.find(v => v.id === currentView) || viewOptions[0];
  
  return (
    <div className="view-selector relative" ref={menuRef}>
      <button
        className="flex items-center p-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="mr-1">{currentViewOption.icon}</span>
        <span>{currentViewOption.label}</span>
      </button>
      
      {isOpen && (
        <div className="view-menu absolute right-0 top-8 w-40 bg-white border rounded-md shadow-lg z-10">
          <div className="menu-body">
            {viewOptions.map((view) => (
              <button
                key={view.id}
                className={`w-full text-left p-2 text-sm hover:bg-gray-100 flex items-center ${
                  currentView === view.id ? 'bg-blue-50 text-blue-700' : ''
                }`}
                onClick={() => {
                  onViewChange(view.id as any);
                  setIsOpen(false);
                }}
              >
                <span className="mr-2">{view.icon}</span>
                <span>{view.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

