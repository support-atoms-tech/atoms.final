import { useEffect } from 'react';
import { useUIStore } from '@/components/Canvas/lib/store/uiStore';
import { useParams } from 'next/navigation';

/**
 * Hook to set the active project context
 * This should be used in layout components at the project level
 */
export function useProjectContext() {
  const params = useParams();
  const { setActiveProject, activeProjectId, activeOrgId } = useUIStore();
  
  useEffect(() => {
    // Extract projectId from URL params or path
    let projectId = null;
    
    if (params?.projectId) {
      // If we have a projectId param directly
      projectId = params.projectId as string;
    } else if (params?.slug && typeof params.slug === 'string' && params.slug.includes('-')) {
      // Some routes might use slug instead
      projectId = params.slug;
    } else if (typeof window !== 'undefined') {
      // Try to extract from path as fallback
      const pathParts = window.location.pathname.split('/');
      const projectIndex = pathParts.findIndex(part => part === 'project' || part === 'projects');
      if (projectIndex !== -1 && pathParts[projectIndex + 1]) {
        projectId = pathParts[projectIndex + 1];
      }
    }
    
    // Only update if we have a projectId and it's different from the current one
    if (projectId && projectId !== activeProjectId) {
      console.log('Setting active project from URL:', projectId);
      setActiveProject(projectId);
    }
  }, [params, setActiveProject, activeProjectId]);
  
  return { activeProjectId, activeOrgId };
} 