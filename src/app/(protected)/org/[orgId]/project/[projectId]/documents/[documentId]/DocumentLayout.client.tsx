'use client';

import { ReactNode } from 'react';
import { useDocumentContext } from '@/components/Canvas/lib/hooks/utils/useContextHooks';

interface DocumentLayoutProps {
  children: ReactNode;
}

/**
 * Document layout component
 * This component sets the active document context based on the URL
 */
export function DocumentLayout({ children }: DocumentLayoutProps) {
  // This hook will automatically set the active document ID based on the URL
  const { activeDocumentId, activeProjectId, activeOrgId } = useDocumentContext();
  
  return (
    <div className="document-layout">
      {/* You can use activeDocumentId, activeProjectId, and activeOrgId here if needed */}
      {children}
    </div>
  );
}