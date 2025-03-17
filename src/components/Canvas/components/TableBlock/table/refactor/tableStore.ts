// tableStore.ts - Headless state management
import { create } from 'zustand';
import { Column, Requirement, Property } from '@/components/Canvas/types';

/**
 * Core table state store that manages all aspects of the table
 * This provides a centralized state management system that connects
 * with our existing service logic
 */
interface TableState {
  // Core data
  columns: Column[];
  requirements: Requirement[];
  properties: Property[];
  
  // UI state
  viewMode: 'table' | 'kanban' | string;
  columnWidths: Record<string, number>;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
  filters: any[];
  groupBy: string | null;
  pinnedRows: string[];
  
  // Actions
  setColumns: (columns: Column[]) => void;
  setRequirements: (requirements: Requirement[]) => void;
  setProperties: (properties: Property[]) => void;
  setViewMode: (mode: string) => void;
  setColumnWidth: (columnId: string, width: number) => void;
  setSort: (columnId: string, direction: 'asc' | 'desc') => void;
  clearSort: () => void;
  setFilters: (filters: any[]) => void;
  setGroupBy: (propertyId: string | null) => void;
  toggleRowPin: (rowId: string) => void;
  addRow: (row: Requirement) => void;
  updateCell: (rowId: string, propertyId: string, value: any) => void;
}

/**
 * Create a Zustand store for managing table state
 * This decouples the UI from state management and allows
 * for easier testing and maintenance
 */
export const useTableStore = create<TableState>((set) => ({
  // Initial state
  columns: [],
  requirements: [],
  properties: [],
  viewMode: 'table',
  columnWidths: {},
  sortColumn: null,
  sortDirection: null,
  filters: [],
  groupBy: null,
  pinnedRows: [],
  
  // Actions
  setColumns: (columns) => set({ columns }),
  setRequirements: (requirements) => set({ requirements }),
  setProperties: (properties) => set({ properties }),
  setViewMode: (viewMode) => set({ viewMode }),
  setColumnWidth: (columnId, width) => 
    set((state) => ({ 
      columnWidths: { ...state.columnWidths, [columnId]: width } 
    })),
  setSort: (columnId, direction) => set({ sortColumn: columnId, sortDirection: direction }),
  clearSort: () => set({ sortColumn: null, sortDirection: null }),
  setFilters: (filters) => set({ filters }),
  setGroupBy: (propertyId) => set({ groupBy: propertyId }),
  toggleRowPin: (rowId) => set((state) => {
    const isPinned = state.pinnedRows.includes(rowId);
    return {
      pinnedRows: isPinned 
        ? state.pinnedRows.filter(id => id !== rowId)
        : [...state.pinnedRows, rowId]
    };
  }),
  addRow: (row) => set((state) => ({ 
    requirements: [...state.requirements, row] 
  })),
  updateCell: (rowId, propertyId, value) => set((state) => ({
    requirements: state.requirements.map(req => 
      req.id === rowId 
        ? { 
            ...req, 
            properties: { ...req.properties, [propertyId]: value } 
          }
        : req
    )
  })),
}));

