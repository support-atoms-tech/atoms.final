'use client';

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { ArrowRight, Check, Network, Plus, Search, Trash2, Trash } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
    useCreateTraceLinks,
    useDeleteTraceLink,
} from '@/hooks/mutations/useTraceLinkMutations';
import {
    useDocumentRequirements,
    useRequirement,
    useRequirementsByIds,
} from '@/hooks/queries/useRequirement';
import {
    useCreateRelationship,
    useDeleteRelationship,
    useRequirementAncestors,
    useRequirementDescendants,
    useRequirementTree,
} from '@/hooks/queries/useRequirementRelationships';
import type { RequirementTreeNode } from '@/hooks/queries/useRequirementRelationships';
import { useReverseTraceLinks, useTraceLinks } from '@/hooks/queries/useTraceability';
import { useUser } from '@/lib/providers/user.provider';

type TraceRelationship = 'parent_of' | 'child_of';

type SelectedRequirement = {
    id: string;
    name: string;
    description: string | null;
    external_id?: string | null;
    relationship: TraceRelationship;
};

interface TraceLinksContentProps {
    requirementId: string;
    projectId: string;
    orgId: string;
    documentId?: string;
}

function getPropertyValue(props: Record<string, any>, target: string) {
    if (!props) return null;

    const key = Object.keys(props).find(
        (k) => k.trim().toLowerCase() === target.trim().toLowerCase(),
    );

    return key ? (props[key]?.value ?? null) : null;
}

