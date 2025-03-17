// hooks/forms/usePropertyForm.ts
import { useState, useCallback } from 'react';
import { usePropertiesQuery } from '@/components/Canvas/lib/hooks/query/usePropertiesQuery';
import { Property, PropertyOptions } from '@/components/Canvas/types';

interface PropertyFormState {
  name: string;
  property_type: string;
  is_base: boolean;
  options: PropertyOptions;
}

interface UsePropertyFormProps {
  orgId: string;
  documentId?: string;
  initialData?: Partial<Property>;
  onSubmitSuccess?: (property: Property) => void;
}

export function usePropertyForm({ orgId, documentId, initialData = {}, onSubmitSuccess }: UsePropertyFormProps) {
  // Get mutation functions
  const { createProperty, updateProperty } = usePropertiesQuery({ orgId: orgId, documentId: documentId });
  
  // Default options based on property type
  const getDefaultOptions = (type: string): PropertyOptions => {
    switch (type) {
      case 'select':
        return { values: [] };
      case 'number':
        return { 
          validation: { 
            min: undefined,
            max: undefined
          } 
        };
      case 'date':
        return { format: 'YYYY-MM-DD' };
      default:
        return {};
    }
  };
  
  // Form state
  const [formState, setFormState] = useState<PropertyFormState>({
    name: initialData.name || '',
    property_type: initialData.property_type || 'text',
    is_base: initialData.is_base || false,
    options: initialData.options || getDefaultOptions(initialData.property_type || 'text')
  });
  
  // Loading and error state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Handle field changes
  const handleChange = useCallback((field: keyof PropertyFormState, value: any) => {
    setFormState(prev => {
      // If property_type changes, update options
      if (field === 'property_type') {
        return {
          ...prev,
          [field]: value,
          options: getDefaultOptions(value)
        };
      }
      
      return { ...prev, [field]: value };
    });
  }, []);
  
  // Handle options change
  const handleOptionsChange = useCallback((path: string, value: any) => {
    setFormState(prev => {
      const newOptions = { ...prev.options };
      
      // Handle nested paths like "validation.min"
      const parts = path.split('.');
      if (parts.length === 1) {
        newOptions[path] = value;
      } else {
        let current: any = newOptions;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
      }
      
      return { ...prev, options: newOptions };
    });
  }, []);
  
  // Handle form submission
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formState.name.trim()) {
        throw new Error('Property name is required');
      }
      
      // Create or update property
      let property: Property;
      
      if (initialData.id) {
        // Update existing property
        property = await updateProperty({
          id: initialData.id,
          name: formState.name,
          property_type: formState.property_type,
          is_base: formState.is_base,
          options: formState.options
        });
      } else {
        // Create new property
        property = await createProperty({
          name: formState.name,
          property_type: formState.property_type,
          org_id: orgId,
          document_id: documentId,
          is_base: formState.is_base,
          options: formState.options
        });
      }
      
      // Call success callback
      if (onSubmitSuccess) {
        onSubmitSuccess(property);
      }
      
      return property;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save property'));
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, initialData.id, orgId, documentId, createProperty, updateProperty, onSubmitSuccess]);
  
  return {
    formState,
    handleChange,
    handleOptionsChange,
    handleSubmit,
    isSubmitting,
    error,
    isEditMode: !!initialData.id
  };
}

