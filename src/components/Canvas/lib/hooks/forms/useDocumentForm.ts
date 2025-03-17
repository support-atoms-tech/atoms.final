// hooks/forms/useDocumentForm.ts
import { useState, useCallback } from 'react';
import { useDocumentsQuery } from '@/components/Canvas/lib/hooks/query/useDocumentsQuery';
import { Document } from '@/components/Canvas/types';
import { createDocumentWithBlocks } from '@/components/Canvas/lib/supabase/server-actions';

interface DocumentFormState {
  name: string;
  description: string;
  tags: string[];
  createDefaultBlocks: boolean;
}

interface UseDocumentFormProps {
  projectId: string;
  initialData?: Partial<Document>;
  onSubmitSuccess?: (document: Document) => void;
}

export function useDocumentForm({ projectId, initialData = {}, onSubmitSuccess }: UseDocumentFormProps) {
  // Get mutation functions
  const { updateDocument } = useDocumentsQuery(projectId);
  
  // Form state
  const [formState, setFormState] = useState<DocumentFormState>({
    name: initialData.name || '',
    description: initialData.description || '',
    tags: initialData.tags || [],
    createDefaultBlocks: !initialData.id // Only for new documents
  });
  
  // Loading and error state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Handle field changes
  const handleChange = useCallback((field: keyof DocumentFormState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);
  
  // Handle form submission
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formState.name.trim()) {
        throw new Error('Document name is required');
      }
      
      // Create or update document
      let document: Document;
      
      if (initialData.id) {
        // Update existing document
        document = await updateDocument({
          id: initialData.id,
          name: formState.name,
          description: formState.description,
          tags: formState.tags
        });
      } else {
        // Create new document with default blocks
        const defaultBlocks = formState.createDefaultBlocks
          ? [
              { type: 'text', content: { text: '# ' + formState.name + '\n\n' + (formState.description || '') } },
              { type: 'table', content: { title: 'Requirements' } }
            ]
          : [];
        
        // Use server action to create document with blocks
        document = await createDocumentWithBlocks({
          name: formState.name,
          description: formState.description,
          project_id: projectId,
          blocks: defaultBlocks
        });
      }
      
      // Call success callback
      if (onSubmitSuccess) {
        onSubmitSuccess(document);
      }
      
      return document;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save document'));
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, initialData.id, projectId, updateDocument, onSubmitSuccess]);
  
  return {
    formState,
    handleChange,
    handleSubmit,
    isSubmitting,
    error,
    isEditMode: !!initialData.id
  };
}

