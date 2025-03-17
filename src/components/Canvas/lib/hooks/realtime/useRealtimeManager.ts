'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { useCollaborationStore } from '@/components/Canvas/lib/store/collaborationStore';
import { useAuth } from '@/hooks/useAuth';
import { Profile } from '@/components/Canvas/types';
import { getQueryClient } from '@/lib/constants/queryClient';
import { useCanvasStore } from '@/components/Canvas/lib/store/canvasStore';

// Types for realtime payloads
type PresencePayload = {
  userId: string;
  userName: string;
  avatar?: string;
  action: 'joined' | 'active' | 'left';
  cursorPosition?: { x: number; y: number };
};

type CursorPayload = {
  userId: string;
  position: { x: number; y: number };
};

type LockPayload = {
  entityId: string;
  userId: string;
  userName?: string;
  lockType: 'block' | 'column' | 'requirement';
  action: 'acquire' | 'release';
};

type BroadcastPayload<T> = {
  type: 'broadcast';
  event: string;
  payload: T;
};

type RealtimePayload = {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: { 
    [key: string]: any; 
    client_id?: string; 
    block_id?: string;
    operation_id?: string;
  } | null;
  old: { 
    [key: string]: any; 
    client_id?: string; 
    block_id?: string;
    operation_id?: string;
  } | null;
  errors: null | any[];
};

// Type guards for payload
function isValidPayload(payload: RealtimePayload): payload is RealtimePayload & { new: NonNullable<RealtimePayload['new']> } {
  return payload.new !== null;
}

function isValidOldPayload(payload: RealtimePayload): payload is RealtimePayload & { old: NonNullable<RealtimePayload['old']> } {
  return payload.old !== null;
}

// Static references to track active channels across component instances
const activeChannels: Record<string, any> = {};
const activeHeartbeats: Record<string, NodeJS.Timeout> = {};

// Track recently processed operations to prevent duplicate processing
const recentOperations = new Set<string>();
const MAX_RECENT_OPERATIONS = 1000;

// Add operation to tracking set with automatic cleanup
function trackOperation(operationId: string) {
  // Add to tracking set
  recentOperations.add(operationId);
  
  // Clean up old operations if we exceed the limit
  if (recentOperations.size > MAX_RECENT_OPERATIONS) {
    // Remove oldest entries (first 20% of the set)
    const entriesToRemove = Math.floor(MAX_RECENT_OPERATIONS * 0.2);
    const entries = Array.from(recentOperations);
    for (let i = 0; i < entriesToRemove; i++) {
      recentOperations.delete(entries[i]);
    }
  }
  
  // Auto-remove after 5 minutes
  setTimeout(() => {
    recentOperations.delete(operationId);
  }, 5 * 60 * 1000);
}

/**
 * Hook to manage all realtime connections and updates in one place
 * This decouples realtime from the DocumentContext to prevent unnecessary re-renders
 * @param documentId The document ID to connect to
 * @param debug Enable debug logging
 */
