// hooks/canvas/useCellEditor.ts
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Requirement, Property } from '@/components/Canvas/types';
import { useBlock } from '@/components/Canvas/lib/providers/BlockContext';
import { useTable } from '@/components/Canvas/lib/providers/TableContext';
import { useCollaboration } from '@/components/Canvas/lib/hooks/canvas/useCollaboration';

// Hook for editing a specific cell in a table
export function useCellEditor(requirementId: string, propertyId: string, property?: Property) {
  const { block, isEntityLocked, updateRequirement, requirements } = useBlock();
  const { startCellEdit, endCellEdit, currentEditCell } = useTable();
  
  // Get the requirement - memoize to prevent unnecessary lookups
  const requirement = useMemo(() => {
    return requirements.find(req => req.id === requirementId);
  }, [requirements, requirementId]);
  
  // Safely access document_id or org_id with fallback to block's document_id
  const contextId = useMemo(() => {
    return property?.document_id || property?.org_id || block?.document_id || '';
  }, [property?.document_id, property?.org_id, block?.document_id]);
  
  // Use the shared collaboration hook with the specific context ID
  const { acquireEntityLock, releaseEntityLock } = useCollaboration(contextId);
  
  // Current value - memoize to prevent unnecessary calculations
  const currentValue = useMemo(() => {
    return requirement?.properties?.[propertyId];
  }, [requirement?.properties, propertyId]);
  
  // Local state for editing
  const [value, setValue] = useState(currentValue);
  const [isEditing, setIsEditing] = useState(false);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);
  
  // Store original value for potential rollback
  const originalValueRef = useRef<any>(currentValue);
  
  // Check if this cell is currently being edited - memoize to prevent unnecessary calculations
  const isCurrentlyEditing = useMemo(() => {
    return currentEditCell?.requirementId === requirementId && 
           currentEditCell?.propertyId === propertyId;
  }, [currentEditCell?.requirementId, currentEditCell?.propertyId, requirementId, propertyId]);
  
  // Update local value when requirement changes and not in edit mode
  useEffect(() => {
    if (!isEditing && !isOptimistic) {
      setValue(requirement?.properties?.[propertyId]);
      originalValueRef.current = requirement?.properties?.[propertyId];
    }
  }, [requirement, propertyId, isEditing, isOptimistic]);
  
  // Focus input when editing starts
  useEffect(() => {
    if (isCurrentlyEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCurrentlyEditing]);
  
  // Memoize the entity lock check to prevent unnecessary calculations
  const isLocked = useMemo(() => {
    return isEntityLocked(requirementId);
  }, [isEntityLocked, requirementId]);
  
  // Start editing with optimistic lock acquisition
  const startEditing = useCallback(() => {
    if (isLocked) return;
    
    // Optimistically update UI state
    setIsEditing(true);
    startCellEdit(requirementId, propertyId);
    originalValueRef.current = requirement?.properties?.[propertyId];
    
    // Then acquire lock in background
    // We need to handle both synchronous and asynchronous implementations of acquireEntityLock
    const lockResult = acquireEntityLock(requirementId, 'requirement');
    
    // If it's a Promise (async implementation)
    if (lockResult !== null && typeof lockResult === 'object' && 'then' in lockResult) {
      (lockResult as Promise<boolean>).then((acquired: boolean) => {
        if (!acquired) {
          // If lock acquisition failed, revert UI state
          setIsEditing(false);
          endCellEdit(false);
        }
      });
    } 
    // If it's a boolean (sync implementation)
    else if (typeof lockResult === 'boolean' && !lockResult) {
      // If lock acquisition failed, revert UI state
      setIsEditing(false);
      endCellEdit(false);
    }
  }, [isLocked, requirementId, propertyId, acquireEntityLock, startCellEdit, requirement, endCellEdit]);
  
  // Stop editing and save or cancel
  const stopEditing = useCallback(async (save: boolean = true) => {
    if (!isEditing) return;
    
    if (save && value !== requirement?.properties?.[propertyId]) {
      try {
        // Set optimistic flag to prevent value reset from useEffect
        setIsOptimistic(true);
        
        // Optimistically update local state
        const optimisticProperties = {
          ...requirement?.properties,
          [propertyId]: value
        };
        
        // Update the cell value
        await updateRequirement({
          id: requirementId,
          properties: optimisticProperties
        });
        
        // Clear optimistic flag after successful update
        setIsOptimistic(false);
      } catch (err) {
        console.error('Failed to save cell:', err);
        // Revert to original value on error
        setValue(originalValueRef.current);
        setIsOptimistic(false);
      }
    } else if (!save) {
      // Revert to original value
      setValue(originalValueRef.current);
    }
    
    setIsEditing(false);
    endCellEdit(save);
    releaseEntityLock(requirementId);
  }, [isEditing, value, requirement, requirementId, propertyId, updateRequirement, endCellEdit, releaseEntityLock]);
  
  // Handle value change
  const handleValueChange = useCallback((newValue: any) => {
    setValue(newValue);
  }, []);
  
  // Handle keydown events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Save on Enter (except in textarea)
    if (e.key === 'Enter' && (e.target as Element).tagName.toLowerCase() !== 'textarea') {
      e.preventDefault();
      stopEditing(true);
    }
    
    // Cancel on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      stopEditing(false);
    }
  }, [stopEditing]);
  
  // Handle click outside
  const handleClickOutside = useCallback(() => {
    if (isEditing) {
      stopEditing(true);
    }
  }, [isEditing, stopEditing]);
  
  // Return memoized values to prevent unnecessary re-renders
  return useMemo(() => ({
    value,
    isEditing: isCurrentlyEditing,
    canEdit: !isLocked,
    inputRef,
    startEditing,
    stopEditing,
    handleValueChange,
    handleKeyDown,
    handleClickOutside
  }), [
    value,
    isCurrentlyEditing,
    isLocked,
    startEditing,
    stopEditing,
    handleValueChange,
    handleKeyDown,
    handleClickOutside
  ]);
}