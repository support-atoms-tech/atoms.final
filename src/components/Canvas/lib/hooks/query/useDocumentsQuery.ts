// hooks/query/useDocumentsQuery.ts

import { getQueryClient } from "@/lib/constants/queryClient";
import { useCanvasStore } from "../../store/canvasStore";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/supabaseBrowser";
import { Document, DocumentCreateData } from "@/components/Canvas/types";

export function useDocumentsQuery(projectId: string | null) {
    const queryClient = getQueryClient();
    const { clientId } = useCanvasStore();
    
    // Fetch documents for project
    const query = useQuery<Document[]>({
      queryKey: ['documents', projectId],
      queryFn: async () => {
        if (!projectId) return [];
        
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('project_id', projectId)
          .eq('is_deleted', false)
          .order('name');
          
        if (error) throw error;
        return data || [];
      },
      enabled: !!projectId
    });
    
    // Create document mutation
    const createMutation = useMutation({
      mutationFn: async (newDoc: DocumentCreateData) => {
        // Extract createBaseProperties and exclude from document object
        const { createBaseProperties, ...docData } = newDoc;
        
        // Start a transaction to create document and base properties if needed
        const { data, error } = await supabase
          .from('documents')
          .insert({
            ...docData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            client_id: clientId // For real-time identification
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // If createBaseProperties is true, create default blocks and properties
        if (createBaseProperties) {
          // This would typically call a server function to set up default blocks,
          // but for now we'll just simulate it
          console.log('Creating base properties for document', data.id);
          
          // Here we would create default text block, table block, etc.
          // await supabase.rpc('setup_document_defaults', { document_id: data.id });
        }
        
        return data;
      },
      onSuccess: (data) => {
        // Update query cache with new document
        queryClient.setQueryData(['documents', projectId], (old: Document[] = []) => {
          return [...old, data];
        });
      }
    });
    
    // Update document mutation
    const updateMutation = useMutation({
      mutationFn: async (updates: Partial<Document> & { id: string }) => {
        const { id, ...rest } = updates;
        
        const { data, error } = await supabase
          .from('documents')
          .update({
            ...rest,
            updated_at: new Date().toISOString(),
            client_id: clientId // For real-time identification
          })
          .eq('id', id)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      },
      onMutate: async (updates) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: ['documents', projectId] });
        
        // Snapshot the previous value
        const previousDocs = queryClient.getQueryData<Document[]>(['documents', projectId]);
        
        // Optimistically update the cache
        queryClient.setQueryData(['documents', projectId], (old: Document[] = []) => {
          return old.map(doc => 
            doc.id === updates.id ? { ...doc, ...updates } : doc
          );
        });
        
        return { previousDocs };
      },
      onError: (err, variables, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        if (context?.previousDocs) {
          queryClient.setQueryData(['documents', projectId], context.previousDocs);
        }
      },
      onSettled: () => {
        // Always refetch after error or success
        queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      }
    });
    
    // Delete (soft) document mutation
    const deleteMutation = useMutation({
      mutationFn: async (docId: string) => {
        const { data, error } = await supabase
          .from('documents')
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            client_id: clientId // For real-time identification
          })
          .eq('id', docId)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      },
      onMutate: async (docId) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: ['documents', projectId] });
        
        // Snapshot the previous value
        const previousDocs = queryClient.getQueryData<Document[]>(['documents', projectId]);
        
        // Optimistically update the cache
        queryClient.setQueryData(['documents', projectId], (old: Document[] = []) => {
          return old.filter(doc => doc.id !== docId);
        });
        
        return { previousDocs };
      },
      onError: (err, variables, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        if (context?.previousDocs) {
          queryClient.setQueryData(['documents', projectId], context.previousDocs);
        }
      },
      onSettled: () => {
        // Always refetch after error or success
        queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      }
    });
    
    return {
      documents: query.data || [],
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      createDocument: createMutation.mutateAsync,
      updateDocument: updateMutation.mutateAsync,
      deleteDocument: deleteMutation.mutateAsync,
    };
  }