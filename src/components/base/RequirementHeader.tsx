import { Code, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Requirement } from '@/types';

interface RequirementHeaderProps {
    requirement: Requirement;
    onViewCurrent: () => void;
    onViewHistory: () => void;
}

export function RequirementHeader({
    requirement,
    onViewCurrent,
    onViewHistory,
}: RequirementHeaderProps) {
    return (
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{requirement.title}</h2>
            {requirement.original_req && (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onViewCurrent}
                        className="gap-2"
                    >
                        <Code className="h-4 w-4" />
                        View Feedback
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onViewHistory}
                        className="gap-2"
                    >
                        <History className="h-4 w-4" />
                        Version History
                    </Button>
                </div>
            )}
        </div>
    );
}
