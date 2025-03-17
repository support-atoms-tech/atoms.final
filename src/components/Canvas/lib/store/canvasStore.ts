'use client';

// lib/store/canvasStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Block } from '@/types/index';
import { v4 as uuidv4 } from 'uuid';

interface CanvasState {
  // Drag state
  draggingBlockId: string | null;
  draggingColumnId: string | null;
  draggingRequirementId: string | null;
  
  // Start drag operations
  startBlockDrag: (blockId: string) => void;
  startColumnDrag: (columnId: string) => void;
  startRequirementDrag: (requirementId: string) => void;
  
  // End drag operations
  endDrag: () => void;
  
  // Selection state
  selectedBlockId: string | null;
  selectedRequirementId: string | null;
  selectBlock: (blockId: string | null) => void;
  selectRequirement: (requirementId: string | null) => void;
  
  // Client ID for optimistic updates
  clientId: string;
}

export const useCanvasStore = create<CanvasState>()(
  devtools(
    (set) => ({
      // Drag state
      draggingBlockId: null,
      draggingColumnId: null,
      draggingRequirementId: null,
      
      // Start drag operations
      startBlockDrag: (blockId: string) => set({ 
        draggingBlockId: blockId,
        draggingColumnId: null,
        draggingRequirementId: null
      }),
      startColumnDrag: (columnId: string) => set({ 
        draggingBlockId: null,
        draggingColumnId: columnId,
        draggingRequirementId: null
      }),
      startRequirementDrag: (requirementId: string) => set({
        draggingBlockId: null,
        draggingColumnId: null,
        draggingRequirementId: requirementId
      }),
      
      // End drag operations
      endDrag: () => set({ 
        draggingBlockId: null,
        draggingColumnId: null,
        draggingRequirementId: null
      }),
      
      // Selection state
      selectedBlockId: null,
      selectedRequirementId: null,
      selectBlock: (blockId) => set({ 
        selectedBlockId: blockId,
        selectedRequirementId: null
      }),
      selectRequirement: (requirementId) => set({ selectedRequirementId: requirementId }),
      
      // Client ID for optimistic updates
      clientId: uuidv4()
    })
  )
);