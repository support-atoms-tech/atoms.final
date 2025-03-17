// hooks/forms/useProjectForm.ts
import { useState, useCallback } from 'react';
import { useProjectsQuery } from '@/components/Canvas/lib/hooks/query/useProjectsQuery';
import { Project, Visibility, ProjectStatus } from '@/components/Canvas/types';

interface ProjectFormState {
  name: string;
  description: string;
  visibility: Visibility;
  status: ProjectStatus;
  tags: string[];
}

interface UseProjectFormProps {
  orgId: string;
  initialData?: Partial<Project>;
  onSubmitSuccess?: (project: Project) => void;
}

export function useProjectForm({ orgId, initialData = {}, onSubmitSuccess }: UseProjectFormProps) {
  // Get mutation functions
  const { createProject, updateProject } = useProjectsQuery(orgId);
  
  // Form state
  const [formState, setFormState] = useState<ProjectFormState>({
    name: initialData.name || '',
    description: initialData.description || '',
    visibility: initialData.visibility || 'private',
    status: initialData.status || 'active',
    tags: initialData.tags || []
  });
  
  // Loading and error state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Handle field changes
  const handleChange = useCallback((field: keyof ProjectFormState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);
  
  // Handle form submission
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formState.name.trim()) {
        throw new Error('Project name is required');
      }
      
      // Create or update project
      let project: Project;
      
      if (initialData.id) {
        // Update existing project
        project = await updateProject({
          id: initialData.id,
          name: formState.name,
          description: formState.description,
          visibility: formState.visibility,
          status: formState.status,
          tags: formState.tags
        });
      } else {
        // Create new project
        project = await createProject({
          name: formState.name,
          description: formState.description,
          organization_id: orgId,
          owned_by: 'current-user', // This would normally be set on the server
          visibility: formState.visibility,
          status: formState.status,
          tags: formState.tags,
          slug: formState.name.toLowerCase().replace(/\s+/g, '-'),
          settings: {},
          metadata: {},
          star_count: 0
        });
      }
      
      // Call success callback
      if (onSubmitSuccess) {
        onSubmitSuccess(project);
      }
      
      return project;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save project'));
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, initialData.id, orgId, createProject, updateProject, onSubmitSuccess]);
  
  return {
    formState,
    handleChange,
    handleSubmit,
    isSubmitting,
    error,
    isEditMode: !!initialData.id
  };
}

