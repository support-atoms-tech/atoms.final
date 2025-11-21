'use client';

import React from 'react';

import { EditableColumnType } from '@/components/custom/BlockCanvas/components/EditableTable/types';
import {
    DetectedColumn,
    autoDetectColumns,
} from '@/components/custom/BlockCanvas/utils/detectColumnTypes';
import { ParsedTable } from '@/components/custom/BlockCanvas/utils/importTable';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

type ColumnState = {
    name: string;
    type: EditableColumnType;
    optionsStr: string;
};

type TableType = 'generic' | 'requirements';
type NativeField = 'External_ID' | 'Name' | 'Description' | 'Status' | 'Priority';
type RequirementsMapping = Partial<
    Record<NativeField, string | '__leave_blank__' | '__auto_generate__'>
>;

interface ImportMappingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    parsed: ParsedTable;
    onConfirm: (result: {
        tableType: 'generic' | 'requirements';
        requirementsMapping?: RequirementsMapping;
        columns: { name: string; type: EditableColumnType; options?: string[] }[];
        rows: Array<Array<unknown>>;
        includeHeader: boolean;
    }) => Promise<void> | void;
}

export function ImportMappingDialog({
    isOpen,
    onClose,
    parsed,
    onConfirm,
}: ImportMappingDialogProps) {
    const [includeHeader, setIncludeHeader] = React.useState<boolean>(
        parsed.usedFirstRowAsHeader !== false,
    );
    const [columns, setColumns] = React.useState<ColumnState[]>([]);
    const [tableType, setTableType] = React.useState<TableType>('generic');
    const [requirementsMapping, setRequirementsMapping] =
        React.useState<RequirementsMapping>({
            External_ID: '__auto_generate__',
            Name: '__leave_blank__',
            Description: '__leave_blank__',
            Status: '__leave_blank__',
            Priority: '__leave_blank__',
        });

    // Compute effective rows based on header usage
    const effectiveRows = React.useMemo(() => {
        if (!includeHeader && parsed.rawHeaderRow) {
            return [parsed.rawHeaderRow, ...(parsed.rows || [])];
        }
        return parsed.rows || [];
    }, [includeHeader, parsed.rows, parsed.rawHeaderRow]);

    // Init and re-run detection when dialog (re)opens or toggle changes
    React.useEffect(() => {
        if (!isOpen) return;
        const baseNames = includeHeader
            ? parsed.headers || []
            : generateDefaultHeaders(
                  parsed.headers
                      ? parsed.headers.length
                      : parsed.rawHeaderRow?.length || 0,
              );
        const detected: DetectedColumn[] = autoDetectColumns(baseNames, effectiveRows);
        const mapped: ColumnState[] = detected.map((d) => ({
            name: d.name,
            type: d.type,
            optionsStr: (d.options || []).join(', '),
        }));
        setColumns(mapped);
    }, [isOpen, includeHeader, parsed.headers, parsed.rawHeaderRow, effectiveRows]);

    const handleColumnChange = (index: number, patch: Partial<ColumnState>) => {
        setColumns((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], ...patch };
            return next;
        });
    };

    const handleConfirm = async () => {
        const outColumns = columns.map((c) => ({
            name: c.name.trim() || 'Untitled',
            type: c.type,
            options:
                c.type === 'select' || c.type === 'multi_select'
                    ? (c.optionsStr || '')
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                    : undefined,
        }));
        await onConfirm({
            tableType,
            requirementsMapping:
                tableType === 'requirements' ? requirementsMapping : undefined,
            columns: outColumns,
            rows: effectiveRows,
            includeHeader,
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
            <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Configure Import</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid gap-3 border rounded-md p-4">
                        <div className="font-medium">Table Type</div>
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="tableType"
                                    value="generic"
                                    checked={tableType === 'generic'}
                                    onChange={() => setTableType('generic')}
                                />
                                <span>Generic</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="tableType"
                                    value="requirements"
                                    checked={tableType === 'requirements'}
                                    onChange={() => setTableType('requirements')}
                                />
                                <span>Requirements (map native fields)</span>
                            </label>
                        </div>
                        {tableType === 'requirements' && (
                            <div className="mt-2 border rounded-md">
                                <div className="px-4 py-3 border-b font-medium bg-muted/40">
                                    Native Fields Mapping
                                </div>
                                <div className="p-4 space-y-3 text-sm text-muted-foreground">
                                    <div>
                                        Choose which incoming column maps to each native
                                        field. This mapping is UI-only for now;
                                        functionality will be hooked up later.
                                    </div>
                                    <div className="grid grid-cols-12 items-center gap-3">
                                        <div className="col-span-4 font-medium text-foreground">
                                            Field
                                        </div>
                                        <div className="col-span-8 font-medium text-foreground">
                                            Map to incoming column
                                        </div>
                                    </div>
                                    {(
                                        [
                                            'External_ID',
                                            'Name',
                                            'Description',
                                            'Status',
                                            'Priority',
                                        ] as NativeField[]
                                    ).map((field) => (
                                        <div
                                            key={field}
                                            className="grid grid-cols-12 items-center gap-3"
                                        >
                                            <div className="col-span-4">{field}</div>
                                            <div className="col-span-8">
                                                <Select
                                                    value={
                                                        (requirementsMapping[
                                                            field
                                                        ] as string) ?? '__leave_blank__'
                                                    }
                                                    onValueChange={(v) =>
                                                        setRequirementsMapping(
                                                            (prev) => ({
                                                                ...prev,
                                                                [field]:
                                                                    v as RequirementsMapping[NativeField],
                                                            }),
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select column" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__leave_blank__">
                                                            Leave blank
                                                        </SelectItem>
                                                        {field === 'External_ID' && (
                                                            <SelectItem value="__auto_generate__">
                                                                Auto-generate
                                                            </SelectItem>
                                                        )}
                                                        {columns.length > 0 && (
                                                            <div className="px-2 py-1 text-xs text-muted-foreground">
                                                                Incoming columns
                                                            </div>
                                                        )}
                                                        {columns.map((c) => (
                                                            <SelectItem
                                                                key={c.name}
                                                                value={c.name}
                                                            >
                                                                {c.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label
                                htmlFor="first-row-as-header"
                                className="cursor-pointer"
                            >
                                Use first row as column names
                            </Label>
                        </div>
                        <Switch
                            id="first-row-as-header"
                            checked={includeHeader}
                            onCheckedChange={setIncludeHeader}
                        />
                    </div>

                    <div className="border rounded-md">
                        <div className="px-4 py-3 border-b font-medium bg-muted/40">
                            Columns ({columns.length})
                        </div>
                        <div className="p-4 space-y-3">
                            {columns.map((col, idx) => (
                                <div
                                    key={`col-${idx}`}
                                    className="grid grid-cols-12 items-start gap-3 border rounded-md p-3"
                                >
                                    <div className="col-span-4 space-y-1">
                                        <Label className="text-xs">Name</Label>
                                        <Input
                                            value={col.name}
                                            onChange={(e) =>
                                                handleColumnChange(idx, {
                                                    name: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="col-span-3 space-y-1">
                                        <Label className="text-xs">Type</Label>
                                        <Select
                                            value={col.type}
                                            onValueChange={(v) =>
                                                handleColumnChange(idx, {
                                                    type: v as EditableColumnType,
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="text">Text</SelectItem>
                                                <SelectItem value="select">
                                                    Select
                                                </SelectItem>
                                                <SelectItem value="multi_select">
                                                    Multi Select
                                                </SelectItem>
                                                <SelectItem value="number">
                                                    Number
                                                </SelectItem>
                                                <SelectItem value="date">Date</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {(col.type === 'select' ||
                                        col.type === 'multi_select') && (
                                        <div className="col-span-5 space-y-1">
                                            <Label className="text-xs">Options</Label>
                                            <Input
                                                placeholder="Option1, Option2, Option3"
                                                value={col.optionsStr}
                                                onChange={(e) =>
                                                    handleColumnChange(idx, {
                                                        optionsStr: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm}>Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function generateDefaultHeaders(n: number): string[] {
    const out: string[] = [];
    for (let i = 0; i < n; i++) out.push(`Column ${i + 1}`);
    return out;
}
