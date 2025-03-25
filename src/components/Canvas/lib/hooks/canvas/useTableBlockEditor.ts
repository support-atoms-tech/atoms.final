// hooks/canvas/useTableBlockEditor.ts
import { useCallback, useState, useMemo } from 'react';
import { useBlock } from '@/components/Canvas/lib/providers/BlockContext';
import { useTable } from '@/components/Canvas/lib/providers/TableContext';
import { useDocument } from '@/components/Canvas/lib/providers/DocumentContext';
import { usePropertiesQuery } from '@/components/Canvas/lib/hooks/query/usePropertiesQuery';
import { useUIStore } from '@/components/Canvas/lib/store/uiStore';
import { Column, Property, Requirement, RequirementCreateData } from '@/components/Canvas/types';
import { DragEndEvent } from '@dnd-kit/core';
import { useTableCollaboration } from '@/components/Canvas/components/TableBlock/TableBlock';
import { useCollaboration } from '@/components/Canvas/lib/hooks/canvas/useCollaboration';

// Hook for table block editing
// Now accepts an optional collaboration parameter to avoid using useTableCollaboration directly
export function useTableBlockEditor(
  blockId: string, 
  externalCollaboration?: ReturnType<typeof useCollaboration>
) {
  // Call all hooks at the top level in the same order every render
  
  // Get document context first
  const { editMode, updateBlock } = useDocument();
  
  // Get block data
  const { block, columns, requirements, isLoading, 
    createColumn, updateColumn, deleteColumn, reorderColumns,
    createRequirement, updateRequirement, deleteRequirement, reorderRequirements,
    bulkUpdateProperties, isEntityLocked } = useBlock();
  
  // Get table context
  const tableContext = useTable();
  
  // Get UI store
  const { activeOrgId } = useUIStore();
  
  // Use either provided collaboration or the default hook
  const collaboration = externalCollaboration || useTableCollaboration();
  
  // Destructure the collaboration for clarity
  const { acquireEntityLock, releaseEntityLock } = collaboration;
  
  // Get properties that can be used as columns
  const { allProperties } = usePropertiesQuery({
    orgId: activeOrgId || '',
    documentId: block?.document_id
  });
  
  // State for title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(block.content?.title || 'Table');
  
  // Available properties that aren't already columns
  const availableProperties = useMemo(() => {
    if (!allProperties) return [];
    const columnPropertyIds = columns.map(col => col.property_id);
    return allProperties.filter((prop) => !columnPropertyIds.includes(prop.id));
  }, [allProperties, columns]);
  
  // Start editing title
  const startTitleEdit = useCallback(() => {
    if (!editMode || isEntityLocked(blockId)) return;
    
    const acquired = acquireEntityLock(blockId, 'block');
    if (acquired) {
      setIsEditingTitle(true);
    }
  }, [editMode, isEntityLocked, blockId, acquireEntityLock, setIsEditingTitle]);
  
  // Stop editing title
  const stopTitleEdit = useCallback(async (save: boolean = true) => {
    if (!isEditingTitle) return;
    
    if (save && title !== block.content?.title) {
      try {
        await updateBlock({
          id: blockId,
          content: { ...block.content, title }
        });
      } catch (err) {
        console.error('Failed to save table title:', err);
        // Revert title
        setTitle(block.content?.title || 'Table');
      }
    } else if (!save) {
      // Revert title
      setTitle(block.content?.title || 'Table');
    }
    
    setIsEditingTitle(false);
    releaseEntityLock(blockId);
  }, [isEditingTitle, title, block, blockId, updateBlock, releaseEntityLock, setIsEditingTitle, setTitle]);
  
  // Add a new column
  const addColumn = useCallback(async (propertyId: string) => {
    if (!editMode) return null;
    
    try {
      // Create column at the end
      const newColumn = await createColumn({
        block_id: blockId,
        property_id: propertyId,
        position: columns.length,
        width: 150, // Default width
        is_hidden: false,
        is_pinned: false
      });
      
      return newColumn;
    } catch (err) {
      console.error('Failed to create column:', err);
      return null;
    }
  }, [editMode, blockId, columns.length, createColumn]);
  
  // Handle column reordering
  const handleColumnDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    // Get the source and destination columns
    const sourceId = String(active.id);
    const destinationId = String(over.id);
    
    // Find indices
    const sourceIndex = columns.findIndex(col => col.id === sourceId);
    const destinationIndex = columns.findIndex(col => col.id === destinationId);
    
    if (sourceIndex < 0 || destinationIndex < 0) {
      return;
    }
    
    // Create a new array with the new ordering
    const reordered = [...columns];
    const [movedColumn] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, movedColumn);
    
    // Update positions in the array
    const reorderData = reordered.map((col, index) => ({
      id: col.id,
      position: index
    }));
    
    try {
      // Execute the reorder operation
      await reorderColumns(reorderData);
    } catch (err) {
      console.error('Failed to reorder columns:', err);
    }
  }, [columns, reorderColumns]);
  
  // Add a new requirement (row)
  const addRequirement = useCallback(async (initialData: Partial<RequirementCreateData> = {}) => {
    if (!editMode) return null;
    
    try {
      // Create requirement at the end
      const newRequirement = await createRequirement({
        block_id: blockId,
        document_id: block.document_id,
        name: initialData.name || 'New Requirement',
        description: initialData.description || '',
        position: requirements.length,
        properties: initialData.properties || {},
        status: initialData.status || 'active',
        priority: initialData.priority || 'medium',
        level: initialData.level || 'component',
        format: initialData.format || 'ears'
      });
      
      return newRequirement;
    } catch (err) {
      console.error('Failed to create requirement:', err);
      return null;
    }
  }, [editMode, blockId, block.document_id, requirements.length, createRequirement]);
  
  // Handle row reordering
  const handleRowDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    // Get the source and destination requirements
    const sourceId = String(active.id);
    const destinationId = String(over.id);
    
    // Find indices
    const sourceIndex = requirements.findIndex(req => req.id === sourceId);
    const destinationIndex = requirements.findIndex(req => req.id === destinationId);
    
    if (sourceIndex < 0 || destinationIndex < 0) {
      return;
    }
    
    // Create a new array with the new ordering
    const reordered = [...requirements];
    const [movedRequirement] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, movedRequirement);
    
    // Update positions in the array
    const reorderData = reordered.map((req, index) => ({
      id: req.id,
      position: index
    }));
    
    try {
      // Execute the reorder operation
      await reorderRequirements(reorderData);
    } catch (err) {
      console.error('Failed to reorder requirements:', err);
    }
  }, [requirements, reorderRequirements]);
  
  // Update a cell value
  const updateCellValue = useCallback(async (requirementId: string, propertyId: string, value: any) => {
    if (!editMode) return;
    
    try {
      const requirement = requirements.find(req => req.id === requirementId);
      if (!requirement) return;
      
      // Update the property in the requirement
      const updatedProperties = {
        ...requirement.properties,
        [propertyId]: value
      };
      
      await updateRequirement({
        id: requirementId,
        properties: updatedProperties
      });
    } catch (err) {
      console.error('Failed to update cell:', err);
    }
  }, [editMode, requirements, updateRequirement]);
  
  // Bulk update cells
  const bulkUpdateCells = useCallback(async (updates: { requirementId: string, propertyId: string, value: any }[]) => {
    if (!editMode || updates.length === 0) return;
    
    try {
      // Group updates by requirement
      const updatesByRequirement = updates.reduce((acc, update) => {
        if (!acc[update.requirementId]) {
          acc[update.requirementId] = { id: update.requirementId, properties: {} };
        }
        acc[update.requirementId].properties[update.propertyId] = update.value;
        return acc;
      }, {} as Record<string, { id: string, properties: Record<string, any> }>);
      
      // Convert to array for bulk update
      const bulkUpdates = Object.values(updatesByRequirement);
      
      await bulkUpdateProperties(bulkUpdates);
    } catch (err) {
      console.error('Failed to bulk update cells:', err);
    }
  }, [editMode, bulkUpdateProperties]);
  
  return {
    // Block data
    block,
    isLoading,
    
    // Title editing
    title,
    isEditingTitle,
    setTitle,
    startTitleEdit,
    stopTitleEdit,
    
    // Column operations
    availableProperties,
    addColumn,
    updateColumn,
    deleteColumn,
    handleColumnDragEnd,
    
    // Row operations
    addRequirement,
    updateRequirement,
    deleteRequirement,
    handleRowDragEnd,
    
    // Cell operations
    updateCellValue,
    bulkUpdateCells,
    
    // Edit state
    canEdit: editMode && !isEntityLocked(blockId),
    
    // Table view state from context (includes columns and requirements)
    ...tableContext
  };
}