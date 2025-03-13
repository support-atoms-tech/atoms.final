import { RealtimeChannel } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

import { Property } from '@/components/custom/BlockCanvas/types';
import { useDocumentStore } from '@/lib/store/document.store';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Block } from '@/types/base/documents.types';
import { Requirement } from '@/types/base/requirements.types';
import { BlockSchema } from '@/types/validation/blocks.validation';
import { RequirementSchema } from '@/types/validation/requirements.validation';

type BlockWithRequirements = Block & { requirements: Requirement[] };

// Separate fetching of blocks, requirements and properties to avoid race conditions
const fetchInitialData = async (documentId: string) => {
    // First fetch all blocks
    const { data: blocksData, error: blocksError } = await supabase
        .from('blocks')
        .select('*')
        .eq('document_id', documentId)
        .eq('is_deleted', false)
        .order('position');

    if (blocksError) {
        console.error('Error fetching blocks:', blocksError);
        throw blocksError;
    }

    // Then fetch all active requirements for this document
    const { data: requirementsData, error: requirementsError } = await supabase
        .from('requirements')
        .select('*')
        .eq('document_id', documentId)
        .eq('is_deleted', false);

    if (requirementsError) {
        console.error('Error fetching requirements:', requirementsError);
        throw requirementsError;
    }

    if (requirementsError) {
        console.error('Error fetching requirements:', requirementsError);
        throw requirementsError;
    }

    // Fetch all properties for this document
    const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('document_id', documentId)
        .eq('is_deleted', false)
        .order('position');

    if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
        throw propertiesError;
    }

    // Parse and merge the data
    const blocks = blocksData.map((block) => BlockSchema.parse(block));
    const requirements = requirementsData.map((req) => {
        // Ensure all requirement data is properly parsed
        const parsedReq = RequirementSchema.parse(req);

        // Make sure properties field is preserved from raw data
        if (req.properties && !parsedReq.properties) {
            parsedReq.properties = req.properties;
        }

        return parsedReq;
    });
    const properties = propertiesData as Property[];

    // Group requirements by block_id
    const requirementsByBlock = requirements.reduce(
        (acc, req) => {
            if (!acc[req.block_id]) {
                acc[req.block_id] = [];
            }
            acc[req.block_id].push(req);
            return acc;
        },
        {} as Record<string, Requirement[]>,
    );

    console.log('requirementsByBlock', requirementsByBlock);

    // Group properties by block_id for easier access
    const propertiesByBlock = properties.reduce(
        (acc, prop) => {
            if (prop.block_id) {
                if (!acc[prop.block_id]) {
                    acc[prop.block_id] = [];
                }
                acc[prop.block_id].push(prop);
            }
            return acc;
        },
        {} as Record<string, Property[]>,
    );

    // Merge blocks with their requirements, preserving ALL requirement fields
    return {
        blocks: blocks.map((block) => ({
            ...block,
            requirements: (requirementsByBlock[block.id] || []).map((req) => ({
                ...req, // This ensures ALL requirement fields are preserved
            })),
        })),
        propertiesByBlock,
    };
};

