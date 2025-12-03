'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import '@/styles/globals.css';

import DataEditor, {
    CompactSelection,
    DataEditorRef,
    GridCell,
    GridCellKind,
    GridColumn,
    GridSelection,
    Item,
    NumberCell,
    Rectangle,
    TextCell,
} from '@glideapps/glide-data-grid';
import {
    DatePickerCell,
    DropdownCell,
    DropdownCellType,
    MultiSelectCell,
    allCells,
} from '@glideapps/glide-data-grid-cells';
import { useTheme } from 'next-themes';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import FixedDropdownCell from './glideCells/dropdown-cell';
import FixedMultiSelectCell from './glideCells/multi-select-cell';
import { glideDarkTheme } from './glideDarkTheme';
import { glideLightTheme } from './glideLightTheme';

import '@glideapps/glide-data-grid/dist/index.css';

import debounce from 'lodash/debounce';
import { useParams } from 'next/navigation';
import { useLayer } from 'react-laag';

import { ConflictWarning } from '@/components/custom/BlockCanvas/components/ConflictWarning';
import {
    BlockTableMetadata,
    ColumnMetadata,
    RequirementMetadata,
    RowMetadata,
    useBlockMetadataActions,
} from '@/components/custom/BlockCanvas/hooks/useBlockMetadataActions';
import { useColumnActions } from '@/components/custom/BlockCanvas/hooks/useColumnActions';
import { PropertyType } from '@/components/custom/BlockCanvas/types';
import { dedupeColumnMetadataEntries } from '@/components/custom/BlockCanvas/utils/requirementsNativeColumns';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { useBroadcastCellUpdate } from '@/hooks/useBroadcastCellUpdate';
import { useUser } from '@/lib/providers/user.provider';
import { useDocumentStore } from '@/store/document.store';

import { DeleteConfirmDialog, TableControls, TableLoadingSkeleton } from './components';
import { AddColumnDialog } from './components/AddColumnDialog';
import { RenameColumnDialog } from './components/RenameColumnDialog';
import { useGlideCopy } from './hooks/useGlideCopy';
import { usePeopleOptions } from './hooks/usePeopleOptions';
import {
    BaseRow /*CellValue,*/,
    EditableColumn,
    EditableColumnType,
    GlideTableProps,
    PropertyConfig,
} from './types';

const SYSTEM_COLUMNS = ['external_id', 'name', 'description', 'status', 'priority'];
const ACTIONS_COLUMN_ID = '__system_actions__';
const ACTIONS_COLUMN_ACCESSOR = '__actions__';
const ACTIONS_COLUMN_HEADER = 'Links';

const logTableDebug = (
    message: string,
    context?: Record<string, unknown> | undefined,
) => {
    if (context) {
        console.log(`[GlideEditableTable] ${message}`, context);
    } else {
        console.log(`[GlideEditableTable] ${message}`);
    }
};

const isSystemColumn = (columnHeader: string): boolean => {
    return SYSTEM_COLUMNS.includes(columnHeader.toLowerCase());
};

const getActionLabel = (row: BaseRow): string => {
    const value = row[ACTIONS_COLUMN_ACCESSOR];
    if (typeof value === 'string' && value.trim().length > 0) {
        return value;
    }
    return 'Create Links';
};

const isActionsColumn = <T extends BaseRow>(column: EditableColumn<T>): boolean => {
    if (!column) return false;
    if (column.id === ACTIONS_COLUMN_ID) return true;
    return String(column.accessor) === ACTIONS_COLUMN_ACCESSOR;
};

// valid values for Status / Priority select columns
const STATUS_VALID_VALUES: readonly string[] = [
    'draft',
    'in_review',
    'approved',
    'rejected',
    'archived',
    'active',
    'deleted',
];

const PRIORITY_VALID_VALUES: readonly string[] = ['low', 'high', 'medium', 'critical'];

type StatusOrPriorityKind = 'status' | 'priority';

const normalizeColumnKey = (value: unknown): string => {
    if (typeof value !== 'string') return '';
    return value.trim().toLowerCase();
};

const detectStatusOrPriorityColumn = <T extends BaseRow>(
    column: EditableColumn<T> | undefined,
): StatusOrPriorityKind | null => {
    if (!column) return null;

    const keys: string[] = [];
    keys.push(normalizeColumnKey(column.header));
    keys.push(normalizeColumnKey(String(column.accessor)));

    for (const key of keys) {
        const stripped = key.replace(/_/g, '');
        if (stripped === 'status') return 'status';
        if (stripped === 'priority') return 'priority';
    }
    return null;
};

const isValidStatusOrPriorityStrict = (
    kind: StatusOrPriorityKind,
    raw: unknown,
): boolean => {
    if (raw == null) return false;
    const v = typeof raw === 'string' ? raw : String(raw);
    if (!v) return false;

    const allowed = kind === 'status' ? STATUS_VALID_VALUES : PRIORITY_VALID_VALUES;
    return allowed.includes(v as any);
};

// Legacy function kept for compatibility
const isValidStatusOrPriority = (kind: StatusOrPriorityKind, raw: unknown): boolean => {
    const v = typeof raw === 'string' ? raw : raw == null ? '' : String(raw);
    const normalized = v.trim().toLowerCase();
    if (!normalized) return true;

    const allowed = kind === 'status' ? STATUS_VALID_VALUES : PRIORITY_VALID_VALUES;
    return allowed.includes(normalized);
};

const isExpectedResultColumn = <T extends BaseRow>(
    column: EditableColumn<T>,
): boolean => {
    if (!column) return false;

    const identifiers: string[] = [];

    const pushIdentifier = (value: unknown) => {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed.length > 0) {
                identifiers.push(trimmed.toLowerCase());
            }
        }
    };

    pushIdentifier(column.id);
    pushIdentifier(column.header);
    pushIdentifier(String(column.accessor));
    pushIdentifier(column.propertyId);

    const maybeAnyColumn = column as any;
    pushIdentifier(maybeAnyColumn.name);
    pushIdentifier(maybeAnyColumn.title);
    pushIdentifier(maybeAnyColumn.originalKey);
    pushIdentifier(maybeAnyColumn.propertyKey);
    pushIdentifier(maybeAnyColumn.key);

    for (const id of identifiers) {
        const stripped = id.replace(/_/g, '');
        if (stripped === 'expectedresult') {
            return true;
        }
    }

    return false;
};

