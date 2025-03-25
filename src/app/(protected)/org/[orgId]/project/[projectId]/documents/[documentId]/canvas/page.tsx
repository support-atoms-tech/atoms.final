'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useParams } from 'next/navigation';
import { CollaborativeTable } from '@/components/CollaborativeTable';
import { useDocumentStore } from '@/lib/store/document.store';
import { useCreateBlock } from '@/hooks/mutations/useBlockMutations';
import { useBlockSubscription } from '@/hooks/queries/useBlockSubscription';
import { Block } from '@/types';
import { Table } from 'lucide-react';
import { BlockType } from '@/components/custom/BlockCanvas/types';
import { useEffect, useState } from 'react';

export default function CanvasPage() {
  const params = useParams();
  const documentId = params.documentId as string;
  const { userProfile } = useAuth();
  const { addBlock } = useDocumentStore();
  const createBlockMutation = useCreateBlock();
  const [tableBlocks, setTableBlocks] = useState<Block[]>([]);

  // Fetch document's blocks
  const { blocks, isLoading } = useBlockSubscription(documentId);
  
  useEffect(() => {
    if (blocks && blocks.length > 0) {
      // Filter to get only table blocks
      const tables = blocks.filter((block: Block) => block.type === 'table');
      setTableBlocks(tables);
    }
  }, [blocks]);
  
  const handleAddTableBlock = async () => {
    if (!userProfile?.id) return;
    
    try {
      const newPosition = blocks?.length ? Math.max(...blocks.map((b: Block) => b.position)) + 1 : 0;
      
      const newBlock = {
        document_id: documentId,
        org_id: params.orgId as string,
        type: BlockType.table.toString(),
        position: newPosition,
        content: null,
        created_by: userProfile.id,
        updated_by: userProfile.id
      };
      
      const createdBlock = await createBlockMutation.mutateAsync(newBlock);
      console.log('✅ Table block created successfully', createdBlock);
      
      addBlock(createdBlock);
      setTableBlocks(prev => [...prev, createdBlock]);
      
    } catch (error) {
      console.error('Failed to create table block:', error);
    }
  };
  
  if (isLoading) {
    return <div className="p-8">Loading canvas...</div>;
  }
  
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Collaborative Canvas</h1>
        <Button 
          onClick={handleAddTableBlock}
          className="flex items-center gap-2"
        >
          <Table className="h-4 w-4" />
          Add Table Block
        </Button>
      </div>
      
      {tableBlocks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Table Blocks</h2>
          <div className="space-y-6">
            {tableBlocks.map(block => (
              <div key={block.id} className="border rounded-lg shadow-sm">
                <div className="bg-gray-50 p-3 font-medium border-b">
                  Table Block {block.position}
                </div>
                <div className="p-2">
                  <CollaborativeTable
                    blockId={block.id}
                    documentId={documentId}
                    userId={userProfile?.id || ''}
                    userName={userProfile?.full_name || ''}
                    userAvatar={userProfile?.avatar_url || ''}
                    height={400}
                    className="w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
