'use client';

// lib/context/TableContext.tsx
import { createContext, useContext, ReactNode, useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Column, Requirement, RequirementStatus, RequirementPriority, RequirementLevel } from '@/components/Canvas/types';
import { useTableViewStore } from '@/components/Canvas/lib/store/tableStore';
import { useBlock } from '@/components/Canvas/lib/providers/BlockContext';
import { useRealTimeUpdates } from '@/components/Canvas/lib/hooks/utils/useRealTimeUpdates';

// Create a stable empty array reference to avoid unnecessary re-renders
const EMPTY_ARRAY: any[] = [];

interface TableContextValue {
  // Table data
  columns: Column[];
  visibleColumns: Column[];
  requirements: Requirement[];
  filteredRequirements: Requirement[];
  
  // View state
  viewMode: 'table' | 'kanban' | 'gantt' | 'calendar';
  setViewMode: (mode: 'table' | 'kanban' | 'gantt' | 'calendar') => void;
  
  // Column visibility
  toggleColumnVisibility: (columnId: string) => void;
  setVisibleColumns: (columnIds: string[]) => void;
  
  // Column width
  columnWidths: Record<string, number>;
  setColumnWidth: (columnId: string, width: number) => void;
  
  // Sorting
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  setSort: (columnId: string | null, direction?: 'asc' | 'desc') => void;
  
  // Filtering
  filters: {
    status?: RequirementStatus[];
    priority?: RequirementPriority[];
    level?: RequirementLevel[];
    search: string;
    customFilters: Record<string, any[]>;
  };
  setFilter: <T extends keyof TableContextValue['filters']>(
    filterType: T,
    value: TableContextValue['filters'][T]
  ) => void;
  setCustomFilter: (propertyId: string, values: any[]) => void;
  clearFilters: () => void;
  
  // Grouping
  groupByProperty: string | null;
  setGroupByProperty: (propertyId: string | null) => void;
  groupedRequirements: Record<string, Requirement[]>;
  
  // Row actions
  pinnedRows: string[];
  toggleRowPin: (requirementId: string) => void;
  
  // Cell editing
  startCellEdit: (requirementId: string, propertyId: string) => void;
  endCellEdit: (save: boolean) => void;
  currentEditCell: { requirementId: string, propertyId: string } | null;
}

const TableContext = createContext<TableContextValue | null>(null);

