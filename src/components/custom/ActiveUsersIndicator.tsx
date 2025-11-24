'use client';

import React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { getUserColor } from '@/lib/userColors';
import { cn } from '@/lib/utils';
import { UserPresence, useDocumentStore } from '@/store/document.store';

interface ActiveUsersIndicatorProps {
    className?: string;
}

/**
 * Displays active users currently viewing/editing the document
 * Google Sheets style presence indicator
 */
export const ActiveUsersIndicator: React.FC<ActiveUsersIndicatorProps> = ({
    className,
}) => {
    const activeUsers = useDocumentStore(
        (state: { activeUsers: Map<string, UserPresence> }) => state.activeUsers,
    );

    // Convert Map to Array for rendering
    const users: UserPresence[] = Array.from(activeUsers.values());

    if (users.length === 0) {
        return null;
    }

    return (
        <div className={cn('flex items-center gap-1', className)}>
            <TooltipProvider>
                {users.map((user) => (
                    <UserAvatar key={user.userId} user={user} />
                ))}
            </TooltipProvider>
        </div>
    );
};

interface UserAvatarProps {
    user: UserPresence;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user }) => {
    const initials = getInitials(user.userName);
    const color = getUserColor(user.userId);

    const tooltipContent = (
        <div className="text-xs">
            <div className="font-medium">{user.userName}</div>
            {user.userEmail && <div className="text-gray-400">{user.userEmail}</div>}
            {user.isTyping && <div className="mt-1 text-green-400">✍️ Typing...</div>}
            {user.editingCell && !user.isTyping && (
                <div className="mt-1 text-gray-300">Editing cell...</div>
            )}
            {user.lastActivity && (
                <div className="mt-1 text-gray-500 text-[10px]">
                    Last active:{' '}
                    {new Date(user.lastActivity).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </div>
            )}
        </div>
    );

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="relative">
                    <Avatar
                        className={cn(
                            'h-8 w-8 border-2 cursor-pointer transition-transform hover:scale-110',
                            user.isTyping && 'animate-pulse',
                        )}
                        style={{ borderColor: color }}
                    >
                        <AvatarFallback
                            style={{ backgroundColor: color }}
                            className="text-white text-xs"
                        >
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    {user.isTyping && (
                        <div
                            className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white"
                            style={{ backgroundColor: color }}
                        >
                            <div
                                className="absolute inset-0 rounded-full animate-ping opacity-75"
                                style={{ backgroundColor: color }}
                            />
                        </div>
                    )}
                </div>
            </TooltipTrigger>
            <TooltipContent>{tooltipContent}</TooltipContent>
        </Tooltip>
    );
};

/**
 * Get initials from user name
 */
function getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
