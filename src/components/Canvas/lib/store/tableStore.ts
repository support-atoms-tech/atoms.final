'use client';

// lib/store/tableStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  Column, 
  RequirementPriority, 
  RequirementStatus, 
  RequirementLevel
} 
from '@/components/Canvas/types';

interface TableViewState {
  // Filters
  filters: {
    status?: RequirementStatus[];
    priority?: RequirementPriority[]; 
    level?: RequirementLevel[];
    search: string;
    customFilters: Record<string, any[]>;
  };
  
  // Sorting
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  
  // Visible columns (maps blockId -> columnIds[])
  visibleColumns: Record<string, string[]>;
  
  // Column widths (maps columnId -> width)
  columnWidths: Record<string, number>;
  
  // Actions
  setFilter: <T extends keyof TableViewState['filters']>(
    filterType: T,
    value: TableViewState['filters'][T]
  ) => void;
  setCustomFilter: (propertyId: string, values: any[]) => void;
  clearFilters: () => void;
  
  setSort: (columnId: string | null, direction?: 'asc' | 'desc') => void;
  
  setVisibleColumns: (blockId: string, columnIds: string[]) => void;
  toggleColumnVisibility: (blockId: string, columnId: string) => void;
  
  setColumnWidth: (columnId: string, width: number) => void;
  resetColumnWidth: (columnId: string) => void;
  
  // Group by
  groupByProperty: string | null;
  setGroupByProperty: (propertyId: string | null) => void;
  
  // View mode
  viewMode: 'table' | 'kanban' | 'gantt' | 'calendar';
  setViewMode: (mode: 'table' | 'kanban' | 'gantt' | 'calendar') => void;
  
  // Pinned rows (maps blockId -> requirementIds[])
  pinnedRows: Record<string, string[]>;
  toggleRowPin: (blockId: string, requirementId: string) => void;
}

export const useTableViewStore = create<TableViewState>()(
  devtools(
    (set) => ({
      // Filters
      filters: {
        status: undefined,
        priority: undefined,
        level: undefined,
        search: '',
        customFilters: {},
      },
      
      // Sorting
      sortColumn: null,
      sortDirection: 'asc',
      
      // Visible columns
      visibleColumns: {},
      
      // Column widths
      columnWidths: {},
      
      // Actions
      setFilter: (filterType, value) => set((state) => ({
        filters: {
          ...state.filters,
          [filterType]: value
        }
      })),
      setCustomFilter: (propertyId, values) => set((state) => ({
        filters: {
          ...state.filters,
          customFilters: {
            ...state.filters.customFilters,
            [propertyId]: values
          }
        }
      })),
      clearFilters: () => set({
        filters: {
          status: undefined,
          priority: undefined,
          level: undefined,
          search: '',
          customFilters: {},
        }
      }),
      
      setSort: (columnId, direction = 'asc') => set({
        sortColumn: columnId,
        sortDirection: direction
      }),
      
      setVisibleColumns: (blockId, columnIds) => set((state) => ({
        visibleColumns: {
          ...state.visibleColumns,
          [blockId]: columnIds
        }
      })),
      toggleColumnVisibility: (blockId, columnId) => set((state) => {
        const currentColumns = state.visibleColumns[blockId] || [];
        const isVisible = currentColumns.includes(columnId);
        
        let newColumns;
        if (isVisible) {
          newColumns = currentColumns.filter(id => id !== columnId);
        } else {
          newColumns = [...currentColumns, columnId];
        }
        
        return {
          visibleColumns: {
            ...state.visibleColumns,
            [blockId]: newColumns
          }
        };
      }),
      
      setColumnWidth: (columnId, width) => set((state) => ({
        columnWidths: {
          ...state.columnWidths,
          [columnId]: width
        }
      })),
      resetColumnWidth: (columnId) => set((state) => {
        const newWidths = { ...state.columnWidths };
        delete newWidths[columnId];
        return { columnWidths: newWidths };
      }),
      
      // Group by
      groupByProperty: null,
      setGroupByProperty: (propertyId) => set({ groupByProperty: propertyId }),
      
      // View mode
      viewMode: 'table',
      setViewMode: (mode) => set({ viewMode: mode }),
      
      // Pinned rows
      pinnedRows: {},
      toggleRowPin: (blockId, requirementId) => set((state) => {
        const currentPinned = state.pinnedRows[blockId] || [];
        const isPinned = currentPinned.includes(requirementId);
        
        let newPinned;
        if (isPinned) {
          newPinned = currentPinned.filter(id => id !== requirementId);
        } else {
          newPinned = [...currentPinned, requirementId];
        }
        
        return {
          pinnedRows: {
            ...state.pinnedRows,
            [blockId]: newPinned
          }
        };
      })
    })
  )
);