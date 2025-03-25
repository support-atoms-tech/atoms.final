// components/CollaborativeTable/CellRenderer.tsx
import { memo } from 'react';
import { Property } from '@/components/CollaborativeTable/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface CellRendererProps {
  value: any;
  property: Property;
}

/**
 * Component to render cell content based on property type
 * - Optimized with memo to reduce re-renders
 * - Handles different data types appropriately
 * - Includes accessibility attributes
 */
export const CellRenderer = memo(function CellRenderer({ value, property }: CellRendererProps) {
  // Handle case where property might be undefined (should not happen in practice)
  if (!property) {
    return <span className="text-gray-400 italic">Invalid property</span>;
  }
  
  // Render empty state
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-400 italic">-</span>;
  }
  
  // Render content based on property type
  switch (property.property_type) {
    case 'text':
      return <span className="truncate">{String(value)}</span>;
      
    case 'number':
      try {
        const num = typeof value === 'number' ? value : Number(value);
        return <span className="font-mono">{isNaN(num) ? value : num.toLocaleString()}</span>;
      } catch (e) {
        return <span className="font-mono">{value}</span>;
      }
      
    case 'select':
      return <span className="truncate">{String(value)}</span>;
      
    case 'multi_select':
      return (
        <div className="flex flex-wrap gap-1">
          {Array.isArray(value) ? (
            value.length > 0 ? (
              value.map((item, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {String(item)}
                </Badge>
              ))
            ) : (
              <span className="text-gray-400 italic">-</span>
            )
          ) : (
            // If for some reason it's not an array but has a value, display it
            <span className="truncate">{String(value)}</span>
          )}
        </div>
      );
      
    case 'date':
      try {
        const date = new Date(value);
        // Check if date is valid before formatting
        if (!isNaN(date.getTime())) {
          return <span>{format(date, 'MMM d, yyyy')}</span>;
        } else {
          return <span>{String(value)}</span>;
        }
      } catch (e) {
        return <span>{String(value)}</span>;
      }
      
    case 'checkbox':
      return (
        <div className="flex justify-center">
          {value === true || value === 'true' || value === 1 ? '✓' : ''}
        </div>
      );
      
    case 'url':
      try {
        // Basic URL validation
        new URL(value);
        return (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:underline truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {String(value)}
          </a>
        );
      } catch (e) {
        // If it's not a valid URL, just display as text
        return <span className="truncate">{String(value)}</span>;
      }
      
    case 'email':
      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(String(value))) {
        return (
          <a 
            href={`mailto:${value}`} 
            className="text-blue-600 hover:underline truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {String(value)}
          </a>
        );
      } else {
        return <span className="truncate">{String(value)}</span>;
      }
      
    default:
      return <span className="truncate">{String(value)}</span>;
  }
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  // Only re-render if value or property type changes
  return (
    prevProps.value === nextProps.value &&
    prevProps.property?.property_type === nextProps.property?.property_type
  );
});
