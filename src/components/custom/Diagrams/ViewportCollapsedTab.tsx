'use client';

import { PanelRight } from 'lucide-react';

interface ViewportCollapsedTabProps {
    onClick: () => void;
}

export function ViewportCollapsedTab({ onClick }: ViewportCollapsedTabProps) {
    return (
        <button
            onClick={onClick}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-l-lg cursor-pointer transition-colors shadow-lg"
            title="Open Viewport"
        >
            <PanelRight size={18} />
        </button>
    );
}
