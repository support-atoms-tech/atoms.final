// components/canvas/table/CellRenderer.tsx
'use client';

import React, { useMemo, memo } from 'react';
import { Property } from '@/components/Canvas/types';

interface CellRendererProps {
  value: any;
  property: Property;
}

export const CellRenderer = memo(function CellRenderer({ value, property }: CellRendererProps) {
  // Format the value based on property type
  const formattedValue = useMemo(() => {
    if (value === undefined || value === null) {
      return '';
    }
    
    switch (property.property_type) {
      case 'text':
        return <span>{value}</span>;
        
      case 'number':
        return <span>{value}</span>;
        
      case 'select':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {value}
          </span>
        );
        
      case 'multi_select':
        if (Array.isArray(value)) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {item}
                </span>
              ))}
            </div>
          );
        }
        return '';
        
      case 'date':
        try {
          const date = new Date(value);
          return <span>{date.toLocaleDateString()}</span>;
        } catch (e) {
          return <span>{value}</span>;
        }
        
      case 'checkbox':
        return (
          <input 
            type="checkbox" 
            checked={!!value} 
            readOnly 
            className="h-4 w-4"
          />
        );
        
      case 'url':
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {value}
          </a>
        );
        
      case 'email':
        return (
          <a
            href={`mailto:${value}`}
            className="text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {value}
          </a>
        );
        
      case 'user':
        return (
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs mr-1">
              {value?.name?.charAt(0) || '?'}
            </div>
            <span>{value?.name || value || ''}</span>
          </div>
        );
        
      default:
        return <span>{String(value)}</span>;
    }
  }, [value, property.property_type]);
  
  return (
    <div className="cell-value overflow-hidden">
      {formattedValue}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  // Only re-render if value or property type changes
  return (
    prevProps.value === nextProps.value &&
    prevProps.property.property_type === nextProps.property.property_type
  );
});