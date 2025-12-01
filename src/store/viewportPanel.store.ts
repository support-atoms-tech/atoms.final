import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewportContentType = 'requirement' | 'document' | 'hyperlink';
export type ViewportSource = 'manual' | 'link';

export interface ViewportContent {
    type: ViewportContentType;
    contentId: string; // requirement ID, document ID, or URL
    documentId?: string; // parent document for requirements
    label?: string;
}

interface ViewportPanelState {
    isOpen: boolean;
    activeTab: ViewportContentType; // Track tab separately from content
    contentType: ViewportContentType | null;
    contentId: string | null;
    documentId: string | null;
    label: string | null;
    source: ViewportSource;

    // Actions
    openViewport: () => void;
    closeViewport: () => void;
    setActiveTab: (tab: ViewportContentType) => void;
    setContent: (
        type: ViewportContentType,
        contentId: string,
        source: ViewportSource,
        options?: { documentId?: string; label?: string },
    ) => void;
    clearContent: () => void;
    setContentFromLink: (content: ViewportContent) => void;
}

export const useViewportPanelStore = create<ViewportPanelState>()(
    persist(
        (set) => ({
            isOpen: false,
            activeTab: 'requirement', // Default tab
            contentType: null,
            contentId: null,
            documentId: null,
            label: null,
            source: 'manual',

            openViewport: () => set({ isOpen: true }),

            closeViewport: () => set({ isOpen: false }),

            setActiveTab: (tab) => set({ activeTab: tab }),

            setContent: (type, contentId, source, options) =>
                set({
                    isOpen: true,
                    activeTab: type, // Also switch tab when setting content
                    contentType: type,
                    contentId,
                    documentId: options?.documentId ?? null,
                    label: options?.label ?? null,
                    source,
                }),

            clearContent: () =>
                set({
                    contentType: null,
                    contentId: null,
                    documentId: null,
                    label: null,
                }),

            // Helper for link-triggered content
            setContentFromLink: (content) =>
                set({
                    isOpen: true,
                    activeTab: content.type, // Also switch tab when setting from link
                    contentType: content.type,
                    contentId: content.contentId,
                    documentId: content.documentId ?? null,
                    label: content.label ?? null,
                    source: 'link',
                }),
        }),
        {
            name: 'atoms-viewport-panel',
            // Only persist isOpen state, not content
            partialize: (state) => ({
                isOpen: state.isOpen,
            }),
        },
    ),
);
