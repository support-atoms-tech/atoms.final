import { useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { useParams } from 'next/navigation';

import {
    BlockWithRequirements,
    Property,
    PropertyType,
    UseBlockActionsProps,
    BlockType,
    DefaultPropertyKeys
} from '@/components/custom/BlockCanvas/types';
import {
    useCreateBlock,
    useDeleteBlock,
    useUpdateBlock,
} from '@/hooks/mutations/useBlockMutations';
import { queryKeys } from '@/lib/constants/queryKeys';
import { useDocumentStore } from '@/lib/store/document.store';
import { Json } from '@/types/base/database.types';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { BLOCK_TEXT_DEFAULT_HEIGHT, BLOCKS_GUTTER_SIZE } from '@/lib/constants/blocks';
import { RequirementStatus, RequirementPriority } from '@/types/base/enums.types';

export const useBlockActions = ({
    documentId,
    userProfile,
    blocks,
    setLocalBlocks,
    orgId,
    projectId,
}: UseBlockActionsProps) => {
    const createBlockMutation = useCreateBlock();
    const updateBlockMutation = useUpdateBlock();
    const deleteBlockMutation = useDeleteBlock();
    const { addBlock } = useDocumentStore();
    const queryClient = useQueryClient();

    // Add null check for blocks
    const getNewBlockOrder = () => {
        if (!blocks || blocks.length === 0) return 1;
        return Math.max(0, ...blocks.map((b) => b.order)) + 1;
    };

    // Add null check for blocks
    const getBlocksBelow = (order: number) => {
        if (!blocks) return [];
        // Return blocks that are below the current order
        return blocks.filter((b) => b.order > order);
    };

    const makeSpaceForBlock = (
        targetOrder: number,
        makeLocalOnly: boolean = false,
    ) => {
        const blocksBelow = getBlocksBelow(targetOrder);
        if (blocksBelow.length === 0) {
            return;
        }

        // Update the order of blocks below
        setLocalBlocks((prevBlocks) => {
            return prevBlocks.map((block) =>
                block.order >= targetOrder
                    ? { ...block, order: block.order + 1 }
                    : block,
            );
        });
    };

    // Create a default table block with basic properties
    const getDefaultTableBlock = () => {
        const newBlock: BlockWithRequirements = {
            id: uuidv4(),
            document_id: documentId,
            order: getNewBlockOrder(),
            height: BLOCK_TEXT_DEFAULT_HEIGHT,
            type: BlockType.table.toString(),
            content: null, // Use content instead of data
            position: getNewBlockOrder(), // Use position as required by Block type
            requirements: [], // Initialize with empty requirements array
            created_at: null,
            updated_at: null,
            deleted_at: null,
            created_by: null,
            updated_by: null,
            deleted_by: null,
            is_deleted: null,
            version: 1,
            org_id: orgId,
            project_id: projectId,
        };
        
        return newBlock;
    };

    const getDefaultTextBlock = (content?: any) => {
        const newBlock: BlockWithRequirements = {
            id: uuidv4(),
            document_id: documentId,
            order: getNewBlockOrder(),
            height: BLOCK_TEXT_DEFAULT_HEIGHT,
            type: BlockType.text.toString(),
            content: { content }, // Use content instead of data
            position: getNewBlockOrder(), // Use position as required by Block type
            requirements: [], // Initialize with empty requirements array
            created_at: null,
            updated_at: null,
            deleted_at: null,
            created_by: null,
            updated_by: null,
            deleted_by: null,
            is_deleted: null,
            version: 1,
            org_id: orgId,
            project_id: projectId,
        };
        
        return newBlock;
    };

    // Create default properties for a block (using the new properties table)
    const createDefaultBlockProperties = async (blockId: string) => {
        if (!userProfile?.id) {
            console.error('Cannot create default properties without user profile');
            return [];
        }

        console.log('Creating default properties for block', blockId);

        try {
            // Use URL params for org_id and project_id instead of extracting from blocks
            if (!orgId || !projectId) {
                console.error('No organization or project ID available in URL params');
                return [];
            }

            // Define default properties: Name, Description, Status, Priority, and ID
            const defaultProperties: Omit<Property, 'id'>[] = [
                {
                    org_id: orgId,
                    project_id: projectId,
                    document_id: documentId,
                    block_id: blockId,
                    name: 'Name',
                    key: 'name',
                    type: 'text' as PropertyType,
                    description: 'Requirement name',
                    position: 10,
                    is_required: true,
                    is_hidden: false,
                    created_by: userProfile.id,
                    updated_by: userProfile.id,
                    is_deleted: false,
                    is_schema: true
                },
                {
                    org_id: orgId,
                    project_id: projectId,
                    document_id: documentId,
                    block_id: blockId,
                    name: 'Description',
                    key: 'description',
                    type: 'text' as PropertyType,
                    description: 'Requirement description',
                    position: 20,
                    is_required: false,
                    is_hidden: false,
                    created_by: userProfile.id,
                    updated_by: userProfile.id,
                    is_deleted: false,
                    is_schema: true
                },
                {
                    org_id: orgId,
                    project_id: projectId,
                    document_id: documentId,
                    block_id: blockId,
                    name: 'ID',
                    key: 'req_id',
                    type: 'text' as PropertyType,
                    description: 'Requirement ID',
                    position: 30,
                    is_required: false,
                    is_hidden: false,
                    created_by: userProfile.id,
                    updated_by: userProfile.id,
                    is_deleted: false,
                    is_schema: true
                },
                {
                    org_id: orgId,
                    project_id: projectId,
                    document_id: documentId,
                    block_id: blockId,
                    name: 'Status',
                    key: 'status',
                    type: 'select' as PropertyType,
                    description: 'Requirement status',
                    options: { values: Object.values(RequirementStatus) },
                    default_value: RequirementStatus.draft,
                    position: 40,
                    is_required: true,
                    is_hidden: false,
                    created_by: userProfile.id,
                    updated_by: userProfile.id,
                    is_deleted: false,
                    is_schema: true
                },
                {
                    org_id: orgId,
                    project_id: projectId,
                    document_id: documentId,
                    block_id: blockId,
                    name: 'Priority',
                    key: 'priority',
                    type: 'select' as PropertyType,
                    description: 'Requirement priority',
                    options: { values: Object.values(RequirementPriority) },
                    default_value: RequirementPriority.medium,
                    position: 50,
                    is_required: true,
                    is_hidden: false,
                    created_by: userProfile.id,
                    updated_by: userProfile.id,
                    is_deleted: false,
                    is_schema: true
                }
            ];

            // Insert all properties in a single batch
            const { data, error } = await supabase
                .from('properties')
                .insert(defaultProperties)
                .select();

            if (error) {
                console.error('Error creating default properties:', error);
                throw error;
            }

            console.log('Created default properties:', data);
            
            // Invalidate queries to ensure fresh data
            queryClient.invalidateQueries({
                queryKey: queryKeys.properties.byBlock(blockId)
            });
            
            return data as Property[];
        } catch (error) {
            console.error('Failed to create default properties:', error);
            return [];
        }
    };

    const handleAddBlock = async (type: 'text' | 'table', content: Json) => {
        console.log('🏗️ handleAddBlock called', { type, content });

        if (!userProfile?.id) {
            console.log('⚠️ Cannot add block - missing user profile');
            return;
        }

        const newBlock = {
            type,
            content,
            position: blocks?.length || 0,
            document_id: documentId,
            created_by: userProfile.id,
            updated_by: userProfile.id,
        };

        try {
            console.log('🚀 Creating new block', newBlock);
            const createdBlock =
                await createBlockMutation.mutateAsync(newBlock);
            console.log('✅ Block created successfully', createdBlock);

            // Update both document store and local state immediately
            addBlock(createdBlock);
            setLocalBlocks((prev) => {
                const newBlock: BlockWithRequirements = {
                    ...createdBlock,
                    requirements: [],
                    order: prev.length, // Add the order field explicitly
                    org_id: orgId,
                    project_id: projectId
                };
                return [...prev, newBlock].sort((a, b) => a.position - b.position);
            });
            console.log('🔄 Local state updated with new block');

            // If it's a table block, create properties
            if (type === 'table') {
                console.log('📊 Creating properties for table block', {
                    blockId: createdBlock.id,
                });

                // Create default properties using the new properties table
                await createDefaultBlockProperties(createdBlock.id);
            }

            return createdBlock;
        } catch (error) {
            console.error('❌ Failed to create block:', error);
            console.error('Error details:', JSON.stringify(error));
            throw error;
        }
    };

    const handleUpdateBlock = async (blockId: string, content: Json) => {
        if (!userProfile?.id) return;

        try {
            const currentBlock = blocks?.find((b) => b.id === blockId);
            if (!currentBlock) return;

            await updateBlockMutation.mutateAsync({
                id: blockId,
                content,
                updated_by: userProfile.id,
                version: (currentBlock.version || 1) + 1,
                updated_at: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Failed to update block:', error);
        }
    };

    const handleDeleteBlock = async (blockId: string) => {
        if (!userProfile?.id) return;

        try {
            // Update local state immediately
            setLocalBlocks((prev) =>
                prev.filter((block) => block.id !== blockId),
            );

            // Delete from server
            await deleteBlockMutation.mutateAsync({
                id: blockId,
                deletedBy: userProfile.id,
            });

            // Force a refetch to ensure consistency
            queryClient.invalidateQueries({
                queryKey: queryKeys.blocks.byDocument(documentId),
            });
        } catch (error) {
            console.error('Failed to delete block:', error);
            // Revert local state on error
            queryClient.invalidateQueries({
                queryKey: queryKeys.blocks.byDocument(documentId),
            });
        }
    };

    const handleReorder = async (reorderedBlocks: BlockWithRequirements[]) => {
        if (!userProfile?.id) return;

        try {
            // Update all positions in parallel for better performance
            await Promise.all(
                reorderedBlocks.map((block) =>
                    updateBlockMutation.mutateAsync({
                        id: block.id,
                        position: block.position,
                        content: block.content,
                        updated_by: userProfile.id,
                        version: (block.version || 1) + 1,
                        updated_at: new Date().toISOString(),
                    }),
                ),
            );
        } catch (error) {
            console.error('Failed to update block positions:', error);
        }
    };

    return {
        handleAddBlock,
        handleUpdateBlock,
        handleDeleteBlock,
        handleReorder,
        createDefaultBlockProperties,
        getNewBlockOrder,
        getBlocksBelow,
        makeSpaceForBlock,
        getDefaultTextBlock,
        getDefaultTableBlock,
    };
};
