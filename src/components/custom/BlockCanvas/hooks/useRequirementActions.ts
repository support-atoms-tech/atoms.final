import { useCallback, useEffect, useRef } from 'react';
import { v4 as _uuidv4 } from 'uuid';

/* eslint-disable @typescript-eslint/no-unused-vars */

import { CellValue } from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { Property } from '@/components/custom/BlockCanvas/types';
import {
    useCreateRequirement,
    useUpdateRequirement,
} from '@/hooks/mutations/useRequirementMutations';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { generateNextRequirementId } from '@/lib/utils/requirementIdGenerator';
import { Json, TablesInsert, TablesUpdate } from '@/types/base/database.types';
import {
    ERequirementPriority,
    ERequirementStatus,
    RequirementPriority,
    RequirementStatus,
    RequirementFormat as _RequirementFormat,
    RequirementLevel as _RequirementLevel,
} from '@/types/base/enums.types';
import { Requirement, RequirementAiAnalysis } from '@/types/base/requirements.types';

// Type for the requirement data that will be displayed in the table
export type DynamicRequirement = {
    id: string;
    ai_analysis: RequirementAiAnalysis;
} & {
    position?: number;
    height?: number;
} & {
    [key in Exclude<string, 'position' | 'height'>]?: CellValue;
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
    const _createRequirementMutation = useCreateRequirement();
    const _updateRequirementMutation = useUpdateRequirement();
    const deletedRowIdsRef = useRef<Set<string>>(new Set());
    const loggedHydrationRef = useRef<Set<string>>(new Set());
    const lastRequirementsRef = useRef<string>('');
    const { getClientOrThrow } = useAuthenticatedSupabase();

    // Clear hydration log tracking when requirements change (new data loaded)
    useEffect(() => {
        const currentIds = localRequirements
            .map((r) => r.id)
            .sort()
            .join(',');
        if (currentIds !== lastRequirementsRef.current) {
            loggedHydrationRef.current.clear();
            lastRequirementsRef.current = currentIds;
        }
    }, [localRequirements]);

    // Function to refresh requirements from the database
    const refreshRequirements = useCallback(async () => {
        console.log('🎯 STEP 6: refreshRequirements called');
        try {
            // Add a small delay to handle potential database replication lag
            console.log('🎯 STEP 6a: Waiting 100ms for database replication lag');
            await new Promise((resolve) => setTimeout(resolve, 100));
            console.log('✅ STEP 6a: Delay completed, fetching from database');

            console.log('🎯 STEP 6b: Fetching fresh requirements from database', {
                blockId,
                documentId,
            });
            const supabase = getClientOrThrow();
            const { data: requirements, error } = await supabase
                .from('requirements')
                .select('*')
                .eq('block_id', blockId)
                .eq('document_id', documentId)
                .eq('is_deleted', false)
                .order('position', { ascending: true });

            if (error) {
                console.error('❌ STEP 6b: Database fetch failed:', error);
                throw error;
            }
            if (!requirements) {
                console.log('⚠️ STEP 6b: No requirements returned from database');
                return;
            }

            console.log(
                '✅ STEP 6b: Database fetch successful. Count:',
                requirements.length,
            );
            console.log('🎯 STEP 6c: Replacing local state with database data');
            setLocalRequirements(requirements);
            console.log('✅ STEP 6c: Local state replaced with fresh database data');
        } catch (error) {
            console.error('❌ STEP 6: Error refreshing requirements:', error);
        }
    }, [blockId, documentId, getClientOrThrow, setLocalRequirements]);

    // Natural field keys present as top-level DB columns
    const NATURAL_FIELD_KEYS = new Set([
        'name',
        'description',
        'external_id',
        'status',
        'priority',
    ]);

    // valid values for Status / Priority
    const STATUS_VALID_VALUES: readonly string[] = [
        'draft',
        'in_review',
        'approved',
        'rejected',
        'archived',
        'active',
        'deleted',
    ] as const;

    const PRIORITY_VALID_VALUES: readonly string[] = [
        'low',
        'high',
        'medium',
        'critical',
    ] as const;

    type StatusOrPriorityKind = 'status' | 'priority';

    // Validation helper
    const isValidStatusOrPriority = (
        kind: StatusOrPriorityKind,
        raw: unknown,
    ): boolean => {
        const v = typeof raw === 'string' ? raw : raw == null ? '' : String(raw);
        const normalized = v.trim().toLowerCase();
        if (!normalized) return true;

        const allowed = kind === 'status' ? STATUS_VALID_VALUES : PRIORITY_VALID_VALUES;
        return allowed.includes(normalized as unknown as string);
    };

    // Helper function to create properties object from dynamic requirement
    const createPropertiesObjectFromDynamicReq = async (
        dynamicReq: DynamicRequirement,
    ) => {
        if (!properties) return { propertiesObj: {}, naturalFields: {} };

        // Fetch block columns to get position information
        const supabase = getClientOrThrow();
        const { data: blockColumns } = await supabase
            .from('columns')
            .select('*')
            .eq('block_id', blockId)
            .order('position');

        const propertiesObj: Record<string, unknown> = {};
        const naturalFields: Record<string, string> = {};

        // Process each property
        properties.forEach((prop) => {
            const value = dynamicReq[prop.name];
            const propNameLc = (prop.name || '').toLowerCase();
            const column =
                blockColumns?.find((col) => col.property_id === prop.id) ||
                (blockColumns || []).find((c) => {
                    const cNameLc = (
                        (c as unknown as { property?: { name?: string } })?.property?.name
                            ? ((c as unknown as { property?: { name?: string } })
                                  ?.property?.name as string)
                            : ''
                    ).toLowerCase();
                    if (!cNameLc) return false;
                    if (
                        c.id?.startsWith('virtual-') ||
                        c.property_id?.startsWith('virtual-')
                    ) {
                        return (
                            cNameLc === propNameLc ||
                            cNameLc === 'external_id' ||
                            cNameLc === 'name' ||
                            cNameLc === 'description' ||
                            cNameLc === 'status' ||
                            cNameLc === 'priority'
                        );
                    }
                    return cNameLc === propNameLc;
                });
            const lowerCaseName = prop.name.toLowerCase();

            // Check if this property maps to a natural field
            if (NATURAL_FIELD_KEYS.has(lowerCaseName)) {
                // Validate Status/Priority before adding to naturalFields
                const isStatusOrPriority =
                    lowerCaseName === 'status' || lowerCaseName === 'priority';

                if (isStatusOrPriority) {
                    const kind = lowerCaseName as StatusOrPriorityKind;
                    const stringValue = typeof value === 'string' ? value : '';
                    const isValid = isValidStatusOrPriority(kind, stringValue);

                    if (!isValid && stringValue) {
                        // Find the column to get position/column_id
                        const statusPriorityColumn = blockColumns?.find((col) => {
                            const propName = (
                                col as unknown as { property?: { name?: string } }
                            )?.property?.name;
                            return propName && propName.toLowerCase() === lowerCaseName;
                        });

                        propertiesObj[prop.name] = {
                            key: prop.name,
                            type: 'select',
                            value: stringValue,
                            position: statusPriorityColumn?.position ?? 0,
                            column_id: statusPriorityColumn?.id,
                            property_id: prop.id,
                        };

                        console.debug(
                            `[FixAccessor-save-invalid] Removed invalid ${kind} from naturalFields; keeping in properties only`,
                            {
                                kind,
                                value: stringValue,
                                propName: prop.name,
                            },
                        );
                        return;
                    }
                }

                // Valid values add to naturalFields as normal
                naturalFields[lowerCaseName] = typeof value === 'string' ? value : '';
                return;
            }

            if (column) {
                propertiesObj[prop.name] = {
                    key: prop.name,
                    type: prop.property_type,
                    value: value ?? '',
                    options: prop.options,
                    position: column.position,
                    column_id: column.id,
                    property_id: prop.id,
                };
            }
        });

        // handles newly created columns during paste that haven't been synced to the properties array
        const processedKeys = new Set(Object.keys(propertiesObj));
        const dynamicReqKeys = Object.keys(dynamicReq).filter(
            (key) =>
                key !== 'id' &&
                key !== 'ai_analysis' &&
                !NATURAL_FIELD_KEYS.has(key.toLowerCase()),
        );

        console.debug('[fix][dynamic-values] Checking dynamicReq keys:', dynamicReqKeys);
        console.debug(
            '[fix][dynamic-values] Already processed keys:',
            Array.from(processedKeys),
        );

        for (const key of dynamicReqKeys) {
            // Skip if already processed or if it's a natural field
            if (processedKeys.has(key) || NATURAL_FIELD_KEYS.has(key.toLowerCase())) {
                continue;
            }

            const val = dynamicReq[key];
            // Check if it's a valid value that should be saved
            if (
                typeof val === 'string' ||
                typeof val === 'number' ||
                Array.isArray(val) ||
                val === null
            ) {
                // Find the column in blockColumns to get metadata
                const column = blockColumns?.find((col) => {
                    const propName = (col as unknown as { property?: { name?: string } })
                        ?.property?.name;
                    return propName && propName.toLowerCase() === key.toLowerCase();
                });

                if (column) {
                    // Create propertiesObj entry for this dynamic column
                    propertiesObj[key] = {
                        key,
                        type: 'text', // Default to text for dynamic columns
                        value: val ?? '',
                        position: column.position ?? 0,
                        column_id: column.id,
                        property_id: column.property_id,
                    };
                    console.debug(
                        `[fix][dynamic-values] Added new dynamic column ${key} with value:`,
                        val,
                    );
                } else {
                    propertiesObj[key] = {
                        key,
                        type: 'text',
                        value: val ?? '',
                        position: 0,
                    };
                    console.debug(
                        `[fix][dynamic-values] Added dynamic column ${key} (column not in DB yet) with value:`,
                        val,
                    );
                }
            }
        }

        // Handle Status/Priority invalid value overrides stored in properties
        if (
            dynamicReq.properties &&
            typeof dynamicReq.properties === 'object' &&
            !Array.isArray(dynamicReq.properties)
        ) {
            const reqProps = dynamicReq.properties as Record<string, unknown>;
            for (const [key, propEntry] of Object.entries(reqProps)) {
                const keyLc = key.toLowerCase();
                if (keyLc !== 'status' && keyLc !== 'priority') continue;

                if (
                    propEntry &&
                    typeof propEntry === 'object' &&
                    'value' in propEntry &&
                    'type' in propEntry
                ) {
                    const propObj = propEntry as {
                        key?: string;
                        type?: string;
                        value?: unknown;
                        position?: number;
                    };
                    // Find the column to get position/column_id
                    const column = blockColumns?.find((col) => {
                        const propName = (
                            col as unknown as { property?: { name?: string } }
                        )?.property?.name;
                        return propName && propName.toLowerCase() === keyLc;
                    });

                    propertiesObj[key] = {
                        key: propObj.key || key,
                        type: propObj.type || 'select',
                        value: propObj.value ?? '',
                        position: propObj.position ?? column?.position ?? 0,
                        column_id: column?.id,
                        property_id: column?.property_id,
                    };
                    console.debug(
                        `[fix][status-priority-override] Added ${key} override from properties:`,
                        propertiesObj[key],
                    );
                }
            }
        }

        console.debug(
            '[fix][dynamic-values] Final propertiesObj keys:',
            Object.keys(propertiesObj),
        );

        return { propertiesObj, naturalFields };
    };

    // Convert requirements to dynamic requirements for the table
    const getDynamicRequirements = (): DynamicRequirement[] => {
        if (!localRequirements) {
            return [];
        }

        const debugInfo = new Map<
            string,
            {
                dbStatus?: string | null;
                dbPriority?: string | null;
                propsStatus?: unknown;
                propsPriority?: unknown;
                finalStatus?: unknown;
                finalPriority?: unknown;
                hasConflict?: boolean;
            }
        >();

        return localRequirements
            .filter((req) => !deletedRowIdsRef.current.has(req.id)) // Filter out deleted
            .map((req, index) => {
                const dynamicReq: DynamicRequirement = {
                    id: req.id,
                    ai_analysis: req.ai_analysis as RequirementAiAnalysis,
                };

                // Extract values from properties object
                if (req.properties) {
                    Object.entries(req.properties).forEach(([key, prop]) => {
                        const keyLc = key.toLowerCase();
                        if (keyLc === 'status' || keyLc === 'priority') {
                            return;
                        }

                        if (
                            typeof prop === 'object' &&
                            prop !== null &&
                            'value' in prop
                        ) {
                            // Ensure we only assign CellValue compatible values
                            const value = prop.value;
                            if (
                                typeof value === 'string' ||
                                typeof value === 'number' ||
                                value instanceof Date ||
                                Array.isArray(value) ||
                                value === null
                            ) {
                                dynamicReq[key] = value as CellValue;
                            } else {
                                dynamicReq[key] = String(value);
                            }
                        } else if (
                            typeof prop === 'string' ||
                            typeof prop === 'number' ||
                            prop === null ||
                            (Array.isArray(prop) &&
                                prop.every((item) => typeof item === 'string'))
                        ) {
                            dynamicReq[key] = prop as CellValue;
                        } else {
                            // Convert other types to string
                            dynamicReq[key] = String(prop);
                        }
                    });
                }

                if (properties && properties.length > 0) {
                    properties.forEach((prop) => {
                        const keyLc = prop.name.toLowerCase();
                        if (!NATURAL_FIELD_KEYS.has(keyLc)) return;

                        if (keyLc === 'status' || keyLc === 'priority') {
                            // Check both lowercase and capitalized keys in properties
                            const props =
                                req.properties && typeof req.properties === 'object'
                                    ? (req.properties as Record<string, unknown>)
                                    : null;
                            const propsOverride = props
                                ? props[keyLc] ||
                                  props[keyLc === 'status' ? 'Status' : 'Priority']
                                : null;

                            if (
                                propsOverride &&
                                typeof propsOverride === 'object' &&
                                'value' in propsOverride
                            ) {
                                const overrideValue = (
                                    propsOverride as { value: unknown }
                                ).value;
                                if (
                                    typeof overrideValue === 'string' ||
                                    typeof overrideValue === 'number' ||
                                    overrideValue === null
                                ) {
                                    dynamicReq[prop.name] = overrideValue as CellValue;
                                    dynamicReq[keyLc] = overrideValue as CellValue;

                                    return; // Skip DB overlay - properties is source of truth
                                }
                            }
                            // If properties doesn't have a value, fall through to use DB enum below
                        }

                        switch (keyLc) {
                            case 'name':
                                dynamicReq[prop.name] = (req.name ??
                                    '') as unknown as CellValue;
                                break;
                            case 'description':
                                dynamicReq[prop.name] = (req.description ??
                                    '') as unknown as CellValue;
                                break;
                            case 'external_id':
                                dynamicReq[prop.name] = (req.external_id ??
                                    '') as unknown as CellValue;
                                break;
                            case 'status':
                                // Use raw DB enum value to match select option values
                                dynamicReq[prop.name] =
                                    req.status as unknown as string as unknown as CellValue;

                                break;
                            case 'priority':
                                // Use raw DB enum value to match select option values
                                dynamicReq[prop.name] =
                                    req.priority as unknown as string as unknown as CellValue;

                                break;
                        }
                    });
                }

                if (req.properties && typeof req.properties === 'object') {
                    const props = req.properties as Record<string, unknown>;

                    // Find the Status property definition to get the correct display key
                    const statusPropDef = properties?.find(
                        (p) => p.name.toLowerCase() === 'status',
                    );
                    const statusDisplayKey = statusPropDef?.name || 'status';

                    // Find the Priority property definition to get the correct display key
                    const priorityPropDef = properties?.find(
                        (p) => p.name.toLowerCase() === 'priority',
                    );
                    const priorityDisplayKey = priorityPropDef?.name || 'priority';

                    // look for both lowercase and capitalized keys in properties
                    const statusProp =
                        props['status'] || props['Status'] || props['STATUS'];
                    if (
                        statusProp &&
                        typeof statusProp === 'object' &&
                        'value' in statusProp
                    ) {
                        const statusValue = (statusProp as { value: unknown }).value;
                        if (
                            statusValue !== undefined &&
                            statusValue !== null &&
                            statusValue !== ''
                        ) {
                            dynamicReq[statusDisplayKey] = statusValue as CellValue;
                            dynamicReq['status'] = statusValue as CellValue;
                        }
                    }

                    // Check priority - look for both lowercase and capitalized keys in properties
                    const priorityProp =
                        props['priority'] || props['Priority'] || props['PRIORITY'];
                    if (
                        priorityProp &&
                        typeof priorityProp === 'object' &&
                        'value' in priorityProp
                    ) {
                        const priorityValue = (priorityProp as { value: unknown }).value;
                        if (
                            priorityValue !== undefined &&
                            priorityValue !== null &&
                            priorityValue !== ''
                        ) {
                            dynamicReq[priorityDisplayKey] = priorityValue as CellValue;
                            dynamicReq['priority'] = priorityValue as CellValue;
                        }
                    }
                }

                return dynamicReq;
            });
    };

    // Helper function to format enum values for display
    const _formatEnumValueForDisplay = (value: unknown): string => {
        if (!value || typeof value !== 'string') return '';

        if (value.includes('_')) {
            return value
                .split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        return value.charAt(0).toUpperCase() + value.slice(1);
    };

    // Minimal normalizers for status/priority when saving
    const _normalizeStatusForSave = (
        rawStatus: string | null | undefined,
    ): string | null => {
        if (rawStatus == null) return 'draft';
        const trimmed = rawStatus.trim();
        if (trimmed === '') return 'draft';
        return rawStatus;
    };

    const _normalizePriorityForSave = (
        rawPriority: string | null | undefined,
    ): string | null => {
        if (rawPriority == null) return 'low';
        const trimmed = rawPriority.trim();
        if (trimmed === '') return 'low';
        return rawPriority;
    };

    const getLastPosition = async (): Promise<number> => {
        try {
            const supabase = getClientOrThrow();
            const { data: requirements, error } = await supabase
                .from('requirements')
                .select('position')
                .eq('block_id', blockId)
                .eq('document_id', documentId)
                .eq('is_deleted', false)
                .order('position', { ascending: false })
                .limit(1);

            if (error) throw error;
            if (!requirements || requirements.length === 0) return 0;

            return (requirements[0].position || 0) + 1;
        } catch (error) {
            console.error('Error getting last position:', error);
            return 0;
        }
    };

    // Save a requirement
    const saveRequirement = async (
        dynamicReq: DynamicRequirement,
        isNew: boolean,
        userId: string,
        userName: string,
        skipRefresh: boolean = false,
    ) => {
        console.log('🎯 STEP 5: saveRequirement called in useRequirementActions', {
            isNew,
            userId,
            userName,
            dynamicReq,
        });

        if (!documentId) {
            console.error('BLOCKED SAVE - missing documentId', {
                documentId,
                blockId,
                dynamicReqId: dynamicReq.id,
            });
            throw new Error('Cannot save requirement: documentId is not available');
        }

        try {
            const supabase = getClientOrThrow();
            console.log(
                '🎯 STEP 5a: Creating properties object from dynamic requirement',
            );
            // Create properties object and extract natural fields
            const { propertiesObj, naturalFields } =
                await createPropertiesObjectFromDynamicReq(dynamicReq);
            console.log('✅ STEP 5a: Properties object created:', {
                propertiesObj,
                naturalFields,
            });
            console.debug(
                '[saveRequirement][properties keys]',
                Object.keys(propertiesObj || {}),
            );

            // Initialize with an empty history object
            let analysis_history: RequirementAiAnalysis = {
                descriptionHistory: [],
            };

            // Handle possible undefined or null ai_analysis
            if (dynamicReq.ai_analysis) {
                try {
                    // Clone the analysis_history to avoid mutation issues
                    analysis_history = JSON.parse(JSON.stringify(dynamicReq.ai_analysis));

                    // Ensure descriptionHistory is always an array even after cloning
                    if (!analysis_history?.descriptionHistory) {
                        analysis_history = {
                            descriptionHistory: [],
                        };
                    }
                } catch (e) {
                    // If parsing fails, fall back to the default empty history
                    console.error('Error parsing ai_analysis:', e);
                    analysis_history = {
                        descriptionHistory: [],
                    };
                }
            }

            // Safely push the new history item (analysis_history is guaranteed to be non-null at this point)
            analysis_history.descriptionHistory.push({
                description: naturalFields.description || '',
                createdAt: new Date().toISOString(),
                createdBy: userName || 'Unknown',
            });

            // Normalize status/priority for save
            const rawStatus = naturalFields?.status as string | null | undefined;
            const rawPriority = naturalFields?.priority as string | null | undefined;
            const normalizedStatus = _normalizeStatusForSave(rawStatus);
            const normalizedPriority = _normalizePriorityForSave(rawPriority);

            let finalStatus: string | null | undefined = normalizedStatus;
            let finalPriority: string | null | undefined = normalizedPriority;

            if (normalizedStatus) {
                const isValid = isValidStatusOrPriority('status', normalizedStatus);
                if (!isValid) {
                    console.debug(
                        '[FixAccessor-save-invalid] Final guard: Removed invalid status from Supabase payload',
                        {
                            value: normalizedStatus,
                        },
                    );
                    finalStatus = undefined; // Don't send to Supabase
                    if (!propertiesObj.status) {
                        propertiesObj.status = {
                            key: 'status',
                            type: 'select',
                            value: normalizedStatus,
                            position: 0,
                        };
                    }
                }
            }

            if (normalizedPriority) {
                const isValid = isValidStatusOrPriority('priority', normalizedPriority);
                if (!isValid) {
                    console.debug(
                        '[FixAccessor-save-invalid] Final guard: Removed invalid priority from Supabase payload',
                        {
                            value: normalizedPriority,
                        },
                    );
                    finalPriority = undefined; // Don't send to Supabase
                    if (!propertiesObj.priority) {
                        propertiesObj.priority = {
                            key: 'priority',
                            type: 'select',
                            value: normalizedPriority,
                            position: 0,
                        };
                    }
                }
            }

            if (naturalFields?.status) {
                const statusValue = naturalFields.status;
                const isValid = isValidStatusOrPriority('status', statusValue);
                if (!isValid) {
                    console.debug('FinalInvalidFix: PREVENTING invalid natural field', {
                        field: 'status',
                        value: statusValue,
                    });
                    delete naturalFields.status;
                    // Ensure invalid value exists in propertiesObj
                    if (!propertiesObj.status) {
                        propertiesObj.status = {
                            key: 'status',
                            type: 'select',
                            value: statusValue,
                            position: 0,
                        };
                        console.debug(
                            'FinalInvalidFix: MOVING invalid value into properties only',
                            {
                                field: 'status',
                                value: statusValue,
                            },
                        );
                    }
                    finalStatus = undefined;
                }
            }

            if (naturalFields?.priority) {
                const priorityValue = naturalFields.priority;
                const isValid = isValidStatusOrPriority('priority', priorityValue);
                if (!isValid) {
                    console.debug('FinalInvalidFix: PREVENTING invalid natural field', {
                        field: 'priority',
                        value: priorityValue,
                    });
                    // Remove from naturalFields completely
                    delete naturalFields.priority;
                    // Ensure invalid value exists in propertiesObj
                    if (!propertiesObj.priority) {
                        propertiesObj.priority = {
                            key: 'priority',
                            type: 'select',
                            value: priorityValue,
                            position: 0,
                        };
                        console.debug(
                            'FinalInvalidFix: MOVING invalid value into properties only',
                            {
                                field: 'priority',
                                value: priorityValue,
                            },
                        );
                    }
                    finalPriority = undefined;
                }
            }

            try {
                const rawStatus = naturalFields.status ?? naturalFields.Status;
                const rawPriority = naturalFields.priority ?? naturalFields.Priority;

                const isStatusValid = isValidStatusOrPriority('status', rawStatus);
                const isPriorityValid = isValidStatusOrPriority('priority', rawPriority);

                // STATUS invalid → move to properties only
                if (rawStatus && !isStatusValid) {
                    console.debug('FinalInvalidFix: PREVENTING invalid natural status', {
                        rawStatus,
                    });
                    delete naturalFields.status;
                    delete naturalFields.Status;
                    // Ensure finalStatus is undefined so it won't be included in baseData
                    finalStatus = undefined;

                    if (!propertiesObj.status) {
                        propertiesObj.status = {
                            key: 'status',
                            type: 'text',
                            value: rawStatus,
                            position: 0,
                        };
                        console.debug(
                            'FinalInvalidFix: MOVING invalid status into properties',
                            { rawStatus },
                        );
                    }
                }

                // PRIORITY invalid → move to properties only
                if (rawPriority && !isPriorityValid) {
                    console.debug(
                        'FinalInvalidFix: PREVENTING invalid natural priority',
                        { rawPriority },
                    );
                    delete naturalFields.priority;
                    delete naturalFields.Priority;
                    // Ensure finalPriority is undefined so it won't be included in baseData
                    finalPriority = undefined;

                    if (!propertiesObj.priority) {
                        propertiesObj.priority = {
                            key: 'priority',
                            type: 'text',
                            value: rawPriority,
                            position: 0,
                        };
                        console.debug(
                            'FinalInvalidFix: MOVING invalid priority into properties',
                            { rawPriority },
                        );
                    }
                }
            } catch (err) {
                console.error('FinalInvalidFix: ERROR running final guard', err);
            }

            if (!isNew) {
                if (finalStatus === undefined) {
                    console.debug('FinalInvalidFix: FORCING NULL status for updated row');
                    (naturalFields as unknown as Record<string, unknown>).status = null;
                }
                if (finalPriority === undefined) {
                    console.debug(
                        'FinalInvalidFix: FORCING NULL priority for updated row',
                    );
                    (naturalFields as unknown as Record<string, unknown>).priority = null;
                }
            }

            // Normalize and validate name
            const normalizedName = (naturalFields?.name || '').trim();
            const safeName =
                normalizedName.length >= 2 ? normalizedName : 'New Requirement';

            const baseData = {
                ai_analysis: analysis_history,
                block_id: blockId,
                document_id: documentId,
                properties: propertiesObj as unknown as Json,
                updated_by: userId,
                ...(naturalFields?.description && {
                    description: naturalFields.description,
                }),
                ...(naturalFields?.external_id && {
                    external_id: naturalFields.external_id,
                }),
                // Only include status/priority if they are valid
                // For updated rows with invalid values, include null to overwrite stored defaults
                ...(finalStatus !== undefined && {
                    status: finalStatus as unknown as string,
                }),
                ...(finalPriority !== undefined && {
                    priority: finalPriority as unknown as string,
                }),
                ...(!isNew &&
                    naturalFields.status === null && {
                        status: null as unknown as string,
                    }),
                ...(!isNew &&
                    naturalFields.priority === null && {
                        priority: null as unknown as string,
                    }),
            } as Partial<Requirement>;

            // Confirm clean payload
            if (baseData.status || baseData.priority) {
                const statusValid = baseData.status
                    ? isValidStatusOrPriority('status', baseData.status)
                    : true;
                const priorityValid = baseData.priority
                    ? isValidStatusOrPriority('priority', baseData.priority)
                    : true;
                if (!statusValid || !priorityValid) {
                    console.error(
                        'FinalInvalidFix: ERROR - Invalid value detected in baseData!',
                        {
                            status: baseData.status,
                            statusValid,
                            priority: baseData.priority,
                            priorityValid,
                        },
                    );
                } else {
                    console.debug('FinalInvalidFix: CONFIRMED clean payload', {
                        hasStatus: !!baseData.status,
                        hasPriority: !!baseData.priority,
                        statusInProperties: !!propertiesObj.status,
                        priorityInProperties: !!propertiesObj.priority,
                    });
                }
            } else {
                console.debug(
                    'FinalInvalidFix: CONFIRMED clean payload (no status/priority in baseData)',
                    {
                        statusInProperties: !!propertiesObj.status,
                        priorityInProperties: !!propertiesObj.priority,
                    },
                );
            }

            let savedRequirement: Requirement;
            if (isNew) {
                console.log('🎯 STEP 5b: Processing new requirement');
                // Get the last position for new requirements
                console.log('🎯 STEP 5c: Getting last position for new requirement');
                const position = await getLastPosition();
                console.log('✅ STEP 5c: Got position:', position);

                let organizationId: string | null = null;
                try {
                    if (!documentId) {
                        throw new Error(
                            'documentId is required to resolve organizationId',
                        );
                    }
                    const resp = await fetch(`/api/documents/${documentId}`, {
                        method: 'GET',
                        cache: 'no-store',
                    });
                    if (!resp.ok) {
                        throw new Error(
                            `Failed to fetch document: ${resp.status} ${resp.statusText}`,
                        );
                    }
                    const payload = (await resp.json()) as {
                        organizationId?: string | null;
                    };
                    organizationId = payload.organizationId ?? null;
                } catch (error) {
                    console.error('Error resolving organization_id:', error);
                    throw new Error(
                        `Failed to resolve organization_id from document context: ${error instanceof Error ? error.message : String(error)}`,
                    );
                }

                if (!organizationId) {
                    throw new Error(
                        'Failed to resolve organization_id from document context: organizationId is null',
                    );
                }

                // Generate auto requirement ID if not provided
                let externalId = naturalFields?.external_id;
                if (
                    !externalId ||
                    (typeof externalId === 'string' && externalId.trim() === '') ||
                    externalId === 'GENERATING...'
                ) {
                    try {
                        externalId = await generateNextRequirementId(
                            supabase,
                            organizationId,
                        );
                    } catch (error) {
                        console.error('Error generating requirement ID:', error);
                        // Fallback if auto-generation fails
                        const timestamp = Date.now().toString().slice(-6);
                        externalId = `REQ-${timestamp}`;
                    }
                }

                const newRequirementData = {
                    ...baseData,
                    created_by: userId,
                    name: safeName,
                    external_id: externalId,
                    position, // Add the position field
                    organization_id: organizationId, // Add organization_id
                    // Ensure ai_analysis is properly initialized
                    ai_analysis: {
                        descriptionHistory: [
                            {
                                description: naturalFields?.description || '',
                                createdAt: new Date().toISOString(),
                                createdBy: userName || 'Unknown',
                            },
                        ],
                    },
                };

                console.log(
                    '🎯 STEP 5d: Inserting new requirement into database:',
                    newRequirementData,
                );
                const insertPayload =
                    newRequirementData as unknown as TablesInsert<'requirements'>;
                const { data, error } = await supabase
                    .from('requirements')
                    .insert(insertPayload)
                    .select()
                    .single();

                if (error) {
                    console.error('❌ STEP 5d: Database insertion failed:', error);
                    throw error;
                }
                if (!data) {
                    console.error('❌ STEP 5d: No data returned from insert');
                    throw new Error('No data returned from insert');
                }
                savedRequirement = data;
                console.log(
                    '✅ STEP 5d: Database insertion successful:',
                    savedRequirement,
                );

                // Update local state with the new requirement immediately without refetching
                console.log('🎯 STEP 5e: Updating local state with new requirement');
                setLocalRequirements((prev) => {
                    const newState = [...prev, savedRequirement];
                    console.log(
                        '✅ STEP 5e: Local state updated. New count:',
                        newState.length,
                    );
                    return newState;
                });
            } else {
                // For updates, only include fields that have values to avoid nullifying existing data
                const updateData: Partial<Requirement> = {
                    ...baseData,
                    updated_at: new Date().toISOString(),
                };

                // Only update name when provided and meets constraint
                if (naturalFields?.name && naturalFields.name.trim().length >= 2) {
                    updateData.name = naturalFields.name.trim();
                }

                // If position is provided in the dynamic requirement, include it in the update
                if ('position' in dynamicReq) {
                    updateData.position = dynamicReq.position as number;
                }

                const updatePayload =
                    updateData as unknown as TablesUpdate<'requirements'>;
                const { data, error } = await supabase
                    .from('requirements')
                    .update(updatePayload)
                    .eq('id', dynamicReq.id)
                    .select()
                    .single();

                if (error) throw error;
                if (!data) throw new Error('No data returned from update');
                savedRequirement = data;

                // Update local state with the updated requirement immediately without refetching
                setLocalRequirements((prev) =>
                    prev.map((req) =>
                        req.id === savedRequirement.id ? savedRequirement : req,
                    ),
                );
            }

            return savedRequirement;
        } catch (error) {
            // Improved error logging with full details
            const errorDetails: Record<string, unknown> = {
                message: error instanceof Error ? error.message : String(error),
                name: error instanceof Error ? error.name : typeof error,
                stack: error instanceof Error ? error.stack : undefined,
            };

            // If it's a Supabase/Postgres error, include code and details
            if (error && typeof error === 'object' && 'code' in error) {
                errorDetails.code = (error as Record<string, unknown>).code;
                errorDetails.details = (error as Record<string, unknown>).details;
                errorDetails.hint = (error as Record<string, unknown>).hint;
            }

            console.error(
                '[save_debug][post_paste] ❌ STEP 5: Error saving requirement:',
                {
                    ...errorDetails,
                    rawError: error,
                },
            );
            throw error;
        }
    };

    // Delete a requirement
    const deleteRequirement = async (dynamicReq: DynamicRequirement, userId: string) => {
        const supabase = getClientOrThrow();

        // Check for existing relationships (depth > 0) before deletion
        const { data: relationships, error: checkError } = await supabase
            .from('requirements_closure')
            .select('ancestor_id, descendant_id, depth')
            .or(`ancestor_id.eq.${dynamicReq.id},descendant_id.eq.${dynamicReq.id}`)
            .gt('depth', 0)
            .limit(1);

        if (checkError) {
            console.error('Error checking relationships:', checkError);
            throw new Error('Failed to check relationships before deletion');
        }

        if (relationships && relationships.length > 0) {
            throw new Error(
                'Cannot delete requirement with existing relationships. Please disconnect all relationships first on the Traceability page.',
            );
        }

        // Soft delete the requirement
        const { error: reqError } = await supabase
            .from('requirements')
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_by: userId,
            })
            .eq('id', dynamicReq.id);

        if (reqError) {
            throw reqError;
        }

        // Delete the closure table self-reference (depth=0)
        // NOTE: closure table doesn't have is_deleted field, so we hard delete
        const { error: closureError } = await supabase
            .from('requirements_closure')
            .delete()
            .eq('ancestor_id', dynamicReq.id)
            .eq('descendant_id', dynamicReq.id)
            .eq('depth', 0);

        if (closureError) {
            console.error('Error deleting closure table entry:', closureError);
            // Don't throw - requirement is already deleted, just log the error
        }

        // Note: UI state update happens in the caller (handleConfirmDelete)
        // to ensure proper error handling and rollback
    };

    return {
        getDynamicRequirements,
        saveRequirement,
        deleteRequirement,
        createPropertiesObjectFromDynamicReq,
        refreshRequirements, // still available for manual refresh but not called automatically
    };
};
