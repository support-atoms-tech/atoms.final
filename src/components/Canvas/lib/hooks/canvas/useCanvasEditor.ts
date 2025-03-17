// hooks/canvas/useCanvasEditor.ts
import { useCallback, useMemo } from 'react';
import { useDocument } from '@/components/Canvas/lib/providers/DocumentContext';
import { useCollaboration } from '@/components/Canvas/lib/hooks/canvas/useCollaboration';
import { Block, BlockCreateData } from '@/components/Canvas/types';
import { DragEndEvent } from '@dnd-kit/core';

// Main hook for canvas editing features
export function useCanvasEditor() {
  const {
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
    toggleEditMode
  } = useDocument();
  
  // Set up realtime collaboration - only pass document ID when it's available
  const documentId = document?.id || null;
  const collaboration = useCollaboration(documentId);
  
  // Create a new block
  const handleCreateBlock = useCallback(async (type: string, position?: number) => {
    if (!document) return null;
    
    // If position is not provided, add to the end
    const blockPosition = position ?? blocks.length;
    
    // Create block data
    const blockData: BlockCreateData = {
      document_id: document.id,
      type,
      position: blockPosition,
      content: type === 'text' 
        ? { text: '' } 
        : type === 'table' 
          ? { title: 'New Table' }
          : {}
    };
    
    try {
      const newBlock = await createBlock(blockData);
      selectBlock(newBlock.id);
      return newBlock;
    } catch (err) {
      console.error('Failed to create block:', err);
      return null;
    }
  }, [document, blocks.length, createBlock, selectBlock]);
  
  // Handle block reordering from drag and drop
  const handleBlockDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      endDrag();
      return;
    }
    
    // Get the source and destination blocks
    const sourceId = String(active.id);
    const destinationId = String(over.id);
    
    // Find indices
    const sourceIndex = blocks.findIndex(block => block.id === sourceId);
    const destinationIndex = blocks.findIndex(block => block.id === destinationId);
    
    if (sourceIndex < 0 || destinationIndex < 0) {
      endDrag();
      return;
    }
    
    // Create a new array with the new ordering
    const reordered = [...blocks];
    const [movedBlock] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, movedBlock);
    
    // Update positions in the array
    const reorderData = reordered.map((block, index) => ({
      id: block.id,
      position: index
    }));
    
    // Reset drag state
    endDrag();
    
    try {
      // Execute the reorder operation
      await reorderBlocks(reorderData);
    } catch (err) {
      console.error('Failed to reorder blocks:', err);
    }
  }, [blocks, endDrag, reorderBlocks]);
  
  // Delete a block
  const handleDeleteBlock = useCallback(async (blockId: string) => {
    try {
      await deleteBlock(blockId);
      
      // If the deleted block was selected, clear selection
      if (selectedBlockId === blockId) {
        selectBlock(null);
      }
    } catch (err) {
      console.error('Failed to delete block:', err);
    }
  }, [deleteBlock, selectedBlockId, selectBlock]);
  
  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    document,
    blocks,
    isLoading,
    isError,
    error,
    
    // Block operations
    createBlock: handleCreateBlock,
    updateBlock,
    deleteBlock: handleDeleteBlock,
    
    // Selection and drag
    selectedBlockId,
    selectBlock,
    draggingBlockId,
    startBlockDrag,
    handleBlockDragEnd,
    
    // Edit mode
    editMode,
    toggleEditMode,
    
    // Collaboration
    updateCursor: collaboration.updateCursor
  }), [
    document,
    blocks,
    isLoading,
    isError,
    error,
    handleCreateBlock,
    updateBlock,
    handleDeleteBlock,
    selectedBlockId,
    selectBlock,
    draggingBlockId,
    startBlockDrag,
    handleBlockDragEnd,
    editMode,
    toggleEditMode,
    collaboration.updateCursor
  ]);
}



