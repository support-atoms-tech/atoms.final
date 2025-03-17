// RefactoredTableBlock.tsx - Main table block component
'use client';

import { useState, useMemo, createContext, useContext } from 'react';
import { TableProvider } from '@/components/Canvas/lib/providers/TableContext';
import { useBlock } from '@/components/Canvas/lib/providers/BlockContext';
import { useDocument } from '@/components/Canvas/lib/providers/DocumentContext';
import { useCollaboration } from '@/components/Canvas/lib/hooks/canvas/useCollaboration';
import { RefactoredTableView } from './RfTableView';
import { RefactoredTableToolbar } from './RfTableToolbar';
import { Block } from '@/components/Canvas/types';
import { useTableBridge } from './useRfTableBridge';
import { Input } from '@/components/ui/input';
import { PropertySelector } from '@/components/Canvas/components/TableBlock/menu/PropertySelector';
import { Button } from '@/components/ui/button';

// Create a context to share the collaboration instance
export const TableCollaborationContext = createContext<ReturnType<typeof useCollaboration> | null>(null);

/**
 * Hook to access the table collaboration context
 */
export function useTableCollaboration() {
  const context = useContext(TableCollaborationContext);
  if (!context) {
    throw new Error('useTableCollaboration must be used within a TableCollaborationProvider');
  }
  return context;
}

interface RefactoredTableBlockProps {
  block: Block;
}

/**
 * Main table block component that ties everything together
 * Uses the new architecture while maintaining compatibility with existing code
 */
export function RefactoredTableBlock({ block }: RefactoredTableBlockProps) {
  const { document } = useDocument();
  // Memoize documentId to prevent unnecessary re-renders
  const documentId = useMemo(() => document?.id || null, [document?.id]);
  
  // Create a single collaboration instance for the entire table
  const collaboration = useCollaboration(documentId);
  
  return (
    <TableCollaborationContext.Provider value={collaboration}>
      <TableProvider blockId={block.id}>
        <RefactoredTableBlockContent block={block} />
      </TableProvider>
    </TableCollaborationContext.Provider>
  );
}

/**
 * Internal content component for the table block
 * Handles title editing, view switching, and column management
 */
function RefactoredTableBlockContent({ block }: RefactoredTableBlockProps) {
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  
  // Use the bridge to connect with existing functionality
  const {
    title,
    isEditingTitle,
    setTitle,
    startTitleEdit,
    stopTitleEdit,
    addColumn,
    viewMode,
    canEdit,
  } = useTableBridge(block.id);
  
  const handlePropertySelect = (propertyId: string) => {
    addColumn(propertyId);
    setIsAddingColumn(false);
  };
  
  return (
    <div className="table-block border border-gray-200 rounded-lg overflow-hidden font-mono bg-white shadow-sm">
      <div className="table-header flex justify-between items-center p-3 bg-gray-50 border-b">
        {isEditingTitle ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => stopTitleEdit(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') stopTitleEdit(true);
              if (e.key === 'Escape') stopTitleEdit(false);
            }}
            className="font-mono text-lg px-2 py-1 w-64"
            autoFocus
          />
        ) : (
          <h3 
            className="font-mono text-lg cursor-text px-1"
            onClick={() => canEdit && startTitleEdit()}
          >
            {title}
          </h3>
        )}
        
        <RefactoredTableToolbar blockId={block.id} />
      </div>
      
      {/* Main view section */}
      {viewMode === 'table' ? (
        <RefactoredTableView blockId={block.id} />
      ) : viewMode === 'kanban' ? (
        <div className="p-4 text-center text-gray-500 font-mono">
          Kanban view is not implemented in the refactored version
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500 font-mono">
          {viewMode} view is not implemented
        </div>
      )}
      
      {/* Footer with column management */}
      {canEdit && (
        <div className="table-footer p-3 border-t bg-gray-50">
          {isAddingColumn ? (
            <PropertySelector 
              blockId={block.id}
              onSelect={handlePropertySelect}
              onCancel={() => setIsAddingColumn(false)}
            />
          ) : (
            <Button 
              variant="outline"
              onClick={() => setIsAddingColumn(true)}
              className="text-sm font-mono"
            >
              + Add column
            </Button>
          )}
        </div>
      )}
    </div>
  );
}