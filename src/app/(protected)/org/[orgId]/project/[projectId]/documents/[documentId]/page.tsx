'use client';

import { Button } from '@/components/ui/button';
import { useDocumentStore } from '@/lib/store/document.store';
import { useAuth } from '@/hooks/useAuth';
import { useCreateBlock } from '@/hooks/mutations/useBlockMutations';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useBlockSubscription } from '@/hooks/queries/useBlockSubscription';
import { Block } from '@/types';
import { Table } from 'lucide-react';
import { CollaborativeTable } from '@/components/CollaborativeTable';
import { BlockCanvas } from '@/components/custom/BlockCanvas';
import { BlockType } from '@/components/custom/BlockCanvas/types';

export default function DocumentPage() {
  const params = useParams();
  const documentId = params.documentId as string;
  
  return (
    <div>
      <BlockCanvas documentId={documentId} />
    </div>
  );
}
