'use client';

// lib/context/BlockContext.tsx
import { createContext, useContext, ReactNode, useMemo } from 'react';
import { Block, Column, Requirement } from '@/components/Canvas/types';
import { useColumnsQuery } from '@/components/Canvas/lib/hooks/query/useColumnsQuery';
import { useRequirementsQuery } from '@/components/Canvas/lib/hooks/query/useRequirementsQuery';
import { useCanvasStore } from '@/components/Canvas/lib/store/canvasStore';
import { useCollaborationStore } from '@/components/Canvas/lib/store/collaborationStore';

interface BlockContextValue {
  block: Block;
  columns: Column[];
  requirements: Requirement[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  // Column operations
  createColumn: (column: any) => Promise<Column>;
  updateColumn: (updates: Partial<Column> & { id: string }) => Promise<Column>;
  deleteColumn: (columnId: string) => Promise<{ id: string }>;
  reorderColumns: (reorderedColumns: { id: string, position: number }[]) => Promise<{ id: string, position: number }[]>;
  // Requirement operations
  createRequirement: (requirement: any) => Promise<Requirement>;
  updateRequirement: (updates: Partial<Requirement> & { id: string }) => Promise<Requirement>;
  deleteRequirement: (requirementId: string) => Promise<{ id: string }>;
  reorderRequirements: (reorderedRequirements: { id: string, position: number }[]) => Promise<{ id: string, position: number }[]>;
  bulkUpdateProperties: (updates: { id: string, properties: Record<string, any> }[]) => Promise<{ id: string, properties: Record<string, any> }[]>;
  // State management
  selectedRequirementId: string | null;
  selectRequirement: (requirementId: string | null) => void;
  draggingColumnId: string | null;
  draggingRequirementId: string | null;
  startColumnDrag: (columnId: string) => void;
  startRequirementDrag: (requirementId: string) => void;
  endDrag: () => void;
  // Locks
  isEntityLocked: (entityId: string) => boolean;
  acquireLock: (entityId: string, userId: string, userName: string, lockType: 'block' | 'column' | 'requirement') => boolean;
  releaseLock: (entityId: string, userId: string) => void;
}

const BlockContext = createContext<BlockContextValue | null>(null);

export function BlockProvider({
  children,
  block
}: {
  children: ReactNode;
  block: Block;
}) {
  const blockId = block?.id || null;
  
  // Get columns data with React Query
  const {
    columns,
    isLoading: isColumnsLoading,
    isError: isColumnsError,
    error: columnsError,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns
  } = useColumnsQuery(blockId);
  
  // Get requirements data with React Query
  const {
    requirements,
    isLoading: isRequirementsLoading,
    isError: isRequirementsError,
    error: requirementsError,
    createRequirement,
    updateRequirement,
    deleteRequirement,
    reorderRequirements,
    bulkUpdateProperties
  } = useRequirementsQuery(blockId);
  
  // Get canvas state from Zustand
  const {
    selectedRequirementId,
    selectRequirement,
    draggingColumnId,
    draggingRequirementId,
    startColumnDrag,
    startRequirementDrag,
    endDrag
  } = useCanvasStore();
  
  // Get collaboration state from Zustand
  const {
    isEntityLocked,
    acquireLock,
    releaseLock
  } = useCollaborationStore();
  
  // Combine loading and error states
  const isLoading = isColumnsLoading || isRequirementsLoading;
  const isError = isColumnsError || isRequirementsError;
  const error = columnsError || requirementsError;
  
  // Memoize context value to prevent unnecessary renders
  const value = useMemo(() => ({
    block,
    columns,
    requirements,
    isLoading,
    isError,
    error,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    createRequirement,
    updateRequirement,
    deleteRequirement,
    reorderRequirements,
    bulkUpdateProperties,
    selectedRequirementId,
    selectRequirement,
    draggingColumnId,
    draggingRequirementId,
    startColumnDrag,
    startRequirementDrag,
    endDrag,
    isEntityLocked,
    acquireLock,
    releaseLock
  }), [
    block,
    columns,
    requirements,
    isLoading,
    isError,
    error,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    createRequirement,
    updateRequirement,
    deleteRequirement,
    reorderRequirements,
    bulkUpdateProperties,
    selectedRequirementId,
    selectRequirement,
    draggingColumnId,
    draggingRequirementId,
    startColumnDrag,
    startRequirementDrag,
    endDrag,
    isEntityLocked,
    acquireLock,
    releaseLock
  ]);
  
  return (
    <BlockContext.Provider value={value}>
      {children}
    </BlockContext.Provider>
  );
}

export function useBlock() {
  const context = useContext(BlockContext);
  if (!context) {
    throw new Error('useBlock must be used within a BlockProvider');
  }
  return context;
}