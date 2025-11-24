'use client';

import React from 'react';

import { cn } from '@/lib/utils';

interface RemoteCursorProps {
    userId: string;
    userName: string;
    color: string;
    top: number;
    left: number;
    height: number;
    // For selection ranges (when from !== to)
    selection?: {
        top: number;
        left: number;
        width: number;
        height: number;
    };
}

/**
 * RemoteCursor component - displays other users' cursors in text blocks
 * Google Docs-style collaborative editing
 */
export const RemoteCursor: React.FC<RemoteCursorProps> = ({
    userName,
    color,
    top,
    left,
    height,
    selection,
}) => {
    return (
        <>
            {/* Selection highlight (shown when from !== to) */}
            {selection && (
                <div
                    className="pointer-events-none absolute z-40 transition-all duration-100"
                    style={{
                        top: `${selection.top}px`,
                        left: `${selection.left}px`,
                        width: `${selection.width}px`,
                        height: `${selection.height}px`,
                        backgroundColor: color + '30', // 30% opacity
                        borderRadius: '2px',
                    }}
                />
            )}

            {/* Cursor line */}
            <div
                className="pointer-events-none absolute z-50 transition-all duration-100"
                style={{
                    top: `${top}px`,
                    left: `${left}px`,
                }}
            >
                <div
                    className="w-0.5"
                    style={{
                        height: `${height}px`,
                        backgroundColor: color,
                    }}
                />

                {/* User name label */}
                <div
                    className={cn(
                        'absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5',
                        'text-xs font-medium text-white shadow-sm',
                    )}
                    style={{
                        backgroundColor: color,
                    }}
                >
                    {userName}
                </div>
            </div>
        </>
    );
};
