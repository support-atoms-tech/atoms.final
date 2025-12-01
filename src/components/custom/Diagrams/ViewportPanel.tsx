'use client';

import { ExternalLink, FileText, Globe, Link, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useViewportPanelStore } from '@/store/viewportPanel.store';

import { DocumentPicker } from './DocumentPicker';
import { RequirementPicker } from './RequirementPicker';
import {
    DocumentViewerPanel,
    HyperlinkViewerPanel,
    RequirementViewerPanel,
} from './viewers';

// Color scheme for different content types
const CONTENT_COLORS = {
    requirement: '#8B5CF6', // Purple
    document: '#3B82F6', // Blue
    hyperlink: '#10B981', // Green
} as const;

interface ViewportPanelProps {
    projectId: string;
    organizationId: string;
    onClose: () => void;
}

export function ViewportPanel({
    projectId,
    organizationId,
    onClose,
}: ViewportPanelProps) {
    const router = useRouter();
    const { activeTab, contentType, contentId, documentId, setActiveTab, setContent } =
        useViewportPanelStore();

    // Local state for hyperlink URL input
    const [hyperlinkUrl, setHyperlinkUrl] = useState('');

    const handleTabChange = (value: string) => {
        // Just change the tab - content is independent
        setActiveTab(value as 'requirement' | 'document' | 'hyperlink');
    };

    const handleRequirementSelect = useCallback(
        (reqId: string, reqName: string, docId: string) => {
            setContent('requirement', reqId, 'manual', {
                documentId: docId,
                label: reqName,
            });
        },
        [setContent],
    );

    const handleDocumentSelect = useCallback(
        (docId: string, docName: string) => {
            setContent('document', docId, 'manual', { label: docName });
        },
        [setContent],
    );

    const handleHyperlinkSubmit = useCallback(() => {
        if (!hyperlinkUrl.trim()) return;

        let url = hyperlinkUrl.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        setContent('hyperlink', url, 'manual', { label: url });
        setHyperlinkUrl('');
    }, [hyperlinkUrl, setContent]);

    const handleOpenInEditor = useCallback(() => {
        if (contentType === 'requirement' && contentId) {
            const docId = documentId || '';
            router.push(
                `/org/${organizationId}/project/${projectId}/documents/${docId}?requirementId=${contentId}`,
            );
        } else if (contentType === 'document' && contentId) {
            router.push(
                `/org/${organizationId}/project/${projectId}/documents/${contentId}`,
            );
        } else if (contentType === 'hyperlink' && contentId) {
            window.open(contentId, '_blank', 'noopener,noreferrer');
        }
    }, [contentType, contentId, documentId, organizationId, projectId, router]);

    return (
        <div className="flex-shrink-0 flex flex-col w-[380px] bg-gray-100 dark:bg-sidebar rounded-lg ml-5 relative overflow-hidden animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{
                            backgroundColor: contentType
                                ? CONTENT_COLORS[contentType]
                                : '#6B7280',
                        }}
                    />
                    <h3 className="text-lg font-medium">Viewport</h3>
                </div>
                <div className="flex items-center gap-1">
                    {contentId && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={handleOpenInEditor}
                            title={
                                contentType === 'hyperlink'
                                    ? 'Open in new tab'
                                    : 'Open in full editor'
                            }
                        >
                            <ExternalLink size={14} />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={onClose}
                        title="Close viewport"
                    >
                        <X size={16} />
                    </Button>
                </div>
            </div>

            {/* Content Type Tabs */}
            <div className="p-4 pb-0">
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="requirement" className="text-xs">
                            <FileText size={14} className="mr-1" />
                            Req
                        </TabsTrigger>
                        <TabsTrigger value="document" className="text-xs">
                            <Link size={14} className="mr-1" />
                            Doc
                        </TabsTrigger>
                        <TabsTrigger value="hyperlink" className="text-xs">
                            <Globe size={14} className="mr-1" />
                            URL
                        </TabsTrigger>
                    </TabsList>

                    {/* Picker Section */}
                    <TabsContent value="requirement" className="mt-3">
                        <Label className="text-xs text-muted-foreground mb-1 block">
                            Select a requirement
                        </Label>
                        <RequirementPicker
                            projectId={projectId}
                            value={contentType === 'requirement' ? contentId || '' : ''}
                            onChange={handleRequirementSelect}
                            placeholder="Search requirements..."
                        />
                    </TabsContent>

                    <TabsContent value="document" className="mt-3">
                        <Label className="text-xs text-muted-foreground mb-1 block">
                            Select a document
                        </Label>
                        <DocumentPicker
                            projectId={projectId}
                            value={contentType === 'document' ? contentId || '' : ''}
                            onChange={handleDocumentSelect}
                            placeholder="Search documents..."
                        />
                    </TabsContent>

                    <TabsContent value="hyperlink" className="mt-3">
                        <Label className="text-xs text-muted-foreground mb-1 block">
                            Enter URL
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                type="url"
                                value={hyperlinkUrl}
                                onChange={(e) => setHyperlinkUrl(e.target.value)}
                                placeholder="https://example.com"
                                className="font-mono text-sm flex-1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleHyperlinkSubmit();
                                    }
                                }}
                            />
                            <Button
                                onClick={handleHyperlinkSubmit}
                                disabled={!hyperlinkUrl.trim()}
                                size="sm"
                            >
                                Go
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Content Viewer */}
            <div className="flex-1 min-h-0 border-t border-gray-200 dark:border-gray-700 mt-4">
                {contentId && contentType === activeTab ? (
                    <ScrollArea className="h-full">
                        {contentType === 'requirement' && (
                            <RequirementViewerPanel requirementId={contentId} />
                        )}
                        {contentType === 'document' && (
                            <DocumentViewerPanel documentId={contentId} />
                        )}
                        {contentType === 'hyperlink' && (
                            <HyperlinkViewerPanel url={contentId} />
                        )}
                    </ScrollArea>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-3">
                            {activeTab === 'requirement' && <FileText size={20} />}
                            {activeTab === 'document' && <Link size={20} />}
                            {activeTab === 'hyperlink' && <Globe size={20} />}
                        </div>
                        <p className="text-sm">
                            {activeTab === 'requirement' &&
                                'Select a requirement to view'}
                            {activeTab === 'document' && 'Select a document to view'}
                            {activeTab === 'hyperlink' && 'Enter a URL to preview'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