export default function TraceLinksContent({
    requirementId,
    projectId,
    orgId,
    documentId = '',
}: TraceLinksContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { profile } = useUser();

    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [hierarchyState, setHierarchyState] = useState<any>(null);
    const hasCompleteHierarchyRef = useRef<boolean>(false);

    useEffect(() => {
        hasCompleteHierarchyRef.current = false;
        setHierarchyState(null); // reset hierarchy state when requirement changes
    }, [requirementId]);

    const { data: requirements, isLoading: isLoadingRequirements } =
        useDocumentRequirements(documentId);
    const { data: outgoingLinks } = useTraceLinks(requirementId, 'requirement');
    const { data: incomingLinks } = useReverseTraceLinks(requirementId, 'requirement');

    // Main requirement hooks
    const {
        data: currentRequirement,
        isLoading: isLoadingCurrentRequirement,
        refetch: refetchCurrentRequirement,
    } = useRequirement(requirementId);
    const {
        data: requirementAncestors,
        isLoading: isLoadingAncestors,
        refetch: refetchAncestors,
    } = useRequirementAncestors(requirementId);

    const {
        data: requirementDescendants,
        isLoading: isLoadingDescendants,
        refetch: refetchDescendants,
    } = useRequirementDescendants(requirementId);
    const { data: requirementTree, isLoading: isLoadingTree } =
        useRequirementTree(projectId);

    // Extract requirement IDs from trace links
    const linkedRequirementIds = useMemo(() => {
        const sourceIds = incomingLinks?.map((link) => link.source_id) || [];
        const targetIds = outgoingLinks?.map((link) => link.target_id) || [];
        return [...sourceIds, ...targetIds];
    }, [incomingLinks, outgoingLinks]);

    const { data: linkedRequirements, isLoading: _isLoadingLinkedRequirements } =
        useRequirementsByIds(linkedRequirementIds);

    const createTraceLinksMutation = useCreateTraceLinks();
    const deleteTraceLinkMutation = useDeleteTraceLink();

    const createRelationshipMutation = useCreateRelationship();
    const deleteRelationshipMutation = useDeleteRelationship();

    // state for managing parent/child relationship dialogs
    const [isAddParentOpen, setIsAddParentOpen] = useState(false);
    const [isAddChildOpen, setIsAddChildOpen] = useState(false);
    const [isAddTestCaseOpen, setIsAddTestCaseOpen] = useState(false);

    // state for delete confirmation dialog
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [selectedLinkToRemove, setSelectedLinkToRemove] = useState<{
        ancestorId: string;
        descendantId: string;
        isParent: boolean;
    } | null>(null);

    // state for selected requirements in relationship dialogs
    const [selectedParentRequirement, setSelectedParentRequirement] =
        useState<SelectedRequirement | null>(null);
    const [selectedChildRequirement, setSelectedChildRequirement] =
        useState<SelectedRequirement | null>(null);
    const [selectedTestCase, setSelectedTestCase] = useState<any | null>(null);

    // state for search in parent/child dialogs
    const [parentSearchQuery, setParentSearchQuery] = useState('');
    const [childSearchQuery, setChildSearchQuery] = useState('');

    // get ancestor and descendant IDs to fetch full requirement data
    const ancestorIds = useMemo(() => {
        const ids = (requirementAncestors || [])
            .map((a) => (a as any).requirement_id)
            .filter((id): id is string => !!id && typeof id === 'string');
        return ids;
    }, [requirementAncestors]);

    const descendantIds = useMemo(() => {
        const ids = (requirementDescendants || [])
            .map((d) => (d as any).requirement_id)
            .filter((id): id is string => !!id && typeof id === 'string');
        return ids;
    }, [requirementDescendants]);

    const { data: ancestorRequirements, refetch: refetchAncestorRequirements } =
        useRequirementsByIds(ancestorIds);
    const { data: descendantRequirements, refetch: refetchDescendantRequirements } =
        useRequirementsByIds(descendantIds);

    const realParentRequirements = useMemo(() => {
        if (!requirementAncestors) return [];
        return requirementAncestors
            .map((ancestor) => {
                const ancestorId = (ancestor as any).requirement_id;

                if (!ancestorId || typeof ancestorId !== 'string') {
                    return null;
                }

                const fullReq = ancestorRequirements?.find((r) => r.id === ancestorId);
                return {
                    id: ancestorId,
                    name: fullReq?.name || (ancestor as any).title || '',
                    external_id: fullReq?.external_id || null,
                    description: fullReq?.description || '',
                    type: fullReq?.type || 'Requirement',
                };
            })
            .filter((req): req is NonNullable<typeof req> => req !== null);
    }, [requirementAncestors, ancestorRequirements]);

    const realChildRequirements = useMemo(() => {
        if (!requirementDescendants) return [];
        const directChildren = requirementDescendants.filter((desc) => {
            const descId = (desc as any).requirement_id;
            return (
                (desc as any).depth === 1 &&
                (desc as any).directParent &&
                descId &&
                typeof descId === 'string'
            );
        });

        const filteredDescendants =
            directChildren.length > 0
                ? directChildren
                : requirementDescendants.filter((desc) => {
                      const descId = (desc as any).requirement_id;
                      return (
                          (desc as any).depth === 1 &&
                          descId &&
                          typeof descId === 'string'
                      );
                  });

        return filteredDescendants
            .map((descendant) => {
                const descendantId = (descendant as any).requirement_id;

                if (!descendantId || typeof descendantId !== 'string') {
                    return null;
                }

                const fullReq = descendantRequirements?.find(
                    (r) => r.id === descendantId,
                );
                return {
                    id: descendantId,
                    name: fullReq?.name || (descendant as any).title || '',
                    external_id: fullReq?.external_id || null,
                    description: fullReq?.description || '',
                    type: fullReq?.type || 'Requirement',
                };
            })
            .filter((req): req is NonNullable<typeof req> => req !== null);
    }, [requirementDescendants, descendantRequirements]);

    useEffect(() => {
        if (ancestorRequirements !== undefined && descendantRequirements !== undefined) {
            console.log('[trace] metadata loaded:', {
                ancestorIds: ancestorIds.length,
                descendantIds: descendantIds.length,
                parentRequirements: realParentRequirements.length,
                childRequirements: realChildRequirements.length,
            });
        }
    }, [
        ancestorRequirements,
        descendantRequirements,
        ancestorIds.length,
        descendantIds.length,
        realParentRequirements.length,
        realChildRequirements.length,
    ]);

    const handleAddParent = async () => {
        if (!selectedParentRequirement || !profile) {
            toast({
                title: 'Error',
                description: 'Please select a parent requirement',
                variant: 'destructive',
            });
            return;
        }

        try {
            await createRelationshipMutation.mutateAsync({
                ancestorId: selectedParentRequirement.id,
                descendantId: requirementId,
            });

            await Promise.all([
                refetchAncestors(),
                refetchDescendants(),
                refetchCurrentRequirement(),
            ]);

            setTimeout(async () => {
                await Promise.all([
                    refetchAncestors(),
                    refetchDescendants(),
                    refetchAncestorRequirements(),
                    refetchDescendantRequirements(),
                ]);
            }, 100);

            toast({
                title: 'Success',
                description: `Added ${selectedParentRequirement.name} as parent requirement`,
                variant: 'default',
            });

            setSelectedParentRequirement(null);
            setIsAddParentOpen(false);
            setParentSearchQuery('');
        } catch (error) {
            console.error('Failed to create parent relationship', error);
            toast({
                title: 'Error',
                description: `Failed to create parent relationship.`,
                variant: 'destructive',
            });
        }
    };

    const handleAddChild = async () => {
        if (!selectedChildRequirement || !profile) {
            toast({
                title: 'Error',
                description: 'Please select a child requirement',
                variant: 'destructive',
            });
            return;
        }

        try {
            await createRelationshipMutation.mutateAsync({
                ancestorId: requirementId,
                descendantId: selectedChildRequirement.id,
            });

            await Promise.all([
                refetchDescendants(),
                refetchAncestors(),
                refetchCurrentRequirement(),
            ]);

            toast({
                title: 'Success',
                description: `Added ${selectedChildRequirement.name} as child requirement`,
                variant: 'default',
            });

            setSelectedChildRequirement(null);
            setIsAddChildOpen(false);
            setChildSearchQuery('');
        } catch (error) {
            console.error('Failed to create child relationship', error);
            toast({
                title: 'Error',
                description: `Failed to create child relationship.`,
                variant: 'destructive',
            });
        }
    };

    // Real test cases
    const realTestCases = useMemo(() => {
        return [
            {
                id: '-',
                name: '-',
                title: '-',
                description: '-',
                type: '-',
                status: '-',
                requirements: '-',
                lastExecution: '-',
                duration: '-',
                relationship: 'tests' as const,
            },
        ];
    }, [outgoingLinks, incomingLinks]);

    const handleAddTestCase = async () => {
        if (!selectedTestCase || !profile) {
            toast({
                title: 'Error',
                description: 'Please select a test case',
                variant: 'destructive',
            });
            return;
        }

        try {
            await createTraceLinksMutation.mutateAsync([
                {
                    source_id: requirementId,
                    source_type: 'requirement' as const,
                    target_id: selectedTestCase.id,
                    target_type: 'requirement' as const,
                    link_type: 'relates_to' as const,
                    created_by: profile.id,
                    updated_by: profile.id,
                },
            ]);

            toast({
                title: 'Success',
                description: `Added ${selectedTestCase.name} as test case`,
                variant: 'default',
            });

            setSelectedTestCase(null);
            setIsAddTestCaseOpen(false);
        } catch (error) {
            console.error('Failed to create test case relationship', error);
            toast({
                title: 'Error',
                description: 'Failed to create test case relationship',
                variant: 'destructive',
            });
        }
    };

    // Build hierarchy
    const realHierarchy = useMemo(() => {
        // Create placeholder structure if data is not ready (never return null)
        const createPlaceholder = () => {
            const currentPlaceholder = {
                id: currentRequirement?.id || '',
                name: currentRequirement?.name || '-',
                type: currentRequirement?.type || '-',
                external_id: currentRequirement?.external_id || '',
                isCurrent: true,
                relationshipRole: 'current' as const,
                children: [],
            };
            const placeholder = {
                parents: [], // No parents in placeholder
                current: currentPlaceholder, // Keep current for reference
                hasRelationships: false,
            };
            return placeholder;
        };

        // If currentRequirement is missing, return placeholder
        if (!currentRequirement) {
            return createPlaceholder();
        }

        // If still loading, return placeholder with current requirement data
        if (isLoadingAncestors || isLoadingDescendants) {
            return createPlaceholder();
        }

        // If metadata not loaded yet, return placeholder
        const hasAncestorIds = ancestorIds.length > 0;
        const hasDescendantIds = descendantIds.length > 0;
        const ancestorMetadataLoaded =
            !hasAncestorIds || ancestorRequirements !== undefined;
        const descendantMetadataLoaded =
            !hasDescendantIds || descendantRequirements !== undefined;

        if (!ancestorMetadataLoaded || !descendantMetadataLoaded) {
            return createPlaceholder();
        }

        const requirementMetaMap = new Map<string, any>();

        // Add all ancestor requirements with full metadata
        if (ancestorRequirements) {
            ancestorRequirements.forEach((req: any) => {
                requirementMetaMap.set(req.id, req);
            });
        }

        if (descendantRequirements) {
            descendantRequirements.forEach((req: any) => {
                requirementMetaMap.set(req.id, req);
            });
        }

        // Add current requirement with full metadata
        requirementMetaMap.set(currentRequirement.id, currentRequirement);

        realParentRequirements.forEach((req) => {
            if (!requirementMetaMap.has(req.id)) {
                requirementMetaMap.set(req.id, {
                    id: req.id,
                    name: req.name,
                    external_id: req.external_id,
                    type: req.type,
                    description: req.description,
                });
            }
        });

        realChildRequirements.forEach((req) => {
            if (!requirementMetaMap.has(req.id)) {
                requirementMetaMap.set(req.id, {
                    id: req.id,
                    name: req.name,
                    external_id: req.external_id,
                    type: req.type,
                    description: req.description,
                });
            }
        });

        const buildChildTree = (
            parentId: string,
            allTreeNodes: RequirementTreeNode[],
            metadataMap: Map<string, any>,
            depth: number = 1,
        ): any[] => {
            const childNodes = allTreeNodes.filter((node) => node.parent_id === parentId);

            return childNodes.map((treeNode) => {
                // Get full metadata from map
                const meta = metadataMap.get(treeNode.requirement_id);

                // Build grandchildren first to determine if this node has children
                const grandchildren = buildChildTree(
                    treeNode.requirement_id,
                    allTreeNodes,
                    metadataMap,
                    depth + 1,
                );

                // Determine relationshipRole based on depth and whether node has children
                const hasChildren = grandchildren.length > 0;
                let relationshipRole: string;

                if (depth === 1) {
                    relationshipRole = hasChildren ? 'child-parent' : 'child';
                } else if (depth === 2) {
                    relationshipRole = hasChildren ? 'grandchild-parent' : 'grandchild';
                } else if (depth === 3) {
                    relationshipRole = hasChildren
                        ? 'great-grandchild-parent'
                        : 'great-grandchild';
                } else {
                    // depth >= 4
                    relationshipRole = hasChildren
                        ? `level-${depth}-descendant-parent`
                        : `level-${depth}-descendant`;
                }

                // Merge full metadata from the map, with fallbacks
                return {
                    id: meta?.id ?? treeNode.requirement_id,
                    name: meta?.name ?? treeNode.title ?? '(No Name)',
                    external_id: meta?.external_id ?? '',
                    type: meta?.type ?? '-',
                    description: meta?.description ?? '',
                    status: meta?.status,
                    priority: meta?.priority,
                    properties: meta?.properties,
                    isCurrent: false,
                    relationshipRole: relationshipRole,
                    depth: depth,
                    hasChildren: hasChildren,
                    children: grandchildren,
                };
            });
        };

        // Build nested hierarchy
        // Only use the direct parent (first parent in the list)
        const directParent =
            realParentRequirements.length > 0 ? realParentRequirements[0] : null;

        const currentExternalId = currentRequirement.external_id || '';
        const currentDisplayName = currentRequirement.name || '-';

        let children: any[] = [];

        if (requirementTree && requirementTree.length > 0) {
            const directChildNodes = requirementTree.filter(
                (node) => node.parent_id === currentRequirement.id,
            );

            children = directChildNodes.map((childNode) => {
                // Get full metadata from the comprehensive map
                const meta = requirementMetaMap.get(childNode.requirement_id);

                const grandchildren = buildChildTree(
                    childNode.requirement_id,
                    requirementTree,
                    requirementMetaMap,
                    2, // depth 2 for grandchildren
                );

                const hasChildren = grandchildren.length > 0;
                const relationshipRole = hasChildren ? 'child-parent' : 'child';

                // Merge full metadata from the map, with fallbacks
                return {
                    id: meta?.id ?? childNode.requirement_id,
                    name: meta?.name ?? childNode.title ?? '(No Name)',
                    external_id: meta?.external_id ?? '',
                    type: meta?.type ?? '-',
                    description: meta?.description ?? '',
                    status: meta?.status,
                    priority: meta?.priority,
                    properties: meta?.properties,
                    isCurrent: false,
                    relationshipRole: relationshipRole,
                    depth: 1,
                    hasChildren: hasChildren,
                    children: grandchildren,
                };
            });
        }

        if (
            children.length === 0 &&
            requirementDescendants &&
            requirementDescendants.length > 0
        ) {
            let directChildren = (requirementDescendants || []).filter(
                (desc) =>
                    (desc as any).depth === 1 && (desc as any).directParent === true,
            );

            if (directChildren.length === 0) {
                directChildren = (requirementDescendants || []).filter(
                    (desc) => (desc as any).depth === 1,
                );
            }

            children = directChildren.map((child) => {
                const childId = (child as any).requirement_id;
                // Get full metadata from the comprehensive map
                const meta = requirementMetaMap.get(childId);

                let grandchildren: any[] = [];
                if (requirementTree && requirementTree.length > 0) {
                    grandchildren = buildChildTree(
                        childId,
                        requirementTree,
                        requirementMetaMap,
                        2, // depth 2 for grandchildren
                    );
                }

                const hasChildren = grandchildren.length > 0;
                const relationshipRole = hasChildren ? 'child-parent' : 'child';

                // Merge full metadata from the map, with fallbacks
                return {
                    id: meta?.id ?? childId,
                    name: meta?.name ?? (child as any).title ?? '(No Name)',
                    external_id: meta?.external_id ?? '',
                    type: meta?.type ?? '-',
                    description: meta?.description ?? '',
                    status: meta?.status,
                    priority: meta?.priority,
                    properties: meta?.properties,
                    isCurrent: false,
                    relationshipRole: relationshipRole,
                    depth: 1,
                    hasChildren: hasChildren,
                    children: grandchildren,
                };
            });
        }

        // Build the current node with its children
        const currentHasChildren = children.length > 0;
        const currentDepth = directParent ? 1 : 0;
        // Determine relationshipRole for current node based on whether it has parent and children
        let currentRelationshipRole: string;
        if (directParent && currentHasChildren) {
            currentRelationshipRole = 'current-child-parent';
        } else if (directParent && !currentHasChildren) {
            currentRelationshipRole = 'current-child';
        } else if (!directParent && currentHasChildren) {
            currentRelationshipRole = 'current-parent';
        } else {
            currentRelationshipRole = 'current';
        }

        const current = {
            id: currentRequirement.id,
            name: currentDisplayName,
            type: currentRequirement.type || '-',
            external_id: currentExternalId,
            isCurrent: true,
            relationshipRole: currentRelationshipRole,
            depth: currentDepth,
            hasChildren: currentHasChildren,
            children: children,
        };

        let parents: any[] = [];

        if (directParent) {
            // Nest current requirement inside the direct parent's children array
            const parentHasChildren = true; // Parent always has at least the current node as a child
            const parentNode = {
                id: directParent.id,
                name: directParent.name,
                type: directParent.type || '-',
                external_id: directParent.external_id || '',
                isCurrent: false,
                relationshipRole: 'parent' as const,
                depth: 0,
                hasChildren: parentHasChildren,
                children: [current], // Current requirement is nested as a child of the parent
            };
            parents = [parentNode];
        } else {
            // No parent - current is the root
            parents = [];
        }

        const hasRelationships = parents.length > 0 || current.children.length > 0;
        const hasAncestors = requirementAncestors && requirementAncestors.length > 0;
        const hasDescendants =
            requirementDescendants && requirementDescendants.length > 0;
        const finalHasRelationships = hasRelationships || hasAncestors || hasDescendants;

        const hierarchyResult = {
            parents,
            current: directParent ? current : current,
            hasRelationships: finalHasRelationships,
        };

        return hierarchyResult;
    }, [
        currentRequirement,
        requirementAncestors,
        requirementDescendants,
        ancestorRequirements,
        descendantRequirements,
        ancestorIds,
        descendantIds,
        realParentRequirements,
        realChildRequirements,
        requirementTree,
        isLoadingAncestors,
        isLoadingDescendants,
    ]);

    useEffect(() => {
        const isComplete = realHierarchy.hasRelationships === true;
        const isPlaceholder =
            realHierarchy.current?.id === '' ||
            (realHierarchy.current?.name === '-' && !realHierarchy.current?.id);
        const isNewCompleteData = isComplete && !isPlaceholder;

        if (hasCompleteHierarchyRef.current && !isNewCompleteData) {
            return;
        }

        // Update hierarchyState
        setHierarchyState(realHierarchy);

        // Track if we now have complete data
        if (isNewCompleteData) {
            hasCompleteHierarchyRef.current = true;
        }

        // Auto-expand parent nodes that contain the current requirement
        if (realHierarchy.parents.length > 0) {
            realHierarchy.parents.forEach((parent: any) => {
                // Check if parent contains the current requirement in its children
                const containsCurrent = parent.children?.some(
                    (child: any) => child.isCurrent === true,
                );
                if (containsCurrent) {
                    setExpandedNodes((prev) => {
                        const newSet = new Set(prev);
                        newSet.add(parent.id);
                        return newSet;
                    });
                }
            });
        }
    }, [realHierarchy]);

    // Extract Rationale and Tags from currentRequirement.properties
    const rationaleValue = useMemo(() => {
        if (!currentRequirement?.properties) return '-';
        const props = currentRequirement.properties as Record<string, any>;
        const rationale = getPropertyValue(props, 'Rationale');
        return rationale || '-';
    }, [currentRequirement?.properties]);

    const tagsValue = useMemo(() => {
        if (!currentRequirement?.properties) return [];
        const props = currentRequirement.properties as Record<string, any>;
        const raw = getPropertyValue(props, 'Tags');
        if (!raw || typeof raw !== 'string') return [];
        return raw
            .split(/[;,]+/)
            .map((t: string) => t.trim())
            .filter(Boolean);
    }, [currentRequirement?.properties]);

    const getRelationshipType = (
        nodeId: string,
        isCurrent: boolean,
        hasParent: boolean,
        hasChildren: boolean,
        level: number,
        node?: any,
    ) => {
        if (node?.relationshipRole) {
            const role = node.relationshipRole;
            const depth = node.depth ?? level;
            const nodeHasChildren = node.hasChildren ?? hasChildren;

            // Handle parent nodes
            if (role === 'parent') {
                return 'Parent Requirement';
            }

            // Handle current node variations
            if (role === 'current') {
                // Fallback for old format
                if (hierarchyState) {
                    const hasParentActual = hierarchyState.parents.length > 0;
                    const hasChildrenActual = hierarchyState.current.children.length > 0;
                    if (!hasParentActual && !hasChildrenActual) {
                        return 'No Relationships';
                    }
                    if (!hasParentActual && hasChildrenActual) {
                        return 'Parent Requirement';
                    }
                    if (hasParentActual && !hasChildrenActual) {
                        return 'Child Requirement';
                    }
                    if (hasParentActual && hasChildrenActual) {
                        return 'Child/Parent Requirement';
                    }
                }
                return 'No Relationships';
            }

            if (role === 'current-child-parent') {
                return 'Child/Parent Requirement';
            }

            if (role === 'current-child') {
                return 'Child Requirement';
            }

            if (role === 'current-parent') {
                return 'Parent Requirement';
            }

            // Handle child nodes with dual roles
            if (role === 'child-parent') {
                return 'Child/Parent Requirement';
            }

            if (role === 'child') {
                return 'Child Requirement';
            }

            // Handle grandchild nodes
            if (role === 'grandchild-parent') {
                return 'Grandchild/Parent Requirement';
            }

            if (role === 'grandchild') {
                return 'Grandchild Requirement';
            }

            // Handle great-grandchild nodes
            if (role === 'great-grandchild-parent') {
                return 'Great-Grandchild/Parent Requirement';
            }

            if (role === 'great-grandchild') {
                return 'Great-Grandchild Requirement';
            }

            // Handle deeper levels (depth >= 4)
            if (role.startsWith('level-') && role.includes('-descendant')) {
                if (role.includes('-parent')) {
                    const levelMatch = role.match(/level-(\d+)-descendant-parent/);
                    const levelNum = levelMatch ? parseInt(levelMatch[1], 10) : depth;
                    return `Level ${levelNum} Descendant/Parent Requirement`;
                } else {
                    const levelMatch = role.match(/level-(\d+)-descendant/);
                    const levelNum = levelMatch ? parseInt(levelMatch[1], 10) : depth;
                    return `Level ${levelNum} Descendant`;
                }
            }
        }

        // For the current node, use hierarchyState directly
        if (isCurrent && hierarchyState) {
            const hasParentActual = hierarchyState.parents.length > 0;
            const hasChildrenActual = hierarchyState.current.children.length > 0;
            const isGrandchild = hierarchyState.parents.length > 1 || level > 1;

            if (hasParentActual && isGrandchild) {
                return 'Grandchild Requirement';
            }
            if (!hasParentActual && !hasChildrenActual) {
                return 'No Relationships';
            }
            if (!hasParentActual && hasChildrenActual) {
                return 'Parent Requirement';
            }
            if (hasParentActual && !hasChildrenActual) {
                return 'Child Requirement';
            }
            if (hasParentActual && hasChildrenActual) {
                return 'Child/Parent Requirement';
            }
            return 'No Relationships';
        }

        // Check if this node is in the parents array
        if (level === 0 && hierarchyState && hierarchyState.parents.length > 0) {
            const isParentNode = hierarchyState.parents.some((p: any) => p.id === nodeId);
            if (isParentNode) {
                // Parent nodes are always "Parent Requirement" role
                return 'Parent Requirement';
            }
        }

        // For child/grandchild nodes (level > 0 or hasParentInTree = true)
        const isGrandchild = level > 1;

        if (hasParent && isGrandchild) {
            return 'Grandchild Requirement';
        }
        if (!hasParent && !hasChildren) {
            return 'No Relationships';
        }
        if (!hasParent && hasChildren) {
            return 'Parent Requirement';
        }
        if (hasParent && !hasChildren) {
            return 'Child Requirement';
        }
        if (hasParent && hasChildren) {
            return 'Child/Parent Requirement';
        }
        return 'No Relationships';
    };

    const renderHierarchyNode = (
        node: any,
        level: number = 0,
        hasParentInTree: boolean = false,
    ) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id);
        const isCurrent = node.isCurrent;

        const toggleExpanded = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (hasChildren) {
                setExpandedNodes((prev) => {
                    const newSet = new Set(prev);
                    if (newSet.has(node.id)) {
                        newSet.delete(node.id);
                    } else {
                        newSet.add(node.id);
                    }
                    return newSet;
                });
            }
        };

        const handleNodeClick = () => {
            if (node.id !== requirementId) {
                const traceUrl = `/org/${orgId}/traceability?tab=manage&projectId=${projectId}&requirementId=${node.id}${documentId ? `&documentId=${documentId}` : ''}`;
                router.push(traceUrl);
            }
        };

        const nodeHasParent = hasParentInTree || level > 0;
        const relationshipType = getRelationshipType(
            node.id,
            isCurrent,
            nodeHasParent,
            hasChildren,
            level,
            node, // Pass the node to access relationshipRole
        );

        const indentLevel = level * 24;
        const externalId = node.external_id || '';
        const displayName = node.name || '-';

        return (
            <div key={node.id}>
                <div
                    className={`flex items-center gap-2 py-2 px-3 cursor-pointer ${
                        isCurrent ? 'border-l-2 border-primary' : ''
                    }`}
                    style={{ marginLeft: `${indentLevel}px` }}
                    onClick={handleNodeClick}
                >
                    {level > 0 && (
                        <div className="flex items-center">
                            <div className="w-4 h-0.5 bg-muted-foreground"></div>
                        </div>
                    )}

                    {hasChildren && (
                        <div
                            className="text-muted-foreground transition-transform duration-200"
                            onClick={toggleExpanded}
                            style={{
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            }}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M6 4L10 8L6 12"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    )}

                    <span className="font-medium">
                        {externalId ? (
                            <>
                                <span
                                    className={
                                        isCurrent
                                            ? 'text-primary'
                                            : 'text-foreground dark:text-white'
                                    }
                                >
                                    {externalId}
                                </span>
                                <span className="text-foreground dark:text-white">
                                    {' — '}
                                </span>
                                <span className="text-foreground dark:text-white">
                                    {displayName}
                                </span>
                            </>
                        ) : (
                            <span className="text-foreground dark:text-white">
                                {displayName}
                            </span>
                        )}
                    </span>

                    <span className="text-xs text-muted-foreground">
                        ({relationshipType})
                    </span>
                </div>

                {hasChildren && isExpanded && (
                    <div className="border-l border-border ml-3">
                        {node.children.map((child: any) => (
                            <div key={child.id}>
                                {renderHierarchyNode(child, level + 1, true)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (isLoadingCurrentRequirement) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Loading requirement...
            </div>
        );
    }

    if (!currentRequirement) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Requirement not found
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Requirement Hierarchy Section */}
            <Card className="border border-border">
                <CardHeader className="py-4">
                    <CardTitle className="text-lg">Requirement Hierarchy</CardTitle>
                </CardHeader>
                <CardContent>
                    {hierarchyState === null ? (
                        <p className="text-muted-foreground text-center py-4">
                            Loading requirement...
                        </p>
                    ) : (
                        (() => {
                            const hasParents = hierarchyState.parents?.length > 0;

                            // Get the current node
                            let currentNode = hierarchyState.current;
                            if (
                                hasParents &&
                                hierarchyState.parents[0]?.children?.length > 0
                            ) {
                                currentNode = hierarchyState.parents[0].children[0];
                            }

                            const hasChildren = currentNode?.children?.length > 0;
                            const trulyNoRelationships = !hasParents && !hasChildren;

                            // Only show "No Relationships" if there are genuinely no parents and no children
                            const isPlaceholder =
                                currentNode?.id === '' ||
                                (currentNode?.name === '-' && !currentNode?.id);

                            if (trulyNoRelationships && !isPlaceholder) {
                                return (
                                    <div>
                                        {renderHierarchyNode(currentNode)}
                                        <p className="text-muted-foreground text-center mt-4 text-sm">
                                            No relationships found yet
                                        </p>
                                    </div>
                                );
                            }

                            // Render the nested tree structure
                            return (
                                <div className="space-y-2">
                                    {hasParents
                                        ? hierarchyState.parents.map((parent: any) => (
                                              <div key={parent.id}>
                                                  {renderHierarchyNode(parent, 0, false)}
                                              </div>
                                          ))
                                        : // No parent - render current as root node
                                          renderHierarchyNode(currentNode, 0, false)}
                                </div>
                            );
                        })()
                    )}
                </CardContent>
            </Card>

            {/* Requirement Details Section */}
            <Card className="border border-border">
                <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">
                                {currentRequirement?.name || '-'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Requirement Details
                            </p>
                        </div>
                        <span
                            className={`px-3 py-1 text-xs font-medium border ${
                                currentRequirement?.status === 'approved' ||
                                currentRequirement?.status === 'active'
                                    ? 'bg-green-500/20 text-muted-foreground border-green-500/30'
                                    : currentRequirement?.status === 'rejected' ||
                                        currentRequirement?.status === 'deleted'
                                      ? 'bg-red-500/20 text-muted-foreground border-red-500/30'
                                      : currentRequirement?.status === 'archived'
                                        ? 'bg-gray-500/20 text-muted-foreground border-gray-500/30'
                                        : 'bg-yellow-500/20 text-muted-foreground border-yellow-500/30'
                            }`}
                        >
                            {currentRequirement?.status
                                ? String(currentRequirement.status)
                                      .replaceAll('_', ' ')
                                      .replace(/\b\w/g, (c) => c.toUpperCase())
                                : '-'}
                        </span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <span className="px-2 py-1 bg-primary/10 text-muted-foreground text-xs font-semibold border border-primary/20">
                                    {currentRequirement?.external_id || '—'}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                    Description
                                </h3>
                                <p className="text-foreground text-sm">
                                    {currentRequirement?.description || '-'}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                    Details
                                </h3>
                                <div className="space-y-1 text-sm">
                                    <p className="text-foreground">
                                        Type:{' '}
                                        {(() => {
                                            const hasParent =
                                                realParentRequirements.length > 0;
                                            const hasChildren =
                                                realChildRequirements.length > 0;
                                            const isGrandchild =
                                                requirementAncestors?.some(
                                                    (ancestor) => ancestor.depth > 1,
                                                ) || false;

                                            if (hasParent && isGrandchild) {
                                                return 'Grandchild Requirement';
                                            }
                                            if (!hasParent && !hasChildren) {
                                                return 'No Relationships';
                                            }
                                            if (!hasParent && hasChildren) {
                                                return 'Parent Requirement';
                                            }
                                            if (hasParent && !hasChildren) {
                                                return 'Child Requirement';
                                            }
                                            if (hasParent && hasChildren) {
                                                return 'Child/Parent Requirement';
                                            }
                                            return '-';
                                        })()}
                                    </p>
                                    <p className="text-foreground">
                                        Priority: {currentRequirement?.priority || '-'}
                                    </p>
                                    <p className="text-foreground">
                                        Source: {currentRequirement?.external_id || '-'}
                                    </p>
                                    <p className="text-foreground">
                                        Created:{' '}
                                        {currentRequirement?.created_at
                                            ? new Date(
                                                  currentRequirement.created_at,
                                              ).toLocaleDateString()
                                            : '-'}
                                    </p>
                                    <p className="text-foreground">
                                        Updated:{' '}
                                        {currentRequirement?.updated_at
                                            ? new Date(
                                                  currentRequirement.updated_at,
                                              ).toLocaleDateString()
                                            : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {rationaleValue &&
                                typeof rationaleValue === 'string' &&
                                rationaleValue.trim() !== '' &&
                                rationaleValue !== '-' && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                            Rationale
                                        </h3>
                                        <p className="text-foreground text-sm">
                                            {rationaleValue}
                                        </p>
                                    </div>
                                )}
                            {tagsValue && tagsValue.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                        Tags
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {tagsValue.map((tag: string, index: number) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 text-xs bg-muted text-muted-foreground border-border"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Parent and Child Requirements Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Parent Requirements */}
                <Card className="border border-border">
                    <CardHeader className="py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Parent Requirements</CardTitle>
                            <Dialog
                                open={isAddParentOpen}
                                onOpenChange={setIsAddParentOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Plus className="h-4 w-4 mr-1" />
                                        ADD PARENT
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle>Add Parent Requirement</DialogTitle>
                                        <DialogDescription>
                                            Select a requirement to be the parent of the
                                            current requirement.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium">
                                                Available Requirements
                                            </h4>
                                            <Input
                                                placeholder="Search requirements..."
                                                value={parentSearchQuery}
                                                onChange={(e) =>
                                                    setParentSearchQuery(e.target.value)
                                                }
                                            />
                                            <div className="max-h-[300px] overflow-y-auto">
                                                {requirements
                                                    ?.filter(
                                                        (req) =>
                                                            req.id !== requirementId &&
                                                            (parentSearchQuery === '' ||
                                                                req.name
                                                                    .toLowerCase()
                                                                    .includes(
                                                                        parentSearchQuery.toLowerCase(),
                                                                    ) ||
                                                                (req.external_id &&
                                                                    req.external_id
                                                                        .toLowerCase()
                                                                        .includes(
                                                                            parentSearchQuery.toLowerCase(),
                                                                        ))),
                                                    )
                                                    .map((req) => (
                                                        <div
                                                            key={req.id}
                                                            className={`p-3 flex justify-between items-start hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
                                                                selectedParentRequirement?.id ===
                                                                req.id
                                                                    ? 'bg-primary/20'
                                                                    : ''
                                                            }`}
                                                            onClick={() =>
                                                                setSelectedParentRequirement(
                                                                    {
                                                                        id: req.id,
                                                                        name: req.name,
                                                                        description:
                                                                            req.description,
                                                                        external_id:
                                                                            req.external_id,
                                                                        relationship:
                                                                            'parent_of',
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <div className="space-y-1">
                                                                <div className="font-medium">
                                                                    {req.external_id
                                                                        ? `${req.external_id} — ${req.name}`
                                                                        : req.name}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {req.description ||
                                                                        'No description'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setIsAddParentOpen(false);
                                                setParentSearchQuery('');
                                                setSelectedParentRequirement(null);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleAddParent}
                                            disabled={
                                                !selectedParentRequirement ||
                                                createRelationshipMutation.isPending
                                            }
                                        >
                                            {createRelationshipMutation.isPending
                                                ? 'Adding...'
                                                : 'Add Parent'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingAncestors ? (
                            <p className="text-muted-foreground text-center">
                                Loading...
                            </p>
                        ) : realParentRequirements.length > 0 ? (
                            <div className="space-y-3">
                                {realParentRequirements.map((req) => (
                                    <div
                                        key={req.id}
                                        className="flex items-start justify-between p-3 bg-background border border-border"
                                    >
                                        <div
                                            className="flex-1 cursor-pointer space-y-1"
                                            onClick={() => {
                                                const traceUrl = `/org/${orgId}/traceability?tab=manage&projectId=${projectId}&requirementId=${req.id}${documentId ? `&documentId=${documentId}` : ''}`;
                                                router.push(traceUrl);
                                            }}
                                        >
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {req.external_id && (
                                                    <span className="px-2 py-0.5 text-xs bg-muted/70 text-gray-600 dark:text-white border">
                                                        {req.external_id}
                                                    </span>
                                                )}
                                                <span className="text-foreground font-medium hover:text-primary">
                                                    {req.name}
                                                </span>
                                            </div>
                                            {req.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {req.description}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="ml-2 shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!profile) return;
                                                setSelectedLinkToRemove({
                                                    ancestorId: req.id,
                                                    descendantId: requirementId,
                                                    isParent: true,
                                                });
                                                setIsConfirmDeleteOpen(true);
                                            }}
                                            disabled={
                                                deleteRelationshipMutation.isPending
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center">
                                No parent requirements
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Child Requirements */}
                <Card className="border border-border">
                    <CardHeader className="py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Child Requirements</CardTitle>
                            <Dialog
                                open={isAddChildOpen}
                                onOpenChange={setIsAddChildOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Plus className="h-4 w-4 mr-1" />
                                        ADD CHILD
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle>Add Child Requirement</DialogTitle>
                                        <DialogDescription>
                                            Select a requirement to be the child of the
                                            current requirement.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium">
                                                Available Requirements
                                            </h4>
                                            <Input
                                                placeholder="Search requirements..."
                                                value={childSearchQuery}
                                                onChange={(e) =>
                                                    setChildSearchQuery(e.target.value)
                                                }
                                            />
                                            <div className="max-h-[300px] overflow-y-auto">
                                                {requirements
                                                    ?.filter(
                                                        (req) =>
                                                            req.id !== requirementId &&
                                                            (childSearchQuery === '' ||
                                                                req.name
                                                                    .toLowerCase()
                                                                    .includes(
                                                                        childSearchQuery.toLowerCase(),
                                                                    ) ||
                                                                (req.external_id &&
                                                                    req.external_id
                                                                        .toLowerCase()
                                                                        .includes(
                                                                            childSearchQuery.toLowerCase(),
                                                                        ))),
                                                    )
                                                    .map((req) => (
                                                        <div
                                                            key={req.id}
                                                            className={`p-3 flex justify-between items-start hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
                                                                selectedChildRequirement?.id ===
                                                                req.id
                                                                    ? 'bg-primary/20'
                                                                    : ''
                                                            }`}
                                                            onClick={() =>
                                                                setSelectedChildRequirement(
                                                                    {
                                                                        id: req.id,
                                                                        name: req.name,
                                                                        description:
                                                                            req.description,
                                                                        external_id:
                                                                            req.external_id,
                                                                        relationship:
                                                                            'child_of',
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <div className="space-y-1">
                                                                <div className="font-medium">
                                                                    {req.external_id
                                                                        ? `${req.external_id} — ${req.name}`
                                                                        : req.name}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {req.description ||
                                                                        'No description'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setIsAddChildOpen(false);
                                                setChildSearchQuery('');
                                                setSelectedChildRequirement(null);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleAddChild}
                                            disabled={
                                                !selectedChildRequirement ||
                                                createRelationshipMutation.isPending
                                            }
                                        >
                                            {createRelationshipMutation.isPending
                                                ? 'Adding...'
                                                : 'Add Child'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingDescendants ? (
                            <p className="text-muted-foreground text-center">
                                Loading...
                            </p>
                        ) : realChildRequirements.length > 0 ? (
                            <div className="space-y-3">
                                {realChildRequirements.map((req) => (
                                    <div
                                        key={req.id}
                                        className="flex items-start justify-between p-3 bg-background border"
                                    >
                                        <div
                                            className="flex-1 cursor-pointer space-y-1"
                                            onClick={() => {
                                                const traceUrl = `/org/${orgId}/traceability?tab=manage&projectId=${projectId}&requirementId=${req.id}${documentId ? `&documentId=${documentId}` : ''}`;
                                                router.push(traceUrl);
                                            }}
                                        >
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {req.external_id && (
                                                    <span className="px-2 py-0.5 text-xs bg-muted/70 text-gray-600 dark:text-white border">
                                                        {req.external_id}
                                                    </span>
                                                )}
                                                <span className="text-foreground font-medium hover:text-primary">
                                                    {req.name}
                                                </span>
                                            </div>
                                            {req.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {req.description}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="ml-2 shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!profile) return;
                                                setSelectedLinkToRemove({
                                                    ancestorId: requirementId,
                                                    descendantId: req.id,
                                                    isParent: false,
                                                });
                                                setIsConfirmDeleteOpen(true);
                                            }}
                                            disabled={
                                                deleteRelationshipMutation.isPending
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center">
                                No child requirements
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Test Cases Section */}
            <Card className="border border-border">
                <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Test Cases</CardTitle>
                        <Dialog
                            open={isAddTestCaseOpen}
                            onOpenChange={setIsAddTestCaseOpen}
                        >
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-1" />
                                    ADD TEST CASE
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Add Test Case</DialogTitle>
                                    <DialogDescription>
                                        Select a test case to link to this requirement.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium">
                                            Available Test Cases
                                        </h4>
                                        <div className="max-h-[300px] overflow-y-auto">
                                            {realTestCases.map((tc) => (
                                                <div
                                                    key={tc.id}
                                                    className={`p-3 flex justify-between items-start hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
                                                        selectedTestCase?.id === tc.id
                                                            ? 'bg-primary/20'
                                                            : ''
                                                    }`}
                                                    onClick={() =>
                                                        setSelectedTestCase(tc)
                                                    }
                                                >
                                                    <div className="space-y-1">
                                                        <div className="font-medium">
                                                            {tc.name}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {tc.title}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsAddTestCaseOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleAddTestCase}
                                        disabled={
                                            !selectedTestCase ||
                                            createTraceLinksMutation.isPending
                                        }
                                    >
                                        {createTraceLinksMutation.isPending
                                            ? 'Adding...'
                                            : 'Add Test Case'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No test cases linked yet</p>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Requirement Link</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this requirement link? This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (!selectedLinkToRemove || !profile) return;

                                deleteRelationshipMutation.mutate(
                                    {
                                        ancestorId: selectedLinkToRemove.ancestorId,
                                        descendantId: selectedLinkToRemove.descendantId,
                                    },
                                    {
                                        onSuccess: async () => {
                                            await Promise.all([
                                                refetchAncestors(),
                                                refetchDescendants(),
                                                refetchCurrentRequirement(),
                                            ]);
                                            toast({
                                                title: 'Success',
                                                description: selectedLinkToRemove.isParent
                                                    ? 'Parent relationship deleted'
                                                    : 'Child relationship deleted',
                                                variant: 'default',
                                            });
                                            setIsConfirmDeleteOpen(false);
                                            setSelectedLinkToRemove(null);
                                        },
                                    },
                                );
                            }}
                            disabled={deleteRelationshipMutation.isPending}
                        >
                            {deleteRelationshipMutation.isPending
                                ? 'Removing...'
                                : 'Remove'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
