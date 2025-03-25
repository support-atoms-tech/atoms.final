'use client';

import { useDocument } from '@/hooks/queries/useDocument';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useDocumentStore } from '@/lib/store/document.store';

export default function DocumentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const documentId = params.documentId as string;
  
  const { setCurrentDocument } = useDocumentStore();
  const { data: document } = useDocument(documentId);
  
  // Set the current document in the store when it loads
  useEffect(() => {
    if (document) {
      setCurrentDocument(document);
    }
  }, [document, setCurrentDocument]);
  
  return (
    <div className="flex flex-col h-full">
      {children}
    </div>
  );
}