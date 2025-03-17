import { useEffect } from 'react';
import { useUIStore } from '@/components/Canvas/lib/store/uiStore';
import { useParams } from 'next/navigation';

/**
 * Hook to set the active document context
 * This should be used in layout components at the document level
 */
export function useDocumentContext() {
  const params = useParams();
  const { setActiveDocument, setActiveOrg, setActiveProject, activeDocumentId, activeProjectId, activeOrgId } = useUIStore();
  
  useEffect(() => {
    // Extract documentId from URL params or path
    let documentId = null;
    
    if (params?.documentId) {
      // If we have a documentId param directly
      documentId = params.documentId as string;
    } else if (params?.slug && typeof params.slug === 'string' && params.slug.includes('-')) {
      // Some routes might use slug instead
      documentId = params.slug;
    } else if (typeof window !== 'undefined') {
      // Try to extract from path as fallback
      const pathParts = window.location.pathname.split('/');
      const docIndex = pathParts.findIndex(part => part === 'document' || part === 'documents' || part === 'doc' || part === 'docs');
      if (docIndex !== -1 && pathParts[docIndex + 1]) {
        documentId = pathParts[docIndex + 1];
      }
    }
    
    // Only update if we have a documentId and it's different from the current one
    if (documentId && documentId !== activeDocumentId) {
      console.log('Setting active document from URL:', documentId);
      setActiveDocument(documentId);
      setActiveOrg(params.orgId as string);
      setActiveProject(params.projectId as string);
    }
  }, [params, setActiveDocument, activeDocumentId]);
  
  return { activeDocumentId, activeProjectId, activeOrgId };
} 