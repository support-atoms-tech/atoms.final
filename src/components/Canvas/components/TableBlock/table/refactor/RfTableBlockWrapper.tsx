// RfTableBlockWrapper.tsx - Wrapper component to integrate refactored table
'use client';

import { useMemo } from 'react';
import { RefactoredTableBlock } from './RefactoredTableBlock';
import { Block } from '@/components/Canvas/types';
import { BlockProvider } from '@/components/Canvas/lib/providers/BlockContext';
import { useDocument } from '@/components/Canvas/lib/providers/DocumentContext';
import { useCollaboration } from '@/components/Canvas/lib/hooks/canvas/useCollaboration';
import { TableCollaborationContext } from './RefactoredTableBlock';

interface RfTableBlockWrapperProps {
  block: Block;
}

/**
 * Wrapper component that integrates the refactored table implementation
 * with the main canvas. This allows us to gradually roll out the new
 * implementation while maintaining compatibility.
 */
export function RfTableBlockWrapper({ block }: RfTableBlockWrapperProps) {
  const { document } = useDocument();
  // Memoize documentId to prevent unnecessary re-renders
  const documentId = useMemo(() => document?.id || null, [document?.id]);
  
  // Create a single collaboration instance for the entire table
  const collaboration = useCollaboration(documentId);

  return (
    <BlockProvider block={block}>
      <TableCollaborationContext.Provider value={collaboration}>
        <RefactoredTableBlock block={block} />
      </TableCollaborationContext.Provider>
    </BlockProvider>
  );
} 