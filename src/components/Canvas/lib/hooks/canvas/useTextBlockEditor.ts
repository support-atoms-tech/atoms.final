// hooks/canvas/useTextBlockEditor.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { useBlock } from '@/components/Canvas/lib/providers/BlockContext';
import { useDocument } from '@/components/Canvas/lib/providers/DocumentContext';
import { useCollaboration } from '@/components/Canvas/lib/hooks/canvas/useCollaboration';

// Hook for text block editing
export function useTextBlockEditor(blockId: string) {
  const { block, isEntityLocked } = useBlock();
  const { editMode, updateBlock } = useDocument();
  
  // Get collaboration methods directly from the hook
  const { acquireEntityLock, releaseEntityLock } = useCollaboration();
  
  // Local state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(block.content?.text || '');
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Update local content when block changes and not in edit mode
  useEffect(() => {
    if (!isEditing) {
      setContent(block.content?.text || '');
    }
  }, [block, isEditing]);
  
  // Start editing
  const startEditing = useCallback(() => {
    if (!editMode || isEntityLocked(blockId)) return;
    
    const acquired = acquireEntityLock(blockId, 'block');
    if (acquired) {
      setIsEditing(true);
      
      // Focus the editor after render
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }, 0);
    }
  }, [editMode, isEntityLocked, blockId, acquireEntityLock]);
  
  // Stop editing and save or cancel
  const stopEditing = useCallback(async (save: boolean = true) => {
    if (!isEditing) return;
    
    if (save && content !== block.content?.text) {
      try {
        await updateBlock({
          id: blockId,
          content: { ...block.content, text: content }
        });
      } catch (err) {
        console.error('Failed to save text block:', err);
        // Revert to original content
        setContent(block.content?.text || '');
      }
    } else if (!save) {
      // Revert content
      setContent(block.content?.text || '');
    }
    
    setIsEditing(false);
    releaseEntityLock(blockId);
  }, [isEditing, content, block, blockId, updateBlock, releaseEntityLock]);
  
  // Handle changes to the editor content
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);
  
  // Handle keydown events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Save on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      stopEditing(true);
    }
    
    // Cancel on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      stopEditing(false);
    }
  }, [stopEditing]);
  
  return {
    content,
    isEditing,
    canEdit: editMode && !isEntityLocked(blockId),
    editorRef,
    startEditing,
    stopEditing,
    handleContentChange,
    handleKeyDown
  };
}