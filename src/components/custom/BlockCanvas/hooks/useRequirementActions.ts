import { v4 as uuidv4 } from 'uuid';

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

    // Helper function to create properties object from dynamic requirement
    const createPropertiesObjectFromDynamicReq = (
        dynamicReq: DynamicRequirement,
        propsList: Property[] | undefined,
    ) => {
        if (!propsList) return {};

        return propsList.reduce(
            (acc, prop) => {
                // Skip core fields that are stored directly on the requirement
                if (!['name', 'description', 'req_id', 'external_id', 'id'].includes(prop.key.toLowerCase())) {
                    // Include all properties, even if they have null values
                    // This ensures that new columns are saved
                    let value = dynamicReq[prop.name];
                    
                    // Convert display values back to enum values for select properties
                    if (prop.type === 'select' && value) {
                        value = parseDisplayValueToEnum(value as string);
                    }
                    
                    acc[prop.key] = value;
                }
                return acc;
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {} as Record<string, any>,
        );
    };

    // Convert requirements to dynamic requirements for the table
    const getDynamicRequirements = (): DynamicRequirement[] => {
        if (!localRequirements) {
            return [];
        }
        
        return localRequirements.map((req) => {
            // Generate an external ID if one doesn't exist
            const externalId = req.external_id || `REQ-${req.id.substring(0, 6)}`;
            
            // Start with the requirement basic fields
            const dynamicReq: DynamicRequirement = {
                id: req.id, // Keep this for internal reference but don't display it
                Name: req.name, // Assuming title is the correct field based on schema (not name)
                Description: req.description || '',
                // Format status and priority for display
                Status: formatEnumValueForDisplay(req.status),
                Priority: formatEnumValueForDisplay(req.priority),
            };
            
            // Set the External ID 
            dynamicReq['External ID'] = externalId;
            
            // Add all custom properties from the requirement's properties field
            if (req.properties) {
                // Make sure properties is treated as an object (handle potential JSONB serialization issues)
                const propertiesObj = typeof req.properties === 'string' 
                    ? JSON.parse(req.properties) 
                    : req.properties;
                
                // First pass: Add all properties from the requirement's properties JSONB
                Object.entries(propertiesObj).forEach(([key, value]) => {
                    // Skip undefined or null values
                    if (value === undefined || value === null) return;
                    
                    // Find the property definition to get the display name
                    const property = properties?.find(p => p.key.toLowerCase() === key.toLowerCase());
                    
                    if (property) {
                        // Use the property name (display name) as the key
                        // Format select values for display
                        if (property.type === 'select' && value) {
                            dynamicReq[property.name] = formatEnumValueForDisplay(value as string);
                        } else {
                            dynamicReq[property.name] = value;
                        }
                    } else {
                        // If no property definition exists, use the key as is
                        // This ensures we don't lose any properties
                        dynamicReq[key] = value;
                    }
                });
                
                // Second pass: Ensure all properties defined in schema are included
                if (properties) {
                    properties.forEach((prop) => {
                        // If property hasn't been set yet, try to find it in req.properties or set to null
                        if (dynamicReq[prop.name] === undefined) {
                            const propertyValue = propertiesObj[prop.key];
                            
                            // Format select values for display
                            if (prop.type === 'select' && propertyValue) {
                                dynamicReq[prop.name] = formatEnumValueForDisplay(propertyValue as string);
                            } else {
                                dynamicReq[prop.name] = propertyValue !== undefined ? propertyValue : null;
                            }
                        }
                    });
                }
            }
            
            return dynamicReq;
        });
    };
    
    // Helper function to format enum values for display
    const formatEnumValueForDisplay = (value: string): string => {
        if (!value) return '';
        
        // Handle snake_case values (e.g., "in_progress" -> "In Progress")
        if (value.includes('_')) {
            return value
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
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

    const saveRequirement = async (
        dynamicReq: DynamicRequirement,
        isNew: boolean,
        userId: string,
    ) => {
        if (!userId || !properties) {
            return;
        }

        try {
            let requirementId = dynamicReq.id;

            // Convert display values back to enum values
            const status = parseDisplayValueToEnum(dynamicReq['Status'] as string);
            const priority = parseDisplayValueToEnum(dynamicReq['Priority'] as string);

            if (isNew) {
                // Generate a UUID for new requirements
                const tempId = requirementId || uuidv4();

                // Extract name, description, and external_id from dynamic requirement
                const name = dynamicReq['Name'] || 'New Requirement';
                const description = dynamicReq['Description'] || '';
                const externalId = dynamicReq['External ID'] || `REQ-${tempId.substring(0, 6)}`;
                
                // Use parsed values or defaults
                const statusValue = status || RequirementStatus.draft;
                const priorityValue = priority || RequirementPriority.medium;

                // Create properties object from dynamic requirement
                const propertiesObject = createPropertiesObjectFromDynamicReq(
                    dynamicReq,
                    properties,
                );

                // Create the base requirement with properties field
                const newRequirement: Requirement = {
                    id: tempId,
                    name,
                    description,
                    status: statusValue as RequirementStatus,
                    priority: priorityValue as RequirementPriority,
                    format: RequirementFormat.incose,
                    level: RequirementLevel.system,
                    document_id: documentId,
                    block_id: blockId,
                    created_by: userId,
                    updated_by: userId,
                    properties: propertiesObject,
                    ai_analysis: null,
                    enchanced_requirement: null,
                    external_id: externalId, // Set the external_id
                    original_requirement: null,
                    tags: [],
                    created_at: null,
                    updated_at: null,
                    deleted_at: null,
                    deleted_by: null,
                    is_deleted: null,
                    version: 1,
                    // No data field, use properties instead
                };

                // Update local state optimistically
                setLocalRequirements((prev) => [...prev, newRequirement]);

                // Save the requirement
                const savedRequirement =
                    await createRequirementMutation.mutateAsync(newRequirement);
                requirementId = savedRequirement.id;
            } else {
                // Find the original requirement
                const originalReq = localRequirements.find(
                    (req) => req.id === requirementId,
                );
                if (!originalReq) {
                    return;
                }

                // Create properties object from dynamic requirement
                const propertiesObject = createPropertiesObjectFromDynamicReq(
                    dynamicReq,
                    properties,
                );

                // Update the base requirement with name, description, status, priority, and external_id
                const updatedRequirement: Partial<Requirement> = {
                    ...originalReq,
                    name: dynamicReq['Name'] || originalReq.name,
                    description:
                        dynamicReq['Description'] || originalReq.description,
                    external_id: 
                        dynamicReq['External ID'] || originalReq.external_id || `REQ-${originalReq.id.substring(0, 6)}`,
                    status: status ? 
                        (status as RequirementStatus) : 
                        originalReq.status,
                    priority: priority ? 
                        (priority as RequirementPriority) : 
                        originalReq.priority,
                    properties: propertiesObject,
                    updated_by: userId,
                };

                // Update local state optimistically
                setLocalRequirements((prev) =>
                    prev.map((req) =>
                        req.id === requirementId
                            ? ({
                                  ...req,
                                  ...updatedRequirement,
                              } as Requirement)
                            : req,
                    ),
                );

                // Update the requirement
                await updateRequirementMutation.mutateAsync(
                    updatedRequirement as Requirement,
                );
            }
        } catch (error) {
            // Revert local state on error
            if (isNew) {
                setLocalRequirements((prev) =>
                    prev.filter((req) => req.id !== dynamicReq.id),
                );
            }
            throw error;
        }
    };

    const deleteRequirement = async (
        dynamicReq: DynamicRequirement,
        userId: string,
    ) => {
        try {
            // Find the original requirement
            const originalReq = localRequirements.find(
                (req) => req.id === dynamicReq.id,
            );
            if (!originalReq) {
                return;
            }

            // Update local state optimistically
            setLocalRequirements((prev) =>
                prev.filter((req) => req.id !== dynamicReq.id),
            );

            // Make API call to delete the requirement
            await updateRequirementMutation.mutateAsync({
                ...originalReq,
                is_deleted: true,
                updated_by: userId,
            });
        } catch (error) {
            // Revert local state on error
            setLocalRequirements((_prev) => localRequirements);
            throw error;
        }
    };

    return {
        getDynamicRequirements,
        saveRequirement,
        deleteRequirement,
        createPropertiesObjectFromDynamicReq,
    };
};
