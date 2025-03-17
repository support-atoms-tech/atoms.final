// RefactoredCellEditor.tsx - Updated cell editor with shadcn UI
'use client';

import { forwardRef, useEffect, useRef, useCallback, memo } from 'react';
import { Property } from '@/components/Canvas/types';
import { useOnClickOutside } from '@/components/Canvas/lib/hooks/utils/useOnClickOutside';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useDebounce } from '@/components/Canvas/lib/hooks/utils/useDebounce';

interface RefactoredCellEditorProps {
  value: any;
  property: Property;
  onChange: (value: any) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onClickOutside: () => void;
}

/**
 * Modern cell editor component using shadcn UI components
 * Provides type-specific editing interfaces with a monospaced aesthetic
 */
export const RefactoredCellEditor = memo(forwardRef<HTMLInputElement | HTMLSelectElement, RefactoredCellEditorProps>(
  function RefactoredCellEditor({ value, property, onChange, onKeyDown, onClickOutside }, ref) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    
    // Handle click outside
    useOnClickOutside(wrapperRef as React.RefObject<HTMLElement>, onClickOutside);
    
    // Create a debounced onChange handler to reduce update frequency
    const debouncedOnChange = useDebounce((newValue: any) => {
      onChange(newValue);
    }, 100);
    
    // Cleanup debounce on unmount
    useEffect(() => {
      return () => {
        // The debounce function from our utils doesn't have a cancel method
        // so we don't need to call it
      };
    }, [debouncedOnChange]);
    
    // Render different editor based on property type
    const renderEditor = () => {
      switch (property.property_type) {
        case 'text':
          return (
            <Input
              ref={ref as React.RefObject<HTMLInputElement>}
              value={value || ''}
              onChange={(e) => debouncedOnChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="w-full font-mono text-sm"
              autoFocus
            />
          );
          
        case 'number':
          return (
            <Input
              ref={ref as React.RefObject<HTMLInputElement>}
              type="number"
              value={value ?? ''}
              onChange={(e) => debouncedOnChange(Number(e.target.value))}
              onKeyDown={onKeyDown}
              className="w-full font-mono text-sm"
              autoFocus
            />
          );
          
        case 'select':
          return (
            <Select
              value={value || ''}
              onValueChange={(val) => debouncedOnChange(val)}
            >
              <SelectTrigger className="w-full font-mono text-sm">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {property.options?.values?.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
          
        case 'multi_select':
          // Using a comma-separated input for multi-select
          return (
            <Input
              ref={ref as React.RefObject<HTMLInputElement>}
              value={Array.isArray(value) ? value.join(', ') : value || ''}
              onChange={(e) => {
                const values = e.target.value
                  .split(',')
                  .map(v => v.trim())
                  .filter(Boolean);
                debouncedOnChange(values);
              }}
              onKeyDown={onKeyDown}
              className="w-full font-mono text-sm"
              placeholder="Comma-separated values"
              autoFocus
            />
          );
          
        case 'date':
          return (
            <Input
              ref={ref as React.RefObject<HTMLInputElement>}
              type="date"
              value={value || ''}
              onChange={(e) => debouncedOnChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="w-full font-mono text-sm"
              autoFocus
            />
          );
          
        case 'checkbox':
          return (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={!!value}
                onChange={(e) => debouncedOnChange(e.target.checked)}
                className="h-4 w-4"
              />
            </div>
          );
          
        case 'url':
        case 'email':
          return (
            <Input
              ref={ref as React.RefObject<HTMLInputElement>}
              type={property.property_type}
              value={value || ''}
              onChange={(e) => debouncedOnChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="w-full font-mono text-sm"
              autoFocus
            />
          );
          
        default:
          return (
            <Input
              ref={ref as React.RefObject<HTMLInputElement>}
              value={value || ''}
              onChange={(e) => debouncedOnChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="w-full font-mono text-sm"
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

