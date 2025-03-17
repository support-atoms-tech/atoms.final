// Example usage for properties
// hooks/realtime/usePropertiesRealtime.ts
import { useRealtimeSync } from './useRealtimeSync';
import { Property } from '@/components/Canvas/types';

export function usePropertiesRealtime(orgId: string | null, documentId?: string | null) {
  // Create filter based on org and document
  let filter = orgId ? `org_id=eq.${orgId}` : '';
  
  if (documentId) {
    filter += filter ? ` AND (document_id=eq.${documentId} OR document_id=is.null)` : `document_id=eq.${documentId} OR document_id=is.null`;
  }
  
  // Use general realtime sync hook
  useRealtimeSync<Property>(
    'properties',
    ['properties', orgId, documentId],
    filter
  );
}