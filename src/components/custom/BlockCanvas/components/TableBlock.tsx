'use client';

import React, { useEffect, useCallback, useState } from 'react';

import {
    DynamicRequirement,
    useRequirementActions,
} from '@/components/custom/BlockCanvas/hooks/useRequirementActions';
import { useProperties } from '@/components/custom/BlockCanvas/hooks/useProperties';
import { BlockProps, PropertyType } from '@/components/custom/BlockCanvas/types';
import { useAuth } from '@/hooks/useAuth';
import { useParams } from 'next/navigation';
import { useDocumentStore } from '@/lib/store/document.store';
import { Requirement } from '@/types/base/requirements.types';
import { EditableColumn, EditableColumnType } from './EditableTable/types';

import { TableBlockContent } from './TableBlockContent';
import { TableBlockLoadingState } from './TableBlockLoadingState';
import { useOrganization } from '@/lib/providers/organization.provider';

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

export const TableBlock: React.FC<BlockProps> = ({
    block,
    isEditMode: _isEditMode,
    properties,
}) => {
    const { userProfile } = useAuth();
    const params = useParams();
    const { currentOrganization } = useOrganization();
    const orgId = currentOrganization?.id as string;
    const projectId = params?.projectId as string;
    
    const [_selectedRequirement, _setSelectedRequirement] =
        useState<Requirement | null>(null);
    const [localRequirements, setLocalRequirements] = useState<Requirement[]>(
        block.requirements || [],
    );

    // Use the document store for edit mode state
    const { isEditMode: globalIsEditMode, setIsEditMode } = useDocumentStore();

    // Use passed in properties if available, otherwise fetch them
    const {
        properties: fetchedProperties,
        isLoading: isLoadingProperties,
        fetchProperties,
        createProperty,
    } = useProperties({
        documentId: block.document_id,
        blockId: block.id,
    });

    // Use the properties passed in from parent or the fetched ones
    const blockProperties = properties || fetchedProperties;
    const propertiesLoading = !properties && isLoadingProperties;

    // Initialize requirement actions with properties
    const { getDynamicRequirements, saveRequirement, deleteRequirement } =
        useRequirementActions({
            blockId: block.id,
            documentId: block.document_id,
            localRequirements,
            setLocalRequirements,
            properties: blockProperties,
        });

    // Get table columns from properties
    const getColumnsFromProperties = useCallback(() => {
        if (!blockProperties) return [];

        // Create a base array with the External ID column first
        const baseColumns: EditableColumn<DynamicRequirement>[] = [
            {
                header: 'External ID',
                accessor: 'External ID' as keyof DynamicRequirement,
                type: 'text',
                width: 150,
                required: true,
                isSortable: true,
            },
        ];

        // Add columns from properties, excluding any ID-related properties
        const propertyColumns = blockProperties
            .filter(prop => {
                // Exclude any ID-related properties
                const lowerKey = prop.key.toLowerCase();
                const lowerName = prop.name.toLowerCase();
                return !['id', 'req_id'].some(idField => 
                    lowerKey.includes(idField) || lowerName.includes(idField)
                ) && lowerKey !== 'external_id' && lowerName !== 'external id';
            })
            .map(prop => {
                // Map property type to EditableColumnType
                let columnType: EditableColumnType = 'text';
                let options: string[] | undefined;
                
                switch (prop.type) {
                    case 'number':
                        columnType = 'number';
                        break;
                    case 'date':
                        columnType = 'date';
                        break;
                    case 'select':
                        columnType = 'select';
                        // Handle options from the property's options field
                        if (prop.options && typeof prop.options === 'object') {
                            const optionsObj = prop.options as Record<string, unknown>;
                            if (Array.isArray(optionsObj.values)) {
                                const rawValues = optionsObj.values as string[];
                                
                                // Format the enum values for display
                                options = rawValues.map(value => formatEnumValueForDisplay(value));
                            }
                        }
                        break;
                    case 'multi_select':
                        columnType = 'multi_select';
                        // Handle options from the property's options field
                        if (prop.options && typeof prop.options === 'object') {
                            const optionsObj = prop.options as Record<string, unknown>;
                            if (Array.isArray(optionsObj.values)) {
                                const rawValues = optionsObj.values as string[];
                                
                                // Format the enum values for display
                                options = rawValues.map(value => formatEnumValueForDisplay(value));
                            }
                        }
                        break;
                    default:
                        columnType = 'text';
                }
                
                const column: EditableColumn<DynamicRequirement> = {
                    header: prop.name,
                    accessor: prop.name as keyof DynamicRequirement,
                    type: columnType,
                    options,
                    width: prop.name === 'Description' ? 300 : 150,
                    required: prop.is_required,
                    isSortable: true,
                };
                
                return column;
            });

        // Return the combined columns array
        return [...baseColumns, ...propertyColumns];
    }, [blockProperties]);

    // Generate columns from properties
    const columns = blockProperties && blockProperties.length > 0 
        ? getColumnsFromProperties() 
        : [];

    // Fetch properties only if not passed from parent
    useEffect(() => {
        if (!properties) {
            fetchProperties();
        }
    }, [properties, fetchProperties]);

    // Update local requirements when block.requirements changes
    useEffect(() => {
        setLocalRequirements(block.requirements || []);
    }, [block.requirements]);

    // Handle saving a requirement
    const handleSaveRequirement = async (
        dynamicReq: DynamicRequirement,
        isNew: boolean,
    ) => {
        if (!userProfile?.id) return;

        try {
            await saveRequirement(dynamicReq, isNew, userProfile.id);
            
            // Exit edit mode after creating a new requirement
            if (isNew) {
                setTimeout(() => {
                    setIsEditMode(false);
                }, 0);
            }
        } catch (error) {
            // Handle error (could add toast notification here)
            console.error(error);
        }
    };

    // Handle deleting a requirement
    const handleDeleteRequirement = async (dynamicReq: DynamicRequirement) => {
        if (!userProfile?.id) return;

        try {
            await deleteRequirement(dynamicReq, userProfile.id);
        } catch (error) {
            // Handle error (could add toast notification here)
            console.error(error);
        }
    };

    // Handle adding a new column using properties
    const handleAddColumn = async (name: string, dataType: PropertyType) => {
        if (!userProfile?.id || !blockProperties) return;

        try {
            // Use orgId and projectId from URL params
            if (!orgId || !projectId) {
                console.error('No organization or project ID available in URL params');
                return;
            }

            // Create options for select type
            let options = undefined;
            if (dataType === 'select') {
                // Default options for select type
                options = { values: ['option1', 'option2', 'option3'] };
            }

            // Create a new property
            const newProperty = await createProperty({
                org_id: orgId,
                project_id: projectId,
                document_id: block.document_id,
                block_id: block.id,
                name: name,
                key: name.toLowerCase().replace(/\s+/g, '_'),
                type: dataType,
                position: (blockProperties.length + 1) * 10,
                is_required: false,
                is_hidden: false,
                options,
                created_by: userProfile.id,
                updated_by: userProfile.id,
                is_deleted: false,
                is_schema: true,
            });

            console.log('Created new property:', newProperty);

            // Update all existing requirements with the new property
            if (localRequirements.length > 0) {
                await Promise.all(
                    localRequirements.map(async (req) => {
                        // Skip deleted requirements
                        if (req.is_deleted) return;

                        // Get existing properties or create new object
                        const existingProps = req.properties || {};

                        // Add the new property to the requirement's properties
                        const updatedProperties = {
                            ...existingProps,
                            [newProperty.key]: '', // Initialize with empty value
                        };

                        // Create a dynamic requirement with the new property
                        const dynamicReq: DynamicRequirement = {
                            id: req.id,
                            Name: req.name,
                            Description: req.description || '',
                            Status: formatEnumValueForDisplay(req.status),
                            Priority: formatEnumValueForDisplay(req.priority),
                            'External ID': req.external_id || `REQ-${req.id.substring(0, 6)}`,
                            [name]: '', // Add the new property with empty value
                        };

                        // Update the requirement with the new property
                        await saveRequirement(
                            dynamicReq,
                            false,
                            userProfile.id,
                        );
                    }),
                );
            }
            
            // Refresh properties to ensure the UI is updated with the new property
            if (fetchProperties) {
                await fetchProperties();
            }
        } catch (error) {
            // Handle error (could add toast notification here)
            console.error('Error adding column:', error);
            throw error;
        }
    };

    // Get dynamic requirements for the table
    const dynamicRequirements = getDynamicRequirements();

    // Determine if we're in a loading state
    const isLoading = propertiesLoading;
    
    // If we're in a loading state, show a loading indicator
    if (isLoading) {
        return <TableBlockLoadingState 
            isLoading={isLoading} 
            isError={false} 
            error={null} 
        />;
    }

    // Even if we have no properties or requirements, we should still show the table
    // with appropriate columns if properties exist
    if (!blockProperties || blockProperties.length === 0) {
        return (
            <div className="p-4 text-center">
                <p>No properties found for this table.</p>
                <p className="text-sm text-muted-foreground mt-2">
                    Properties will be automatically created when you add a new table.
                </p>
            </div>
        );
    }

    // Always show the table with columns, even if there are no requirements
    return (
        <TableBlockContent
            dynamicRequirements={dynamicRequirements}
            columns={columns}
            onSaveRequirement={handleSaveRequirement}
            onDeleteRequirement={handleDeleteRequirement}
            onAddColumn={handleAddColumn}
            isEditMode={globalIsEditMode}
            alwaysShowAddRow={true} // Always show the "Add New Row" row
        />
    );
};
