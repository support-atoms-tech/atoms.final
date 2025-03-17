'use client';

// lib/store/uiStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UIState {
  // Global edit mode
  editMode: boolean;
  toggleEditMode: () => void;
  setEditMode: (mode: boolean) => void;
  
  // Sidebar state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  
  // Active context
  activeOrgId: string | null;
  activeProjectId: string | null;
  activeDocumentId: string | null;
  
  setActiveOrg: (orgId: string | null) => void;
  setActiveProject: (projectId: string | null) => void;
  setActiveDocument: (documentId: string | null) => void;
  
  // Display preferences
  compactMode: boolean;
  toggleCompactMode: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        // Global edit mode
        editMode: false,
        toggleEditMode: () => set((state) => ({ editMode: !state.editMode })),
        setEditMode: (mode: boolean) => set({ editMode: mode }),
        
        // Sidebar state
        sidebarOpen: true,
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        
        // Active context
        activeOrgId: null,
        activeProjectId: null,
        activeDocumentId: null,
        
        setActiveOrg: (orgId) => {
          console.log('Setting active org ID:', orgId);
          set({ 
            activeOrgId: orgId,
            // Reset child entities when org changes
            activeProjectId: null,
            activeDocumentId: null
          });
        },
        setActiveProject: (projectId) => set({ 
          activeProjectId: projectId,
          // Reset child entities when project changes
          activeDocumentId: null
        }),
        setActiveDocument: (documentId) => set({ activeDocumentId: documentId }),
        
        // Display preferences
        compactMode: false,
        toggleCompactMode: () => set((state) => ({ compactMode: !state.compactMode })),
      }),
      {
        name: 'ui-storage',
        partialize: (state) => ({
          // Persist these values in localStorage
          sidebarOpen: state.sidebarOpen,
          compactMode: state.compactMode,
          activeOrgId: state.activeOrgId,
          activeProjectId: state.activeProjectId,
          activeDocumentId: state.activeDocumentId,
        }),
      }
    )
  )
);


