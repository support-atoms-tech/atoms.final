import { RealtimeChannel } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef } from 'react';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';

interface BroadcastTextUpdateOptions {
    documentId: string;
    blockId: string;
    userId?: string;
    userName?: string;
    enabled?: boolean;
    onReceiveUpdate?: (data: { content: string; userId: string }) => void;
    onReceiveCursor?: (data: {
        userId: string;
        userName: string;
        from: number;
        to: number;
    }) => void;
}

/**
 * Hook for broadcasting real-time text block updates
 * Google Docs-style text collaboration
 */
export const useBroadcastTextUpdate = ({
    documentId,
    blockId,
    userId,
    userName,
    enabled = true,
    onReceiveUpdate,
    onReceiveCursor,
}: BroadcastTextUpdateOptions) => {
    const { supabase } = useAuthenticatedSupabase();
    const channelRef = useRef<RealtimeChannel | null>(null);
    const onReceiveUpdateRef = useRef(onReceiveUpdate);
    const onReceiveCursorRef = useRef(onReceiveCursor);

    // Keep callback refs up to date
    useEffect(() => {
        onReceiveUpdateRef.current = onReceiveUpdate;
    }, [onReceiveUpdate]);

    useEffect(() => {
        onReceiveCursorRef.current = onReceiveCursor;
    }, [onReceiveCursor]);

    // Initialize broadcast channel
    useEffect(() => {
        if (!supabase || !documentId || !blockId || !enabled) {
            console.log('[useBroadcastTextUpdate] Skipped initialization:', {
                hasSupabase: !!supabase,
                documentId,
                blockId,
                enabled,
            });
            return;
        }

        console.log('[useBroadcastTextUpdate] 🚀 Initializing text broadcast channel:', {
            documentId,
            blockId,
            userId,
        });

        const channel = supabase
            .channel(`document:${documentId}:text:${blockId}`)
            .on(
                'broadcast',
                { event: 'text_update' },
                (payload: {
                    payload: {
                        blockId: string;
                        content: string;
                        userId: string;
                        timestamp: number;
                    };
                }) => {
                    console.log('[useBroadcastTextUpdate] 📨 Received text update:', {
                        payload: payload.payload,
                        currentUserId: userId,
                    });

                    // Don't update if it's from current user
                    if (payload.payload.userId !== userId) {
                        console.log(
                            '[useBroadcastTextUpdate] ✅ Applying remote text update',
                        );
                        onReceiveUpdateRef.current?.({
                            content: payload.payload.content,
                            userId: payload.payload.userId,
                        });
                    } else {
                        console.log('[useBroadcastTextUpdate] ⏭️ Skipped (own update)');
                    }
                },
            )
            .on(
                'broadcast',
                { event: 'cursor_update' },
                (payload: {
                    payload: {
                        userId: string;
                        userName: string;
                        from: number;
                        to: number;
                        timestamp: number;
                    };
                }) => {
                    console.log('[useBroadcastTextUpdate] 🖱️ Received cursor update:', {
                        payload: payload.payload,
                        currentUserId: userId,
                    });

                    // Don't update if it's from current user
                    if (payload.payload.userId !== userId) {
                        onReceiveCursorRef.current?.({
                            userId: payload.payload.userId,
                            userName: payload.payload.userName,
                            from: payload.payload.from,
                            to: payload.payload.to,
                        });
                    }
                },
            )
            .subscribe((status) => {
                console.log('[useBroadcastTextUpdate] 📡 Channel status:', status);
            });

        channelRef.current = channel;

        return () => {
            console.log('[useBroadcastTextUpdate] 🔌 Unsubscribing from text channel');
            channel.unsubscribe();
            channelRef.current = null;
        };
    }, [supabase, documentId, blockId, enabled, userId]);

    /**
     * Broadcast text update to other users immediately
     */
    const broadcastTextUpdate = useCallback(
        async (content: string) => {
            if (!channelRef.current || !userId) {
                console.debug('[useBroadcastTextUpdate] Channel or userId not ready');
                return;
            }

            try {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'text_update',
                    payload: {
                        blockId,
                        content,
                        userId,
                        timestamp: Date.now(),
                    },
                });
                console.debug('[useBroadcastTextUpdate] 📤 Broadcasted text update');
            } catch (error) {
                console.error('[useBroadcastTextUpdate] Failed to broadcast:', error);
            }
        },
        [blockId, userId],
    );

    /**
     * Broadcast cursor position to other users
     */
    const broadcastCursorUpdate = useCallback(
        async (from: number, to: number) => {
            if (!channelRef.current || !userId || !userName) {
                console.debug(
                    '[useBroadcastTextUpdate] Channel, userId or userName not ready',
                );
                return;
            }

            try {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'cursor_update',
                    payload: {
                        userId,
                        userName,
                        from,
                        to,
                        timestamp: Date.now(),
                    },
                });
                console.debug('[useBroadcastTextUpdate] 🖱️ Broadcasted cursor update');
            } catch (error) {
                console.error(
                    '[useBroadcastTextUpdate] Failed to broadcast cursor:',
                    error,
                );
            }
        },
        [userId, userName],
    );

    return {
        broadcastTextUpdate,
        broadcastCursorUpdate,
    };
};
