'use client';

import React, { useCallback, useRef, useState } from 'react';

import { EditableColumnType } from '@/components/custom/BlockCanvas/components/EditableTable/types';
import {
    DetectedColumn,
    autoDetectColumns,
} from '@/components/custom/BlockCanvas/utils/detectColumnTypes';
import {
    ParsedTable,
    parseTableFile,
} from '@/components/custom/BlockCanvas/utils/importTable';
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

type TableLayoutOption = 'blank' | 'requirements_default' | 'import';

interface AddTableDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (
        layout: TableLayoutOption,
        name: string,
        imported?: {
            tableType: 'generic' | 'requirements';
            requirementsMapping?: Partial<
                Record<
                    'External_ID' | 'Name' | 'Description' | 'Status' | 'Priority',
                    string | '__leave_blank__' | '__auto_generate__'
                >
            >;
            columns: { name: string; type: EditableColumnType; options?: string[] }[];
            rows: Array<Array<unknown>>;
            includeHeader: boolean;
        },
    ) => Promise<void> | void;
}

export function AddTableDialog({ isOpen, onClose, onCreate }: AddTableDialogProps) {
    const [layout, setLayout] = useState<TableLayoutOption>('requirements_default');
    const [step, setStep] = useState<'layout' | 'native' | 'columns'>('layout');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tableName, setTableName] = useState('');
    const [importPreview, setImportPreview] = useState<ParsedTable | null>(null);
    const [importError, setImportError] = useState<string>('');
    const [isParsing, setIsParsing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    // Inline mapping state (replaces nested ImportMappingDialog)
    type ColumnState = { name: string; type: EditableColumnType; optionsStr: string };
    type TableType = 'generic' | 'requirements';
    type NativeField = 'External_ID' | 'Name' | 'Description' | 'Status' | 'Priority';
    type RequirementsMapping = Partial<
        Record<NativeField, string | '__leave_blank__' | '__auto_generate__'>
    >;
    const [includeHeader, setIncludeHeader] = React.useState<boolean>(true);
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

    // Hide columns that are mapped to native fields to reduce duplication for Requirements imports
    const mappedColumnNames = React.useMemo(() => {
        if (tableType !== 'requirements') return new Set<string>();
        const names = Object.values(requirementsMapping)
            .filter(
                (v): v is string =>
                    typeof v === 'string' &&
                    v !== '__leave_blank__' &&
                    v !== '__auto_generate__',
            )
            .map((v) => v.toString());
        return new Set(names);
    }, [requirementsMapping, tableType]);
    const visibleColumns = React.useMemo(() => {
        if (tableType !== 'requirements') return columns;
        return columns.filter((c) => !mappedColumnNames.has(c.name));
    }, [columns, mappedColumnNames, tableType]);

    const resetImportState = useCallback(() => {
        setImportPreview(null);
        setImportError('');
        setIsParsing(false);
        setIsDragging(false);
        setIncludeHeader(true);
        setColumns([]);
        setTableType('generic');
        setRequirementsMapping({
            External_ID: '__auto_generate__',
            Name: '__leave_blank__',
            Description: '__leave_blank__',
            Status: '__leave_blank__',
            Priority: '__leave_blank__',
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const handleCreate = async () => {
        if (isSubmitting) return;
        try {
            setIsSubmitting(true);
            // Close immediately to prevent flicker/reopen during hydration
            onClose();
            if (layout === 'import') {
                // Build mapping result inline from current state
                const parsed = importPreview;
                if (!parsed) return;
                const effectiveRows =
                    !includeHeader && parsed.rawHeaderRow
                        ? [parsed.rawHeaderRow, ...(parsed.rows || [])]
                        : parsed.rows || [];
                const outColumns =
                    columns.map((c) => ({
                        name: c.name.trim() || 'Untitled',
                        type: c.type,
                        options:
                            c.type === 'select' || c.type === 'multi_select'
                                ? (c.optionsStr || '')
                                      .split(',')
                                      .map((s) => s.trim())
                                      .filter(Boolean)
                                : undefined,
                    })) || [];
                await onCreate(layout, tableName.trim(), {
                    tableType,
                    requirementsMapping:
                        tableType === 'requirements' ? requirementsMapping : undefined,
                    columns: outColumns,
                    rows: effectiveRows,
                    includeHeader,
                });
            } else {
                await onCreate(layout, tableName.trim());
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFiles = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        setIsParsing(true);
        setImportError('');
        try {
            const parsed = await parseTableFile(file);
            setImportPreview(parsed);
            // Initialize mapping defaults
            const defaultIncludeHeader = parsed.usedFirstRowAsHeader !== false;
            setIncludeHeader(defaultIncludeHeader);
            const baseNames = defaultIncludeHeader
                ? parsed.headers || []
                : generateDefaultHeaders(
                      parsed.headers
                          ? parsed.headers.length
                          : parsed.rawHeaderRow?.length || 0,
                  );
            const effectiveRows =
                !defaultIncludeHeader && parsed.rawHeaderRow
                    ? [parsed.rawHeaderRow, ...(parsed.rows || [])]
                    : parsed.rows || [];
            const detected: DetectedColumn[] = autoDetectColumns(
                baseNames,
                effectiveRows,
            );
            const mapped: ColumnState[] = detected.map((d) => ({
                name: d.name,
                type: d.type,
                optionsStr: (d.options || []).join(', '),
            }));
            setColumns(mapped);
            setTableType('generic');
            setRequirementsMapping({
                External_ID: '__auto_generate__',
                Name: '__leave_blank__',
                Description: '__leave_blank__',
                Status: '__leave_blank__',
                Priority: '__leave_blank__',
            });
        } catch (e) {
            const msg =
                (e as Error)?.message ||
                'Failed to parse file. Please ensure it is CSV, Excel (.xlsx/.xls) or ReqIF.';
            setImportError(msg);
            setImportPreview(null);
        } finally {
            setIsParsing(false);
        }
    }, []);

    // Re-run detection when header toggle changes
    React.useEffect(() => {
        if (!importPreview) return;
        const baseNames = includeHeader
            ? importPreview.headers || []
            : generateDefaultHeaders(
                  importPreview.headers
                      ? importPreview.headers.length
                      : importPreview.rawHeaderRow?.length || 0,
              );
        const effectiveRows =
            !includeHeader && importPreview.rawHeaderRow
                ? [importPreview.rawHeaderRow, ...(importPreview.rows || [])]
                : importPreview.rows || [];
        const detected: DetectedColumn[] = autoDetectColumns(baseNames, effectiveRows);
        const mapped: ColumnState[] = detected.map((d) => ({
            name: d.name,
            type: d.type,
            optionsStr: (d.options || []).join(', '),
        }));
        setColumns(mapped);
        // Keep tableType and requirements mapping as-is (user choice)
    }, [includeHeader, importPreview]);

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                // Only handle close from internal interactions (esc, click outside)
                if (!open) {
                    onClose();
                    resetImportState();
                    setStep('layout');
                    setLayout('requirements_default');
                    setTableName('');
                }
            }}
        >
            <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New Table</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {layout === 'import' && (
                        <div className="text-xs text-muted-foreground">
                            {step === 'layout'
                                ? 'Step 1 of 3'
                                : step === 'native'
                                  ? 'Step 2 of 3'
                                  : 'Step 3 of 3'}
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Name</label>
                        <Input
                            placeholder="Untitled Table"
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                        />
                    </div>
                    <div className="h-px bg-border" />

                    {step === 'layout' && (
                        <>
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => setLayout('requirements_default')}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ')
                                        setLayout('requirements_default');
                                }}
                                className={`rounded-md p-3 cursor-pointer border border-transparent ${layout === 'requirements_default' ? 'ring-2 ring-primary bg-muted/40' : 'hover:bg-muted/40'}`}
                            >
                                <div className="font-medium">Requirements Default</div>
                                <div className="text-xs text-muted-foreground">
                                    Preset columns.
                                </div>
                            </div>

                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => setLayout('blank')}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ')
                                        setLayout('blank');
                                }}
                                className={`rounded-md p-3 cursor-pointer border border-transparent ${layout === 'blank' ? 'ring-2 ring-primary bg-muted/40' : 'hover:bg-muted/40'}`}
                            >
                                <div className="font-medium">Blank</div>
                                <div className="text-xs text-muted-foreground">
                                    No columns or rows.
                                </div>
                            </div>

                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => setLayout('import')}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ')
                                        setLayout('import');
                                }}
                                className={`rounded-md p-3 cursor-pointer border border-transparent ${layout === 'import' ? 'ring-2 ring-primary bg-muted/40' : 'hover:bg-muted/40'}`}
                            >
                                <div className="font-medium">Import</div>
                                <div className="text-xs text-muted-foreground">
                                    CSV, Excel, ReqIF.
                                </div>
                            </div>

                            {layout === 'import' && (
                                <div className="space-y-4">
                                    <label className="text-sm font-medium">File</label>
                                    <div
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setIsDragging(true);
                                        }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsDragging(false);
                                            void handleFiles(
                                                e.dataTransfer?.files || null,
                                            );
                                        }}
                                        className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${isDragging ? 'border-primary bg-muted/40' : 'border-muted'}`}
                                    >
                                        <div className="text-sm">
                                            Drag and drop a file here, or{' '}
                                            <button
                                                type="button"
                                                className="text-primary underline underline-offset-2"
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                            >
                                                browse
                                            </button>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Accepted: .csv, .xlsx, .xls, .reqif
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".csv,.xlsx,.xls,.reqif,.xml,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/xml,text/xml"
                                            className="hidden"
                                            onChange={(e) =>
                                                void handleFiles(e.target.files)
                                            }
                                        />
                                    </div>
                                    {isParsing && (
                                        <div className="text-xs text-muted-foreground">
                                            Parsing file…
                                        </div>
                                    )}
                                    {importError && (
                                        <div className="text-xs text-red-500">
                                            {importError}
                                        </div>
                                    )}
                                    {importPreview && (
                                        <div className="text-xs text-muted-foreground">
                                            {columns.length} columns ·{' '}
                                            {!includeHeader && importPreview.rawHeaderRow
                                                ? 1 + (importPreview.rows?.length || 0)
                                                : importPreview.rows?.length || 0}{' '}
                                            rows
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {step === 'native' && layout === 'import' && importPreview && (
                        <div className="space-y-4">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Settings
                            </div>
                            <div className="flex flex-col gap-2 text-sm">
                                <div className="flex items-center gap-6">
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
                                        <span>Requirements</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="first-row-as-header"
                                    className="cursor-pointer"
                                >
                                    Use first row as column names
                                </Label>
                                <Switch
                                    id="first-row-as-header"
                                    checked={includeHeader}
                                    onCheckedChange={setIncludeHeader}
                                />
                            </div>

                            {tableType === 'requirements' && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">
                                        Native fields
                                    </div>
                                    <div className="grid grid-cols-12 items-center gap-2 text-xs text-muted-foreground px-1">
                                        <div className="col-span-4">Field</div>
                                        <div className="col-span-8">Map to column</div>
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
                                            className="grid grid-cols-12 items-center gap-2 py-1"
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
                            )}

                            <div className="h-px bg-border my-2" />
                            <div className="text-xs text-muted-foreground">
                                {tableType === 'requirements'
                                    ? visibleColumns.length
                                    : columns.length}{' '}
                                columns ·{' '}
                                {!includeHeader && importPreview.rawHeaderRow
                                    ? 1 + (importPreview.rows?.length || 0)
                                    : importPreview.rows?.length || 0}{' '}
                                rows
                            </div>
                        </div>
                    )}
                    {step === 'columns' && layout === 'import' && importPreview && (
                        <div className="space-y-4">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Columns
                            </div>
                            <div className="grid grid-cols-12 items-center gap-3 text-xs text-muted-foreground px-1">
                                <div className="col-span-5">Name</div>
                                <div className="col-span-3">Type</div>
                                <div className="col-span-4">Options</div>
                            </div>
                            <div className="divide-y divide-border">
                                {(tableType === 'requirements'
                                    ? visibleColumns
                                    : columns
                                ).map((col, idx) => (
                                    <div
                                        key={`col-${idx}`}
                                        className="grid grid-cols-12 items-center gap-3 py-2"
                                    >
                                        <div className="col-span-5">
                                            <Input
                                                value={col.name}
                                                onChange={(e) =>
                                                    setColumns((prev) => {
                                                        const next = [...prev];
                                                        next[idx] = {
                                                            ...next[idx],
                                                            name: e.target.value,
                                                        };
                                                        return next;
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <Select
                                                value={col.type}
                                                onValueChange={(v) =>
                                                    setColumns((prev) => {
                                                        const next = [...prev];
                                                        next[idx] = {
                                                            ...next[idx],
                                                            type: v as EditableColumnType,
                                                        };
                                                        return next;
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="text">
                                                        Text
                                                    </SelectItem>
                                                    <SelectItem value="select">
                                                        Select
                                                    </SelectItem>
                                                    <SelectItem value="multi_select">
                                                        Multi Select
                                                    </SelectItem>
                                                    <SelectItem value="number">
                                                        Number
                                                    </SelectItem>
                                                    <SelectItem value="date">
                                                        Date
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-4">
                                            {col.type === 'select' ||
                                            col.type === 'multi_select' ? (
                                                <Input
                                                    placeholder="Option1, Option2"
                                                    value={col.optionsStr}
                                                    onChange={(e) =>
                                                        setColumns((prev) => {
                                                            const next = [...prev];
                                                            next[idx] = {
                                                                ...next[idx],
                                                                optionsStr:
                                                                    e.target.value,
                                                            };
                                                            return next;
                                                        })
                                                    }
                                                />
                                            ) : (
                                                <div className="text-xs text-muted-foreground">
                                                    —
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {tableType === 'requirements'
                                    ? visibleColumns.length
                                    : columns.length}{' '}
                                columns ·{' '}
                                {!includeHeader && importPreview.rawHeaderRow
                                    ? 1 + (importPreview.rows?.length || 0)
                                    : importPreview.rows?.length || 0}{' '}
                                rows
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step === 'columns' ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setStep('native')}
                                disabled={isSubmitting}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleCreate}
                                disabled={
                                    isSubmitting ||
                                    !importPreview ||
                                    isParsing ||
                                    columns.length === 0
                                }
                            >
                                {isSubmitting ? 'Importing...' : 'Import Table'}
                            </Button>
                        </>
                    ) : step === 'native' ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setStep('layout')}
                                disabled={isSubmitting}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={() => setStep('columns')}
                                disabled={columns.length === 0}
                            >
                                Next
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            {layout === 'import' ? (
                                <Button
                                    onClick={() => setStep('native')}
                                    disabled={isParsing || !importPreview}
                                >
                                    Next
                                </Button>
                            ) : (
                                <Button onClick={handleCreate} disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating...' : 'Create Table'}
                                </Button>
                            )}
                        </>
                    )}
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
