'use client';

import { Excalidraw, MainMenu } from '@excalidraw/excalidraw';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type {
    AppState,
    BinaryFiles,
    ExcalidrawImperativeAPI,
    ExcalidrawInitialDataState,
} from '@excalidraw/excalidraw/types';
import { ExternalLink, FileText, Link2, Save } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';

import '@excalidraw/excalidraw/index.css';

import { convertToExcalidrawElements, exportToSvg } from '@excalidraw/excalidraw';
import { parseMermaidToExcalidraw } from '@excalidraw/mermaid-to-excalidraw';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

import {
    LINK_COLORS,
    LinkingToolbar,
    type ElementWithLinkProps,
    type LinkType,
} from '@/components/custom/Diagrams/LinkingToolbar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const LAST_DIAGRAM_ID_KEY = 'lastExcalidrawDiagramId';

// Add a type definition for diagram data from Supabase
interface ExcalidrawDiagramData {
    elements: ExcalidrawElement[];
    appState: Partial<AppState>;
    files: BinaryFiles;
}

// Get the type for NormalizedZoomValue from @excalidraw/excalidraw
type NormalizedZoomValue = AppState['zoom']['value'];

// Link click info passed to onLinkedElementClick callback
export interface LinkedElementClickInfo {
    type: LinkType;
    requirementId?: string;
    documentId?: string;
    linkedDocumentId?: string;
    hyperlinkUrl?: string;
    label?: string;
}

// Mounted API exposed to parent components
export interface ExcalidrawMountedApi {
    addMermaidDiagram: (mermaidSyntax: string) => Promise<void>;
    linkRequirement: (
        requirementId: string,
        requirementName: string,
        documentId: string,
    ) => void;
    unlinkRequirement: () => void;
    forceSave: () => Promise<void>;
}

interface ExcalidrawWrapperProps {
    onMounted?: (api: ExcalidrawMountedApi) => void;
    diagramId?: string | null;
    diagramName?: string | null;
    onDiagramSaved?: (id: string) => void;
    onDiagramNameChange?: (name: string) => void;
    onDiagramIdChange?: (id: string | null) => void;
    onSelectionChange?: (elements: readonly ExcalidrawElement[]) => void;
    pendingRequirementId?: string | null;
    pendingDocumentId?: string | null;
    // Callback when a linked element is clicked (opens in split view instead of new tab)
    onLinkedElementClick?: (info: LinkedElementClickInfo) => void;
    // Callback when dirty state or content state changes (for unsaved warning)
    onDirtyStateChange?: (isDirty: boolean, hasContent: boolean) => void;
    // Whether a side panel (viewport or AI generator) is open - adjusts toolbar position
    isSidePanelOpen?: boolean;
}

// Utility to add requirementId and documentId to elements
function addRequirementIdToElements<T extends ExcalidrawElement>(
    elements: readonly T[] | T[],
    requirementId: string | null,
    documentId: string | null = null,
): T[] {
    if (!requirementId) return elements as T[];
    return elements.map((el) => ({
        ...el,
        requirementId,
        documentId: documentId || undefined,
    })) as T[];
}

// Use the imported ElementWithLinkProps from LinkingToolbar for consistency
// Legacy alias for backward compatibility
type ElementWithRequirementProps = ElementWithLinkProps;

