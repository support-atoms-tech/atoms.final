// components/canvas/components/CanvasToolbar.tsx
'use client';

import { useState } from 'react';
import { useDocument } from '@/components/Canvas/lib/providers/DocumentContext';
import { useUIStore } from '@/components/Canvas/lib/store/uiStore';

export function CanvasToolbar() {
  const { editMode, toggleEditMode } = useDocument();
  const { activeOrgId, activeProjectId, activeDocumentId } = useUIStore();
  const [isSaving, setIsSaving] = useState(false);
  
  // Handle edit mode toggle
  const handleToggleEditMode = () => {
    // If turning off edit mode, simulate saving (would normally save pending changes)
    if (editMode) {
      setIsSaving(true);
      setTimeout(() => {
        toggleEditMode();
        setIsSaving(false);
      }, 500); // Simulate network delay
    } else {
      toggleEditMode();
    }
  };
  
  // Handle sharing
  const handleShare = () => {
    if (!activeDocumentId) return;
    
    // Copy shareable link to clipboard
    const shareableLink = `${window.location.origin}/dashboard/${activeOrgId}/${activeProjectId}/${activeDocumentId}`;
    navigator.clipboard.writeText(shareableLink);
    
    // Show toast notification (would normally use a proper toast component)
    alert('Shareable link copied to clipboard');
  };
  
  return (
    <div className="canvas-toolbar flex justify-between items-center p-2 border-b bg-white sticky top-0 z-10">
      <div className="left-section">
        {/* Edit/View toggle */}
        <button
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            editMode
              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          onClick={handleToggleEditMode}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : editMode ? 'Editing' : 'View Mode'}
        </button>
      </div>
      
      <div className="right-section flex space-x-2">
        {/* History button */}
        <button
          className="px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
        >
          History
        </button>
        
        {/* Share button */}
        <button
          className="px-3 py-1 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
          onClick={handleShare}
        >
          Share
        </button>
      </div>
    </div>
  );
}