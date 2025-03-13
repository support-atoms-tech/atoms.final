'use client';

import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import * as React from 'react';
import { useCallback, useEffect, useReducer, useState } from 'react';

import { Table, TableBody } from '@/components/ui/table';
import { transitionConfig } from '@/lib/utils/animations';

import {
    AddRowPlaceholder,
    DataTableRow,
    DeleteConfirmDialog,
    EmptyState,
    NewRowForm,
    TableControls,
    TableHeader,
    TableLoadingSkeleton,
} from './components';
import { useTableSort } from './hooks/useTableSort';
import { TableState, tableReducer } from './reducers/tableReducer';
import { CellValue, EditableColumn, EditableTableProps } from './types';

export function EditableTable<
    T extends Record<string, CellValue> & { id: string },
>({
    data,
    columns,
    onSave,
    onDelete,
    isLoading = false,
    emptyMessage = 'No items found.',
    showFilter = true,
    filterComponent,
    isEditMode = false,
    alwaysShowAddRow = false,
}: EditableTableProps<T>) {
    // Initialize the state with useReducer
    const initialState: TableState<T> = {
        localIsEditMode: isEditMode,
        editingData: {},
        isAddingNew: false,
        sortKey: null,
        sortOrder: 'asc',
        hoveredCell: null,
        itemToDelete: null,
        deleteConfirmOpen: false,
        editingTimeouts: {},
    };

    const [state, dispatch] = useReducer(tableReducer, initialState);
    const {
        localIsEditMode,
        editingData,
        isAddingNew,
        sortKey,
        sortOrder,
        hoveredCell,
        itemToDelete,
        deleteConfirmOpen,
    } = state;

    const [isHoveringTable, setIsHoveringTable] = useState(false);

    // Use the extracted custom hooks
    const { sortedData, handleSort } = useTableSort(data, sortKey);

    // Effect to init edit data when entering edit mode
    useEffect(() => {
        if (isEditMode !== localIsEditMode) {
            dispatch({ type: 'SET_EDIT_MODE', payload: isEditMode });

            if (isEditMode && data.length > 0) {
                const initialEditData = data.reduce(
                    (acc, item) => {
                        if (item.id) {
                            acc[item.id as string] = { ...item };
                        }
                        return acc;
                    },
                    {} as Record<string, T>,
                );
                dispatch({
                    type: 'SET_INITIAL_EDIT_DATA',
                    payload: initialEditData,
                });
            } else if (!isEditMode) {
                dispatch({ type: 'RESET_EDIT_STATE' });
            }
        }
    }, [isEditMode, localIsEditMode, data]);

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            dispatch({ type: 'RESET_EDIT_STATE' });
        };
    }, []);

    // Action handlers
    const handleCellChange = useCallback(
        (itemId: string, accessor: keyof T, value: CellValue) => {
            dispatch({
                type: 'SET_CELL_VALUE',
                payload: { itemId, accessor, value },
            });

            // Don't auto-save if this is a new row
            if (itemId === 'new' || !onSave) return;

            // Clear existing timeout for this item if it exists
            if (state.editingTimeouts[itemId]) {
                clearTimeout(state.editingTimeouts[itemId]);
                dispatch({ type: 'CLEAR_TIMEOUT', payload: itemId });
            }

            // Set new timeout for debounced save
            const timeoutId = setTimeout(async () => {
                try {
                    const editedItem = {
                        ...state.editingData[itemId],
                        [accessor]: value,
                    };

                    await onSave(editedItem, false);

                    // Clear the timeout from state after successful save
                    dispatch({ type: 'CLEAR_TIMEOUT', payload: itemId });
                } catch (error) {
                    console.error('Failed to save:', error);
                }
            }, 500); // 500ms debounce

            // Store the new timeout
            dispatch({
                type: 'SET_TIMEOUT',
                payload: { itemId, timeoutId },
            });
        },
        [state.editingData, state.editingTimeouts, onSave],
    );

    const handleAddNewRow = useCallback(() => {
        // Create empty row
        const newItem = columns.reduce((acc, col) => {
            switch (col.type) {
                case 'select':
                    // Initialize select fields with null instead of empty string
                    acc[col.accessor as keyof T] = null as T[keyof T];
                    break;
                case 'multi_select':
                    // Initialize multi-select fields with empty array
                    acc[col.accessor as keyof T] = [] as unknown as T[keyof T];
                    break;
                case 'text':
                    acc[col.accessor as keyof T] = '' as T[keyof T];
                    break;
                case 'number':
                    acc[col.accessor as keyof T] = null as T[keyof T];
                    break;
                case 'date':
                    acc[col.accessor as keyof T] = null as T[keyof T];
                    break;
                default:
                    acc[col.accessor as keyof T] = null as T[keyof T];
            }
            return acc;
        }, {} as T);

        newItem.id = 'new';

        dispatch({
            type: 'SET_INITIAL_EDIT_DATA',
            payload: { ...editingData, new: newItem },
        });
        dispatch({ type: 'START_ADD_ROW' });
    }, [columns, editingData]);

    const handleSaveNewRow = useCallback(async () => {
        const newItem = editingData['new'];
        if (!newItem || !onSave) return;

        try {
            // Remove the temporary id before saving
            const { id: _tempId, ...itemWithoutId } = newItem;
            await onSave(itemWithoutId as T, true);

            // Clear editing state after successful save
            dispatch({ type: 'CANCEL_ADD_ROW' });

            // Reset local edit mode to match global edit mode
            dispatch({ type: 'SET_EDIT_MODE', payload: false });
        } catch (error) {
            console.error('Failed to save new row:', error);
        }
    }, [editingData, onSave]);

    const handleCancelNewRow = useCallback(() => {
        dispatch({ type: 'CANCEL_ADD_ROW' });
    }, []);

    const handleDeleteClick = useCallback((item: T) => {
        dispatch({ type: 'OPEN_DELETE_CONFIRM', payload: item });
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!itemToDelete || !onDelete) return;

        try {
            await onDelete(itemToDelete);
            dispatch({ type: 'CLOSE_DELETE_CONFIRM' });
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    }, [itemToDelete, onDelete]);

    const handleHoverCell = useCallback((row: number, col: number) => {
        dispatch({
            type: 'SET_HOVERED_CELL',
            payload: { row, col },
        });
    }, []);

    // Render table with smaller components
    if (isLoading) {
        return <TableLoadingSkeleton columns={columns.length} />;
    }

    return (
        <LayoutGroup>
            <motion.div
                className="relative"
                layout
                transition={transitionConfig}
            >
                <div className="relative">
                    <div
                        className="relative overflow-visible font-mono group"
                        onMouseEnter={() =>
                            !localIsEditMode && setIsHoveringTable(true)
                        }
                        onMouseLeave={() =>
                            !localIsEditMode && setIsHoveringTable(false)
                        }
                    >
                        {/* Controls */}
                        <AnimatePresence>
                            <TableControls
                                showFilter={showFilter}
                                filterComponent={filterComponent}
                                onNewRow={handleAddNewRow}
                                onEnterEditMode={() =>
                                    dispatch({
                                        type: 'SET_EDIT_MODE',
                                        payload: true,
                                    })
                                }
                                isVisible={isHoveringTable && !localIsEditMode}
                            />
                        </AnimatePresence>

                        {/* Table */}
                        {sortedData.length > 0 ||
                        isAddingNew ||
                        alwaysShowAddRow ? (
                            <div className="relative">
                                <Table className="[&_tr:last-child_td]:border-b-2 [&_tr]:border-b [&_td]:py-1 [&_th]:py-1 [&_td]:border-r [&_td:last-child]:border-r-0 [&_th]:border-r [&_th:last-child]:border-r-0">
                                    <TableHeader
                                        columns={columns}
                                        sortKey={sortKey}
                                        sortOrder={sortOrder}
                                        onSort={handleSort}
                                        isEditMode={localIsEditMode}
                                    />
                                    <TableBody>
                                        {/* Existing rows */}
                                        {sortedData.map((item, rowIndex) => (
                                            <DataTableRow
                                                key={item.id}
                                                item={item}
                                                columns={columns}
                                                isEditing={
                                                    localIsEditMode &&
                                                    !isAddingNew
                                                }
                                                editingData={editingData}
                                                onCellChange={handleCellChange}
                                                onDelete={handleDeleteClick}
                                                onHoverCell={handleHoverCell}
                                                rowIndex={rowIndex}
                                            />
                                        ))}

                                        {/* New row being added */}
                                        {isAddingNew && (
                                            <NewRowForm
                                                columns={columns}
                                                editingData={editingData}
                                                onCellChange={handleCellChange}
                                                onSave={handleSaveNewRow}
                                                onCancel={handleCancelNewRow}
                                            />
                                        )}

                                        {/* Add new row placeholder */}
                                        {!isAddingNew && (
                                            <AddRowPlaceholder
                                                columns={columns}
                                                onClick={handleAddNewRow}
                                                isEditMode={localIsEditMode}
                                            />
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <EmptyState message={emptyMessage} />
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Delete confirmation */}
            <DeleteConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={(open) =>
                    !open && dispatch({ type: 'CLOSE_DELETE_CONFIRM' })
                }
                onConfirm={handleDeleteConfirm}
            />
        </LayoutGroup>
    );
}
