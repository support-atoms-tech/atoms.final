import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase/supabaseBrowser';
import { useDocumentStore } from '@/lib/store/document.store';
import { Block } from '@/types/base/documents.types';
import { Profile } from '@/types/base/profiles.types';
import { Requirement } from '@/types/base/requirements.types';
import { BlockWithRequirements, Column, Property } from '@/components/custom/BlockCanvas/types';

interface UseDocumentRealtimeProps {
    documentId: string;
    orgId: string;
    projectId: string;
    userProfile: Profile | null;
}

interface DocumentState {
    blocks: BlockWithRequirements[] | undefined;
    loading: boolean;
    error: Error | null;
    setDocument: (blocks: BlockWithRequirements[]) => void;
}

export const useDocumentRealtime = ({
    documentId,
    orgId,
    projectId,
    userProfile,
}: UseDocumentRealtimeProps): DocumentState => {
    const [blocks, setBlocks] = useState<BlockWithRequirements[]>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Fetch blocks and their requirements
    const fetchBlocks = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch blocks
            const { data: blocksData, error: blocksError } = await supabase
                .from('blocks')
                .select('*')
                .eq('document_id', documentId)
                .order('position');

            if (blocksError) throw blocksError;

            // Fetch requirements for all blocks
            const { data: requirementsData, error: requirementsError } =
                await supabase
                    .from('requirements')
                    .select('*')
                    .eq('document_id', documentId);

            if (requirementsError) throw requirementsError;

            // Fetch columns for table blocks
            const tableBlocks = blocksData.filter(
                (block) => block.type === 'table',
            );
            const { data: columnsData, error: columnsError } = await supabase
                .from('columns')
                .select('*, property:properties(*)')
                .in(
                    'block_id',
                    tableBlocks.map((block) => block.id),
                );

            if (columnsError) throw columnsError;

            // Group requirements by block_id
            const requirementsByBlock = requirementsData.reduce(
                (acc: { [key: string]: Requirement[] }, req: Requirement) => {
                    if (!acc[req.block_id]) {
                        acc[req.block_id] = [];
                    }
                    acc[req.block_id].push(req);
                    return acc;
                },
                {},
            );

            // Group columns by block_id
            const columnsByBlock = columnsData.reduce(
                (acc: { [key: string]: Column[] }, col: Column) => {
                    if (!acc[col.block_id!]) {
                        acc[col.block_id!] = [];
                    }
                    acc[col.block_id!].push(col);
                    return acc;
                },
                {},
            );

            // Combine blocks with their requirements and columns
            const blocksWithRequirements: BlockWithRequirements[] = blocksData.map(
                (block: Block) => ({
                    ...block,
                    order: block.position || 0,
                    requirements: requirementsByBlock[block.id] || [],
                    columns: columnsByBlock[block.id] || [],
                }),
            );

            setBlocks(blocksWithRequirements);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [documentId, supabase]);

    // Subscribe to changes
    useEffect(() => {
        if (!documentId) return;

        // Initial fetch
        fetchBlocks();

        // Subscribe to blocks changes
        const blocksSubscription = supabase
            .channel(`blocks:${documentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'blocks',
                    filter: `document_id=eq.${documentId}`,
                },
                () => {
                    fetchBlocks();
                },
            )
            .subscribe();

        // Subscribe to requirements changes
        const requirementsSubscription = supabase
            .channel(`requirements:${documentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'requirements',
                    filter: `document_id=eq.${documentId}`,
                },
                () => {
                    fetchBlocks();
                },
            )
            .subscribe();

        // Subscribe to columns changes
        const columnsSubscription = supabase
            .channel(`columns:${documentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'columns',
                },
                () => {
                    fetchBlocks();
                },
            )
            .subscribe();

        return () => {
            blocksSubscription.unsubscribe();
            requirementsSubscription.unsubscribe();
            columnsSubscription.unsubscribe();
        };
    }, [documentId, supabase, fetchBlocks]);

    return {
        blocks,
        loading,
        error,
        setDocument: setBlocks,
    };
};
