// store/presenceStore.ts
import { create } from 'zustand';
import { UserPresence, CursorPosition } from '@/components/CollaborativeTable/types';

// Helper for deep equality comparison of user arrays
const areUserArraysEqual = (prev: UserPresence[], next: UserPresence[]): boolean => {
  if (prev.length !== next.length) return false;
  
  // Create maps for faster lookup
  const prevMap = new Map(prev.map(user => [user.user_id, user]));
  
  // Check if all users in next exist in prev with same properties
  return next.every(nextUser => {
    const prevUser = prevMap.get(nextUser.user_id);
    if (!prevUser) return false;
    
    return (
      prevUser.user_name === nextUser.user_name &&
      prevUser.user_avatar === nextUser.user_avatar &&
      prevUser.online_at === nextUser.online_at &&
      prevUser.last_activity_at === nextUser.last_activity_at
    );
  });
};

interface PresenceState {
  // Track active users in the document
  activeUsers: UserPresence[];
  setActiveUsers: (users: UserPresence[]) => void;
  addActiveUser: (user: UserPresence) => void;
  removeActiveUser: (userId: string) => void;
  updateActiveUser: (userId: string, data: Partial<UserPresence>) => void;
  
  // Track cursor positions for collaborative editing
  cursorPositions: CursorPosition[];
  updateCursorPosition: (position: CursorPosition) => void;
  removeCursorPosition: (userId: string) => void;
  
  // For the current user's position
  myPosition: Omit<CursorPosition, 'user_id'> | null;
  setMyPosition: (position: Omit<CursorPosition, 'user_id'> | null) => void;
  
  // Focus tracking
  focusedCellByUser: Record<string, { rowId: string; columnId: string }>;
  setUserFocus: (userId: string, rowId: string, columnId: string) => void;
  clearUserFocus: (userId: string) => void;
  
  // Activity tracking
  setLastActive: (userId: string) => void;
  getInactiveUsers: (thresholdMinutes: number) => string[];
}

/**
 * Store for tracking user presence, cursor positions, and collaborative editing
 */
export const usePresenceStore = create<PresenceState>()((set, get) => ({
  activeUsers: [],
  
  setActiveUsers: (users) => {
    // Only update if the users array has actually changed
    const currentUsers = get().activeUsers;
    if (!areUserArraysEqual(currentUsers, users)) {
      set({ activeUsers: users });
    }
  },
  
  addActiveUser: (user) => set((state) => ({
    activeUsers: state.activeUsers.some(u => u.user_id === user.user_id)
      ? state.activeUsers.map(u => u.user_id === user.user_id ? { ...u, ...user } : u)
      : [...state.activeUsers, user]
  })),
  
  removeActiveUser: (userId) => set((state) => ({
    activeUsers: state.activeUsers.filter(user => user.user_id !== userId)
  })),
  
  updateActiveUser: (userId, data) => set((state) => ({
    activeUsers: state.activeUsers.map(user => 
      user.user_id === userId ? { ...user, ...data } : user
    )
  })),
  
  cursorPositions: [],
  
  updateCursorPosition: (position) => set((state) => {
    // Filter out old position for this user
    const filteredPositions = state.cursorPositions.filter(p => p.user_id !== position.user_id);
    
    // Add new position
    return {
      cursorPositions: [...filteredPositions, position],
      // Also update the focused cell for this user
      focusedCellByUser: {
        ...state.focusedCellByUser,
        [position.user_id]: {
          rowId: position.row_id,
          columnId: position.column_id
        }
      }
    };
  }),
  
  removeCursorPosition: (userId) => set((state) => ({
    cursorPositions: state.cursorPositions.filter(p => p.user_id !== userId)
  })),
  
  myPosition: null,
  
  setMyPosition: (position) => set({ myPosition: position }),
  
  focusedCellByUser: {},
  
  setUserFocus: (userId, rowId, columnId) => set((state) => ({
    focusedCellByUser: {
      ...state.focusedCellByUser,
      [userId]: { rowId, columnId }
    }
  })),
  
  clearUserFocus: (userId) => set((state) => {
    const { [userId]: _, ...rest } = state.focusedCellByUser;
    return { focusedCellByUser: rest };
  }),
  
  setLastActive: (userId) => set((state) => ({
    activeUsers: state.activeUsers.map(user => 
      user.user_id === userId 
        ? { ...user, last_activity_at: new Date().toISOString() }
        : user
    )
  })),
  
  getInactiveUsers: (thresholdMinutes = 5) => {
    const { activeUsers } = get();
    const thresholdTime = new Date(Date.now() - thresholdMinutes * 60 * 1000).toISOString();
    
    return activeUsers
      .filter(user => user.last_activity_at < thresholdTime)
      .map(user => user.user_id);
  }
}));