export function TableProvider({
  children,
  blockId
}: {
  children: ReactNode;
  blockId: string;
}) {
  // Get block data
  const { columns, requirements } = useBlock();
  
  // Get table view state from Zustand
  const {
    viewMode,
    setViewMode,
    filters,
    setFilter,
    setCustomFilter,
    clearFilters,
    sortColumn,
    sortDirection,
    setSort,
    visibleColumns: visibleColumnIds,
    setVisibleColumns: setVisibleColumnsIds,
    toggleColumnVisibility: toggleColumnVisibilityId,
    columnWidths,
    setColumnWidth,
    groupByProperty,
    setGroupByProperty,
    pinnedRows: pinnedRowsMap,
    toggleRowPin: toggleRowPinFn
  } = useTableViewStore();
  
  // Use refs to maintain stable identity for callback dependencies
  const blockIdRef = useRef(blockId);
  blockIdRef.current = blockId;
  
  // Get visible columns
  const visibleColumns = useMemo(() => {
    const visibleIds = visibleColumnIds[blockId] || columns.map(col => col.id);
    return columns.filter(col => visibleIds.includes(col.id));
  }, [columns, visibleColumnIds, blockId]);
  
  // Cell editing state
  const [currentEditCell, setCurrentEditCell] = useState<{ requirementId: string, propertyId: string } | null>(null);
  
  // Pinned rows for this block
  const pinnedRows = useMemo(() => {
    return pinnedRowsMap[blockId] || EMPTY_ARRAY;
  }, [pinnedRowsMap, blockId]);
  
  // Toggle column visibility wrapper - stable reference
  const toggleColumnVisibility = useCallback((columnId: string) => {
    toggleColumnVisibilityId(blockIdRef.current, columnId);
  }, [toggleColumnVisibilityId]);
  
  // Set visible columns wrapper - stable reference
  const setVisibleColumns = useCallback((columnIds: string[]) => {
    setVisibleColumnsIds(blockIdRef.current, columnIds);
  }, [setVisibleColumnsIds]);
  
  // Toggle row pin wrapper - stable reference
  const toggleRowPin = useCallback((requirementId: string) => {
    toggleRowPinFn(blockIdRef.current, requirementId);
  }, [toggleRowPinFn]);
  
  // Start cell edit - stable reference
  const startCellEdit = useCallback((requirementId: string, propertyId: string) => {
    setCurrentEditCell({ requirementId, propertyId });
  }, []);
  
  // End cell edit - stable reference
  const endCellEdit = useCallback((save: boolean) => {
    setCurrentEditCell(null);
  }, []);
  
  // Apply filters and sorting to requirements
  const filteredRequirements = useMemo(() => {
    let filtered = [...requirements];
    
    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(req => filters.status?.includes(req.status));
    }
    
    // Apply priority filter
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(req => filters.priority?.includes(req.priority));
    }
    
    // Apply level filter
    if (filters.level && filters.level.length > 0) {
      filtered = filtered.filter(req => filters.level?.includes(req.level));
    }
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(req => 
        req.name.toLowerCase().includes(searchLower) ||
        (req.description && req.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply custom property filters
    if (Object.keys(filters.customFilters).length > 0) {
      filtered = filtered.filter(req => {
        // Check each custom filter
        for (const [propertyId, values] of Object.entries(filters.customFilters)) {
          if (values.length === 0) continue;
          
          const propValue = req.properties?.[propertyId];
          if (propValue === undefined) return false;
          
          // Handle different value types
          if (Array.isArray(propValue)) {
            // For array values, check if there's any overlap
            const hasMatch = propValue.some(val => values.includes(val));
            if (!hasMatch) return false;
          } else {
            // For scalar values, check if it's in the filter values
            if (!values.includes(propValue)) return false;
          }
        }
        return true;
      });
    }
    
    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue, bValue;
        
        // Special handling for standard fields
        if (sortColumn === 'name') {
          aValue = a.name;
          bValue = b.name;
        } else if (sortColumn === 'status') {
          aValue = a.status;
          bValue = b.status;
        } else if (sortColumn === 'priority') {
          aValue = a.priority;
          bValue = b.priority;
        } else {
          // Custom property
          aValue = a.properties?.[sortColumn];
          bValue = b.properties?.[sortColumn];
        }
        
        // Handle undefined values
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;
        if (aValue === bValue) return 0;
        
        // Sort based on value type
        if (typeof aValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else if (typeof aValue === 'number') {
          return sortDirection === 'asc'
            ? aValue - bValue
            : bValue - aValue;
        } else if (aValue instanceof Date && bValue instanceof Date) {
          return sortDirection === 'asc'
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
        }
        
        // Default string comparison
        return sortDirection === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }
    
    // Put pinned rows first
    if (pinnedRows.length > 0) {
      filtered = [
        ...filtered.filter(req => pinnedRows.includes(req.id)),
        ...filtered.filter(req => !pinnedRows.includes(req.id))
      ];
    }
    
    return filtered;
  }, [requirements, filters, sortColumn, sortDirection, pinnedRows]);
  
  // Apply throttling to filteredRequirements to reduce update frequency
  // Use our new hook with a custom comparison function for better performance
  const throttledFilteredRequirements = useRealTimeUpdates(filteredRequirements, 250, 
    (prev, next) => {
      // If lengths differ, they're definitely different
      if (prev.length !== next.length) return false;
      
      // Check if the IDs are the same and in the same order
      // This is a fast way to check if the arrays contain the same requirements
      return prev.every((req, index) => req.id === next[index].id);
    }
  );
  
  // Group requirements if a groupBy property is set - memoize the result
  const groupedRequirements = useMemo(() => {
    if (!groupByProperty) {
      return { '': throttledFilteredRequirements };
    }
    
    return throttledFilteredRequirements.reduce((groups, req) => {
      // Get the group value
      let groupValue: string;
      
      // Special handling for standard fields
      if (groupByProperty === 'status') {
        groupValue = req.status;
      } else if (groupByProperty === 'priority') {
        groupValue = req.priority;
      } else if (groupByProperty === 'level') {
        groupValue = req.level;
      } else {
        // Custom property
        groupValue = String(req.properties?.[groupByProperty] || 'None');
      }
      
      // Initialize group if it doesn't exist
      if (!groups[groupValue]) {
        groups[groupValue] = [];
      }
      
      // Add requirement to group
      groups[groupValue].push(req);
      
      return groups;
    }, {} as Record<string, Requirement[]>);
  }, [throttledFilteredRequirements, groupByProperty]);
  
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // Table data
    columns,
    visibleColumns,
    requirements,
    filteredRequirements: throttledFilteredRequirements, // Use throttled version
    
    // View state
    viewMode,
    setViewMode,
    
    // Column visibility
    toggleColumnVisibility,
    setVisibleColumns,
    
    // Column width
    columnWidths,
    setColumnWidth,
    
    // Sorting
    sortColumn,
    sortDirection,
    setSort,
    
    // Filtering
    filters,
    setFilter,
    setCustomFilter,
    clearFilters,
    
    // Grouping
    groupByProperty,
    setGroupByProperty,
    groupedRequirements,
    
    // Row actions
    pinnedRows,
    toggleRowPin,
    
    // Cell editing
    startCellEdit,
    endCellEdit,
    currentEditCell
  }), [
    columns,
    visibleColumns,
    requirements,
    throttledFilteredRequirements, // Use throttled version
    viewMode,
    setViewMode,
    toggleColumnVisibility,
    setVisibleColumns,
    columnWidths,
    setColumnWidth,
    sortColumn,
    sortDirection,
    setSort,
    filters,
    setFilter,
    setCustomFilter,
    clearFilters,
    groupByProperty,
    setGroupByProperty,
    groupedRequirements,
    pinnedRows,
    toggleRowPin,
    startCellEdit,
    endCellEdit,
    currentEditCell
  ]);
  
  return (
    <TableContext.Provider value={contextValue}>
      {children}
    </TableContext.Provider>
  );
}

// Use a memoized hook to prevent unnecessary context lookups
export function useTable() {
  const context = useContext(TableContext);
  
  if (!context) {
    throw new Error('useTable must be used within a TableProvider');
  }
  
  return context;
}