const ExcalidrawWrapper: React.FC<ExcalidrawWrapperProps> = ({
    onMounted,
    diagramId: externalDiagramId,
    diagramName: externalDiagramName,
    onDiagramSaved,
    onDiagramNameChange,
    onDiagramIdChange,
    onSelectionChange,
    pendingRequirementId,
    pendingDocumentId,
    onLinkedElementClick,
    onDirtyStateChange,
    isSidePanelOpen,
}) => {
    const [diagramId, setDiagramId] = useState<string | null>(externalDiagramId || null);
    const [diagramName, setDiagramName] = useState<string>(
        externalDiagramName || 'Untitled Diagram',
    );
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [initialData, setInitialData] = useState<ExcalidrawInitialDataState | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(true);
    const [isExistingDiagram, setIsExistingDiagram] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [isSaveAsDialogOpen, setIsSaveAsDialogOpen] = useState(false);
    const [newDiagramName, setNewDiagramName] = useState('');
    const [localSelectedElements, setLocalSelectedElements] = useState<
        readonly ExcalidrawElement[]
    >([]);

    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null);
    const lastSavedDataRef = useRef<{
        elements: readonly ExcalidrawElement[];
        appState: AppState;
    } | null>(null);

    // Get theme from next-themes
    const { theme, resolvedTheme } = useTheme();
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Update dark mode state whenever theme changes
    useEffect(() => {
        setIsDarkMode(theme === 'dark' || resolvedTheme === 'dark');
    }, [theme, resolvedTheme]);

    const organizationId = usePathname().split('/')[2];
    const projectId = usePathname().split('/')[4];
    const _router = useRouter();
    const { isLoading: supabaseLoading, error: supabaseError } =
        useAuthenticatedSupabase();

    // Tooltip state for selected linked element (supports all link types)
    const [linkTooltip, setLinkTooltip] = useState<{
        x: number;
        y: number;
        linkType: LinkType;
        requirementId?: string;
        documentId?: string;
        linkedDocumentId?: string;
        hyperlinkUrl?: string;
        linkLabel?: string;
    } | null>(null);
    // Keep track of previously selected element to prevent update loops
    const prevSelectedElementRef = useRef<string | null>(null);

    // Add state for a bounding box overlay
    const [boundingBoxOverlay, setBoundingBoxOverlay] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
        requirementId: string;
    } | null>(null);

    // Add refs to track previous scroll and zoom state
    const prevScrollXRef = useRef<number | null>(null);
    const prevScrollYRef = useRef<number | null>(null);
    const prevZoomRef = useRef<number | null>(null);
    const prevSelectionIdsRef = useRef<string>('');
    const prevDiagramNameRef = useRef<string>('');
    const prevDiagramIdRef = useRef<string | null>(null);

    // Function to generate a thumbnail of the current diagram
    const generateThumbnail = useCallback(
        async (
            elements: readonly ExcalidrawElement[],
            appState: AppState,
        ): Promise<string | null> => {
            try {
                if (!excalidrawApiRef.current || elements.length === 0) {
                    return null;
                }

                // Generate SVG
                const svgElement = await exportToSvg({
                    elements,
                    appState: {
                        ...appState,
                        exportWithDarkMode: isDarkMode,
                        exportBackground: true,
                        viewBackgroundColor: appState.viewBackgroundColor,
                    },
                    files: excalidrawApiRef.current.getFiles(),
                });

                // Convert SVG to data URL
                const svgString = new XMLSerializer().serializeToString(svgElement);
                const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

                return dataUrl;
            } catch (error) {
                console.error('Error generating thumbnail:', error);
                return null;
            }
        },
        [isDarkMode],
    );

    // Function to load a diagram by ID
    const loadDiagram = useCallback(
        async (id: string) => {
            setIsLoading(true);
            setAuthError(null);

            try {
                if (supabaseLoading) {
                    return false;
                }

                if (supabaseError) {
                    setAuthError('Authentication error: ' + supabaseError);
                    return false;
                }

                // Fetch existing diagram data with authorization check
                const response = await fetch(`/api/diagrams/${id}`, {
                    method: 'GET',
                    cache: 'no-store',
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        return false;
                    }

                    // Handle it as a real error
                    const errorData = await response.json();
                    setAuthError(
                        'Error loading diagram: ' +
                            (errorData.error || response.statusText),
                    );
                    return false;
                }

                const { diagram: data } = await response.json();

                if (data && data.diagram_data) {
                    // Verify diagram belongs to current project
                    if (data.project_id !== projectId) {
                        console.error(
                            'Unauthorized: Diagram does not belong to current project',
                        );
                        setAuthError(
                            'Unauthorized: Diagram does not belong to current project',
                        );
                        return false;
                    }

                    // Set diagram name
                    setDiagramName(data.name || 'Untitled Diagram');

                    // Parse diagram data from Supabase
                    const diagramData =
                        typeof data.diagram_data === 'string'
                            ? (JSON.parse(
                                  data.diagram_data,
                              ) as unknown as ExcalidrawDiagramData)
                            : (data.diagram_data as unknown as ExcalidrawDiagramData);

                    // Extract the properties we need
                    const elements = diagramData.elements || [];
                    const appState = diagramData.appState || {};
                    const files = diagramData.files || {};

                    const initialDataState: ExcalidrawInitialDataState = {
                        elements: elements,
                        appState: {
                            ...appState,
                            collaborators: new Map(),
                            currentItemFontFamily: appState?.currentItemFontFamily || 1,
                            viewBackgroundColor:
                                appState?.viewBackgroundColor || '#ffffff',
                            zoom: appState?.zoom || {
                                value: 1 as NormalizedZoomValue,
                            },
                            theme: isDarkMode ? 'dark' : 'light',
                        },
                        files: files,
                    };
                    setInitialData(initialDataState);
                    lastSavedDataRef.current = {
                        elements:
                            initialDataState.elements as readonly ExcalidrawElement[],
                        appState: initialDataState.appState as AppState,
                    };

                    setIsExistingDiagram(true);
                    setIsLoading(false);

                    // Update URL and localStorage
                    const projectStorageKey = `${LAST_DIAGRAM_ID_KEY}_${projectId}`;
                    localStorage.setItem(projectStorageKey, id);

                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.set('id', id);
                    window.history.pushState({}, '', newUrl);

                    return true;
                }
                return false;
            } catch (error) {
                console.error('Error loading diagram:', error);
                setAuthError('Failed to load diagram');
                return false;
            } finally {
                setIsLoading(false);
            }
        },
        [isDarkMode, projectId, supabaseError, supabaseLoading],
    );

    // Function to refresh just the diagram name from the database
    const refreshDiagramName = useCallback(async () => {
        if (!diagramId) return;

        try {
            if (supabaseLoading) return;
            if (supabaseError) {
                console.error('Authentication error:', supabaseError);
                return;
            }

            const response = await fetch(`/api/diagrams/${diagramId}`, {
                method: 'GET',
                cache: 'no-store',
            });

            if (!response.ok) {
                console.error('Error refreshing diagram name:', response.statusText);
                return;
            }

            const { diagram: data } = await response.json();

            if (data && data.name !== diagramName) {
                setDiagramName(data.name || 'Untitled Diagram');
            }
        } catch (err) {
            console.error('Error in refreshDiagramName:', err);
        }
    }, [diagramId, diagramName, supabaseError, supabaseLoading]);

    // Periodically check for name updates in the database
    useEffect(() => {
        // Only refresh for diagrams that exist in the database
        if (!diagramId || !isExistingDiagram) return;

        // Initial refresh
        refreshDiagramName();

        // Set up interval to check for name updates
        const intervalId = setInterval(refreshDiagramName, 5000); // Check every 5 seconds

        return () => {
            clearInterval(intervalId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [diagramId, isExistingDiagram]);

    const createNewDiagram = useCallback(() => {
        // Generate a UUID v4
        const newId = uuidv4();
        setDiagramId(newId);
        setDiagramName('Untitled Diagram');
        setInitialData(null);
        lastSavedDataRef.current = null;
        setIsExistingDiagram(false);

        const projectStorageKey = `${LAST_DIAGRAM_ID_KEY}_${projectId}`;
        localStorage.setItem(projectStorageKey, newId);

        // Clear auth error since we're starting with a fresh diagram
        setAuthError(null);

        // Update URL with the new ID
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('id', newId);
        window.history.pushState({}, '', newUrl);

        // Reset the Excalidraw canvas
        if (excalidrawApiRef.current) {
            excalidrawApiRef.current.updateScene({
                elements: [],
                appState: {
                    theme: isDarkMode ? 'dark' : 'light',
                },
            });
        }

        setIsLoading(false);
    }, [projectId, isDarkMode]);

    // Move the function definition to a useCallback
    const addMermaidDiagram = useCallback(
        async (mermaidSyntax: string) => {
            try {
                const { elements: skeletonElements } =
                    await parseMermaidToExcalidraw(mermaidSyntax);

                let excalidrawElements = convertToExcalidrawElements(skeletonElements);

                // Attach requirementId if present (for requirement→diagram flow)
                if (pendingRequirementId) {
                    excalidrawElements = addRequirementIdToElements(
                        excalidrawElements as unknown as ExcalidrawElement[],
                        pendingRequirementId,
                        pendingDocumentId,
                    ) as unknown as typeof excalidrawElements;
                }

                if (excalidrawApiRef.current) {
                    const currentElements = excalidrawApiRef.current.getSceneElements();

                    // Calculate bounding boxes
                    const getBoundingBox = (elements: readonly ExcalidrawElement[]) => {
                        if (!elements.length) return null;
                        let minX = Infinity,
                            minY = Infinity,
                            maxX = -Infinity,
                            maxY = -Infinity;
                        for (const el of elements) {
                            if (el.isDeleted) continue;
                            minX = Math.min(minX, el.x);
                            minY = Math.min(minY, el.y);
                            maxX = Math.max(maxX, el.x + (el.width || 0));
                            maxY = Math.max(maxY, el.y + (el.height || 0));
                        }
                        return {
                            minX,
                            minY,
                            maxX,
                            maxY,
                            width: maxX - minX,
                            height: maxY - minY,
                        };
                    };

                    const existingBox = getBoundingBox(currentElements);
                    const newBox = getBoundingBox(excalidrawElements);

                    // Find non-overlapping position
                    let offsetX = 0,
                        offsetY = 0;
                    if (existingBox && newBox) {
                        //place to the right
                        const margin = 80;
                        offsetX = existingBox.maxX - newBox.minX + margin;
                        offsetY = 0;
                    } else if (!existingBox && newBox) {
                        //center the new diagram at (0,0)
                        const centerX = newBox.minX + newBox.width / 2;
                        const centerY = newBox.minY + newBox.height / 2;
                        offsetX = -centerX;
                        offsetY = -centerY;
                    }

                    //Offset new elements
                    if (offsetX !== 0 || offsetY !== 0) {
                        excalidrawElements = excalidrawElements.map((el) => ({
                            ...el,
                            x: el.x + offsetX,
                            y: el.y + offsetY,
                        }));
                    }

                    // Collect new element IDs for selection
                    const newElementIds = excalidrawElements.map((el) => el.id);
                    const selectedElementIds = Object.fromEntries(
                        newElementIds.map((id) => [id, true as const]),
                    );

                    excalidrawApiRef.current.updateScene({
                        elements: [...currentElements, ...excalidrawElements],
                        appState: {
                            // preserve theme and other appState, but set selection
                            ...(excalidrawApiRef.current.getAppState?.() || {}),
                            selectedElementIds,
                        },
                    });

                    //scroll to new content
                    setTimeout(() => {
                        excalidrawApiRef.current?.scrollToContent(excalidrawElements, {
                            fitToContent: true,
                            animate: true,
                            duration: 600,
                        });
                    }, 50);
                }
            } catch (error) {
                console.error('Error converting mermaid to excalidraw:', error);
                throw error;
            }
        },
        [pendingRequirementId, pendingDocumentId, excalidrawApiRef],
    );

    const hasChanges = useCallback(
        (elements: readonly ExcalidrawElement[], appState: AppState) => {
            if (!lastSavedDataRef.current) return true;

            // Compare elements
            const prevElements = lastSavedDataRef.current.elements;
            if (prevElements.length !== elements.length) return true;

            // Deep compare elements
            for (let i = 0; i < elements.length; i++) {
                const curr = elements[i];
                const prev = prevElements[i];
                if (JSON.stringify(curr) !== JSON.stringify(prev)) return true;
            }

            // Compare relevant appState properties that we care about
            const currentViewBg = appState.viewBackgroundColor;
            const prevViewBg = lastSavedDataRef.current.appState.viewBackgroundColor;
            if (currentViewBg !== prevViewBg) return true;

            const currentZoom = appState.zoom;
            const prevZoom = lastSavedDataRef.current.appState.zoom;
            if (JSON.stringify(currentZoom) !== JSON.stringify(prevZoom)) return true;

            return false;
        },
        [],
    );

    const saveDiagram = useCallback(
        async (
            elements: readonly ExcalidrawElement[],
            appState: AppState,
            files: BinaryFiles,
            customDiagramId?: string,
            customName?: string,
            forceSave = false,
        ) => {
            const idToUse = customDiagramId || diagramId;
            const nameToUse = customName || diagramName;

            if (!idToUse || isAutoSaving) return;

            // Only prevent saving if it's a new diagram and there are no elements
            if (
                !forceSave &&
                !isExistingDiagram &&
                (!elements || elements.length === 0)
            ) {
                return;
            }

            // Check if there are actual changes to save
            if (!forceSave && !customDiagramId && !hasChanges(elements, appState)) {
                return;
            }

            try {
                if (supabaseLoading) {
                    console.warn('Supabase client still initializing; skipping save');
                    return;
                }

                if (supabaseError) {
                    setAuthError('Authentication error: ' + supabaseError);
                    return;
                }

                setIsAutoSaving(true);

                const diagramData = {
                    elements: elements,
                    appState: {
                        ...appState,
                    },
                    files: files,
                };

                // Generate thumbnail
                const thumbnailUrl = await generateThumbnail(elements, appState);

                // Save diagram via API route
                const response = await fetch('/api/save-diagram', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        diagramId: idToUse,
                        projectId: projectId,
                        organizationId: organizationId,
                        diagramData: diagramData,
                        name: nameToUse,
                        thumbnailUrl: thumbnailUrl,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error(
                        'Error saving diagram:',
                        errorData.error || response.statusText,
                    );
                    return;
                }

                // If this was a "Save As" operation, update the current diagram ID
                if (customDiagramId) {
                    setDiagramId(customDiagramId);
                    setDiagramName(customName || 'Untitled Diagram');

                    // Update URL with the new ID
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.set('id', customDiagramId);
                    window.history.pushState({}, '', newUrl);

                    // Update localStorage
                    const projectStorageKey = `${LAST_DIAGRAM_ID_KEY}_${projectId}`;
                    localStorage.setItem(projectStorageKey, customDiagramId);

                    // Notify parent component if callback is provided
                    if (onDiagramSaved) {
                        onDiagramSaved(customDiagramId);
                    }
                }

                // Update last saved data reference
                lastSavedDataRef.current = {
                    elements,
                    appState: {
                        ...appState,
                        collaborators: new Map(),
                    },
                };

                setIsExistingDiagram(true); // Mark as existing after first successful save
                setLastSaved(new Date());
                const projectStorageKey = `${LAST_DIAGRAM_ID_KEY}_${projectId}`;
                localStorage.setItem(projectStorageKey, idToUse);
            } catch (error) {
                console.error('Error saving diagram:', error);
            } finally {
                setIsAutoSaving(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            diagramId,
            diagramName,
            generateThumbnail,
            hasChanges,
            isExistingDiagram,
            onDiagramSaved,
            organizationId,
            projectId,
            supabaseError,
            supabaseLoading,
        ],
    );

    // Debounced save function to avoid too many API calls
    const debouncedSave = useCallback(
        (
            elements: readonly ExcalidrawElement[],
            appState: AppState,
            files: BinaryFiles,
        ) => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout(() => {
                saveDiagram(elements, appState, files);
            }, 2000);
        },
        [saveDiagram],
    );

    // Utility functions for requirement linking
    const updateElementRequirementLink = useCallback(
        (requirementId: string, requirementName: string, documentId: string) => {
            // Debug: Log what values are being stored
            console.log('[updateElementRequirementLink] Storing link with:', {
                requirementId,
                requirementName,
                documentId,
            });

            if (!excalidrawApiRef.current) return;

            const elements = excalidrawApiRef.current.getSceneElements();
            const selectedIds = Object.keys(
                excalidrawApiRef.current.getAppState().selectedElementIds || {},
            );

            console.log('[updateElementRequirementLink] Updating elements:', selectedIds);

            // Update selected elements with requirementId, documentId, and linkLabel (requirement name)
            const updatedElements = elements.map((el) => {
                if (selectedIds.includes(el.id)) {
                    // Add custom properties to element, including linkLabel for tooltip display
                    const updatedEl = {
                        ...el,
                        requirementId,
                        documentId: documentId,
                        linkLabel: requirementName,
                    };
                    console.log(
                        '[updateElementRequirementLink] Updated element:',
                        el.id,
                        updatedEl,
                    );
                    return updatedEl as unknown as ExcalidrawElement;
                }
                return el;
            });

            // Update the scene with modified elements
            excalidrawApiRef.current.updateScene({
                elements: updatedElements,
            });

            // Trigger immediate save after linking (forceSave to ensure it persists)
            const appState = excalidrawApiRef.current.getAppState();
            const files = excalidrawApiRef.current.getFiles();
            saveDiagram(updatedElements, appState, files, undefined, undefined, true);

            // Force tooltip to re-evaluate by resetting the previous selection
            prevSelectedElementRef.current = null;
        },
        [saveDiagram],
    );

    const removeElementRequirementLink = useCallback(() => {
        if (!excalidrawApiRef.current) return;

        const elements = excalidrawApiRef.current.getSceneElements();
        const selectedIds = Object.keys(
            excalidrawApiRef.current.getAppState().selectedElementIds || {},
        );

        // Remove requirementId, documentId, and linkLabel from selected elements
        const updatedElements = elements.map((el) => {
            if (selectedIds.includes(el.id)) {
                // Create a new element without the requirementId, documentId, and linkLabel properties
                const {
                    requirementId: _requirementId,
                    documentId: _documentId,
                    linkLabel: _linkLabel,
                    ...rest
                } = el as ElementWithRequirementProps & { linkLabel?: string };
                return rest as ExcalidrawElement;
            }
            return el;
        });

        // Update the scene with modified elements
        excalidrawApiRef.current.updateScene({
            elements: updatedElements,
        });

        // Trigger immediate save after unlinking (forceSave to ensure it persists)
        const appState = excalidrawApiRef.current.getAppState();
        const files = excalidrawApiRef.current.getFiles();
        saveDiagram(updatedElements, appState, files, undefined, undefined, true);
    }, [saveDiagram]);

    // Handler for document linking
    const updateElementDocumentLink = useCallback(
        (linkedDocumentId: string, documentName: string, linkLabel?: string) => {
            if (!excalidrawApiRef.current) return;

            const elements = excalidrawApiRef.current.getSceneElements();
            const selectedIds = Object.keys(
                excalidrawApiRef.current.getAppState().selectedElementIds || {},
            );

            // Update selected elements with document link
            const updatedElements = elements.map((el) => {
                if (selectedIds.includes(el.id)) {
                    // Remove any existing links first, then add new one
                    const {
                        requirementId: _r,
                        documentId: _d,
                        hyperlinkUrl: _h,
                        ...rest
                    } = el as ElementWithLinkProps;
                    return {
                        ...rest,
                        linkedDocumentId,
                        linkType: 'document' as LinkType,
                        linkLabel: linkLabel || documentName,
                    } as unknown as ExcalidrawElement;
                }
                return el;
            });

            excalidrawApiRef.current.updateScene({ elements: updatedElements });

            // Trigger immediate save
            const appState = excalidrawApiRef.current.getAppState();
            const files = excalidrawApiRef.current.getFiles();
            saveDiagram(updatedElements, appState, files, undefined, undefined, true);

            // Force tooltip to re-evaluate by resetting the previous selection
            prevSelectedElementRef.current = null;
        },
        [saveDiagram],
    );

    // Handler for hyperlink linking
    const updateElementHyperlinkLink = useCallback(
        (hyperlinkUrl: string, linkLabel?: string) => {
            if (!excalidrawApiRef.current) return;

            const elements = excalidrawApiRef.current.getSceneElements();
            const selectedIds = Object.keys(
                excalidrawApiRef.current.getAppState().selectedElementIds || {},
            );

            // Update selected elements with hyperlink
            const updatedElements = elements.map((el) => {
                if (selectedIds.includes(el.id)) {
                    // Remove any existing links first, then add new one
                    const {
                        requirementId: _r,
                        documentId: _d,
                        linkedDocumentId: _ld,
                        ...rest
                    } = el as ElementWithLinkProps;
                    return {
                        ...rest,
                        hyperlinkUrl,
                        linkType: 'hyperlink' as LinkType,
                        linkLabel: linkLabel || hyperlinkUrl,
                    } as unknown as ExcalidrawElement;
                }
                return el;
            });

            excalidrawApiRef.current.updateScene({ elements: updatedElements });

            // Trigger immediate save
            const appState = excalidrawApiRef.current.getAppState();
            const files = excalidrawApiRef.current.getFiles();
            saveDiagram(updatedElements, appState, files, undefined, undefined, true);

            // Force tooltip to re-evaluate by resetting the previous selection
            prevSelectedElementRef.current = null;
        },
        [saveDiagram],
    );

    // Enhanced unlink that removes all link types
    const removeAllLinks = useCallback(() => {
        if (!excalidrawApiRef.current) return;

        const elements = excalidrawApiRef.current.getSceneElements();
        const selectedIds = Object.keys(
            excalidrawApiRef.current.getAppState().selectedElementIds || {},
        );

        // Remove all link properties from selected elements
        const updatedElements = elements.map((el) => {
            if (selectedIds.includes(el.id)) {
                const {
                    requirementId: _r,
                    documentId: _d,
                    linkedDocumentId: _ld,
                    hyperlinkUrl: _h,
                    linkType: _lt,
                    linkLabel: _ll,
                    ...rest
                } = el as ElementWithLinkProps;
                return rest as ExcalidrawElement;
            }
            return el;
        });

        excalidrawApiRef.current.updateScene({ elements: updatedElements });

        // Trigger immediate save
        const appState = excalidrawApiRef.current.getAppState();
        const files = excalidrawApiRef.current.getFiles();
        saveDiagram(updatedElements, appState, files, undefined, undefined, true);
    }, [saveDiagram]);

    // Force save function for external trigger (used by unsaved warning dialog)
    const forceSaveRef = useRef<(() => Promise<void>) | null>(null);
    forceSaveRef.current = useCallback(async () => {
        if (excalidrawApiRef.current) {
            const elements = excalidrawApiRef.current.getSceneElements();
            const appState = excalidrawApiRef.current.getAppState();
            const files = excalidrawApiRef.current.getFiles();
            await saveDiagram(elements, appState, files, undefined, undefined, true);
        }
    }, [saveDiagram]);

    // Track and notify parent of dirty state changes
    const prevDirtyStateRef = useRef<{ isDirty: boolean; hasContent: boolean } | null>(
        null,
    );
    const checkAndNotifyDirtyState = useCallback(() => {
        if (!excalidrawApiRef.current || !onDirtyStateChange) return;

        const elements = excalidrawApiRef.current.getSceneElements();
        const appState = excalidrawApiRef.current.getAppState();

        // Check if there's any content (non-deleted elements)
        const hasContent = elements.filter((el) => !el.isDeleted).length > 0;

        // Check if there are unsaved changes
        const isDirty = hasChanges(elements, appState);

        // Only notify if state actually changed
        const prevState = prevDirtyStateRef.current;
        if (
            !prevState ||
            prevState.isDirty !== isDirty ||
            prevState.hasContent !== hasContent
        ) {
            prevDirtyStateRef.current = { isDirty, hasContent };
            onDirtyStateChange(isDirty, hasContent);
        }
    }, [hasChanges, onDirtyStateChange]);

    // Expose the API functions to parent
    const hasInitializedApiRef = useRef(false);
    useEffect(() => {
        if (onMounted && !hasInitializedApiRef.current) {
            hasInitializedApiRef.current = true;
            onMounted({
                addMermaidDiagram,
                linkRequirement: updateElementRequirementLink,
                unlinkRequirement: removeElementRequirementLink,
                forceSave: async () => {
                    if (forceSaveRef.current) {
                        await forceSaveRef.current();
                    }
                },
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onMounted]);

    // Watch for external diagramId changes
    useEffect(() => {
        if (externalDiagramId !== undefined) {
            setDiagramId(externalDiagramId);

            if (externalDiagramId) {
                loadDiagram(externalDiagramId);
            }
        }
    }, [externalDiagramId, loadDiagram]);

    // Watch for external diagramName changes (e.g., from rename dialog)
    useEffect(() => {
        if (
            externalDiagramName !== undefined &&
            externalDiagramName !== null &&
            externalDiagramName !== diagramName
        ) {
            setDiagramName(externalDiagramName);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [externalDiagramName]);

    // Reset loading state when component unmounts or when diagram ID changes
    useEffect(() => {
        return () => {
            setIsLoading(false);
        };
    }, [diagramId]);

    // Update theme in Excalidraw when dark mode changes
    useEffect(() => {
        if (excalidrawApiRef.current) {
            excalidrawApiRef.current.updateScene({
                appState: {
                    theme: isDarkMode ? 'dark' : 'light',
                },
            });
        }
    }, [isDarkMode]);

    // Initialize diagram ID and load data on mount
    useEffect(() => {
        const initializeDiagram = async () => {
            try {
                // Clear previous diagram when project changes
                if (projectId) {
                    // Only load diagram if no external ID was provided
                    if (!externalDiagramId) {
                        // Use a project-specific storage key to prevent leakage between projects
                        const projectStorageKey = `${LAST_DIAGRAM_ID_KEY}_${projectId}`;
                        const urlParams = new URLSearchParams(window.location.search);
                        const idFromUrl = urlParams.get('id');
                        const lastDiagramId = localStorage.getItem(projectStorageKey);

                        // Priority: URL param > localStorage > new diagram
                        let id: string | null = null;

                        if (idFromUrl && isValidUuid(idFromUrl)) {
                            id = idFromUrl;
                        } else if (lastDiagramId && isValidUuid(lastDiagramId)) {
                            id = lastDiagramId;
                            // Update URL with the stored ID
                            const newUrl = new URL(window.location.href);
                            newUrl.searchParams.set('id', id);
                            window.history.pushState({}, '', newUrl);
                        }

                        if (id) {
                            setDiagramId(id);
                            localStorage.setItem(projectStorageKey, id);

                            const loadSuccess = await loadDiagram(id);
                            if (!loadSuccess) {
                                createNewDiagram();
                            }
                        } else {
                            createNewDiagram();
                        }
                    }
                }
            } catch (error) {
                console.error('Error initializing diagram:', error);
                setIsLoading(false);
            }
        };

        // Helper function to validate UUID
        const isValidUuid = (id: string): boolean => {
            const uuidRegex =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            return uuidRegex.test(id);
        };

        initializeDiagram();
    }, [isDarkMode, projectId, externalDiagramId, loadDiagram, createNewDiagram]);

    // Handle Save As operation
    const handleSaveAs = async () => {
        if (!excalidrawApiRef.current || !newDiagramName.trim()) return;

        const elements = excalidrawApiRef.current.getSceneElements();
        const appState = excalidrawApiRef.current.getAppState();
        const files = excalidrawApiRef.current.getFiles();

        // Generate a new UUID
        const newId = uuidv4();

        // Save with the new ID and name
        await saveDiagram(elements, appState, files, newId, newDiagramName.trim(), true);

        // Close the dialog
        setIsSaveAsDialogOpen(false);
        setNewDiagramName('');
    };

    // Modify handleChange to update tooltip and position it over all related elements
    const handleChange = useCallback(
        (
            elements: readonly ExcalidrawElement[],
            appState: AppState,
            files: BinaryFiles,
        ) => {
            debouncedSave(elements, appState, files);

            // Check if canvas position or zoom has changed
            const hasCanvasMoved =
                prevScrollXRef.current !== null &&
                prevScrollYRef.current !== null &&
                prevZoomRef.current !== null &&
                (prevScrollXRef.current !== appState.scrollX ||
                    prevScrollYRef.current !== appState.scrollY ||
                    prevZoomRef.current !== appState.zoom.value);

            // Update previous values
            prevScrollXRef.current = appState.scrollX;
            prevScrollYRef.current = appState.scrollY;
            prevZoomRef.current = appState.zoom.value;

            // Clear tooltip and bounding box if canvas has moved
            if (hasCanvasMoved) {
                setLinkTooltip(null);
                setBoundingBoxOverlay(null);
                prevSelectedElementRef.current = null;
                return;
            }

            // Determine if elements are selected
            const selectedIds = Object.keys(appState.selectedElementIds || {});
            const currentSelectionKey = selectedIds.sort().join(',');

            // Only notify parent if selection actually changed (prevents infinite loop)
            if (currentSelectionKey !== prevSelectionIdsRef.current) {
                prevSelectionIdsRef.current = currentSelectionKey;

                if (selectedIds.length > 0) {
                    const currentSelectedElements = elements.filter((el) =>
                        selectedIds.includes(el.id),
                    );
                    // Update local state for LinkingToolbar
                    setLocalSelectedElements(currentSelectedElements);
                    // Notify parent if callback provided
                    if (onSelectionChange) {
                        onSelectionChange(currentSelectedElements);
                    }
                } else {
                    setLocalSelectedElements([]);
                    if (onSelectionChange) {
                        onSelectionChange([]);
                    }
                }
            }

            // Handle tooltip logic for all link types (requirement, document, hyperlink)
            if (selectedIds.length >= 1 && excalidrawApiRef.current) {
                const selectedId = selectedIds[0];
                // Only process if this is a new selection
                if (prevSelectedElementRef.current !== selectedId) {
                    prevSelectedElementRef.current = selectedId;

                    const selEl = elements.find((el) => el.id === selectedId) as
                        | ElementWithLinkProps
                        | undefined;

                    // Check for any link type
                    const hasRequirementLink = selEl?.requirementId;
                    const hasDocumentLink = selEl?.linkedDocumentId;
                    const hasHyperlinkLink = selEl?.hyperlinkUrl;
                    const hasAnyLink =
                        hasRequirementLink || hasDocumentLink || hasHyperlinkLink;

                    if (selEl && hasAnyLink) {
                        // Determine link type
                        let linkType: LinkType = 'requirement';
                        let linkIdentifier = '';

                        if (hasRequirementLink) {
                            linkType = 'requirement';
                            linkIdentifier = selEl.requirementId!;
                        } else if (hasDocumentLink) {
                            linkType = 'document';
                            linkIdentifier = selEl.linkedDocumentId!;
                        } else if (hasHyperlinkLink) {
                            linkType = 'hyperlink';
                            linkIdentifier = selEl.hyperlinkUrl!;
                        }

                        // Find all elements with the same link
                        const allSameLinkedElements = elements.filter((el) => {
                            const elem = el as ElementWithLinkProps;
                            if (linkType === 'requirement')
                                return elem.requirementId === linkIdentifier;
                            if (linkType === 'document')
                                return elem.linkedDocumentId === linkIdentifier;
                            if (linkType === 'hyperlink')
                                return elem.hyperlinkUrl === linkIdentifier;
                            return false;
                        });

                        // Get connected elements
                        const relatedElements = getSpatialCluster(
                            allSameLinkedElements,
                            selEl,
                        );
                        const boundingBox = calculateBoundingBox(relatedElements);

                        // Update the bounding box
                        setBoundingBoxOverlay({
                            x: boundingBox.minX,
                            y: boundingBox.minY,
                            width: boundingBox.width,
                            height: boundingBox.height,
                            requirementId: linkIdentifier, // Using this for any link type
                        });

                        const zoom = appState.zoom.value;
                        const { scrollX, scrollY } = appState;
                        // Position at bottom-center of element
                        const boxCenterX = boundingBox.minX + boundingBox.width / 2;
                        const boxBottomY = boundingBox.minY + boundingBox.height;

                        const screenX = (boxCenterX + scrollX) * zoom;
                        const screenY = (boxBottomY + scrollY) * zoom;

                        setLinkTooltip({
                            x: screenX,
                            y: screenY,
                            linkType,
                            requirementId: selEl.requirementId,
                            documentId: selEl.documentId,
                            linkedDocumentId: selEl.linkedDocumentId,
                            hyperlinkUrl: selEl.hyperlinkUrl,
                            linkLabel: selEl.linkLabel,
                        });
                    } else {
                        setLinkTooltip(null);
                        setBoundingBoxOverlay(null);
                    }
                }
            } else if (
                selectedIds.length === 0 &&
                prevSelectedElementRef.current !== null
            ) {
                // Clear selection tracking and tooltip when nothing is selected
                prevSelectedElementRef.current = null;
                setLinkTooltip(null);
                setBoundingBoxOverlay(null);
            }

            // Notify parent of dirty state changes for unsaved warning
            checkAndNotifyDirtyState();
        },
        [debouncedSave, onSelectionChange, checkAndNotifyDirtyState],
    );

    // Function to calculate bounding box for a group of elements
    const calculateBoundingBox = (elements: readonly ExcalidrawElement[]) => {
        if (!elements.length) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        elements.forEach((el) => {
            if (el.isDeleted) return;

            // Get coordinates
            const x = el.x;
            const y = el.y;
            const width = el.width || 0;
            const height = el.height || 0;

            // Update bounds
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + width);
            maxY = Math.max(maxY, y + height);
        });

        // Calculate dimensions
        const width = maxX - minX;
        const height = maxY - minY;

        return { minX, minY, maxX, maxY, width, height };
    };

    // Function to cluster elements based on spatial proximity
    const getSpatialCluster = (
        elements: readonly ExcalidrawElement[],
        selectedElement: ExcalidrawElement,
        proximityThreshold = 100, // Adjust this value to control clustering sensitivity
    ): ExcalidrawElement[] => {
        if (!elements.length) return [];

        // Initialize with the selected element
        const cluster: ExcalidrawElement[] = [selectedElement];
        const processedIds = new Set<string>([selectedElement.id]);
        const elementsToProcess = [selectedElement];

        // Keep adding elements to the cluster as long as we find new connected elements
        while (elementsToProcess.length > 0) {
            const currentElement = elementsToProcess.shift()!;
            const currentBounds = {
                x1: currentElement.x,
                y1: currentElement.y,
                x2: currentElement.x + (currentElement.width || 0),
                y2: currentElement.y + (currentElement.height || 0),
            };

            // Find all nearby elements not already in the cluster
            const nearbyElements = elements.filter((el) => {
                if (processedIds.has(el.id) || el.isDeleted) return false;

                const elBounds = {
                    x1: el.x,
                    y1: el.y,
                    x2: el.x + (el.width || 0),
                    y2: el.y + (el.height || 0),
                };

                // Calculate the distance between bounding boxes
                const xDistance = Math.max(
                    0,
                    Math.max(
                        currentBounds.x1 - elBounds.x2,
                        elBounds.x1 - currentBounds.x2,
                    ),
                );
                const yDistance = Math.max(
                    0,
                    Math.max(
                        currentBounds.y1 - elBounds.y2,
                        elBounds.y1 - currentBounds.y2,
                    ),
                );

                // Use Euclidean distance
                const distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);
                return distance <= proximityThreshold;
            });

            // Add all nearby elements to the cluster and queue them for processing
            nearbyElements.forEach((el) => {
                cluster.push(el);
                processedIds.add(el.id);
                elementsToProcess.push(el);
            });
        }

        return cluster;
    };

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // Notify parent component when diagram name changes (with guard to prevent loop)
    useEffect(() => {
        if (onDiagramNameChange && diagramName !== prevDiagramNameRef.current) {
            prevDiagramNameRef.current = diagramName;
            onDiagramNameChange(diagramName);
        }
    }, [diagramName, onDiagramNameChange]);

    // Whenever diagramId changes, notify parent (with guard to prevent loop)
    useEffect(() => {
        if (onDiagramIdChange && diagramId !== prevDiagramIdRef.current) {
            prevDiagramIdRef.current = diagramId;
            onDiagramIdChange(diagramId);
        }
    }, [diagramId, onDiagramIdChange]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="h-full w-full min-h-[500px] relative">
            {/* Custom Toolbar - moves up and offsets left when side panel is open */}
            <div
                className={`absolute z-[1000] flex items-center gap-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-1.5 py-0.5 shadow-sm border border-gray-200 dark:border-gray-700 ${
                    isSidePanelOpen
                        ? 'bottom-16 left-1/2 -translate-x-1/2'
                        : 'bottom-4 left-1/2 -translate-x-1/2'
                }`}
            >
                {/* Condensed Save button - icon only, tooltip shows last saved time */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    title={
                        lastSaved
                            ? `Last saved: ${lastSaved.toLocaleTimeString()}\nClick to Save As...`
                            : 'Not saved yet\nClick to Save As...'
                    }
                    onClick={() => {
                        setNewDiagramName('');
                        setIsSaveAsDialogOpen(true);
                    }}
                >
                    <Save size={12} />
                </Button>

                {/* Link button - only when elements selected */}
                {localSelectedElements.length > 0 && (
                    <>
                        <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
                        <LinkingToolbar
                            selectedElements={localSelectedElements}
                            projectId={projectId}
                            organizationId={organizationId}
                            onLinkRequirement={(reqId, reqName, docId, _linkLabel) => {
                                updateElementRequirementLink(reqId, reqName, docId);
                            }}
                            onLinkDocument={updateElementDocumentLink}
                            onLinkHyperlink={updateElementHyperlinkLink}
                            onUnlink={removeAllLinks}
                            onViewLinkedContent={
                                onLinkedElementClick
                                    ? (info) => {
                                          onLinkedElementClick({
                                              type: info.type,
                                              requirementId:
                                                  info.type === 'requirement'
                                                      ? info.contentId
                                                      : undefined,
                                              documentId: info.documentId,
                                              linkedDocumentId:
                                                  info.type === 'document'
                                                      ? info.contentId
                                                      : undefined,
                                              hyperlinkUrl:
                                                  info.type === 'hyperlink'
                                                      ? info.contentId
                                                      : undefined,
                                              label: info.label,
                                          });
                                      }
                                    : undefined
                            }
                        />
                    </>
                )}
            </div>

            {authError && (
                <div className="absolute top-14 left-2 text-sm text-red-600 bg-red-100 dark:bg-red-900/50 p-2 rounded z-[1000]">
                    {authError}
                </div>
            )}

            <Excalidraw
                onChange={handleChange}
                initialData={{
                    ...initialData,
                    appState: {
                        ...(initialData?.appState || {}),
                        theme: isDarkMode ? 'dark' : 'light',
                    },
                }}
                theme={isDarkMode ? 'dark' : 'light'}
                excalidrawAPI={(api) => {
                    excalidrawApiRef.current = api;
                }}
            >
                <MainMenu>
                    <MainMenu.DefaultItems.LoadScene />
                    <MainMenu.DefaultItems.SaveToActiveFile />
                    <MainMenu.DefaultItems.SaveAsImage />
                    <MainMenu.DefaultItems.ClearCanvas />
                    <MainMenu.DefaultItems.Export />
                </MainMenu>
            </Excalidraw>

            {/* Save As Dialog */}
            <Dialog open={isSaveAsDialogOpen} onOpenChange={setIsSaveAsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Diagram As</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newDiagramName}
                            onChange={(e) => setNewDiagramName(e.target.value)}
                            placeholder="New diagram name"
                            className="mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsSaveAsDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveAs}
                                disabled={!newDiagramName.trim()}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Tooltip for linked elements - compact, at bottom-center of element (slight overlap OK) */}
            {linkTooltip && (
                <div
                    className="absolute z-[1001] px-2 py-1 bg-gray-900/95 text-white text-xs rounded shadow-md cursor-pointer flex items-center gap-1.5 border border-gray-700/50 hover:bg-gray-800 transition-colors backdrop-blur-sm"
                    style={{
                        left: linkTooltip.x,
                        top: linkTooltip.y,
                        transform: 'translate(-50%, -100%)', // Center X, move up so bottom of tooltip is at element bottom
                    }}
                    onClick={(e: React.MouseEvent) => {
                        console.log('[LinkTooltip] Click - navigating with data:', {
                            linkType: linkTooltip.linkType,
                            documentId: linkTooltip.documentId,
                            requirementId: linkTooltip.requirementId,
                            linkedDocumentId: linkTooltip.linkedDocumentId,
                            ctrlKey: e.ctrlKey,
                            metaKey: e.metaKey,
                        });

                        // Check for Ctrl/Cmd+click to open in new tab (escape hatch)
                        const openInNewTab = e.ctrlKey || e.metaKey;

                        // If callback provided and not forcing new tab, use split view
                        if (onLinkedElementClick && !openInNewTab) {
                            const info: LinkedElementClickInfo = {
                                type: linkTooltip.linkType,
                                requirementId: linkTooltip.requirementId,
                                documentId: linkTooltip.documentId,
                                linkedDocumentId: linkTooltip.linkedDocumentId,
                                hyperlinkUrl: linkTooltip.hyperlinkUrl,
                                label: linkTooltip.linkLabel,
                            };
                            onLinkedElementClick(info);
                            return;
                        }

                        // Fallback: open in new tab (original behavior)
                        if (linkTooltip.linkType === 'requirement') {
                            // Navigate to requirement in document
                            if (linkTooltip.documentId) {
                                const url = `/org/${organizationId}/project/${projectId}/documents/${linkTooltip.documentId}?requirementId=${linkTooltip.requirementId}`;
                                console.log('[LinkTooltip] Navigating to URL:', url);
                                window.open(url, '_blank');
                            } else {
                                console.error(
                                    'Cannot navigate: documentId is missing from element',
                                );
                            }
                        } else if (linkTooltip.linkType === 'document') {
                            // Navigate to document
                            if (linkTooltip.linkedDocumentId) {
                                const url = `/org/${organizationId}/project/${projectId}/documents/${linkTooltip.linkedDocumentId}`;
                                window.open(url, '_blank');
                            }
                        } else if (linkTooltip.linkType === 'hyperlink') {
                            // Open external hyperlink
                            if (linkTooltip.hyperlinkUrl) {
                                window.open(
                                    linkTooltip.hyperlinkUrl,
                                    '_blank',
                                    'noopener,noreferrer',
                                );
                            }
                        }
                    }}
                >
                    {/* Color indicator dot */}
                    <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: LINK_COLORS[linkTooltip.linkType] }}
                    />
                    {/* Link type icon */}
                    {linkTooltip.linkType === 'requirement' && (
                        <FileText size={11} className="flex-shrink-0 opacity-70" />
                    )}
                    {linkTooltip.linkType === 'document' && (
                        <Link2 size={11} className="flex-shrink-0 opacity-70" />
                    )}
                    {linkTooltip.linkType === 'hyperlink' && (
                        <ExternalLink size={11} className="flex-shrink-0 opacity-70" />
                    )}
                    {/* Label text */}
                    <span className="truncate max-w-[180px]">
                        {linkTooltip.linkLabel ||
                            (linkTooltip.linkType === 'requirement'
                                ? 'Jump to Requirement'
                                : linkTooltip.linkType === 'document'
                                  ? 'Open Document'
                                  : linkTooltip.hyperlinkUrl)}
                    </span>
                    {/* Subtle external link indicator */}
                    <ExternalLink size={10} className="flex-shrink-0 opacity-40" />
                    {/* Small triangle pointer pointing down to element */}
                    <div
                        className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-0 h-0"
                        style={{
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderTop: '4px solid rgb(17 24 39 / 0.95)',
                        }}
                    />
                </div>
            )}

            {/* Bounding box overlay for linked elements */}
            {boundingBoxOverlay && excalidrawApiRef.current && (
                <div
                    className="absolute z-[1000] pointer-events-none rounded-md"
                    style={{
                        left:
                            (boundingBoxOverlay.x +
                                excalidrawApiRef.current.getAppState().scrollX) *
                            excalidrawApiRef.current.getAppState().zoom.value,
                        top:
                            (boundingBoxOverlay.y +
                                excalidrawApiRef.current.getAppState().scrollY) *
                            excalidrawApiRef.current.getAppState().zoom.value,
                        width:
                            boundingBoxOverlay.width *
                            excalidrawApiRef.current.getAppState().zoom.value,
                        height:
                            boundingBoxOverlay.height *
                            excalidrawApiRef.current.getAppState().zoom.value,
                        opacity: 0.5,
                        border: `2px solid ${linkTooltip ? LINK_COLORS[linkTooltip.linkType] : LINK_COLORS.requirement}`,
                    }}
                />
            )}
        </div>
    );
};

export default ExcalidrawWrapper;
