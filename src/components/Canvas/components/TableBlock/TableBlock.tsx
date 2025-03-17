'use client';

import { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useTableBlockEditor } from '@/components/Canvas/lib/hooks/canvas/useTableBlockEditor';
import { Block } from '@/components/Canvas/types';
import { TableProvider } from '@/components/Canvas/lib/providers/TableContext';
import { TableView } from '@/components/Canvas/components/TableBlock/table/TableView';
import { KanbanView } from '@/components/Canvas/components/TableBlock/kanban/KanbanView';
import { TableToolbar } from '@/components/Canvas/components/TableBlock/table/TableToolbar';
import { PropertySelector } from '@/components/Canvas/components/TableBlock/menu/PropertySelector';
import { AddColumnButton } from '@/components/Canvas/components/TableBlock/menu/AddColumnButton';
import { useBlock } from '@/components/Canvas/lib/providers/BlockContext';
import { useDocument } from '@/components/Canvas/lib/providers/DocumentContext';
import { useCollaboration } from '@/components/Canvas/lib/hooks/canvas/useCollaboration';

// Create a context for sharing the collaboration instance
import { createContext, useContext } from 'react';

// Create a context to share the collaboration instance
const TableCollaborationContext = createContext<ReturnType<typeof useCollaboration> | null>(null);

// Hook to access the table collaboration context
export function useTableCollaboration() {
  const context = useContext(TableCollaborationContext);
  if (!context) {
    throw new Error('useTableCollaboration must be used within a TableCollaborationProvider');
  }
  return context;
}

interface TableBlockProps {
  block: Block;
}

export const TableBlock = memo(function TableBlock({ block }: TableBlockProps) {
  const { document } = useDocument();
  // Memoize documentId to prevent unnecessary re-renders
  const documentId = useMemo(() => document?.id || null, [document?.id]);
  
  // Create a single collaboration instance for the entire table
  const collaboration = useCollaboration(documentId);
  
  return (
    <TableCollaborationContext.Provider value={collaboration}>
      <TableProvider blockId={block.id}>
        <TableBlockContent block={block} />
      </TableProvider>
    </TableCollaborationContext.Provider>
  );
});

const TableBlockContent = memo(function TableBlockContent({ block }: TableBlockProps) {
  // Call all hooks at the top level in the same order every render
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const { editMode } = useDocument();
  
  // Use the shared collaboration instance from context
  const collaboration = useTableCollaboration();
  
  // Use table block editor hook
  const {
    title,
    isEditingTitle,
    setTitle,
    startTitleEdit,
    stopTitleEdit,
    availableProperties,
    addColumn,
    handleColumnDragEnd,
    handleRowDragEnd,
    canEdit,
    
    // From table context
    viewMode,
    setViewMode,
  } = useTableBlockEditor(block.id);
  
  // Memoize the drag end handler to prevent unnecessary re-renders
  const handleDragEnd = useMemo(() => (e: DragEndEvent) => {
    // Determine if this is a column or row drag based on the data
    const id = String(e.active.id);
    if (id.startsWith('col-')) {
      handleColumnDragEnd(e);
    } else {
      handleRowDragEnd(e);
    }
  }, [handleColumnDragEnd, handleRowDragEnd]);
  
  // Memoize the property selection handler
  const handlePropertySelect = useCallback((propertyId: string) => {
    addColumn(propertyId);
    setIsAddingColumn(false);
  }, [addColumn, setIsAddingColumn]);
  
  return (
    <div className="table-block border border-gray-200 rounded-lg overflow-hidden">
      <div className="table-header flex justify-between items-center p-3 bg-gray-50 border-b">
        {isEditingTitle ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => stopTitleEdit(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') stopTitleEdit(true);
              if (e.key === 'Escape') stopTitleEdit(false);
            }}
            className="font-medium text-lg px-2 py-1 border border-blue-500 rounded"
            autoFocus
          />
        ) : (
          <h3 
            className="font-medium text-lg cursor-text"
            onClick={() => canEdit && startTitleEdit()}
          >
            {title}
          </h3>
        )}
        
        <TableToolbar blockId={block.id} />
      </div>
      
      <DndContext onDragEnd={handleDragEnd}>
        {viewMode === 'table' ? (
          <TableView blockId={block.id} />
        ) : viewMode === 'kanban' ? (
          <KanbanView blockId={block.id} />
        ) : (
          <div className="p-3">
            {viewMode} view is not implemented yet
          </div>
        )}
      </DndContext>
      
      {canEdit && (
        <div className="table-footer p-3 border-t bg-gray-50">
          {isAddingColumn ? (
            <PropertySelector 
              blockId={block.id}
              onSelect={handlePropertySelect}
              onCancel={() => setIsAddingColumn(false)}
            />
          ) : (
            <AddColumnButton onClick={() => setIsAddingColumn(true)} />
          )}
        </div>
      )}
    </div>
  );
});