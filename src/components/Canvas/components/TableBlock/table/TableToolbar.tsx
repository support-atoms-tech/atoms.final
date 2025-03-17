// components/canvas/table/TableToolbar.tsx
'use client';

import { useState } from 'react';
import { useTable } from '@/components/Canvas/lib/providers/TableContext';
import { FilterMenu } from '@/components/Canvas/components/TableBlock/menu/FilterMenu';
import { SortMenu } from '@/components/Canvas/components/TableBlock/menu/SortMenu';
import { ViewSelector } from '@/components/Canvas/components/TableBlock/menu/ViewSelector';
import { ColumnVisibilityMenu } from '@/components/Canvas/components/TableBlock/menu/ColumnVisibilityMenu';
import { GroupByMenu } from '@/components/Canvas/components/TableBlock/menu/GroupByMenu';

interface TableToolbarProps {
  blockId: string;
}

export function TableToolbar({ blockId }: TableToolbarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [groupByOpen, setGroupByOpen] = useState(false);
  
  const { viewMode, setViewMode } = useTable();
  
  return (
    <div className="table-toolbar flex items-center space-x-2">
      <div className="relative">
        <button
          className="toolbar-button p-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
          onClick={() => setFilterOpen(!filterOpen)}
        >
          Filter
        </button>
        {filterOpen && (
          <FilterMenu onClose={() => setFilterOpen(false)} blockId={blockId} />
        )}
      </div>
      
      <div className="relative">
        <button
          className="toolbar-button p-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
          onClick={() => setSortOpen(!sortOpen)}
        >
          Sort
        </button>
        {sortOpen && (
          <SortMenu onClose={() => setSortOpen(false)} blockId={blockId} />
        )}
      </div>
      
      <div className="relative">
        <button
          className="toolbar-button p-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
          onClick={() => setColumnsOpen(!columnsOpen)}
        >
          Columns
        </button>
        {columnsOpen && (
          <ColumnVisibilityMenu onClose={() => setColumnsOpen(false)} blockId={blockId} />
        )}
      </div>
      
      <div className="relative">
        <button
          className="toolbar-button p-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
          onClick={() => setGroupByOpen(!groupByOpen)}
        >
          Group
        </button>
        {groupByOpen && (
          <GroupByMenu onClose={() => setGroupByOpen(false)} blockId={blockId} />
        )}
      </div>
      
      <ViewSelector
        currentView={viewMode}
        onViewChange={(view) => setViewMode(view)}
      />
    </div>
  );
}