'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { cn } from '@/lib/utils';
import { Database } from '@/types/base/database.types';

type Requirement = Pick<
    Database['public']['Tables']['requirements']['Row'],
    'id' | 'name' | 'external_id' | 'description' | 'document_id'
>;

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

    // Get authenticated Supabase client
    const {
        supabase,
        isLoading: isAuthLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    // Fetch requirements for the project
    useEffect(() => {
        const fetchRequirements = async () => {
            if (!projectId || !supabase || isAuthLoading) return;

            setIsFetching(true);
            setFetchError(null);

            try {
                // First, fetch all documents in the project
                const { data: documents, error: docsError } = await supabase
                    .from('documents')
                    .select('id')
                    .eq('project_id', projectId);

                if (docsError) {
                    console.error('Error fetching documents:', docsError);
                    setFetchError('Failed to load project documents');
                    return;
                }

                if (!documents || documents.length === 0) {
                    // No documents in project - not an error, just empty state
                    setRequirements([]);
                    return;
                }

                const documentIds = documents.map((doc) => doc.id);

                // Now fetch requirements from those documents
                const { data, error } = await supabase
                    .from('requirements')
                    .select('id, name, external_id, description, document_id')
                    .in('document_id', documentIds)
                    .is('is_deleted', false)
                    .order('name', { ascending: true })
                    .limit(100);

                if (error) {
                    console.error('Error fetching requirements:', error);
                    setFetchError('Failed to load requirements');
                    return;
                }

                setRequirements(data || []);
            } catch (err) {
                console.error('Error in fetchRequirements:', err);
                setFetchError('An unexpected error occurred');
            } finally {
                setIsFetching(false);
            }
        };

        fetchRequirements();
    }, [projectId, supabase, isAuthLoading]);

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
                    {authError ? (
                        <div className="p-4 text-center text-sm text-destructive">
                            Authentication error: {authError}
                        </div>
                    ) : isAuthLoading || isFetching ? (
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
