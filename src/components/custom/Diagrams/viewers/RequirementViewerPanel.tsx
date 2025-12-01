'use client';

import { AlertCircle, FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequirement } from '@/hooks/queries/useRequirement';

interface RequirementViewerPanelProps {
    requirementId: string;
}

// Status color mapping
const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    in_review: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    archived: 'bg-slate-100 text-slate-600',
    active: 'bg-blue-100 text-blue-700',
    deleted: 'bg-red-100 text-red-700',
};

// Priority color mapping
const PRIORITY_COLORS: Record<string, string> = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
};

export function RequirementViewerPanel({ requirementId }: RequirementViewerPanelProps) {
    const { data: requirement, isLoading, error } = useRequirement(requirementId);

    if (isLoading) {
        return (
            <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 flex items-center gap-3 text-destructive">
                <AlertCircle size={20} />
                <div>
                    <p className="font-medium">Failed to load requirement</p>
                    <p className="text-sm text-muted-foreground">
                        {error instanceof Error ? error.message : 'Unknown error'}
                    </p>
                </div>
            </div>
        );
    }

    if (!requirement) {
        return (
            <div className="p-4 flex items-center gap-3 text-muted-foreground">
                <FileText size={20} />
                <div>
                    <p className="font-medium">Requirement not found</p>
                    <p className="text-sm">This requirement may have been deleted.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4 overflow-auto h-full">
            {/* Header with external ID */}
            {requirement.external_id && (
                <Badge variant="outline" className="font-mono text-xs">
                    {requirement.external_id}
                </Badge>
            )}

            {/* Name */}
            <h3 className="text-lg font-semibold leading-tight">{requirement.name}</h3>

            {/* Description */}
            {requirement.description && (
                <Card className="bg-muted/50">
                    <CardContent className="p-3">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {requirement.description}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Metadata badges */}
            <div className="flex flex-wrap gap-2">
                {requirement.status && (
                    <Badge
                        variant="secondary"
                        className={STATUS_COLORS[requirement.status] || ''}
                    >
                        {requirement.status.replace('_', ' ')}
                    </Badge>
                )}

                {requirement.priority && (
                    <Badge
                        variant="secondary"
                        className={PRIORITY_COLORS[requirement.priority] || ''}
                    >
                        {requirement.priority}
                    </Badge>
                )}

                {requirement.level && (
                    <Badge variant="outline" className="text-xs">
                        {requirement.level}
                    </Badge>
                )}

                {requirement.format && (
                    <Badge variant="outline" className="text-xs">
                        {requirement.format}
                    </Badge>
                )}

                {requirement.type && (
                    <Badge variant="outline" className="text-xs">
                        {requirement.type}
                    </Badge>
                )}
            </div>

            {/* Tags */}
            {requirement.tags && requirement.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {requirement.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
