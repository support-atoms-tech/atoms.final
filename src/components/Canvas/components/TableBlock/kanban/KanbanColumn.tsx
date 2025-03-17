// components/canvas/table/KanbanColumn.tsx
'use client';

import { useDroppable } from '@dnd-kit/core';
import { Requirement } from '@/components/Canvas/types';
import { KanbanCard } from '@/components/Canvas/components/TableBlock/kanban/KanbanCard';
import { useTableBlockEditor } from '@/components/Canvas/lib/hooks/canvas/useTableBlockEditor';

interface KanbanColumnProps {
  id: string;
  title: string;
  requirements: Requirement[];
  canEdit: boolean;
}

export function KanbanColumn({ id, title, requirements, canEdit }: KanbanColumnProps) {
  const { addRequirement } = useTableBlockEditor(requirements[0]?.block_id || '');
  
  // Droppable setup
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: !canEdit
  });
  
  return (
    <div
      ref={setNodeRef}
      className={`kanban-column flex-shrink-0 w-64 bg-gray-50 rounded-md flex flex-col ${
        isOver ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
      }`}
    >
      <div className="column-header p-2 border-b bg-gray-100 rounded-t-md">
        <h3 className="font-medium text-sm capitalize">
          {title} ({requirements.length})
        </h3>
      </div>
      
      <div className="column-body flex-1 p-2 overflow-y-auto">
        {requirements.map(requirement => (
          <KanbanCard
            key={requirement.id}
            requirement={requirement}
            canDrag={canEdit}
          />
        ))}
        
        {requirements.length === 0 && (
          <div className="empty-state p-2 text-center text-gray-500 text-sm">
            No items
          </div>
        )}
      </div>
      
      {canEdit && (
        <div className="column-footer p-2 border-t">
          <button
            className="w-full py-1 px-2 text-sm text-gray-600 hover:bg-gray-200 rounded"
            onClick={() => {
              // Extract the group value from the column id
              const groupValue = id.replace('group-', '');
              
              // Create a new requirement with the group value
              addRequirement({
                status: groupValue as any,
                priority: groupValue as any,
                properties: {
                  [id.includes('status') ? 'status' : 'priority']: groupValue
                }
              });
            }}
          >
            + Add Card
          </button>
        </div>
      )}
    </div>
  );
}