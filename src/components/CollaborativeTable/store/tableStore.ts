// store/tableStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Column } from '@/components/CollaborativeTable/types';

interface TableState {
  // UI state
  columnWidths: Record<string, number>;
  setColumnWidth: (columnId: string, width: number) => void;
  
  // Sorting
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
  setSort: (columnId: string, direction: 'asc' | 'desc') => void;
  clearSort: () => void;
  
  // Filtering
  filters: Record<string, any>;
  setFilter: (columnId: string, value: any) => void;
  clearFilter: (columnId: string) => void;
  clearAllFilters: () => void;
  
  // Selection
  selectedRowIds: string[];
  setSelectedRowIds: (rowIds: string[]) => void;
  toggleRowSelection: (rowId: string) => void;
  clearSelection: () => void;
  
  // Pinned rows
  pinnedRows: string[];
  togglePinnedRow: (rowId: string) => void;
  
  // Editing state
  editingCell: { rowId: string; columnId: string } | null;
  setEditingCell: (rowId: string, columnId: string) => void;
  clearEditingCell: () => void;
  
  // Column visibility
  visibleColumns: string[];
  setVisibleColumns: (columnIds: string[]) => void;
  toggleColumnVisibility: (columnId: string) => void;
  
  // Column order
  columnOrder: string[];
  setColumnOrder: (columnIds: string[]) => void;
  moveColumn: (fromIndex: number, toIndex: number) => void;
}

export const useTableStore = create<TableState>()(
  devtools(
    persist(
      (set) => ({
        // Default state
        columnWidths: {},
        setColumnWidth: (columnId, width) => 
          set((state) => ({ 
            columnWidths: { ...state.columnWidths, [columnId]: width } 
          })),
        
        sortColumn: null,
        sortDirection: null,
        setSort: (columnId, direction) => 
          set({ sortColumn: columnId, sortDirection: direction }),
        clearSort: () => set({ sortColumn: null, sortDirection: null }),
        
        filters: {},
        setFilter: (columnId, value) => 
          set((state) => ({ 
            filters: { ...state.filters, [columnId]: value } 
          })),
        clearFilter: (columnId) => 
          set((state) => {
            const { [columnId]: _, ...remainingFilters } = state.filters;
            return { filters: remainingFilters };
          }),
        clearAllFilters: () => set({ filters: {} }),
        
        selectedRowIds: [],
        setSelectedRowIds: (rowIds) => set({ selectedRowIds: rowIds }),
        toggleRowSelection: (rowId) => 
          set((state) => ({
            selectedRowIds: state.selectedRowIds.includes(rowId)
              ? state.selectedRowIds.filter(id => id !== rowId)
              : [...state.selectedRowIds, rowId]
          })),
        clearSelection: () => set({ selectedRowIds: [] }),
        
        pinnedRows: [],
        togglePinnedRow: (rowId) => 
          set((state) => ({
            pinnedRows: state.pinnedRows.includes(rowId)
              ? state.pinnedRows.filter(id => id !== rowId)
              : [...state.pinnedRows, rowId]
          })),
        
        editingCell: null,
        setEditingCell: (rowId, columnId) => 
          set({ editingCell: { rowId, columnId } }),
        clearEditingCell: () => set({ editingCell: null }),
        
        visibleColumns: [],
        setVisibleColumns: (columnIds) => set({ visibleColumns: columnIds }),
        toggleColumnVisibility: (columnId) => 
          set((state) => ({
            visibleColumns: state.visibleColumns.includes(columnId)
              ? state.visibleColumns.filter(id => id !== columnId)
              : [...state.visibleColumns, columnId]
          })),
        
        columnOrder: [],
        setColumnOrder: (columnIds) => set({ columnOrder: columnIds }),
        moveColumn: (fromIndex, toIndex) => 
          set((state) => {
            const newOrder = [...state.columnOrder];
            const [movedColumn] = newOrder.splice(fromIndex, 1);
            newOrder.splice(toIndex, 0, movedColumn);
            return { columnOrder: newOrder };
          }),
      }),
      { name: 'table-storage' }
    )
  )
);


