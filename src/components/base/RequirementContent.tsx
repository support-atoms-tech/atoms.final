import { Sparkles } from 'lucide-react';
import type { Requirement } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { RequirementAnalysisForm } from './RequirementAnalysisForm';

interface RequirementContentProps {
    requirement: Requirement;
    onFormatChange: (value: string) => void;
    onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onUpdate: (updatedRequirement: Requirement) => void;
}

export function RequirementContent({
    requirement,
    onFormatChange,
    onTextChange,
    onUpdate,
}: RequirementContentProps) {
    const [editRequirement, setEditRequirement] = useState(false);
    const [tempReqText, setTempReqText] = useState(
        requirement.original_req || '',
    );
    const [tempFormat, setTempFormat] = useState(
        requirement.selected_format || '',
    );

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTempReqText(e.target.value);
        onTextChange(e);
    };

    const handleFormatChange = (value: string) => {
        setTempFormat(value);
        onFormatChange(value);
    };

    if (editRequirement) {
        return (
            <div className="relative font-mono">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setEditRequirement(false)}
                    className="absolute right-2 top-2 z-10"
                >
                    X
                </Button>
                <RequirementAnalysisForm
                    requirement={requirement}
                    tempReqText={tempReqText}
                    tempFormat={tempFormat}
                    onFormatChange={handleFormatChange}
                    onTextChange={handleTextChange}
                    onUpdate={onUpdate || (() => {})}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4 font-mono">
            <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                <h5 className="text-lg font-semibold flex items-center justify-between mb-2 pb-2 border-b border-border/50">
                    Original Requirement
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setEditRequirement(true)}
                    >
                        <Sparkles className="h-5 w-5 text-primary" />
                    </Button>
                </h5>
                <p className="text-muted-foreground leading-relaxed">
                    {requirement.original_req}
                </p>
                {(requirement.rewritten_ears ||
                    requirement.rewritten_incose) && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                        <h5 className="text-lg font-semibold flex items-center justify-between gap-2 mb-2 pb-2 border-b border-border/50">
                            AI-Improved Requirement
                            <Badge className="mb-2 font-mono" variant="outline">
                                {requirement.selected_format === 'ears'
                                    ? 'EARS'
                                    : 'INCOSE'}
                            </Badge>
                        </h5>
                        <div className="space-y-4">
                            <p className="text-muted-foreground font-mono leading-relaxed p-2 bg-background/50 rounded border border-border/50">
                                {requirement.selected_format === 'ears'
                                    ? requirement.rewritten_ears
                                    : requirement.rewritten_incose}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
