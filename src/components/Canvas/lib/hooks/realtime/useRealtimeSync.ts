// hooks/realtime/useRealtimeSync.ts
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { useQueryClient } from '@tanstack/react-query';
import { useCanvasStore } from '@/components/Canvas/lib/store/canvasStore';

type RealtimePayload = {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: { [key: string]: any; client_id?: string } | null;
  old: { [key: string]: any; client_id?: string } | null;
  errors: null | any[];
};

export function useRealtimeSync<T>(
  table: string,
  queryKey: any[],
  filter?: string,
  transformFn?: (data: any) => T
) {
  const queryClient = useQueryClient();
  const { clientId } = useCanvasStore();
  
  useEffect(() => {
    if (!queryKey.length) return;
    
    // Set up channel for table changes
    const channel = supabase.channel(`${table}-changes`);
    
    // Create subscription config
    const config: any = {
      event: '*',
      schema: 'public',
      table
    };
    
    // Add filter if provided
    if (filter) {
      config.filter = filter;
    }
    
    // Subscribe to table changes
    channel.on('postgres_changes', config, (payload: RealtimePayload) => {
      // Skip own changes
      if (payload.new?.client_id === clientId) {
        console.log(`Skipping own ${table} change`);
        return;
      }
      
      console.log(`Received ${table} change:`, payload);
      
      // Apply transform function if provided
      const transformData = (data: any) => {
        if (transformFn) {
          return transformFn(data);
        }
        return data;
      };
      
      // Handle the change based on event type
      if (payload.eventType === 'INSERT' && payload.new) {
        queryClient.setQueryData(queryKey, (old: any[] = []) => {
          // Only add if not already in the cache
          if (!old.some(item => item.id === payload.new!.id)) {
            return [...old, transformData(payload.new)];
          }
          return old;
        });
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        queryClient.setQueryData(queryKey, (old: any[] = []) => {
          return old.map(item => 
            item.id === payload.new!.id ? { ...item, ...transformData(payload.new) } : item
          );
        });
      } else if (payload.eventType === 'DELETE' && payload.old) {
        queryClient.setQueryData(queryKey, (old: any[] = []) => {
          return old.filter(item => item.id !== payload.old!.id);
        });
      }
    });
    
    // Subscribe to the channel
    channel.subscribe((status: string) => {
      console.log(`Realtime channel for ${table} status: ${status}`);
    });
    
    // Clean up on unmount
    return () => {
      console.log(`Unsubscribing from ${table} realtime channel`);
      supabase.removeChannel(channel);
    };
  }, [table, queryKey, filter, transformFn, queryClient, clientId]);
}