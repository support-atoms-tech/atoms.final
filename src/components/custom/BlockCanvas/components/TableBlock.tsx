'use client';

import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import {
    DynamicRequirement,
    useRequirementActions,
} from '@/components/custom/BlockCanvas/hooks/useRequirementActions';
import {
    BlockProps,
    Column,
    Property,
    PropertyType,
} from '@/components/custom/BlockCanvas/types';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/lib/providers/organization.provider';
import { useDocumentStore } from '@/lib/store/document.store';
import { Requirement } from '@/types/base/requirements.types';
import { Json } from '@/types/base/database.types';

import { EditableColumn, EditableColumnType, PropertyConfig } from './EditableTable/types';
import { TableBlockContent } from './TableBlockContent';
import { TableBlockLoadingState } from './TableBlockLoadingState';
import { useColumnActions } from '../hooks/useColumnActions';

// Helper function to format enum values for display
const formatEnumValueForDisplay = (value: string): string => {
    if (!value) return '';

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

// Helper function to convert property type to editable column type
const propertyTypeToColumnType = (type: PropertyType): EditableColumnType => {
    switch (type) {
        case PropertyType.select:
        case PropertyType.multi_select:
            return 'select';
        case PropertyType.number:
            return 'number';
        case PropertyType.date:
            return 'date';
        default:
            return 'text';
    }
};

// Helper function to convert EditableColumnType to PropertyType
const columnTypeToPropertyType = (type: EditableColumnType): PropertyType => {
    switch (type) {
        case 'select':
            return PropertyType.select;
        case 'multi_select':
            return PropertyType.multi_select;
        case 'number':
            return PropertyType.number;
        case 'date':
            return PropertyType.date;
        default:
            return PropertyType.text;
    }
};

export const TableBlock: React.FC<BlockProps> = ({
    block,
    isEditMode: _isEditMode,
    onUpdate,
}) => {
    const { userProfile } = useAuth();
    const params = useParams();
    const { currentOrganization } = useOrganization();
    const { createColumn } = useColumnActions({
        orgId: currentOrganization?.id || '',
        projectId: params.projectId as string,
        documentId: params.documentId as string,
    });
    const projectId = params?.projectId as string;

    const [_selectedRequirement, _setSelectedRequirement] =
        useState<Requirement | null>(null);
    const [localRequirements, setLocalRequirements] = useState<Requirement[]>(
        block.requirements || [],
    );

    // Use the document store for edit mode state
    const { isEditMode: globalIsEditMode, setIsEditMode } = useDocumentStore();

    // Initialize requirement actions with properties
    const { getDynamicRequirements, saveRequirement, deleteRequirement, refreshRequirements } =
        useRequirementActions({
            blockId: block.id,
            documentId: block.document_id,
            localRequirements,
            setLocalRequirements,
            properties: block.columns?.map(col => col.property).filter(Boolean) as Property[],
        });

    // Fetch fresh requirements when exiting edit mode
    useEffect(() => {
        if (!globalIsEditMode) {
            refreshRequirements();
        }
    }, [globalIsEditMode, refreshRequirements]);

    // Get table columns from block columns
    const getColumnsFromProperties = useCallback(() => {
        if (!block.columns) return [];

        // Create columns array from block columns, sorted by position
        const columns = block.columns
            .filter(col => col.property)
            .map(col => {
                const property = col.property as Property;
                const propertyKey = property.name;
                
                return {
                    header: propertyKey,
                    accessor: propertyKey as keyof DynamicRequirement,
                    type: propertyTypeToColumnType(property.property_type),
                    width: 150,
                    required: false,
                    isSortable: true,
                    options: property.options?.values
                };
            })
            .sort((a, b) => {
                const aPos = block.columns?.find(col => col.property?.name === a.header)?.position || 0;
                const bPos = block.columns?.find(col => col.property?.name === b.header)?.position || 0;
                return aPos - bPos;
            });

        return columns;
    }, [block.columns]);

    // Convert the columns to table format
    const columns = getColumnsFromProperties();

    // Get requirements in dynamic format
    const dynamicRequirements = getDynamicRequirements();

    // Handle adding a new column
    const handleAddColumn = async (
        name: string, 
        type: EditableColumnType, 
        propertyConfig: PropertyConfig,
        defaultValue: string
    ) => {
        if (!userProfile?.id) return;
        
        try {
            // Create property and column in the database
            const { property, column } = await createColumn(
                name,
                type,
                propertyConfig,
                defaultValue,
                block.id,
                userProfile.id
            );

            // Update local block state
            const updatedBlock = {
                ...block,
                columns: [...(block.columns || []), column],
                requirements: block.requirements?.map(req => ({
                    ...req,
                    properties: {
                        ...req.properties,
                        [column.id]: defaultValue
                    }
                }))
            };

            // Update block through the provided callback
            if (onUpdate) {
                await onUpdate(updatedBlock as unknown as Json);
            }
        } catch (error) {
            console.error('Error adding column:', error);
        }
    };

    // Create wrapper functions to handle the user ID
    const handleSaveRequirement = async (dynamicReq: DynamicRequirement, isNew: boolean) => {
        if (!userProfile?.id) return;
        await saveRequirement(dynamicReq, isNew, userProfile.id);
        // Refresh requirements after save
        await refreshRequirements();
    };

    const handleDeleteRequirement = async (dynamicReq: DynamicRequirement) => {
        if (!userProfile?.id) return;
        await deleteRequirement(dynamicReq, userProfile.id);
        // Refresh requirements after delete
        await refreshRequirements();
    };

    if (!block.columns) {
        return <TableBlockLoadingState isLoading={true} isError={false} error={null} />;
    }

    return (
        <TableBlockContent
            dynamicRequirements={dynamicRequirements}
            columns={columns}
            onSaveRequirement={handleSaveRequirement}
            onDeleteRequirement={handleDeleteRequirement}
            onAddColumn={handleAddColumn}
            isEditMode={globalIsEditMode}
            alwaysShowAddRow={true}
            orgId={currentOrganization?.id || ''}
            projectId={projectId}
            documentId={block.document_id}
        />
    );
};
