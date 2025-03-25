// store/optimisticStore.ts
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

interface PendingChange {
  id: string;
  rowId: string;
  propertyId: string;
  value: any;
  timestamp: number;
  status: 'pending' | 'success' | 'error';
  errorMessage?: string;
}

interface OptimisticState {
  // Optimistic updates tracking
  pendingChanges: PendingChange[];
  
  // Add a new pending change
  addPendingChange: (rowId: string, propertyId: string, value: any) => string;
  
  // Update change status
  markChangeSuccess: (changeId: string) => void;
  markChangeError: (changeId: string, errorMessage: string) => void;
  resetPendingChange: (changeId: string) => void;
  
  // Remove changes
  removePendingChange: (changeId: string) => void;
  clearResolvedChanges: () => void;
  
  // Get optimistic value for a cell
  getOptimisticValue: (rowId: string, propertyId: string, currentValue: any) => any;
  
  // Check if a row has pending changes
  hasRowPendingChanges: (rowId: string) => boolean;
}

/**
 * Store for tracking optimistic updates to provide immediate UI feedback
 * while updates are processed on the server
 */
export const useOptimisticStore = create<OptimisticState>()((set, get) => ({
  pendingChanges: [],
  
  addPendingChange: (rowId, propertyId, value) => {
    const changeId = uuidv4();
    
    // Check for and remove any existing pending changes for the same cell
    set((state) => {
      const filteredChanges = state.pendingChanges.filter(
        change => !(change.rowId === rowId && 
                    change.propertyId === propertyId && 
                    change.status === 'pending')
      );
      
      return {
        pendingChanges: [
          ...filteredChanges,
          {
            id: changeId,
            rowId,
            propertyId,
            value,
            timestamp: Date.now(),
            status: 'pending'
          }
        ]
      };
    });
    
    return changeId;
  },
  
  markChangeSuccess: (changeId) => set((state) => ({
    pendingChanges: state.pendingChanges.map(change =>
      change.id === changeId
        ? { ...change, status: 'success' }
        : change
    )
  })),
  
  markChangeError: (changeId, errorMessage) => set((state) => ({
    pendingChanges: state.pendingChanges.map(change =>
      change.id === changeId
        ? { ...change, status: 'error', errorMessage }
        : change
    )
  })),
  
  resetPendingChange: (changeId) => set((state) => ({
    pendingChanges: state.pendingChanges.map(change =>
      change.id === changeId
        ? { ...change, status: 'pending', errorMessage: undefined }
        : change
    )
  })),
  
  removePendingChange: (changeId) => set((state) => ({
    pendingChanges: state.pendingChanges.filter(change => change.id !== changeId)
  })),
  
  clearResolvedChanges: () => set((state) => ({
    pendingChanges: state.pendingChanges.filter(
      change => change.status === 'pending'
    )
  })),
  
  getOptimisticValue: (rowId, propertyId, currentValue) => {
    const { pendingChanges } = get();
    // Get the most recent pending change for this cell
    const latestChange = [...pendingChanges]
      .filter(change => 
        change.rowId === rowId &&
        change.propertyId === propertyId &&
        change.status === 'pending'
      )
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    return latestChange ? latestChange.value : currentValue;
  },
  
  hasRowPendingChanges: (rowId) => {
    const { pendingChanges } = get();
    return pendingChanges.some(
      change => change.rowId === rowId && change.status === 'pending'
    );
  }
}));