// RefactoredTableToolbar.tsx - Toolbar with shadcn UI components
'use client';

import { useState } from 'react';
import { useTableBridge } from './useRfTableBridge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { FilterMenu } from '@/components/Canvas/components/TableBlock/menu/FilterMenu';
import { SortMenu } from '@/components/Canvas/components/TableBlock/menu/SortMenu';
import { ColumnVisibilityMenu } from '@/components/Canvas/components/TableBlock/menu/ColumnVisibilityMenu';
import { GroupByMenu } from '@/components/Canvas/components/TableBlock/menu/GroupByMenu';

interface RefactoredTableToolbarProps {
  blockId: string;
}

/**
 * Modern toolbar for the table using shadcn UI components
 * Provides access to filtering, sorting, and view options
 */
export function RefactoredTableToolbar({ blockId }: RefactoredTableToolbarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [groupByOpen, setGroupByOpen] = useState(false);
  
  const { viewMode, setViewMode } = useTableBridge(blockId);
  
  return (
    <div className="table-toolbar flex items-center space-x-2 font-mono">
      <Button 
        variant="outline"
        size="sm"
        onClick={() => setFilterOpen(!filterOpen)}
        className="font-mono text-xs"
      >
        Filter
      </Button>
      {filterOpen && (
        <FilterMenu onClose={() => setFilterOpen(false)} blockId={blockId} />
      )}
      
      <Button 
        variant="outline"
        size="sm"
        onClick={() => setSortOpen(!sortOpen)}
        className="font-mono text-xs"
      >
        Sort
      </Button>
      {sortOpen && (
        <SortMenu onClose={() => setSortOpen(false)} blockId={blockId} />
      )}
      
      <Button 
        variant="outline"
        size="sm"
        onClick={() => setColumnsOpen(!columnsOpen)}
        className="font-mono text-xs"
      >
        Columns
      </Button>
      {columnsOpen && (
        <ColumnVisibilityMenu onClose={() => setColumnsOpen(false)} blockId={blockId} />
      )}
      
      <Button 
        variant="outline"
        size="sm"
        onClick={() => setGroupByOpen(!groupByOpen)}
        className="font-mono text-xs"
      >
        Group
      </Button>
      {groupByOpen && (
        <GroupByMenu onClose={() => setGroupByOpen(false)} blockId={blockId} />
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="font-mono text-xs">
            View: {viewMode}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setViewMode('table')}>
            Table
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setViewMode('kanban')}>
            Kanban
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