export function useDocumentRealtime(documentId: string) {
    const { addBlock, updateBlock, deleteBlock, setBlocks } =
        useDocumentStore();
    const [blocks, setLocalBlocks] = useState<BlockWithRequirements[]>([]);
    const [propertiesByBlock, setPropertiesByBlock] = useState<
        Record<string, Property[]>
    >({});
    const [isLoading, setIsLoading] = useState(true);

    // Helper function to update both states - moved outside useEffect and memoized
    const updateBothStates = useCallback(
        (
            updateFn: (
                prev: BlockWithRequirements[],
            ) => BlockWithRequirements[],
        ) => {
            setLocalBlocks((prev) => {
                const updated = updateFn(prev);

                // Use setTimeout to ensure document store update happens outside of render cycle
                setTimeout(() => {
                    setBlocks(updated as unknown as Block[]);
                }, 0);

                return updated;
            });
        },
        [setBlocks],
    );

    // Helper function to delete all requirements of a block
    const deleteBlockRequirements = async (blockId: string) => {
        try {
            const { error } = await supabase
                .from('requirements')
                .update({
                    is_deleted: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('block_id', blockId);

            if (error) {
                console.error('Error deleting block requirements:', error);
            }
        } catch (error) {
            console.error('Error in deleteBlockRequirements:', error);
        }
    };

    // Helper function to delete all properties of a block
    const deleteBlockProperties = async (blockId: string) => {
        try {
            const { error } = await supabase
                .from('properties')
                .update({
                    is_deleted: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('block_id', blockId);

            if (error) {
                console.error('Error deleting block properties:', error);
            }

            // Update local properties state
            setPropertiesByBlock((prev) => {
                const newState = { ...prev };
                delete newState[blockId];
                return newState;
            });
        } catch (error) {
            console.error('Error in deleteBlockProperties:', error);
        }
    };

    useEffect(() => {
        let blockChannel: RealtimeChannel;
        let requirementChannel: RealtimeChannel;
        let propertyChannel: RealtimeChannel;

        const loadInitialDataAndSubscribe = async () => {
            try {
                // Set up block subscription
                blockChannel = supabase
                    .channel(`blocks:${documentId}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'blocks',
                            filter: `document_id=eq.${documentId}`,
                        },
                        async (payload) => {
                            console.log('Block INSERT event:', payload);
                            const newBlock = BlockSchema.parse(payload.new);
                            setLocalBlocks((prev) => {
                                const exists = prev.some(
                                    (b) => b.id === newBlock.id,
                                );
                                return exists
                                    ? prev
                                    : [
                                          ...prev,
                                          {
                                              ...newBlock,
                                              requirements: [], // Empty array but with proper typing
                                          },
                                      ].sort((a, b) => a.position - b.position);
                            });

                            // Use setTimeout to ensure document store update happens outside of render cycle
                            setTimeout(() => {
                                addBlock(newBlock);
                            }, 0);
                        },
                    )
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'blocks',
                            filter: `document_id=eq.${documentId}`,
                        },
                        async (payload) => {
                            console.log('Block UPDATE event:', payload);
                            const updatedBlock = BlockSchema.parse(payload.new);
                            if (updatedBlock.is_deleted) {
                                // Delete all requirements and properties of this block first
                                await deleteBlockRequirements(updatedBlock.id);
                                await deleteBlockProperties(updatedBlock.id);
                                setLocalBlocks((prev) =>
                                    prev.filter(
                                        (b) => b.id !== updatedBlock.id,
                                    ),
                                );

                                // Use setTimeout to ensure document store update happens outside of render cycle
                                setTimeout(() => {
                                    deleteBlock(updatedBlock.id);
                                }, 0);
                                return;
                            }
                            setLocalBlocks((prev) =>
                                prev
                                    .map((b) =>
                                        b.id === updatedBlock.id
                                            ? {
                                                  ...updatedBlock,
                                                  requirements: b.requirements,
                                              }
                                            : b,
                                    )
                                    .sort((a, b) => a.position - b.position),
                            );

                            // Use setTimeout to ensure document store update happens outside of render cycle
                            setTimeout(() => {
                                updateBlock(
                                    updatedBlock.id,
                                    updatedBlock.content,
                                );
                            }, 0);
                        },
                    )
                    .on(
                        'postgres_changes',
                        {
                            event: 'DELETE',
                            schema: 'public',
                            table: 'blocks',
                            filter: `document_id=eq.${documentId}`,
                        },
                        async (payload) => {
                            console.log('Block DELETE event:', payload);
                            const deletedBlockId = payload.old.id;
                            // Delete all requirements and properties of this block first
                            await deleteBlockRequirements(deletedBlockId);
                            await deleteBlockProperties(deletedBlockId);
                            setLocalBlocks((prev) =>
                                prev.filter((b) => b.id !== deletedBlockId),
                            );

                            // Use setTimeout to ensure document store update happens outside of render cycle
                            setTimeout(() => {
                                deleteBlock(deletedBlockId);
                            }, 0);
                        },
                    );

                // Set up requirements subscription with store updates
                requirementChannel = supabase
                    .channel(`requirements:${documentId}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'requirements',
                            filter: `document_id=eq.${documentId}`,
                        },
                        async (payload) => {
                            console.log('Requirement INSERT event:', payload);
                            const rawRequirement = payload.new;
                            // Parse the requirement and preserve properties
                            const newRequirement =
                                RequirementSchema.parse(rawRequirement);
                            if (
                                rawRequirement.properties &&
                                !newRequirement.properties
                            ) {
                                newRequirement.properties =
                                    rawRequirement.properties;
                            }

                            if (newRequirement.is_deleted) {
                                console.log(
                                    'Skipping deleted requirement:',
                                    newRequirement,
                                );
                                return;
                            }

                            updateBothStates((prev) =>
                                prev.map((block) => ({
                                    ...block,
                                    requirements:
                                        block.id === newRequirement.block_id
                                            ? [
                                                  ...block.requirements,
                                                  newRequirement,
                                              ]
                                            : block.requirements,
                                })),
                            );
                        },
                    )
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'requirements',
                            filter: `document_id=eq.${documentId}`,
                        },
                        async (payload) => {
                            console.log('Requirement UPDATE event:', payload);
                            const rawRequirement = payload.new;
                            // Parse the requirement and preserve properties
                            const updatedRequirement =
                                RequirementSchema.parse(rawRequirement);
                            if (
                                rawRequirement.properties &&
                                !updatedRequirement.properties
                            ) {
                                updatedRequirement.properties =
                                    rawRequirement.properties;
                            }

                            updateBothStates((prev) =>
                                prev.map((block) => {
                                    if (
                                        block.id === updatedRequirement.block_id
                                    ) {
                                        // If requirement is deleted, filter it out
                                        if (updatedRequirement.is_deleted) {
                                            return {
                                                ...block,
                                                requirements:
                                                    block.requirements.filter(
                                                        (req) =>
                                                            req.id !==
                                                            updatedRequirement.id,
                                                    ),
                                            };
                                        }
                                        // Otherwise update the requirement
                                        return {
                                            ...block,
                                            requirements:
                                                block.requirements.map((req) =>
                                                    req.id ===
                                                    updatedRequirement.id
                                                        ? updatedRequirement
                                                        : req,
                                                ),
                                        };
                                    }
                                    return block;
                                }),
                            );
                        },
                    )
                    .on(
                        'postgres_changes',
                        {
                            event: 'DELETE',
                            schema: 'public',
                            table: 'requirements',
                            filter: `document_id=eq.${documentId}`,
                        },
                        async (payload) => {
                            console.log('Requirement DELETE event:', payload);
                            const deletedRequirement = payload.old;

                            updateBothStates((prev) =>
                                prev.map((block) => ({
                                    ...block,
                                    requirements:
                                        block.id === deletedRequirement.block_id
                                            ? block.requirements.filter(
                                                  (req) =>
                                                      req.id !==
                                                      deletedRequirement.id,
                                              )
                                            : block.requirements,
                                })),
                            );
                        },
                    );

                // Set up property subscription
                propertyChannel = supabase
                    .channel(`properties:${documentId}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'properties',
                            filter: `document_id=eq.${documentId}`,
                        },
                        async (payload) => {
                            console.log('Property INSERT event:', payload);
                            const newProperty = payload.new as Property;

                            if (newProperty.is_deleted) {
                                console.log(
                                    'Skipping deleted property:',
                                    newProperty,
                                );
                                return;
                            }

                            // If this property belongs to a block, add it to our propertiesByBlock state
                            if (newProperty.block_id) {
                                setPropertiesByBlock((prev) => {
                                    const newState = { ...prev };
                                    if (!newState[newProperty.block_id!]) {
                                        newState[newProperty.block_id!] = [];
                                    }
                                    newState[newProperty.block_id!] = [
                                        ...newState[newProperty.block_id!],
                                        newProperty,
                                    ].sort((a, b) => a.position - b.position);
                                    return newState;
                                });
                            }
                        },
                    )
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'properties',
                            filter: `document_id=eq.${documentId}`,
                        },
                        async (payload) => {
                            console.log('Property UPDATE event:', payload);
                            const updatedProperty = payload.new as Property;
                            const oldProperty = payload.old as Property;

                            // Handle deletion
                            if (updatedProperty.is_deleted) {
                                if (oldProperty.block_id) {
                                    setPropertiesByBlock((prev) => {
                                        const newState = { ...prev };
                                        if (newState[oldProperty.block_id!]) {
                                            newState[oldProperty.block_id!] =
                                                newState[
                                                    oldProperty.block_id!
                                                ].filter(
                                                    (p) =>
                                                        p.id !==
                                                        updatedProperty.id,
                                                );
                                        }
                                        return newState;
                                    });
                                }
                                return;
                            }

                            // Handle property block_id change (moving property between blocks)
                            if (
                                oldProperty.block_id !==
                                updatedProperty.block_id
                            ) {
                                setPropertiesByBlock((prev) => {
                                    const newState = { ...prev };

                                    // Remove from old block if it existed
                                    if (
                                        oldProperty.block_id &&
                                        newState[oldProperty.block_id]
                                    ) {
                                        newState[oldProperty.block_id] =
                                            newState[
                                                oldProperty.block_id
                                            ].filter(
                                                (p) =>
                                                    p.id !== updatedProperty.id,
                                            );
                                    }

                                    // Add to new block if it exists
                                    if (updatedProperty.block_id) {
                                        if (
                                            !newState[updatedProperty.block_id]
                                        ) {
                                            newState[updatedProperty.block_id] =
                                                [];
                                        }
                                        newState[updatedProperty.block_id] = [
                                            ...newState[
                                                updatedProperty.block_id
                                            ],
                                            updatedProperty,
                                        ].sort(
                                            (a, b) => a.position - b.position,
                                        );
                                    }

                                    return newState;
                                });
                                return;
                            }

                            // Regular property update (same block)
                            if (updatedProperty.block_id) {
                                setPropertiesByBlock((prev) => {
                                    const newState = { ...prev };
                                    if (newState[updatedProperty.block_id!]) {
                                        newState[updatedProperty.block_id!] =
                                            newState[updatedProperty.block_id!]
                                                .map((p) =>
                                                    p.id === updatedProperty.id
                                                        ? updatedProperty
                                                        : p,
                                                )
                                                .sort(
                                                    (a, b) =>
                                                        a.position - b.position,
                                                );
                                    }
                                    return newState;
                                });
                            }
                        },
                    )
                    .on(
                        'postgres_changes',
                        {
                            event: 'DELETE',
                            schema: 'public',
                            table: 'properties',
                            filter: `document_id=eq.${documentId}`,
                        },
                        async (payload) => {
                            console.log('Property DELETE event:', payload);
                            const deletedProperty = payload.old as Property;

                            if (deletedProperty.block_id) {
                                setPropertiesByBlock((prev) => {
                                    const newState = { ...prev };
                                    if (newState[deletedProperty.block_id!]) {
                                        newState[deletedProperty.block_id!] =
                                            newState[
                                                deletedProperty.block_id!
                                            ].filter(
                                                (p) =>
                                                    p.id !== deletedProperty.id,
                                            );
                                    }
                                    return newState;
                                });
                            }
                        },
                    );

                // Subscribe to all channels with status logging
                await Promise.all([
                    blockChannel.subscribe((status) => {
                        console.log('Block channel status:', status);
                        if (status === 'SUBSCRIBED') {
                            console.log(
                                'Successfully subscribed to block channel',
                            );
                        }
                    }),
                    requirementChannel.subscribe((status) => {
                        console.log('Requirement channel status:', status);
                        if (status === 'SUBSCRIBED') {
                            console.log(
                                'Successfully subscribed to requirement channel',
                            );
                        }
                    }),
                    propertyChannel.subscribe((status) => {
                        console.log('Property channel status:', status);
                        if (status === 'SUBSCRIBED') {
                            console.log(
                                'Successfully subscribed to property channel',
                            );
                        }
                    }),
                ]);

                // Fetch initial data
                console.log('Fetching initial data...');
                const initialData = await fetchInitialData(documentId);
                console.log('Setting initial data:', initialData);
                setLocalBlocks(initialData.blocks);
                setPropertiesByBlock(initialData.propertiesByBlock);

                // Use setTimeout to ensure document store update happens outside of render cycle
                setTimeout(() => {
                    setBlocks(initialData.blocks);
                }, 0);
            } catch (error) {
                console.error('Error in initial setup:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialDataAndSubscribe();

        return () => {
            console.log('Cleaning up subscriptions...');
            if (blockChannel) {
                console.log('Unsubscribing from block channel');
                blockChannel.unsubscribe();
            }
            if (requirementChannel) {
                console.log('Unsubscribing from requirement channel');
                requirementChannel.unsubscribe();
            }
            if (propertyChannel) {
                console.log('Unsubscribing from property channel');
                propertyChannel.unsubscribe();
            }
        };
    }, [
        documentId,
        addBlock,
        updateBlock,
        deleteBlock,
        setBlocks,
        updateBothStates,
    ]);

    return { blocks, propertiesByBlock, isLoading, setLocalBlocks };
}
