import { PlusCircle } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { PropertyType } from '@/components/custom/BlockCanvas/types';

interface AddColumnDialogProps {
    onAddColumn: (name: string, dataType: PropertyType) => Promise<void>;
    disabled?: boolean;
}

// Define property type options with display names
const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'select', label: 'Select (Dropdown)' },
    { value: 'multi_select', label: 'Multi-Select' },
    { value: 'user', label: 'User' },
    { value: 'url', label: 'URL' },
    { value: 'email', label: 'Email' },
    { value: 'rich_text', label: 'Rich Text' },
];

export const AddColumnDialog: React.FC<AddColumnDialogProps> = ({
    onAddColumn,
    disabled = false,
}) => {
    const [open, setOpen] = useState(false);
    const [columnName, setColumnName] = useState('');
    const [dataType, setDataType] = useState<PropertyType>('text');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate input
        if (!columnName.trim()) {
            setError('Column name is required');
            return;
        }

        // Check if column name contains only alphanumeric characters and spaces
        if (!/^[a-zA-Z0-9 ]+$/.test(columnName)) {
            setError(
                'Column name can only contain letters, numbers, and spaces',
            );
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            await onAddColumn(columnName, dataType);
            setOpen(false);
            setColumnName('');
            setDataType('text');
        } catch (err) {
            console.error('Failed to add column:', err);
            setError('Failed to add column. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    disabled={disabled}
                >
                    <PlusCircle className="h-4 w-4" />
                    Add Column
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Column</DialogTitle>
                    <DialogDescription>
                        Create a new column for your table. This will add a new
                        property to all requirements.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={columnName}
                                onChange={(e) => setColumnName(e.target.value)}
                                className="col-span-3"
                                placeholder="Enter column name"
                                autoComplete="off"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dataType" className="text-right">
                                Data Type
                            </Label>
                            <Select
                                value={dataType}
                                onValueChange={(value) => setDataType(value as PropertyType)}
                            >
                                <SelectTrigger
                                    className="col-span-3"
                                    id="dataType"
                                >
                                    <SelectValue placeholder="Select data type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROPERTY_TYPE_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {error && (
                            <div className="text-sm text-red-500 mt-2">
                                {error}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !columnName.trim()}
                        >
                            {isSubmitting ? 'Adding...' : 'Add Column'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
