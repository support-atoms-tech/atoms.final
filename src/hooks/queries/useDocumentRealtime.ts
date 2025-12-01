import { useCallback, useEffect, useRef, useState } from 'react';

import {
    BlockWithRequirements,
    Column,
    Property,
} from '@/components/custom/BlockCanvas/types';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { useDocumentStore } from '@/store/document.store';
import { Database } from '@/types/base/database.types';
import { Block } from '@/types/base/documents.types';
import { Profile } from '@/types/base/profiles.types';
import { Requirement } from '@/types/base/requirements.types';

type ColumnRow = Database['public']['Tables']['columns']['Row'];
type ColumnRowWithEmbeddedProperty = ColumnRow & {
    property?: Property | null;
};

const normalizeColumns = (
    rawColumns: ColumnRowWithEmbeddedProperty[],
    propertyMap?: Map<string, Property>,
): Column[] =>
    rawColumns.map((col) => {
        const propertyFromMap =
            propertyMap && col.property_id
                ? (propertyMap.get(col.property_id) ?? undefined)
                : undefined;
        const resolvedProperty = col.property ?? propertyFromMap;

        return {
            ...(col as Column),
            property: resolvedProperty ?? undefined,
        } satisfies Column;
    });

// This interface is currently unused but kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface UseDocumentRealtimeProps {
    documentId: string;
    orgId: string;
    projectId: string;
    userProfile: Profile | null;
}

interface DocumentState {
    blocks: BlockWithRequirements[] | undefined;
    loading: boolean;
    error: Error | null;
    setDocument: React.Dispatch<
        React.SetStateAction<BlockWithRequirements[] | undefined>
    >;
    // lightweight way to rescan a single block's relations when created
    hydrateBlockRelations?: (blockId: string) => Promise<void>;
    // full refetch of all blocks + relations
    refetchDocument: (options?: { silent?: boolean }) => Promise<void>;
}

