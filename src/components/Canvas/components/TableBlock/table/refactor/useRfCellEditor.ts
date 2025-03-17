// useCellEditor.ts - Hook for managing cell editing state
'use client';

import { useState, useRef, useCallback } from 'react';
import { Property } from '@/components/Canvas/types';
import { useTableStore } from './tableStore';
import { useTableCollaboration } from './RefactoredTableBlock';
import { useDocument } from '@/components/Canvas/lib/providers/DocumentContext';
import { useBlock } from '@/components/Canvas/lib/providers/BlockContext';

/**
 * Custom hook for managing cell editing state and interactions
 * Handles editing, keyboard navigation, and collaborative updates
 */
export function useRefactoredCellEditor(
  rowId: string,
  propertyId: string,
  property: Property
) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const { editMode } = useDocument();
  const store = useTableStore();
  const { updateRequirement } = useBlock();
  
  // Find the value in our store
  const requirement = store.requirements.find(req => req.id === rowId);
  const value = requirement?.properties?.[propertyId];
  
  // Use table collaboration context
  const collaboration = useTableCollaboration();
  
  // Only allow editing in edit mode
  const canEdit = editMode;
  
  // Start editing handler
  const startEditing = useCallback(() => {
    if (canEdit) {
      setIsEditing(true);
    }
  }, [canEdit]);
  
  // Stop editing handler
  const stopEditing = useCallback(() => {
    setIsEditing(false);
  }, []);
  
  // Value change handler that updates both local state and collaborative state
  const handleValueChange = useCallback((newValue: any) => {
    if (collaboration) {
      // Use collaboration to update shared state
      updateRequirement({
        id: rowId,
        properties: { [propertyId]: newValue }
      });
    }
    
    // Update in our local store
    store.updateCell(rowId, propertyId, newValue);
  }, [collaboration, rowId, propertyId, store, updateRequirement]);
  
  // Key down handler for keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      stopEditing();
      
      // Future enhancement: Navigate to next cell based on key
    } else if (e.key === 'Escape') {
      e.preventDefault();
      stopEditing();
    }
  }, [stopEditing]);
  
  // Click outside handler
  const handleClickOutside = useCallback(() => {
    stopEditing();
  }, [stopEditing]);
  
  return {
    value,
    isEditing,
    canEdit,
    inputRef,
    startEditing,
    stopEditing,
    handleValueChange,
    handleKeyDown,
    handleClickOutside
  };
}

