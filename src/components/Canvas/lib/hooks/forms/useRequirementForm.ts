// hooks/forms/useRequirementForm.ts
import { useState, useCallback } from 'react';
import { useBlock } from '@/components/Canvas/lib/providers/BlockContext';
import { Requirement, RequirementStatus, RequirementPriority, RequirementLevel, RequirementFormat } from '@/components/Canvas/types';

interface RequirementFormState {
  name: string;
  description: string;
  external_id: string;
  status: RequirementStatus;
  priority: RequirementPriority;
  level: RequirementLevel;
  format: RequirementFormat;
  properties: Record<string, any>;
  tags: string[];
}

interface UseRequirementFormProps {
  blockId: string;
  documentId: string;
  initialData?: Partial<Requirement>;
  onSubmitSuccess?: (requirement: Requirement) => void;
}

export function useRequirementForm({ blockId, documentId, initialData = {}, onSubmitSuccess }: UseRequirementFormProps) {
  // Get block context
  const { requirements, createRequirement, updateRequirement } = useBlock();
  
  // Form state
  const [formState, setFormState] = useState<RequirementFormState>({
    name: initialData.name || '',
    description: initialData.description || '',
    external_id: initialData.external_id || '',
    status: initialData.status || 'todo',
    priority: initialData.priority || 'medium',
    level: initialData.level || 'normal',
    format: initialData.format || 'technical',
    properties: initialData.properties || {},
    tags: initialData.tags || []
  });
  
  // Loading and error state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Handle field changes
  const handleChange = useCallback((field: keyof RequirementFormState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);
  
  // Handle property changes
  const handlePropertyChange = useCallback((propertyId: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      properties: {
        ...prev.properties,
        [propertyId]: value
      }
    }));
  }, []);
  
  // Handle form submission
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formState.name.trim()) {
        throw new Error('Requirement name is required');
      }
      
      // Create or update requirement
      let requirement: Requirement;
      
      if (initialData.id) {
        // Update existing requirement
        requirement = await updateRequirement({
          id: initialData.id,
          name: formState.name,
          description: formState.description,
          external_id: formState.external_id,
          status: formState.status,
          priority: formState.priority,
          level: formState.level,
          format: formState.format,
          properties: formState.properties,
          tags: formState.tags
        });
      } else {
        // Create new requirement at the end of the list
        const position = requirements.length;
        
        requirement = await createRequirement({
          block_id: blockId,
          document_id: documentId,
          name: formState.name,
          description: formState.description,
          external_id: formState.external_id,
          position,
          status: formState.status,
          priority: formState.priority,
          level: formState.level,
          format: formState.format,
          properties: formState.properties,
          tags: formState.tags
        });
      }
      
      // Call success callback
      if (onSubmitSuccess) {
        onSubmitSuccess(requirement);
      }
      
      return requirement;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save requirement'));
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, initialData.id, blockId, documentId, requirements.length, createRequirement, updateRequirement, onSubmitSuccess]);
  
  return {
    formState,
    handleChange,
    handlePropertyChange,
    handleSubmit,
    isSubmitting,
    error,
    isEditMode: !!initialData.id
  };
}