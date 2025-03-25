import React, { useState } from 'react';

import { SidePanel } from '@/components/base/panels/SidePanel';
import { EditableTable } from '@/components/custom/BlockCanvas/components/EditableTable';
import { DynamicRequirement } from '@/components/custom/BlockCanvas/hooks/useRequirementActions';
import { PropertyType } from '@/components/custom/BlockCanvas/types';
import { useAuth } from '@/hooks/useAuth';
import { Requirement } from '@/types/base/requirements.types';
import { Button } from '@/components/ui/button';
import { Columns } from 'lucide-react';

import { AddColumnDialog } from '@/components/custom/BlockCanvas/components/EditableTable/components/AddColumnDialog';
import { EditableColumn, EditableColumnType, PropertyConfig } from '@/components/custom/BlockCanvas/components/EditableTable/types';

interface TableBlockContentProps {
    dynamicRequirements: DynamicRequirement[];
    columns: EditableColumn<DynamicRequirement>[];
    onSaveRequirement: (
        dynamicReq: DynamicRequirement,
        isNew: boolean,
    ) => Promise<void>;
    onDeleteRequirement: (dynamicReq: DynamicRequirement) => Promise<void>;
    onAddColumn: (name: string, type: EditableColumnType, propertyConfig: PropertyConfig, defaultValue: string) => Promise<void>;
    isEditMode: boolean;
    alwaysShowAddRow?: boolean;
    orgId: string;
    projectId?: string;
    documentId?: string;
}

export const TableBlockContent: React.FC<TableBlockContentProps> = ({
    dynamicRequirements,
    columns,
    onSaveRequirement,
    onDeleteRequirement,
    onAddColumn,
    isEditMode,
    alwaysShowAddRow = false,
    orgId,
    projectId,
    documentId,
}) => {
    const { userProfile } = useAuth();
    const [selectedRequirement, setSelectedRequirement] =
        useState<Requirement | null>(null);
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);

    return (
        <div className="space-y-4">
            <div className="flex justify-between mb-2">
                {isEditMode && (
                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAddColumnOpen(true)}
                            disabled={!userProfile?.id}
                        >
                            <Columns className="h-4 w-4 mr-2" />
                            Add Column
                        </Button>
                        <AddColumnDialog
                            isOpen={isAddColumnOpen}
                            onClose={() => setIsAddColumnOpen(false)}
                            onSave={onAddColumn}
                            orgId={orgId}
                            projectId={projectId}
                            documentId={documentId}
                        />
                    </div>
                )}
            </div>

            <EditableTable
                data={dynamicRequirements}
                columns={columns}
                onSave={onSaveRequirement}
                onDelete={onDeleteRequirement}
                emptyMessage="Click the 'New Row' below to add your first requirement."
                showFilter={true}
                isEditMode={isEditMode}
                alwaysShowAddRow={alwaysShowAddRow}
            />

            <SidePanel
                isOpen={!!selectedRequirement}
                onClose={() => setSelectedRequirement(null)}
                showNavigateButton={true}
                showEditButton={true}
                onNavigate={() => {
                    // Navigate to requirement detail page
                    // You'll need to implement this based on your routing structure
                }}
                onOptionSelect={(option) => {
                    if (option === 'delete' && selectedRequirement) {
                        onDeleteRequirement({ id: selectedRequirement.id });
                        setSelectedRequirement(null);
                    }
                }}
            >
                {selectedRequirement && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold">
                                {selectedRequirement.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {selectedRequirement.description}
                            </p>
                        </div>
                    </div>
                )}
            </SidePanel>
        </div>
    );
};
