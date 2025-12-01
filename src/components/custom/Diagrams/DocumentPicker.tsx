'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { cn } from '@/lib/utils';
import { Database } from '@/types/base/database.types';

type Document = Pick<
    Database['public']['Tables']['documents']['Row'],
    'id' | 'name' | 'description'
>;

interface DocumentPickerProps {
    projectId: string;
    value: string; // document ID
    onChange: (documentId: string, documentName: string) => void;
    onClose?: () => void;
    placeholder?: string;
}

export function DocumentPicker({
    projectId,
    value,
    onChange,
    onClose,
    placeholder = 'Search documents...',
}: DocumentPickerProps) {
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Get authenticated Supabase client
    const {
        supabase,
        isLoading: isAuthLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    // Fetch documents for the project
    useEffect(() => {
        const fetchDocuments = async () => {
            if (!projectId || !supabase || isAuthLoading) return;

            setIsFetching(true);
            setFetchError(null);

            try {
                const { data, error } = await supabase
                    .from('documents')
                    .select('id, name, description')
                    .eq('project_id', projectId)
                    .order('name', { ascending: true })
                    .limit(100);

                if (error) {
                    console.error('Error fetching documents:', error);
                    setFetchError('Failed to load documents');
                    return;
                }

                setDocuments(data || []);
            } catch (err) {
                console.error('Error in fetchDocuments:', err);
                setFetchError('An unexpected error occurred');
            } finally {
                setIsFetching(false);
            }
        };

        fetchDocuments();
    }, [projectId, supabase, isAuthLoading]);

    // Filter documents based on search query
    const filteredDocuments = useMemo(() => {
        if (!documents.length) return [];

        const query = searchQuery.toLowerCase().trim();
        if (!query) return documents;

        return documents.filter(
            (doc) =>
                doc.name?.toLowerCase().includes(query) ||
                doc.description?.toLowerCase().includes(query) ||
                doc.id.toLowerCase().includes(query),
        );
    }, [documents, searchQuery]);

    const handleSelect = (document: Document) => {
        onChange(document.id, document.name || 'Unnamed Document');
        setOpen(false);
        setSearchQuery('');
        if (onClose) {
            onClose();
        }
    };

    // Find the currently selected document
    const selectedDocument = documents.find((doc) => doc.id === value);
    const displayValue = selectedDocument
        ? selectedDocument.name || selectedDocument.id
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
                            Loading documents...
                        </div>
                    ) : fetchError ? (
                        <div className="p-4 text-center text-sm text-destructive">
                            {fetchError}
                        </div>
                    ) : filteredDocuments.length > 0 ? (
                        <div className="p-1">
                            {filteredDocuments.map((doc) => (
                                <button
                                    key={doc.id}
                                    onClick={() => handleSelect(doc)}
                                    className={cn(
                                        'w-full text-left px-3 py-2 rounded-sm hover:bg-accent transition-colors',
                                        'focus:bg-accent focus:outline-none',
                                        value === doc.id && 'bg-accent',
                                    )}
                                >
                                    <div className="font-medium text-sm">
                                        {doc.name || 'Unnamed Document'}
                                    </div>
                                    {doc.description && (
                                        <div className="text-xs text-muted-foreground truncate">
                                            {doc.description}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            {searchQuery
                                ? `No documents matching "${searchQuery}"`
                                : 'No documents found in this project'}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
