import { UserCircle2 } from 'lucide-react';

interface RequirementAssignmentProps {
    assignedTo?: string;
    reviewer?: string;
}

export function RequirementAssignment({
    assignedTo,
    reviewer,
}: RequirementAssignmentProps) {
    return (
        <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center">
                <UserCircle2 className="mr-2 h-5 w-5" /> Assignment
            </h3>
            <p className="text-muted-foreground">
                Assigned to: {assignedTo || 'Unassigned'}
            </p>
            <p className="text-muted-foreground">
                Reviewer: {reviewer || 'Not assigned'}
            </p>
        </div>
    );
}
