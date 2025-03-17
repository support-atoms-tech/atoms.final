'use client';

import { useCallback, useMemo } from 'react';
import { useCollaborationStore } from '@/components/Canvas/lib/store/collaborationStore';
import { useRealtimeManager } from '@/components/Canvas/lib/hooks/realtime/useRealtimeManager';
import { useParams } from 'next/navigation';

/**
 * Hook to access collaboration features directly without going through DocumentContext
 * This prevents unnecessary re-renders in components that only need collaboration features
 * @param customDocumentId Optional document ID to override the one from URL params
 * @param debug Enable debug logging
 */
export function useCollaboration(customDocumentId?: string | null, debug: boolean = false) {
  const params = useParams();
  const documentId = useMemo(() => {
    // Use custom document ID if provided, otherwise use the one from URL params
    if (customDocumentId !== undefined) return customDocumentId;
    return typeof params.id === 'string' ? params.id : null;
  }, [params, customDocumentId]);
  
  // Get realtime methods
  const realtimeMethods = useRealtimeManager(documentId, debug);
  
  // Get store methods - call hooks at the top level
  const { 
    entityLocks,
    userPresence,
    isEntityLocked,
    isLockedByUser,
    editingEntityId,
    setEditingEntity
  } = useCollaborationStore();
  
  // Create getActiveUsers callback outside of useMemo
  const getActiveUsers = useCallback(() => {
    return Object.values(userPresence).filter(user => user.isActive);
  }, [userPresence]);
  
  // Combine store and realtime methods
  return useMemo(() => ({
    // Realtime methods
    updateCursor: realtimeMethods.updateCursor,
    acquireEntityLock: realtimeMethods.acquireEntityLock,
    releaseEntityLock: realtimeMethods.releaseEntityLock,
    
    // Store data
    entityLocks,
    userPresence,
    
    // Store methods
    isEntityLocked,
    isLockedByUser,
    
    // Editing entity
    editingEntityId,
    setEditingEntity,
    
    // Convenience methods
    getActiveUsers
  }), [
    realtimeMethods,
    entityLocks,
    userPresence,
    isEntityLocked,
    isLockedByUser,
    editingEntityId,
    setEditingEntity,
    getActiveUsers
  ]);
} 