export function useRealtimeManager(documentId: string | null, debug: boolean = false) {
  const queryClient = getQueryClient();
  const { clientId } = useCanvasStore();
  const { 
    setUserPresence, 
    updateUserCursor, 
    removeUser, 
    acquireLock, 
    releaseLock 
  } = useCollaborationStore();
  const { userProfile } = useAuth();
  
  // Track processed operations for this component instance
  const [processedOperations] = useState(() => new Set<string>());
  
  let user = userProfile as Profile;
  
  // Create a ref to store the collaboration store methods
  // This avoids the need to call useCollaborationStore.getState() in callbacks
  const storeRef = useRef({
    acquireLock,
    releaseLock
  });
  
  // Update the ref when the store methods change
  useEffect(() => {
    storeRef.current = {
      acquireLock,
      releaseLock
    };
  }, [acquireLock, releaseLock]);
  
  // Set up document data realtime handlers
  useEffect(() => {
    if (!documentId) return;
    
    if (debug) {
      console.log(`[Realtime] Setting up document data channel for ${documentId}`);
    }
    
    // Set up channel for all document-related tables
    const channel = supabase.channel(`document-data-${documentId}`);
    
    // Subscribe to blocks changes
    channel.on('postgres_changes', {
      event: '*', 
      schema: 'public',
      table: 'blocks',
      filter: `document_id=eq.${documentId}`
    }, (payload: RealtimePayload) => {
      // Enhanced validation to skip own changes and already processed operations
      if (isValidPayload(payload)) {
        // Skip if this is our own change
        if (payload.new.client_id === clientId) {
          if (debug) console.log('[Realtime] Skipping own block change', payload.new.id);
          return;
        }
        
        // Skip if we've already processed this operation
        if (payload.new.operation_id && 
            (recentOperations.has(payload.new.operation_id) || 
             processedOperations.has(payload.new.operation_id))) {
          if (debug) console.log('[Realtime] Skipping already processed operation', payload.new.operation_id);
          return;
        }
        
        // Track this operation
        if (payload.new.operation_id) {
          trackOperation(payload.new.operation_id);
          processedOperations.add(payload.new.operation_id);
        }
      }
      
      // Handle the change based on event type
      if (payload.eventType === 'INSERT' && isValidPayload(payload)) {
        queryClient.setQueryData(['blocks', documentId], (old: any[] = []) => {
          // Only add if not already in the cache
          if (!old.some(block => block.id === payload.new.id)) {
            const newBlocks = [...old, payload.new];
            return newBlocks.sort((a, b) => a.position - b.position);
          }
          return old;
        });
      } else if (payload.eventType === 'UPDATE' && isValidPayload(payload)) {
        queryClient.setQueryData(['blocks', documentId], (old: any[] = []) => {
          return old.map(block => 
            block.id === payload.new.id ? { ...block, ...payload.new } : block
          );
        });
      } else if (payload.eventType === 'DELETE' && isValidOldPayload(payload)) {
        queryClient.setQueryData(['blocks', documentId], (old: any[] = []) => {
          return old.filter(block => block.id !== payload.old.id);
        });
      }
    });
    
    // Create handler for block-related entities
    const blockChangeHandler = (payload: RealtimePayload) => {
      const blockId = isValidPayload(payload) ? payload.new.block_id : isValidOldPayload(payload) ? payload.old.block_id : undefined;
      
      // Enhanced validation to skip own changes and already processed operations
      if (isValidPayload(payload)) {
        // Skip if this is our own change
        if (payload.new.client_id === clientId) {
          if (debug) console.log(`[Realtime] Skipping own ${payload.table} change`, payload.new.id);
          return;
        }
        
        // Skip if we've already processed this operation
        if (payload.new.operation_id && 
            (recentOperations.has(payload.new.operation_id) || 
             processedOperations.has(payload.new.operation_id))) {
          if (debug) console.log('[Realtime] Skipping already processed operation', payload.new.operation_id);
          return;
        }
        
        // Track this operation
        if (payload.new.operation_id) {
          trackOperation(payload.new.operation_id);
          processedOperations.add(payload.new.operation_id);
        }
      }
      
      if (!blockId) return;
      
      const queryKey = [payload.table, blockId];
      
      // Handle the change based on event type
      if (payload.eventType === 'INSERT' && isValidPayload(payload)) {
        queryClient.setQueryData(queryKey, (old: any[] = []) => {
          // Only add if not already in the cache
          if (!old.some(item => item.id === payload.new.id)) {
            const newItems = [...old, payload.new];
            // If it has a position field, sort by it
            if ('position' in payload.new) {
              return newItems.sort((a, b) => a.position - b.position);
            }
            return newItems;
          }
          return old;
        });
      } else if (payload.eventType === 'UPDATE' && isValidPayload(payload)) {
        queryClient.setQueryData(queryKey, (old: any[] = []) => {
          return old.map(item => 
            item.id === payload.new.id ? { ...item, ...payload.new } : item
          );
        });
      } else if (payload.eventType === 'DELETE' && isValidOldPayload(payload)) {
        queryClient.setQueryData(queryKey, (old: any[] = []) => {
          return old.filter(item => item.id !== payload.old.id);
        });
      }
    };
    
    // Subscribe to columns changes
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'columns'
    }, blockChangeHandler);
    
    // Subscribe to requirements changes
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'requirements'
    }, blockChangeHandler);
    
    // Subscribe to document changes
    channel.on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'documents',
      filter: `id=eq.${documentId}`
    }, (payload: RealtimePayload) => {
      // Enhanced validation to skip own changes and already processed operations
      if (isValidPayload(payload)) {
        // Skip if this is our own change
        if (payload.new.client_id === clientId) {
          if (debug) console.log('[Realtime] Skipping own document change');
          return;
        }
        
        // Skip if we've already processed this operation
        if (payload.new.operation_id && 
            (recentOperations.has(payload.new.operation_id) || 
             processedOperations.has(payload.new.operation_id))) {
          if (debug) console.log('[Realtime] Skipping already processed operation', payload.new.operation_id);
          return;
        }
        
        // Track this operation
        if (payload.new.operation_id) {
          trackOperation(payload.new.operation_id);
          processedOperations.add(payload.new.operation_id);
        }
      }
      
      // Update document in the cache
      if (isValidPayload(payload)) {
        queryClient.setQueryData(['document', documentId], payload.new);
      }
    });
    
    // Subscribe to the channel
    channel.subscribe();
    
    // Clean up on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId, queryClient, clientId, debug, processedOperations]);
  
  // Set up collaboration realtime handlers
  useEffect(() => {
    if (!documentId || !userProfile) return;
    
    if (debug) {
      console.log(`[Realtime] Setting up collaboration channel for ${documentId}`);
    }
    
    // Only create a new channel if one doesn't exist for this document
    if (!activeChannels[documentId]) {
      // Create a single channel instance for presence
      const presenceChannel = supabase.channel(`presence-${documentId}`, {
        config: {
          broadcast: { self: false }
        }
      });
      
      if (debug) {
        console.log(`[Realtime] Created new presence channel for ${documentId}`);
      }
      
      // Store the channel in the static map
      activeChannels[documentId] = presenceChannel;
      
      // Set up handlers for collaboration events
      presenceChannel
        // Handle user presence updates
        .on(
          'broadcast',
          { event: 'presence' },
          (message: BroadcastPayload<PresencePayload>) => {
            const { payload } = message;
            const { userId, userName, action } = payload;
            
            // Skip own events
            if (userId === user.id) return;
            
            if (debug) {
              console.log(`[Realtime] Received presence event: ${action} from ${userName}`);
            }
            
            if (action === 'joined' || action === 'active') {
              setUserPresence(userId, userName, payload.avatar);
              
              // If cursor position is provided, update it
              if (payload.cursorPosition) {
                updateUserCursor(userId, payload.cursorPosition);
              }
            } else if (action === 'left') {
              removeUser(userId);
            }
          }
        )
        
        // Handle cursor position updates
        .on(
          'broadcast',
          { event: 'cursor' },
          (message: BroadcastPayload<CursorPayload>) => {
            const { payload } = message;
            const { userId, position } = payload;
            
            // Skip own events
            if (userId === user.id) return;
            
            if (debug) {
              console.log(`[Realtime] Received cursor update from ${userId} at (${position.x}, ${position.y})`);
            }
            
            updateUserCursor(userId, position);
          }
        )
        
        // Handle entity lock events
        .on(
          'broadcast',
          { event: 'lock' },
          (message: BroadcastPayload<LockPayload>) => {
            const { payload } = message;
            const { entityId, userId, userName, lockType, action } = payload;
            
            // Skip own events
            if (userId === user.id) return;
            
            if (debug) {
              console.log(`[Realtime] Received lock event: ${action} for ${entityId} by ${userName || userId}`);
            }
            
            if (action === 'acquire') {
              acquireLock(entityId, userId, userName || '', lockType);
            } else if (action === 'release') {
              releaseLock(entityId, userId);
            }
          }
        );
      
      // Subscribe to the channel
      presenceChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (debug) {
            console.log(`[Realtime] Presence channel subscribed for ${documentId}`);
          }
          
          // Broadcast user presence
          presenceChannel.send({
            type: 'broadcast',
            event: 'presence',
            payload: {
              userId: user.id,
              userName: user.full_name || user.email,
              avatar: user.avatar_url,
              action: 'joined'
            }
          });
          
          // Set up heartbeat interval if none exists for this document
          if (!activeHeartbeats[documentId]) {
            activeHeartbeats[documentId] = setInterval(() => {
              const channel = activeChannels[documentId];
              if (channel) {
                channel.send({
                  type: 'broadcast',
                  event: 'presence',
                  payload: {
                    userId: user.id,
                    userName: user.full_name || user.email,
                    avatar: user.avatar_url,
                    action: 'active'
                  }
                });
              }
            }, 30000); // Every 30 seconds
          }
        }
      });
    } else {
      if (debug) {
        console.log(`[Realtime] Reusing existing presence channel for ${documentId}`);
      }
      
      // If we're reusing the channel, just announce our presence
      const channel = activeChannels[documentId];
      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'presence',
          payload: {
            userId: user.id,
            userName: user.full_name || user.email,
            avatar: user.avatar_url,
            action: 'joined'
          }
        });
      }
    }
    
    // Clean up function
    return () => {
      // We'll just send a left message to indicate this particular component is no longer watching
      if (documentId && activeChannels[documentId]) {
        activeChannels[documentId].send({
          type: 'broadcast',
          event: 'presence',
          payload: {
            userId: user.id,
            action: 'left'
          }
        });
      }
    };
  }, [documentId, userProfile, user, setUserPresence, updateUserCursor, removeUser, acquireLock, releaseLock, debug]);
  
  // When the app is closing or navigating away, clean up all channels
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clean up all channels when the window is closing
      Object.entries(activeChannels).forEach(([docId, channel]) => {
        // Clear any heartbeats
        if (activeHeartbeats[docId]) {
          clearInterval(activeHeartbeats[docId]);
          delete activeHeartbeats[docId];
        }
        
        // Remove the channel
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.error('Error removing channel during page unload:', error);
        }
        
        delete activeChannels[docId];
      });
    };
    
    // Listen for beforeunload event
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  // Return collaboration methods that can be used across the app
  return {
    updateCursor: useCallback((position: { x: number, y: number }) => {
      if (!documentId || !user || !activeChannels[documentId]) return;
      
      if (debug) {
        console.log(`[Realtime] Sending cursor update at (${position.x}, ${position.y})`);
      }
      
      // Use the existing channel reference
      activeChannels[documentId].send({
        type: 'broadcast',
        event: 'cursor',
        payload: {
          userId: user.id,
          position
        }
      });
    }, [documentId, user, debug]),
    
    acquireEntityLock: useCallback((entityId: string, lockType: 'block' | 'column' | 'requirement') => {
      if (!documentId || !user || !activeChannels[documentId]) return false;
      
      if (debug) {
        console.log(`[Realtime] Attempting to acquire lock for ${entityId} (${lockType})`);
      }
      
      // First try to acquire the lock locally using the ref
      if (!storeRef.current.acquireLock(entityId, user.id, user.full_name || user.email, lockType)) {
        if (debug) {
          console.log(`[Realtime] Failed to acquire lock for ${entityId} - already locked`);
        }
        return false;
      }
      
      if (debug) {
        console.log(`[Realtime] Successfully acquired lock for ${entityId} - broadcasting`);
      }
      
      // Broadcast the lock acquisition
      activeChannels[documentId].send({
        type: 'broadcast',
        event: 'lock',
        payload: {
          entityId,
          userId: user.id,
          userName: user.full_name || user.email,
          lockType,
          action: 'acquire'
        }
      });
      
      return true;
    }, [documentId, user, debug]),
    
    releaseEntityLock: useCallback((entityId: string) => {
      if (!documentId || !user || !activeChannels[documentId]) return;
      
      if (debug) {
        console.log(`[Realtime] Releasing lock for ${entityId}`);
      }
      
      // Release the lock locally using the ref
      storeRef.current.releaseLock(entityId, user.id);
      
      // Broadcast the lock release
      activeChannels[documentId].send({
        type: 'broadcast',
        event: 'lock',
        payload: {
          entityId,
          userId: user.id,
          action: 'release'
        }
      });
    }, [documentId, user, debug])
  };
} 