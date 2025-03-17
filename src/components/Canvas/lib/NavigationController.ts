// lib/navigation/NavigationController.ts
import { useCallback } from 'react';
import { useUIStore } from '@/components/Canvas/lib/store/uiStore';
import { useRouter, usePathname } from 'next/navigation';

export function useNavigationController() {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    activeOrgId, 
    activeProjectId, 
    activeDocumentId,
    setActiveOrg,
    setActiveProject,
    setActiveDocument
  } = useUIStore();

  // Navigate to organization
  const navigateToOrg = useCallback((orgId: string) => {
    setActiveOrg(orgId);
    router.push(`/dashboard/${orgId}`);
  }, [router, setActiveOrg]);

  // Navigate to project
  const navigateToProject = useCallback((orgId: string, projectId: string) => {
    setActiveOrg(orgId);
    setActiveProject(projectId);
    router.push(`/dashboard/${orgId}/projects/${projectId}`);
  }, [router, setActiveOrg, setActiveProject]);

  // Navigate to document
  const navigateToDocument = useCallback((orgId: string, projectId: string, documentId: string) => {
    setActiveOrg(orgId);
    setActiveProject(projectId);
    setActiveDocument(documentId);
    router.push(`/dashboard/${orgId}/projects/${projectId}/documents/${documentId}`);
  }, [router, setActiveOrg, setActiveProject, setActiveDocument]);

  return {
    navigateToOrg,
    navigateToProject,
    navigateToDocument,
    
    // Current location info
    currentOrgId: activeOrgId,
    currentProjectId: activeProjectId,
    currentDocumentId: activeDocumentId,
    currentPath: pathname
  };
}