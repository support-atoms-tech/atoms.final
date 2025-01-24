import { Badge } from '@/components/ui/badge';

interface RequirementStatusProps {
    status: string;
    priority: string;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed':
            return 'border-green-500 text-green-500';
        case 'in_progress':
            return 'border-blue-500 text-blue-500';
        case 'testing':
            return 'border-purple-500 text-purple-500';
        case 'pending_review':
            return 'border-yellow-500 text-yellow-500';
        case 'rejected':
            return 'border-red-500 text-red-500';
        case 'approved':
            return 'border-emerald-500 text-emerald-500';
        default:
            return 'border-muted text-muted-foreground';
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'critical':
            return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
        case 'high':
            return 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20';
        case 'medium':
            return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
        case 'low':
            return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
        default:
            return 'bg-muted text-muted-foreground';
    }
};

export function RequirementStatus({
    status,
    priority,
}: RequirementStatusProps) {
    return (
        <div className="flex gap-2">
            <Badge variant="outline" className={getStatusColor(status)}>
                {status}
            </Badge>
            <Badge className={getPriorityColor(priority)}>{priority}</Badge>
        </div>
    );
}
