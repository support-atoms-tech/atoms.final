import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useGumloop } from '@/hooks/useGumloop';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Requirement } from '@/types';

interface RequirementAnalysisFormProps {
    requirement: Requirement;
    tempReqText: string;
    tempFormat: string;
    onFormatChange: (value: string) => void;
    onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onUpdate: (updatedRequirement: Requirement) => void;
}

export function RequirementAnalysisForm({
    requirement,
    tempReqText,
    tempFormat,
    onFormatChange,
    onTextChange,
    onUpdate,
}: RequirementAnalysisFormProps) {
    const { startPipeline, getPipelineRun } = useGumloop();
    const [pipelineRunId, setPipelineRunId] = useState<string>();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const { data: pipelineRun, isSuccess } = getPipelineRun(pipelineRunId);

    // Handle pipeline completion
    useEffect(() => {
        if (
            isSuccess &&
            pipelineRun?.state === 'DONE' &&
            pipelineRun.outputs?.output
        ) {
            const newCurrentReq = JSON.parse(
                JSON.stringify(pipelineRun.outputs),
            );
            const newHistoryReq = requirement.history_req
                ? [...requirement.history_req]
                : [];
            newHistoryReq.push(newCurrentReq);

            onUpdate({
                ...requirement,
                original_req: tempReqText,
                selected_format: tempFormat,
                current_req: newCurrentReq,
                history_req: newHistoryReq,
                rewritten_ears:
                    tempFormat === 'ears'
                        ? pipelineRun.outputs.output
                        : requirement.rewritten_ears,
                rewritten_incose:
                    tempFormat === 'incose'
                        ? pipelineRun.outputs.output
                        : requirement.rewritten_incose,
            });

            setIsAnalyzing(false);
            setPipelineRunId(undefined);
        } else if (isSuccess && pipelineRun?.state === 'FAILED') {
            setIsAnalyzing(false);
            setPipelineRunId(undefined);
            console.error('Pipeline failed');
        }
    }, [
        pipelineRun,
        isSuccess,
        onUpdate,
        requirement,
        tempFormat,
        tempReqText,
    ]);

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tempReqText || !tempFormat) return;

        setIsAnalyzing(true);
        try {
            const response = await startPipeline({
                requirement: tempReqText,
                objective: `Analyze and improve requirement clarity using ${tempFormat.toUpperCase()} format`,
            });

            if (!response?.run_id) {
                throw new Error('No run ID received from pipeline');
            }

            setPipelineRunId(response.run_id);
        } catch (error) {
            console.error('Analysis failed:', error);
            setIsAnalyzing(false);
        }
    };

    return (
        <form
            className="space-y-4 bg-muted/50 p-4 rounded-lg"
            onSubmit={handleAnalyze}
        >
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Edit Requirement
            </h3>
            <div className="space-y-4">
                <Select value={tempFormat} onValueChange={onFormatChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ears">EARS Format</SelectItem>
                        <SelectItem value="incose">INCOSE Format</SelectItem>
                    </SelectContent>
                </Select>
                <Textarea
                    placeholder="Write a new requirement"
                    value={tempReqText}
                    onChange={onTextChange}
                    className="min-h-[100px] w-full"
                />
                <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={!tempFormat || !tempReqText || isAnalyzing}
                    className="gap-2 w-full"
                >
                    {isAnalyzing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="h-4 w-4" />
                    )}
                    {isAnalyzing ? 'Analyzing...' : 'Analyze & Improve'}
                </Button>
            </div>
        </form>
    );
}
