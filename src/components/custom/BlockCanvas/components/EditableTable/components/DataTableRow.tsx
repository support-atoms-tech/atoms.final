import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';

import { CellRenderer } from '../CellRenderer';
import { CellValue, EditableColumn } from '../types';

interface DataTableRowProps<T> {
    item: T;
    columns: EditableColumn<T>[];
    isEditing: boolean;
    editingData: Record<string, T>;
    onCellChange: (itemId: string, accessor: keyof T, value: CellValue) => void;
    onDelete: (item: T) => void;
    onHoverCell?: (row: number, col: number) => void;
    rowIndex: number;
}

export function DataTableRow<
    T extends Record<string, CellValue> & { id: string },
>({
    item,
    columns,
    isEditing,
    editingData,
    onCellChange,
    onDelete,
    onHoverCell,
    rowIndex,
}: DataTableRowProps<T>) {
    return (
        <TableRow className="font-mono">
            {columns.map((column, colIndex) => (
                <TableCell
                    key={`${String(item.id)}-${String(column.accessor)}`}
                    onMouseEnter={() => onHoverCell?.(rowIndex, colIndex)}
                    onMouseLeave={() => onHoverCell?.(0, 0)}
                >
                    <CellRenderer
                        item={item}
                        column={column}
                        isEditing={isEditing}
                        value={
                            editingData[item.id]?.[column.accessor] ??
                            item[column.accessor]
                        }
                        onCellChange={onCellChange}
                    />
                </TableCell>
            ))}
            {isEditing && (
                <TableCell>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDelete(item)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </TableCell>
            )}
        </TableRow>
    );
}
