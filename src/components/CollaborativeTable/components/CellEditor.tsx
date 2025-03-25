// components/CollaborativeTable/CellEditor.tsx
import { forwardRef, useEffect, useRef, useCallback, memo, RefObject, useMemo } from 'react';
import { Property } from '@/components/CollaborativeTable/types';
import { useOnClickOutside } from '@/components/CollaborativeTable/hooks/useOnClickOutside';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useDebouncedCallback } from '@/components/CollaborativeTable/hooks/useDebouncedCallback';
import { useOptimisticStore } from '@/components/CollaborativeTable/store/optimisticStore';
import { Badge } from '@/components/ui/badge';

interface CellEditorProps {
  value: any;
  rowId: string;
  property: Property;
  onChange: (value: any) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onClickOutside: () => void;
}

/**
 * Enhanced cell editor component with optimistic UI updates
 * - Shows pending state indicator
 * - Handles different property types with appropriate inputs
 * - Implements accessibility features
 * - Reduces rerenders with memo
 */
export const CellEditor = memo(forwardRef<HTMLInputElement | HTMLSelectElement, CellEditorProps>(
  function CellEditor({ value, rowId, property, onChange, onKeyDown, onClickOutside }, ref) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const optimisticStore = useOptimisticStore();
    
    // Handle click outside to save/cancel edit
    useOnClickOutside(wrapperRef as RefObject<HTMLElement>, onClickOutside);
    
    // Create a debounced onChange handler to reduce update frequency
    const debouncedOnChange = useDebouncedCallback((newValue: any) => {
      // Process value based on property type before sending to parent
      switch (property.property_type) {
        case 'number':
          // Convert to number or null
          if (newValue === '' || newValue === null || newValue === undefined) {
            onChange(null);
          } else {
            const num = Number(newValue);
            onChange(isNaN(num) ? null : num);
          }
          break;
          
        case 'checkbox':
          // Ensure boolean value
          onChange(Boolean(newValue));
          break;
          
        case 'multi_select':
          // Ensure array value
          if (Array.isArray(newValue)) {
            onChange(newValue);
          } else if (typeof newValue === 'string') {
            // Split string by commas
            const values = newValue
              .split(',')
              .map(v => v.trim())
              .filter(Boolean);
            onChange(values);
          } else {
            onChange([]);
          }
          break;
          
        default:
          // Pass value as is for other types
          onChange(newValue);
      }
    }, 100);
    
    // Check if this cell has pending changes
    const hasPendingChanges = optimisticStore.pendingChanges.some(
      change => change.rowId === rowId && 
                change.propertyId === property.id && 
                change.status === 'pending'
    );
    
    // Find any error for this cell
    const error = optimisticStore.pendingChanges.find(
      change => change.rowId === rowId && 
                change.propertyId === property.id && 
                change.status === 'error'
    );
    
    // Normalize the displayed value based on property type
    const displayValue = useMemo(() => {
      if (value === null || value === undefined) {
        switch (property.property_type) {
          case 'number': return '';
          case 'checkbox': return false;
          case 'multi_select': return [];
          default: return '';
        }
      }
      
      // Return the value based on property type
      switch (property.property_type) {
        case 'multi_select':
          return Array.isArray(value) ? value : [];
          
        case 'checkbox':
          return Boolean(value);
          
        case 'number':
          return typeof value === 'number' ? value : '';
          
        default:
          return value;
      }
    }, [value, property.property_type]);
    
    // Auto focus when editor opens
    useEffect(() => {
      // We need to handle both input and select types
      if (ref && typeof ref === 'object' && ref.current) {
        ref.current.focus();
      }
    }, [ref]);
    
    // Render different editor based on property type
    const renderEditor = () => {
      switch (property.property_type) {
        case 'text':
          return (
            <Input
              ref={ref as React.RefObject<HTMLInputElement>}
              value={displayValue || ''}
              onChange={(e) => debouncedOnChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="w-full font-mono text-sm"
              aria-label={`Edit ${property.name}`}
              aria-invalid={!!error}
              autoFocus
            />
          );
          
        case 'number':
          return (
            <Input
              ref={ref as React.RefObject<HTMLInputElement>}
              type="number"
              value={displayValue}
              onChange={(e) => debouncedOnChange(e.target.value === '' ? null : Number(e.target.value))}
              onKeyDown={onKeyDown}
              className="w-full font-mono text-sm"
              aria-label={`Edit ${property.name}`}
              aria-invalid={!!error}
              autoFocus
            />
          );
          
        case 'select':
          return (
            <Select
              value={String(displayValue || '')}
              onValueChange={(val) => debouncedOnChange(val)}
            >
              <SelectTrigger 
                className="w-full font-mono text-sm"
                aria-label={`Edit ${property.name}`}
                aria-invalid={!!error}
              >
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {/* Add an empty option */}
                <SelectItem value="">
                  <span className="text-gray-400">-</span>
                </SelectItem>
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
              value={Array.isArray(displayValue) ? displayValue.join(', ') : ''}
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
              aria-label={`Edit ${property.name}`}
              aria-invalid={!!error}
              autoFocus
            />
          );
          
        case 'date':
          return (
            <Input
              ref={ref as React.RefObject<HTMLInputElement>}
              type="date"
              value={displayValue || ''}
              onChange={(e) => debouncedOnChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="w-full font-mono text-sm"
              aria-label={`Edit ${property.name}`}
              aria-invalid={!!error}
              autoFocus
            />
          );
          
        case 'checkbox':
          return (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={!!displayValue}
                onChange={(e) => debouncedOnChange(e.target.checked)}
                className="h-4 w-4"
                aria-label={`Toggle ${property.name}`}
              />
            </div>
          );
          
        case 'url':
        case 'email':
          return (
            <Input
              ref={ref as React.RefObject<HTMLInputElement>}
              type={property.property_type}
              value={displayValue || ''}
              onChange={(e) => debouncedOnChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="w-full font-mono text-sm"
              aria-label={`Edit ${property.name}`}
              aria-invalid={!!error}
              autoFocus
            />
          );
          
        default:
          return (
            <Input
              ref={ref as React.RefObject<HTMLInputElement>}
              value={displayValue || ''}
              onChange={(e) => debouncedOnChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="w-full font-mono text-sm"
              aria-label={`Edit ${property.name}`}
              aria-invalid={!!error}
              autoFocus
            />
          );
      }
    };
    
    return (
      <div 
        ref={wrapperRef} 
        className="cell-editor w-full relative" 
        data-pending={hasPendingChanges}
        data-error={!!error}
      >
        {renderEditor()}
        
        {/* Pending changes indicator */}
        {hasPendingChanges && (
          <Badge 
            variant="outline" 
            className="absolute top-0 right-0 -mt-2 -mr-2 text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Saving...
          </Badge>
        )}
        
        {/* Error indicator */}
        {error && (
          <div className="absolute bottom-0 left-0 right-0 -mb-6 text-xs text-red-600 bg-white p-1 border border-red-200 rounded z-10">
            {error.errorMessage}
          </div>
        )}
      </div>
    );
  }
), (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.value === nextProps.value &&
    prevProps.rowId === nextProps.rowId &&
    prevProps.property.id === nextProps.property.id
  );
});
