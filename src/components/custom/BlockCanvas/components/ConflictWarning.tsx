'use client';

import { AlertTriangle } from 'lucide-react';
import React from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getUserColor } from '@/lib/userColors';

interface ConflictWarningProps {
    conflictingUsers: Array<{
        userId: string;
        userName: string;
    }>;
    type: 'cell' | 'text';
    onDismiss?: () => void;
}

/**
 * ConflictWarning component - warns when multiple users edit same content
 * Google Docs-style conflict notification
 */
export const ConflictWarning: React.FC<ConflictWarningProps> = ({
    conflictingUsers,
    type,
    onDismiss,
}) => {
    if (conflictingUsers.length === 0) return null;

    const userNames = conflictingUsers.map((u) => u.userName).join(', ');
    const firstUserColor = getUserColor(conflictingUsers[0].userId);

    return (
        <Alert
            variant="destructive"
            className="fixed bottom-20 right-8 z-50 w-96 animate-in slide-in-from-bottom-5"
            style={{ borderLeftColor: firstUserColor, borderLeftWidth: '4px' }}
        >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
                Editing Conflict
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="text-sm hover:opacity-70"
                        aria-label="Dismiss"
                    >
                        ✕
                    </button>
                )}
            </AlertTitle>
            <AlertDescription>
                <span className="font-semibold">{userNames}</span>
                {conflictingUsers.length === 1 ? ' is' : ' are'} also editing this{' '}
                {type === 'cell' ? 'cell' : 'section'}. Your changes may conflict.
            </AlertDescription>
        </Alert>
    );
};
