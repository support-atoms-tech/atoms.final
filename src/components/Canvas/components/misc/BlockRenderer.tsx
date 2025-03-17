// components/canvas/BlockRenderer.tsx
'use client';

import { Block } from '@/components/Canvas/types';
import { TextBlock } from '@/components/Canvas/components/TextBlock/TextBlock';
import { RfTableBlockWrapper } from '../TableBlock/table/refactor/RfTableBlockWrapper';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BlockMenu } from '@/components/Canvas/components/misc/BlockMenu';

interface BlockRendererProps {
  block: Block;
  isSelected: boolean;
  isDragging: boolean;
}

/**
 * Component that renders different types of blocks based on their type
 * Handles drag and drop functionality for block reordering
 */
export function BlockRenderer({ block, isSelected, isDragging }: BlockRendererProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const blockClasses = `
    block-wrapper relative
    ${isSelected ? 'ring-2 ring-blue-500' : ''}
    ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
  `;

  const renderBlock = () => {
    switch (block.type) {
      case 'text':
        return <TextBlock block={block} />;
      case 'table':
        return <RfTableBlockWrapper block={block} />;
      default:
        return (
          <div className="p-4 text-center text-gray-500">
            Unsupported block type: {block.type}
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={blockClasses}
      {...attributes}
      {...listeners}
    >
      {renderBlock()}
      
      {isSelected && (
        <BlockMenu blockId={block.id} blockType={block.type} />
      )}
    </div>
  );
}