export function GlideEditableTable<T extends BaseRow = BaseRow>(
    props: GlideTableProps<T>,
) {
    const { resolvedTheme } = useTheme();

    const {
        data,
        columns,
        onSave,
        onPostSave,
        isEditMode = false,
        showFilter = false,
        filterComponent,
        onAddRow,
        isLoading = false,
        blockId,
        dataAdapter,
        onDelete,
        rowMetadataKey,
        rowDetailPanel,
        tableMetadata,
    } = props;

    const [selection, setSelection] = useState<GridSelection | undefined>(undefined);
    const selectionRef = useRef<GridSelection | undefined>(undefined);

    // Track dynamic columns created during paste that are pending server/metadata sync
    const dynamicColumnsPendingSyncRef = useRef<Set<string>>(new Set());

    // Track post-paste stabilization period to prevent structural sync from removing dynamic columns
    const [isPostPasteStabilizing, setIsPostPasteStabilizing] = useState(false);
    const postPasteStabilizationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Track the last paste operation that created dynamic columns to guard structural sync
    const lastDynamicPasteOperationRef = useRef<string | null>(null);

    type PasteState = {
        isPasting: boolean;
        pasteOperationActive: boolean;
        recentlyPastedRows: Set<string>;
        pasteOperationId: number;
        columnCreationPromises: Map<string, Promise<any>>;
        columnVerificationPromises: Map<string, Promise<boolean>>;
        savePromises: Map<string, Promise<any>>;
        columnsConfirmed: boolean; // Tracks if columns have been confirmed for this table
        columnConfirmationPromise: Promise<boolean> | null;
        columnCreationPromise: Promise<
            Array<{
                success: boolean;
                columnId?: string;
                tempId: string;
                realAccessor?: string;
                error?: any;
            }>
        > | null;
    };

    const pasteStateMapRef = useRef<Map<string, PasteState>>(new Map());

    const getPasteState = useCallback((): PasteState => {
        const tableId = blockId || 'default';
        if (!pasteStateMapRef.current.has(tableId)) {
            pasteStateMapRef.current.set(tableId, {
                isPasting: false,
                pasteOperationActive: false,
                recentlyPastedRows: new Set(),
                pasteOperationId: 0,
                columnCreationPromises: new Map(),
                columnCreationPromise: null,
                columnVerificationPromises: new Map(),
                savePromises: new Map(),
                columnsConfirmed: false,
                columnConfirmationPromise: null,
            });
        }
        return pasteStateMapRef.current.get(tableId)!;
    }, [blockId]);

    useEffect(() => {
        return () => {
            if (blockId) {
                pasteStateMapRef.current.delete(blockId);
            }
            // Cleanup post-paste stabilization timeout
            if (postPasteStabilizationTimeoutRef.current) {
                clearTimeout(postPasteStabilizationTimeoutRef.current);
                postPasteStabilizationTimeoutRef.current = null;
            }
        };
    }, [blockId]);

    const tableRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<DataEditorRef | null>(null);
    const lastEditedCellRef = useRef<Item | undefined>(undefined);
    const isEditingCellRef = useRef<boolean>(false);

    const lastSelectedCellRef = useRef<Item | undefined>(undefined);
    const onCellEditedRef = useRef<((cell: Item, newValue: GridCell) => void) | null>(
        null,
    );

    const prevEditModeRef = useRef<boolean>(isEditMode);
    const isSavingRef = useRef(false);
    const deletedRowIdsRef = useRef<Set<string>>(new Set());
    const deletedColumnIdsRef = useRef<Set<string>>(new Set());

    // Track which invalid Status/Priority cells have already been logged on render
    const invalidRenderLoggedCellsRef = useRef<Set<string>>(new Set());

    const params = useParams();
    const orgId = params?.orgId || '';
    const projectId = params?.projectId || '';
    const documentId = params?.documentId || '';

    if (!orgId) {
        console.error('Org ID is missing from the URL.');
    }

    if (!projectId) {
        console.error('Project ID is missing from the URL.');
    }

    if (!documentId) {
        console.error('Doc ID is missing from the URL.');
    }

    const { profile } = useUser();
    const userId = profile?.id;
    const userName = profile?.full_name || '';

    const { updateBlockMetadata } = useBlockMetadataActions(
        documentId ? String(documentId) : undefined,
    );
    const saveRow = useCallback(
        async (
            item: T,
            isNew: boolean,
            context?: { blockId?: string; skipRefresh?: boolean },
        ) => {
            if (dataAdapter) {
                await dataAdapter.saveRow(item, isNew, { blockId, ...context });
            } else {
                await onSave?.(item, isNew, userId, userName);
            }
        },
        [dataAdapter, blockId, onSave, userId, userName],
    );

    const deleteRow = useCallback(
        async (item: T) => {
            if (dataAdapter?.deleteRow) {
                await dataAdapter.deleteRow(item, blockId ? { blockId } : undefined);
            } else {
                await onDelete?.(item);
            }
        },
        [dataAdapter, blockId, onDelete],
    );

    const refreshAfterSave = useCallback(
        async (skipIfPasting: boolean = false) => {
            // Prevent refresh during paste operations
            if (skipIfPasting) {
                const pasteState = getPasteState();
                if (pasteState.isPasting || pasteState.pasteOperationActive) {
                    console.debug(
                        '[refreshAfterSave] Skipping refresh - paste operation in progress',
                    );
                    return;
                }
            }

            if (dataAdapter?.postSaveRefresh) {
                await dataAdapter.postSaveRefresh();
            } else {
                await onPostSave?.();
            }
        },
        [dataAdapter, onPostSave, getPasteState],
    );

    const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [columnToRename, setColumnToRename] = useState<{
        id: string;
        currentName: string;
    } | null>(null);

    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
    const [isRowDetailOpen, setIsRowDetailOpen] = useState(false);

    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const historyRef = useRef<
        Array<{
            type:
                | 'cell_edit'
                | 'row_add'
                | 'row_delete'
                | 'column_move'
                | 'column_resize'
                | 'row_move';
            timestamp: number;
            data: {
                // for cell edits
                rowId?: string;
                accessor?: keyof T;
                oldValue?: any;
                newValue?: any;
                // for row operations
                rows?: T[];
                rowIndices?: number[];
                // for column operations
                columns?: typeof localColumns;
                oldColumnState?: typeof localColumns;
                newColumnState?: typeof localColumns;
                // for position changes
                from?: number;
                to?: number;
            };
        }>
    >([]);

    const isUndoingRef = useRef(false);

    const addToHistory = useCallback(
        (action: (typeof historyRef.current)[0]) => {
            if (isUndoingRef.current) return;

            if (historyIndex < historyRef.current.length - 1) {
                historyRef.current = historyRef.current.slice(0, historyIndex + 1);
            }

            historyRef.current.push(action);

            if (historyRef.current.length > 100) {
                historyRef.current = historyRef.current.slice(-100);
            }

            setHistoryIndex(historyRef.current.length - 1);

            console.debug(
                '[History] Added action:',
                action.type,
                'New length:',
                historyRef.current.length,
            );
        },
        [historyIndex],
    );

    const [editingData, setEditingData] = useState<Record<string, Partial<T>>>({});
    const [localData, setLocalData] = useState<T[]>(() => [...data]);
    const editingDataRef = useRef(editingData);
    useEffect(() => {
        editingDataRef.current = editingData;
    }, [editingData]);

    const pendingDataAfterSaveRef = useRef<T[] | null>(null);
    const isReorderingRef = useRef(false);

    const applyServerDataSync = useCallback(
        (incomingData: T[], reason: 'live' | 'after-save' = 'live') => {
            const pasteState = getPasteState();
            if (pasteState.isPasting || pasteState.pasteOperationActive) {
                console.debug(
                    `[Data Sync] Skipping (reason=${reason}) - paste in progress for table ${
                        blockId || 'default'
                    }`,
                );
                return;
            }

            setLocalData((prev) => {
                if (incomingData.length === 0) {
                    return prev;
                }

                if (isReorderingRef.current) {
                    console.debug(
                        `[Data Sync] Skipping (reason=${reason}) - local reordering in progress`,
                    );
                    return prev;
                }

                const sameLength = incomingData.length === prev.length;
                const sameIds =
                    sameLength &&
                    incomingData.every((row, index) => {
                        const localRow = prev[index];
                        return localRow && row.id === localRow.id;
                    });

                if (sameIds && sameLength) {
                    const hasDataChanges = incomingData.some((row, index) => {
                        const localRow = prev[index];
                        if (!localRow) return true;
                        return (
                            row.id !== localRow.id ||
                            JSON.stringify(row) !== JSON.stringify(localRow)
                        );
                    });
                    if (!hasDataChanges) {
                        return prev;
                    }
                }

                const needsUpdate = !sameIds || !sameLength;
                const pendingEdits = editingDataRef.current || {};
                const hasPendingEdits = Object.keys(pendingEdits).length > 0;
                const mergedFromServerOrder = incomingData.map((row) => {
                    const sanitizedRow = { ...row };

                    for (const kind of ['status', 'priority'] as const) {
                        const naturalKey = kind;
                        const naturalValue = (sanitizedRow as any)[naturalKey];

                        const propsValue =
                            (sanitizedRow as any).properties?.[kind]?.value ??
                            naturalValue ??
                            null;

                        const isValid = isValidStatusOrPriority(kind, propsValue);

                        if (!isValid && propsValue) {
                            if ((sanitizedRow as any)[naturalKey] !== undefined) {
                                delete (sanitizedRow as any)[naturalKey];
                            }

                            if (!sanitizedRow.properties) {
                                (sanitizedRow as any).properties = {};
                            }
                            const props = sanitizedRow.properties as Record<string, any>;
                            props[kind] = {
                                key: kind,
                                type: 'select',
                                value: propsValue,
                                position: 0,
                            };

                            console.debug('[FixAccessor-block-invalid]', {
                                kind,
                                accessor: naturalKey,
                                value: propsValue,
                            });
                        }
                    }

                    return pendingEdits[sanitizedRow.id]
                        ? ({
                              ...sanitizedRow,
                              ...(pendingEdits[sanitizedRow.id] as Partial<T>),
                          } as T)
                        : sanitizedRow;
                });

                const sameIdSet = (() => {
                    if (incomingData.length !== prev.length) return false;
                    const a = new Set<string>(incomingData.map((r: any) => r.id));
                    for (const r of prev as any[]) if (!a.has(r.id)) return false;
                    return true;
                })();

                if (sameIdSet && (needsUpdate || hasPendingEdits)) {
                    const incomingById = new Map<string, T>(
                        mergedFromServerOrder.map((r: any) => [r.id as string, r]),
                    );
                    const mergedPreservingOrder = (prev as any[]).map((r) => {
                        const incoming = incomingById.get(r.id);
                        return incoming
                            ? ({ ...incoming, position: r.position } as T)
                            : (r as T);
                    });
                    console.debug(
                        '[Data Sync] Applying merged data preserving local order',
                        {
                            incomingCount: incomingData.length,
                            localCount: prev.length,
                            reason,
                        },
                    );
                    return mergedPreservingOrder;
                }

                if (needsUpdate || hasPendingEdits) {
                    console.debug(
                        '[Data Sync] Applying merged data (server + pending edits)',
                        {
                            incomingCount: incomingData.length,
                            localCount: prev.length,
                            reason,
                        },
                    );
                    return mergedFromServerOrder;
                }

                return prev;
            });
        },
        [blockId, getPasteState, setLocalData],
    );

    const pendingSaveRequestedRef = useRef(false);

    const handleSaveAll = useCallback(async () => {
        if (isSavingRef.current) {
            // A save is already in progress – remember that we want to save again
            // once it finishes so that any new edits buffered in editingDataRef
            // are eventually persisted.
            pendingSaveRequestedRef.current = true;
            return;
        }

        const pasteState = getPasteState();
        console.debug('[post_paste_save] handleSaveAll called', {
            isPasting: pasteState.isPasting,
            pasteOperationActive: pasteState.pasteOperationActive,
            isPostPasteStabilizing,
            editingDataSize: Object.keys(editingDataRef.current).length,
        });

        if (pasteState.isPasting || pasteState.pasteOperationActive) {
            console.debug(
                '[post_paste_save] Skipping handleSaveAll - paste operation in progress',
            );
            return;
        }

        isSavingRef.current = true;

        // Snapshot the edits at the moment this save starts.
        const snapshotEdits = { ...editingDataRef.current };

        try {
            const rows = Object.entries(snapshotEdits);

            if (rows.length === 0) {
                return;
            }

            const currentColumns = localColumnsRef.current;

            for (const [rowId, changes] of rows) {
                const originalItem = data.find((d) => d.id === rowId);
                if (!originalItem) {
                    continue;
                }

                const remappedChanges: any = {};
                Object.entries(changes).forEach(([key, value]) => {
                    const column = currentColumns.find(
                        (col) => col.accessor === key || col.header === key,
                    );
                    if (column) {
                        remappedChanges[column.header] = value;
                    } else {
                        remappedChanges[key] = value;
                    }
                });

                const fullItem: T = { ...originalItem, ...remappedChanges };
                await saveRow(fullItem, false);
            }

            await refreshAfterSave();

            // Give the backend a brief moment to settle, then clear ONLY the edits
            // that were part of this save. Any new edits that happened while the
            // save was in flight remain in editingData.
            await new Promise((r) => setTimeout(r, 250));
            setEditingData((prev) => {
                const next = { ...prev };
                for (const rowId of Object.keys(snapshotEdits)) {
                    delete next[rowId];
                }
                return next;
            });
        } catch (error) {
            // Improved error logging
            const errorDetails: any = {
                message: error instanceof Error ? error.message : String(error),
                name: error instanceof Error ? error.name : typeof error,
                stack: error instanceof Error ? error.stack : undefined,
            };

            if (error && typeof error === 'object' && 'code' in error) {
                errorDetails.code = (error as any).code;
                errorDetails.details = (error as any).details;
                errorDetails.hint = (error as any).hint;
            }

            console.error('[post_paste_save][handleSaveAll] Error:', {
                ...errorDetails,
                rawError: error,
                isPostPasteStabilizing,
            });
        } finally {
            isSavingRef.current = false;

            if (pendingDataAfterSaveRef.current) {
                const queued = pendingDataAfterSaveRef.current;
                pendingDataAfterSaveRef.current = null;
                applyServerDataSync(queued, 'after-save');
            }

            if (pendingSaveRequestedRef.current) {
                // Another save was requested while this one was running.
                // Clear the flag and immediately run a new save cycle using
                // the latest editingDataRef snapshot.
                pendingSaveRequestedRef.current = false;
                void handleSaveAll();
            }
        }
    }, [refreshAfterSave, data, saveRow, applyServerDataSync]);

    // Debounce saves - reduced to 500ms for real-time collaboration
    const useDebouncedSave = (delay = 500) => {
        const debounced = useRef(
            debounce(() => {
                void handleSaveAllRef.current?.();
                // Cell edits: do NOT include columns (only save row metadata)
                void saveTableMetadataRef.current?.({ includeColumns: false });
            }, delay),
        );

        useEffect(() => {
            const d = debounced.current;
            return () => d.cancel();
        }, []);

        return debounced.current;
    };

    const debouncedSave = useDebouncedSave();

    const [_tableWidth, setTableWidth] = useState<number>(0);

    useEffect(() => {
        const handleResize = () => {
            if (tableRef.current) {
                setTableWidth(tableRef.current.offsetWidth);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Real-time broadcast for concurrent editing (always enabled to receive updates)
    const { broadcastCellUpdate, broadcastCursorMove } = useBroadcastCellUpdate({
        documentId: String(documentId),
        userId,
        enabled: true, // Always enabled - need to receive updates even in read-only mode
    });

    // Subscribe to pending cell updates from other users for real-time display
    const pendingCellUpdates = useDocumentStore((state) => state.pendingCellUpdates);
    const activeUsers = useDocumentStore((state) => state.activeUsers);

    // Column actions for creating columns
    const { createPropertyAndColumn, createColumnFromProperty, appendPropertyOptions } =
        useColumnActions({
            orgId: String(orgId),
            projectId: String(projectId),
            documentId: String(documentId),
        });

    const {
        supabase,
        isLoading: supabaseLoading,
        error: supabaseError,
        getClientOrThrow,
    } = useAuthenticatedSupabase();

    const waitForSupabaseClient = useCallback(
        async (maxRetries = 10, delayMs = 100): Promise<void> => {
            for (let i = 0; i < maxRetries; i++) {
                try {
                    getClientOrThrow();
                    return; // Client is ready
                } catch (error) {
                    if (i < maxRetries - 1) {
                        await new Promise((resolve) => setTimeout(resolve, delayMs));
                    } else {
                        throw new Error(
                            'Supabase client failed to initialize after retries',
                        );
                    }
                }
            }
        },
        [getClientOrThrow],
    );

    const verifyColumnsExist = useCallback(
        async (
            columnIds: string[],
            maxRetries = 10,
            initialDelayMs = 100,
            maxDelayMs = 500,
        ): Promise<boolean> => {
            if (columnIds.length === 0) return true;

            await waitForSupabaseClient();
            const supabase = getClientOrThrow();
            const tableId = blockId || 'default';

            let delayMs = initialDelayMs;

            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const { data: columns, error } = await supabase
                        .from('columns')
                        .select('id, block_id')
                        .in('id', columnIds)
                        .eq('block_id', tableId);

                    if (error) {
                        console.warn(
                            `[verifyColumnsExist] Query error on attempt ${attempt + 1}/${maxRetries} for table ${tableId}:`,
                            error,
                        );
                        if (attempt < maxRetries - 1) {
                            await new Promise((resolve) => setTimeout(resolve, delayMs));
                            delayMs = Math.min(delayMs * 1.5, maxDelayMs);
                            continue;
                        }
                        return false;
                    }

                    const foundIds = new Set((columns || []).map((col) => col.id));
                    const allFound = columnIds.every((id) => foundIds.has(id));

                    if (allFound) {
                        console.debug(
                            `[verifyColumnsExist] All ${columnIds.length} columns verified in database for table ${tableId} after ${attempt + 1} attempt(s)`,
                        );
                        return true;
                    }

                    const missing = columnIds.filter((id) => !foundIds.has(id));
                    console.debug(
                        `[verifyColumnsExist] Attempt ${attempt + 1}/${maxRetries} for table ${tableId}: Found ${foundIds.size}/${columnIds.length} columns. Missing: ${missing.join(', ')}`,
                    );

                    if (attempt < maxRetries - 1) {
                        await new Promise((resolve) => setTimeout(resolve, delayMs));
                        delayMs = Math.min(delayMs * 1.5, maxDelayMs);
                    } else {
                        console.warn(
                            `[verifyColumnsExist] Failed to verify all columns for table ${tableId} after ${maxRetries} attempts. Missing: ${missing.join(', ')}`,
                        );
                        return false;
                    }
                } catch (error) {
                    console.error(
                        `[verifyColumnsExist] Error on attempt ${attempt + 1}/${maxRetries} for table ${tableId}:`,
                        error,
                    );
                    if (attempt < maxRetries - 1) {
                        await new Promise((resolve) => setTimeout(resolve, delayMs));
                        delayMs = Math.min(delayMs * 1.5, maxDelayMs); // Exponential backoff
                    } else {
                        return false;
                    }
                }
            }

            return false;
        },
        [waitForSupabaseClient, getClientOrThrow, blockId],
    );

    const confirmColumnsForTable = useCallback(
        async (columnIds: string[], operationId: string): Promise<boolean> => {
            const pasteState = getPasteState();
            const tableId = blockId || 'default';

            if (pasteState.columnsConfirmed) {
                console.debug(
                    `[confirmColumnsForTable] Columns already confirmed for table ${tableId}, skipping`,
                );
                return true;
            }

            if (pasteState.columnConfirmationPromise) {
                console.debug(
                    `[confirmColumnsForTable] Column confirmation already in progress for table ${tableId}, waiting...`,
                );
                return await pasteState.columnConfirmationPromise;
            }

            console.debug(
                `[${operationId}] Starting column confirmation barrier for table ${tableId} with ${columnIds.length} columns...`,
            );

            const confirmationPromise = (async (): Promise<boolean> => {
                try {
                    const verified = await verifyColumnsExist(columnIds);

                    if (verified) {
                        pasteState.columnsConfirmed = true;
                        console.debug(
                            `[${operationId}] Column confirmation barrier PASSED for table ${tableId}. All columns verified.`,
                        );
                        return true;
                    } else {
                        console.warn(
                            `[${operationId}] Column confirmation barrier FAILED for table ${tableId}. Some columns not verified.`,
                        );
                        pasteState.columnsConfirmed = true;
                        return false;
                    }
                } catch (error) {
                    console.error(
                        `[${operationId}] Column confirmation barrier ERROR for table ${tableId}:`,
                        error,
                    );
                    pasteState.columnsConfirmed = true;
                    return false;
                } finally {
                    pasteState.columnConfirmationPromise = null;
                }
            })();

            pasteState.columnConfirmationPromise = confirmationPromise;

            return await confirmationPromise;
        },
        [getPasteState, blockId, verifyColumnsExist],
    );

    const { data: peopleNames = [] } = usePeopleOptions(
        String(orgId) || undefined,
        String(projectId) || undefined,
    );

    const normalizedColumns = useMemo(() => {
        return columns.map((col) => ({
            ...col,
            title: col.header, // map header to title
        }));
    }, [columns]);

    const [localColumns, setLocalColumns] = useState(() => {
        const sorted = [...normalizedColumns].sort(
            (a, b) => (a.position ?? 0) - (b.position ?? 0),
        );
        return sorted.map((col, index) => ({
            ...col,
            position: col.position !== undefined ? col.position : index,
        }));
    });

    const prevBlockIdRef = useRef(blockId);
    useEffect(() => {
        if (blockId && blockId !== prevBlockIdRef.current) {
            console.log('[GlideEditableTable] Block ID changed, resetting columns', {
                oldBlockId: prevBlockIdRef.current,
                newBlockId: blockId,
            });

            const sorted = [...normalizedColumns].sort(
                (a, b) => (a.position ?? 0) - (b.position ?? 0),
            );
            setLocalColumns(
                sorted.map((col, index) => ({
                    ...col,
                    position: col.position !== undefined ? col.position : index,
                })) as typeof localColumns,
            );

            prevBlockIdRef.current = blockId;
        }
    }, [blockId, normalizedColumns]);

    const localColumnsRef = useRef(localColumns);
    useEffect(() => {
        localColumnsRef.current = localColumns;
    }, [localColumns]);

    // Apply pending updates to local data for immediate display
    useEffect(() => {
        if (!blockId || pendingCellUpdates.size === 0) return;

        console.log('[GlideEditableTable] Processing pending cell updates:', {
            blockId,
            updatesCount: pendingCellUpdates.size,
            updates: Array.from(pendingCellUpdates.values()),
        });

        setLocalData((prevData) => {
            const updatedData = [...prevData];
            let hasChanges = false;

            pendingCellUpdates.forEach((update) => {
                // Only apply updates for this block
                if (update.blockId !== blockId) {
                    console.log(
                        '[GlideEditableTable] Skipping update for different block:',
                        {
                            updateBlockId: update.blockId,
                            currentBlockId: blockId,
                        },
                    );
                    return;
                }

                const rowIndex = updatedData.findIndex((row) => row.id === update.rowId);
                if (rowIndex === -1) {
                    console.log('[GlideEditableTable] Row not found:', update.rowId);
                    return;
                }

                // Find the column accessor using ref to avoid initialization error
                const column = localColumnsRef.current.find(
                    (col) => col.id === update.columnId,
                );
                if (!column) {
                    console.log(
                        '[GlideEditableTable] Column not found:',
                        update.columnId,
                    );
                    return;
                }

                // Apply the update
                const currentValue = updatedData[rowIndex][column.accessor];
                if (currentValue !== update.value) {
                    console.log('[GlideEditableTable] Applying cell update to UI:', {
                        rowId: update.rowId,
                        column: column.accessor,
                        oldValue: currentValue,
                        newValue: update.value,
                    });
                    updatedData[rowIndex] = {
                        ...updatedData[rowIndex],
                        [column.accessor]: update.value,
                    } as T;
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                console.log('[GlideEditableTable] UI updated with remote changes');
            }

            return hasChanges ? updatedData : prevData;
        });
    }, [pendingCellUpdates, blockId]);

    // Ref to track localData for immediate updates (bypassing React state batching)
    const localDataRef = useRef<T[]>(localData);
    useEffect(() => {
        localDataRef.current = localData;
    }, [localData]);

    const [colSizes, setColSizes] = useState<Partial<Record<keyof T, number>>>({});
    const columnResizeTimerRef = useRef<number | null>(null);
    const pendingColumnMetadataRef = useRef(false);

    const columnDefs: GridColumn[] = useMemo(() => {
        const visibleColumns = localColumns.filter(
            (col) => !isExpectedResultColumn(col as unknown as EditableColumn<BaseRow>),
        );

        return visibleColumns.map((col, idx) => ({
            title: col.title,
            width: colSizes[col.accessor] || col.width || 120,
            hasMenu: true,
            menuIcon: 'dots',
            trailingRowOptions:
                idx === 0
                    ? {
                          hint: 'Add Row',
                          addIcon: 'plus',
                          targetColumn: 0,
                      }
                    : undefined,
        }));
    }, [localColumns, colSizes]);

    const sortedData = useMemo(() => {
        return [...localData]
            .filter((row) => !deletedRowIdsRef.current.has(row.id))
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }, [localData]);

    const sortedDataRef = useRef<T[]>([]);
    useEffect(() => {
        sortedDataRef.current = sortedData;
    }, [sortedData]);

    const selectedRow = useMemo(() => {
        return sortedData.find((r) => r.id === selectedRowId) || null;
    }, [sortedData, selectedRowId]);

    const [gridSelection, setGridSelection] = useState<GridSelection>({
        rows: CompactSelection.empty(),
        columns: CompactSelection.empty(),
    });
    const [rowDeleteConfirmOpen, setRowDeleteConfirmOpen] = useState(false);
    const [rowsToDelete, setRowsToDelete] = useState<T[]>([]);

    const handleGridSelectionChange = useCallback((newSelection: GridSelection) => {
        setGridSelection(newSelection);

        if (newSelection?.current?.cell) {
            lastSelectedCellRef.current = newSelection.current.cell;
            console.debug('[Selection] Updated last selected cell:', {
                col: newSelection.current.cell[0],
                row: newSelection.current.cell[1],
            });
        }
    }, []);

    const [columnMenu, setColumnMenu] = useState<
        | {
              colIndex: number;
              bounds: Rectangle;
          }
        | undefined
    >(undefined);

    // Add Column dialog state
    const [addColumnDialogOpen, setAddColumnDialogOpen] = useState(false);
    const [pendingInsertIndex, setPendingInsertIndex] = useState<number | null>(null);

    // Conflict detection state
    const [conflictingUsers, setConflictingUsers] = useState<
        Array<{ userId: string; userName: string }>
    >([]);
    const [showConflictWarning, setShowConflictWarning] = useState(false);
    const currentEditingCell = useRef<{ rowId: string; columnId: string } | null>(null);

    const { renderLayer, layerProps } = useLayer({
        isOpen: columnMenu !== undefined,
        auto: true,
        placement: 'bottom-end',
        triggerOffset: 2,

        trigger: {
            getBounds: () => ({
                left: columnMenu?.bounds.x ?? 0,
                top: columnMenu?.bounds.y ?? 0,
                width: columnMenu?.bounds.width ?? 0,
                height: columnMenu?.bounds.height ?? 0,
                right: (columnMenu?.bounds.x ?? 0) + (columnMenu?.bounds.width ?? 0),
                bottom: (columnMenu?.bounds.y ?? 0) + (columnMenu?.bounds.height ?? 0),
            }),
        },

        onOutsideClick: () => setColumnMenu(undefined),
    });

    useEffect(() => {
        console.debug('[GlideEditableTable] Sorted Data:', sortedData);
    }, [sortedData]);

    const fetchServerMetadata = useCallback(async () => {
        if (!documentId || !blockId) return null;
        try {
            const response = await fetch(
                `/api/documents/${documentId}/blocks/${blockId}/metadata`,
                {
                    method: 'GET',
                    cache: 'no-store',
                },
            );
            if (!response.ok) {
                console.error('[GlideEditableTable] Failed to fetch block metadata', {
                    status: response.status,
                });
                return null;
            }
            const body = (await response.json()) as {
                metadata?: BlockTableMetadata | null;
            };
            return body.metadata ?? null;
        } catch (error) {
            console.error('[GlideEditableTable] Failed to fetch block metadata', error);
            return null;
        }
    }, [documentId, blockId]);

    const saveTableMetadata = useCallback(
        async (options?: { includeColumns?: boolean; includeRows?: boolean }) => {
            if (!blockId) return;

            const includeColumns = options?.includeColumns ?? false;
            const includeRows = options?.includeRows !== false;

            const latestLocalColumns = localColumnsRef.current;
            const persistableColumns = latestLocalColumns.filter(
                (col) => !col.isSystemColumn,
            );
            const latestSortedData = sortedDataRef.current;

            const columnMetadata = includeColumns
                ? persistableColumns.map((col, idx) => ({
                      columnId: col.id,
                      position: col.position !== undefined ? col.position : idx,
                      name: col.header,
                      ...(col.width !== undefined ? { width: col.width } : {}),
                  }))
                : undefined;

            if (!includeColumns && columnMetadata !== undefined) {
                console.error(
                    '[saveTableMetadata] BUG: columnMetadata should be undefined when includeColumns is false!',
                    {
                        includeColumns,
                        columnMetadata,
                    },
                );
            }

            // Compute effective row heights based on current content + column widths
            const currentColumnWidths = localColumnsRef.current.reduce(
                (acc, col) => {
                    acc[col.accessor as string] =
                        colSizes[col.accessor] || col.width || 120;
                    return acc;
                },
                {} as Record<string, number>,
            );

            const rowMetadataRows = latestSortedData.map((row, idx) => {
                const height = calculateMinRowHeight(row, currentColumnWidths);
                return {
                    rowId: row.id,
                    position: idx,
                    ...(height !== undefined ? { height } : {}),
                };
            });

            const rowMetadataRequirements = latestSortedData.map((row, idx) => {
                const height = calculateMinRowHeight(row, currentColumnWidths);
                return {
                    requirementId: row.id,
                    position: idx,
                    ...(height !== undefined ? { height } : {}),
                };
            });

            // Only check for column changes if we're including columns
            let isColumnMetadataChanged = false;
            if (includeColumns && columnMetadata) {
                // Compare against the last persisted metadata snapshot (falls back to props if empty)
                const persistedColumns = lastPersistedColumnsRef.current ?? [];
                const originalColumnState =
                    persistedColumns.length > 0
                        ? persistedColumns
                              .map((col) => ({
                                  id: col.columnId,
                                  position: col.position ?? 0,
                                  width: col.width ?? undefined,
                                  name: (col as any).name,
                              }))
                              .sort((a, b) => a.position - b.position)
                        : [];

                if (originalColumnState.length === 0) {
                    originalColumnState.push(
                        ...columns
                            .filter(
                                (col) => !(col as EditableColumn<BaseRow>).isSystemColumn,
                            )
                            .map((col) => ({
                                id: col.id,
                                position: col.position ?? 0,
                                width: col.width ?? undefined,
                                name: col.header,
                            }))
                            .sort((a, b) => a.position - b.position),
                    );
                }

                const currentColumnState = columnMetadata
                    .map(({ columnId, position, width, name }) => ({
                        id: columnId,
                        position,
                        width,
                        name,
                    }))
                    .sort((a, b) => a.position - b.position);

                isColumnMetadataChanged =
                    originalColumnState.length !== currentColumnState.length ||
                    originalColumnState.some((col) => {
                        const curr = currentColumnState.find((c) => c.id === col.id);
                        if (!curr) return true;
                        return (
                            col.position !== curr.position ||
                            (col.width ?? null) !== (curr.width ?? null) ||
                            col.name !== curr.name
                        );
                    });
            }

            const hasRowChanges = true;

            if (!includeColumns && (!includeRows || !hasRowChanges)) {
                logTableDebug('saveTableMetadata skipped - no row metadata changes');
                return;
            }

            if (includeColumns && !isColumnMetadataChanged && !hasRowChanges) {
                logTableDebug(
                    'saveTableMetadata skipped - no column/row metadata changes detected',
                );
                return;
            }

            try {
                // Only consult the server for metadata when we are actively changing columns
                // or when we have no local tableMetadata yet. This avoids races where a
                // row-only save reads a stale server snapshot and overwrites a newer
                // column resize with old widths.
                let serverMetadata: BlockTableMetadata | null = null;
                if (includeColumns || !tableMetadata) {
                    serverMetadata = await fetchServerMetadata();
                }

                if (serverMetadata?.columns && includeColumns) {
                    lastPersistedColumnsRef.current = dedupeColumnMetadataEntries(
                        serverMetadata.columns as ColumnMetadata[],
                    );
                }
                if (serverMetadata) {
                    if (rowMetadataKey === 'rows' && Array.isArray(serverMetadata.rows)) {
                        lastPersistedRowsRef.current = serverMetadata.rows;
                    } else if (Array.isArray(serverMetadata.requirements)) {
                        lastPersistedRowsRef.current = serverMetadata.requirements;
                    }
                }

                const baseMetadata: BlockTableMetadata =
                    serverMetadata ??
                    tableMetadata ??
                    ({
                        columns: [],
                        requirements: [],
                        ...(rowMetadataKey === 'rows' ? { rows: [] } : {}),
                        tableKind:
                            rowMetadataKey === 'rows' ? 'genericTable' : 'requirements',
                    } as BlockTableMetadata);

                const tableKindToSave =
                    baseMetadata.tableKind ??
                    (rowMetadataKey === 'rows' ? 'genericTable' : 'requirements');
                const isGeneric = tableKindToSave === 'genericTable';

                // Columns:
                // - When includeColumns is true, trust the freshly computed columnMetadata.
                // - When includeColumns is false, keep whatever we last persisted for columns
                //   (or fall back to the baseMetadata.columns if we have no local snapshot).
                const columnsPayload =
                    includeColumns && columnMetadata
                        ? columnMetadata
                        : lastPersistedColumnsRef.current?.length
                          ? lastPersistedColumnsRef.current
                          : (baseMetadata.columns ?? []);

                const existingRows = baseMetadata.rows ?? [];
                const existingRequirements = baseMetadata.requirements ?? [];

                const rowsPayload =
                    includeRows && rowMetadataKey === 'rows'
                        ? rowMetadataRows
                        : existingRows;
                const requirementsPayload = isGeneric
                    ? existingRequirements
                    : includeRows
                      ? rowMetadataRequirements
                      : existingRequirements;

                logTableDebug('saveTableMetadata preparing payload', {
                    includeColumns,
                    includeRows,
                    isColumnMetadataChanged,
                    hasRowChanges,
                    columnDiff: {
                        before: lastPersistedColumnsRef.current,
                        after: columnsPayload,
                    },
                });

                const metadataToSave: Partial<BlockTableMetadata> = {
                    columns: columnsPayload,
                    requirements: requirementsPayload,
                    rows: rowsPayload,
                    tableKind: tableKindToSave,
                };

                logTableDebug('saveTableMetadata payload ready', {
                    blockId,
                    documentId,
                    includeColumns,
                    includeRows,
                    payload: metadataToSave,
                });

                await updateBlockMetadata(blockId, metadataToSave);

                if (includeColumns && columnMetadata) {
                    lastPersistedColumnsRef.current = columnMetadata;
                }

                if (includeRows) {
                    if (rowMetadataKey === 'rows') {
                        lastPersistedRowsRef.current = rowMetadataRows;
                    } else {
                        lastPersistedRowsRef.current = rowMetadataRequirements;
                    }
                }
            } catch (err) {
                console.error('[GlideEditableTable] Failed to save table metadata:', err);
            }
        },
        [
            blockId,
            columns,
            updateBlockMetadata,
            rowMetadataKey,
            tableMetadata,
            fetchServerMetadata,
        ],
    );

    const handleSaveAllRef = useRef(handleSaveAll);
    useEffect(() => {
        handleSaveAllRef.current = handleSaveAll;
    }, [handleSaveAll]);

    const saveTableMetadataRef = useRef(saveTableMetadata);
    useEffect(() => {
        saveTableMetadataRef.current = saveTableMetadata;
    }, [saveTableMetadata]);

    const metadataSaveFlagsRef = useRef({ columns: false, rows: false });
    const metadataSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastPersistedColumnsRef = useRef<ColumnMetadata[]>(
        Array.isArray(tableMetadata?.columns)
            ? (dedupeColumnMetadataEntries(
                  tableMetadata?.columns as ColumnMetadata[],
              ) as ColumnMetadata[])
            : [],
    );
    const lastPersistedRowsRef = useRef<
        RequirementMetadata[] | RowMetadata[] | undefined
    >(
        rowMetadataKey === 'rows'
            ? (tableMetadata?.rows as RowMetadata[] | undefined)
            : (tableMetadata?.requirements as RequirementMetadata[] | undefined),
    );

    useEffect(() => {
        if (Array.isArray(tableMetadata?.columns)) {
            lastPersistedColumnsRef.current = dedupeColumnMetadataEntries(
                tableMetadata.columns as ColumnMetadata[],
            );
        }

        if (rowMetadataKey === 'rows') {
            if (Array.isArray(tableMetadata?.rows)) {
                lastPersistedRowsRef.current = tableMetadata.rows as RowMetadata[];
            }
        } else if (Array.isArray(tableMetadata?.requirements)) {
            lastPersistedRowsRef.current =
                tableMetadata.requirements as RequirementMetadata[];
        }
    }, [tableMetadata, rowMetadataKey]);

    const flushMetadataSave = useCallback(async () => {
        const { columns, rows } = metadataSaveFlagsRef.current;
        if (!columns && !rows) {
            return;
        }
        logTableDebug('flushMetadataSave triggered', { columns, rows });
        metadataSaveFlagsRef.current = { columns: false, rows: false };
        try {
            await saveTableMetadata({
                includeColumns: columns,
                includeRows: rows,
            });
        } catch (error) {
            console.error('[GlideEditableTable] Failed to flush metadata save:', error);
        }
    }, [saveTableMetadata]);

    const requestMetadataSave = useCallback(
        async (options?: { columns?: boolean; rows?: boolean; immediate?: boolean }) => {
            const includeColumns = Boolean(options?.columns);
            const includeRows =
                options?.rows === undefined ? true : Boolean(options?.rows);

            if (includeColumns) {
                metadataSaveFlagsRef.current.columns = true;
            }
            if (includeRows) {
                metadataSaveFlagsRef.current.rows = true;
            }

            logTableDebug('requestMetadataSave invoked', {
                includeColumns,
                includeRows,
                immediate: options?.immediate ?? false,
                pendingFlags: metadataSaveFlagsRef.current,
            });

            if (options?.immediate) {
                if (metadataSaveTimerRef.current) {
                    clearTimeout(metadataSaveTimerRef.current);
                    metadataSaveTimerRef.current = null;
                    logTableDebug(
                        'Cleared pending metadata save timer for immediate flush',
                    );
                }
                await flushMetadataSave();
                return;
            }

            if (metadataSaveTimerRef.current) {
                logTableDebug('requestMetadataSave debounce already scheduled');
                return;
            }

            metadataSaveTimerRef.current = setTimeout(() => {
                metadataSaveTimerRef.current = null;
                logTableDebug('Debounce: metadata save timer fired');
                void flushMetadataSave();
            }, 200);
        },
        [flushMetadataSave],
    );

    useEffect(() => {
        return () => {
            if (columnResizeTimerRef.current !== null) {
                window.clearTimeout(columnResizeTimerRef.current);
                columnResizeTimerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        return () => {
            if (metadataSaveTimerRef.current) {
                clearTimeout(metadataSaveTimerRef.current);
                metadataSaveTimerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const incomingIds = new Set(data.map((r) => r.id));
        const allDeletedSynced = [...deletedRowIdsRef.current].every(
            (id) => !incomingIds.has(id),
        );

        if (allDeletedSynced) {
            deletedRowIdsRef.current.clear();
        }

        const incomingColumnIds = new Set(columns.map((c) => c.id));
        const allDeletedColumnsSynced = [...deletedColumnIdsRef.current].every(
            (id) => !incomingColumnIds.has(id),
        );

        if (allDeletedColumnsSynced) {
            deletedColumnIdsRef.current.clear();
        }
    }, [columns, data]);

    useEffect(() => {
        // Use a ref to get the current localColumns without including it in dependencies
        const currentLocalColumns = localColumnsRef.current;

        // 2. Strengthen structural sync guard - check stabilization mode first
        if (isPostPasteStabilizing) {
            // 3. Ensure stabilization clears ONLY when props catch up
            const incomingFiltered = columns.filter(
                (col) =>
                    !isExpectedResultColumn(col as unknown as EditableColumn<BaseRow>),
            );
            const currentLocalCount = currentLocalColumns.length;
            const incomingCount = incomingFiltered.length;

            if (incomingCount >= currentLocalCount && isPostPasteStabilizing) {
                // Columns have caught up, clear stabilization
                console.debug(
                    '[post_paste_sync] Clearing stabilization — props caught up',
                    {
                        incomingCount,
                        localCount: currentLocalCount,
                    },
                );
                if (postPasteStabilizationTimeoutRef.current) {
                    clearTimeout(postPasteStabilizationTimeoutRef.current);
                    postPasteStabilizationTimeoutRef.current = null;
                }
                setIsPostPasteStabilizing(false);
                // Continue with normal sync now that props have caught up
            } else {
                // Props haven't caught up yet, skip sync entirely
                console.debug(
                    '[DYNAMIC-COLS] Skipping structural sync during stabilization',
                    {
                        incomingCount,
                        localCount: currentLocalCount,
                    },
                );
                return; // Prevents any sync or removal from happening
            }
        }

        // Additional guard for paste operations
        const pasteState = getPasteState();
        if (pasteState.isPasting || pasteState.pasteOperationActive) {
            console.debug(
                '[DYNAMIC-COLS] Skipping structural sync during paste operation',
                {
                    isPasting: pasteState.isPasting,
                    pasteOperationActive: pasteState.pasteOperationActive,
                },
            );
            return; // Prevents columns from being overwritten
        }

        if (localColumns.length === 0 && columns.length > 0) {
            const filteredIncoming = columns.filter(
                (col) =>
                    !isExpectedResultColumn(col as unknown as EditableColumn<BaseRow>),
            );

            const normalized = filteredIncoming.map((col) => {
                const accessorStr = String(col.accessor);
                if (
                    accessorStr.startsWith('column_') ||
                    accessorStr.startsWith('temp-')
                ) {
                    return col;
                }

                // Check if metadata has a renamed header for this column
                const metadataCol = tableMetadata?.columns?.find(
                    (mc) => mc.columnId === col.id,
                );
                const headerToUse = ((metadataCol as any)?.name || col.header) as string;

                // Ensure Status/Priority accessors are lowercase to match DB fields
                let accessorToUse = col.accessor;
                const sysKind = detectStatusOrPriorityColumn(
                    col as unknown as EditableColumn<BaseRow>,
                );
                if (sysKind === 'status') {
                    accessorToUse = 'status' as keyof T;
                } else if (sysKind === 'priority') {
                    accessorToUse = 'priority' as keyof T;
                }

                if (sysKind) {
                    try {
                        console.log('FixAccessor', {
                            header: headerToUse,
                            accessor: String(accessorToUse),
                        });
                    } catch {
                        // swallow any debug errors
                    }
                }

                console.debug('DEBUG-COL-SCAN', {
                    header: headerToUse,
                    accessor: String(accessorToUse),
                    columnId: col.id,
                    name: (col as any).name,
                    position: col.position,
                });

                return {
                    ...col,
                    header: headerToUse, // Use metadata header if available
                    title: headerToUse,
                    accessor: accessorToUse,
                };
            });
            const sorted = [...normalized].sort(
                (a, b) => (a.position ?? 0) - (b.position ?? 0),
            );
            setLocalColumns(sorted as typeof localColumns);
            return;
        }

        const incomingFiltered = columns.filter(
            (col) => !isExpectedResultColumn(col as unknown as EditableColumn<BaseRow>),
        );
        // Normalize Status/Priority accessors to lowercase for incoming columns
        const incomingNormalized = incomingFiltered.map((col) => {
            const accessorStr = String(col.accessor);
            if (accessorStr.startsWith('column_') || accessorStr.startsWith('temp-')) {
                return col;
            }

            let accessorToUse = col.accessor;
            const sysKind = detectStatusOrPriorityColumn(
                col as unknown as EditableColumn<BaseRow>,
            );
            if (sysKind === 'status') {
                accessorToUse = 'status' as keyof T;
            } else if (sysKind === 'priority') {
                accessorToUse = 'priority' as keyof T;
            }

            return {
                ...col,
                accessor: accessorToUse,
            };
        });

        const localIds = new Set(currentLocalColumns.map((c) => c.id));
        const incomingIds = new Set(incomingNormalized.map((c) => c.id));

        // Clear any dynamic columns that have been confirmed by incoming props
        if (dynamicColumnsPendingSyncRef.current.size > 0) {
            const pending = dynamicColumnsPendingSyncRef.current;
            const toClear: string[] = [];
            pending.forEach((id) => {
                if (incomingIds.has(id)) {
                    toClear.push(id);
                }
            });
            if (toClear.length > 0) {
                toClear.forEach((id) => pending.delete(id));
            }

            // If all dynamic columns are now confirmed, clear the dynamic paste operation tracking
            if (pending.size === 0 && lastDynamicPasteOperationRef.current !== null) {
                console.debug(
                    '[structural_sync_guard] All dynamic columns confirmed, clearing dynamic paste operation tracking',
                );
                lastDynamicPasteOperationRef.current = null;
            }
        }

        const rawHasNewColumns = [...incomingIds].some((id) => !localIds.has(id));
        const removedLocalIdsList = currentLocalColumns
            .filter(
                (localCol) =>
                    !incomingNormalized.some((incoming) => incoming.id === localCol.id),
            )
            .map((col) => col.id);

        const effectiveRemovedLocalIds =
            dynamicColumnsPendingSyncRef.current.size > 0
                ? removedLocalIdsList.filter(
                      (id) => !dynamicColumnsPendingSyncRef.current.has(id),
                  )
                : removedLocalIdsList;

        const hasNewColumns = rawHasNewColumns;

        const pasteStateForRemoval = getPasteState();
        const hasJustCreatedDynamicColumns =
            lastDynamicPasteOperationRef.current !== null;
        const shouldSkipRemovalDueToDynamicPaste =
            hasJustCreatedDynamicColumns &&
            incomingFiltered.length < currentLocalColumns.length &&
            dynamicColumnsPendingSyncRef.current.size > 0;

        const hasRemovedColumns =
            !pasteStateForRemoval.isPasting &&
            !pasteStateForRemoval.pasteOperationActive &&
            !isPostPasteStabilizing &&
            !shouldSkipRemovalDueToDynamicPaste &&
            effectiveRemovedLocalIds.length > 0;

        if (shouldSkipRemovalDueToDynamicPaste) {
            console.debug(
                '[structural_sync_guard] Skipping column removal - dynamic columns just created, waiting for parent props update',
                {
                    localCount: currentLocalColumns.length,
                    incomingCount: incomingFiltered.length,
                    pendingDynamicColumns: dynamicColumnsPendingSyncRef.current.size,
                    lastDynamicPasteOperation: lastDynamicPasteOperationRef.current,
                },
            );
        }

        if (hasNewColumns || hasRemovedColumns) {
            console.log(
                '[GlideEditableTable] Structural change detected, syncing columns',
                {
                    hasNewColumns,
                    hasRemovedColumns,
                    localCount: currentLocalColumns.length,
                    incomingCount: incomingFiltered.length,
                },
            );

            const incomingColumnsMap = new Map(incomingNormalized.map((c) => [c.id, c]));

            // Check for renamed columns
            const renamedColumns: Array<{
                id: string;
                oldHeader: string;
                newHeader: string;
                oldAccessor: any;
                newAccessor: any;
            }> = [];

            localColumns.forEach((localCol) => {
                const incomingCol = incomingColumnsMap.get(localCol.id);
                if (incomingCol) {
                    if (
                        localCol.header !== incomingCol.header ||
                        localCol.accessor !== incomingCol.accessor
                    ) {
                        renamedColumns.push({
                            id: localCol.id,
                            oldHeader: localCol.header,
                            newHeader: incomingCol.header,
                            oldAccessor: localCol.accessor,
                            newAccessor: incomingCol.accessor,
                        });
                    }
                }
            });

            const filteredIncoming = columns.filter(
                (col) =>
                    !isExpectedResultColumn(col as unknown as EditableColumn<BaseRow>),
            );

            const normalized = filteredIncoming.map((col) => {
                const localCol = localColumns.find((lc) => lc.id === col.id);
                const metadataCol = tableMetadata?.columns?.find(
                    (mc) => mc.columnId === col.id,
                );
                const metadataName = (metadataCol as any)?.name;

                if (metadataName && metadataName !== col.header) {
                    return {
                        ...col,
                        header: metadataName,
                        title: metadataName,
                    };
                }

                if (
                    localCol &&
                    localCol.accessor === col.accessor &&
                    localCol.header !== col.header
                ) {
                    return {
                        ...col,
                        header: localCol.header, // Preserve renamed header
                        title: localCol.header,
                    };
                }

                return {
                    ...col,
                    title: col.header,
                };
            });
            const sorted = [...normalized].sort(
                (a, b) => (a.position ?? 0) - (b.position ?? 0),
            );

            // Check if any renamed column will be reset
            renamedColumns.forEach((renamed) => {
                const newCol = sorted.find((c) => c.id === renamed.id);
                if (newCol) {
                    if (newCol.accessor !== renamed.oldAccessor) {
                        console.error(
                            '[column_sync_debug] CRITICAL: Renamed column accessor was changed!',
                            {
                                columnId: renamed.id,
                                expectedAccessor: String(renamed.oldAccessor),
                                actualAccessor: String(newCol.accessor),
                            },
                        );
                    } else if (
                        newCol.header !== renamed.newHeader &&
                        newCol.header === renamed.oldHeader
                    ) {
                        console.warn(
                            '[column_sync_debug] Renamed header was reset to old value:',
                            {
                                columnId: renamed.id,
                                expectedHeader: renamed.newHeader,
                                actualHeader: newCol.header,
                            },
                        );
                    }
                }
            });

            // Prevent resetting columns if dynamic ones were just created during paste or stabilization
            const pasteStateForReset = getPasteState();
            if (
                !pasteStateForReset.isPasting &&
                !pasteStateForReset.pasteOperationActive &&
                !isPostPasteStabilizing
            ) {
                setLocalColumns(sorted as typeof localColumns);
                localColumnsRef.current = sorted as typeof localColumnsRef.current;
            } else {
                console.debug(
                    '[DYNAMIC-COLS] Prevent overwrite of dynamic columns during paste/post-paste stabilization',
                    {
                        isPasting: pasteStateForReset.isPasting,
                        pasteOperationActive: pasteStateForReset.pasteOperationActive,
                        isPostPasteStabilizing,
                    },
                );
            }
        }
    }, [columns.length, tableMetadata, isPostPasteStabilizing, getPasteState]);

    useEffect(() => {
        const pasteState = getPasteState();
        if (pasteState.isPasting || pasteState.pasteOperationActive) {
            console.debug(
                `[Data Sync] Skipping - paste in progress for table ${blockId || 'default'}`,
            );
            return;
        }
        if (isSavingRef.current) {
            console.debug('[Data Sync] Save in progress - queueing server snapshot');
            pendingDataAfterSaveRef.current = data;
            return;
        }

        const syncTimer = setTimeout(() => {
            applyServerDataSync(data, 'live');
        }, 200);

        return () => clearTimeout(syncTimer);
    }, [applyServerDataSync, blockId, data, getPasteState]);

    useEffect(() => {
        const pasteState = getPasteState();
        if (pasteState.isPasting || pasteState.pasteOperationActive) {
            console.debug(
                `[Data Rehydration] Skipping - paste in progress for table ${blockId || 'default'}`,
            );
            return;
        }

        const dynamicColumns = localColumnsRef.current.filter(
            (col: any) => col.isDynamic,
        );

        if (dynamicColumns.length === 0) return;

        const rowsWithCustomProps = data.filter(
            (row: any) =>
                row.custom_properties &&
                typeof row.custom_properties === 'object' &&
                Object.keys(row.custom_properties).length > 0,
        );

        if (rowsWithCustomProps.length === 0) return;

        console.debug(
            '[Data Rehydration] Restoring dynamic column data from custom_properties...',
            {
                dynamicColumns: dynamicColumns.map((c) => ({
                    id: c.id,
                    accessor: String(c.accessor),
                    header: c.header,
                })),
                rowsWithData: rowsWithCustomProps.length,
            },
        );

        setLocalData((prevData) => {
            const customPropsMap = new Map(
                rowsWithCustomProps.map((row) => [
                    row.id,
                    (row as any).custom_properties,
                ]),
            );

            return prevData.map((row) => {
                const customProps = customPropsMap.get(row.id);

                if (!customProps || typeof customProps !== 'object') {
                    return row;
                }

                const rehydratedRow = { ...row };
                let hasChanges = false;

                dynamicColumns.forEach((col) => {
                    const accessor = String(col.accessor);

                    const value =
                        customProps[accessor] ||
                        customProps[col.id] ||
                        customProps[col.header] ||
                        customProps[`dynamic_${accessor}`];

                    if (
                        value !== undefined &&
                        (rehydratedRow as any)[col.accessor] !== value
                    ) {
                        (rehydratedRow as any)[col.accessor] = value;
                        hasChanges = true;
                        console.debug(
                            `[Data Rehydration] Restored ${accessor} = ${value} for row ${row.id}`,
                        );
                    }
                });

                return hasChanges ? rehydratedRow : row;
            });
        });

        console.debug('[Data Rehydration] Completed restoration of dynamic column data');
    }, [data]);
    const handleColumnResize = useCallback(
        (col: GridColumn, newSize: number) => {
            const matchingColumn = localColumns.find((c) => c.title === col.title);
            logTableDebug('handleColumnResize invoked', {
                columnHeader: col.title,
                columnId: matchingColumn?.id,
                previousWidth: matchingColumn?.width ?? null,
                nextWidth: newSize,
            });
            setColSizes((prev) => {
                const updated = { ...prev };
                const target = localColumns.find((c) => c.title === col.title);
                if (target) {
                    updated[target.accessor] = newSize;
                }
                return updated;
            });

            setLocalColumns((prev) => {
                const updated = prev.map((c) =>
                    c.title === col.title ? { ...c, width: newSize } : c,
                );

                debouncedSave();
                pendingColumnMetadataRef.current = true;
                if (columnResizeTimerRef.current !== null) {
                    window.clearTimeout(columnResizeTimerRef.current);
                    logTableDebug('handleColumnResize cleared existing debounce timer');
                }
                columnResizeTimerRef.current = window.setTimeout(() => {
                    columnResizeTimerRef.current = null;
                    logTableDebug('handleColumnResize debounce fired', {
                        pendingColumnMetadata: pendingColumnMetadataRef.current,
                    });
                    if (pendingColumnMetadataRef.current) {
                        pendingColumnMetadataRef.current = false;
                        void requestMetadataSave({
                            columns: true,
                            rows: true,
                            immediate: true,
                        });
                    }
                }, 500);
                return updated;
            });

            setTimeout(() => {
                if (gridRef.current) {
                    gridRef.current.updateCells(
                        sortedData.map((_, rowIndex) => ({ cell: [0, rowIndex] })),
                    );
                    gridRef.current.updateCells([]);
                }
            }, 50);
        },
        [debouncedSave, localColumns, sortedData, requestMetadataSave],
    );

    const handleColumnMoved = useCallback(
        (startIndex: number, endIndex: number) => {
            if (startIndex === endIndex) return;

            const sourceColumns = [...localColumnsRef.current];
            const movingColumn = sourceColumns[startIndex];
            const targetColumn = sourceColumns[endIndex];
            if (!movingColumn) {
                logTableDebug('handleColumnMoved aborted (no column at index)', {
                    startIndex,
                    endIndex,
                    available: sourceColumns.length,
                });
                return;
            }

            // Do not allow moving system-only columns (e.g. Links rail)
            if (movingColumn.isSystemColumn || targetColumn?.isSystemColumn) {
                logTableDebug('handleColumnMoved aborted (system column involved)', {
                    from: startIndex,
                    to: endIndex,
                    movingColumnId: movingColumn.id,
                    targetColumnId: targetColumn?.id,
                });
                return;
            }

            const [removed] = sourceColumns.splice(startIndex, 1);
            sourceColumns.splice(endIndex, 0, removed);

            const reindexed = sourceColumns.map((col, idx) => ({
                ...col,
                position: idx,
            }));

            logTableDebug('handleColumnMoved invoked', {
                from: startIndex,
                to: endIndex,
                movingColumnId: movingColumn.id,
                movingColumnHeader: movingColumn.header,
            });

            logTableDebug('handleColumnMoved reindexed state', {
                order: reindexed.map((col) => ({
                    id: col.id,
                    header: col.header,
                    position: col.position,
                })),
            });

            if (!isUndoingRef.current) {
                addToHistory({
                    type: 'column_move',
                    timestamp: Date.now(),
                    data: {
                        oldColumnState: localColumnsRef.current,
                        newColumnState: reindexed,
                        from: startIndex,
                        to: endIndex,
                    },
                });
            }

            localColumnsRef.current = reindexed as typeof localColumnsRef.current;
            setLocalColumns(reindexed);

            debouncedSave();
            // Explicitly save column metadata (position) and row heights when column is reordered
            void requestMetadataSave({
                columns: true,
                rows: true,
                immediate: true,
            });
        },
        [debouncedSave, addToHistory, requestMetadataSave],
    );

    const getCellContent = useCallback(
        (cell: Item): GridCell => {
            const [col, row] = cell;

            const column = localColumns[col];
            if (!column) {
                console.warn(`[getCellContent] Column at index ${col} not found`);
                return {
                    kind: GridCellKind.Text,
                    allowOverlay: false,
                    data: '',
                    displayData: '',
                } as TextCell;
            }

            const rowData = sortedData[row];
            if (!rowData) {
                return {
                    kind: GridCellKind.Text,
                    allowOverlay: false,
                    data: '',
                    displayData: '',
                } as TextCell;
            }

            // Special handling for Links column (system column)
            if (isActionsColumn(column as EditableColumn<BaseRow>)) {
                const isDark = resolvedTheme === 'dark';
                const actionLabel = getActionLabel(rowData as BaseRow);
                const icon = '🔗';
                return {
                    kind: GridCellKind.Text,
                    allowOverlay: false,
                    readonly: true,
                    data: icon,
                    displayData: icon,
                    contentAlign: 'center',
                    hoverEffect: true,
                    themeOverride: {
                        textDark: isDark ? '#c084fc' : '#7e22ce',
                        textMedium: isDark ? '#e9d5ff' : '#7e22ce',
                        bgCell: isDark ? '#3b0764' : '#f3e8ff',
                        bgCellMedium: isDark ? '#4c1d95' : '#f3e8ff',
                        accentColor: '#d8b4fe',
                    },
                    cursor: 'pointer',
                    copyData: actionLabel,
                } as TextCell;
            }

            const value = rowData?.[column.accessor];
            const columnOptions = Array.isArray(column.options) ? column.options : [];

            switch (column.type) {
                case 'people': {
                    const stringValue = Array.isArray(value)
                        ? value.join(', ')
                        : String(value ?? '');
                    const options = peopleNames.length > 0 ? peopleNames : columnOptions;
                    return {
                        kind: GridCellKind.Custom,
                        allowOverlay: isEditMode,
                        copyData: stringValue,
                        data: {
                            kind: 'people-cell',
                            value: stringValue,
                            allowedValues: options,
                        },
                    } as GridCell;
                }
                case 'multi_select': {
                    const values = Array.isArray(value)
                        ? (value as string[])
                        : value
                          ? [String(value)]
                          : [];
                    const options = columnOptions;

                    return {
                        kind: GridCellKind.Custom,
                        allowOverlay: isEditMode,
                        copyData: values.join(', '),
                        data: {
                            kind: 'multi-select-cell',
                            values,
                            options,
                            allowCreation: false,
                            allowDuplicates: false,
                        },
                    } as GridCell;
                }
                case 'select': {
                    const kind = detectStatusOrPriorityColumn(
                        column as EditableColumn<T>,
                    );
                    let stringValue = typeof value === 'string' ? value : '';
                    const options = columnOptions;

                    // For Status/Priority: check if DB value is valid, if not check properties
                    if (kind != null) {
                        const dbValueValid = isValidStatusOrPriority(kind, stringValue);
                        if (!dbValueValid) {
                            // Check properties for invalid value override
                            const props =
                                (rowData as any).properties &&
                                typeof (rowData as any).properties === 'object'
                                    ? ((rowData as any).properties as Record<
                                          string,
                                          unknown
                                      >)
                                    : null;
                            if (props && props[kind]) {
                                const propEntry = props[kind] as
                                    | { value?: unknown }
                                    | null
                                    | undefined;
                                if (
                                    propEntry &&
                                    typeof propEntry === 'object' &&
                                    'value' in propEntry
                                ) {
                                    const propValue = propEntry.value;
                                    if (typeof propValue === 'string' && propValue) {
                                        stringValue = propValue;
                                    }
                                }
                            }
                        }
                    }

                    const isInvalid =
                        kind != null && !isValidStatusOrPriority(kind, stringValue);

                    if (isInvalid) {
                        const key = `${kind}:${String(column.accessor)}:${rowData.id}:${
                            stringValue ?? ''
                        }`;
                        if (!invalidRenderLoggedCellsRef.current.has(key)) {
                            invalidRenderLoggedCellsRef.current.add(key);
                            try {
                                console.log(
                                    'InvalidInputs: render invalid Status/Priority cell',
                                    {
                                        kind,
                                        header: column.header,
                                        accessor: String(column.accessor),
                                        rowId: rowData.id,
                                        value: stringValue,
                                    },
                                );
                            } catch {
                                // swallow any debug errors
                            }
                        }
                    }

                    return {
                        kind: GridCellKind.Custom,
                        allowOverlay: isEditMode,
                        copyData: stringValue,
                        data: {
                            kind: 'dropdown-cell',
                            value: stringValue,
                            allowedValues: options,
                            // flags only used by dropdown renderer for visual indicator
                            isStatusPriorityInvalid: isInvalid || undefined,
                            rawValue: stringValue,
                        },
                    } as GridCell;
                }
                case 'number': {
                    const num =
                        typeof value === 'number'
                            ? value
                            : value != null && value !== ''
                              ? Number(value)
                              : null;
                    const safe = Number.isFinite(num as number) ? (num as number) : null;
                    return {
                        kind: GridCellKind.Number,
                        allowOverlay: isEditMode,
                        data: safe,
                        displayData: safe != null ? String(safe) : '',
                    } as NumberCell;
                }
                case 'date': {
                    let dateVal: Date | null = null;
                    if (value instanceof Date) {
                        dateVal = Number.isNaN(value.getTime()) ? null : value;
                    } else if (typeof value === 'string' && value) {
                        const parsed = new Date(value);
                        if (Number.isNaN(parsed.getTime())) {
                            const key = `${col}:${row}`;
                            setTimeout(() => {
                                try {
                                    const newValue = {
                                        kind: GridCellKind.Custom,
                                        allowOverlay: false,
                                        copyData: '',
                                        data: {
                                            kind: 'date-picker-cell',
                                            date: null,
                                            displayDate: '',
                                            format: 'date',
                                        },
                                    } as GridCell;
                                    onCellEditedRef.current?.([col, row], newValue);
                                } catch {}
                            }, 0);
                            dateVal = null;
                            console.warn(
                                '[GlideEditableTable] Invalid date detected in cell. Cleared to prevent rendering errors.',
                            );
                        } else {
                            dateVal = parsed;
                        }
                    }
                    const displayDate = dateVal ? dateVal.toISOString().slice(0, 10) : '';
                    return {
                        kind: GridCellKind.Custom,
                        allowOverlay: isEditMode,
                        copyData: displayDate,
                        data: {
                            kind: 'date-picker-cell',
                            date: dateVal,
                            displayDate,
                            format: 'date',
                        },
                    } as GridCell;
                }
                case 'text':
                default:
                    const textValue = value?.toString() ?? '';
                    return {
                        kind: GridCellKind.Text,
                        allowOverlay: isEditMode,
                        data: textValue,
                        displayData: textValue,
                        allowWrapping: true,
                        copyData: textValue.replace(/\n/g, ' '),
                    } as TextCell;
            }
        },
        [sortedData, localColumns, isEditMode, peopleNames],
    );

    const { getCellsForSelection } = useGlideCopy(getCellContent);

    const onCellEdited = useCallback(
        async (cell: Item, newValue: GridCell) => {
            // Ignore edits during paste for this table instance
            const pasteState = getPasteState();
            if (pasteState.isPasting) {
                return;
            }

            const [colIndex, rowIndex] = cell;

            const column = localColumns[colIndex];
            if (!column) {
                console.warn('[onCellEdited] Column not found at index:', colIndex);
                return;
            }

            const rowData = sortedData[rowIndex];
            if (!rowData) {
                console.warn('[onCellEdited] Row not found at index:', rowIndex);
                return;
            }

            if (!rowData || !column) {
                console.warn('[onCellEdited] Invalid row/column', { rowIndex, colIndex });
                return;
            }

            const accessor = column.accessor;
            const rowId = rowData.id;

            // Handle Text cells
            if (newValue.kind === GridCellKind.Text) {
                const newValueStr = newValue.data;
                const originalValue = rowData?.[accessor];
                if ((originalValue ?? '').toString() === (newValueStr ?? '')) return;

                // Broadcast cell update immediately for real-time collaboration
                if (blockId && column.id) {
                    void broadcastCellUpdate({
                        blockId,
                        rowId,
                        columnId: column.id,
                        value: newValueStr,
                    });
                }

                // record history before making change (if not undoing)
                if (!isUndoingRef.current) {
                    addToHistory({
                        type: 'cell_edit',
                        timestamp: Date.now(),
                        data: {
                            rowId,
                            accessor,
                            oldValue: originalValue,
                            newValue: newValueStr,
                        },
                    });
                }

                // Optimistically update local data
                setLocalData((prev) =>
                    prev.map((r) =>
                        r.id === rowId ? ({ ...r, [accessor]: newValueStr } as T) : r,
                    ),
                );

                // Update the editing buffer
                setEditingData((prev) => ({
                    ...prev,
                    [rowId]: { ...(prev[rowId] ?? {}), [accessor]: newValueStr },
                }));
            }
            // Handle built-in Number cells
            else if (newValue.kind === GridCellKind.Number) {
                const numVal = (newValue as any).data as number | null;

                // Broadcast cell update immediately for real-time collaboration
                if (blockId && column.id) {
                    void broadcastCellUpdate({
                        blockId,
                        rowId,
                        columnId: column.id,
                        value: numVal,
                    });
                }

                setLocalData((prev) =>
                    prev.map((r) =>
                        r.id === rowId ? ({ ...r, [accessor]: numVal } as T) : r,
                    ),
                );
                setEditingData((prev) => ({
                    ...prev,
                    [rowId]: { ...(prev[rowId] ?? {}), [accessor]: numVal },
                }));
            }
            // Handle Custom editors (dropdown-cell, multi-select-cell, date-picker-cell)
            else if (newValue.kind === GridCellKind.Custom) {
                const data = (newValue as any).data;
                const kind = data?.kind as string | undefined;
                if (kind === 'dropdown-cell' || kind === 'dropdown-cell-fixed') {
                    const displayValue = (data?.value ?? '').toString();

                    // For Status/Priority: route to real column or properties based on validity
                    const sysKind = detectStatusOrPriorityColumn(
                        column as EditableColumn<T>,
                    );
                    const realAccessor =
                        sysKind != null
                            ? String(accessor).toLowerCase()
                            : String(accessor);

                    if (sysKind != null) {
                        // Use strict exact-match validation for dropdown selections
                        const allowed =
                            sysKind === 'status'
                                ? STATUS_VALID_VALUES
                                : PRIORITY_VALID_VALUES;
                        const isExactMatch =
                            displayValue && allowed.includes(displayValue as any);
                        const previousRaw = rowData?.[realAccessor as keyof T];
                        const wasValid =
                            previousRaw && allowed.includes(previousRaw as any);

                        // Log when invalid value becomes valid or when dropdown selection happens
                        if (isExactMatch) {
                            if (!wasValid) {
                                console.log(
                                    `[Dropdown] Corrected invalid ${sysKind} to valid: "${displayValue}"`,
                                );
                            } else {
                                console.log(
                                    `[Dropdown] Selected valid ${sysKind}: "${displayValue}"`,
                                );
                            }
                        } else if (displayValue) {
                            console.log(
                                `[Dropdown] Invalid ${sysKind} value entered: "${displayValue}"`,
                            );
                        }

                        // Compute updated row first
                        const currentRow = sortedData.find((r) => r.id === rowId);
                        if (!currentRow) return;

                        const updated = { ...currentRow } as T;
                        if (isExactMatch && displayValue) {
                            // Valid exact match: convert to lowercase before saving
                            const lowercasedValue = String(displayValue)
                                .trim()
                                .toLowerCase();
                            // Valid value: write to real column AND to properties (JSONB is source of truth)
                            (updated as any)[realAccessor] = lowercasedValue;

                            // Also save to properties so JSONB is always the source of truth
                            if (
                                !(updated as any).properties ||
                                typeof (updated as any).properties !== 'object'
                            ) {
                                (updated as any).properties = {};
                            }
                            const props = (updated as any).properties as Record<
                                string,
                                unknown
                            >;
                            props[sysKind] = {
                                key: sysKind,
                                type: 'select',
                                value: lowercasedValue,
                                position: column.position ?? 0,
                            };
                        } else if (displayValue) {
                            // Invalid value: store in properties, don't touch real column
                            if (
                                !(updated as any).properties ||
                                typeof (updated as any).properties !== 'object'
                            ) {
                                (updated as any).properties = {};
                            }
                            const props = (updated as any).properties as Record<
                                string,
                                unknown
                            >;
                            props[sysKind] = {
                                key: sysKind,
                                type: 'select',
                                value: displayValue,
                                position: column.position ?? 0,
                            };
                        }

                        // Update local data with the computed updated row
                        setLocalData((prev) =>
                            prev.map((r) => (r.id === rowId ? updated : r)),
                        );

                        // Update editing buffer with the value (for display purposes)
                        // Use lowercased value if valid, raw value if invalid
                        const valueForEditing =
                            isExactMatch && displayValue
                                ? String(displayValue).trim().toLowerCase()
                                : displayValue;
                        setEditingData((prev) => ({
                            ...prev,
                            [rowId]: {
                                ...(prev[rowId] ?? {}),
                                [realAccessor]: valueForEditing,
                            },
                        }));

                        // Trigger save for Status/Priority dropdown changes
                        if (onSave) {
                            const isNew =
                                !updated.id || updated.id.toString().startsWith('temp-');
                            void saveRow(updated, isNew, { blockId });
                        }
                    } else {
                        // Non Status/Priority: normal behavior
                        setLocalData((prev) =>
                            prev.map((r) =>
                                r.id === rowId
                                    ? ({ ...r, [accessor]: displayValue } as T)
                                    : r,
                            ),
                        );
                        setEditingData((prev) => ({
                            ...prev,
                            [rowId]: { ...(prev[rowId] ?? {}), [accessor]: displayValue },
                        }));
                    }

                    // Broadcast cell update immediately for real-time collaboration
                    if (blockId && column.id) {
                        void broadcastCellUpdate({
                            blockId,
                            rowId,
                            columnId: column.id,
                            value: displayValue,
                        });
                    }
                } else if (kind === 'multi-select-cell') {
                    const values: string[] = Array.isArray(data?.values)
                        ? (data.values as string[])
                        : [];

                    // Broadcast cell update immediately for real-time collaboration
                    if (blockId && column.id) {
                        void broadcastCellUpdate({
                            blockId,
                            rowId,
                            columnId: column.id,
                            value: values,
                        });
                    }

                    setLocalData((prev) =>
                        prev.map((r) =>
                            r.id === rowId ? ({ ...r, [accessor]: values } as T) : r,
                        ),
                    );
                    setEditingData((prev) => ({
                        ...prev,
                        [rowId]: { ...(prev[rowId] ?? {}), [accessor]: values },
                    }));
                    // If column carries a propertyId and allowCreation, persist new options
                    const colDef = localColumns[colIndex] as any;
                    const propertyId: string | undefined = colDef?.propertyId;
                    const allowCreation: boolean = Boolean(data?.allowCreation);
                    if (propertyId && allowCreation) {
                        try {
                            const unique = Array.from(new Set(values));
                            // optimistic local update of options list
                            setLocalColumns((prev) =>
                                prev.map((c) =>
                                    c.accessor === colDef.accessor
                                        ? ({
                                              ...c,
                                              options: Array.from(
                                                  new Set([
                                                      ...(c.options || []),
                                                      ...unique,
                                                  ]),
                                              ),
                                          } as any)
                                        : c,
                                ),
                            );
                            // Persist to DB property options
                            await appendPropertyOptions(propertyId, unique);
                        } catch {}
                    }
                } else if (kind === 'date-picker-cell') {
                    const dateVal: Date | null = data?.date ?? null;
                    const iso =
                        dateVal && !Number.isNaN(dateVal.getTime())
                            ? dateVal.toISOString()
                            : '';
                    console.debug('[onCellEdited] Date picker update', {
                        rowIndex,
                        rowId,
                        accessor: String(accessor),
                        iso,
                    });

                    // Broadcast cell update immediately for real-time collaboration
                    if (blockId && column.id) {
                        void broadcastCellUpdate({
                            blockId,
                            rowId,
                            columnId: column.id,
                            value: iso,
                        });
                    }

                    setLocalData((prev) =>
                        prev.map((r) =>
                            r.id === rowId ? ({ ...r, [accessor]: iso } as T) : r,
                        ),
                    );
                    setEditingData((prev) => ({
                        ...prev,
                        [rowId]: { ...(prev[rowId] ?? {}), [accessor]: iso },
                    }));
                }
            }

            // Debounce save if set, else leave in buffer
            debouncedSave();
            lastEditedCellRef.current = cell;

            // Re-highlight and focus last edited cell to preserve keyboard navigation
            const zeroRect: Rectangle = { x: cell[0], y: cell[1], width: 1, height: 1 };
            const selectionObj: GridSelection = {
                rows: CompactSelection.empty(),
                columns: CompactSelection.empty(),
                current: { cell, range: zeroRect, rangeStack: [zeroRect] },
            };
            setGridSelection(selectionObj);
            setSelection(selectionObj);
            selectionRef.current = selectionObj;
            // Editing finished; re-enable blur-based deselection and refocus grid
            (isEditingCellRef as React.RefObject<boolean>).current = false;
            try {
                document.body.style.overflow = '';
            } catch {}
            gridRef.current?.focus();
        },
        [localColumns, debouncedSave, addToHistory, sortedData, appendPropertyOptions],
    );

    useEffect(() => {
        onCellEditedRef.current = (cell: Item, newValue: GridCell) => {
            void onCellEdited(cell, newValue);
        };
    }, [onCellEdited]);

    // Add new row. Queue if a save is in progress; otherwise proceed and flush edits.
    const handleRowAppended = useCallback(async () => {
        try {
            // If a save is actively in progress, queue the row add until it finishes
            if (isSavingRef.current) {
                // Defer row append slightly to allow the current save to settle
                setTimeout(() => {
                    handleRowAppended();
                }, 150);
                return;
            }

            // Flush any pending edits so they are persisted before we add a new row
            // Do not await metadata save to avoid blocking UI
            // Row add: snapshot metadata after pending edits flush
            void requestMetadataSave({ rows: true, columns: false, immediate: true });
            // Persist buffered cell edits synchronously
            await handleSaveAllRef.current?.();

            // Create the new row at the end (position = max + 1)
            const maxPosition = Math.max(0, ...localData.map((d) => d.position ?? 0));
            const newRow = {
                ...columns.reduce(
                    (acc, col) => {
                        if (col.accessor !== 'id') acc[col.accessor as string] = '';
                        return acc;
                    },
                    {} as Record<string, unknown>,
                ),
                id: crypto.randomUUID(),
                position: maxPosition + 1,
            } as T;

            // record in history (if not undoing)
            if (!isUndoingRef.current) {
                addToHistory({
                    type: 'row_add',
                    timestamp: Date.now(),
                    data: {
                        rows: [newRow],
                    },
                });
            }

            // Persist the new row; avoid immediate full refresh to reduce flicker
            await saveRow(newRow, true);
            // Opportunistically update metadata (row add: do NOT include columns)
            void requestMetadataSave({ rows: true, columns: false, immediate: true });
        } catch (e) {
            console.error('[GlideEditableTable] Failed to append row:', e);
        }
    }, [
        columns,
        localData,
        saveRow,
        refreshAfterSave,
        addToHistory,
        requestMetadataSave,
    ]);

    const handleRowMoved = useCallback(
        (from: number, to: number) => {
            if (from === to) return;

            // record in history (if not undoing)
            if (!isUndoingRef.current) {
                addToHistory({
                    type: 'row_move',
                    timestamp: Date.now(),
                    data: {
                        from,
                        to,
                    },
                });
            }

            // mark reordering window to avoid remote overwrite
            isReorderingRef.current = true;

            setLocalData((prev) => {
                const updated = [...prev];
                const [moved] = updated.splice(from, 1);
                updated.splice(to, 0, moved);

                const reindexed = updated.map((row, index) => ({
                    ...row,
                    position: index,
                }));

                debouncedSave(); // Call debounced save with newly updated columns.

                return reindexed;
            });
            // Row reorder: do NOT include columns (only save row position metadata)
            void requestMetadataSave({ rows: true, columns: false, immediate: true });
            // allow some time for metadata save/realtime to propagate, then re-enable sync
            setTimeout(() => {
                isReorderingRef.current = false;
            }, 1000);
        },
        [debouncedSave, addToHistory, requestMetadataSave],
    );

    // sort rows by a column and persist order to metadata
    const handleSortByColumn = useCallback(
        (colIndex: number, direction: 'asc' | 'desc') => {
            const column = localColumnsRef.current?.[colIndex];
            if (!column) return;

            const accessor = column.accessor as keyof T;
            const type = (column as any)?.type as string | undefined;

            const getComparable = (row: T): number | string => {
                const raw: any = row?.[accessor];
                switch (type) {
                    case 'number': {
                        const n =
                            typeof raw === 'number'
                                ? raw
                                : raw == null || raw === ''
                                  ? Number.NaN
                                  : Number(raw);
                        return Number.isFinite(n) ? n : Number.NaN;
                    }
                    case 'date': {
                        if (raw instanceof Date) return raw.getTime();
                        if (typeof raw === 'string' && raw) {
                            const t = Date.parse(raw);
                            return Number.isNaN(t) ? 0 : t;
                        }
                        return 0;
                    }
                    case 'multi_select': {
                        if (Array.isArray(raw)) return raw.join(',').toLowerCase();
                        if (typeof raw === 'string') return raw.toLowerCase();
                        return '';
                    }
                    case 'select':
                    default: {
                        return (raw ?? '').toString().toLowerCase();
                    }
                }
            };

            // work from the currently displayed order
            const current = [...sortedDataRef.current];

            const sortedRows = current
                .slice()
                .sort((a, b) => {
                    const av = getComparable(a);
                    const bv = getComparable(b);

                    // handle NaN and empty values consistently
                    const aIsEmpty =
                        av === '' ||
                        av === null ||
                        av === undefined ||
                        (typeof av === 'number' && Number.isNaN(av));
                    const bIsEmpty =
                        bv === '' ||
                        bv === null ||
                        bv === undefined ||
                        (typeof bv === 'number' && Number.isNaN(bv));
                    if (aIsEmpty && bIsEmpty) return 0;
                    if (aIsEmpty) return direction === 'asc' ? 1 : -1;
                    if (bIsEmpty) return direction === 'asc' ? -1 : 1;

                    if (typeof av === 'number' && typeof bv === 'number') {
                        return direction === 'asc' ? av - bv : bv - av;
                    }

                    const aStr = String(av);
                    const bStr = String(bv);
                    return direction === 'asc'
                        ? aStr.localeCompare(bStr)
                        : bStr.localeCompare(aStr);
                })
                .map((row, index) => ({ ...row, position: index })) as T[];

            // update local state with new positions and persist metadata
            sortedDataRef.current = sortedRows;
            setLocalData(sortedRows);
            try {
                // Row sort: do NOT include columns (only save row position metadata)
                void requestMetadataSave({ rows: true, columns: false, immediate: true });
            } catch (e) {
                console.error('[GlideEditableTable] Failed to save sort metadata', e);
            }
        },
        [requestMetadataSave],
    );

    // Calculate row height dynamically based on text content and column width
    // Unlimited wrapping - all text is always visible, no line limits
    const calculateMinRowHeight = useCallback(
        (rowData: T, columnWidths: Record<string, number>) => {
            const baseHeight = 43;

            const lineHeight = 16;

            // values are enforced consistently across all cells and resize states
            const paddingTop = 6;
            const paddingBottom = 6;
            const paddingLeft = 8;
            const paddingRight = 8;
            const totalVerticalPadding = paddingTop + paddingBottom;
            const totalHorizontalPadding = paddingLeft + paddingRight;

            let maxRequiredHeight = baseHeight;

            // Check each column to calculate required height for wrapped text
            localColumns.forEach((column) => {
                if (column.isSystemColumn) {
                    return;
                }

                // Only apply dynamic wrapping to text columns TBD
                if (column.type !== 'text' && column.type !== undefined) return;

                const value = rowData?.[column.accessor]?.toString() || '';
                if (value.length === 0) return;

                const columnWidth =
                    columnWidths[column.accessor as string] || column.width || 120;

                // Calculate available text width: column width minus horizontal padding
                // Ensure minimum available width even for very narrow columns
                const availableTextWidth = Math.max(
                    columnWidth - totalHorizontalPadding,
                    20,
                );

                // Estimate characters per line based on average character width
                const avgCharWidth = 8;
                const charsPerLine = Math.floor(availableTextWidth / avgCharWidth);

                if (charsPerLine > 0) {
                    // Calculate total lines needed - no cap, unlimited wrapping
                    const estimatedLines = Math.ceil(value.length / charsPerLine);
                    // Account for existing newlines in the text
                    const existingNewlines = (value.match(/\n/g) || []).length;
                    const totalLines = Math.max(estimatedLines, existingNewlines + 1);

                    // Calculate required height with explicit padding:
                    const textHeight = totalLines * lineHeight;
                    const requiredHeight = textHeight + totalVerticalPadding;

                    if (requiredHeight > maxRequiredHeight) {
                        maxRequiredHeight = requiredHeight;
                    }
                } else {
                    // Even with no text or very narrow columns, ensure minimum height with padding
                    const minHeightWithPadding = lineHeight + totalVerticalPadding;
                    if (minHeightWithPadding > maxRequiredHeight) {
                        maxRequiredHeight = minHeightWithPadding;
                    }
                }
            });

            // Ensure the calculated height is at least the base height
            return Math.max(maxRequiredHeight, baseHeight);
        },
        [localColumns],
    );

    const handleRowResize = useCallback(
        (rowIndex: number, newSize: number) => {
            const rowId = sortedData[rowIndex]?.id;
            if (!rowId) return;

            setLocalData((prev) => {
                const updated = prev.map((row) =>
                    row.id === rowId ? { ...row, height: newSize } : row,
                );
                debouncedSave(); // call debounced save w newly updated columns
                return updated;
            });
        },
        [debouncedSave, sortedData],
    );

    const handleColumnDeleteConfirm = useCallback(async () => {
        if (!columnToDelete) return;

        try {
            // Find the column to get its accessor before deletion
            const columnToRemove = localColumns.find((col) => col.id === columnToDelete);
            const columnAccessor = columnToRemove?.accessor;

            await props.onDeleteColumn?.(columnToDelete);

            // Update local deletion tracker
            deletedColumnIdsRef.current.add(columnToDelete);

            // Update columns
            const newLocalColumns = localColumnsRef.current.filter(
                (col) => col.id !== columnToDelete,
            );

            // clean up data for the deleted column
            if (columnAccessor) {
                // Remove this column's data from localData
                setLocalData((prevData) =>
                    prevData.map((row) => {
                        const newRow = { ...row };
                        delete newRow[columnAccessor];
                        return newRow;
                    }),
                );

                // Remove this column's data from editingData
                setEditingData((prevEdits) => {
                    const newEdits = { ...prevEdits };
                    Object.keys(newEdits).forEach((rowId) => {
                        if (newEdits[rowId] && columnAccessor in newEdits[rowId]) {
                            delete newEdits[rowId][columnAccessor as keyof Partial<T>];
                            // If no more edits for this row, remove the row entry
                            if (Object.keys(newEdits[rowId]).length === 0) {
                                delete newEdits[rowId];
                            }
                        }
                    });
                    return newEdits;
                });
            }

            // Update ref and state
            localColumnsRef.current = newLocalColumns;
            setLocalColumns(newLocalColumns);

            // Column delete: include columns to save updated column list
            await requestMetadataSave({
                columns: true,
                rows: false,
                immediate: true,
            });

            // Force grid to refresh
            gridRef.current?.updateCells([]);
        } catch (err) {
            console.error('[GlideEditableTable] Failed to delete column:', err);
            return;
        }

        // Cleanup state on success
        setColumnToDelete(null);
        setDeleteConfirmOpen(false);
    }, [columnToDelete, props, requestMetadataSave]);

    // handle column rename with optimistic updates and error recovery
    const isRenamingRef = useRef(false);
    const renameInProgressRef = useRef<string | null>(null); // Track which column is being renamed
    const handleColumnRename = useCallback(
        async (newName: string) => {
            if (!columnToRename || !newName.trim()) return;

            // Enhanced double-execution prevention
            if (isRenamingRef.current) {
                console.warn(
                    '[rename_debug] Rename already in progress, ignoring duplicate call',
                    {
                        columnId: columnToRename.id,
                        newName: newName,
                    },
                );
                return;
            }

            // Check if this exact column is already being renamed
            if (renameInProgressRef.current === columnToRename.id) {
                console.warn(
                    '[rename_debug] This column is already being renamed, ignoring duplicate call',
                    {
                        columnId: columnToRename.id,
                    },
                );
                return;
            }

            const oldHeaderName = columnToRename.currentName;

            const pasteState = getPasteState();
            const isDuringPaste = pasteState.isPasting || pasteState.pasteOperationActive;

            // Find the column being renamed
            const columnToRenameObj = localColumns.find(
                (col) => col.id === columnToRename.id,
            );
            if (!columnToRenameObj) {
                console.error(
                    '[GlideEditableTable] Column not found:',
                    columnToRename.id,
                );
                return;
            }

            const originalAccessor = columnToRenameObj.accessor;

            isRenamingRef.current = true;
            renameInProgressRef.current = columnToRename.id;

            try {
                setLocalColumns((prev) => {
                    const updated = prev.map((col) => {
                        if (col.id === columnToRename.id) {
                            return {
                                ...col,
                                header: newName,
                                title: newName,
                                accessor: originalAccessor,
                            };
                        }
                        return col;
                    });

                    const renamedCol = updated.find((c) => c.id === columnToRename.id);
                    if (renamedCol && renamedCol.accessor !== originalAccessor) {
                        console.error(
                            '[GlideEditableTable] CRITICAL ERROR: Accessor was changed!',
                            {
                                originalAccessor: String(originalAccessor),
                                newAccessor: String(renamedCol.accessor),
                            },
                        );
                    }

                    localColumnsRef.current = updated;
                    return updated;
                });

                if (props.onRenameColumn) {
                    try {
                        await props.onRenameColumn(columnToRename.id, newName);
                    } catch (renameError) {
                        console.error(
                            '[GlideEditableTable] Failed to rename column via TableBlock:',
                            renameError,
                        );
                        // Re-throw to trigger error handling below
                        throw renameError;
                    }
                } else {
                    console.warn(
                        '[GlideEditableTable] No onRenameColumn prop provided - rename will not persist to DB',
                    );
                }
            } catch (err) {
                console.error('[GlideEditableTable] Failed to rename column:', err);
                setLocalColumns((prev) =>
                    prev.map((col) =>
                        col.id === columnToRename.id
                            ? {
                                  ...col,
                                  header: oldHeaderName,
                                  title: oldHeaderName,
                                  accessor: originalAccessor,
                              }
                            : col,
                    ),
                );
            } finally {
                isRenamingRef.current = false;
                renameInProgressRef.current = null;
                setColumnToRename(null);
                setRenameDialogOpen(false);
            }
        },
        [columnToRename, props.onRenameColumn],
    );

    // Call row deletion on array of selected Dynamic Requirement objects.
    const handleRowDeleteConfirm = useCallback(async () => {
        if (rowsToDelete.length === 0) return;

        // record indices before deletion for undo
        const rowIndices = rowsToDelete.map((row) =>
            sortedData.findIndex((r) => r.id === row.id),
        );

        // record in history (if not undoing)
        if (!isUndoingRef.current) {
            addToHistory({
                type: 'row_delete',
                timestamp: Date.now(),
                data: {
                    rows: [...rowsToDelete], // copy rows before deletion
                    rowIndices,
                },
            });
        }

        // Update local deletion tracker
        const deletedIds = rowsToDelete.map((r) => r.id);
        for (const id of deletedIds) {
            deletedRowIdsRef.current.add(id);
        }
        // Update local state.
        setLocalData((prev) => prev.filter((r) => !deletedIds.includes(r.id)));

        // Call DB deletes, sync local metadata to db.
        for (const row of rowsToDelete) {
            props.onDelete?.(row);
        }
        // Row delete: do NOT include columns (only save row metadata)
        void requestMetadataSave({ rows: true, columns: false, immediate: true });

        // Cleanup.
        setRowsToDelete([]);
        setRowDeleteConfirmOpen(false);
        setGridSelection({
            rows: CompactSelection.empty(),
            columns: CompactSelection.empty(),
        });
    }, [rowsToDelete, requestMetadataSave, props, sortedData, addToHistory]);

    const deleteRowsRightElement = useMemo(() => {
        if (!isEditMode) return null;
        const selectedRowIndices = gridSelection.rows.toArray();
        if (selectedRowIndices.length === 0) return null;

        const rowsToDeleteLocal = selectedRowIndices
            .map((i) => sortedData[i])
            .filter((row): row is T => Boolean(row));
        if (rowsToDeleteLocal.length === 0) return null;

        const handleDeleteClick = () => {
            if (props.skipDeleteConfirm) {
                const firstRow = rowsToDeleteLocal[0];
                if (firstRow) {
                    void props.onDelete?.(firstRow);
                }
            } else {
                setRowsToDelete(rowsToDeleteLocal);
                setRowDeleteConfirmOpen(true);
            }
        };

        return (
            <div
                style={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    zIndex: 1000,
                    pointerEvents: 'auto',
                }}
            >
                <button
                    onClick={handleDeleteClick}
                    style={{
                        height: 42,
                        lineHeight: '42px',
                        padding: '0 24px',
                        backgroundColor: '#7C3AED',
                        color: 'white',
                        border: 'none',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                        backdropFilter: 'blur(10px)',
                        transition: 'background 0.2s ease-in-out',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                        borderRadius: 6,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(140, 95, 202, 1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#7C3AED';
                    }}
                >
                    Delete {rowsToDeleteLocal.length}{' '}
                    {rowsToDeleteLocal.length === 1 ? 'Row' : 'Rows'}
                </button>
            </div>
        );
    }, [
        gridSelection.rows,
        isEditMode,
        props.onDelete,
        props.skipDeleteConfirm,
        setRowDeleteConfirmOpen,
        setRowsToDelete,
        sortedData,
    ]);

    // Modify Trailing Row Visuals.
    columns.map((col, idx) => ({
        title: col.header,
        width: colSizes[col.accessor] || col.width || 120,
        trailingRowOptions:
            idx === 0
                ? {
                      hint: 'Add row',
                      addIcon: true,
                      targetColumn: true,
                  }
                : undefined,
    }));

    // Called when edit mode is turned false. Curr calls HandleSaveAll ...
    useEffect(() => {
        const wasEditMode = prevEditModeRef.current;
        prevEditModeRef.current = isEditMode;
        if (wasEditMode && !isEditMode) {
            console.debug(
                '[GlideEditableTable] Edit mode exited. Checking for unsaved edits...',
            );

            // clear undo history when exiting edit mode
            historyRef.current = [];
            setHistoryIndex(-1);
            console.debug(
                '[GlideEditableTable] Cleared undo/redo history on edit mode exit',
            );

            const hasPendingEdits = Object.keys(editingDataRef.current).length > 0;

            if (hasPendingEdits) {
                console.debug(
                    '[GlideEditableTable] Flushing pending edits on edit mode exit...',
                );
                void handleSaveAll();
            } else {
                console.debug('[GlideEditableTable] No edits to save on exit.');
            }

            // clear any selection highlighting when exiting edit mode
            setGridSelection({
                rows: CompactSelection.empty(),
                columns: CompactSelection.empty(),
            });
            setSelection(undefined);
            selectionRef.current = undefined;
            console.debug('[GlideEditableTable] Cleared selection on edit mode exit');

            // Edit mode exit: do NOT include columns (only save row metadata if needed)
            void requestMetadataSave({ rows: true, columns: false, immediate: true });
        }
    }, [
        isEditMode,
        localColumns,
        editingData,
        onSave,
        onPostSave,
        handleSaveAll,
        requestMetadataSave,
    ]);

    // clear selection highlight when table loses focus
    useEffect(() => {
        const handleTableBlur = (e: FocusEvent) => {
            // check if focus is moving outside the table container
            const tableElement = tableRef.current;
            if (!tableElement) return;

            // use setTimeout to check focus after it has moved
            setTimeout(() => {
                // if new focused element is not within the table, clear selection
                if (!tableElement.contains(document.activeElement)) {
                    // Skip clearing selection during popup cell edit
                    if (
                        isEditMode &&
                        (isEditingCellRef as React.RefObject<boolean>).current
                    ) {
                        return;
                    }
                    setGridSelection({
                        rows: CompactSelection.empty(),
                        columns: CompactSelection.empty(),
                    });
                    setSelection(undefined);
                    selectionRef.current = undefined;
                    console.debug('[GlideEditableTable] Cleared selection on table blur');
                }
            }, 0);
        };

        const tableElement = tableRef.current;
        if (tableElement) {
            tableElement.addEventListener('blur', handleTableBlur, true);
            return () => {
                tableElement.removeEventListener('blur', handleTableBlur, true);
            };
        }
    }, [isEditMode]);

    // undo/redo functionality
    const performUndo = useCallback(() => {
        if (historyIndex < 0 || historyRef.current.length === 0) {
            console.debug('[Undo] No actions to undo');
            return;
        }

        const action = historyRef.current[historyIndex];
        isUndoingRef.current = true;

        console.debug('[Undo] Performing undo for action:', action.type);

        switch (action.type) {
            case 'cell_edit':
                // revert cell edit
                if (action.data.rowId && action.data.accessor !== undefined) {
                    setLocalData((prev) =>
                        prev.map((r) =>
                            r.id === action.data.rowId
                                ? ({
                                      ...r,
                                      [action.data.accessor!]: action.data.oldValue,
                                  } as T)
                                : r,
                        ),
                    );

                    // update editing buffer
                    setEditingData((prev) => {
                        const updated = { ...prev };
                        if (updated[action.data.rowId!]) {
                            if (
                                action.data.oldValue === undefined ||
                                action.data.oldValue === ''
                            ) {
                                // remove from buffer if reverting to empty
                                delete updated[action.data.rowId!][action.data.accessor!];
                                if (
                                    Object.keys(updated[action.data.rowId!]).length === 0
                                ) {
                                    delete updated[action.data.rowId!];
                                }
                            } else {
                                updated[action.data.rowId!] = {
                                    ...updated[action.data.rowId!],
                                    [action.data.accessor!]: action.data.oldValue,
                                };
                            }
                        }
                        return updated;
                    });
                }
                break;

            case 'row_add':
                // remove added rows
                if (action.data.rows) {
                    const rowIds = action.data.rows.map((r) => r.id);
                    setLocalData((prev) => prev.filter((r) => !rowIds.includes(r.id)));
                }
                break;

            case 'row_delete':
                // restore deleted rows
                if (action.data.rows && action.data.rowIndices) {
                    setLocalData((prev) => {
                        const updated = [...prev];
                        // insert rows back at their original positions
                        action.data.rows!.forEach((row, i) => {
                            const index = action.data.rowIndices![i];
                            updated.splice(index, 0, row);
                        });
                        return updated;
                    });

                    // clear from deletion tracker
                    action.data.rows.forEach((row) => {
                        deletedRowIdsRef.current.delete(row.id);
                    });
                }
                break;

            case 'column_move':
                // revert column move
                if (action.data.oldColumnState) {
                    setLocalColumns(action.data.oldColumnState);
                }
                break;

            case 'row_move':
                // revert row move
                if (action.data.from !== undefined && action.data.to !== undefined) {
                    setLocalData((prev) => {
                        const updated = [...prev];
                        // reverse the move
                        const [moved] = updated.splice(action.data.to!, 1);
                        updated.splice(action.data.from!, 0, moved);
                        // reindex positions
                        return updated.map((row, index) => ({
                            ...row,
                            position: index,
                        }));
                    });
                }
                break;
        }

        setHistoryIndex((prev) => Math.max(-1, prev - 1));

        // trigger debounced save to persist undo
        debouncedSave();

        setTimeout(() => {
            isUndoingRef.current = false;
        }, 100);
    }, [historyIndex, debouncedSave]);

    const performRedo = useCallback(() => {
        if (historyIndex >= historyRef.current.length - 1) {
            console.debug('[Redo] No actions to redo');
            return;
        }

        const nextIndex = historyIndex + 1;
        const action = historyRef.current[nextIndex];
        isUndoingRef.current = true;

        console.debug('[Redo] Performing redo for action:', action.type);

        switch (action.type) {
            case 'cell_edit':
                // reapply cell edit
                if (action.data.rowId && action.data.accessor !== undefined) {
                    setLocalData((prev) =>
                        prev.map((r) =>
                            r.id === action.data.rowId
                                ? ({
                                      ...r,
                                      [action.data.accessor!]: action.data.newValue,
                                  } as T)
                                : r,
                        ),
                    );

                    // update editing buffer
                    setEditingData((prev) => ({
                        ...prev,
                        [action.data.rowId!]: {
                            ...(prev[action.data.rowId!] || {}),
                            [action.data.accessor!]: action.data.newValue,
                        },
                    }));
                }
                break;

            case 'row_add':
                // re-add rows
                if (action.data.rows) {
                    setLocalData((prev) => [...prev, ...action.data.rows!]);
                }
                break;

            case 'row_delete':
                // re-delete rows
                if (action.data.rows) {
                    const rowIds = action.data.rows.map((r) => r.id);
                    setLocalData((prev) => prev.filter((r) => !rowIds.includes(r.id)));

                    // add back to deletion tracker
                    rowIds.forEach((id) => {
                        deletedRowIdsRef.current.add(id);
                    });
                }
                break;

            case 'column_move':
                // reapply column move
                if (action.data.newColumnState) {
                    setLocalColumns(action.data.newColumnState);
                }
                break;

            case 'row_move':
                // reapply row move
                if (action.data.from !== undefined && action.data.to !== undefined) {
                    setLocalData((prev) => {
                        const updated = [...prev];
                        const [moved] = updated.splice(action.data.from!, 1);
                        updated.splice(action.data.to!, 0, moved);
                        // reindex positions
                        return updated.map((row, index) => ({
                            ...row,
                            position: index,
                        }));
                    });
                }
                break;
        }

        setHistoryIndex(nextIndex);

        // trigger debounced save to persist redo
        debouncedSave();

        setTimeout(() => {
            isUndoingRef.current = false;
        }, 100);
    }, [historyIndex, debouncedSave]);
    // Save hotkey, temp fix for dev. 'Ctrl' + 's'
    // now also handles undo/redo
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            const isMac =
                (navigator as any).userAgentData?.platform === 'macOS' ||
                navigator.userAgent.toLowerCase().includes('mac');

            // save hotkey
            const isSaveKey =
                (isMac && e.metaKey && e.key === 's') ||
                (!isMac && e.ctrlKey && e.key === 's');

            if (isSaveKey) {
                e.preventDefault(); // Prevent browser's save dialog
                console.debug(
                    '[GlideEditableTable] Ctrl+S detected. Saving pending changes...',
                );
                void handleSaveAll();
                // Undo/redo: do NOT include columns (only save row metadata)
                void requestMetadataSave({ rows: true, columns: false, immediate: true });
                return;
            }

            // undo hotkey (ctrl+z or cmd+z)
            const isUndoKey =
                (isMac && e.metaKey && e.key === 'z' && !e.shiftKey) ||
                (!isMac && e.ctrlKey && e.key === 'z' && !e.shiftKey);

            if (isUndoKey && isEditMode) {
                e.preventDefault();
                e.stopPropagation();
                console.debug('[GlideEditableTable] Undo triggered');
                performUndo();
                return;
            }

            // redo hotkey (ctrl+shift+z, ctrl+y, or cmd+shift+z)
            const isRedoKey =
                (isMac && e.metaKey && e.key === 'z' && e.shiftKey) ||
                (!isMac && e.ctrlKey && e.key === 'z' && e.shiftKey) ||
                (!isMac && e.ctrlKey && e.key === 'y');

            if (isRedoKey && isEditMode) {
                e.preventDefault();
                e.stopPropagation();
                console.debug('[GlideEditableTable] Redo triggered');
                performRedo();
                return;
            }
        },
        [handleSaveAll, requestMetadataSave, isEditMode, performUndo, performRedo],
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    // Detect type-to-edit path to mark editing active before overlay opens
    const handleGridKeyDown = useCallback(
        (e: {
            ctrlKey: boolean;
            metaKey: boolean;
            altKey: boolean;
            key: string;
            code?: string;
            preventDefault?: () => void;
            stopPropagation?: () => void;
        }) => {
            if (!isEditMode) return;

            const hasSelection = Boolean(selectionRef.current?.current?.cell);
            const isModifier = e.ctrlKey || e.metaKey || e.altKey;
            const code = e.code || '';
            const key = e.key;
            const isNavKey =
                code === 'ArrowUp' ||
                code === 'ArrowDown' ||
                code === 'ArrowLeft' ||
                code === 'ArrowRight' ||
                code === 'Tab' ||
                code === 'Enter' ||
                code === 'Escape';
            const startsEdit = !isModifier && !isNavKey && key.length === 1;

            // If starting an edit by typing/enter/space, mark editing active so blur won't clear
            if (hasSelection && (startsEdit || code === 'Enter' || key === ' ')) {
                (isEditingCellRef as React.RefObject<boolean>).current = true;
            }
            if (code === 'Escape') {
                (isEditingCellRef as React.RefObject<boolean>).current = false;
            }

            // Hijack row delete: if Delete/Backspace pressed while rows are selected and not editing a cell
            const selectedRowIndices = gridSelection.rows.toArray();
            const hasRowSelection = selectedRowIndices.length > 0;
            const isDeleteKey = key === 'Delete' || key === 'Backspace';
            const isEditingOverlay = (isEditingCellRef as React.RefObject<boolean>)
                .current;

            if (hasRowSelection && isDeleteKey && !isEditingOverlay) {
                // Prevent Glide from clearing cell contents
                e.preventDefault?.();
                e.stopPropagation?.();

                const rowsToDeleteLocal = selectedRowIndices
                    .map((i) => sortedData[i])
                    .filter(Boolean);
                if (rowsToDeleteLocal.length > 0) {
                    if (props.skipDeleteConfirm) {
                        // Delegate confirmation to parent; do not mutate local state here
                        const firstRow = rowsToDeleteLocal[0];
                        if (firstRow) {
                            void props.onDelete?.(firstRow);
                        }
                    } else {
                        setRowsToDelete(rowsToDeleteLocal);
                        setRowDeleteConfirmOpen(true);
                    }
                }
            }
        },
        [
            isEditMode,
            gridSelection,
            sortedData,
            props.skipDeleteConfirm,
            handleRowDeleteConfirm,
        ],
    );

    // handle cell activation and track selected position
    const handleCellActivated = useCallback(
        (cell: Item) => {
            // track activated cell for navigation and paste
            lastSelectedCellRef.current = cell;
            console.debug('[Cell Activated] Cell selected for potential paste/edit:', {
                col: cell[0],
                row: cell[1],
            });

            const [colIndex, rowIndex] = cell;
            const column = localColumns[colIndex];
            const rowData = sortedData[rowIndex];

            // Broadcast cursor position to other users
            if (blockId && rowData?.id && column?.id && broadcastCursorMove) {
                void broadcastCursorMove({
                    blockId,
                    rowId: rowData.id,
                    columnId: column.id,
                });

                // Track current editing cell for conflict detection
                currentEditingCell.current = {
                    rowId: rowData.id,
                    columnId: column.id,
                };
            }

            // Handle Actions column click
            if (
                column?.accessor === ACTIONS_COLUMN_ACCESSOR &&
                rowData &&
                props.onLinksColumnClick
            ) {
                console.log('[Actions Column] Clicked:', {
                    requirementId: rowData.id,
                    rowData,
                });
                props.onLinksColumnClick(rowData.id, rowData);
                return;
            }

            if (isEditMode) {
                // entering popup edit mode: temporarily disable blur-based deselection
                (isEditingCellRef as React.RefObject<boolean>).current = true;
            } else {
                // open row detail panel in view mode if provided
                if (props.rowDetailPanel) {
                    const row = sortedData[cell[1]];
                    // Open if row has an id (requirement rows always have stable ids)
                    const hasId = Boolean(row?.id);
                    if (hasId) {
                        setSelectedRowId(row.id);
                        setIsRowDetailOpen(true);
                    } else {
                        setIsRowDetailOpen(false);
                    }
                }
            }
        },
        [
            isEditMode,
            sortedData,
            props.rowDetailPanel,
            props.onLinksColumnClick,
            localColumns,
            blockId,
            broadcastCursorMove,
        ],
    );

    // Calculate highlight regions for cells being edited by other users
    const highlightRegions = useMemo(() => {
        if (!blockId) return [];

        const regions: Array<{
            color: string;
            range: { x: number; y: number; width: number; height: number };
            style?: 'solid' | 'dashed';
        }> = [];

        activeUsers.forEach((user) => {
            if (user.userId === userId || !user.editingCell) return;
            if (user.editingCell.blockId !== blockId) return;

            const { rowId, columnId } = user.editingCell;

            // Find row and column indices
            const rowIndex = sortedData.findIndex((row) => row.id === rowId);
            const colIndex = localColumns.findIndex((col) => col.id === columnId);

            if (rowIndex >= 0 && colIndex >= 0) {
                // Import getUserColor
                const colors = [
                    '#3b82f6', // blue
                    '#10b981', // green
                    '#f59e0b', // amber
                    '#ef4444', // red
                    '#8b5cf6', // purple
                    '#ec4899', // pink
                    '#06b6d4', // cyan
                    '#f97316', // orange
                ];
                let hash = 0;
                for (let i = 0; i < user.userId.length; i++) {
                    hash = user.userId.charCodeAt(i) + ((hash << 5) - hash);
                }
                const userColor = colors[Math.abs(hash) % colors.length];

                regions.push({
                    color: userColor + '40', // Add transparency
                    range: {
                        x: colIndex,
                        y: rowIndex,
                        width: 1,
                        height: 1,
                    },
                    style: 'solid',
                });
            }
        });

        return regions;
    }, [activeUsers, blockId, userId, sortedData, localColumns]);

    // Detect conflicts when editing same cell as another user
    useEffect(() => {
        if (!blockId || !currentEditingCell.current) return;

        const { rowId, columnId } = currentEditingCell.current;
        const conflicts: Array<{ userId: string; userName: string }> = [];

        activeUsers.forEach((user) => {
            if (user.userId === userId) return; // Skip self
            if (!user.editingCell) return;
            if (user.editingCell.blockId !== blockId) return;

            // Check if editing same cell
            if (
                user.editingCell.rowId === rowId &&
                user.editingCell.columnId === columnId
            ) {
                conflicts.push({
                    userId: user.userId,
                    userName: user.userName,
                });
            }
        });

        if (conflicts.length > 0) {
            setConflictingUsers(conflicts);
            setShowConflictWarning(true);

            // Auto-dismiss after 5 seconds
            const timeout = setTimeout(() => {
                setShowConflictWarning(false);
            }, 5000);

            return () => clearTimeout(timeout);
        } else {
            setShowConflictWarning(false);
        }
    }, [activeUsers, blockId, userId]);

    // enhanced selection tracking
    useEffect(() => {
        selectionRef.current = selection;
    }, [selection]);

    // enhanced paste handler with crash protection - scoped per table instance
    const handlePaste = useCallback(
        (target: Item, cells: readonly (readonly string[])[]): boolean => {
            // Get scoped paste state for this table instance
            const pasteState = getPasteState();
            const tableId = blockId || 'default';

            // Exit if not in edit mode
            if (!isEditMode) return false;

            // Prevent nested paste operations for THIS table instance
            if (pasteState.isPasting || pasteState.pasteOperationActive) return false;

            const operationId = `paste_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            const t0 = Date.now();

            pasteState.isPasting = true;
            pasteState.pasteOperationActive = true;

            gridRef.current?.focus();

            const startCell: Item = target;
            const rawStartCol = Math.max(0, startCell[0]);
            const startRow = Math.max(0, startCell[1]);

            // Convert cells array to clipboardRows format
            // Empty cells should be preserved to match Excel/Sheets behavior
            const clipboardRows = cells.map((row) => row.map((cell) => cell.trim()));

            const validClipboardRows = clipboardRows.filter((row) =>
                row.some((cell) => cell.length > 0),
            );

            // Ensure clipboardRows is always a valid 2D array
            if (validClipboardRows.length === 0) {
                return false;
            }

            let pasteStartCol = 0;
            let pasteStartRow = 0;
            let pasteEndCol = 0;
            let pasteEndRow = 0;
            let clipboardRowsForRestore: string[][] = [];
            // declare at function scope for access in finally block
            let newRowsToCreate: T[] = [];

            // We'll resolve the actual paste start column after we have the current columns
            const currentData = [...sortedData];
            const currentColumns = [...localColumnsRef.current];

            // Debug column list before any paste processing
            try {
                const colAccessors = currentColumns.map((c) => String(c.accessor));
                console.log('DEBUG-PASTE-COLLIST:', {
                    operationId,
                    accessors: colAccessors,
                });
            } catch {
                // swallow any debug errors
            }

            const startColFinal = rawStartCol;

            // Helper to compute paste target columns based on clipboard width
            const getPasteTargetColumns = (
                columns: EditableColumn<T>[],
                startColIndex: number,
                clipboardWidth: number,
            ): Array<{ column: EditableColumn<T>; columnIndex: number }> => {
                const targets: Array<{ column: EditableColumn<T>; columnIndex: number }> =
                    [];

                for (
                    let colIndex = startColIndex;
                    colIndex < columns.length && targets.length < clipboardWidth;
                    colIndex++
                ) {
                    const col = columns[colIndex];
                    if (!col) continue;
                    targets.push({ column: col, columnIndex: colIndex });
                }

                return targets;
            };

            // Store coordinates for reference (but don't clear selection yet)
            pasteStartCol = startColFinal;
            pasteStartRow = startRow;
            clipboardRowsForRestore = validClipboardRows;
            pasteEndCol =
                validClipboardRows.length > 0
                    ? startColFinal +
                      Math.max(...validClipboardRows.map((r) => r.length)) -
                      1
                    : startColFinal;
            pasteEndRow = startRow + Math.max(0, validClipboardRows.length - 1);

            try {
                // Store coordinates for reference (but don't clear selection yet)
                pasteStartCol = startColFinal;
                pasteStartRow = startRow;
                clipboardRowsForRestore = validClipboardRows;
                pasteEndCol =
                    validClipboardRows.length > 0
                        ? startColFinal +
                          Math.max(...validClipboardRows.map((r) => r.length)) -
                          1
                        : startColFinal;
                pasteEndRow = startRow + Math.max(0, validClipboardRows.length - 1);

                // Calculate maximum columns needed from pasted data
                const maxPastedColumns = Math.max(
                    0,
                    ...validClipboardRows.map((row) => row.length),
                );
                const maxTargetColumnIndex = startColFinal + maxPastedColumns - 1;
                const columnsNeeded = maxTargetColumnIndex + 1;

                // Dynamically create missing columns if pasted data exceeds existing columns
                const newColumnsToCreate: Array<{
                    index: number;
                    name: string;
                    position: number;
                    tempId: string;
                }> = [];
                if (columnsNeeded > currentColumns.length) {
                    const existingColumnCount = currentColumns.length;

                    // Find the highest numbered "Column X" to determine next index
                    let highestColumnNumber = 0;
                    currentColumns.forEach((col) => {
                        // Match "Column X" pattern
                        const match = col.header.match(/^Column (\d+)$/);
                        if (match) {
                            const num = parseInt(match[1], 10);
                            if (num > highestColumnNumber) {
                                highestColumnNumber = num;
                            }
                        } else {
                            const suffixMatch = col.header.match(/(\d+)$/);
                            if (suffixMatch) {
                                const num = parseInt(suffixMatch[1], 10);
                                if (num > highestColumnNumber) {
                                    highestColumnNumber = num;
                                }
                            }
                        }
                    });

                    // If no numeric columns found, use the current column count as base
                    if (highestColumnNumber === 0 && existingColumnCount > 0) {
                        highestColumnNumber = existingColumnCount;
                    }

                    // New columns should be positioned after existing columns, starting sequentially
                    const columnsToCreate = columnsNeeded - existingColumnCount;
                    for (let i = 0; i < columnsToCreate; i++) {
                        const colIndex = existingColumnCount + i;
                        const columnNumber = highestColumnNumber + i + 1;
                        const columnName = `Column ${columnNumber}`;
                        const columnPosition = existingColumnCount + i;
                        const tempId = `temp-${Date.now()}-${i}`;
                        newColumnsToCreate.push({
                            index: colIndex,
                            name: columnName,
                            position: columnPosition,
                            tempId: tempId,
                        });
                        console.debug(
                            `[${operationId}] Will create new column at index ${colIndex}: "${columnName}" at position ${columnPosition} (existingColumns.length=${existingColumnCount})`,
                        );
                    }
                }

                // Debug dynamic column planning before placeholder insertion
                try {
                    console.log('DEBUG-PASTE-DYNAMIC:', {
                        operationId,
                        placeholderCount: newColumnsToCreate.length,
                        newColumnsToCreate,
                        finalColumnsLength:
                            currentColumns.length + newColumnsToCreate.length,
                    });

                    // Track this operation as creating dynamic columns for structural sync guard
                    if (newColumnsToCreate.length > 0) {
                        lastDynamicPasteOperationRef.current = operationId;
                        console.debug(
                            '[structural_sync_guard] Marking paste operation as dynamic column creator',
                            {
                                operationId,
                                dynamicColumnCount: newColumnsToCreate.length,
                            },
                        );
                    }
                } catch {
                    // swallow any debug errors
                }

                // Process cell data after columns are confirmed in database
                // Initialize results array - will be populated by async column creation
                let columnCreationResults: Array<{
                    success: boolean;
                    columnId?: string;
                    tempId: string;
                    realAccessor?: string;
                    error?: any;
                }> = [];
                const confirmedColumnIds: string[] = [];
                // This map will be built synchronously from placeholder columns for immediate UI use
                const tempAccessorToRealAccessor = new Map<string, string>();
                const tempIdToTempAccessor = new Map<string, string>();

                if (newColumnsToCreate.length > 0 && blockId) {
                    // STEP 1: Add debug log for dynamic column creation
                    console.debug('[dynamic_columns] creating new dynamic columns:', {
                        operationId,
                        count: newColumnsToCreate.length,
                        columns: newColumnsToCreate.map((c) => ({
                            name: c.name,
                            position: c.position,
                            tempId: c.tempId,
                        })),
                    });

                    // Create placeholder columns synchronously for immediate UI display
                    const placeholderColumns = newColumnsToCreate.map(
                        ({ name, position, tempId }) => ({
                            id: tempId,
                            header: name,
                            title: name,
                            accessor: name.toLowerCase().replace(/\s+/g, '_') as keyof T,
                            type: 'text' as EditableColumnType,
                            width: 150,
                            position: position,
                            options: undefined,
                        }),
                    );

                    currentColumns.push(...placeholderColumns);
                    currentColumns.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

                    // Track newly created dynamic columns as pending sync so column
                    // synchronization logic doesn't treat them as removed before
                    // metadata/props catch up.
                    placeholderColumns.forEach((col) => {
                        if (col.id) {
                            dynamicColumnsPendingSyncRef.current.add(col.id);
                        }
                    });

                    // Update localColumns state immediately so UI shows new columns
                    setLocalColumns((prev) => {
                        const updated = [...prev, ...placeholderColumns];
                        return updated.sort(
                            (a, b) => (a.position ?? 0) - (b.position ?? 0),
                        );
                    });

                    // Update ref immediately
                    localColumnsRef.current =
                        currentColumns as typeof localColumnsRef.current;

                    // 1. Add early stabilization trigger - enter stabilization mode immediately
                    setIsPostPasteStabilizing(true);
                    console.debug('[post_paste_sync] Entering stabilization early', {
                        operationId,
                        dynamicColumnCount: placeholderColumns.length,
                        totalColumnCount: localColumnsRef.current.length,
                    });

                    // TASK 2: Immediately force grid update to show dynamic columns
                    if (gridRef.current) {
                        gridRef.current.updateCells([]);
                    }

                    console.debug(`[${operationId}] Placeholder columns created:`, {
                        count: placeholderColumns.length,
                        columns: placeholderColumns.map((c) => ({
                            id: c.id,
                            header: c.header,
                            accessor: c.accessor,
                            position: c.position,
                        })),
                        allColumnAccessors: localColumnsRef.current.map(
                            (c) => c.accessor,
                        ),
                    });

                    const columnCreationPromise = (async () => {
                        try {
                            await waitForSupabaseClient();

                            // Collect all column creation promises in an array
                            const columnCreationPromises: Promise<any>[] = [];

                            // Fire all column creation requests in parallel and collect promises
                            const columnPromises = newColumnsToCreate.map(
                                async ({ name, position, tempId, index: arrayIndex }) => {
                                    try {
                                        const tempAccessor = name
                                            .toLowerCase()
                                            .replace(/\s+/g, '_');
                                        console.debug(
                                            `[paste_sync][${operationId}] creating new column localId=${tempId} accessor=${tempAccessor} position=${position} name="${name}"`,
                                        );
                                        const createStart = Date.now();

                                        const columnPromise = createPropertyAndColumn(
                                            name,
                                            'text',
                                            {
                                                scope: ['document'],
                                                is_base: false,
                                                org_id: String(orgId),
                                                project_id: String(projectId),
                                                document_id: String(documentId),
                                            },
                                            '',
                                            blockId,
                                            userId || '',
                                        );

                                        // Store promise in both the Map (for tracking) and array (for Promise.all)
                                        pasteState.columnCreationPromises.set(
                                            tempId,
                                            columnPromise,
                                        );
                                        columnCreationPromises.push(columnPromise);

                                        const result = await columnPromise;
                                        const createDuration = Date.now() - createStart;
                                        console.debug(
                                            `[paste_sync][${operationId}] createPropertyAndColumn returned (duration=${createDuration}ms) ->`,
                                            {
                                                success: !!(
                                                    result?.column && result?.property
                                                ),
                                                columnId: result?.column?.id,
                                                propertyName: result?.property?.name,
                                                realAccessor: result?.property?.name,
                                                tempId,
                                            },
                                        );

                                        if (result?.column && result?.property) {
                                            // Update placeholder with real column data
                                            const placeholderIndex =
                                                currentColumns.findIndex(
                                                    (col) => col.id === tempId,
                                                );
                                            if (placeholderIndex !== -1) {
                                                const updatedColumn = {
                                                    id: result.column.id,
                                                    header: name,
                                                    title: name,
                                                    accessor: result.property
                                                        .name as keyof T,
                                                    type: 'text' as EditableColumnType,
                                                    width: 150,
                                                    position: position,
                                                    options: undefined,
                                                };
                                                currentColumns[placeholderIndex] =
                                                    updatedColumn;

                                                // Update local state with real column
                                                setLocalColumns((prev) => {
                                                    const updated = prev.map((col) =>
                                                        col.id === tempId
                                                            ? updatedColumn
                                                            : col,
                                                    );
                                                    return updated.sort(
                                                        (a, b) =>
                                                            (a.position ?? 0) -
                                                            (b.position ?? 0),
                                                    );
                                                });
                                                localColumnsRef.current =
                                                    currentColumns as typeof localColumnsRef.current;
                                            }

                                            return {
                                                success: true,
                                                columnId: result.column.id,
                                                tempId: tempId,
                                                realAccessor: result.property.name,
                                                originalIndex: arrayIndex,
                                            };
                                        } else {
                                            return {
                                                success: false,
                                                name,
                                                error: 'No result',
                                                tempId: tempId,
                                                originalIndex: arrayIndex,
                                            };
                                        }
                                    } catch (columnError) {
                                        return {
                                            success: false,
                                            name,
                                            error: columnError,
                                            tempId: tempId,
                                            originalIndex: arrayIndex,
                                        };
                                    }
                                },
                            );

                            // STEP 1: ensures all columns exist in the database before we save any row data
                            console.debug(
                                `[paste_sync][${operationId}] Waiting for ${columnCreationPromises.length} column creation promises to complete...`,
                            );
                            await Promise.all(columnCreationPromises);
                            console.debug(
                                `[paste_sync][${operationId}] All column creation promises resolved. Processing results...`,
                            );

                            // STEP 2: Add debug log after column creation
                            console.debug(
                                '[dynamic_columns] saved new columns to Supabase:',
                                {
                                    operationId,
                                    count: columnCreationPromises.length,
                                    successful: columnCreationPromises.length,
                                },
                            );

                            // Now process the results
                            const settledResults =
                                await Promise.allSettled(columnPromises);

                            // Extract results
                            const results = settledResults.map((result, index) => {
                                if (result.status === 'fulfilled') {
                                    return result.value;
                                } else {
                                    return {
                                        success: false,
                                        tempId: newColumnsToCreate[index].tempId,
                                        error: result.reason,
                                    };
                                }
                            });

                            // Extract successful column IDs for confirmation
                            const successfulColumnIds = results
                                .filter(
                                    (r) => r.success && 'columnId' in r && !!r.columnId,
                                )
                                .map((r) => (r as { columnId: string }).columnId)
                                .filter((id): id is string => !!id);

                            console.debug(
                                `[paste_sync][${operationId}] ALL createColumn promises resolved, totalNewColumns=${results.length}, successful=${successfulColumnIds.length}`,
                            );

                            // Confirm columns exist in database before proceeding
                            if (successfulColumnIds.length > 0) {
                                const confirmed = await confirmColumnsForTable(
                                    successfulColumnIds,
                                    operationId,
                                );
                                if (!confirmed) {
                                    console.warn(
                                        `[paste_sync][${operationId}] Some columns failed confirmation, but proceeding with successful ones`,
                                    );
                                }
                            }

                            // STEP 3: Add debug log after all columns are created and updated
                            const successfulColumnCount = results.filter(
                                (r) => r.success && 'columnId' in r && !!r.columnId,
                            ).length;
                            console.debug(
                                '[dynamic_columns] updated local columns after paste:',
                                {
                                    operationId,
                                    totalColumns: localColumnsRef.current.length,
                                    newColumns: successfulColumnCount,
                                    columnIds: successfulColumnIds,
                                },
                            );

                            // Short pause to allow DB eventual consistency (if any)
                            console.debug(
                                `[paste_sync][${operationId}] Adding 100ms delay to ensure columns are registered in backend...`,
                            );
                            await new Promise((r) => setTimeout(r, 100));
                            console.debug(
                                `[paste_sync][${operationId}] Delay complete, columns should be ready for row data save`,
                            );

                            // STEP 2: Trigger refresh of columns from Supabase via onPostSave
                            // This ensures parent columns prop updates with new columns
                            try {
                                if (onPostSave) {
                                    console.debug(
                                        `[paste_sync][${operationId}] Triggering onPostSave to refresh columns from Supabase`,
                                    );
                                    await onPostSave();
                                    console.debug(
                                        `[paste_sync][${operationId}] onPostSave completed, columns should be refreshed`,
                                    );
                                }
                            } catch (refreshError) {
                                console.warn(
                                    `[paste_sync][${operationId}] onPostSave refresh failed (non-fatal):`,
                                    refreshError,
                                );
                            }

                            // Log current authoritative columns via props (after await)
                            console.debug(
                                `[paste_sync][${operationId}] after col-create, prop columns (len) =`,
                                columns.length,
                                columns
                                    .map((c) => ({
                                        id: c.id,
                                        accessor: String(c.accessor),
                                    }))
                                    .slice(0, 20),
                            );

                            return results;
                        } catch (error) {
                            console.error(
                                `[paste_sync][${operationId}] Error creating columns:`,
                                error,
                            );
                            return [];
                        }
                    })();

                    // Store the overall column creation promise for later use in save phase
                    pasteState.columnCreationPromise = columnCreationPromise.then(
                        (results) => {
                            // Update columnCreationResults for use in save phase
                            columnCreationResults = results;

                            // Build mapping from temp accessor to real accessor for save phase
                            results.forEach((result) => {
                                if (
                                    result.success &&
                                    result.tempId &&
                                    'realAccessor' in result &&
                                    result.realAccessor
                                ) {
                                    const placeholderCol = currentColumns.find(
                                        (col) => col.id === result.tempId,
                                    );
                                    if (placeholderCol) {
                                        const tempAccessor = String(
                                            placeholderCol.accessor,
                                        );
                                        tempAccessorToRealAccessor.set(
                                            tempAccessor,
                                            result.realAccessor,
                                        );
                                    }
                                }
                            });
                            return results;
                        },
                    );

                    // allows UI to display dynamic column data right away using temp accessors
                    newColumnsToCreate.forEach(({ tempId, name }) => {
                        const placeholderCol = currentColumns.find(
                            (col) => col.id === tempId,
                        );
                        if (placeholderCol) {
                            const tempAccessor = String(placeholderCol.accessor);
                            tempIdToTempAccessor.set(tempId, tempAccessor);
                            tempAccessorToRealAccessor.set(tempAccessor, tempAccessor);
                        }
                    });
                }

                // Track changes to apply - split by standard vs dynamic columns
                const updatedRows = new Map<string, T>();
                const rowsWithDynamicColumns = new Map<
                    string,
                    {
                        row: T;
                        dynamicColumnData: Record<string, any>;
                        tempColumnIds: string[];
                    }
                >();
                newRowsToCreate = [];
                const newRowsWithDynamicColumns: Array<{
                    row: T;
                    dynamicColumnData: Record<string, any>;
                    tempColumnIds: string[];
                }> = [];
                const editingUpdates: Record<string, Partial<T>> = {};

                // Compute target columns for paste, skipping the Actions column entirely
                const pasteTargetColumns = getPasteTargetColumns(
                    currentColumns,
                    startColFinal,
                    maxPastedColumns,
                );

                // Debug final paste target columns once per paste
                try {
                    console.log('DEBUG-PASTE-TARGET-COLS:', {
                        operationId,
                        targets: pasteTargetColumns.map((t) => ({
                            index: t.columnIndex,
                            header: t.column.header,
                            accessor: String(t.column.accessor),
                        })),
                    });
                } catch {
                    // swallow any debug errors
                }

                // Build mapping from tempId to temp accessor for immediate use
                // used to track which columns are dynamic during cell processing
                const tempIdToAccessor = new Map<string, string>();
                newColumnsToCreate.forEach(({ tempId, name }) => {
                    const placeholderCol = currentColumns.find(
                        (col) => col.id === tempId,
                    );
                    if (placeholderCol) {
                        const tempAccessor = String(placeholderCol.accessor);
                        tempIdToAccessor.set(tempId, tempAccessor);
                    }
                });

                // Calculate the maximum position for new rows from current data
                const currentPositions = currentData.map((d) => d.position ?? 0);
                let maxPosition =
                    currentPositions.length > 0 ? Math.max(...currentPositions) : 0;

                // Ensure select-field debug logs only once per paste
                let selectDebugLogged = false;

                for (
                    let clipboardRowIndex = 0;
                    clipboardRowIndex < validClipboardRows.length;
                    clipboardRowIndex++
                ) {
                    const clipboardCells = validClipboardRows[clipboardRowIndex];
                    // Calculate target row index relative to start cell
                    const targetRowIndex = startRow + clipboardRowIndex;

                    // determine if we're updating existing row or creating new one
                    const existingRow = currentData[targetRowIndex];
                    let targetRow: T;
                    let isNewRow = false;

                    if (existingRow) {
                        targetRow = { ...existingRow };
                    } else {
                        // create new row
                        isNewRow = true;
                        maxPosition++;

                        // create base row w all column defaults, excluding id
                        const newRowData = currentColumns.reduce((acc, col) => {
                            if (col.accessor === 'id') return acc;
                            acc[col.accessor as keyof T] = '' as any;
                            return acc;
                        }, {} as Partial<T>);

                        const newRowId = crypto.randomUUID();
                        targetRow = {
                            ...newRowData,
                            id: newRowId,
                            position: maxPosition,
                        } as T;
                    }

                    // Track if row has any changes
                    let rowHasChanges = isNewRow;
                    // Track dynamic column data separately
                    const dynamicColumnData: Record<string, any> = {};
                    const tempColumnIds: string[] = [];

                    // Process each cell in the clipboard row
                    for (
                        let cellIndex = 0;
                        cellIndex < clipboardCells.length &&
                        cellIndex < pasteTargetColumns.length;
                        cellIndex++
                    ) {
                        const targetInfo = pasteTargetColumns[cellIndex];
                        if (!targetInfo) {
                            continue;
                        }
                        const { column: targetColumn, columnIndex: targetColIndex } =
                            targetInfo;

                        if (!targetColumn) {
                            continue;
                        }
                        // Cell values are already trimmed during parsing
                        const cellValue = clipboardCells[cellIndex] ?? '';

                        const trimmedValue = cellValue;
                        const currentValue = (
                            targetRow[targetColumn.accessor] ?? ''
                        ).toString();

                        // Empty cells from clipboard should overwrite existing values
                        if (currentValue === trimmedValue && trimmedValue !== '') {
                            continue;
                        }

                        // Handle different column types with proper validation
                        let processedValue: any = trimmedValue;
                        // For select cells, we will derive a lowercase accessor for Status/Priority
                        // and use it only on the write path (rowData/editingUpdates).
                        let realAccessorForSelect: string | null = null;

                        switch (targetColumn.type) {
                            case 'multi_select': {
                                const rawParts = trimmedValue
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter((s) => s.length > 0);
                                let validOptions: string[] = [];
                                if (Array.isArray(targetColumn.options)) {
                                    validOptions = targetColumn.options.map((opt) => {
                                        if (typeof opt === 'string') return opt;
                                        if (
                                            typeof opt === 'object' &&
                                            opt !== null &&
                                            'label' in opt
                                        ) {
                                            return (opt as { label: string }).label;
                                        }
                                        return String(opt);
                                    });
                                }
                                processedValue =
                                    validOptions.length > 0
                                        ? rawParts.filter((p) => validOptions.includes(p))
                                        : rawParts;
                                break;
                            }
                            case 'people': {
                                const rawParts = trimmedValue
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter((s) => s.length > 0);
                                let validOptions: string[] = [];
                                if (Array.isArray(targetColumn.options)) {
                                    validOptions = targetColumn.options.map((opt) => {
                                        if (typeof opt === 'string') return opt;
                                        if (
                                            typeof opt === 'object' &&
                                            opt !== null &&
                                            'label' in opt
                                        ) {
                                            return (opt as { label: string }).label;
                                        }
                                        return String(opt);
                                    });
                                }
                                processedValue =
                                    validOptions.length > 0
                                        ? rawParts.filter((p) => validOptions.includes(p))
                                        : rawParts;
                                break;
                            }
                            case 'select': {
                                const kind =
                                    detectStatusOrPriorityColumn(
                                        targetColumn as EditableColumn<T>,
                                    ) ?? null;

                                // For Status/Priority during paste: use strict exact-match validation
                                if (kind != null) {
                                    // For Status/Priority, use strict exact-match validation
                                    // Check if trimmedValue matches exactly (case-sensitive) against allowed values
                                    const allowed =
                                        kind === 'status'
                                            ? STATUS_VALID_VALUES
                                            : PRIORITY_VALID_VALUES;
                                    const isExactMatch =
                                        trimmedValue &&
                                        allowed.includes(trimmedValue as any);

                                    if (isExactMatch) {
                                        // Valid exact match: convert to lowercase for storage
                                        processedValue = trimmedValue.toLowerCase();
                                    } else {
                                        // Not an exact match: preserve raw value for invalid handling
                                        processedValue = trimmedValue;
                                    }

                                    // Break out early - skip the rest of select validation logic
                                    // The value will be stored in properties or natural field below
                                } else if (
                                    Array.isArray(targetColumn.options) &&
                                    targetColumn.options.length > 0
                                ) {
                                    // Non Status/Priority selects: apply normal validation
                                    const validOptions = targetColumn.options.map(
                                        (opt) => {
                                            if (typeof opt === 'string') return opt;
                                            if (
                                                typeof opt === 'object' &&
                                                opt !== null &&
                                                'label' in opt
                                            ) {
                                                return (opt as { label: string }).label;
                                            }
                                            return String(opt);
                                        },
                                    );

                                    if (trimmedValue) {
                                        const lowered = trimmedValue.toLowerCase();
                                        const loweredOptions = validOptions.map((v) =>
                                            v.toLowerCase(),
                                        );
                                        const matchIndex =
                                            loweredOptions.indexOf(lowered);

                                        if (matchIndex !== -1) {
                                            // Preserve original option label casing
                                            processedValue = validOptions[matchIndex];
                                        } else {
                                            // Non Status/Priority selects keep original behavior:
                                            // invalid values fall back to empty string
                                            processedValue = '';
                                        }
                                    } else {
                                        processedValue = '';
                                    }
                                } else {
                                    // No options defined; store raw value
                                    processedValue = trimmedValue;
                                }

                                // For Status/Priority: route to correct storage based on strict validation
                                if (kind != null) {
                                    const realAccessor = String(
                                        targetColumn.accessor,
                                    ).toLowerCase();
                                    realAccessorForSelect = realAccessor;

                                    // Check if processedValue is a valid exact match (already lowercased if valid)
                                    const allowed =
                                        kind === 'status'
                                            ? STATUS_VALID_VALUES
                                            : PRIORITY_VALID_VALUES;
                                    const isExactMatch =
                                        processedValue &&
                                        allowed.includes(processedValue as any);

                                    if (isExactMatch && processedValue) {
                                        // Valid exact match: processedValue is already lowercase
                                        // Save to natural field AND to properties (JSONB is source of truth)
                                        (targetRow as any)[realAccessor] = processedValue;

                                        // Also save to properties so JSONB is always the source of truth
                                        if (
                                            !(targetRow as any).properties ||
                                            typeof (targetRow as any).properties !==
                                                'object'
                                        ) {
                                            (targetRow as any).properties = {};
                                        }
                                        const props = (targetRow as any)
                                            .properties as Record<string, unknown>;
                                        props[kind] = {
                                            key: kind,
                                            type: 'select',
                                            value: processedValue,
                                            position: targetColumn.position ?? 0,
                                        };

                                        // Log valid value accepted
                                        console.log(
                                            `[ValidSelect] Accepted valid ${kind}: "${processedValue}"`,
                                        );
                                    } else if (processedValue) {
                                        // Invalid value: log and store in properties
                                        console.log(
                                            `[InvalidSelect] Detected invalid ${kind}: "${processedValue}"`,
                                        );
                                        // Invalid value: store ONLY in properties, NEVER in natural field
                                        // Initialize properties if needed
                                        if (
                                            !(targetRow as any).properties ||
                                            typeof (targetRow as any).properties !==
                                                'object'
                                        ) {
                                            (targetRow as any).properties = {};
                                        }
                                        const props = (targetRow as any)
                                            .properties as Record<string, unknown>;
                                        props[kind] = {
                                            key: kind,
                                            type: 'select',
                                            value: processedValue,
                                            position: targetColumn.position ?? 0,
                                        };
                                        // CRITICAL: Do NOT write to natural field (row.status/row.priority) for invalid values
                                        // This prevents 22P02 Postgres enum errors
                                        // Explicitly ensure the natural field is NOT set for invalid values
                                        if (
                                            (targetRow as any)[realAccessor] !== undefined
                                        ) {
                                            delete (targetRow as any)[realAccessor];
                                        }

                                        // TASK 1: Immediately update localData to show invalid value instantly
                                        setLocalData((prevData) => {
                                            const rowIndex = prevData.findIndex(
                                                (r) => r.id === targetRow.id,
                                            );
                                            if (rowIndex !== -1) {
                                                const updatedData = [...prevData];
                                                updatedData[rowIndex] = {
                                                    ...prevData[rowIndex],
                                                    properties: {
                                                        ...(prevData[rowIndex]
                                                            .properties as object),
                                                        [kind]: props[kind],
                                                    },
                                                };
                                                // Update ref immediately
                                                localDataRef.current = updatedData;
                                                // Trigger immediate grid redraw
                                                setTimeout(() => {
                                                    if (gridRef.current) {
                                                        gridRef.current.updateCells([]);
                                                    }
                                                }, 0);
                                                return updatedData;
                                            }
                                            return prevData;
                                        });
                                    }

                                    try {
                                        console.debug('FixPasteAccessor', {
                                            header: targetColumn.header,
                                            incomingAccessor: targetColumn.accessor,
                                            realAccessor,
                                            isExactMatch,
                                            storedInProperties:
                                                !isExactMatch && !!processedValue,
                                        });
                                    } catch {
                                        // swallow any debug errors
                                    }
                                }

                                if (!selectDebugLogged) {
                                    try {
                                        console.log('DEBUG-PASTE-SELECT:', {
                                            operationId,
                                            header: targetColumn.header,
                                            accessor: String(targetColumn.accessor),
                                            trimmedValue,
                                            processedValue,
                                        });
                                    } catch {
                                        // swallow any debug errors
                                    }
                                    selectDebugLogged = true;
                                }
                                break;
                            }
                            case 'text':
                            default:
                                processedValue = trimmedValue;
                                break;
                        }

                        // Check if this is a dynamic column
                        const isDynamicColumn =
                            targetColumn.id && targetColumn.id.startsWith('temp-');

                        if (isDynamicColumn) {
                            const tempAccessor = String(targetColumn.accessor);

                            // ensures dynamic column values appear instantly in the UI
                            (targetRow as any)[tempAccessor] = processedValue;

                            // track in dynamicColumnData for backend persistence
                            dynamicColumnData[tempAccessor] = processedValue;

                            if (
                                targetColumn.id &&
                                !tempColumnIds.includes(targetColumn.id)
                            ) {
                                tempColumnIds.push(targetColumn.id);
                            }

                            console.debug(`[${operationId}] Added dynamic column data:`, {
                                rowId: targetRow.id,
                                columnId: targetColumn.id,
                                accessor: tempAccessor,
                                value: processedValue,
                                isEmpty: processedValue === '',
                            });
                        } else {
                            // Standard column - update row immediately
                            // BUT: For invalid Status/Priority, we already wrote to properties above,
                            // so skip writing to the real column here
                            const kind =
                                detectStatusOrPriorityColumn(
                                    targetColumn as EditableColumn<T>,
                                ) ?? null;
                            const shouldSkipRealColumn =
                                kind != null &&
                                processedValue &&
                                !isValidStatusOrPriority(kind, processedValue);

                            if (!shouldSkipRealColumn) {
                                const accessorKey =
                                    realAccessorForSelect ??
                                    String(targetColumn.accessor);
                                (targetRow as any)[accessorKey] = processedValue;
                            } else {
                                // Double-check: ensure invalid Status/Priority values are NOT in natural field
                                if (kind != null) {
                                    const realAccessor = String(
                                        targetColumn.accessor,
                                    ).toLowerCase();
                                    if ((targetRow as any)[realAccessor] !== undefined) {
                                        delete (targetRow as any)[realAccessor];
                                    }
                                }
                            }
                        }
                        rowHasChanges = true;
                    }

                    // Add row to appropriate collection
                    // track it separately in dynamicColumnData for backend persistence with real accessors
                    if (isNewRow) {
                        // Dynamic column data is already added to targetRow above
                        if (tempColumnIds.length > 0) {
                            // New row with dynamic columns - track separately for deferred save
                            newRowsWithDynamicColumns.push({
                                row: targetRow,
                                dynamicColumnData,
                                tempColumnIds,
                            });
                        } else {
                            // New row with only standard columns
                            newRowsToCreate.push(targetRow);
                        }
                    } else if (rowHasChanges) {
                        if (tempColumnIds.length > 0) {
                            rowsWithDynamicColumns.set(targetRow.id, {
                                row: targetRow,
                                dynamicColumnData,
                                tempColumnIds,
                            });
                        } else {
                            // Updated row with only standard columns
                            updatedRows.set(targetRow.id, targetRow);
                        }

                        // Track changes for editing buffer
                        // both standard and dynamic column data
                        const changes: Partial<T> = {};
                        for (
                            let cellIndex = 0;
                            cellIndex < clipboardCells.length;
                            cellIndex++
                        ) {
                            if (cellIndex >= pasteTargetColumns.length) {
                                break;
                            }
                            const targetInfo = pasteTargetColumns[cellIndex];
                            if (!targetInfo) continue;
                            const { column: targetColumn } = targetInfo;
                            if (!targetColumn) continue;

                            const kind =
                                detectStatusOrPriorityColumn(
                                    targetColumn as EditableColumn<T>,
                                ) ?? null;
                            const accessor =
                                kind != null
                                    ? String(targetColumn.accessor).toLowerCase()
                                    : String(targetColumn.accessor);

                            // For Status/Priority: ensure invalid values are read from properties, not natural field
                            if (kind != null) {
                                const rawValue = (targetRow as any)[accessor];
                                const isValid = isValidStatusOrPriority(kind, rawValue);

                                if (!isValid && rawValue) {
                                    // Invalid value: read from properties instead of natural field
                                    const props = (targetRow as any).properties as
                                        | Record<string, any>
                                        | undefined;
                                    const propValue = props?.[kind]?.value;

                                    if (propValue !== undefined) {
                                        // Use value from properties, ensure natural field is not in changes
                                        (changes as any)[accessor] = undefined;
                                        // Don't include invalid values in editingUpdates natural field
                                        console.debug(
                                            '[FixAccessor-block-invalid] Blocking invalid value from editingUpdates natural field',
                                            {
                                                kind,
                                                header: targetColumn.header,
                                                rawValue,
                                                propValue,
                                            },
                                        );
                                        continue; // Skip adding to changes
                                    } else {
                                        // No properties override, ensure natural field is cleared
                                        (changes as any)[accessor] = undefined;
                                        continue;
                                    }
                                } else {
                                    // Valid value: use from natural field
                                    (changes as any)[accessor] = rawValue;
                                }
                            } else {
                                // Non Status/Priority: use normal value
                                (changes as any)[accessor] = (targetRow as any)[accessor];
                            }
                        }
                        editingUpdates[targetRow.id] = changes;
                    }
                }

                setLocalData((prevData) => {
                    const updatedData = [...prevData];

                    console.debug(`[${operationId}] Updating localData:`, {
                        prevCount: prevData.length,
                        updatedRowsCount: updatedRows.size,
                        rowsWithDynamicCount: rowsWithDynamicColumns.size,
                        newRowsCount: newRowsToCreate.length,
                        newRowsWithDynamicCount: newRowsWithDynamicColumns.length,
                        columnsCount: localColumnsRef.current.length,
                    });

                    // Update existing rows with standard columns only
                    updatedRows.forEach((updatedRow, rowId) => {
                        const index = updatedData.findIndex((row) => row.id === rowId);
                        if (index !== -1) {
                            // FixAccessor guard: ensure invalid Status/Priority values are not in natural fields
                            const sanitizedRow = { ...updatedRow };
                            for (const kind of ['status', 'priority'] as const) {
                                const accessor = kind;
                                const rawValue = (sanitizedRow as any)[accessor];
                                if (rawValue !== undefined) {
                                    const isValid = isValidStatusOrPriority(
                                        kind,
                                        rawValue,
                                    );
                                    if (!isValid) {
                                        // Invalid value: remove from natural field, ensure it's only in properties
                                        delete (sanitizedRow as any)[accessor];
                                        if (!sanitizedRow.properties) {
                                            (sanitizedRow as any).properties = {};
                                        }
                                        const props = sanitizedRow.properties as Record<
                                            string,
                                            any
                                        >;
                                        if (!props[kind]) {
                                            props[kind] = {
                                                key: kind,
                                                type: 'select',
                                                value: rawValue,
                                                position: 0,
                                            };
                                        }
                                        console.debug(
                                            '[FixAccessor-block-invalid] Removed invalid value from natural field in setLocalData',
                                            {
                                                kind,
                                                rowId,
                                                rawValue,
                                            },
                                        );
                                    }
                                }
                            }
                            updatedData[index] = sanitizedRow;
                        } else {
                            console.warn(
                                `[${operationId}] Row ${rowId} not found in localData for update`,
                            );
                        }
                    });

                    // Update existing rows with dynamic columns (already includes dynamic column data in row object)
                    rowsWithDynamicColumns.forEach(({ row }, rowId) => {
                        const index = updatedData.findIndex((r) => r.id === rowId);
                        if (index !== -1) {
                            // FixAccessor guard: ensure invalid Status/Priority values are not in natural fields
                            const sanitizedRow = { ...row };
                            for (const kind of ['status', 'priority'] as const) {
                                const accessor = kind;
                                const rawValue = (sanitizedRow as any)[accessor];
                                if (rawValue !== undefined) {
                                    const isValid = isValidStatusOrPriority(
                                        kind,
                                        rawValue,
                                    );
                                    if (!isValid) {
                                        // Invalid value: remove from natural field, ensure it's only in properties
                                        delete (sanitizedRow as any)[accessor];
                                        if (!sanitizedRow.properties) {
                                            (sanitizedRow as any).properties = {};
                                        }
                                        const props = sanitizedRow.properties as Record<
                                            string,
                                            any
                                        >;
                                        if (!props[kind]) {
                                            props[kind] = {
                                                key: kind,
                                                type: 'select',
                                                value: rawValue,
                                                position: 0,
                                            };
                                        }
                                        console.debug(
                                            '[FixAccessor-block-invalid] Removed invalid value from natural field in setLocalData (dynamic)',
                                            {
                                                kind,
                                                rowId,
                                                rawValue,
                                            },
                                        );
                                    }
                                }
                            }
                            const dynamicKeys = Object.keys(sanitizedRow).filter((key) =>
                                newColumnsToCreate.some((col) => {
                                    const tempAccessor = col.name
                                        .toLowerCase()
                                        .replace(/\s+/g, '_');
                                    return key === tempAccessor;
                                }),
                            );
                            if (dynamicKeys.length > 0) {
                                console.debug(
                                    `[${operationId}] Row ${rowId} has dynamic column data:`,
                                    dynamicKeys,
                                    dynamicKeys.map((k) => ({
                                        key: k,
                                        value: (sanitizedRow as any)[k],
                                    })),
                                );
                            }
                            updatedData[index] = sanitizedRow;
                        } else {
                            console.warn(
                                `[${operationId}] Row ${rowId} not found in localData for dynamic update`,
                            );
                        }
                    });

                    // Append new rows with standard columns only
                    newRowsToCreate.forEach((newRow) => {
                        if (!updatedData.some((row) => row.id === newRow.id)) {
                            // FixAccessor guard: ensure invalid Status/Priority values are not in natural fields
                            const sanitizedRow = { ...newRow };
                            for (const kind of ['status', 'priority'] as const) {
                                const accessor = kind;
                                const rawValue = (sanitizedRow as any)[accessor];
                                if (rawValue !== undefined) {
                                    const isValid = isValidStatusOrPriority(
                                        kind,
                                        rawValue,
                                    );
                                    if (!isValid) {
                                        // Invalid value: remove from natural field, ensure it's only in properties
                                        delete (sanitizedRow as any)[accessor];
                                        if (!sanitizedRow.properties) {
                                            (sanitizedRow as any).properties = {};
                                        }
                                        const props = sanitizedRow.properties as Record<
                                            string,
                                            any
                                        >;
                                        if (!props[kind]) {
                                            props[kind] = {
                                                key: kind,
                                                type: 'select',
                                                value: rawValue,
                                                position: 0,
                                            };
                                        }
                                        console.debug(
                                            '[FixAccessor-block-invalid] Removed invalid value from natural field in setLocalData (new row)',
                                            {
                                                kind,
                                                rowId: sanitizedRow.id,
                                                rawValue,
                                            },
                                        );
                                    }
                                }
                            }
                            updatedData.push(sanitizedRow);
                        } else {
                            console.warn(
                                `[${operationId}] New row ${newRow.id} already exists in localData`,
                            );
                        }
                    });

                    // Append new rows with dynamic columns
                    newRowsWithDynamicColumns.forEach(({ row }) => {
                        if (!updatedData.some((r) => r.id === row.id)) {
                            // FixAccessor guard: ensure invalid Status/Priority values are not in natural fields
                            const sanitizedRow = { ...row };
                            for (const kind of ['status', 'priority'] as const) {
                                const accessor = kind;
                                const rawValue = (sanitizedRow as any)[accessor];
                                if (rawValue !== undefined) {
                                    const isValid = isValidStatusOrPriority(
                                        kind,
                                        rawValue,
                                    );
                                    if (!isValid) {
                                        // Invalid value: remove from natural field, ensure it's only in properties
                                        delete (sanitizedRow as any)[accessor];
                                        if (!sanitizedRow.properties) {
                                            (sanitizedRow as any).properties = {};
                                        }
                                        const props = sanitizedRow.properties as Record<
                                            string,
                                            any
                                        >;
                                        if (!props[kind]) {
                                            props[kind] = {
                                                key: kind,
                                                type: 'select',
                                                value: rawValue,
                                                position: 0,
                                            };
                                        }
                                        console.debug(
                                            '[FixAccessor-block-invalid] Removed invalid value from natural field in setLocalData (new dynamic row)',
                                            {
                                                kind,
                                                rowId: sanitizedRow.id,
                                                rawValue,
                                            },
                                        );
                                    }
                                }
                            }
                            const dynamicKeys = Object.keys(sanitizedRow).filter((key) =>
                                newColumnsToCreate.some((col) => {
                                    const tempAccessor = col.name
                                        .toLowerCase()
                                        .replace(/\s+/g, '_');
                                    return key === tempAccessor;
                                }),
                            );
                            if (dynamicKeys.length > 0) {
                                console.debug(
                                    `[${operationId}] New row ${sanitizedRow.id} has dynamic column data:`,
                                    dynamicKeys,
                                    dynamicKeys.map((k) => ({
                                        key: k,
                                        value: (sanitizedRow as any)[k],
                                    })),
                                );
                            }
                            updatedData.push(sanitizedRow);
                        } else {
                            console.warn(
                                `[${operationId}] New row ${row.id} already exists in localData`,
                            );
                        }
                    });

                    // Sort by position
                    const sorted = updatedData.sort((a, b) => {
                        const posA = a.position ?? 0;
                        const posB = b.position ?? 0;
                        return posA - posB;
                    });

                    console.debug(`[${operationId}] localData update complete:`, {
                        finalCount: sorted.length,
                        columnsCount: localColumnsRef.current.length,
                    });

                    console.log(
                        `[${operationId}] Columns:`,
                        localColumnsRef.current.map((c) => ({
                            id: c.id,
                            header: c.header,
                            accessor: c.accessor,
                            isDynamic: c.id?.startsWith('temp-'),
                        })),
                    );

                    console.log(
                        `[${operationId}] Row data (first 3 rows):`,
                        sorted.slice(0, 3).map((r) => ({
                            id: r.id,
                            keys: Object.keys(r),
                            dynamicKeys: Object.keys(r).filter((k) =>
                                localColumnsRef.current.some(
                                    (c) => c.id?.startsWith('temp-') && c.accessor === k,
                                ),
                            ),
                        })),
                    );

                    localColumnsRef.current
                        .filter((c) => c.id?.startsWith('temp-'))
                        .forEach((c) => {
                            const accessor = String(c.accessor);
                            const values = sorted.map((r) => (r as any)[accessor]);
                            console.log(
                                `[${operationId}] Column ${c.header} (${accessor}):`,
                                values,
                            );
                        });

                    return sorted;
                });

                if (Object.keys(editingUpdates).length > 0) {
                    try {
                        const editingUpdateAccessorsByRow = Object.fromEntries(
                            Object.entries(editingUpdates).map(([rowId, changes]) => [
                                rowId,
                                Object.keys(changes || {}),
                            ]),
                        );
                        console.log('DEBUG-PASTE-EDITING-UPDATES:', {
                            operationId,
                            rows: editingUpdateAccessorsByRow,
                        });
                    } catch {
                        // swallow any debug errors
                    }

                    setEditingData((prev) => ({
                        ...prev,
                        ...editingUpdates,
                    }));
                    editingDataRef.current = {
                        ...editingDataRef.current,
                        ...editingUpdates,
                    };
                }

                setLocalColumns((prev) => {
                    const sorted = [...prev].sort(
                        (a, b) => (a.position ?? 0) - (b.position ?? 0),
                    );
                    const normalized = sorted.map((col, idx) => ({
                        ...col,
                        position: idx,
                    }));
                    localColumnsRef.current =
                        normalized as typeof localColumnsRef.current;
                    return normalized as typeof prev;
                });

                // ensures the DataEditor re-renders with new columns and data
                requestAnimationFrame(() => {
                    if (gridRef.current) {
                        // Update all cells to force grid refresh
                        gridRef.current.updateCells([]);
                        console.log(`[${operationId}] Grid invalidated after paste`);
                    }
                });

                // Clearing selection too early causes first-paste collapse
                setSelection(undefined);
                selectionRef.current = undefined;
                setGridSelection({
                    rows: CompactSelection.empty(),
                    columns: CompactSelection.empty(),
                });

                // --- FIX: Prevent Fast Refresh during paste ---
                if (typeof window !== 'undefined') {
                    (window as any).__PASTE_IN_PROGRESS__ = true;
                }

                // Start immediate save sequence
                console.log(`[Paste] Start: ${validClipboardRows.length} rows`);
                (async () => {
                    try {
                        // --- FIX: Ensure document context is ready before saves ---
                        if (!blockId) {
                            throw new Error('blockId is required for paste save');
                        }

                        // Wait for document context to be available
                        // Note: documentId should come from props or parent context
                        // For now, we validate blockId is available (documentId is handled in saveRequirement)
                        const ensureDocumentContextReady = async (): Promise<void> => {
                            // Verify blockId is valid (not undefined string)
                            if (
                                !blockId ||
                                blockId === 'undefined' ||
                                blockId === 'null'
                            ) {
                                throw new Error(`Invalid blockId: ${blockId}`);
                            }
                            // Small delay to ensure context is stable
                            await new Promise((resolve) => setTimeout(resolve, 50));
                        };

                        // Wait for columns to be in sync
                        const ensureColumnsInSync = async (
                            localCols: typeof localColumnsRef.current,
                            propsCols: typeof columns,
                        ): Promise<void> => {
                            const maxWait = 2000; // 2 seconds max
                            const start = Date.now();
                            while (Date.now() - start < maxWait) {
                                const localCount = localCols.length;
                                const propsCount = propsCols.filter(
                                    (col) =>
                                        !isExpectedResultColumn(
                                            col as unknown as EditableColumn<BaseRow>,
                                        ),
                                ).length;
                                if (localCount === propsCount && localCount > 0) {
                                    return; // Columns are in sync
                                }
                                await new Promise((resolve) => setTimeout(resolve, 50));
                            }
                            console.warn(
                                '[paste_sync] Columns did not sync within timeout, proceeding anyway',
                            );
                        };

                        await ensureDocumentContextReady();
                        await ensureColumnsInSync(localColumnsRef.current, columns);
                        await new Promise((resolve) => setTimeout(resolve, 150));

                        await waitForSupabaseClient();

                        const BATCH_SIZE = 20;
                        const tempAccessorToRealAccessorMap = new Map<string, string>();
                        const hasDynamicColumns =
                            rowsWithDynamicColumns.size > 0 ||
                            newRowsWithDynamicColumns.length > 0;
                        let updatedLocalDataRows: T[] = [];
                        let remappedRows: T[] = []; // Declare at function scope so it's available for save phase
                        let remapEndTime: number | undefined; // Track when remap completes for timing comparison

                        if (hasDynamicColumns && pasteState.columnCreationPromise) {
                            console.log(
                                `[paste_sync] Waiting for all dynamic columns to finish before remapping...`,
                            );

                            const columnResults = await pasteState.columnCreationPromise;
                            const successfulColumns = columnResults.filter(
                                (r) => r.success,
                            ).length;
                            console.log(
                                `[paste_sync][${operationId}] All dynamic columns created (${successfulColumns} columns)`,
                            );

                            console.log(
                                `[paste_sync][${operationId}] Adding 300ms delay to allow state to sync...`,
                            );
                            await new Promise((r) => setTimeout(r, 300));
                            console.log(
                                `[paste_sync][${operationId}] Delay complete, columns should be ready for row data save`,
                            );

                            // Persist stable column order immediately after column creation
                            console.log(
                                `[paste_sync][${operationId}] Saving table metadata to persist column order...`,
                            );
                            try {
                                // Paste sync after column creation: include columns to save new column order
                                await requestMetadataSave({
                                    columns: true,
                                    rows: false,
                                    immediate: true,
                                });
                                console.log(
                                    `[paste_sync][${operationId}] Table metadata saved (column order persisted)`,
                                );
                            } catch (error) {
                                console.error(
                                    `[paste_sync][${operationId}] Failed to save table metadata:`,
                                    error,
                                );
                            }

                            // Build mapping from temp accessor to real accessor for confirmed columns
                            // Get all current local columns to check for renamed ones
                            const currentLocalColumns = localColumnsRef.current;
                            const renamedColumnsInLocal = currentLocalColumns.filter(
                                (col) => {
                                    // Check if column header doesn't match its accessor (potential rename)
                                    return col.header !== String(col.accessor);
                                },
                            );

                            // Check if any renamed column accessor appears in mapping pairs
                            const renamedColumnAccessors = new Set(
                                renamedColumnsInLocal.map((c) => String(c.accessor)),
                            );
                            const renamedColumnHeaders = new Set(
                                renamedColumnsInLocal.map((c) => c.header),
                            );

                            columnResults.forEach((result, index) => {
                                if (
                                    result.success &&
                                    result.tempId &&
                                    'realAccessor' in result &&
                                    result.realAccessor
                                ) {
                                    // Get temp accessor from stored mapping (created when placeholder was made)
                                    const tempAccessor = tempIdToTempAccessor.get(
                                        result.tempId,
                                    );

                                    if (tempAccessor) {
                                        tempAccessorToRealAccessorMap.set(
                                            tempAccessor,
                                            result.realAccessor,
                                        );

                                        const isRenamedColumn =
                                            renamedColumnAccessors.has(
                                                result.realAccessor,
                                            ) ||
                                            renamedColumnHeaders.has(result.realAccessor);
                                        if (isRenamedColumn) {
                                            console.warn(
                                                `[mapping_debug][${operationId}] Renamed column detected in mapping pair ${index + 1}:`,
                                                {
                                                    tempAccessor,
                                                    realAccessor: result.realAccessor,
                                                    tempId: result.tempId,
                                                    isRenamedColumn: true,
                                                },
                                            );
                                        }

                                        console.log(
                                            `[mapping_pairs][${operationId}] Pair ${index + 1}: "${tempAccessor}" → "${result.realAccessor}" (tempId: ${result.tempId})`,
                                        );
                                    } else {
                                        console.warn(
                                            `[mapping_pairs][${operationId}] No temp accessor found for tempId "${result.tempId}" when mapping to real accessor "${result.realAccessor}"`,
                                        );
                                        const placeholderCol =
                                            localColumnsRef.current.find(
                                                (col) => col.id === result.tempId,
                                            );
                                        if (placeholderCol) {
                                            const fallbackTempAccessor = String(
                                                placeholderCol.accessor,
                                            );
                                            tempAccessorToRealAccessorMap.set(
                                                fallbackTempAccessor,
                                                result.realAccessor,
                                            );
                                            console.log(
                                                `[mapping_pairs][${operationId}] Fallback Pair ${index + 1}: "${fallbackTempAccessor}" → "${result.realAccessor}"`,
                                            );
                                        }
                                    }
                                } else {
                                    console.warn(
                                        `[mapping_pairs][${operationId}] Column creation result ${index + 1} missing required fields:`,
                                        {
                                            success: result.success,
                                            tempId: result.tempId,
                                            hasRealAccessor: 'realAccessor' in result,
                                            realAccessor: result.realAccessor,
                                        },
                                    );
                                }
                            });

                            // Log complete mapping with clear structure
                            // Build mapping entries for remapping (no verbose logging)
                            const mappingEntries = Array.from(
                                tempAccessorToRealAccessorMap.entries(),
                            );

                            const expectedTempAccessors = Array.from(
                                tempIdToTempAccessor.values(),
                            );
                            const mappedTempAccessors = mappingEntries.map(
                                ([temp]) => temp,
                            );
                            const missingMappings = expectedTempAccessors.filter(
                                (temp) => !mappedTempAccessors.includes(temp),
                            );

                            const incompleteRealAccessors = mappingEntries.filter(
                                ([temp, real]) =>
                                    real.startsWith('temp-') || real === temp,
                            );

                            if (incompleteRealAccessors.length > 0) {
                                console.warn(
                                    `[paste_sync] Some accessors still temporary, delaying remap...`,
                                    incompleteRealAccessors,
                                );
                                // Wait additional time for columns to fully propagate
                                await new Promise((r) => setTimeout(r, 300));
                                // Re-check after delay
                                const recheckIncomplete = Array.from(
                                    tempAccessorToRealAccessorMap.entries(),
                                ).filter(
                                    ([temp, real]) =>
                                        real.startsWith('temp-') || real === temp,
                                );
                                if (recheckIncomplete.length > 0) {
                                    console.error(
                                        `[paste_sync] Still incomplete after delay:`,
                                        recheckIncomplete,
                                    );
                                }
                            }

                            if (missingMappings.length > 0) {
                                console.warn(
                                    `[${operationId}] Missing mappings for ${missingMappings.length} temp accessors:`,
                                    missingMappings,
                                );
                            } else if (expectedTempAccessors.length > 0) {
                                console.debug(
                                    `[${operationId}] All ${expectedTempAccessors.length} temp accessors have real accessor mappings.`,
                                );
                            }

                            if (successfulColumns === 0) {
                                console.warn(
                                    `[${operationId}] No columns were created successfully. Dynamic column data may not be saved.`,
                                );
                            }

                            const finalMappingEntries = Array.from(
                                tempAccessorToRealAccessorMap.entries(),
                            );
                            const finalExpectedTempAccessors = Array.from(
                                tempIdToTempAccessor.values(),
                            );
                            const finalMappedTempAccessors = finalMappingEntries.map(
                                ([temp]) => temp,
                            );
                            const finalMissingMappings =
                                finalExpectedTempAccessors.filter(
                                    (temp) => !finalMappedTempAccessors.includes(temp),
                                );

                            if (finalMissingMappings.length > 0) {
                                console.error(
                                    `[paste_sync] Cannot proceed with remap: Missing ${finalMissingMappings.length} mappings:`,
                                    finalMissingMappings,
                                );
                                console.error(
                                    `[paste_sync] Expected temp accessors:`,
                                    finalExpectedTempAccessors,
                                );
                                console.error(
                                    `[paste_sync] Mapped temp accessors:`,
                                    finalMappedTempAccessors,
                                );
                                return;
                            }

                            const finalIncompleteRealAccessors =
                                finalMappingEntries.filter(
                                    ([temp, real]) =>
                                        real.startsWith('temp-') ||
                                        real === temp ||
                                        !real ||
                                        real.trim() === '',
                                );
                            if (finalIncompleteRealAccessors.length > 0) {
                                console.error(
                                    `[paste_sync] Cannot proceed with remap: ${finalIncompleteRealAccessors.length} real accessors still temporary:`,
                                    finalIncompleteRealAccessors,
                                );
                                return;
                            }

                            console.log(
                                `[paste_sync] Verified mapping keys:`,
                                Array.from(tempAccessorToRealAccessorMap.keys()),
                            );
                            console.log(
                                `[paste_sync] All dynamic columns ready, proceeding with remap...`,
                            );

                            const remapStartTime = Date.now();
                            console.log(
                                `[remap_debug][${operationId}] STARTING remap at t=${remapStartTime}`,
                            );

                            // Log mapping pairs before remapping
                            const mappingPairs = Array.from(
                                tempAccessorToRealAccessorMap.entries(),
                            );
                            console.log(
                                `[mapping_pairs][${operationId}] Mapping pairs (${mappingPairs.length} total):`,
                                mappingPairs.map(([temp, real]) => ({ temp, real })),
                            );

                            // Collect all rows that need remapping
                            const allAffectedRows: T[] = [
                                ...updatedRows.values(),
                                ...newRowsToCreate,
                                ...Array.from(rowsWithDynamicColumns.values()).map(
                                    ({ row }) => row,
                                ),
                                ...newRowsWithDynamicColumns.map(({ row }) => row),
                            ];

                            console.log(
                                `[remap_debug][${operationId}] Collected ${allAffectedRows.length} rows for remapping`,
                            );

                            if (allAffectedRows.length > 0) {
                                const firstRow = allAffectedRows[0];
                                const firstRowKeys = Object.keys(firstRow);
                                const firstRowTempKeys = firstRowKeys.filter(
                                    (key) =>
                                        tempAccessorToRealAccessorMap.has(key) &&
                                        tempAccessorToRealAccessorMap.get(key) !== key,
                                );
                                console.log(
                                    `[remap_debug][${operationId}] FIRST ROW BEFORE REMAP (id=${firstRow.id}):`,
                                    {
                                        allKeys: firstRowKeys,
                                        tempKeys: firstRowTempKeys,
                                        tempKeyValues: firstRowTempKeys.map((k) => ({
                                            key: k,
                                            value: (firstRow as any)[k],
                                        })),
                                    },
                                );
                            }

                            // Remap temp accessors to real accessors in each row
                            remappedRows = allAffectedRows.map((row, rowIndex) => {
                                const remapped = { ...row };
                                let remappedCount = 0;
                                const remappedPairs: Array<{
                                    temp: string;
                                    real: string;
                                    value: any;
                                }> = [];

                                // Log row keys before remapping for this specific row
                                const rowKeysBefore = Object.keys(remapped);
                                const matchingTempKeys = rowKeysBefore.filter((key) =>
                                    tempAccessorToRealAccessorMap.has(key),
                                );
                                if (rowIndex === 0 && matchingTempKeys.length > 0) {
                                    console.log(
                                        `[remap_debug][${operationId}] Row ${row.id} keys that match mapping:`,
                                        matchingTempKeys,
                                    );
                                    matchingTempKeys.forEach((key) => {
                                        const mappedReal =
                                            tempAccessorToRealAccessorMap.get(key);
                                        console.log(
                                            `[remap_debug][${operationId}]   "${key}" → "${mappedReal}" (value: ${(remapped as any)[key]})`,
                                        );
                                    });
                                }

                                // Replace all temp accessors with real accessors
                                for (const [
                                    tempAccessor,
                                    realAccessor,
                                ] of tempAccessorToRealAccessorMap.entries()) {
                                    const hasProperty = (remapped as any).hasOwnProperty(
                                        tempAccessor,
                                    );
                                    if (rowIndex === 0) {
                                        console.debug(
                                            `[remap_debug][${operationId}] Checking "${tempAccessor}" → "${realAccessor}": hasProperty=${hasProperty}, value=${hasProperty ? (remapped as any)[tempAccessor] : 'N/A'}`,
                                        );
                                    }

                                    if (tempAccessor !== realAccessor && hasProperty) {
                                        if (
                                            !realAccessor ||
                                            realAccessor.startsWith('temp-') ||
                                            realAccessor === tempAccessor
                                        ) {
                                            console.error(
                                                `[remap_debug][${operationId}] Invalid real accessor for "${tempAccessor}": "${realAccessor}"`,
                                            );
                                            continue;
                                        }

                                        const value = (remapped as any)[tempAccessor];
                                        // Copy value from temp to real accessor
                                        (remapped as any)[realAccessor] = value;
                                        // Remove temp accessor
                                        delete (remapped as any)[tempAccessor];
                                        remappedCount++;
                                        remappedPairs.push({
                                            temp: tempAccessor,
                                            real: realAccessor,
                                            value,
                                        });

                                        if (rowIndex === 0) {
                                            console.log(
                                                `[remap_debug][${operationId}] Remapped "${tempAccessor}" → "${realAccessor}" with value:`,
                                                value,
                                            );
                                        }
                                    }
                                }

                                const remainingTempKeys = Object.keys(remapped).filter(
                                    (key) =>
                                        tempAccessorToRealAccessorMap.has(key) &&
                                        tempAccessorToRealAccessorMap.get(key) !== key,
                                );
                                if (remainingTempKeys.length > 0) {
                                    console.error(
                                        `[remap_debug][${operationId}] Row ${row.id} still has temp accessors after remapping:`,
                                        remainingTempKeys,
                                    );
                                    console.error(
                                        `[remap_debug][${operationId}] Row keys:`,
                                        Object.keys(remapped),
                                    );
                                    console.error(
                                        `[remap_debug][${operationId}] Available mappings:`,
                                        Array.from(
                                            tempAccessorToRealAccessorMap.entries(),
                                        ),
                                    );
                                }

                                if (remappedCount > 0) {
                                    console.debug(
                                        `[remap_debug][${operationId}] Remapped ${remappedCount} accessors in row ${row.id}:`,
                                        remappedPairs,
                                    );
                                }

                                return remapped;
                            });

                            if (remappedRows.length > 0) {
                                const firstRemappedRow = remappedRows[0];
                                const firstRemappedKeys = Object.keys(firstRemappedRow);
                                const firstRemappedTempKeys = firstRemappedKeys.filter(
                                    (key) =>
                                        tempAccessorToRealAccessorMap.has(key) &&
                                        tempAccessorToRealAccessorMap.get(key) !== key,
                                );
                                const firstRemappedRealKeys = firstRemappedKeys.filter(
                                    (key) => {
                                        const mappedReal = Array.from(
                                            tempAccessorToRealAccessorMap.values(),
                                        );
                                        return mappedReal.includes(key);
                                    },
                                );
                                console.log(
                                    `[remap_debug][${operationId}] FIRST ROW AFTER REMAP (id=${firstRemappedRow.id}):`,
                                    {
                                        allKeys: firstRemappedKeys,
                                        tempKeysRemaining: firstRemappedTempKeys,
                                        realKeysAdded: firstRemappedRealKeys,
                                        realKeyValues: firstRemappedRealKeys.map((k) => ({
                                            key: k,
                                            value: (firstRemappedRow as any)[k],
                                        })),
                                    },
                                );
                            }

                            remapEndTime = Date.now();

                            if (remappedRows.length > 0) {
                                const sampleRow = remappedRows[0];
                                const sampleKeys = Object.keys(sampleRow);
                                const sampleTempKeys = sampleKeys.filter(
                                    (key) =>
                                        tempAccessorToRealAccessorMap.has(key) &&
                                        tempAccessorToRealAccessorMap.get(key) !== key,
                                );
                                const sampleRealKeys = sampleKeys.filter((key) => {
                                    const mappedReal = Array.from(
                                        tempAccessorToRealAccessorMap.values(),
                                    );
                                    return mappedReal.includes(key);
                                });
                                console.log(
                                    `[remap_debug][${operationId}] Sample remapped row (id=${sampleRow.id}):`,
                                    {
                                        totalKeys: sampleKeys.length,
                                        tempKeysRemaining: sampleTempKeys.length,
                                        realKeysFound: sampleRealKeys.length,
                                        realKeys: sampleRealKeys,
                                    },
                                );

                                if (sampleTempKeys.length > 0) {
                                    console.error(
                                        `[remap_debug][${operationId}] CRITICAL: Sample row still has ${sampleTempKeys.length} temp keys after remap:`,
                                        sampleTempKeys,
                                    );
                                } else {
                                    console.log(
                                        `[remap_debug][${operationId}] Sample row has NO temp keys - remap successful`,
                                    );
                                }
                            }

                            // Update localData with remapped rows
                            setLocalData((prevData) => {
                                // Create a map of remapped rows by ID for quick lookup
                                const remappedMap = new Map(
                                    remappedRows.map((r) => [r.id, r]),
                                );

                                const updated = prevData.map(
                                    (row) => remappedMap.get(row.id) || row,
                                );

                                // Add any new rows that weren't in prevData
                                remappedRows.forEach((remappedRow) => {
                                    if (!updated.some((r) => r.id === remappedRow.id)) {
                                        updated.push(remappedRow);
                                    }
                                });

                                // Store for use in save phase
                                updatedLocalDataRows = updated;

                                return updated;
                            });

                            console.log(
                                `[paste_sync] Remapped temp accessors to real accessors (${remappedRows.length} rows)`,
                            );

                            await new Promise((resolve) => setTimeout(resolve, 0));

                            const afterRemapTime = Date.now();
                            console.log(
                                `[remap_debug][${operationId}] Remap phase complete at t=${afterRemapTime}, ready for save phase`,
                            );
                        } else if (!hasDynamicColumns) {
                            console.log(
                                `[paste_sync] No dynamic columns detected. Proceeding with immediate save.`,
                            );
                        }

                        if (hasDynamicColumns) {
                            const expectedTempAccessors = Array.from(
                                tempIdToTempAccessor.values(),
                            );
                            const mappingEntries = Array.from(
                                tempAccessorToRealAccessorMap.entries(),
                            );
                            const mappedTempAccessors = mappingEntries.map(
                                ([temp]) => temp,
                            );
                            const missingMappings = expectedTempAccessors.filter(
                                (temp) => !mappedTempAccessors.includes(temp),
                            );

                            const incompleteRealAccessors = mappingEntries.filter(
                                ([temp, real]) =>
                                    real.startsWith('temp-') ||
                                    real === temp ||
                                    !real ||
                                    real.trim() === '',
                            );

                            if (tempAccessorToRealAccessorMap.size === 0) {
                                console.error(
                                    `[paste_sync] Cannot save rows: Dynamic columns exist but mapping is empty`,
                                );
                                pasteState.isPasting = false;
                                pasteState.pasteOperationActive = false;
                                return;
                            }

                            if (missingMappings.length > 0) {
                                console.error(
                                    `[paste_sync] Cannot save rows: Missing mappings for ${missingMappings.length} temp accessors:`,
                                    missingMappings,
                                );
                                pasteState.isPasting = false;
                                pasteState.pasteOperationActive = false;
                                return;
                            }

                            if (incompleteRealAccessors.length > 0) {
                                console.error(
                                    `[paste_sync] Cannot save rows: ${incompleteRealAccessors.length} accessors still temporary:`,
                                    incompleteRealAccessors,
                                );
                                pasteState.isPasting = false;
                                pasteState.pasteOperationActive = false;
                                return;
                            }

                            console.log(
                                `[paste_sync] Mapping verified complete: ${mappingEntries.length} mappings ready`,
                            );
                        }

                        // Prepare all rows for saving
                        const allRowsToSave: Array<{
                            row: T;
                            isNew: boolean;
                            id: string;
                        }> = [];

                        // Collect all row IDs that need to be saved
                        const rowIdsToSave = new Set<string>();
                        updatedRows.forEach((_, rowId) => rowIdsToSave.add(rowId));
                        newRowsToCreate.forEach((row) => rowIdsToSave.add(row.id));
                        rowsWithDynamicColumns.forEach((_, rowId) =>
                            rowIdsToSave.add(rowId),
                        );
                        newRowsWithDynamicColumns.forEach(({ row }) =>
                            rowIdsToSave.add(row.id),
                        );

                        console.log(
                            `[paste_sync] Found ${rowIdsToSave.size} rows to save (${updatedRows.size} updated, ${newRowsToCreate.length} new standard, ${rowsWithDynamicColumns.size} updated dynamic, ${newRowsWithDynamicColumns.length} new dynamic)`,
                        );

                        if (rowIdsToSave.size === 0) {
                            console.log(
                                `[paste_sync] No rows to save, completing paste operation`,
                            );
                            pasteState.isPasting = false;
                            pasteState.pasteOperationActive = false;
                            return;
                        }

                        const saveStartTime = Date.now();

                        // Log column metadata before save
                        console.log(
                            `[save_debug][${operationId}] localColumnsRef.length=${localColumnsRef.current.length} before save`,
                        );
                        console.log(
                            `[save_debug][${operationId}] columns prop.length=${columns.length} before save`,
                        );

                        // Use remappedRows directly if available, otherwise fall back to updatedLocalDataRows or original collections
                        let rowsToUse: T[];
                        if (hasDynamicColumns) {
                            if (remappedRows.length > 0) {
                                console.log(
                                    `[save_debug][${operationId}] Using remappedRows directly (${remappedRows.length} rows with real accessors)`,
                                );
                                rowsToUse = remappedRows;
                            } else if (updatedLocalDataRows.length > 0) {
                                console.log(
                                    `[save_debug][${operationId}] Using updatedLocalDataRows (${updatedLocalDataRows.length} rows)`,
                                );
                                rowsToUse = updatedLocalDataRows;
                            } else {
                                console.warn(
                                    `[save_debug][${operationId}] No remapped rows available, using original collections`,
                                );
                                console.warn(
                                    `[save_debug][${operationId}] This may cause temp accessor errors!`,
                                );
                                rowsToUse = [
                                    ...updatedRows.values(),
                                    ...newRowsToCreate,
                                    ...Array.from(rowsWithDynamicColumns.values()).map(
                                        ({ row }) => row,
                                    ),
                                    ...newRowsWithDynamicColumns.map(({ row }) => row),
                                ];
                            }
                        } else {
                            rowsToUse = [
                                ...updatedRows.values(),
                                ...newRowsToCreate,
                                ...Array.from(rowsWithDynamicColumns.values()).map(
                                    ({ row }) => row,
                                ),
                                ...newRowsWithDynamicColumns.map(({ row }) => row),
                            ];
                        }

                        // Log first row in rowsToUse to verify it has real accessors
                        // Process all rows that need saving
                        Array.from(rowIdsToSave).forEach((rowId, index) => {
                            const row = rowsToUse.find((r) => r.id === rowId);
                            if (!row) {
                                console.warn(
                                    `[save_debug][${operationId}] Row ${rowId} not found in rows collection, skipping save`,
                                );
                                return;
                            }

                            // Only check for temp accessors if we have dynamic columns
                            if (hasDynamicColumns) {
                                const rowKeys = Object.keys(row);
                                const tempKeys = rowKeys.filter(
                                    (key) =>
                                        tempAccessorToRealAccessorMap.has(key) &&
                                        tempAccessorToRealAccessorMap.get(key) !== key,
                                );

                                if (tempKeys.length > 0) {
                                    console.error(
                                        `[save_debug][${operationId}] Row ${rowId} still has temp accessors at save time:`,
                                        tempKeys,
                                    );
                                    return;
                                }
                            }

                            // Determine if this is a new row
                            const isNew =
                                newRowsToCreate.some((r) => r.id === rowId) ||
                                newRowsWithDynamicColumns.some(
                                    ({ row: r }) => r.id === rowId,
                                );

                            allRowsToSave.push({ row, isNew, id: rowId });
                        });

                        if (allRowsToSave.length === 0) {
                            console.warn(
                                `[paste_sync][${operationId}] No valid rows to save after processing, completing paste operation`,
                            );
                            pasteState.isPasting = false;
                            pasteState.pasteOperationActive = false;
                            return;
                        }

                        // Save all rows immediately with await
                        const t1 = Date.now();

                        for (let i = 0; i < allRowsToSave.length; i += BATCH_SIZE) {
                            const batch = allRowsToSave.slice(i, i + BATCH_SIZE);
                            console.log(
                                `[paste_sync][${operationId}] Saving batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allRowsToSave.length / BATCH_SIZE)} (${batch.length} rows)...`,
                            );

                            await Promise.all(
                                batch.map(async ({ row, isNew, id }, batchIndex) => {
                                    try {
                                        const saveStart = Date.now();
                                        const payloadKeys = Object.keys(row);

                                        // Final check for temp accessors right before save
                                        if (hasDynamicColumns) {
                                            const tempKeysInPayload = payloadKeys.filter(
                                                (key) =>
                                                    tempAccessorToRealAccessorMap.has(
                                                        key,
                                                    ) &&
                                                    tempAccessorToRealAccessorMap.get(
                                                        key,
                                                    ) !== key,
                                            );

                                            if (tempKeysInPayload.length > 0) {
                                                console.error(
                                                    `[save_debug][${operationId}] CRITICAL: Row ${id} has temp accessors RIGHT BEFORE SAVE:`,
                                                    tempKeysInPayload,
                                                );
                                                console.error(
                                                    `[save_debug][${operationId}] Row payload keys:`,
                                                    payloadKeys,
                                                );
                                                console.error(
                                                    `[save_debug][${operationId}] Row object:`,
                                                    row,
                                                );
                                                throw new Error(
                                                    `Row ${id} still has temp accessors: ${tempKeysInPayload.join(', ')}`,
                                                );
                                            }

                                            // Log first row in batch with full details
                                            if (batchIndex === 0 && i === 0) {
                                                const realKeysInPayload =
                                                    payloadKeys.filter((k) => {
                                                        const mappedReal = Array.from(
                                                            tempAccessorToRealAccessorMap.values(),
                                                        );
                                                        return mappedReal.includes(k);
                                                    });
                                            }
                                        }

                                        const savePromise = saveRow(row, isNew, {
                                            blockId,
                                            skipRefresh: true,
                                        });
                                        pasteState.savePromises.set(id, savePromise);
                                        await savePromise;
                                        pasteState.savePromises.delete(id);
                                    } catch (err) {
                                        pasteState.savePromises.delete(id);
                                        console.error(
                                            `[paste_sync][${operationId}] ERROR saving row id=${id}`,
                                            err,
                                        );
                                        throw err;
                                    }
                                }),
                            );
                        }
                        const t2 = Date.now();
                        console.log(
                            `[paste_sync][${operationId}] All ${allRowsToSave.length} rows saved successfully (duration=${t2 - t1}ms)`,
                        );

                        // Wait for any remaining save promises to complete
                        const allSavePromises = Array.from(
                            pasteState.savePromises.values(),
                        );
                        if (allSavePromises.length > 0) {
                            console.log(
                                `[paste_sync][${operationId}] Waiting for ${allSavePromises.length} remaining save promises...`,
                            );
                            await Promise.allSettled(allSavePromises);
                            console.log(
                                `[paste_sync][${operationId}] All save promises resolved`,
                            );
                        }

                        // After all saves:
                        const t3 = Date.now();
                        console.debug(
                            `[paste_sync][${operationId}] done saving rows (duration=${t3 - t0}ms) -> calling onPostSave()`,
                        );

                        // Force save metadata before refresh to ensure row positions are persisted
                        const mdStart = Date.now();
                        try {
                            // Paste sync after row saves: do NOT include columns (only save row metadata)
                            // This prevents overwriting renamed column names with stale data
                            await requestMetadataSave({
                                rows: true,
                                columns: false,
                                immediate: true,
                            });
                            const mdDuration = Date.now() - mdStart;
                            console.debug(
                                `[paste_sync][${operationId}] saveTableMetadata done (duration=${mdDuration}ms)`,
                            );
                        } catch (error) {
                            const mdDuration = Date.now() - mdStart;
                            console.error(
                                `[paste_sync][${operationId}] saveTableMetadata failed (duration=${mdDuration}ms):`,
                                error,
                            );
                        }

                        // --- FIX: Only refresh AFTER all saves succeed ---
                        // Verify all saves completed successfully before refresh
                        const allSavesSucceeded =
                            allRowsToSave.length > 0 &&
                            Array.from(pasteState.savePromises.values()).length === 0;

                        if (!allSavesSucceeded) {
                            console.error(
                                `[paste_sync][${operationId}] Not all saves completed, skipping refresh`,
                                {
                                    expectedRows: allRowsToSave.length,
                                    remainingPromises: Array.from(
                                        pasteState.savePromises.values(),
                                    ).length,
                                },
                            );
                        }

                        // Clear paste flags BEFORE refresh to allow refresh to proceed
                        pasteState.isPasting = false;
                        pasteState.pasteOperationActive = false;
                        console.debug(
                            `[paste_sync][${operationId}] Paste flags cleared, allowing refresh`,
                        );

                        // Call onPostSave() ONLY if all saves succeeded
                        if (allSavesSucceeded) {
                            const postStart = Date.now();
                            try {
                                await refreshAfterSave(false);
                                const postDuration = Date.now() - postStart;
                                console.debug(
                                    `[paste_sync][${operationId}] onPostSave done (duration=${postDuration}ms)`,
                                );

                                // Step 2: Set post-paste stabilization flag after successful refresh
                                const localColumnCount = localColumnsRef.current.length;
                                console.debug(
                                    `[post_paste_sync][${operationId}] Setting isPostPasteStabilizing=true (localColumns=${localColumnCount})`,
                                );
                                setIsPostPasteStabilizing(true);

                                // Clear any existing timeout
                                if (postPasteStabilizationTimeoutRef.current) {
                                    clearTimeout(
                                        postPasteStabilizationTimeoutRef.current,
                                    );
                                }

                                // Set timeout to clear stabilization after columns props catch up
                                postPasteStabilizationTimeoutRef.current = setTimeout(
                                    () => {
                                        const currentLocalCount =
                                            localColumnsRef.current.length;
                                        const currentIncomingCount = columns.length;

                                        // Only clear if incoming columns have caught up
                                        if (currentIncomingCount >= currentLocalCount) {
                                            console.debug(
                                                `[post_paste_sync][${operationId}] Clearing isPostPasteStabilizing (incoming=${currentIncomingCount} >= local=${currentLocalCount})`,
                                            );
                                            setIsPostPasteStabilizing(false);
                                        } else {
                                            console.debug(
                                                `[post_paste_sync][${operationId}] Delaying stabilization clear (incoming=${currentIncomingCount} < local=${currentLocalCount})`,
                                            );
                                            // Try again in 200ms
                                            postPasteStabilizationTimeoutRef.current =
                                                setTimeout(() => {
                                                    const finalLocalCount =
                                                        localColumnsRef.current.length;
                                                    const finalIncomingCount =
                                                        columns.length;
                                                    if (
                                                        finalIncomingCount >=
                                                        finalLocalCount
                                                    ) {
                                                        console.debug(
                                                            `[post_paste_sync][${operationId}] Clearing isPostPasteStabilizing after delay (incoming=${finalIncomingCount} >= local=${finalLocalCount})`,
                                                        );
                                                        setIsPostPasteStabilizing(false);
                                                    } else {
                                                        console.debug(
                                                            `[post_paste_sync][${operationId}] Force clearing isPostPasteStabilizing after timeout (incoming=${finalIncomingCount} < local=${finalLocalCount})`,
                                                        );
                                                        setIsPostPasteStabilizing(false);
                                                    }
                                                }, 200);
                                        }
                                    },
                                    300,
                                );
                            } catch (error) {
                                const postDuration = Date.now() - postStart;
                                console.error(
                                    `[paste_sync][${operationId}] onPostSave() failed (duration=${postDuration}ms):`,
                                    error,
                                );
                                // Still set stabilization flag even on error to prevent column removal
                                setIsPostPasteStabilizing(true);
                                if (postPasteStabilizationTimeoutRef.current) {
                                    clearTimeout(
                                        postPasteStabilizationTimeoutRef.current,
                                    );
                                }
                                postPasteStabilizationTimeoutRef.current = setTimeout(
                                    () => {
                                        setIsPostPasteStabilizing(false);
                                    },
                                    500,
                                );
                            }
                        }

                        // final cleanup
                    } catch (error) {
                        console.error(
                            `[paste_sync][${operationId}] Paste save error:`,
                            error,
                        );
                        // Clear flags even on error to prevent stuck state
                        pasteState.isPasting = false;
                        pasteState.pasteOperationActive = false;
                    } finally {
                        // --- FIX: Clear paste flag to allow Fast Refresh ---
                        if (typeof window !== 'undefined') {
                            (window as any).__PASTE_IN_PROGRESS__ = false;
                        }
                    }
                })();
            } catch (error) {
                console.error(
                    `[paste_sync][${operationId}] Paste operation failed for table ${tableId}:`,
                    error,
                );
                if (error instanceof Error) {
                    console.error(
                        `[paste_sync][${operationId}] Error stack:`,
                        error.stack,
                    );
                }
                // Clear flags on error
                pasteState.isPasting = false;
                pasteState.pasteOperationActive = false;
                // --- FIX: Clear paste flag on error ---
                if (typeof window !== 'undefined') {
                    (window as any).__PASTE_IN_PROGRESS__ = false;
                }
            } finally {
                // track pasted rows for deduplication for THIS table instance
                newRowsToCreate.forEach((row) => {
                    pasteState.recentlyPastedRows.add(row.id);
                });

                // clear pasted row tracking after sufficient time for db sync
                setTimeout(() => {
                    pasteState.recentlyPastedRows.clear();
                }, 10000);

                return true;
            }
        },
        [
            isEditMode,
            sortedData,
            onPostSave,
            saveTableMetadata,
            saveRow,
            localData,
            waitForSupabaseClient,
            verifyColumnsExist,
            confirmColumnsForTable,
            getPasteState,
            blockId,
            orgId,
            projectId,
            documentId,
            userId,
            createPropertyAndColumn,
        ],
    );

    // enhanced selection change handler
    const handleSelectionChange = useCallback((newSelection: GridSelection) => {
        console.debug('[handleSelectionChange] Selection updated:', {
            hasSelection: !!newSelection?.current,
            cell: newSelection?.current?.cell,
            range: newSelection?.current?.range,
        });
        setSelection(newSelection);
    }, []);

    if (isLoading) {
        return <TableLoadingSkeleton columns={columns.length} />;
    }

    // Map PropertyType (db) to EditableColumnType (ui)
    const propertyTypeToColumnType = (type: PropertyType): EditableColumnType => {
        switch (type) {
            case PropertyType.select:
                return 'select';
            case PropertyType.multi_select:
                return 'multi_select';
            case PropertyType.number:
                return 'number';
            case PropertyType.date:
                return 'date';
            default:
                return 'text';
        }
    };

    async function insertColumnAt(colIndex: number) {
        // open the full Add Column dialog used at block level, but insert at this index
        setPendingInsertIndex(colIndex);
        setAddColumnDialogOpen(true);
    }

    // Note: if we want to clear the highlighting on the cells on blur, need to use girdSelection in DataEditor and track manually.
    return (
        <div className="w-full">
            {showFilter && (
                <TableControls
                    filterComponent={filterComponent}
                    showFilter={showFilter}
                    onNewRow={onAddRow || (() => {})}
                    onEnterEditMode={() => {}}
                    isVisible={true}
                    orgId=""
                    projectId=""
                    documentId=""
                />
            )}

            <div
                className="w-full"
                ref={tableRef}
                tabIndex={-1}
                style={{
                    overflowX: 'auto',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: '100%',
                    position: 'relative',
                }}
            >
                <div style={{ width: '100%' }}>
                    <div
                        style={{
                            // calculating dynamic height based on rows
                            height: Math.min(
                                89 +
                                    sortedData.slice(0, 21).reduce((total, _, index) => {
                                        // showing max 20 rows
                                        const rowData = sortedData[index];
                                        if (!rowData) return total + 43; // default height

                                        if (rowData.height && rowData.height > 43) {
                                            return total + rowData.height;
                                        }

                                        const currentColumnWidths = localColumns.reduce(
                                            (acc, col) => {
                                                acc[col.accessor as string] =
                                                    colSizes[col.accessor] ||
                                                    col.width ||
                                                    360; // This determins max column width.
                                                return acc;
                                            },
                                            {} as Record<string, number>,
                                        );
                                        return (
                                            total +
                                            calculateMinRowHeight(
                                                rowData,
                                                currentColumnWidths,
                                            )
                                        );
                                    }, 0),
                                1200, // max height before scrolling
                            ),
                            minHeight: 89,
                            // Smooth row height transitions
                            transition: 'height 0.35s ease-in-out',
                        }}
                    >
                        <DataEditor
                            ref={gridRef}
                            columns={columnDefs}
                            customRenderers={[
                                FixedDropdownCell,
                                FixedMultiSelectCell,
                                ...allCells,
                            ]}
                            width={tableRef.current?.offsetWidth || undefined}
                            getCellContent={getCellContent}
                            getCellsForSelection={getCellsForSelection}
                            onCellEdited={isEditMode ? onCellEdited : undefined}
                            onCellActivated={handleCellActivated}
                            onKeyDown={handleGridKeyDown}
                            onPaste={isEditMode ? handlePaste : undefined}
                            smoothScrollX
                            smoothScrollY
                            rows={sortedData.length}
                            highlightRegions={highlightRegions}
                            rowHeight={(row) => {
                                const rowData = sortedData[row];
                                if (!rowData) return 43; // default height

                                if (rowData.height && rowData.height > 43) {
                                    return rowData.height;
                                }

                                const currentColumnWidths = localColumns.reduce(
                                    (acc, col) => {
                                        acc[col.accessor as string] =
                                            colSizes[col.accessor] || col.width || 120;
                                        return acc;
                                    },
                                    {} as Record<string, number>,
                                );
                                return calculateMinRowHeight(
                                    rowData,
                                    currentColumnWidths,
                                );
                            }}
                            onColumnResize={isEditMode ? handleColumnResize : undefined}
                            onColumnMoved={isEditMode ? handleColumnMoved : undefined}
                            gridSelection={gridSelection}
                            onGridSelectionChange={handleGridSelectionChange}
                            trailingRowOptions={{
                                tint: true,
                                sticky: true,
                            }}
                            // onRowAppended={isEditMode ? handleRowAppended : undefined}

                            onRowAppended={
                                isEditMode
                                    ? (colIndex?: number) => {
                                          handleRowAppended();
                                      }
                                    : undefined
                            }
                            rowMarkers="both"
                            onRowMoved={isEditMode ? handleRowMoved : undefined}
                            theme={
                                resolvedTheme === 'dark'
                                    ? glideDarkTheme
                                    : glideLightTheme
                            }
                            //onRowResize={handleRowResize}
                            onHeaderMenuClick={
                                isEditMode
                                    ? (col, bounds) => {
                                          setColumnMenu({
                                              colIndex: col,
                                              bounds: bounds,
                                          });
                                      }
                                    : undefined
                            }
                            rightElement={deleteRowsRightElement}
                            rightElementProps={{
                                sticky: true,
                            }}
                        />

                        {props.rowDetailPanel ? (
                            <props.rowDetailPanel
                                row={selectedRow}
                                open={isRowDetailOpen}
                                onOpenChange={(open) => {
                                    setIsRowDetailOpen(open);
                                    if (!open) {
                                        setSelectedRowId(null);
                                        setTimeout(() => {
                                            gridRef.current?.focus();
                                        }, 50);
                                    }
                                }}
                                columns={localColumns as EditableColumn<T>[]}
                            />
                        ) : null}

                        {/* Add Column Dialog invoked from header menu (left/right) */}
                        {isEditMode && (
                            <AddColumnDialog
                                isOpen={addColumnDialogOpen}
                                onClose={() => {
                                    setAddColumnDialogOpen(false);
                                    setPendingInsertIndex(null);
                                    // keep menu closed and refocus grid for keyboard flow
                                    setTimeout(() => gridRef.current?.focus(), 50);
                                }}
                                onSave={async (
                                    name,
                                    type,
                                    propertyConfig,
                                    defaultValue,
                                ) => {
                                    if (pendingInsertIndex == null) return;
                                    try {
                                        if (!blockId || !userId) return;
                                        const { property, column } =
                                            await createPropertyAndColumn(
                                                name,
                                                type,
                                                propertyConfig,
                                                defaultValue,
                                                blockId,
                                                userId,
                                            );

                                        const newCol: any = {
                                            id: column.id,
                                            header: property.name,
                                            title: property.name,
                                            accessor: property.name as keyof T,
                                            type,
                                            width: column.width ?? 200,
                                            position: pendingInsertIndex,
                                            required: false,
                                            isSortable: true,
                                            ...(type === 'select' ||
                                            type === 'multi_select'
                                                ? {
                                                      options:
                                                          (property.options as any)
                                                              ?.values || [],
                                                  }
                                                : {}),
                                        } as EditableColumn<T> & { title: string };

                                        setLocalColumns((prev) => {
                                            const next = [...prev];
                                            const clamped = Math.max(
                                                0,
                                                Math.min(pendingInsertIndex, next.length),
                                            );
                                            next.splice(clamped, 0, newCol);
                                            const reindexed = next.map((c, i) => ({
                                                ...c,
                                                position: i,
                                            }));
                                            localColumnsRef.current =
                                                reindexed as typeof localColumnsRef.current;
                                            return reindexed as typeof prev;
                                        });

                                        if (column.id) {
                                            dynamicColumnsPendingSyncRef.current.add(
                                                column.id,
                                            );
                                        }

                                        // Column add (createPropertyAndColumn): include columns to save new column list
                                        await requestMetadataSave({
                                            columns: true,
                                            rows: false,
                                            immediate: true,
                                        });
                                        await onPostSave?.();
                                    } finally {
                                        setAddColumnDialogOpen(false);
                                        setPendingInsertIndex(null);
                                        setTimeout(() => gridRef.current?.focus(), 50);
                                    }
                                }}
                                onSaveFromProperty={async (
                                    propertyId: string,
                                    defaultValue: string,
                                ) => {
                                    if (pendingInsertIndex == null) return;
                                    try {
                                        if (!blockId || !userId) return;
                                        const result = await createColumnFromProperty(
                                            propertyId,
                                            defaultValue,
                                            blockId,
                                            userId,
                                        );
                                        const column = result.column;
                                        const property = result.property as
                                            | {
                                                  name: string;
                                                  property_type: any;
                                                  options?: unknown;
                                              }
                                            | undefined;

                                        if (!property) {
                                            console.error(
                                                '[GlideEditableTable] Missing property payload from createColumnFromProperty',
                                            );
                                            return;
                                        }

                                        const mappedType = propertyTypeToColumnType(
                                            property.property_type,
                                        );
                                        const newCol: any = {
                                            id: column.id,
                                            header: property.name,
                                            title: property.name,
                                            accessor: property.name as keyof T,
                                            type: mappedType,
                                            width: column.width ?? 150,
                                            position: pendingInsertIndex,
                                            required: false,
                                            isSortable: true,
                                            ...(mappedType === 'select' ||
                                            mappedType === 'multi_select'
                                                ? {
                                                      options:
                                                          (property.options as any)
                                                              ?.values || [],
                                                  }
                                                : {}),
                                        } as EditableColumn<T> & { title: string };

                                        setLocalColumns((prev) => {
                                            const next = [...prev];
                                            const clamped = Math.max(
                                                0,
                                                Math.min(pendingInsertIndex, next.length),
                                            );
                                            next.splice(clamped, 0, newCol);
                                            const reindexed = next.map((c, i) => ({
                                                ...c,
                                                position: i,
                                            }));
                                            localColumnsRef.current =
                                                reindexed as typeof localColumnsRef.current;
                                            return reindexed as typeof prev;
                                        });

                                        if (column.id) {
                                            dynamicColumnsPendingSyncRef.current.add(
                                                column.id,
                                            );
                                        }

                                        // Column add (createColumnFromProperty): include columns to save new column list
                                        await requestMetadataSave({
                                            columns: true,
                                            rows: false,
                                            immediate: true,
                                        });
                                        await onPostSave?.();
                                    } finally {
                                        setAddColumnDialogOpen(false);
                                        setPendingInsertIndex(null);
                                        setTimeout(() => gridRef.current?.focus(), 50);
                                    }
                                }}
                                orgId={String(orgId)}
                                projectId={String(projectId)}
                                documentId={String(documentId)}
                            />
                        )}

                        {columnMenu &&
                            renderLayer(
                                <div
                                    {...layerProps}
                                    style={{
                                        ...layerProps.style,
                                        background:
                                            resolvedTheme === 'dark'
                                                ? '#1f1f1f'
                                                : '#ffffff', // background color
                                        border:
                                            resolvedTheme === 'dark'
                                                ? '1px solid #444'
                                                : '1px solid #ccc', // border
                                        // dropdown shadows
                                        boxShadow:
                                            resolvedTheme === 'dark'
                                                ? '0px 6px 16px rgba(0, 0, 0, 0.6)'
                                                : '0px 6px 16px rgba(0, 0, 0, 0.12)',
                                        padding: 6,
                                        zIndex: 1000,
                                        color:
                                            resolvedTheme === 'dark' ? '#ffffff' : '#222',
                                        minWidth: 160,
                                    }}
                                >
                                    <div
                                        onClick={() => {
                                            handleSortByColumn(
                                                columnMenu.colIndex,
                                                'asc',
                                            );
                                            setColumnMenu(undefined);
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            background:
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9',
                                            borderBottom:
                                                resolvedTheme === 'dark'
                                                    ? '1px solid #333'
                                                    : '1px solid #eee',
                                            color:
                                                resolvedTheme === 'dark'
                                                    ? '#f1f1f1'
                                                    : '#222',
                                            transition: 'background 0.2s ease',
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#3a3a3a'
                                                    : '#e6e6e6')
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9')
                                        }
                                    >
                                        Sort Ascending
                                    </div>

                                    <div
                                        onClick={() => {
                                            handleSortByColumn(
                                                columnMenu.colIndex,
                                                'desc',
                                            );
                                            setColumnMenu(undefined);
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            background:
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9',
                                            borderBottom:
                                                resolvedTheme === 'dark'
                                                    ? '1px solid #333'
                                                    : '1px solid #eee',
                                            color:
                                                resolvedTheme === 'dark'
                                                    ? '#f1f1f1'
                                                    : '#222',
                                            transition: 'background 0.2s ease',
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#3a3a3a'
                                                    : '#e6e6e6')
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9')
                                        }
                                    >
                                        Sort Descending
                                    </div>

                                    <div
                                        onClick={() => {
                                            insertColumnAt(columnMenu.colIndex);
                                            setColumnMenu(undefined);
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            background:
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9',
                                            borderBottom:
                                                resolvedTheme === 'dark'
                                                    ? '1px solid #333'
                                                    : '1px solid #eee', // subtle divider between items
                                            color:
                                                resolvedTheme === 'dark'
                                                    ? '#f1f1f1'
                                                    : '#222', // text color
                                            transition: 'background 0.2s ease',
                                        }}
                                        onMouseEnter={
                                            (e) =>
                                                (e.currentTarget.style.background =
                                                    resolvedTheme === 'dark'
                                                        ? '#3a3a3a'
                                                        : '#e6e6e6') // hover background effect
                                        }
                                        onMouseLeave={
                                            (e) =>
                                                (e.currentTarget.style.background =
                                                    resolvedTheme === 'dark'
                                                        ? '#1f1f1f'
                                                        : '#f9f9f9') // revert when mouse leaves
                                        }
                                    >
                                        + Add Column Left
                                    </div>

                                    <div
                                        onClick={() => {
                                            insertColumnAt(columnMenu.colIndex + 1);
                                            setColumnMenu(undefined);
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            background:
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9',
                                            borderBottom:
                                                resolvedTheme === 'dark'
                                                    ? '1px solid #333'
                                                    : '1px solid #eee',
                                            color:
                                                resolvedTheme === 'dark'
                                                    ? '#f1f1f1'
                                                    : '#222',
                                            transition: 'background 0.2s ease',
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#3a3a3a'
                                                    : '#e6e6e6')
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9')
                                        }
                                    >
                                        + Add Column Right
                                    </div>

                                    <div
                                        onClick={() => {
                                            const col = localColumns[columnMenu.colIndex];
                                            if (col) {
                                                // ========================================
                                                // [rename_debug] COLUMN RENAME TRIGGER POINT
                                                // ========================================
                                                const pasteState = getPasteState();
                                                const isDuringPaste =
                                                    pasteState.isPasting ||
                                                    pasteState.pasteOperationActive;

                                                // check if this is a default column
                                                // prevent renaming system columns
                                                if (isSystemColumn(col.header)) {
                                                    console.warn(
                                                        '[GlideEditableTable] System column cannot be renamed:',
                                                        col.header,
                                                    );
                                                    alert(
                                                        `"${col.header}" is a system column and cannot be renamed.`,
                                                    );
                                                    setColumnMenu(undefined);
                                                    return;
                                                }

                                                setColumnToRename({
                                                    id: col.id,
                                                    currentName: col.header,
                                                });
                                                setRenameDialogOpen(true);
                                                setColumnMenu(undefined);
                                            }
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            background:
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9',
                                            borderBottom:
                                                resolvedTheme === 'dark'
                                                    ? '1px solid #333'
                                                    : '1px solid #eee',
                                            color:
                                                resolvedTheme === 'dark'
                                                    ? '#f1f1f1'
                                                    : '#222',
                                            transition: 'background 0.2s ease',
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#3a3a3a'
                                                    : '#e6e6e6')
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9')
                                        }
                                    >
                                        Rename Column
                                    </div>

                                    <div
                                        onClick={() => {
                                            const colId =
                                                localColumns[columnMenu.colIndex]?.id;
                                            if (colId) {
                                                console.log(
                                                    'Column ID to delete:',
                                                    colId,
                                                );
                                                setColumnToDelete(colId);
                                                setDeleteConfirmOpen?.(true);
                                                setTimeout(() => {
                                                    setColumnMenu(undefined);
                                                }, 0);
                                            } else {
                                                setColumnMenu(undefined);
                                            }
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            background:
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9',
                                            borderBottom:
                                                resolvedTheme === 'dark'
                                                    ? '1px solid #333'
                                                    : '1px solid #eee',
                                            color:
                                                resolvedTheme === 'dark'
                                                    ? '#ed3f3f'
                                                    : 'red',
                                            transition: 'background 0.2s ease',
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#3a3a3a'
                                                    : '#e6e6e6')
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9')
                                        }
                                    >
                                        x Delete Column
                                    </div>

                                    <div
                                        onClick={() => {
                                            setColumnMenu(undefined);
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            background:
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9',
                                            color:
                                                resolvedTheme === 'dark'
                                                    ? '#f1f1f1'
                                                    : '#222',
                                            transition: 'background 0.2s ease',
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#3a3a3a'
                                                    : '#e6e6e6')
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9')
                                        }
                                    >
                                        x Close Menu
                                    </div>
                                </div>,
                            )}
                    </div>
                </div>
                <DeleteConfirmDialog
                    open={deleteConfirmOpen}
                    onOpenChange={(open) => setDeleteConfirmOpen?.(open)}
                    onConfirm={handleColumnDeleteConfirm}
                />
                <DeleteConfirmDialog
                    open={rowDeleteConfirmOpen}
                    onOpenChange={(open) => {
                        setRowDeleteConfirmOpen(open);
                        if (!open) {
                            setRowsToDelete([]);
                        }
                    }}
                    onConfirm={handleRowDeleteConfirm}
                />
                <RenameColumnDialog
                    open={renameDialogOpen}
                    onOpenChange={(open: boolean) => {
                        setRenameDialogOpen(open);
                        if (!open) {
                            setColumnToRename(null);
                        }
                    }}
                    currentName={columnToRename?.currentName || ''}
                    onConfirm={handleColumnRename}
                />

                {/* Conflict Warning */}
                {showConflictWarning && (
                    <ConflictWarning
                        conflictingUsers={conflictingUsers}
                        type="cell"
                        onDismiss={() => setShowConflictWarning(false)}
                    />
                )}
            </div>
        </div>
    );
}
