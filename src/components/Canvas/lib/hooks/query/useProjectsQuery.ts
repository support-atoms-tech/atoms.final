

// hooks/query/useProjectsQuery.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Project } from '@/components/Canvas/types';
import { getQueryClient } from '@/lib/constants/queryClient';
import { useCanvasStore } from '@/components/Canvas/lib/store/canvasStore';

export function useProjectsQuery(orgId: string | null) {
  const queryClient = getQueryClient();
  const { clientId } = useCanvasStore();
  
  // Fetch projects for organization
  const query = useQuery<Project[]>({
    queryKey: ['projects', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_deleted', false)
        .order('name');
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId
  });
  
  // Create project mutation
  const createMutation = useMutation({
    mutationFn: async (newProject: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...newProject,
          client_id: clientId // For real-time identification
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Update query cache with new project
      queryClient.setQueryData(['projects', orgId], (old: Project[] = []) => {
        return [...old, data];
      });
    }
  });
  
  // Update project mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Project> & { id: string }) => {
      const { id, ...rest } = updates;
      
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...rest,
          updated_at: new Date().toISOString(),
          client_id: clientId // For real-time identification
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['projects', orgId] });
      
      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData<Project[]>(['projects', orgId]);
      
      // Optimistically update the cache
      queryClient.setQueryData(['projects', orgId], (old: Project[] = []) => {
        return old.map(project => 
          project.id === updates.id ? { ...project, ...updates } : project
        );
      });
      
      return { previousProjects };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', orgId], context.previousProjects);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['projects', orgId] });
    }
  });
  
  // Delete (soft) project mutation
  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { data, error } = await supabase
        .from('projects')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          client_id: clientId // For real-time identification
        })
        .eq('id', projectId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onMutate: async (projectId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['projects', orgId] });
      
      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData<Project[]>(['projects', orgId]);
      
      // Optimistically update the cache
      queryClient.setQueryData(['projects', orgId], (old: Project[] = []) => {
        return old.filter(project => project.id !== projectId);
      });
      
      return { previousProjects };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', orgId], context.previousProjects);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['projects', orgId] });
    }
  });
  
  return {
    projects: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createProject: createMutation.mutateAsync,
    updateProject: updateMutation.mutateAsync,
    deleteProject: deleteMutation.mutateAsync,
  };
}







