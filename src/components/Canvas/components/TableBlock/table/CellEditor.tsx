// components/canvas/table/CellEditor.tsx
'use client';

import { forwardRef, useEffect, useRef, useCallback, memo } from 'react';
import { Property } from '@/components/Canvas/types';
import { useOnClickOutside } from '@/components/Canvas/lib/hooks/utils/useOnClickOutside';
import debounce from 'lodash/debounce';

interface CellEditorProps {
  value: any;
  property: Property;
  onChange: (value: any) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onClickOutside: () => void;
}

export const CellEditor = memo(forwardRef<HTMLInputElement | HTMLSelectElement, CellEditorProps>(
  function CellEditor({ value, property, onChange, onKeyDown, onClickOutside }, ref) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    
    // Handle click outside
    useOnClickOutside(wrapperRef as React.RefObject<HTMLElement>, onClickOutside);
    
    // Create a debounced onChange handler to reduce update frequency
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedOnChange = useCallback(
      debounce((newValue: any) => {
        onChange(newValue);
      }, 100), // 100ms debounce
      [onChange]
    );
    
    // Cleanup debounce on unmount
    useEffect(() => {
      return () => {
        debouncedOnChange.cancel();
      };
    }, [debouncedOnChange]);
    
    // Render different editor based on property type
    const renderEditor = () => {
      switch (property.property_type) {
        case 'text':
          return (
            <input
              ref={ref as React.RefObject<HTMLInputElement>}
              type="text"
              value={value || ''}
              onChange={(e) => debouncedOnChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="w-full p-1 rounded border focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              autoFocus
            />
          );
          
        case 'number':
          return (
            <input
              ref={ref as React.RefObject<HTMLInputElement>}
              type="number"
              value={value ?? ''}
              onChange={(e) => debouncedOnChange(Number(e.target.value))}
              onKeyDown={onKeyDown}
              className="w-full p-1 rounded border focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              autoFocus
            />
          );
          
        case 'select':
          return (
            <select
              ref={ref as React.RefObject<HTMLSelectElement>}
              value={value || ''}
              onChange={(e) => debouncedOnChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="w-full p-1 rounded border focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              autoFocus
            >
              <option value="">-- Select --</option>
              {property.options?.values?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );
          
        case 'multi_select':
          // For simplicity, we're using a comma-separated input
          return (
            <input
              ref={ref as React.RefObject<HTMLInputElement>}
              type="text"
              value={Array.isArray(value) ? value.join(', ') : value || ''}
              onChange={(e) => {
                const values = e.target.value
                  .split(',')
                  .map(v => v.trim())
                  .filter(Boolean);
                debouncedOnChange(values);
              }}
              onKeyDown={onKeyDown}
              className="w-full p-1 rounded border focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Comma-separated values"
              autoFocus
            />
          );
          
        case 'date':
          return (
            <input
              ref={ref as React.RefObject<HTMLInputElement>}
              type="date"
              value={value || ''}
              onChange={(e) => debouncedOnChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="w-full p-1 rounded border focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              autoFocus
            />
          );
          
        case 'checkbox':
          return (
            <input
              ref={ref as React.RefObject<HTMLInputElement>}
              type="checkbox"
              checked={!!value}
              onChange={(e) => debouncedOnChange(e.target.checked)}
              className="h-4 w-4"
              autoFocus
            />
          );
          
        case 'url':
        case 'email':
          return (
            <input
              ref={ref as React.RefObject<HTMLInputElement>}
              type={property.property_type}
              value={value || ''}
              onChange={(e) => debouncedOnChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="w-full p-1 rounded border focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              autoFocus
            />
          );
          
        default:
          return (
            <input
              ref={ref as React.RefObject<HTMLInputElement>}
              type="text"
              value={value || ''}
              onChange={(e) => debouncedOnChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="w-full p-1 rounded border focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              autoFocus
            />
          );
      }
    };
    
    return (
      <div ref={wrapperRef} className="cell-editor w-full">
        {renderEditor()}
      </div>
    );
  }
), (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.value === nextProps.value &&
    prevProps.property.id === nextProps.property.id &&
    prevProps.property.property_type === nextProps.property.property_type
  );
});