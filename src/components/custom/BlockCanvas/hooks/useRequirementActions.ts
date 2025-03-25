import { v4 as uuidv4 } from 'uuid';
import { useCallback } from 'react';

import { Property } from '@/components/custom/BlockCanvas/types';
import {
    useCreateRequirement,
    useUpdateRequirement,
} from '@/hooks/mutations/useRequirementMutations';
import {
    RequirementFormat,
    RequirementLevel,
    RequirementPriority,
    RequirementStatus,
} from '@/types/base/enums.types';
import { Requirement } from '@/types/base/requirements.types';
import { supabase } from '@/lib/supabase/supabaseBrowser';

// Type for the requirement data that will be displayed in the table
export type DynamicRequirement = {
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
};

interface UseRequirementActionsProps {
    blockId: string;
    documentId: string;
    localRequirements: Requirement[];
    setLocalRequirements: React.Dispatch<React.SetStateAction<Requirement[]>>;
    properties: Property[] | undefined;
}

export const useRequirementActions = ({
    blockId,
    documentId,
    localRequirements,
    setLocalRequirements,
    properties,
}: UseRequirementActionsProps) => {
    const createRequirementMutation = useCreateRequirement();
    const updateRequirementMutation = useUpdateRequirement();

    // Function to refresh requirements from the database
    const refreshRequirements = useCallback(async () => {
        try {
            const { data: requirements, error } = await supabase
                .from('requirements')
                .select('*')
                .eq('block_id', blockId)
                .eq('document_id', documentId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!requirements) return;

            setLocalRequirements(requirements);
        } catch (error) {
            console.error('Error refreshing requirements:', error);
        }
    }, [blockId, documentId, setLocalRequirements]);

    // Helper function to create properties object from dynamic requirement
    const createPropertiesObjectFromDynamicReq = async (
        dynamicReq: DynamicRequirement,
    ) => {
        if (!properties) return { propertiesObj: {}, naturalFields: {} };

        // Fetch block columns to get position information
        const { data: blockColumns } = await supabase
            .from('columns')
            .select('*')
            .eq('block_id', blockId)
            .order('position');

        const propertiesObj: Record<string, any> = {};
        const naturalFields: Record<string, string> = {};

        // Process each property
        properties.forEach((prop) => {
            const value = dynamicReq[prop.name];
            const column = blockColumns?.find(col => col.property_id === prop.id);
            const lowerCaseName = prop.name.toLowerCase();
            
            // Check if this property maps to a natural field
            if (['name', 'description', 'external_id', 'status', 'priority'].includes(lowerCaseName)) {
                naturalFields[lowerCaseName] = value || '';
            }
            
            if (column) {
                propertiesObj[prop.name] = {
                    key: prop.name,
                    type: prop.property_type,
                    value: value || '',
                    options: prop.options,
                    position: column.position,
                    column_id: column.id,
                    property_id: prop.id
                };
            }
        });

        return { propertiesObj, naturalFields };
    };

    // Convert requirements to dynamic requirements for the table
    const getDynamicRequirements = (): DynamicRequirement[] => {
        if (!localRequirements) {
            return [];
        }

        return localRequirements.map((req) => {
            const dynamicReq: DynamicRequirement = {
                id: req.id,
            };

            // Extract values from properties object
            if (req.properties) {
                Object.entries(req.properties).forEach(([key, prop]) => {
                    if (typeof prop === 'object' && prop !== null) {
                        dynamicReq[key] = prop.value;
                    }
                });
            }

            return dynamicReq;
        });
    };

    // Helper function to format enum values for display
    const formatEnumValueForDisplay = (value: unknown): string => {
        if (!value || typeof value !== 'string') return '';

        // Handle snake_case values (e.g., "in_progress" -> "In Progress")
        if (value.includes('_')) {
            return value
                .split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        // Handle simple values (e.g., "draft" -> "Draft")
        return value.charAt(0).toUpperCase() + value.slice(1);
    };

    // Helper function to convert display values back to enum values
    const parseDisplayValueToEnum = (displayValue: string): string => {
        if (!displayValue) return '';

        // Convert "In Progress" -> "in_progress"
        return displayValue.toLowerCase().replace(/\s+/g, '_');
    };

    // Save a requirement
    const saveRequirement = async (
        dynamicReq: DynamicRequirement,
        isNew: boolean,
        userId: string,
    ) => {
        try {
            // Create properties object and extract natural fields
            const { propertiesObj, naturalFields } = await createPropertiesObjectFromDynamicReq(
                dynamicReq,
            );

            const requirementData = {
                block_id: blockId,
                document_id: documentId,
                properties: propertiesObj,
                updated_by: userId,
                // Use natural fields from properties if they exist
                ...(naturalFields?.name && { name: naturalFields.name }),
                ...(naturalFields?.description && { description: naturalFields.description }),
                ...(naturalFields?.external_id && { external_id: naturalFields.external_id }),
                ...(naturalFields?.status && { status: naturalFields.status as RequirementStatus }),
                ...(naturalFields?.priority && { priority: naturalFields.priority as RequirementPriority }),
            };

            let savedRequirement: Requirement;
            if (isNew) {
                const newRequirementData = {
                    ...requirementData,
                    created_by: userId,
                    name: naturalFields?.name || 'New Requirement', // Default name for new requirements
                };

                const { data, error } = await supabase
                    .from('requirements')
                    .insert([newRequirementData])
                    .select()
                    .single();

                if (error) throw error;
                if (!data) throw new Error('No data returned from insert');
                savedRequirement = data;

                // Update local state with the new requirement
                setLocalRequirements(prev => [...prev, savedRequirement]);
            } else {
                // For updates, only include fields that have values to avoid nullifying existing data
                const updateData = {
                    ...requirementData,
                    updated_at: new Date().toISOString(),
                };

                const { data, error } = await supabase
                    .from('requirements')
                    .update(updateData)
                    .eq('id', dynamicReq.id)
                    .select()
                    .single();

                if (error) throw error;
                if (!data) throw new Error('No data returned from update');
                savedRequirement = data;

                // Update local state with the updated requirement
                setLocalRequirements(prev =>
                    prev.map(req =>
                        req.id === savedRequirement.id ? savedRequirement : req
                    )
                );
            }

            return savedRequirement;
        } catch (error) {
            console.error('Error saving requirement:', error);
            throw error;
        }
    };

    // Delete a requirement
    const deleteRequirement = async (
        dynamicReq: DynamicRequirement,
        userId: string,
    ) => {
        try {
            const { error } = await supabase
                .from('requirements')
                .delete()
                .eq('id', dynamicReq.id);

            if (error) throw error;

            // Update local state by removing the deleted requirement
            setLocalRequirements(prev =>
                prev.filter(req => req.id !== dynamicReq.id)
            );
        } catch (error) {
            console.error('Error deleting requirement:', error);
            throw error;
        }
    };

    return {
        getDynamicRequirements,
        saveRequirement,
        deleteRequirement,
        createPropertiesObjectFromDynamicReq,
        refreshRequirements,
    };
};
