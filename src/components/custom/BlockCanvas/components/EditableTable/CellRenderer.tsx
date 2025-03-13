'use client';

import * as React from 'react';

import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';

import { CellValue, EditableColumn } from './types';

interface CellRendererProps<
    T extends Record<string, CellValue> & { id: string },
> {
    item: T;
    column: EditableColumn<T>;
    isEditing: boolean;
    value: CellValue;
    onCellChange: (itemId: string, accessor: keyof T, value: CellValue) => void;
}

export function CellRenderer<
    T extends Record<string, CellValue> & { id: string },
>({ item, column, isEditing, value, onCellChange }: CellRendererProps<T>) {
    // Convert value to string for display and editing
    const stringValue = value !== null && value !== undefined ? String(value) : '';
    
    // For multi-select, handle array values
    const arrayValue = Array.isArray(value) ? value : value ? [String(value)] : [];

    if (isEditing) {
        switch (column.type) {
            case 'multi_select':
                return (
                    <MultiSelect
                        values={arrayValue}
                        options={column.options?.map(opt => ({ label: opt, value: opt })) || []}
                        onChange={(newValues) => 
                            onCellChange(
                                item.id as string,
                                column.accessor,
                                newValues.length > 0 ? newValues : null
                            )
                        }
                        placeholder="Select options..."
                    />
                );
            case 'select':
                // Handle the case where value is '__EMPTY__' or empty
                const selectValue = value === null || value === undefined || value === '' 
                    ? '__EMPTY__' 
                    : stringValue;
                
                return (
                    <Select
                        value={selectValue}
                        onValueChange={(newValue) =>
                            onCellChange(
                                item.id as string,
                                column.accessor,
                                newValue === '__EMPTY__' ? null : newValue
                            )
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                            {/* Use a non-empty value for the empty option */}
                            <SelectItem key="empty" value="__EMPTY__">
                                -- Select --
                            </SelectItem>
                            {column.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case 'number':
                return (
                    <Input
                        type="number"
                        value={stringValue}
                        onChange={(e) =>
                            onCellChange(
                                item.id as string,
                                column.accessor,
                                e.target.value === '' ? null : parseFloat(e.target.value),
                            )
                        }
                        data-editing="true"
                    />
                );
            case 'date':
                return (
                    <Input
                        type="date"
                        value={stringValue}
                        onChange={(e) =>
                            onCellChange(
                                item.id as string,
                                column.accessor,
                                e.target.value === '' ? null : new Date(e.target.value),
                            )
                        }
                        data-editing="true"
                    />
                );
            default:
                return (
                    <Input
                        value={stringValue}
                        onChange={(e) =>
                            onCellChange(
                                item.id as string,
                                column.accessor,
                                e.target.value,
                            )
                        }
                        data-editing="true"
                    />
                );
        }
    }

    // For display mode, handle different value types appropriately
    if (value === null || value === undefined || value === '' || value === '__EMPTY__') {
        return <div className="py-0.5 px-1 rounded transition-colors text-muted-foreground">-</div>;
    }

    if (value instanceof Date) {
        return <div className="py-0.5 px-1 rounded transition-colors">{value.toLocaleDateString()}</div>;
    }

    // For multi-select values, display as comma-separated list
    if (Array.isArray(value)) {
        return (
            <div className="py-0.5 px-1 rounded transition-colors">
                {value.join(', ')}
            </div>
        );
    }

    // For all other types, convert to string
    return (
        <div className="py-0.5 px-1 rounded transition-colors">
            {stringValue}
        </div>
    );
}
