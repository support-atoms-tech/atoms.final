'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface CanvasNavigationProps {
  documentId: string;
  orgId: string;
  projectId: string;
}

export function CanvasNavigation({ documentId, orgId, projectId }: CanvasNavigationProps) {
  const pathname = usePathname();
  const isSimpleView = pathname.includes('/simple');
  
  // Generate URLs
  const fullCanvasUrl = `/org/${orgId}/project/${projectId}/documents/${documentId}`;
  const simpleCanvasUrl = `/org/${orgId}/project/${projectId}/documents/${documentId}/simple`;
  
  return (
    <div className="canvas-navigation flex gap-4 mb-4">
      <Link 
        href={fullCanvasUrl}
        className={`px-4 py-2 rounded-md ${!isSimpleView ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
      >
        Full Canvas
      </Link>
      <Link 
        href={simpleCanvasUrl}
        className={`px-4 py-2 rounded-md ${isSimpleView ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
      >
        Simple Canvas
      </Link>
    </div>
  );
} 