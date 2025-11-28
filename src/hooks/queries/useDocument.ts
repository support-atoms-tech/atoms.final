import { useMutation, useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { queryKeys } from '@/lib/constants/queryKeys';
import { getDocumentBlocksAndRequirements } from '@/lib/db/client';
import { handle401Response } from '@/lib/utils/handle401';
import {
    QueryFilters as GenericQueryFilters,
    buildQuery,
} from '@/lib/utils/queryFactory';
import { Block, Document } from '@/types/base/documents.types';
import { QueryFilters } from '@/types/base/filters.types';

export function useProjectDocuments(projectId: string) {
    const router = useRouter();
    const pathname = usePathname();

    return useQuery({
        queryKey: queryKeys.documents.byProject(projectId),
        retry: false,
        retryOnMount: false,
        throwOnError: false,
        queryFn: async () => {
            const response = await fetch(`/api/projects/${projectId}/documents`, {
                method: 'GET',
                cache: 'no-store',
            });

            if (!response.ok) {
                // Handle 401 (Unauthorized) - user is logged out
                const handled = handle401Response(response, pathname, router);
                if (handled === null) return null;

                // For other errors, log but don't throw
                const message = `Error fetching project documents: ${response.statusText}`;
                console.error(message);
                return null;
            }

            const payload = (await response.json()) as {
                documents: Document[];
            };

            return payload.documents;
        },
        enabled: !!projectId,
    });
}

export function useDocument(documentId: string) {
    const router = useRouter();
    const pathname = usePathname();

    return useQuery({
        queryKey: queryKeys.documents.detail(documentId),
        retry: false,
        retryOnMount: false,
        throwOnError: false,
        queryFn: async () => {
            const response = await fetch(`/api/documents/${documentId}`, {
                method: 'GET',
                cache: 'no-store',
            });

            if (!response.ok) {
                // Handle 401 (Unauthorized) - user is logged out
                const handled = handle401Response(response, pathname, router);
                if (handled === null) return null;

                // For other errors, log but don't throw
                const message = `Error fetching document: ${response.statusText}`;
                console.error(message);
                return null;
            }

            const payload = (await response.json()) as {
                document: Document;
            };

            return payload.document;
        },
        enabled: !!documentId,
    });
}

export function useDocuments(queryFilters?: GenericQueryFilters<'documents'>) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.documents.list((queryFilters as QueryFilters) || {}),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            const { data } = await buildQuery(supabase, 'documents', queryFilters);
            return data;
        },
        enabled: !authLoading && !!supabase,
    });
}

export function useUpdateDocument(documentId: string) {
    const { supabase, error: authError } = useAuthenticatedSupabase();

    return useMutation({
        mutationFn: async (document: Document) => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            const { data, error } = await supabase
                .from('documents')
                .update(document)
                .eq('id', documentId)
                .single();
            if (error) throw error;
            return data;
        },
    });
}

export function useDocumentBlocksAndRequirements(documentId: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.blocks.byDocument(documentId),
        queryFn: () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            return getDocumentBlocksAndRequirements(supabase, documentId);
        },
        enabled: !!documentId && !authLoading && !!supabase,
    });
}

export function useBlock(blockId: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.blocks.detail(blockId),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            const { data, error } = await supabase
                .from('blocks')
                .select('*')
                .eq('id', blockId)
                .single();

            if (error) throw error;
            return data as Block;
        },
        enabled: !!blockId && !authLoading && !!supabase,
    });
}
