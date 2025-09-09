'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';

import { BlockProps } from '@/components/custom/BlockCanvas/types';
import { cn } from '@/lib/utils';

import { TableBlock } from './TableBlock';
import { TextBlock } from './TextBlock';

export const SortableBlock: React.FC<BlockProps> = ({
    block,
    _isSelected,
    onSelect,
    onUpdate,
    onDelete,
    properties,
    userProfile,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({
            id: block.id,
        });

    // Removes scaling to prevent unequal sized block from stretching to fit
    const adjustedTransform = transform ? { ...transform, scaleX: 1, scaleY: 1 } : null;

    const style = {
        transform: isDragging ? CSS.Transform.toString(adjustedTransform) : undefined,
        transition,
        position: 'relative' as const,
        zIndex: isDragging ? 999 : 'auto',
        willChange: isDragging ? 'transform' : 'auto',
        transformOrigin: 'center',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={cn(
                'relative group bg-background w-full max-w-full min-w-0',
                'rounded-lg',
                'border border-transparent',
                isDragging && [
                    'opacity-50',
                    'shadow-lg shadow-accent/10',
                    'scale-[1.01]',
                    'cursor-grabbing',
                    'border-accent/20',
                    'backdrop-blur-[2px]',
                ],
                !isDragging && 'cursor-default',
            )}
        >
            {block.type === 'text' && (
                <TextBlock
                    block={block}
                    onUpdate={onUpdate}
                    _isSelected={_isSelected}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    dragActivators={listeners}
                />
            )}
            {block.type === 'table' && (
                <TableBlock
                    block={block}
                    onUpdate={onUpdate}
                    _isSelected={_isSelected}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    properties={properties}
                    dragActivators={listeners}
                    userProfile={userProfile}
                />
            )}
        </div>
    );
};
