// components/canvas/BlockRenderer.tsx
'use client';

import { useMemo, memo } from 'react';
import { useCanvasStore } from '@/components/Canvas/lib/store/canvasStore';
import { Block } from '@/components/Canvas/types';
import { BlockProvider } from '@/components/Canvas/lib/providers/BlockContext';
import { TextBlock } from '@/components/Canvas/components/TextBlock/TextBlock';
import { TableBlock } from '@/components/Canvas/components/TableBlock/TableBlock';
import { BlockMenu } from '@/components/Canvas/components/misc/BlockMenu';

interface BlockRendererProps {
  block: Block;
  isSelected: boolean;
  isDragging: boolean;
}

// Memoize the BlockRenderer component to prevent unnecessary re-renders
export const BlockRenderer = memo(function BlockRenderer({ block, isSelected, isDragging }: BlockRendererProps) {
  const { selectBlock } = useCanvasStore();
  
  // Render the appropriate block component based on type
  const BlockComponent = useMemo(() => {
    switch (block.type) {
      case 'text':
        return TextBlock;
      case 'table':
        return TableBlock;
      default:
        return () => <div>Unknown block type: {block.type}</div>;
    }
  }, [block.type]);
  
  // Handle block selection
  const handleBlockClick = () => {
    selectBlock(block.id);
  };
  
  return (
    <div 
      className={`block-wrapper ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} relative`}
      onClick={handleBlockClick}
    >
      <BlockProvider block={block as Block}>
        <div className="block-content relative">
          <BlockComponent block={block} />
          
          {isSelected && (
            <BlockMenu blockId={block.id} blockType={block.type} />
          )}
        </div>
      </BlockProvider>
    </div>
  );
});