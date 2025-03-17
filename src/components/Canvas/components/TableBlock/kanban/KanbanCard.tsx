// components/canvas/table/KanbanCard.tsx
'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Requirement } from '@/components/Canvas/types';

interface KanbanCardProps {
  requirement: Requirement;
  canDrag: boolean;
}

export function KanbanCard({ requirement, canDrag }: KanbanCardProps) {
  // Draggable setup
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: requirement.id,
    disabled: !canDrag
  });
  
  return (
    <div
      ref={setNodeRef}
      className={`kanban-card bg-white p-2 mb-2 rounded shadow-sm border-l-4 ${
        requirement.priority === 'high' || requirement.priority === 'critical'
          ? 'border-red-400'
          : requirement.priority === 'medium'
          ? 'border-yellow-400'
          : 'border-blue-400'
      } ${isDragging ? 'opacity-50' : ''}`}
      style={{
        transform: transform ? CSS.Transform.toString(transform) : undefined
      }}
      {...(canDrag ? attributes : {})}
      {...(canDrag ? listeners : {})}
    >
      <div className="card-title text-sm font-medium mb-1 truncate">
        {requirement.name}
      </div>
      
      {requirement.description && (
        <div className="card-description text-xs text-gray-600 mb-2 line-clamp-2">
          {requirement.description}
        </div>
      )}
      
      <div className="card-meta flex justify-between text-xs">
        <span className={`status px-1 rounded ${
          requirement.status === 'done'
            ? 'bg-green-100 text-green-800'
            : requirement.status === 'review'
            ? 'bg-purple-100 text-purple-800'
            : requirement.status === 'in_progress'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {requirement.status}
        </span>
        
        <span className="priority">
          {requirement.priority}
        </span>
      </div>
    </div>
  );
}
