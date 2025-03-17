'use client';

// lib/context/DocumentContext.tsx
import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { Document, Block } from '@/components/Canvas/types';
import { useBlocksQuery } from '@/components/Canvas/lib/hooks/query/useBlocksQuery';
import { useRealtimeManager } from '@/components/Canvas/lib/hooks/realtime/useRealtimeManager';
import { useUIStore } from '@/components/Canvas/lib/store/uiStore';
import { useCanvasStore } from '@/components/Canvas/lib/store/canvasStore';
import { useCollaboration } from '@/components/Canvas/lib/hooks/canvas/useCollaboration';

interface DocumentContextValue {
  document: Document | null;
  blocks: Block[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  createBlock: (block: any) => Promise<Block>;
  updateBlock: (updates: Partial<Block> & { id: string }) => Promise<Block>;
  deleteBlock: (blockId: string) => Promise<{ id: string }>;
  reorderBlocks: (reorderedBlocks: { id: string, position: number }[]) => Promise<{ id: string, position: number }[]>;
  selectedBlockId: string | null;
  selectBlock: (blockId: string | null) => void;
  draggingBlockId: string | null;
  startBlockDrag: (blockId: string) => void;
  endDrag: () => void;
  editMode: boolean;
  toggleEditMode: () => void;
  collaboration: {
    updateCursor: (position: { x: number, y: number }) => void;
    acquireEntityLock: (entityId: string, lockType: 'block' | 'column' | 'requirement') => boolean;
    releaseEntityLock: (entityId: string) => void;
  };
}

const DocumentContext = createContext<DocumentContextValue | null>(null);

export function DocumentProvider({
  children,
  document,
}: {
  children: ReactNode;
  document: Document | null;
}) {
  const documentId = document?.id || null;
  
  // Get blocks data with React Query
  const {
    blocks,
    isLoading,
    isError,
    error,
    createBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks
  } = useBlocksQuery(documentId);
  
  // Setup realtime manager - handles both document updates and collaboration
  const collaborationMethods = useRealtimeManager(documentId);
  
  // Get UI state from Zustand
  const { editMode, toggleEditMode } = useUIStore();
  
  // Get canvas state from Zustand
  const {
    selectedBlockId,
    selectBlock: rawSelectBlock,
    draggingBlockId,
    startBlockDrag: rawStartBlockDrag,
    endDrag
  } = useCanvasStore();
  
  // Memoize callbacks to prevent unnecessary re-renders
  const selectBlock = useCallback((blockId: string | null) => {
    rawSelectBlock(blockId);
  }, [rawSelectBlock]);
  
  const startBlockDrag = useCallback((blockId: string) => {
    rawStartBlockDrag(blockId);
  }, [rawStartBlockDrag]);
  
  // Use the collaboration hook with the document ID and debug flag
  // Set debug to false in production
  const collaboration = useCollaboration(documentId, false);
  
  // Memoize context value to prevent unnecessary renders
  const value = useMemo(() => ({
    document,
    blocks,
    isLoading,
    isError,
    error,
    createBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    selectedBlockId,
    selectBlock,
    draggingBlockId,
    startBlockDrag,
    endDrag,
    editMode,
    toggleEditMode,
    collaboration: collaborationMethods
  }), [
    document,
    blocks,
    isLoading,
    isError,
    error,
    createBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    selectedBlockId,
    selectBlock,
    draggingBlockId,
    startBlockDrag,
    endDrag,
    editMode,
    toggleEditMode,
    collaborationMethods,
    collaboration
  ]);
  
  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
}



