// components/canvas/Canvas.tsx
'use client';

import { memo, useCallback } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDocument } from '@/components/Canvas/lib/providers/DocumentContext';
import { BlockRenderer } from '@/components/Canvas/components/misc/BlockRenderer';
import { AddBlockButton } from '@/components/Canvas/components/misc/AddBlockButton';
import { useCanvasStore } from '@/components/Canvas/lib/store/canvasStore';
import { useUIStore } from '@/components/Canvas/lib/store/uiStore';
// Memoize the Canvas component to prevent unnecessary re-renders
export const Canvas = memo(function Canvas() {
  const { 
    document,
    blocks, 
    createBlock, 
    reorderBlocks,
    selectedBlockId,
    editMode 
  } = useDocument();
  
  const { draggingBlockId, endDrag } = useCanvasStore();
  
  // Handle drag end
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
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
  
  // Create a new block
  const handleCreateBlock = useCallback(async (type: string) => {
    if (!document) {
      console.error('No document available');
      return;
    }
    
    try {
      // Calculate the position for the new block (at the end)
      const position = blocks.length;
      
      // Create the block with the document ID
      await createBlock({ 
        type, 
        document_id: document.id,
        position,
        content: type === 'text' ? { text: '', format: 'html' } : {}
      });
    } catch (err) {
      console.error('Failed to create block:', err);
    }
  }, [document, blocks.length, createBlock]);
  
  return (
    <div className="canvas p-4 max-w-5xl mx-auto">
      <DndContext 
        onDragEnd={handleDragEnd}
        sensors={[]}
        collisionDetection={closestCenter}
      >
        <SortableContext
          items={blocks.map(block => block.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="blocks-container space-y-6">
            {blocks.length > 0 ? (
              blocks.map(block => (
                <BlockRenderer 
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  isDragging={draggingBlockId === block.id}
                />
              ))
            ) : (
              <div className="empty-state text-center py-10 text-gray-500">
                {editMode ? 'Add a block to get started' : 'This document is empty'}
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
      
      {editMode && (
        <div className="mt-8">
          <AddBlockButton onAddBlock={handleCreateBlock} />
        </div>
      )}
    </div>
  );
});