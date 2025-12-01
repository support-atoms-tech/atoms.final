'use client';

import { ExternalLink, Globe, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

interface LinkPreviewData {
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
    favicon: string | null;
    url: string;
}

interface HyperlinkViewerPanelProps {
    url: string;
}

export function HyperlinkViewerPanel({ url }: HyperlinkViewerPanelProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [previewData, setPreviewData] = useState<LinkPreviewData | null>(null);
    const [previewLoading, setPreviewLoading] = useState(true);

    // Fetch link preview data in parallel
    useEffect(() => {
        setPreviewLoading(true);
        fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
            .then((r) => r.json())
            .then((data) => {
                if (!data.error) {
                    setPreviewData(data);
                }
            })
            .catch(() => {
                // Ignore errors, preview is optional
            })
            .finally(() => {
                setPreviewLoading(false);
            });
    }, [url]);

    const handleLoad = useCallback(() => {
        setIsLoading(false);
    }, []);

    const handleError = useCallback(() => {
        setIsLoading(false);
        setHasError(true);
    }, []);

    const openInNewTab = useCallback(() => {
        window.open(url, '_blank', 'noopener,noreferrer');
    }, [url]);

    // Parse URL for display
    let displayUrl = url;
    let hostname = '';
    try {
        const parsed = new URL(url);
        hostname = parsed.hostname;
        displayUrl = url.length > 60 ? url.substring(0, 60) + '...' : url;
    } catch {
        // Invalid URL, use as-is
    }

    // Show preview card when iframe fails
    if (hasError) {
        return (
            <div className="h-full flex flex-col">
                {/* URL bar */}
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b text-xs">
                    {previewData?.favicon ? (
                        <Image
                            src={previewData.favicon}
                            alt=""
                            width={14}
                            height={14}
                            className="flex-shrink-0"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : (
                        <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="text-muted-foreground truncate flex-1" title={url}>
                        {hostname || displayUrl}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={openInNewTab}
                        title="Open in new tab"
                    >
                        <ExternalLink className="h-3 w-3" />
                    </Button>
                </div>

                {/* Preview card */}
                <div className="flex-1 overflow-auto p-4">
                    {previewLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : previewData ? (
                        <div className="space-y-3">
                            {/* Preview image */}
                            {previewData.image && (
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                                    <Image
                                        src={previewData.image}
                                        alt={previewData.title || 'Preview'}
                                        fill
                                        className="object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}

                            {/* Site name */}
                            {previewData.siteName && (
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                    {previewData.siteName}
                                </p>
                            )}

                            {/* Title */}
                            {previewData.title && (
                                <h3 className="font-semibold text-base leading-tight">
                                    {previewData.title}
                                </h3>
                            )}

                            {/* Description */}
                            {previewData.description && (
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {previewData.description}
                                </p>
                            )}

                            {/* URL */}
                            <p className="text-xs text-muted-foreground font-mono truncate">
                                {displayUrl}
                            </p>

                            {/* Open button */}
                            <Button
                                onClick={openInNewTab}
                                variant="outline"
                                size="sm"
                                className="w-full"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open in New Tab
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <p className="font-medium mb-1">Cannot embed this website</p>
                            <p className="text-sm text-muted-foreground mb-4">
                                This site doesn&apos;t allow embedding.
                            </p>
                            <p className="text-xs text-muted-foreground mb-4 font-mono break-all">
                                {displayUrl}
                            </p>
                            <Button onClick={openInNewTab} variant="outline" size="sm">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open in New Tab
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* URL bar */}
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b text-xs">
                <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground truncate flex-1" title={url}>
                    {hostname || displayUrl}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={openInNewTab}
                    title="Open in new tab"
                >
                    <ExternalLink className="h-3 w-3" />
                </Button>
            </div>

            {/* Iframe container */}
            <div className="flex-1 relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}
                <iframe
                    src={url}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    referrerPolicy="no-referrer"
                    onLoad={handleLoad}
                    onError={handleError}
                    title="Linked webpage"
                />
            </div>
        </div>
    );
}
