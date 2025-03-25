// components/CollaborativeTable/EnhancedTableToolbar.tsx
import { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useTableStore } from '@/components/CollaborativeTable/store/tableStore';
import { useTableColumns } from '@/components/CollaborativeTable/hooks/useSupabaseQuery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// import { usePresenceStore } from '@/components/CollaborativeTable/store/presenceStore'; // Commented out for now
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { 
  Search, 
  SlidersHorizontal, 
  Eye, 
  Download, 
  Plus, 
  Users, 
  Filter, 
  Columns, 
  ArrowUpDown,
  MoreHorizontal,
  Trash2,
  UserCircle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDebouncedCallback } from '@/components/CollaborativeTable/hooks/useDebouncedCallback';

interface EnhancedTableToolbarProps {
  blockId: string;
  showCollaborators?: boolean;
  onAddRow?: () => void;
  onDeleteSelected?: () => void;
}

/**
 * Enhanced toolbar component for the collaborative table
 * - Provides filtering, sorting, view controls
 * - Shows active collaborators
 * - Responsive design that works on all screen sizes
 * - Uses shadcn components for consistent styling
 */
export const EnhancedTableToolbar = memo(function EnhancedTableToolbar({ 
  blockId,
  showCollaborators = true,
  onAddRow,
  onDeleteSelected
}: EnhancedTableToolbarProps) {
  const tableStore = useTableStore();
  // const presenceStore = usePresenceStore(); // Commented out for now
  const { data: columns } = useTableColumns(blockId);
  const [searchValue, setSearchValue] = useState(tableStore.filters.global || '');
  
  // Use debounced callback instead of useDebounce
  const debouncedSearch = useDebouncedCallback((value: string) => {
    if (value) {
      tableStore.setFilter('global', value);
    } else {
      tableStore.clearFilter('global');
    }
  }, 300);
  
  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  }, [debouncedSearch]);
  
  // Handle column visibility toggle
  const handleColumnVisibilityChange = useCallback((columnId: string, isVisible: boolean) => {
    if (isVisible) {
      tableStore.setVisibleColumns([...tableStore.visibleColumns, columnId]);
    } else {
      tableStore.setVisibleColumns(
        tableStore.visibleColumns.filter(id => id !== columnId)
      );
    }
  }, [tableStore]);
  
  // Active filters count
  const activeFilterCount = Object.keys(tableStore.filters).length;
  
  // Calculate visible column count
  const visibleColumnCount = columns?.filter(col => 
    !col.is_hidden && tableStore.visibleColumns.includes(col.id)
  ).length || 0;
  
  // State to control collaborators button visibility
  // const [showCollaboratorsButton, setShowCollaboratorsButton] = useState(false);
  // const [stableUserCount, setStableUserCount] = useState(0);
  // const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // const lastCountsRef = useRef<number[]>([]);

  // Get active users for presence display
  // const activeUsers = presenceStore?.activeUsers || [];
  
  // Memoize active users count to prevent unnecessary re-renders
  // const activeUsersCount = useMemo(() => activeUsers.length, [activeUsers]);
  // const activeUsersRef = useRef(activeUsers);
  
  // Memoize the collaborators section for rendering to minimize re-renders
  // const collaboratorsSection = useMemo(() => {
  //   return {
  //     activeUsers,
  //     shouldRender: showCollaboratorsButton,
  //     stableUserCount
  //   };
  // }, [activeUsers, showCollaboratorsButton, stableUserCount]);
  
  // Update button visibility with improved stability
  // useEffect(() => {
  //   // Skip processing if the users array references are the same
  //   // This acts as an additional safeguard against unnecessary runs
  //   if (activeUsersRef.current === activeUsers) return;
  //   
  //   // Store the latest reference for future comparison
  //   activeUsersRef.current = activeUsers;
  //   
  //   // Add latest count to history
  //   lastCountsRef.current = [...lastCountsRef.current, activeUsersCount].slice(-5);
  //   
  //   // Cancel any pending timer
  //   if (debounceTimerRef.current) {
  //     clearTimeout(debounceTimerRef.current);
  //   }
  //   
  //   // Create new timer to check stability
  //   debounceTimerRef.current = setTimeout(() => {
  //     // Only show/update the UI when we've seen a stable number for a while
  //     if (lastCountsRef.current.length >= 3) {
  //       const latestValues = lastCountsRef.current.slice(-3);
  //       // Check if the last 3 values have been stable
  //       const allSame = latestValues.every(count => count === latestValues[0]);
  //       
  //       if (allSame) {
  //         // Only update state if there's an actual change
  //         if (stableUserCount !== latestValues[0]) {
  //           setStableUserCount(latestValues[0]);
  //         }
  //         
  //         // Only update button visibility when needed
  //         const shouldShowButton = showCollaborators && latestValues[0] > 0;
  //         if (showCollaboratorsButton !== shouldShowButton) {
  //           setShowCollaboratorsButton(shouldShowButton);
  //         }
  //       }
  //     }
  //   }, 1500); // Longer delay for better stability
  //   
  //   return () => {
  //     if (debounceTimerRef.current) {
  //       clearTimeout(debounceTimerRef.current);
  //     }
  //   };
  // }, [showCollaborators, activeUsersCount, activeUsers, stableUserCount, showCollaboratorsButton]);
  
  return (
    <div className="border-b px-2 py-2 bg-white sticky top-0 z-20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 flex-grow">
          {/* Search box */}
          <div className="relative w-full md:w-64 flex-grow md:flex-grow-0">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search table..."
              className="pl-8 h-9 w-full"
              value={searchValue}
              onChange={handleSearchChange}
            />
          </div>
          
          {/* Filters button/dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 py-0.5 px-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Filter by column</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-80">
                {columns?.map(column => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={!!tableStore.filters[column.property_id]}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        tableStore.setFilter(column.property_id, '');
                      } else {
                        tableStore.clearFilter(column.property_id);
                      }
                    }}
                  >
                    {column.property?.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </ScrollArea>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => tableStore.clearAllFilters()}
              >
                Clear all filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Sort button/dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1">
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">Sort</span>
                {tableStore.sortColumn && columns && (
                  <Badge variant="secondary" className="ml-1">
                    {columns.find(col => col.property_id === tableStore.sortColumn || col.id === tableStore.sortColumn)?.property?.name || 'Unknown'} ({tableStore.sortDirection})
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-80">
                {columns?.map(column => (
                  <DropdownMenu key={column.id}>
                    <DropdownMenuTrigger asChild>
                      <DropdownMenuItem>
                        {column.property?.name}
                        {tableStore.sortColumn === column.property_id && (
                          <Badge variant="outline" className="ml-auto">
                            {tableStore.sortDirection}
                          </Badge>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem 
                        onClick={() => tableStore.setSort(column.property_id, 'asc')}
                      >
                        Ascending
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => tableStore.setSort(column.property_id, 'desc')}
                      >
                        Descending
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))}
              </ScrollArea>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => tableStore.clearSort()}>
                Clear sorting
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Columns button/dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1">
                <Columns className="h-4 w-4" />
                <span className="hidden sm:inline">Columns</span>
                <Badge variant="secondary" className="ml-1">
                  {visibleColumnCount}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-80">
                {columns?.map(column => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={tableStore.visibleColumns.includes(column.id)}
                    onCheckedChange={(checked) => {
                      handleColumnVisibilityChange(column.id, checked);
                    }}
                  >
                    {column.property?.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </ScrollArea>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  // Reset to default column visibility
                  tableStore.setVisibleColumns(
                    columns?.filter(col => !col.is_hidden).map(col => col.id) || []
                  );
                }}
              >
                Reset to default
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Collaborators button/sheet - Commented out for now */}
          {/* {collaboratorsSection.shouldRender && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Collaborators</span>
                  <Badge variant="secondary" className="ml-1">
                    {collaboratorsSection.stableUserCount}
                  </Badge>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Active Collaborators</SheetTitle>
                  <SheetDescription>
                    People currently viewing or editing this table
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  {collaboratorsSection.activeUsers.map(user => (
                    <div key={user.user_id} className="flex items-center gap-3">
                      <Avatar>
                        {user.user_avatar ? (
                          <AvatarImage src={user.user_avatar} />
                        ) : (
                          <AvatarFallback>
                            <UserCircle className="h-5 w-5" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.user_name}</p>
                        <p className="text-xs text-gray-500">
                          Active {new Date(user.last_activity_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          )} */}
          
          {/* Export button/dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {/* Export as CSV logic */}}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {/* Export as Excel logic */}}>
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {/* Print view logic */}}>
                Print view
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Add row button */}
          <Button size="sm" className="h-9 gap-1" onClick={onAddRow}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add row</span>
          </Button>
          
          {/* More actions (only show if rows are selected) */}
          {tableStore.selectedRowIds.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {tableStore.selectedRowIds.length} row{tableStore.selectedRowIds.length > 1 ? 's' : ''} selected
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onDeleteSelected}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      {/* Active filters display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(tableStore.filters).map(([key, value]) => {
            if (key === 'global') return null; // Skip global search filter
            
            const column = columns?.find(col => col.property_id === key);
            if (!column) return null;
            
            return (
              <Badge key={key} variant="outline" className="gap-1 px-2 py-1">
                <span className="font-medium">{column.property?.name}:</span>
                <span>{value}</span>
                <button
                  className="ml-1 text-gray-500 hover:text-gray-700"
                  onClick={() => tableStore.clearFilter(key)}
                >
                  ×
                </button>
              </Badge>
            );
          })}
          
          {activeFilterCount > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => tableStore.clearAllFilters()}
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
});