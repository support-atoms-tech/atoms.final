'use client';

// hooks/realtime/useDocumentRealtime.ts
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { useCanvasStore } from '@/components/Canvas/lib/store/canvasStore';
import { getQueryClient } from '@/lib/constants/queryClient';
import { Block } from '@/components/Canvas/types';

type RealtimePayload = {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: { [key: string]: any; client_id?: string; block_id?: string } | null;
  old: { [key: string]: any; client_id?: string; block_id?: string } | null;
  errors: null | any[];
};

function isValidPayload(payload: RealtimePayload): payload is RealtimePayload & { new: NonNullable<RealtimePayload['new']> } {
  return payload.new !== null;
}

function isValidOldPayload(payload: RealtimePayload): payload is RealtimePayload & { old: NonNullable<RealtimePayload['old']> } {
  return payload.old !== null;
}

export function useDocumentRealtime(documentId: string | null) {
  const queryClient = getQueryClient();
  const { clientId } = useCanvasStore();
  
  useEffect(() => {
    if (!documentId) return;
    
    // Set up channel for all document-related tables
    const channel = supabase.channel(`document-${documentId}`);
    
    // Subscribe to blocks changes
    channel.on('postgres_changes', {
      event: '*', 
      schema: 'public',
      table: 'blocks',
      filter: `document_id=eq.${documentId}`
    }, (payload: RealtimePayload) => {
      // Skip own changes by checking client_id
      if (isValidPayload(payload) && payload.new.client_id === clientId) {
        console.log('Skipping own block change');
        return;
      }
      
      console.log('Received blocks change:', payload);
      
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
    
    // Subscribe to changes on any specific block ID within this document
    // We'll need this for columns and requirements
    const blockChangeHandler = (payload: RealtimePayload) => {
      const blockId = isValidPayload(payload) ? payload.new.block_id : isValidOldPayload(payload) ? payload.old.block_id : undefined;
      
      // Skip own changes
      if (isValidPayload(payload) && payload.new.client_id === clientId) {
        console.log(`Skipping own ${payload.table} change`);
        return;
      }
      
      console.log(`Received ${payload.table} change:`, payload);
      
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
      // Skip own changes
      if (isValidPayload(payload) && payload.new.client_id === clientId) {
        console.log('Skipping own document change');
        return;
      }
      
      console.log('Received document change:', payload);
      
      // Update document in the cache
      if (isValidPayload(payload)) {
        queryClient.setQueryData(['document', documentId], payload.new);
      }
    });
    
    // Subscribe to the channel
    channel.subscribe((status: string) => {
      console.log(`Document realtime channel status: ${status}`);
    });
    
    // Clean up on unmount
    return () => {
      console.log('Unsubscribing from document realtime channel');
      supabase.removeChannel(channel);
    };
  }, [documentId, queryClient, clientId]);
}





