'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Requirement {
    id: string;
    name: string;
    external_id: string | null;
    description: string | null;
    document_id: string;
}

interface RequirementPickerProps {
    projectId: string;
    value: string; // requirement ID
    onChange: (
        requirementId: string,
        requirementName: string,
        documentId: string,
    ) => void;
    onClose?: () => void;
    placeholder?: string;
}

export function RequirementPicker({
    projectId,
    value,
    onChange,
    onClose,
    placeholder = 'Search requirements...',
}: RequirementPickerProps) {
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Fetch requirements via API route (bypasses RLS issues with service role client)
    useEffect(() => {
        const fetchRequirements = async () => {
            if (!projectId) return;

            setIsFetching(true);
            setFetchError(null);

            try {
                const response = await fetch(`/api/projects/${projectId}/requirements`);

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Error fetching requirements:', errorData);
                    setFetchError(errorData.error || 'Failed to load requirements');
                    return;
                }

                const { requirements: data } = await response.json();

                // Map the result to match our Requirement type
                // Note: API returns nested `documents` object from JOIN, need to extract document_id
                const mappedRequirements = (data || []).map(
                    (item: Record<string, unknown>) => {
                        // Handle both nested documents object (from JOIN) and flat document_id
                        const documents = item.documents as { id: string } | undefined;
                        const documentId = documents?.id || (item.document_id as string);

                        return {
                            id: item.id as string,
                            name: item.name as string,
                            external_id: item.external_id as string | null,
                            description: item.description as string | null,
                            document_id: documentId,
                        };
                    },
                );

                // Deduplicate requirements by ID (JOIN query can return duplicates)
                const uniqueRequirements: Requirement[] = Array.from(
                    new Map<string, Requirement>(
                        mappedRequirements.map((r: Requirement) => [r.id, r]),
                    ).values(),
                );

                // Debug: Log requirements count for diagnosis
                console.log(
                    `[RequirementPicker] Fetched ${mappedRequirements.length} requirements, ${uniqueRequirements.length} unique for project ${projectId}`,
                );
                if (uniqueRequirements.length === 0) {
                    console.log(
                        '[RequirementPicker] No requirements found - check if requirements exist in this project',
                    );
                }

                setRequirements(uniqueRequirements);
            } catch (err) {
                console.error('Error in fetchRequirements:', err);
                setFetchError('An unexpected error occurred');
            } finally {
                setIsFetching(false);
            }
        };

        fetchRequirements();
    }, [projectId]);

    // Filter requirements based on search query
    const filteredRequirements = useMemo(() => {
        if (!requirements.length) return [];

        const query = searchQuery.toLowerCase().trim();
        if (!query) return requirements;

        return requirements.filter(
            (req) =>
                req.external_id?.toLowerCase().includes(query) ||
                req.name?.toLowerCase().includes(query) ||
                req.description?.toLowerCase().includes(query) ||
                req.id.toLowerCase().includes(query),
        );
    }, [requirements, searchQuery]);

    const handleSelect = (requirement: Requirement) => {
        onChange(
            requirement.id,
            requirement.name || requirement.external_id || 'Unnamed Requirement',
            requirement.document_id,
        );
        setOpen(false);
        setSearchQuery('');
        if (onClose) {
            onClose();
        }
    };

    // Find the currently selected requirement
    const selectedRequirement = requirements.find((req) => req.id === value);
    const displayValue = selectedRequirement
        ? selectedRequirement.external_id ||
          selectedRequirement.name ||
          selectedRequirement.id
        : '';

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Input
                    ref={inputRef}
                    type="text"
                    value={searchQuery || displayValue}
                    onClick={() => setOpen(true)}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setOpen(true);
                    }}
                    placeholder={placeholder}
                    className="font-mono text-sm"
                />
            </PopoverTrigger>
            <PopoverContent
                className="w-[400px] p-0"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <ScrollArea className="h-[300px]">
                    {isFetching ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Loading requirements...
                        </div>
                    ) : fetchError ? (
                        <div className="p-4 text-center text-sm text-destructive">
                            {fetchError}
                        </div>
                    ) : filteredRequirements.length > 0 ? (
                        <div className="p-1">
                            {filteredRequirements.map((req) => (
                                <button
                                    key={req.id}
                                    onClick={() => handleSelect(req)}
                                    className={cn(
                                        'w-full text-left px-3 py-2 rounded-sm hover:bg-accent transition-colors',
                                        'focus:bg-accent focus:outline-none',
                                        value === req.id && 'bg-accent',
                                    )}
                                >
                                    <div className="font-mono text-sm font-medium">
                                        {req.external_id || req.id}
                                    </div>
                                    {req.name && (
                                        <div className="text-xs text-muted-foreground truncate">
                                            {req.name}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            {searchQuery
                                ? `No requirements matching "${searchQuery}"`
                                : 'No requirements found in this project'}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
