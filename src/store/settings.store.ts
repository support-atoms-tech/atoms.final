// stores/settings.store.ts
import { create } from 'zustand'

type SettingsStore = {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))