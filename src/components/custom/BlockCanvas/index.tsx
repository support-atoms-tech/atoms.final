'use client';

import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    defaultDropAnimation,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Table, Type } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import { SortableBlock } from '@/components/custom/BlockCanvas/components/SortableBlock';
import { TableBlockLoadingState } from '@/components/custom/BlockCanvas/components/TableBlockLoadingState';
import { useBlockActions } from '@/components/custom/BlockCanvas/hooks/useBlockActions';
import {
    BlockCanvasProps,
    BlockWithRequirements,
    Property,
} from '@/components/custom/BlockCanvas/types';
import { Button } from '@/components/ui/button';
import { useDocumentRealtime } from '@/hooks/queries/useDocumentRealtime';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/lib/providers/organization.provider';
import { useDocumentStore } from '@/lib/store/document.store';

const dropAnimationConfig = {
    ...defaultDropAnimation,
    dragSourceOpacity: 0.5,
};

export function BlockCanvas({ documentId }: BlockCanvasProps) {
    const {
        blocks: originalBlocks,
        propertiesByBlock,
        isLoading,
        setLocalBlocks: setOriginalLocalBlocks,
    } = useDocumentRealtime(documentId);
    const { reorderBlocks, isEditMode, setIsEditMode } = useDocumentStore();
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const { userProfile } = useAuth();
    const { currentOrganization } = useOrganization();
    const params = useParams();

    // Get org_id and project_id from URL params for new blocks
    const orgId = currentOrganization?.id as string;
    const projectId = params?.projectId as string;

    // Add order property to each block if it doesn't exist
    const [enhancedBlocks, setEnhancedBlocks] = useState<
        BlockWithRequirements[]
    >([]);

    // Adapt the blocks to include order property
    useEffect(() => {
        if (originalBlocks) {
            const blocksWithOrder = originalBlocks.map((block, index) => {
                // Create a new object with all required properties
                const enhancedBlock = {
                    ...block,
                    order: block.position || index, // Use position as order or fallback to index
                } as BlockWithRequirements;

                // Only add these optional properties if they exist and have the right type
                if ('org_id' in block && typeof block.org_id === 'string') {
                    enhancedBlock.org_id = block.org_id;
                } else if (orgId) {
                    enhancedBlock.org_id = orgId;
                }

                if (
                    'project_id' in block &&
                    typeof block.project_id === 'string'
                ) {
                    enhancedBlock.project_id = block.project_id;
                } else if (projectId) {
                    enhancedBlock.project_id = projectId;
                }

                return enhancedBlock;
            });
            setEnhancedBlocks(blocksWithOrder);
        }
    }, [originalBlocks, orgId, projectId]);

    // Wrapper for setLocalBlocks that adds order
    const setEnhancedLocalBlocks = useCallback(
        (updater: React.SetStateAction<BlockWithRequirements[]>) => {
            setOriginalLocalBlocks((prev) => {
                // First convert prev blocks to enhanced blocks
                const prevEnhanced = prev.map((block, index) => {
                    const enhancedBlock = {
                        ...block,
                        order: block.position || index,
                    } as BlockWithRequirements;

                    return enhancedBlock;
                });

                // Apply the updater function to get next state
                const nextState =
                    typeof updater === 'function'
                        ? updater(prevEnhanced)
                        : updater;

                // Convert back to format expected by original setter
                // Just pass through as the base properties are still there
                return nextState;
            });
        },
        [setOriginalLocalBlocks],
    );

    const {
        handleAddBlock,
        handleUpdateBlock,
        handleDeleteBlock,
        handleReorder,
        createDefaultBlockProperties,
    } = useBlockActions({
        documentId,
        userProfile,
        blocks: enhancedBlocks,
        setLocalBlocks: setEnhancedLocalBlocks,
        orgId,
        projectId,
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const renderBlock = useCallback(
        (block: BlockWithRequirements) => {
            const isSelected = block.id === selectedBlockId;
            // Get properties for this block
            const blockProperties = propertiesByBlock[block.id] || [];

            return (
                <SortableBlock
                    key={block.id}
                    block={block}
                    isSelected={isSelected}
                    isEditMode={isEditMode}
                    onSelect={() => setSelectedBlockId(block.id)}
                    onUpdate={(content) => handleUpdateBlock(block.id, content)}
                    onDelete={() => handleDeleteBlock(block.id)}
                    onDoubleClick={() => {
                        setSelectedBlockId(block.id);
                        setIsEditMode(true);
                    }}
                    properties={blockProperties}
                />
            );
        },
        [
            selectedBlockId,
            isEditMode,
            handleUpdateBlock,
            handleDeleteBlock,
            setIsEditMode,
            propertiesByBlock,
        ],
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;

        if (!over || active.id === over.id || !enhancedBlocks) {
            return;
        }

        const oldIndex = enhancedBlocks.findIndex(
            (block) => block.id === active.id,
        );
        const newIndex = enhancedBlocks.findIndex(
            (block) => block.id === over.id,
        );

        if (oldIndex !== -1 && newIndex !== -1) {
            const newBlocks = arrayMove(enhancedBlocks, oldIndex, newIndex).map(
                (block, index) => ({
                    ...block,
                    position: index,
                    order: index, // Ensure order is set
                }),
            );

            // Update local state immediately for smooth UI
            setEnhancedLocalBlocks(newBlocks);

            // Update document store
            reorderBlocks(newBlocks);

            // Trigger server update
            handleReorder(newBlocks);
        }
    };

    // Don't render blocks until they're loaded
    if (isLoading) {
        return (
            <div className="relative min-h-[500px] space-y-4">
                <TableBlockLoadingState
                    isLoading={true}
                    isError={false}
                    error={null}
                />
            </div>
        );
    }

    // Get active block with order property
    const activeBlock = enhancedBlocks?.find((block) => block.id === activeId);
    const activeBlockProperties = activeBlock
        ? propertiesByBlock[activeBlock.id] || []
        : [];

    return (
        <div className="relative min-h-[500px] space-y-4">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={enhancedBlocks?.map((block) => block.id) || []}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4">
                        {enhancedBlocks?.map((block) => renderBlock(block))}
                    </div>
                </SortableContext>

                <DragOverlay dropAnimation={dropAnimationConfig}>
                    {activeId && activeBlock ? (
                        <div className="opacity-100 w-full pointer-events-none">
                            <SortableBlock
                                block={activeBlock}
                                isSelected={false}
                                isEditMode={isEditMode}
                                onSelect={() => {}}
                                onUpdate={() => {}}
                                onDelete={() => {}}
                                properties={activeBlockProperties}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {!isEditMode && (
                <div className="flex gap-2 mt-4 z-10 relative">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            handleAddBlock('text', {
                                format: 'markdown',
                                text: '',
                            })
                        }
                        className="gap-2 cursor-pointer"
                    >
                        <Type className="h-4 w-4" />
                        Add Text
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            handleAddBlock('table', { requirements: [] })
                        }
                        className="gap-2 cursor-pointer"
                    >
                        <Table className="h-4 w-4" />
                        Add Requirements Table
                    </Button>
                </div>
            )}
        </div>
    );
}
