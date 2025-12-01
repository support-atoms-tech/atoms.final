'use client';

import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { ExternalLink, FileText, Link2, Link, LinkIcon, Unlink, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { DocumentPicker } from './DocumentPicker';
import { RequirementPicker } from './RequirementPicker';

// Color scheme for different link types
export const LINK_COLORS = {
    requirement: '#8B5CF6', // Purple
    document: '#3B82F6', // Blue
    hyperlink: '#10B981', // Green
} as const;

export type LinkType = 'requirement' | 'document' | 'hyperlink';

// Extended element type with link properties
export type ElementWithLinkProps = ExcalidrawElement & {
    requirementId?: string;
    documentId?: string;
    linkedDocumentId?: string;
    hyperlinkUrl?: string;
    linkLabel?: string;
    linkType?: LinkType;
};

// Info passed when viewing linked content in viewport
export interface LinkedContentInfo {
    type: LinkType;
    contentId: string;
    documentId?: string;
    label?: string;
}

interface LinkingToolbarProps {
    selectedElements: readonly ExcalidrawElement[];
    projectId: string;
    organizationId: string;
    onLinkRequirement: (
        requirementId: string,
        requirementName: string,
        documentId: string,
        linkLabel?: string,
    ) => void;
    onLinkDocument: (
        documentId: string,
        documentName: string,
        linkLabel?: string,
    ) => void;
    onLinkHyperlink: (url: string, linkLabel?: string) => void;
    onUnlink: () => void;
    onUpdateLinkLabel?: (linkLabel: string) => void;
    onViewLinkedContent?: (info: LinkedContentInfo) => void;
}

export function LinkingToolbar({
    selectedElements,
    projectId,
    organizationId: _organizationId,
    onLinkRequirement,
    onLinkDocument,
    onLinkHyperlink,
    onUnlink,
    onUpdateLinkLabel: _onUpdateLinkLabel,
    onViewLinkedContent,
}: LinkingToolbarProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<LinkType>('requirement');
    const [hyperlinkUrl, setHyperlinkUrl] = useState('');
    const [customLinkLabel, setCustomLinkLabel] = useState('');

    // Get current link info from selected elements
    const currentLinkInfo = useMemo(() => {
        if (selectedElements.length === 0) return null;

        const firstLinkedElement = selectedElements.find((el) => {
            const elem = el as ElementWithLinkProps;
            return elem.requirementId || elem.linkedDocumentId || elem.hyperlinkUrl;
        }) as ElementWithLinkProps | undefined;

        if (!firstLinkedElement) return null;

        if (firstLinkedElement.requirementId) {
            return {
                type: 'requirement' as LinkType,
                id: firstLinkedElement.requirementId,
                documentId: firstLinkedElement.documentId,
                label: firstLinkedElement.linkLabel,
            };
        }
        if (firstLinkedElement.linkedDocumentId) {
            return {
                type: 'document' as LinkType,
                id: firstLinkedElement.linkedDocumentId,
                label: firstLinkedElement.linkLabel,
            };
        }
        if (firstLinkedElement.hyperlinkUrl) {
            return {
                type: 'hyperlink' as LinkType,
                url: firstLinkedElement.hyperlinkUrl,
                label: firstLinkedElement.linkLabel,
            };
        }
        return null;
    }, [selectedElements]);

    const hasLink = currentLinkInfo !== null;

    const handleRequirementSelect = useCallback(
        (reqId: string, reqName: string, docId: string) => {
            onLinkRequirement(reqId, reqName, docId, customLinkLabel || undefined);
            setOpen(false);
            setCustomLinkLabel('');
        },
        [onLinkRequirement, customLinkLabel],
    );

    const handleDocumentSelect = useCallback(
        (docId: string, docName: string) => {
            onLinkDocument(docId, docName, customLinkLabel || undefined);
            setOpen(false);
            setCustomLinkLabel('');
        },
        [onLinkDocument, customLinkLabel],
    );

    const handleHyperlinkSubmit = useCallback(() => {
        if (!hyperlinkUrl.trim()) return;

        // Add https:// if no protocol specified
        let url = hyperlinkUrl.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        onLinkHyperlink(url, customLinkLabel || undefined);
        setOpen(false);
        setHyperlinkUrl('');
        setCustomLinkLabel('');
    }, [hyperlinkUrl, customLinkLabel, onLinkHyperlink]);

    const handleUnlink = useCallback(() => {
        onUnlink();
        setOpen(false);
    }, [onUnlink]);

    // Handle popover open - auto-trigger viewport for linked elements
    const handleOpenChange = useCallback(
        (isOpen: boolean) => {
            setOpen(isOpen);

            // When opening on a linked element, auto-open viewport
            if (isOpen && currentLinkInfo && onViewLinkedContent) {
                onViewLinkedContent({
                    type: currentLinkInfo.type,
                    contentId:
                        currentLinkInfo.type === 'hyperlink'
                            ? currentLinkInfo.url!
                            : currentLinkInfo.id!,
                    documentId: currentLinkInfo.documentId,
                    label: currentLinkInfo.label,
                });
            }
        },
        [currentLinkInfo, onViewLinkedContent],
    );

    // Don't render if no elements are selected
    if (selectedElements.length === 0) {
        return null;
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 ${hasLink ? 'text-primary' : ''}`}
                    title="Link element"
                >
                    <Link2
                        size={14}
                        style={
                            hasLink
                                ? { color: LINK_COLORS[currentLinkInfo.type] }
                                : undefined
                        }
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px] p-0 z-[1002]" align="center" side="top">
                <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm">
                            Link {selectedElements.length} element
                            {selectedElements.length > 1 ? 's' : ''}
                        </h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setOpen(false)}
                        >
                            <X size={14} />
                        </Button>
                    </div>

                    <Tabs
                        value={activeTab}
                        onValueChange={(v) => setActiveTab(v as LinkType)}
                    >
                        <TabsList className="grid w-full grid-cols-3 mb-3">
                            <TabsTrigger value="requirement" className="text-xs">
                                <FileText size={14} className="mr-1" />
                                Requirement
                            </TabsTrigger>
                            <TabsTrigger value="document" className="text-xs">
                                <Link size={14} className="mr-1" />
                                Document
                            </TabsTrigger>
                            <TabsTrigger value="hyperlink" className="text-xs">
                                <ExternalLink size={14} className="mr-1" />
                                Hyperlink
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="requirement" className="mt-0">
                            <div className="space-y-3">
                                <RequirementPicker
                                    projectId={projectId}
                                    value={
                                        currentLinkInfo?.type === 'requirement'
                                            ? currentLinkInfo.id || ''
                                            : ''
                                    }
                                    onChange={handleRequirementSelect}
                                    placeholder="Search requirements..."
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="document" className="mt-0">
                            <div className="space-y-3">
                                <DocumentPicker
                                    projectId={projectId}
                                    value={
                                        currentLinkInfo?.type === 'document'
                                            ? currentLinkInfo.id || ''
                                            : ''
                                    }
                                    onChange={handleDocumentSelect}
                                    placeholder="Search documents..."
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="hyperlink" className="mt-0">
                            <div className="space-y-3">
                                <Input
                                    type="url"
                                    value={hyperlinkUrl}
                                    onChange={(e) => setHyperlinkUrl(e.target.value)}
                                    placeholder="https://example.com"
                                    className="font-mono text-sm"
                                />
                                <Button
                                    onClick={handleHyperlinkSubmit}
                                    disabled={!hyperlinkUrl.trim()}
                                    className="w-full"
                                    size="sm"
                                >
                                    <LinkIcon size={14} className="mr-2" />
                                    Apply Link
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Custom Link Label */}
                    <div className="mt-3 pt-3 border-t">
                        <Label
                            htmlFor="linkLabel"
                            className="text-xs text-muted-foreground"
                        >
                            Custom Link Label (optional)
                        </Label>
                        <Input
                            id="linkLabel"
                            value={customLinkLabel}
                            onChange={(e) => setCustomLinkLabel(e.target.value)}
                            placeholder="Display name for this link"
                            className="mt-1 text-sm"
                        />
                    </div>

                    {/* Current Link Display */}
                    {hasLink && (
                        <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                            backgroundColor:
                                                LINK_COLORS[currentLinkInfo.type],
                                        }}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        Currently linked to{' '}
                                        <span className="font-medium">
                                            {currentLinkInfo.type === 'hyperlink'
                                                ? currentLinkInfo.url
                                                : currentLinkInfo.label ||
                                                  currentLinkInfo.id}
                                        </span>
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleUnlink}
                                    className="h-7 text-xs text-destructive hover:text-destructive"
                                >
                                    <Unlink size={12} className="mr-1" />
                                    Unlink
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
