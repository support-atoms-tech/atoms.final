import { Tags } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RequirementMetadataProps {
    acceptanceCriteria?: string[];
    tags?: string[];
}

export function RequirementMetadata({
    acceptanceCriteria,
    tags,
}: RequirementMetadataProps) {
    return (
        <div className="space-y-6">
            {acceptanceCriteria && acceptanceCriteria.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                        Acceptance Criteria
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {acceptanceCriteria.map((criteria, index) => (
                            <li key={index}>{criteria}</li>
                        ))}
                    </ul>
                </div>
            )}
            {tags && tags.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold flex items-center">
                        <Tags className="mr-2 h-5 w-5" /> Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
