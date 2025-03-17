// app/dashboard/[orgId]/[projectId]/[documentId]/layout.tsx
import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getDocument, getBlocks } from '@/components/Canvas/lib/supabase/server-queries';
import { DocumentProvider } from '@/components/Canvas/lib/providers/DocumentContext';
import { CanvasToolbar } from '@/components/Canvas/components/misc/CanvasToolbar';
import { DocumentLayout as DocumentLayoutClient } from '@/app/(protected)/org/[orgId]/project/[projectId]/documents/[documentId]/DocumentLayout.client';

export default async function DocumentLayout({ 
  children, 
  params 
}: { 
  children: ReactNode;
  params: Promise<{ orgId: string; projectId: string; documentId: string }>;
}) {
  // Fetch document data
  try {
    // Destructure params to avoid the Next.js warning
    const { documentId } = await params;
    
    const document = await getDocument(documentId);
    
    return (
      <div className="flex flex-col h-full">
        <DocumentProvider document={document}>
          <CanvasToolbar />
          <div className="flex-1 overflow-auto">
            <DocumentLayoutClient>
              {children}
            </DocumentLayoutClient>
          </div>
        </DocumentProvider>
      </div>
    );
  } catch (error) {
    return notFound();
  }
}