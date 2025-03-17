import { useEffect } from 'react';
import { useUIStore } from '@/components/Canvas/lib/store/uiStore';
import { useParams } from 'next/navigation';

/**
 * Hook to set the active organization context
 * This should be used in layout components at the organization level
 */
export function useOrgContext() {
  const params = useParams();
  const { setActiveOrg, activeOrgId } = useUIStore();
  
  useEffect(() => {
    // Extract orgId from URL params or path
    let orgId = null;
    
    if (params?.orgId) {
      // If we have an orgId param directly
      orgId = params.orgId as string;
    } else if (params?.slug && typeof params.slug === 'string') {
      // Some routes might use slug instead
      orgId = params.slug;
    } else if (typeof window !== 'undefined') {
      // Try to extract from path as fallback
      const pathParts = window.location.pathname.split('/');
      const orgIndex = pathParts.findIndex(part => part === 'org' || part === 'orgs');
      if (orgIndex !== -1 && pathParts[orgIndex + 1]) {
        orgId = pathParts[orgIndex + 1];
      }
    }
    
    // Only update if we have an orgId and it's different from the current one
    if (orgId && orgId !== activeOrgId) {
      console.log('Setting active org from URL:', orgId);
      setActiveOrg(orgId);
    }
  }, [params, setActiveOrg, activeOrgId]);
  
  return { activeOrgId };
} 