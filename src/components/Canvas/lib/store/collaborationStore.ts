'use client';

// lib/store/collaborationStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface EntityLock {
  entityId: string;
  userId: string;
  userName: string;
  lockType: 'block' | 'column' | 'requirement';
  timestamp: string;
  expiresAt: string;
}

interface UserPresence {
  userId: string;
  userName: string;
  avatar?: string;
  lastActive: string;
  isActive: boolean;
  cursorPosition?: { x: number, y: number };
}

interface CollaborationState {
  // Entity locks
  entityLocks: Record<string, EntityLock>;
  acquireLock: (entityId: string, userId: string, userName: string, lockType: 'block' | 'column' | 'requirement') => boolean;
  releaseLock: (entityId: string, userId: string) => void;
  isEntityLocked: (entityId: string) => boolean;
  isLockedByUser: (entityId: string, userId: string) => boolean;
  
  // User presence
  userPresence: Record<string, UserPresence>;
  setUserPresence: (userId: string, userName: string, avatar?: string) => void;
  updateUserCursor: (userId: string, position: { x: number, y: number }) => void;
  removeUser: (userId: string) => void;
  
  // Currently editing
  editingEntityId: string | null;
  setEditingEntity: (entityId: string | null) => void;
}

// Lock expiration time (5 minutes)
const LOCK_EXPIRATION_MS = 5 * 60 * 1000;

export const useCollaborationStore = create<CollaborationState>()(
  devtools(
    (set, get) => ({
      // Entity locks
      entityLocks: {},
      acquireLock: (entityId, userId, userName, lockType) => {
        const locks = get().entityLocks;
        
        // Check if already locked by someone else
        if (locks[entityId] && locks[entityId].userId !== userId) {
          const now = new Date();
          const expiresAt = new Date(locks[entityId].expiresAt);
          
          // If lock hasn't expired, can't acquire
          if (now < expiresAt) {
            return false;
          }
        }
        
        // Create lock with expiration
        const now = new Date();
        const expiresAt = new Date(now.getTime() + LOCK_EXPIRATION_MS);
        
        set((state) => ({
          entityLocks: {
            ...state.entityLocks,
            [entityId]: {
              entityId,
              userId,
              userName,
              lockType,
              timestamp: now.toISOString(),
              expiresAt: expiresAt.toISOString()
            }
          }
        }));
        
        return true;
      },
      releaseLock: (entityId, userId) => {
        const locks = get().entityLocks;
        
        // Only release if locked by this user
        if (locks[entityId] && locks[entityId].userId === userId) {
          set((state) => {
            const newLocks = { ...state.entityLocks };
            delete newLocks[entityId];
            return { entityLocks: newLocks };
          });
        }
      },
      isEntityLocked: (entityId) => {
        const lock = get().entityLocks[entityId];
        if (!lock) return false;
        
        // Check if lock is expired
        const now = new Date();
        const expiresAt = new Date(lock.expiresAt);
        
        return now < expiresAt;
      },
      isLockedByUser: (entityId, userId) => {
        const lock = get().entityLocks[entityId];
        if (!lock) return false;
        
        // Check if lock is expired
        const now = new Date();
        const expiresAt = new Date(lock.expiresAt);
        
        return now < expiresAt && lock.userId === userId;
      },
      
      // User presence
      userPresence: {},
      setUserPresence: (userId, userName, avatar) => {
        set((state) => ({
          userPresence: {
            ...state.userPresence,
            [userId]: {
              userId,
              userName,
              avatar,
              lastActive: new Date().toISOString(),
              isActive: true,
              cursorPosition: state.userPresence[userId]?.cursorPosition,
            }
          }
        }));
      },
      updateUserCursor: (userId, position) => {
        set((state) => {
          if (!state.userPresence[userId]) return state;
          
          return {
            userPresence: {
              ...state.userPresence,
              [userId]: {
                ...state.userPresence[userId],
                cursorPosition: position,
                lastActive: new Date().toISOString(),
                isActive: true
              }
            }
          };
        });
      },
      removeUser: (userId) => {
        set((state) => {
          const newPresence = { ...state.userPresence };
          delete newPresence[userId];
          return { userPresence: newPresence };
        });
      },
      
      // Currently editing
      editingEntityId: null,
      setEditingEntity: (entityId) => set({ editingEntityId: entityId })
    })
  )
);
