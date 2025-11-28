import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { dedupeColumnMetadataEntries } from '@/components/custom/BlockCanvas/utils/requirementsNativeColumns';
import { queryKeys } from '@/lib/constants/queryKeys';

export interface ColumnMetadata {
    columnId: string;
    position: number;
    width?: number;
    name?: string;
}

export interface RequirementMetadata {
    requirementId: string;
    position: number;
    height?: number;
}

export interface RowMetadata {
    rowId: string;
    position: number;
    height?: number;
}

export interface BlockTableMetadata {
    columns: ColumnMetadata[];
    requirements: RequirementMetadata[];
    // Optional alternate key for generic tables
    rows?: RowMetadata[];
    // Preserve the table kind so we don't switch pipelines inadvertently
    tableKind?: string;
}

export const useBlockMetadataActions = (documentId?: string) => {
    const queryClient = useQueryClient();

    const updateBlockMetadata = useCallback(
        async (blockId: string, partialMetadata: Partial<BlockTableMetadata>) => {
            if (!blockId) {
                throw new Error('[updateBlockMetadata] blockId is required.');
            }

            if (!documentId) {
                console.error(
                    '[updateBlockMetadata] Cannot persist metadata without a documentId',
                    {
                        blockId,
                        documentId,
                    },
                );
                return;
            }

            try {
                const payload: Partial<BlockTableMetadata> = {
                    ...partialMetadata,
                    ...(partialMetadata.columns
                        ? {
                              columns: dedupeColumnMetadataEntries(
                                  partialMetadata.columns,
                              ),
                          }
                        : {}),
                };

                const response = await fetch(
                    `/api/documents/${documentId}/blocks/${blockId}/metadata`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify(payload),
                    },
                );

                if (!response.ok) {
                    let errorBody: unknown = null;
                    try {
                        errorBody = await response.json();
                    } catch {
                        errorBody = null;
                    }

                    console.error('[updateBlockMetadata] API request failed', {
                        status: response.status,
                        errorBody,
                    });
                    throw new Error(
                        (errorBody as { error?: string })?.error ||
                            'Failed to update block metadata',
                    );
                }

                await queryClient.invalidateQueries({
                    queryKey: queryKeys.blocks.detail(blockId),
                });
            } catch (err) {
                console.error('[updateBlockMetadata] Unexpected error:', err);
                throw err;
            }
        },
        [documentId, queryClient],
    );

    return {
        updateBlockMetadata,
    };
};
