'use client';

import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import {
    ChevronDown,
    CircleAlert,
    Grid,
    PenTool,
    Pencil,
    Sparkles,
    X,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { UnsavedChangesDialog } from '@/components/custom/Diagrams/UnsavedChangesDialog';
import { ViewportCollapsedTab } from '@/components/custom/Diagrams/ViewportCollapsedTab';
import { ViewportPanel } from '@/components/custom/Diagrams/ViewportPanel';
import type { ExcalidrawMountedApi } from '@/components/custom/LandingPage/excalidrawWrapper';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGumloop } from '@/hooks/useGumloop';
import { useViewportPanelStore } from '@/store/viewportPanel.store';

const ExcalidrawWithClientOnly = dynamic(
    async () =>
        (await import('@/components/custom/LandingPage/excalidrawWrapper')).default,
    {
        ssr: false,
    },
);

const DiagramGallery = dynamic(
    async () => (await import('@/components/custom/Gallery/DiagramGallery')).default,
    {
        ssr: false,
    },
);

type DiagramType = 'flowchart' | 'sequence' | 'class';

export default function Draw() {
    // const organizationId = '9badbbf0-441c-49f6-91e7-3d9afa1c13e6';
    const organizationId = usePathname().split('/')[2];
    const projectId = usePathname().split('/')[4];

    // Viewport panel store for side panel viewer
    const {
        isOpen: isViewportOpen,
        openViewport,
        closeViewport,
        setContentFromLink,
    } = useViewportPanelStore();
    const [prompt, setPrompt] = useState('');
    const [diagramType, setDiagramType] = useState<DiagramType>('flowchart');
    const [excalidrawApi, setExcalidrawApi] = useState<ExcalidrawMountedApi | null>(null);
    const [_selectedElements, setSelectedElements] = useState<
        readonly ExcalidrawElement[]
    >([]);

    // Unsaved changes warning state
    const [isDirty, setIsDirty] = useState(false);
    const [hasContent, setHasContent] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [isSavingBeforeExit, setIsSavingBeforeExit] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<{
        type: 'newDiagram' | 'selectDiagram' | 'gallery';
        diagramId?: string;
    } | null>(null);

    // Gallery/editor state management
    const [activeTab, setActiveTab] = useState<string>('editor');
    const [lastActiveTab, setLastActiveTab] = useState<string>('editor');
    const [selectedDiagramId, setSelectedDiagramId] = useState<string | null>(null);
    const [shouldRefreshGallery, setShouldRefreshGallery] = useState<boolean>(false);
    const [instanceKey, setInstanceKey] = useState<string>('initial');
    const isInitialRender = useRef(true);
    // Track generation status with refs to avoid re-renders triggering effects
    const hasProcessedUrlPrompt = useRef(false);
    const isManualGeneration = useRef(false);

    // Gumloop state management
    const { startPipeline, getPipelineRun } = useGumloop();
    const [pipelineRunId, setPipelineRunId] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string>('');

    // Diagram name management
    const [currentDiagramName, setCurrentDiagramName] =
        useState<string>('Untitled Diagram');
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState<boolean>(false);
    const [newDiagramName, setNewDiagramName] = useState<string>('');

    // Add state for pending requirementId
    const [pendingRequirementId, setPendingRequirementId] = useState<string | null>(null);

    // Add state for pending documentId
    const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);

    // AI Generator sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('aiSidebarOpen');
            return saved !== null ? JSON.parse(saved) : false;
        }
        return false;
    });

    // Persist sidebar state
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('aiSidebarOpen', JSON.stringify(isSidebarOpen));
        }
    }, [isSidebarOpen]);

    // Mutual exclusivity: open AI Generator closes viewport
    const handleOpenAIGenerator = useCallback(() => {
        closeViewport();
        setIsSidebarOpen(true);
    }, [closeViewport]);

    // Mutual exclusivity: open Viewport closes AI Generator
    const handleOpenViewport = useCallback(() => {
        setIsSidebarOpen(false);
        openViewport();
    }, [openViewport]);

    // On mount, check sessionStorage for pending diagram prompt and requirementId
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const pendingPrompt = sessionStorage.getItem('pendingDiagramPrompt');
        const pendingReqId = sessionStorage.getItem('pendingDiagramRequirementId');
        const pendingDocId = sessionStorage.getItem('pendingDiagramDocumentId');

        if (pendingPrompt) {
            setPrompt(pendingPrompt);
            sessionStorage.removeItem('pendingDiagramPrompt');
            // Auto-open sidebar when there's a pending prompt
            setIsSidebarOpen(true);
        }
        // Read requirementId
        if (pendingReqId) {
            setPendingRequirementId(pendingReqId);
            sessionStorage.removeItem('pendingDiagramRequirementId');
        }
        // Read documentId
        if (pendingDocId) {
            setPendingDocumentId(pendingDocId);
            sessionStorage.removeItem('pendingDiagramDocumentId');
        }
    }, []);

    // Handle tab changes
    useEffect(() => {
        // Skip first render
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        // If we're coming from gallery to editor AND we have a selected diagram,
        // update the instance key to force remount
        if (lastActiveTab === 'gallery' && activeTab === 'editor' && selectedDiagramId) {
            // Add timestamp to force remount and refresh diagram data including name
            setInstanceKey(`diagram-${selectedDiagramId}-${Date.now()}`);
        }

        // Update last active tab
        setLastActiveTab(activeTab);
    }, [activeTab, lastActiveTab, selectedDiagramId]);

    // Get pipeline run data
    const { data: pipelineResponse } = getPipelineRun(pipelineRunId, organizationId);

    const handleGenerate = useCallback(async () => {
        if (!excalidrawApi) {
            console.error('Excalidraw API not initialized for generation');
            return;
        }

        if (!prompt.trim()) {
            return;
        }

        // Already generating, don't trigger again
        if (isGenerating || pipelineRunId) {
            return;
        }

        setError('');
        setIsGenerating(true);

        // Safety timeout to ensure the button doesn't get stuck in "generating" state
        const safetyTimer = setTimeout(() => {
            setIsGenerating(false);
            setPipelineRunId('');
        }, 15000); // 15 seconds timeout

        try {
            const pipelineInputs = [
                {
                    input_name: 'Requirements(s)',
                    value: prompt.trim(),
                },
                {
                    input_name: 'Diagram-type',
                    value: diagramType,
                },
            ];

            const { run_id } = await startPipeline({
                pipelineType: 'text-to-mermaid',
                customPipelineInputs: pipelineInputs,
            });

            setPipelineRunId(run_id);
            // Clear the safety timeout since we got a successful response
            clearTimeout(safetyTimer);
        } catch (error) {
            console.error('Failed to start pipeline:', error);
            setError('Failed to start diagram generation');
            setIsGenerating(false);
            setPipelineRunId('');
            // Reset the flags regardless of success or failure
            isManualGeneration.current = false;
            // Clear the safety timeout since we're handling the error
            clearTimeout(safetyTimer);
        }
    }, [excalidrawApi, prompt, diagramType, startPipeline, isGenerating, pipelineRunId]);

    // Auto-generate diagram if prompt is set from sessionStorage
    useEffect(() => {
        if (
            prompt &&
            !hasProcessedUrlPrompt.current &&
            excalidrawApi &&
            !isGenerating &&
            !pipelineRunId
        ) {
            hasProcessedUrlPrompt.current = true;
            isManualGeneration.current = false;
            handleGenerate();
        }
    }, [excalidrawApi, prompt, handleGenerate, isGenerating, pipelineRunId]);

    // Handle the pipeline response
    useEffect(() => {
        if (!pipelineResponse) return;

        switch (pipelineResponse.state) {
            case 'DONE': {
                // Parse the JSON string from outputs.output
                let parsedOutput;
                try {
                    const output = pipelineResponse.outputs?.output;

                    if (!output || typeof output !== 'string') {
                        console.error('[Gumloop] Invalid output format - not a string');
                        throw new Error('Invalid output format');
                    }
                    parsedOutput = JSON.parse(output);

                    const mermaidSyntax = parsedOutput?.mermaid_syntax;

                    if (!mermaidSyntax) {
                        console.error(
                            '[Gumloop] No mermaid syntax found - checking all output keys:',
                            Object.keys(parsedOutput || {}),
                        );
                        setError(
                            `Failed to generate diagram: Pipeline returned no mermaid syntax. Output keys: ${Object.keys(parsedOutput || {}).join(', ')}`,
                        );
                        break;
                    }

                    // Clean the mermaid syntax
                    const syntaxStr = Array.isArray(mermaidSyntax)
                        ? mermaidSyntax[0]
                        : mermaidSyntax;
                    let cleanedSyntax = syntaxStr.replace(
                        /```[\s\S]*?```/g,
                        (match: string) => {
                            const content = match
                                .replace(/```[\w]*\n?/, '')
                                .replace(/\n?```$/, '');
                            return content;
                        },
                    );
                    cleanedSyntax = cleanedSyntax
                        .replace(/^```[\w]*\n?/, '')
                        .replace(/\n?```$/, '');
                    cleanedSyntax = cleanedSyntax.trim();

                    if (excalidrawApi) {
                        excalidrawApi.addMermaidDiagram(cleanedSyntax).catch((err) => {
                            console.error('Error rendering mermaid diagram:', err);
                            setError('Failed to render diagram');
                        });
                    }
                } catch (err) {
                    console.error('Error parsing pipeline output:', err);
                    setError('Failed to parse diagram data');
                } finally {
                    // Always reset these states, regardless of parsing success or failure
                    setPipelineRunId('');
                    setIsGenerating(false);
                }
                break;
            }
            case 'FAILED': {
                console.error('Pipeline failed');
                setError('Failed to generate diagram');

                // Reset states
                setPipelineRunId('');
                setIsGenerating(false);
                break;
            }
            default:
                // For states like RUNNING or others, just don't reset
                return;
        }
    }, [pipelineResponse, excalidrawApi]);

    // This function is called by the "Generate" button
    const handleManualGenerate = useCallback(() => {
        // This is a manual generation
        isManualGeneration.current = true;
        handleGenerate();
    }, [handleGenerate]);

    const handleExcalidrawMount = useCallback(
        (api: {
            addMermaidDiagram: (mermaidSyntax: string) => Promise<void>;
            linkRequirement: (
                requirementId: string,
                requirementName: string,
                documentId: string,
            ) => void;
            unlinkRequirement: () => void;
            forceSave: () => Promise<void>;
        }) => {
            setExcalidrawApi(api);
        },
        [],
    );

    // Handle selection change from Excalidraw
    const handleSelectionChange = useCallback(
        (elements: readonly ExcalidrawElement[]) => {
            setSelectedElements(elements);
        },
        [],
    );

    // Handle linked element click - opens viewer in viewport side panel
    const handleLinkedElementClick = useCallback(
        (info: {
            type: 'requirement' | 'document' | 'hyperlink';
            requirementId?: string;
            documentId?: string;
            linkedDocumentId?: string;
            hyperlinkUrl?: string;
            label?: string;
        }) => {
            // Close AI Generator when opening viewport from link
            setIsSidebarOpen(false);

            if (info.type === 'requirement' && info.requirementId) {
                setContentFromLink({
                    type: 'requirement',
                    contentId: info.requirementId,
                    documentId: info.documentId,
                    label: info.label,
                });
            } else if (info.type === 'document' && info.linkedDocumentId) {
                setContentFromLink({
                    type: 'document',
                    contentId: info.linkedDocumentId,
                    label: info.label,
                });
            } else if (info.type === 'hyperlink' && info.hyperlinkUrl) {
                setContentFromLink({
                    type: 'hyperlink',
                    contentId: info.hyperlinkUrl,
                    label: info.label,
                });
            }
        },
        [setContentFromLink],
    );

    // Handle creating a new diagram from gallery
    const handleNewDiagram = useCallback(() => {
        // Check for unsaved changes before navigating
        if (isDirty && hasContent) {
            setPendingNavigation({ type: 'newDiagram' });
            setShowUnsavedDialog(true);
            return;
        }

        // No unsaved changes, proceed directly
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('id');
        window.history.pushState({}, '', newUrl);

        const projId = window.location.pathname.split('/')[4];
        const projectStorageKey = `lastExcalidrawDiagramId_${projId}`;
        localStorage.removeItem(projectStorageKey);

        setSelectedDiagramId(null);
        setActiveTab('editor');
        setInstanceKey(`new-diagram-${Date.now()}`);
    }, [isDirty, hasContent]);

    // Handle selecting a diagram from gallery
    const handleSelectDiagram = useCallback(
        (diagramId: string) => {
            // Check for unsaved changes before navigating
            if (isDirty && hasContent) {
                setPendingNavigation({ type: 'selectDiagram', diagramId });
                setShowUnsavedDialog(true);
                return;
            }

            // No unsaved changes, proceed directly
            setSelectedDiagramId(diagramId);
            setActiveTab('editor');
            setInstanceKey(`diagram-${diagramId}`);
        },
        [isDirty, hasContent],
    );

    // Handle diagram saved callback
    const handleDiagramSaved = useCallback(() => {
        setShouldRefreshGallery(true);
    }, []);

    // Handle tab change with unsaved changes check
    const handleTabChange = useCallback(
        (tab: string) => {
            // If switching from editor to gallery and there are unsaved changes
            if (tab === 'gallery' && activeTab === 'editor' && isDirty && hasContent) {
                setPendingNavigation({ type: 'gallery' });
                setShowUnsavedDialog(true);
                return;
            }
            setActiveTab(tab);
        },
        [activeTab, isDirty, hasContent],
    );

    // Reset the refresh flag after the gallery is refreshed
    useEffect(() => {
        if (shouldRefreshGallery && activeTab === 'gallery') {
            setShouldRefreshGallery(false);
        }
    }, [activeTab, shouldRefreshGallery]);

    // Handle rename diagram
    const handleRenameDiagram = async () => {
        if (!selectedDiagramId || !newDiagramName.trim()) return;

        try {
            const response = await fetch(`/api/diagrams/${selectedDiagramId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newDiagramName.trim() }),
            });

            if (!response.ok) {
                console.error('Error renaming diagram:', response.statusText);
                return;
            }

            // Update local state
            setCurrentDiagramName(newDiagramName.trim());

            // Close dialog and reset input
            setIsRenameDialogOpen(false);
            setNewDiagramName('');
        } catch (err) {
            console.error('Error in handleRenameDiagram:', err);
        }
    };

    // Handle diagram name changes from ExcalidrawWrapper
    const handleDiagramNameChange = useCallback((name: string) => {
        setCurrentDiagramName(name);
    }, []);

    // Handle dirty state changes from ExcalidrawWrapper
    const handleDirtyStateChange = useCallback((dirty: boolean, content: boolean) => {
        setIsDirty(dirty);
        setHasContent(content);
    }, []);

    // Execute the pending navigation after dialog action
    const executePendingNavigation = useCallback(() => {
        if (!pendingNavigation) return;

        // Reset dirty state after navigation
        setIsDirty(false);
        setHasContent(false);

        switch (pendingNavigation.type) {
            case 'newDiagram': {
                // Original handleNewDiagram logic
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('id');
                window.history.pushState({}, '', newUrl);

                const projId = window.location.pathname.split('/')[4];
                const projectStorageKey = `lastExcalidrawDiagramId_${projId}`;
                localStorage.removeItem(projectStorageKey);

                setSelectedDiagramId(null);
                setActiveTab('editor');
                setInstanceKey(`new-diagram-${Date.now()}`);
                break;
            }
            case 'selectDiagram': {
                if (pendingNavigation.diagramId) {
                    setSelectedDiagramId(pendingNavigation.diagramId);
                    setActiveTab('editor');
                    setInstanceKey(`diagram-${pendingNavigation.diagramId}`);
                }
                break;
            }
            case 'gallery': {
                setActiveTab('gallery');
                break;
            }
        }

        setPendingNavigation(null);
    }, [pendingNavigation]);

    // Dialog action handlers
    const handleSaveAndExit = useCallback(async () => {
        if (excalidrawApi?.forceSave) {
            setIsSavingBeforeExit(true);
            try {
                await excalidrawApi.forceSave();
                setShowUnsavedDialog(false);
                executePendingNavigation();
            } catch (err) {
                console.error('Error saving diagram:', err);
            } finally {
                setIsSavingBeforeExit(false);
            }
        } else {
            // No save function available, just proceed
            setShowUnsavedDialog(false);
            executePendingNavigation();
        }
    }, [excalidrawApi, executePendingNavigation]);

    const handleDiscardChanges = useCallback(() => {
        setShowUnsavedDialog(false);
        executePendingNavigation();
    }, [executePendingNavigation]);

    const handleCancelNavigation = useCallback(() => {
        setShowUnsavedDialog(false);
        setPendingNavigation(null);
    }, []);

    // Browser beforeunload handler - warn when closing tab/browser with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty && hasContent) {
                e.preventDefault();
                e.returnValue = ''; // Required for Chrome
                return ''; // Required for some browsers
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty, hasContent]);

    return (
        <div className="flex flex-col gap-4 p-5 h-full">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {activeTab === 'editor' && selectedDiagramId ? (
                        <>
                            <h1 className="text-2xl font-bold">{currentDiagramName}</h1>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-1"
                                onClick={() => {
                                    setNewDiagramName(currentDiagramName);
                                    setIsRenameDialogOpen(true);
                                }}
                            >
                                <Pencil size={16} />
                            </Button>
                        </>
                    ) : (
                        <h1 className="text-2xl font-bold">Diagrams</h1>
                    )}
                </div>
                <Tabs
                    value={activeTab}
                    onValueChange={handleTabChange}
                    className="w-auto"
                >
                    <TabsList>
                        <TabsTrigger value="editor" className="flex items-center gap-1.5">
                            <PenTool size={16} />
                            Editor
                        </TabsTrigger>
                        <TabsTrigger
                            value="gallery"
                            className="flex items-center gap-1.5"
                        >
                            <Grid size={16} />
                            Gallery
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {activeTab === 'gallery' ? (
                <DiagramGallery
                    onNewDiagram={handleNewDiagram}
                    onSelectDiagram={handleSelectDiagram}
                    key={shouldRefreshGallery ? 'refresh' : 'default'}
                />
            ) : (
                <div className="flex flex-col lg:flex-row h-[calc(100vh-150px)] relative">
                    {/* Main Canvas Area */}
                    <div className="flex-grow h-full min-h-[500px] overflow-hidden">
                        <ExcalidrawWithClientOnly
                            onMounted={handleExcalidrawMount}
                            diagramId={selectedDiagramId}
                            diagramName={currentDiagramName}
                            onDiagramSaved={handleDiagramSaved}
                            onDiagramNameChange={handleDiagramNameChange}
                            onDiagramIdChange={setSelectedDiagramId}
                            onSelectionChange={handleSelectionChange}
                            key={`pendingReq-${pendingRequirementId}-${instanceKey}`}
                            pendingRequirementId={pendingRequirementId}
                            pendingDocumentId={pendingDocumentId}
                            onLinkedElementClick={handleLinkedElementClick}
                            onDirtyStateChange={handleDirtyStateChange}
                            isSidePanelOpen={isViewportOpen || isSidebarOpen}
                        />
                    </div>

                    {/* Right Panel Area - Viewport or AI Generator (mutually exclusive) */}
                    {isViewportOpen ? (
                        <ViewportPanel
                            projectId={projectId}
                            organizationId={organizationId}
                            onClose={closeViewport}
                        />
                    ) : isSidebarOpen ? (
                        <div className="flex-shrink-0 flex flex-col gap-2.5 p-5 bg-gray-100 dark:bg-sidebar rounded-lg h-fit ml-5 relative animate-slide-in-right">
                            {/* Close button */}
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="absolute top-2 right-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                title="Close AI Generator"
                            >
                                <X size={16} />
                            </button>

                            <div className="flex items-center gap-2 pr-6">
                                <Sparkles size={20} className="text-purple-500" />
                                <h3 className="text-xl text-BLACK dark:text-white">
                                    AI Generator
                                </h3>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                Describe your diagram and let AI create it for you
                            </p>
                            <textarea
                                value={prompt}
                                onChange={(e) => {
                                    setPrompt(e.target.value);
                                    if (error) setError('');
                                }}
                                placeholder="Describe your diagram here..."
                                className="w-[300px] h-[150px] p-2.5 rounded border border-gray-300 dark:border-gray-600 resize-y bg-white dark:bg-gray-800"
                            />
                            <div className="mb-2.5">
                                <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">
                                    Diagram Type
                                </label>
                                <div className="relative">
                                    <select
                                        value={diagramType}
                                        onChange={(e) =>
                                            setDiagramType(e.target.value as DiagramType)
                                        }
                                        className="w-full p-2.5 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 appearance-none cursor-pointer"
                                    >
                                        <option value="flowchart">Flowchart</option>
                                        <option value="sequence">Sequence</option>
                                        <option value="class">Class</option>
                                    </select>
                                    <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleManualGenerate}
                                disabled={isGenerating}
                                className={`px-5 py-2.5 bg-[#993CF6] text-white border-none rounded font-bold transition-opacity ${
                                    isGenerating
                                        ? 'opacity-70 cursor-default'
                                        : 'opacity-100 cursor-pointer hover:bg-[#8432E0]'
                                }`}
                            >
                                {isGenerating ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Generating...
                                    </div>
                                ) : (
                                    'Generate'
                                )}
                            </button>
                            {error && (
                                <div className="flex items-center gap-2 text-red-600 bg-red-100 dark:bg-red-900/30 p-2 rounded text-sm">
                                    <CircleAlert className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                            {pipelineResponse?.state === 'DONE' && (
                                <div className="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded text-sm">
                                    Diagram generated successfully!
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Collapsed state - both tabs on right edge (compact icon-only) */
                        <div className="fixed right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
                            <ViewportCollapsedTab onClick={handleOpenViewport} />
                            <button
                                onClick={handleOpenAIGenerator}
                                className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-l-lg cursor-pointer transition-colors shadow-lg"
                                title="Open AI Generator"
                            >
                                <Sparkles size={18} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Rename Dialog */}
            <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Diagram</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newDiagramName}
                            onChange={(e) => setNewDiagramName(e.target.value)}
                            placeholder="Diagram name"
                            className="mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsRenameDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleRenameDiagram}
                                disabled={!newDiagramName.trim()}
                            >
                                Rename
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Unsaved Changes Dialog */}
            <UnsavedChangesDialog
                open={showUnsavedDialog}
                onSaveAndExit={handleSaveAndExit}
                onDiscard={handleDiscardChanges}
                onCancel={handleCancelNavigation}
                isSaving={isSavingBeforeExit}
            />
        </div>
    );
}