export const useDocumentRealtime = ({
    documentId,
    // These parameters are currently unused but kept for future use
    _orgId,
    _projectId,
    _userProfile,
}: {
    documentId: string;
    _orgId: string;
    _projectId: string;
    _userProfile: Profile | null;
}): DocumentState => {
    const [blocks, setBlocks] = useState<BlockWithRequirements[]>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    // Get document store for presence management - use refs to avoid dependency issues
    const documentStoreRef = useRef(useDocumentStore.getState());

    // Initial full fetch of blocks and their requirements
    const fetchBlocks = useCallback(
        async (opts?: { silent?: boolean }) => {
            try {
                if (!opts?.silent) setLoading(true);

                if (!supabase) {
                    if (authLoading) {
                        return;
                    }
                    throw new Error(authError ?? 'Supabase client not available');
                }

                const client = supabase;

                // Fetch blocks
                const { data: blocksData, error: blocksError } = await client
                    .from('blocks')
                    .select('*')
                    .eq('document_id', documentId)
                    .is('is_deleted', false)
                    .order('position');

                if (blocksError) throw blocksError;

                // Fetch requirements through API to bypass RLS issues with WorkOS org ID comparison
                let requirementsData: Requirement[] = [];
                try {
                    const reqRes = await fetch(
                        `/api/documents/${documentId}/requirements`,
                        {
                            method: 'GET',
                            cache: 'no-store',
                        },
                    );
                    if (!reqRes.ok) {
                        const errorText = await reqRes.text();
                        throw new Error(
                            `Requirements API error: ${reqRes.status} ${errorText}`,
                        );
                    }
                    const reqPayload = await reqRes.json();
                    requirementsData = (reqPayload.requirements || []) as Requirement[];
                } catch (e) {
                    console.error('❌ Requirements fetch error:', e);
                    throw e;
                }

                // Fetch columns for table blocks
                const tableBlocks = blocksData.filter((block) => block.type === 'table');
                console.log(
                    '🔍 Table blocks found:',
                    tableBlocks.length,
                    tableBlocks.map((b) => b.id),
                );

                // Fetch columns through API to avoid client-side UUID/type issues and rely on server membership checks
                let columnsData: ColumnRow[] = [] as unknown as ColumnRow[];
                try {
                    const res = await fetch(`/api/documents/${documentId}/columns`, {
                        method: 'GET',
                        cache: 'no-store',
                    });
                    if (!res.ok) {
                        const errorText = await res.text();
                        throw new Error(`Columns API error: ${res.status} ${errorText}`);
                    }
                    const payload = (await res.json()) as { columns: unknown[] };
                    columnsData = (payload.columns || []) as unknown as ColumnRow[];
                } catch (e) {
                    console.error('❌ Columns fetch error:', e);
                    throw e;
                }
                const columnsWithProperty: Column[] = normalizeColumns(
                    (columnsData as unknown as ColumnRowWithEmbeddedProperty[]) || [],
                );
                console.log('✅ Columns fetched:', columnsWithProperty.length);

                // Group requirements by block_id
                const requirementsByBlock = requirementsData.reduce(
                    (acc: { [key: string]: Requirement[] }, req: Requirement) => {
                        if (!acc[req.block_id]) {
                            acc[req.block_id] = [];
                        }
                        acc[req.block_id].push(req);
                        return acc;
                    },
                    {},
                );

                // Group columns by block_id
                const columnsByBlock = columnsWithProperty.reduce(
                    (acc: { [key: string]: Column[] }, col: Column) => {
                        const blockId = col.block_id;
                        if (blockId && !acc[blockId]) {
                            acc[blockId] = [];
                        }
                        if (blockId) {
                            acc[blockId].push(col);
                        }
                        return acc;
                    },
                    {},
                );
                console.log('🔍 Columns grouped by block:', columnsByBlock);

                // Combine blocks with their requirements and columns
                // centralized natural field config from utils

                const blocksWithRequirements: BlockWithRequirements[] = blocksData.map(
                    (block: Block) => {
                        const blockColumns = columnsByBlock[block.id] || [];
                        console.log('🔍 Block data assembly:', {
                            blockId: block.id,
                            blockType: block.type,
                            hasColumnsData: !!columnsByBlock[block.id],
                            columnsCount: blockColumns.length,
                            columns: blockColumns,
                        });

                        return {
                            ...block,
                            order: block.position || 0,
                            requirements: requirementsByBlock[block.id] || [],
                            columns: blockColumns,
                        };
                    },
                );

                // Merge with any existing local state to avoid dropping optimistic updates
                setBlocks((prev) => {
                    if (!prev || prev.length === 0) return blocksWithRequirements;

                    const byId = new Map<string, BlockWithRequirements>();
                    for (const b of prev) byId.set(b.id, b);
                    for (const b of blocksWithRequirements) byId.set(b.id, b);
                    const merged = Array.from(byId.values()).sort(
                        (a, b) => (a.order || 0) - (b.order || 0),
                    );
                    return merged;
                });

                setError(null);
            } catch (err) {
                setError(err as Error);
            } finally {
                if (!opts?.silent) setLoading(false);
            }
        },
        [documentId, supabase, authLoading, authError],
    );

    // Hydrate a single block's relations (columns + requirements) without full refetch
    const hydrateBlockRelations = useCallback(
        async (blockId: string) => {
            try {
                if (!supabase) {
                    if (authLoading) {
                        return;
                    }
                    throw new Error(authError ?? 'Supabase client not available');
                }

                // Fetch requirements for the block via API to bypass RLS issues
                let requirementsData: Requirement[] = [];
                try {
                    const reqRes = await fetch(
                        `/api/documents/${documentId}/requirements?blockId=${blockId}`,
                        { method: 'GET', cache: 'no-store' },
                    );
                    if (!reqRes.ok) {
                        const errorText = await reqRes.text();
                        throw new Error(
                            `Requirements API error: ${reqRes.status} ${errorText}`,
                        );
                    }
                    const reqPayload = await reqRes.json();
                    requirementsData = (reqPayload.requirements || []) as Requirement[];
                } catch (e) {
                    console.error('❌ Block requirements fetch error:', e);
                    throw e;
                }

                // Fetch columns for the block via API route
                let columnsData: ColumnRow[] = [] as unknown as ColumnRow[];
                {
                    const res = await fetch(
                        `/api/documents/${documentId}/columns?blockId=${blockId}`,
                        { method: 'GET', cache: 'no-store' },
                    );
                    if (!res.ok) {
                        const errorText = await res.text();
                        throw new Error(`Columns API error: ${res.status} ${errorText}`);
                    }
                    const payload = (await res.json()) as { columns: unknown[] };
                    columnsData = (payload.columns || []) as unknown as ColumnRow[];
                }
                const hydratedColumns: Column[] = normalizeColumns(
                    (columnsData as unknown as ColumnRowWithEmbeddedProperty[]) || [],
                );

                setBlocks((prev) => {
                    if (!prev) return prev;
                    return prev.map((b) =>
                        b.id === blockId
                            ? {
                                  ...b,
                                  requirements: (requirementsData || []) as Requirement[],
                                  columns: hydratedColumns,
                              }
                            : b,
                    );
                });
            } catch (err) {
                // Do not surface as hook error; this is a targeted hydration
                console.error('Failed to hydrate block relations:', err);
            }
        },
        [documentId, supabase, authLoading, authError],
    );

    // Subscribe to changes
    useEffect(() => {
        if (!documentId || authLoading) return;

        if (!supabase) {
            if (authError) {
                setError(new Error(authError ?? 'Supabase client not available'));
                setLoading(false);
            }
            return;
        }

        const client = supabase;

        // Initial fetch
        fetchBlocks({ silent: false });

        // Subscribe to blocks changes
        const blocksSubscription = client
            .channel(`blocks:${documentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'blocks',
                    filter: `document_id=eq.${documentId}`,
                },
                // Handle individual block changes instead of fetching all blocks
                (payload) => {
                    setBlocks((prevBlocks) => {
                        if (!prevBlocks) return prevBlocks;

                        if (payload.eventType === 'INSERT') {
                            // Avoid duplicates when we already optimistically added the block
                            const exists = prevBlocks.some(
                                (b) => b.id === (payload.new as Block).id,
                            );
                            if (exists) return prevBlocks;

                            return [
                                ...prevBlocks,
                                {
                                    ...(payload.new as Block),
                                    order: payload.new.position,
                                    requirements: [],
                                    columns: [],
                                },
                            ].sort((a, b) => (a.order || 0) - (b.order || 0));
                        }
                        if (payload.eventType === 'UPDATE') {
                            return prevBlocks.map((block) =>
                                block.id === payload.new.id
                                    ? {
                                          ...block,
                                          ...(payload.new as Block),
                                          order: payload.new.position,
                                          requirements: block.requirements,
                                          columns: block.columns,
                                      }
                                    : block,
                            );
                        }
                        if (payload.eventType === 'DELETE') {
                            return prevBlocks.filter(
                                (block) => block.id !== payload.old.id,
                            );
                        }
                        return prevBlocks;
                    });
                },
            )
            .subscribe();

        // Subscribe to requirements changes
        const requirementsSubscription = client
            .channel(`requirements:${documentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'requirements',
                    filter: `document_id=eq.${documentId}`,
                },
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        setBlocks((prevBlocks) => {
                            if (!prevBlocks) return prevBlocks;

                            return prevBlocks.map((block) => {
                                if (block.id === payload.new.block_id) {
                                    return {
                                        ...block,
                                        requirements: block.requirements.map((req) =>
                                            req.id === payload.new.id
                                                ? (payload.new as Requirement)
                                                : req,
                                        ),
                                    };
                                }
                                return block;
                            });
                        });
                    } else if (payload.eventType === 'INSERT') {
                        setBlocks((prevBlocks) => {
                            if (!prevBlocks) return prevBlocks;

                            return prevBlocks.map((block) => {
                                if (block.id === payload.new.block_id) {
                                    return {
                                        ...block,
                                        requirements: [
                                            ...block.requirements,
                                            payload.new as Requirement,
                                        ],
                                    };
                                }
                                return block;
                            });
                        });
                    } else if (payload.eventType === 'DELETE') {
                        setBlocks((prevBlocks) => {
                            if (!prevBlocks) return prevBlocks;

                            return prevBlocks.map((block) => {
                                if (block.id === payload.old.block_id) {
                                    return {
                                        ...block,
                                        requirements: block.requirements.filter(
                                            (req) => req.id !== payload.old.id,
                                        ),
                                    };
                                }
                                return block;
                            });
                        });
                    }
                },
            )
            .subscribe();

        // Subscribe to columns changes
        const columnsSubscription = client
            .channel(`columns:${documentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'columns',
                },
                async (payload) => {
                    const newCol = payload.new as Column | undefined;
                    const oldCol = payload.old as Column | undefined;

                    // For INSERTs, use the column from payload directly
                    // The property will be hydrated when needed, or we can fetch it individually
                    // Avoid fetching all columns for the block - that's redundant
                    const enrichedNewCol: Column | undefined = newCol;
                    // Only fetch property if we don't have it in the payload
                    if (
                        payload.eventType === 'INSERT' &&
                        newCol?.id &&
                        !newCol.property_id
                    ) {
                        // If we need the property, fetch just this column's property, not all columns
                        // For now, use the column as-is - property can be hydrated later if needed
                        // This avoids the expensive API call to fetch all columns
                    }

                    setBlocks((prevBlocks) => {
                        if (!prevBlocks) return prevBlocks;

                        return prevBlocks.map((block) => {
                            if (
                                block.id !== enrichedNewCol?.block_id &&
                                block.id !== oldCol?.block_id &&
                                block.id !== newCol?.block_id
                            ) {
                                return block;
                            }

                            if (
                                payload.eventType === 'INSERT' &&
                                (enrichedNewCol || newCol)
                            ) {
                                const colToAdd = (enrichedNewCol || newCol) as Column;
                                const baseColumns = block.columns ?? [];
                                // de-dupe by id to avoid double insertions from parallel sources
                                const exists = baseColumns.some(
                                    (c) => c.id === colToAdd.id,
                                );
                                const nextColumns = exists
                                    ? [...baseColumns]
                                    : [...baseColumns, colToAdd];
                                const sorted = nextColumns.sort(
                                    (a, b) => (a.position ?? 0) - (b.position ?? 0),
                                );
                                return {
                                    ...block,
                                    columns: sorted,
                                };
                            }

                            if (payload.eventType === 'UPDATE' && newCol) {
                                const nextColumns = (block.columns ?? [])
                                    .map((c) =>
                                        c.id === newCol.id
                                            ? { ...c, ...newCol, property: c.property }
                                            : c,
                                    )
                                    .sort(
                                        (a, b) => (a.position ?? 0) - (b.position ?? 0),
                                    );
                                return {
                                    ...block,
                                    columns: nextColumns,
                                };
                            }

                            if (payload.eventType === 'DELETE' && oldCol) {
                                const nextColumns = (block.columns ?? [])
                                    .filter((c) => c.id !== oldCol.id)
                                    .sort(
                                        (a, b) => (a.position ?? 0) - (b.position ?? 0),
                                    );
                                return {
                                    ...block,
                                    columns: nextColumns,
                                };
                            }

                            return block;
                        });
                    });
                },
            )
            .subscribe();

        // Subscribe to presence (who's online and what they're editing)
        const presenceChannel = client
            .channel(`document:${documentId}:presence`)
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState();
                // Update store with all active users
                Object.entries(state).forEach(([_key, presences]) => {
                    const presence = presences[0] as unknown as {
                        user_id: string;
                        user_name: string;
                        user_email?: string;
                        online_at: string;
                        editing_cell?: {
                            blockId: string;
                            rowId: string;
                            columnId: string;
                        } | null;
                    };
                    if (presence && presence.user_id !== _userProfile?.id) {
                        documentStoreRef.current.updateUserPresence(presence.user_id, {
                            userId: presence.user_id,
                            userName: presence.user_name,
                            userEmail: presence.user_email,
                            onlineAt: presence.online_at,
                            editingCell: presence.editing_cell,
                        });
                    }
                });
            })
            .on('presence', { event: 'join' }, ({ key: _key, newPresences }) => {
                const presence = newPresences[0] as unknown as {
                    user_id: string;
                    user_name: string;
                    user_email?: string;
                    online_at: string;
                };
                if (presence && presence.user_id !== _userProfile?.id) {
                    documentStoreRef.current.updateUserPresence(presence.user_id, {
                        userId: presence.user_id,
                        userName: presence.user_name,
                        userEmail: presence.user_email,
                        onlineAt: presence.online_at,
                    });
                }
            })
            .on('presence', { event: 'leave' }, ({ key: _key, leftPresences }) => {
                const presence = leftPresences[0] as unknown as { user_id: string };
                if (presence) {
                    documentStoreRef.current.removeUser(presence.user_id);
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED' && _userProfile) {
                    // Track current user's presence
                    await presenceChannel.track({
                        user_id: _userProfile.id,
                        user_name:
                            _userProfile.full_name || _userProfile.email || 'Anonymous',
                        user_email: _userProfile.email,
                        online_at: new Date().toISOString(),
                        editing_cell: null,
                    });
                }
            });

        // Track pending timeouts for cleanup
        const pendingTimeouts = new Set<NodeJS.Timeout>();

        // Subscribe to broadcast for real-time cell updates (before DB save)
        console.log('[useDocumentRealtime] 📡 Subscribing to broadcast channel:', {
            documentId,
            currentUserId: _userProfile?.id,
        });

        const broadcastChannel = client
            .channel(`document:${documentId}:broadcasts`)
            .on(
                'broadcast',
                { event: 'cell_update' },
                (payload: {
                    payload: {
                        blockId: string;
                        rowId: string;
                        columnId: string;
                        value: unknown;
                        userId: string;
                    };
                }) => {
                    console.log(
                        '[useDocumentRealtime] 📨 Received cell_update broadcast:',
                        {
                            payload: payload.payload,
                            currentUserId: _userProfile?.id,
                        },
                    );

                    const { blockId, rowId, columnId, value, userId } = payload.payload;
                    // Don't update if it's from current user
                    if (userId !== _userProfile?.id) {
                        console.log(
                            '[useDocumentRealtime] ✅ Applying remote cell update',
                        );
                        documentStoreRef.current.setPendingCellUpdate(
                            blockId,
                            rowId,
                            columnId,
                            value,
                            userId,
                        );
                        // Auto-remove after 3 seconds (by then DB should have it)
                        const timeoutId = setTimeout(() => {
                            documentStoreRef.current.removePendingCellUpdate(
                                blockId,
                                rowId,
                                columnId,
                            );
                            pendingTimeouts.delete(timeoutId);
                        }, 3000);
                        pendingTimeouts.add(timeoutId);
                    } else {
                        console.log('[useDocumentRealtime] ⏭️ Skipped (own update)');
                    }
                },
            )
            .on(
                'broadcast',
                { event: 'cursor_move' },
                (payload: {
                    payload: {
                        userId: string;
                        blockId: string;
                        rowId?: string;
                        columnId?: string;
                    };
                }) => {
                    const { userId, blockId, rowId, columnId } = payload.payload;
                    if (userId !== _userProfile?.id) {
                        documentStoreRef.current.updateUserPresence(userId, {
                            userId,
                            userName: 'Unknown', // This will be merged with existing data
                            editingCell:
                                rowId && columnId ? { blockId, rowId, columnId } : null,
                        });
                    }
                },
            )
            .subscribe();

        return () => {
            // Clean up all subscriptions
            blocksSubscription.unsubscribe();
            requirementsSubscription.unsubscribe();
            columnsSubscription.unsubscribe();
            presenceChannel.unsubscribe();
            broadcastChannel.unsubscribe();

            // Clean up all pending timeouts to prevent memory leaks
            pendingTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
            pendingTimeouts.clear();
        };
    }, [documentId, fetchBlocks, supabase, authLoading, authError, _userProfile]);

    const refetchDocument = useCallback(
        async (options?: { silent?: boolean }) => {
            await fetchBlocks({ silent: options?.silent ?? false });
        },
        [fetchBlocks],
    );

    return {
        blocks,
        loading,
        error,
        setDocument: setBlocks,
        // expose a lightweight rescan for newly added blocks
        hydrateBlockRelations,
        refetchDocument,
    };
};
