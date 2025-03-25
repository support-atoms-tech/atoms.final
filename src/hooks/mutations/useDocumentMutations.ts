import { useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';

import { DocumentPropertySchema } from '@/types/base/documents.types';
import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Document } from '@/types/base/documents.types';
import { Property, PropertyCreateData } from '@/components/Canvas/types';
import { RequirementStatus } from '@/types';

export type CreateDocumentInput = Omit<
    Document,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'deleted_at'
    | 'deleted_by'
    | 'is_deleted'
    | 'version'
>;

export function useCreateDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (document: Partial<Document>) => {
            const { data, error } = await supabase
                .from('documents')
                .insert({
                    ...document,
                    id: document.id || uuidv4(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    is_deleted: false,
                    version: 1,
                })
                .select()
                .single();

            if (error) throw error;
            return data as Document;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.documents.byProject(data.project_id),
            });
        },
    });
}

export function useUpdateDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (document: Partial<Document>) => {
            const { data, error } = await supabase
                .from('documents')
                .update({
                    ...document,
                    updated_at: new Date().toISOString(),
                    version: (document.version || 1) + 1,
                })
                .eq('id', document.id)
                .select()
                .single();

            if (error) throw error;
            return data as Document;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.documents.detail(data.id),
            });
        },
    });
}

export function useDeleteDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            deletedBy,
        }: {
            id: string;
            deletedBy: string;
        }) => {
            const { data, error } = await supabase
                .from('documents')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    deleted_by: deletedBy,
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Document;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.documents.byProject(data.project_id),
            });
        },
    });
}

export function useCreateDocumentPropertySchema() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (schema: Partial<DocumentPropertySchema>) => {
            const { data, error } = await supabase
                .from('document_property_schemas')
                .insert({
                    ...schema,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    is_deleted: false,
                    version: 1,
                })
                .select()
                .single();

            if (error) throw error;
            return data as DocumentPropertySchema;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.documentPropertySchemas.byDocument(
                    data.document_id,
                ),
            });
        },
    });
}

export function useCreateBaseOrgProperties() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ 
            orgId, 
            userId 
        }: { 
            orgId: string; 
            userId: string;
        }) => {
            // First check if base properties exist for the organization
            const { data: existingProperties, error: fetchError } = await supabase
                .from('properties')
                .select('*')
                .eq('org_id', orgId)
                .eq('is_base', true)
            
            if (fetchError) throw fetchError;
            
            // If base properties already exist, return them
            if (existingProperties && existingProperties.length > 0) {
                return existingProperties as Property[];
            }
            
            // If no base properties exist, create them
            const defaultProperties: PropertyCreateData[] = [
                { 
                    name: 'External_ID', 
                    property_type: 'text', 
                    org_id: orgId,
                    is_base: true,
                },
                { 
                    name: 'Name', 
                    property_type: 'text', 
                    org_id: orgId,
                    is_base: true, 
                },
                { 
                    name: 'Description', 
                    property_type: 'text',
                    org_id: orgId,
                    is_base: true, 
                },
                { 
                    name: 'Status', 
                    property_type: 'select', 
                    org_id: orgId,
                    is_base: true,
                    options: {
                        values: ['active', 'archived', 'draft', 'deleted', 'in_review', 'in_progress', 'approved', 'rejected'],
                    },
                },
                { 
                    name: 'Priority', 
                    property_type: 'select', 
                    org_id: orgId,
                    is_base: true, 
                    options: {
                        values: ['low', 'medium', 'high', 'critical'],
                    },
                },
            ];
            
            const timestamp = new Date().toISOString();
            const baseProperties = defaultProperties.map(prop => ({
                ...prop,
                created_at: timestamp,
                updated_at: timestamp,
                created_by: userId,
                updated_by: userId,
            }));
            
            const { data: createdProperties, error: insertError } = await supabase
                .from('properties')
                .insert(baseProperties)
                .select();
                
            if (insertError) throw insertError;
            
            return createdProperties as Property[];
        },
        onSuccess: (data) => {
            if (data.length > 0) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.properties.root,
                });
            }
        },
    });
}

export function useCreateDocumentProperties() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ 
            documentId, 
            orgId,
            propertyIds,
        }: { 
            documentId: string; 
            orgId: string;
            propertyIds?: string[];
        }) => {
            // Find the base properties for this org
            const { data: baseProperties, error: fetchError } = await supabase
                .from('properties')
                .select('*')
                .eq('org_id', orgId)
                .eq('is_base', true)
                .eq('document_id', null)
                .eq('project_id', null);
            
            if (fetchError) throw fetchError;
            
            if (!baseProperties || baseProperties.length === 0) {
                throw new Error("No base properties found for this organization");
            }
            
            // Create document-specific properties based on base properties
            const timestamp = new Date().toISOString();
            const documentProperties = baseProperties.map(baseProp => ({
                name: baseProp.name,
                property_type: baseProp.property_type,
                org_id: orgId,
                document_id: documentId,
                options: baseProp.options,
                created_at: timestamp,
                updated_at: timestamp,
            }));
            
            const { data: createdProperties, error: insertError } = await supabase
                .from('properties')
                .insert(documentProperties)
                .select();
                
            if (insertError) throw insertError;
            
            return createdProperties as Property[];
        },
        onSuccess: (data) => {
            if (data.length > 0 && data[0].document_id) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.properties.byDocument(data[0].document_id),
                });
            }
        },
    });
}

export function useCreateDocumentWithDefaultSchemas() {
    const createDocumentMutation = useCreateDocument();
    const createBaseOrgPropertiesMutation = useCreateBaseOrgProperties();

    return useMutation({
        mutationFn: async (document: Partial<Document>) => {
            // Ensure project_id is available
            if (!document.project_id) {
                throw new Error("Project ID is required to create a document");
            }
            
            // Get the org_id for the project
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .select('organization_id')
                .eq('id', document.project_id)
                .single();

            console.log('project', project);

            if (projectError) throw projectError;
            
            const orgId = project.organization_id;
            
            // Check/create base property schemas for the organization
            const baseProperties = await createBaseOrgPropertiesMutation.mutateAsync({
                orgId,
                userId: document.created_by as string,
            });

            console.log('baseProperties', baseProperties);


            
            // Create the document
            const createdDocument = await createDocumentMutation.mutateAsync(document);
            
            return createdDocument;
        },
    });
}
