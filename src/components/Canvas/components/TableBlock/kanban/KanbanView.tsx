// components/canvas/table/KanbanView.tsx
'use client';

import { useMemo } from 'react';
import { DndContext } from '@dnd-kit/core';
import { useTable } from '@/components/Canvas/lib/providers/TableContext';
import { useBlock } from '@/components/Canvas/lib/providers/BlockContext';
import { KanbanColumn } from '@/components/Canvas/components/TableBlock/kanban/KanbanColumn';
import { useTableBlockEditor } from '@/components/Canvas/lib/hooks/canvas/useTableBlockEditor';

interface KanbanViewProps {
  blockId: string;
}

export function KanbanView({ blockId }: KanbanViewProps) {
  const { filteredRequirements, groupByProperty } = useTable();
  const { updateRequirement } = useBlock();
  const { canEdit } = useTableBlockEditor(blockId);
  
  // Find the property to group by (default to status)
  const groupProperty = useMemo(() => {
    if (groupByProperty === 'status' || !groupByProperty) {
      return {
        id: 'status',
        name: 'Status',
        values: ['todo', 'in_progress', 'review', 'done']
      };
    }
    
    if (groupByProperty === 'priority') {
      return {
        id: 'priority',
        name: 'Priority',
        values: ['low', 'medium', 'high', 'critical']
      };
    }
    
    return {
      id: groupByProperty,
      name: 'Custom',
      values: []
    };
  }, [groupByProperty]);
  
  // Group requirements by the selected property
  const groupedRequirements = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    // Create initial groups for all values
    if (groupProperty.values && groupProperty.values.length > 0) {
      groupProperty.values.forEach(value => {
        groups[value] = [];
      });
    }
    
    // Group requirements
    filteredRequirements.forEach(req => {
      let value: string;
      
      if (groupProperty.id === 'status') {
        value = req.status;
      } else if (groupProperty.id === 'priority') {
        value = req.priority;
      } else {
        value = req.properties?.[groupProperty.id] || 'None';
      }
      
      // Create group if it doesn't exist
      if (!groups[value]) {
        groups[value] = [];
      }
      
      groups[value].push(req);
    });
    
    return groups;
  }, [filteredRequirements, groupProperty]);
  
  // Handle drag end to move item between columns
  const handleDragEnd = async (result: any) => {
    const { active, over } = result;
    
    if (!active || !over || active.id === over.id) {
      return;
    }
    
    const requirementId = String(active.id);
    const targetGroup = String(over.id).replace('group-', '');
    
    // Find the requirement
    const requirement = filteredRequirements.find(req => req.id === requirementId);
    if (!requirement) return;
    
    try {
      if (groupProperty.id === 'status') {
        await updateRequirement({
          id: requirementId,
          status: targetGroup as any
        });
      } else if (groupProperty.id === 'priority') {
        await updateRequirement({
          id: requirementId,
          priority: targetGroup as any
        });
      } else {
        // Update custom property
        await updateRequirement({
          id: requirementId,
          properties: {
            ...requirement.properties,
            [groupProperty.id]: targetGroup
          }
        });
      }
    } catch (err) {
      console.error('Failed to update requirement:', err);
    }
  };
  
  return (
    <div className="kanban-view p-4 overflow-x-auto">
      <DndContext onDragEnd={handleDragEnd}>
        <div className="kanban-columns flex space-x-4 min-h-[300px]">
          {Object.entries(groupedRequirements).map(([group, requirements]) => (
            <KanbanColumn
              key={group}
              id={`group-${group}`}
              title={group}
              requirements={requirements}
              canEdit={canEdit}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}



