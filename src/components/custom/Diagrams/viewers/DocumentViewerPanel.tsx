'use client';

import { AlertCircle, ChevronDown, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    useDocument,
    useDocumentBlocksAndRequirements,
} from '@/hooks/queries/useDocument';
import { Requirement } from '@/types/base/requirements.types';

interface DocumentViewerPanelProps {
    documentId: string;
}

// Block with requirements type (simplified from BlockCanvas)
interface BlockWithRequirements {
    id: string;
    name: string;
    type: string;
    content: Record<string, unknown> | null;
    position: number;
    requirements?: Requirement[];
}

// Initial number of blocks to show
const INITIAL_BLOCKS_COUNT = 3;

export function DocumentViewerPanel({ documentId }: DocumentViewerPanelProps) {
    const [showAllBlocks, setShowAllBlocks] = useState(false);
    const {
        data: document,
        isLoading: docLoading,
        error: docError,
    } = useDocument(documentId);
    const {
        data: blocksData,
        isLoading: blocksLoading,
        error: blocksError,
    } = useDocumentBlocksAndRequirements(documentId);

    const isLoading = docLoading || blocksLoading;
    const error = docError || blocksError;

    // Sort blocks by position
    const sortedBlocks = useMemo(() => {
        if (!blocksData) return [];
        return [...(blocksData as BlockWithRequirements[])].sort(
            (a, b) => a.position - b.position,
        );
    }, [blocksData]);

    // Blocks to display
    const visibleBlocks = useMemo(() => {
        if (showAllBlocks) return sortedBlocks;
        return sortedBlocks.slice(0, INITIAL_BLOCKS_COUNT);
    }, [sortedBlocks, showAllBlocks]);

    const hasMoreBlocks = sortedBlocks.length > INITIAL_BLOCKS_COUNT;

    if (isLoading) {
        return (
            <div className="p-4 space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 flex items-center gap-3 text-destructive">
                <AlertCircle size={20} />
                <div>
                    <p className="font-medium">Failed to load document</p>
                    <p className="text-sm text-muted-foreground">
                        {error instanceof Error ? error.message : 'Unknown error'}
                    </p>
                </div>
            </div>
        );
    }

    if (!document) {
        return (
            <div className="p-4 flex items-center gap-3 text-muted-foreground">
                <FileText size={20} />
                <div>
                    <p className="font-medium">Document not found</p>
                    <p className="text-sm">This document may have been deleted.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4 overflow-auto h-full">
            {/* Document header */}
            <div>
                <h3 className="text-lg font-semibold leading-tight">{document.name}</h3>
                {document.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {document.description}
                    </p>
                )}
            </div>

            {/* Blocks */}
            <div className="space-y-3">
                {visibleBlocks.map((block) => (
                    <ReadOnlyBlock key={block.id} block={block} />
                ))}
            </div>

            {/* Show more button */}
            {hasMoreBlocks && !showAllBlocks && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowAllBlocks(true)}
                >
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show {sortedBlocks.length - INITIAL_BLOCKS_COUNT} more blocks
                </Button>
            )}

            {/* Empty state */}
            {sortedBlocks.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">This document has no content yet.</p>
                </div>
            )}
        </div>
    );
}

// Read-only block renderer
function ReadOnlyBlock({ block }: { block: BlockWithRequirements }) {
    if (block.type === 'text') {
        return <ReadOnlyTextBlock block={block} />;
    }
    if (block.type === 'table') {
        return <ReadOnlyTableBlock block={block} />;
    }
    // Fallback for unknown block types
    return (
        <Card className="bg-muted/30">
            <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">
                    Unknown block type: {block.type}
                </p>
            </CardContent>
        </Card>
    );
}

// Read-only text block
function ReadOnlyTextBlock({ block }: { block: BlockWithRequirements }) {
    const content = block.content as { text?: string } | null;
    const text = content?.text || '';

    if (!text) {
        return null;
    }

    return (
        <Card className="bg-muted/30">
            <CardContent className="p-3">
                <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: text }}
                />
            </CardContent>
        </Card>
    );
}

// Read-only table block
function ReadOnlyTableBlock({ block }: { block: BlockWithRequirements }) {
    const requirements = block.requirements || [];

    if (requirements.length === 0) {
        return (
            <Card className="bg-muted/30">
                <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm font-medium">{block.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <p className="text-xs text-muted-foreground">
                        No requirements in this table.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Sort requirements by position
    const sortedRequirements = [...requirements].sort(
        (a, b) => (a.position || 0) - (b.position || 0),
    );

    return (
        <Card className="bg-muted/30">
            <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{block.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                        {requirements.length} requirement
                        {requirements.length !== 1 ? 's' : ''}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-2 text-xs font-medium text-muted-foreground">
                                    ID
                                </th>
                                <th className="text-left p-2 text-xs font-medium text-muted-foreground">
                                    Name
                                </th>
                                <th className="text-left p-2 text-xs font-medium text-muted-foreground">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRequirements.slice(0, 10).map((req) => (
                                <tr key={req.id} className="border-b last:border-b-0">
                                    <td className="p-2 font-mono text-xs">
                                        {req.external_id || '-'}
                                    </td>
                                    <td
                                        className="p-2 truncate max-w-[200px]"
                                        title={req.name}
                                    >
                                        {req.name}
                                    </td>
                                    <td className="p-2">
                                        <Badge
                                            variant="outline"
                                            className="text-xs capitalize"
                                        >
                                            {req.status?.replace('_', ' ') || 'draft'}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {sortedRequirements.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                            + {sortedRequirements.length - 10} more requirements
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
