// hooks/useRealtimeSubscription.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Requirement, UserPresence, CursorPosition } from '@/components/CollaborativeTable/types';
import { usePresenceStore } from '@/components/CollaborativeTable/store/presenceStore';

interface UseRealtimeSubscriptionOptions {
  blockId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
}

/**
 * Throttle function to limit how often a callback can run
 */
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let lastRun = 0;
  let throttleTimeout: NodeJS.Timeout | null = null;
  
  return function throttled(...args: Parameters<T>): void {
    const now = Date.now();
    const remaining = limit - (now - lastRun);
    
    if (remaining <= 0) {
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
        throttleTimeout = null;
      }
      
      lastRun = now;
      func(...args);
    } else if (!throttleTimeout) {
      throttleTimeout = setTimeout(() => {
        lastRun = Date.now();
        throttleTimeout = null;
        func(...args);
      }, remaining);
    }
  };
};

/**
 * Hook to manage Supabase Realtime subscriptions for:
 * 1. Row changes (insert, update, delete)
 * 2. User presence tracking
 * 3. Cursor position tracking
 * 
 * Uses a single channel with multiple subscriptions to reduce connection overhead
 */
export function useRealtimeSubscription({
  blockId,
  userId,
  userName,
  userAvatar
}: UseRealtimeSubscriptionOptions) {
  const queryClient = useQueryClient();
  const presenceStore = usePresenceStore();
  
  // Track channel connection
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  // Cursor tracking timer - debounce cursor broadcasts
  const cursorTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Create a throttled version of setActiveUsers to prevent excessive updates
  const throttledSetActiveUsers = useCallback(
    throttle((users: UserPresence[]) => {
      presenceStore.setActiveUsers(users);
    }, 500), // Throttle to max once per 500ms
    [presenceStore]
  );
  
  useEffect(() => {
    // Create channel if it doesn't exist
    if (!channelRef.current) {
      const channel = supabase.channel(`block:${blockId}`, {
        config: {
          presence: {
            key: userId,
          },
        },
      });
      
      channelRef.current = channel;
      
      // Handle row changes - use database changes for reliability
      channel
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'requirements',
          filter: `block_id=eq.${blockId}`
        }, (payload) => {
          const newRow = payload.new as Requirement;
          
          // For new rows, invalidate the table rows query to refetch
          queryClient.invalidateQueries({ queryKey: ['requirements', blockId] });
          
          // Also set the new row in the cache directly
          queryClient.setQueryData(['requirements', newRow.id], newRow);
        })
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'requirements',
          filter: `block_id=eq.${blockId}`
        }, (payload) => {
          const updatedRow = payload.new as Requirement;
          
          // Only update if it wasn't our own change (those are handled by optimistic updates)
          if (updatedRow.updated_by !== userId) {
            // Update the row in the cache
            queryClient.setQueryData(['requirements', updatedRow.id], updatedRow);
            
            // Also invalidate the table rows query if the row is likely in the current view
            // This is a tradeoff - fewer refetches vs. potential stale data
            // Could be improved by checking if the row is actually in the current view
            queryClient.invalidateQueries({ queryKey: ['requirements', blockId] });
          }
        })
        .on('postgres_changes', { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'requirements',
          filter: `block_id=eq.${blockId}`
        }, (payload) => {
          const deletedRow = payload.old as Requirement;
          
          // Remove the row from the cache
          queryClient.removeQueries({ queryKey: ['requirements', deletedRow.id] });
          
          // Invalidate the table rows query to refetch without the deleted row
          queryClient.invalidateQueries({ queryKey: ['requirements', blockId] });
        });
      
      // Handle presence state changes - who's online
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as RealtimePresenceState<UserPresence>;
        
        // Convert presence state to array of users
        const users = Object.values(state).flatMap(presences => 
          presences.map(presence => ({
            user_id: presence.presence_ref.split(':')[0],
            user_name: presence.user_name,
            user_avatar: presence.user_avatar,
            online_at: presence.online_at,
            last_activity_at: presence.last_activity_at
          }))
        );
        
        // Update presence store using throttled function
        throttledSetActiveUsers(users);
      });
      
      // Handle cursor position broadcasts
      channel.on('broadcast', { event: 'cursor_position' }, (payload) => {
        // Extract cursor position from payload
        const position = payload.payload as CursorPosition;
        
        // Update the presence store with the new cursor position
        if (position.user_id !== userId) {
          presenceStore.updateCursorPosition(position);
        }
      });
      
      // Subscribe to channel
      channel.subscribe(status => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          
          // Track presence once connected
          const presence: UserPresence = {
            user_id: userId,
            user_name: userName,
            user_avatar: userAvatar,
            online_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString()
          };
          
          channel.track(presence);
        } else {
          setIsConnected(false);
        }
      });
    }
    
    // Clean up subscription on unmount
    return () => {
      if (cursorTimerRef.current) {
        clearTimeout(cursorTimerRef.current);
      }
      
      if (channelRef.current) {
        channelRef.current.untrack();
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [blockId, userId, userName, userAvatar, queryClient, presenceStore, throttledSetActiveUsers]);
  
  // Function to broadcast cursor position
  const broadcastCursorPosition = (position: Omit<CursorPosition, 'user_id'>) => {
    if (!isConnected || !channelRef.current) return;
    
    // Update local state immediately for responsive UI
    presenceStore.setMyPosition(position);
    
    // Debounce broadcasts to avoid flooding the channel
    if (cursorTimerRef.current) {
      clearTimeout(cursorTimerRef.current);
    }
    
    cursorTimerRef.current = setTimeout(() => {
      // Broadcast position to other users
      channelRef.current?.send({
        type: 'broadcast',
        event: 'cursor_position',
        payload: {
          user_id: userId,
          ...position,
          timestamp: new Date().toISOString()
        }
      });
    }, 50); // 50ms debounce for cursor updates
  };
  
  // Function to update presence with last activity
  const updateActivity = () => {
    if (!isConnected || !channelRef.current) return;
    
    channelRef.current.track({
      user_id: userId,
      user_name: userName,
      user_avatar: userAvatar,
      online_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString()
    });
  };
  
  // Return connection state and functions to interact with channel
  return {
    isConnected,
    broadcastCursorPosition,
    updateActivity
  };
}

/**
 * Hook to handle cursor position tracking and broadcasting
 */
export function useCursorTracking(
  blockId: string,
  userId: string,
  isConnected: boolean,
  broadcastCursorPosition: (position: Omit<CursorPosition, 'user_id'>) => void
) {
  const handleCellHover = (rowId: string, columnId: string, event: React.MouseEvent) => {
    if (!isConnected) return;
    
    // Get position relative to viewport
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Broadcast position
    broadcastCursorPosition({
      row_id: rowId,
      column_id: columnId,
      x,
      y,
      timestamp: new Date().toISOString()
    });
  };
  
  return { handleCellHover };
}

/**
 * Hook to get other users' cursor positions for the current cell
 */
export function useCellCursors(rowId: string, columnId: string) {
  const presenceStore = usePresenceStore();
  
  // Filter cursor positions for this cell
  const cursors = presenceStore.cursorPositions.filter(
    position => position.row_id === rowId && position.column_id === columnId
  );
  
  // Map cursor positions to users
  const cursorUsers = cursors.map(cursor => {
    const user = presenceStore.activeUsers.find(user => user.user_id === cursor.user_id);
    return {
      cursor,
      user
    };
  });
  
  return cursorUsers;
}