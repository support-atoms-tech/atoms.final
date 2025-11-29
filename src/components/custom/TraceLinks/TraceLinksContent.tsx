'use client';

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import {
    ArrowRight,
    Check,
    Eye,
    Link2,
    Network,
    Plus,
    Search,
    SlidersHorizontal,
    Trash2,
    Trash,
    X,
} from 'lucide-react';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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

// MOCK TEST CASE DATA (for UI PURPOSES ONLY)
// Replace with real data when backend is connected
const MOCK_TEST_CASES = [
    {
        id: 'TC-001',
        name: 'System Integration Test',
        description: 'End-to-end flight control system test',
        type: 'system',
        status: 'approved',
        requirements: ['REQ-001'],
        lastExecution: '7/30/2024',
        duration: '1h 0m 0s',
    },
    {
        id: 'TC-002',
        name: 'Performance Load Test',
        description: 'Stress test under maximum load conditions',
        type: 'performance',
        status: 'rejected',
        requirements: ['REQ-001', 'REQ-002'],
        lastExecution: '7/29/2024',
        duration: '2h 15m 30s',
    },
    {
        id: 'TC-003',
        name: 'Security Vulnerability Scan',
        description: 'Automated security testing suite',
        type: 'security',
        status: 'in_progress',
        requirements: ['REQ-003'],
        lastExecution: '7/28/2024',
        duration: '0h 45m 12s',
    },
];

// MOCK TEST CASE RESULTS DATA (for UI PURPOSES ONLY)
// Replace with real data when backend is connected
const MOCK_TEST_CASE_RESULTS = [
    {
        executionId: 'TC-001-R17',
        testCaseId: 'TC-001',
        result: 'passed',
        date: '7/30/2024',
        duration: '1h 0m 0s',
        tester: 'John Doe',
        links: ['https://example.com/logs/123'],
    },
    {
        executionId: 'TC-002-R16',
        testCaseId: 'TC-002',
        result: 'failed',
        date: '7/29/2024',
        duration: '2h 15m 30s',
        tester: 'Jane Smith',
        links: ['https://example.com/logs/124'],
    },
    {
        executionId: 'TC-003-R15',
        testCaseId: 'TC-003',
        result: 'In Progress',
        date: '7/28/2024',
        duration: '0h 45m 12s',
        tester: 'Bob Johnson',
        links: [],
    },
];

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
        // Keep previous hierarchy visible during navigation - let natural data updates replace state
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

    // state for test case results dialogs
    const [isLinksDialogOpen, setIsLinksDialogOpen] = useState(false);
    const [selectedResultLinks, setSelectedResultLinks] = useState<string[]>([]);
    const [isDeleteResultDialogOpen, setIsDeleteResultDialogOpen] = useState(false);
    const [selectedResultToDelete, setSelectedResultToDelete] = useState<string | null>(
        null,
    );

    // state for test cases delete dialog
    const [isDeleteTestCaseDialogOpen, setIsDeleteTestCaseDialogOpen] = useState(false);
    const [selectedTestCaseToDelete, setSelectedTestCaseToDelete] = useState<
        string | null
    >(null);

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
            .filter((ancestor) => (ancestor as any).depth === 1)
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

        // Helper to build full descendant tree using both requirementTree and requirementDescendants
        const buildFullDescendantTree = (
            parentId: string,
            parentDepth: number = 0,
        ): any[] => {
            const children: any[] = [];

            // Try requirementTree first to get direct children
            if (requirementTree && requirementTree.length > 0) {
                const directChildNodes = requirementTree.filter(
                    (node) => node.parent_id === parentId,
                );

                for (const childNode of directChildNodes) {
                    const childId = childNode.requirement_id;
                    const meta = requirementMetaMap.get(childId);

                    // Check if requirementTree shows this child as having children
                    const hasChildrenInTree = requirementTree.some(
                        (node) => node.parent_id === childId,
                    );

                    // Recursively build descendants for this child
                    const grandchildren = buildFullDescendantTree(
                        childId,
                        parentDepth + 1,
                    );

                    const hasChildren = grandchildren.length > 0;
                    let relationshipRole: string;
                    if (parentDepth === 0) {
                        relationshipRole = hasChildren ? 'child-parent' : 'child';
                    } else if (parentDepth === 1) {
                        relationshipRole = hasChildren
                            ? 'grandchild-parent'
                            : 'grandchild';
                    } else if (parentDepth === 2) {
                        relationshipRole = hasChildren
                            ? 'great-grandchild-parent'
                            : 'great-grandchild';
                    } else {
                        relationshipRole = hasChildren
                            ? `level-${parentDepth + 1}-descendant-parent`
                            : `level-${parentDepth + 1}-descendant`;
                    }

                    children.push({
                        id: meta?.id ?? childId,
                        name: meta?.name ?? childNode.title ?? '(No Name)',
                        external_id: meta?.external_id ?? '',
                        type: meta?.type ?? '-',
                        description: meta?.description ?? '',
                        status: meta?.status,
                        priority: meta?.priority,
                        properties: meta?.properties,
                        isCurrent: false,
                        relationshipRole: relationshipRole,
                        depth: parentDepth + 1,
                        hasChildren: hasChildren,
                        children: grandchildren,
                    });
                }
            }

            if (
                children.length === 0 &&
                requirementDescendants &&
                requirementDescendants.length > 0
            ) {
                // Find all descendants at depth = parentDepth + 1
                const directDescendants = (requirementDescendants as any[]).filter(
                    (desc: any) =>
                        desc.depth === parentDepth + 1 &&
                        desc.requirement_id &&
                        desc.requirement_id !== currentRequirement.id,
                );

                // For each direct descendant, add it and recursively build its descendants
                for (const desc of directDescendants) {
                    const childId = desc.requirement_id;
                    const meta = requirementMetaMap.get(childId);

                    // Recursively build descendants for this child
                    const grandchildren = buildFullDescendantTree(
                        childId,
                        parentDepth + 1,
                    );

                    const hasChildren = grandchildren.length > 0;
                    let relationshipRole: string;
                    if (parentDepth === 0) {
                        relationshipRole = hasChildren ? 'child-parent' : 'child';
                    } else if (parentDepth === 1) {
                        relationshipRole = hasChildren
                            ? 'grandchild-parent'
                            : 'grandchild';
                    } else if (parentDepth === 2) {
                        relationshipRole = hasChildren
                            ? 'great-grandchild-parent'
                            : 'great-grandchild';
                    } else {
                        relationshipRole = hasChildren
                            ? `level-${parentDepth + 1}-descendant-parent`
                            : `level-${parentDepth + 1}-descendant`;
                    }

                    children.push({
                        id: meta?.id ?? childId,
                        name: meta?.name ?? desc.title ?? '(No Name)',
                        external_id: meta?.external_id ?? '',
                        type: meta?.type ?? '-',
                        description: meta?.description ?? '',
                        status: meta?.status,
                        priority: meta?.priority,
                        properties: meta?.properties,
                        isCurrent: false,
                        relationshipRole: relationshipRole,
                        depth: parentDepth + 1,
                        hasChildren: hasChildren,
                        children: grandchildren,
                    });
                }
            }

            return children;
        };

        // Build children for current requirement
        const children = buildFullDescendantTree(currentRequirement.id, 0);

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
                console.debug('[NAV TRACE] router.push called from TREE CLICK', node.id);
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
                    {!hierarchyState
                        ? null
                        : (() => {
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

                              // Detect direct parents using requirementAncestors (depth === 1)
                              const directParentIds = (requirementAncestors || [])
                                  .filter(
                                      (ancestor: any) => (ancestor as any).depth === 1,
                                  )
                                  .map(
                                      (ancestor: any) =>
                                          (ancestor as any).ancestor_id ||
                                          (ancestor as any).requirement_id,
                                  )
                                  .filter(
                                      (id: any): id is string =>
                                          !!id && typeof id === 'string',
                                  );

                              const uniqueDirectParentIds = Array.from(
                                  new Set(directParentIds),
                              );
                              const hasMultipleDirectParents =
                                  uniqueDirectParentIds.length > 1;

                              if (hasMultipleDirectParents) {
                                  const directParents = uniqueDirectParentIds
                                      .map((id) => {
                                          const meta = ancestorRequirements?.find(
                                              (req: any) => req.id === id,
                                          );
                                          if (!meta) return null;
                                          return {
                                              id,
                                              name: meta.name || '(No Name)',
                                              external_id: meta.external_id || '',
                                          };
                                      })
                                      .filter(
                                          (
                                              p,
                                          ): p is {
                                              id: string;
                                              name: string;
                                              external_id: string;
                                          } => p !== null,
                                      );

                                  return (
                                      <div className="space-y-4">
                                          <div className="space-y-1">
                                              {directParents.map((parent) => {
                                                  const parentNode = {
                                                      id: parent.id,
                                                      name: parent.name,
                                                      external_id: parent.external_id,
                                                      isCurrent: false,
                                                      children: [
                                                          {
                                                              id: currentRequirement?.id,
                                                              name:
                                                                  currentRequirement?.name ||
                                                                  '(No Name)',
                                                              external_id:
                                                                  currentRequirement?.external_id ||
                                                                  '',
                                                              isCurrent: true,
                                                              children: [],
                                                          },
                                                      ],
                                                  };

                                                  return (
                                                      <div key={parent.id}>
                                                          {renderHierarchyNode(
                                                              parentNode,
                                                              0,
                                                              false,
                                                          )}
                                                      </div>
                                                  );
                                              })}
                                          </div>

                                          {/* Divider */}
                                          <div className="border-t border-border/50 my-4" />

                                          <div className="space-y-2 pl-3">
                                              {renderHierarchyNode(currentNode, 1, true)}
                                          </div>
                                      </div>
                                  );
                              }

                              // Render the nested tree structure (single or zero parent)
                              return (
                                  <div className="space-y-2">
                                      {hasParents
                                          ? hierarchyState.parents.map((parent: any) => (
                                                <div key={parent.id}>
                                                    {renderHierarchyNode(
                                                        parent,
                                                        0,
                                                        false,
                                                    )}
                                                </div>
                                            ))
                                          : // No parent - render current as root node
                                            renderHierarchyNode(currentNode, 0, false)}
                                  </div>
                              );
                          })()}
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
                            className={`px-3 py-1 text-xs font ${
                                currentRequirement?.status === 'approved' ||
                                currentRequirement?.status === 'active'
                                    ? 'bg-[#50C878]/60 text-gray-700 dark:text-gray-300'
                                    : currentRequirement?.status === 'rejected' ||
                                        currentRequirement?.status === 'deleted'
                                      ? 'bg-[#FA5F55]/60 text-gray-700 dark:text-gray-300'
                                      : currentRequirement?.status === 'archived'
                                        ? 'bg-[#FBEC5D]/65 text-gray-700 dark:text-gray-300'
                                        : 'bg-[#FBEC5D]/65 text-gray-700 dark:text-gray-300'
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
                                <span className="px-2 py-1 bg-primary/10 dark:bg-primary/65 text-muted-foreground text-xs font-semibold border border-primary/20">
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
                                                    <span className="px-2 py-0.5 text-xs bg-muted/60 text-gray-600 dark:text-white border">
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
                                            className="ml-2 shrink-0 group hover:bg-transparent focus:bg-transparent"
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
                                            <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
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
                                                    <span className="px-2 py-0.5 text-xs bg-muted/60 text-gray-600 dark:text-white border">
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
                                            className="ml-2 shrink-0 group hover:bg-transparent focus:bg-transparent"
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
                                            <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
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
                        <CardTitle className="text-lg">
                            Test Cases - (Currently Using Mock Data to Show UI Stylings)
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                                <SlidersHorizontal className="h-4 w-4" />
                            </Button>
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
                                            Select a test case to link to this
                                            requirement.
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
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-border/20 hover:bg-transparent">
                                    <TableHead className="h-12 px-6 pl-10 font-semibold text-foreground">
                                        ID
                                    </TableHead>
                                    <TableHead className="h-12 px-6 pl-10 font-semibold text-foreground">
                                        Name
                                    </TableHead>
                                    <TableHead className="h-12 px-6 font-semibold text-foreground">
                                        Requirements
                                    </TableHead>
                                    <TableHead className="h-12 px-6 font-semibold text-foreground">
                                        Status
                                    </TableHead>
                                    <TableHead className="h-12 px-6 font-semibold text-foreground">
                                        Type
                                    </TableHead>
                                    <TableHead className="h-12 px-6 font-semibold text-foreground">
                                        Last Execution
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {MOCK_TEST_CASES.map((testCase) => (
                                    <TableRow
                                        key={testCase.id}
                                        className="border-b border-border/20 hover:bg-muted/60 dark:hover:bg-muted/30 transition-colors duration-150"
                                    >
                                        <TableCell className="px-6 pl-10 py-3.5 whitespace-nowrap font-mono text-base font-semibold tracking-wider text-foreground">
                                            {testCase.id}
                                        </TableCell>
                                        <TableCell className="px-5 pl-10 py-3.5">
                                            <div className="space-y-0.5">
                                                <div className="font-semibold text-sm">
                                                    {testCase.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {testCase.description}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 align-middle">
                                            <div
                                                className="w-full flex flex-col items-center justify-center gap-2"
                                                style={{ marginLeft: '-12px' }}
                                            >
                                                {testCase.requirements.map((req) => (
                                                    <span
                                                        key={req}
                                                        className="px-2 py-0.5 text-xs bg-muted/60 text-gray-600 dark:text-white border"
                                                    >
                                                        {req}
                                                    </span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 text-xs font ${
                                                    testCase.status === 'approved' ||
                                                    testCase.status === 'active'
                                                        ? 'bg-[#50C878]/60 text-gray-700 dark:text-gray-300'
                                                        : testCase.status ===
                                                                'rejected' ||
                                                            testCase.status === 'deleted'
                                                          ? 'bg-[#FA5F55]/60 text-gray-700 dark:text-gray-300'
                                                          : testCase.status === 'archived'
                                                            ? 'bg-[#FBEC5D]/65 text-gray-700 dark:text-gray-300'
                                                            : 'bg-[#FBEC5D]/65 text-gray-700 dark:text-gray-300'
                                                }`}
                                            >
                                                {testCase.status
                                                    ? String(testCase.status)
                                                          .replaceAll('_', ' ')
                                                          .replace(/\b\w/g, (c) =>
                                                              c.toUpperCase(),
                                                          )
                                                    : '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5">
                                            <span className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-500/10 text-gray-700 dark:text-white border border-gray-500/20 rounded-sm">
                                                {testCase.type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5 text-sm text-muted-foreground">
                                            {testCase.lastExecution}
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5">
                                            <AlertDialog
                                                open={
                                                    isDeleteTestCaseDialogOpen &&
                                                    selectedTestCaseToDelete ===
                                                        testCase.id
                                                }
                                                onOpenChange={(open) => {
                                                    setIsDeleteTestCaseDialogOpen(open);
                                                    if (!open)
                                                        setSelectedTestCaseToDelete(null);
                                                }}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 group hover:bg-transparent focus:bg-transparent"
                                                    title="Delete"
                                                    onClick={() => {
                                                        setSelectedTestCaseToDelete(
                                                            testCase.id,
                                                        );
                                                        setIsDeleteTestCaseDialogOpen(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
                                                </Button>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            Delete Linked Test Case
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to
                                                            remove this test case link?
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel
                                                            onClick={() => {
                                                                setIsDeleteTestCaseDialogOpen(
                                                                    false,
                                                                );
                                                                setSelectedTestCaseToDelete(
                                                                    null,
                                                                );
                                                            }}
                                                        >
                                                            Cancel
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            onClick={() => {
                                                                setIsDeleteTestCaseDialogOpen(
                                                                    false,
                                                                );
                                                                setSelectedTestCaseToDelete(
                                                                    null,
                                                                );
                                                            }}
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Test Case Results Section */}
            <Card className="border border-border">
                <CardHeader className="py-4">
                    <CardTitle className="text-lg">
                        Test Case Results - (Currently Using Mock Data to Show UI
                        Stylings)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-border/20 hover:bg-transparent">
                                    <TableHead className="h-12 px-6 pl-10 font-semibold text-foreground">
                                        Execution ID
                                    </TableHead>
                                    <TableHead className="h-12 px-6 font-semibold text-foreground">
                                        Test Case
                                    </TableHead>
                                    <TableHead className="h-12 px-6 font-semibold text-foreground">
                                        Result
                                    </TableHead>
                                    <TableHead className="h-12 px-6 font-semibold text-foreground">
                                        Date
                                    </TableHead>
                                    <TableHead className="h-12 px-6 font-semibold text-foreground">
                                        Duration
                                    </TableHead>
                                    <TableHead className="h-12 px-6 font-semibold text-foreground">
                                        Assignee
                                    </TableHead>
                                    <TableHead className="h-12 px-6 font-semibold text-foreground">
                                        Links
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {MOCK_TEST_CASE_RESULTS.map((result) => (
                                    <TableRow
                                        key={result.executionId}
                                        className="border-b border-border/20 hover:bg-muted/60 dark:hover:bg-muted/30 transition-colors duration-150"
                                    >
                                        <TableCell className="px-6 pl-10 py-3.5 font-mono text-base font-semibold tracking-wider text-foreground">
                                            {result.executionId}
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5">
                                            <span className="px-2 py-0.5 text-xs bg-muted/60 text-gray-700 dark:text-gray-300 border">
                                                {result.testCaseId}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5">
                                            {result.result === 'passed' ? (
                                                <span className="inline-flex items-center px-2 py-0.5 text-xs font bg-[#50C878]/60 text-gray-700 dark:text-gray-300">
                                                    Passed
                                                </span>
                                            ) : result.result === 'failed' ? (
                                                <span className="inline-flex items-center px-2 py-0.5 text-xs font bg-[#FA5F55]/60 text-gray-700 dark:text-gray-300">
                                                    Failed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 text-xs font bg-[#FA5F55]/60 text-gray-700 dark:text-gray-300">
                                                    Blocked
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5 text-sm text-muted-foreground">
                                            {result.date}
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5 text-sm text-muted-foreground">
                                            {result.duration}
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5 text-sm text-muted-foreground">
                                            {result.tester || '—'}
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5">
                                            {result.links && result.links.length > 0 ? (
                                                <Dialog
                                                    open={
                                                        isLinksDialogOpen &&
                                                        selectedResultLinks ===
                                                            result.links
                                                    }
                                                    onOpenChange={(open) => {
                                                        setIsLinksDialogOpen(open);
                                                        if (!open)
                                                            setSelectedResultLinks([]);
                                                    }}
                                                >
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-transparent focus:bg-transparent active:bg-transparent"
                                                            title="View Links"
                                                            onClick={() => {
                                                                setSelectedResultLinks(
                                                                    result.links,
                                                                );
                                                                setIsLinksDialogOpen(
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            <Link2 className="h-4 w-4 text-blue-400 dark:text-blue-300" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[500px]">
                                                        <DialogHeader>
                                                            <DialogTitle>
                                                                Manage Links
                                                            </DialogTitle>
                                                            <DialogDescription>
                                                                View or add links for this
                                                                test result.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid gap-4 py-4">
                                                            <div className="space-y-2">
                                                                <h4 className="font-medium">
                                                                    Existing Links
                                                                </h4>
                                                                {result.links.length >
                                                                0 ? (
                                                                    <div className="max-h-[200px] overflow-y-auto space-y-2">
                                                                        {result.links.map(
                                                                            (
                                                                                link,
                                                                                index,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        index
                                                                                    }
                                                                                    className="text-sm p-2 bg-muted/50 rounded border"
                                                                                >
                                                                                    •{' '}
                                                                                    {link}
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm text-muted-foreground">
                                                                        No links added
                                                                        yet.
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="space-y-2">
                                                                <h4 className="font-medium">
                                                                    Add New Link
                                                                </h4>
                                                                <Input placeholder="Paste link URL..." />
                                                                <Button
                                                                    variant="outline"
                                                                    className="w-full"
                                                                >
                                                                    Add Link
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">
                                                    No links
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5">
                                            <AlertDialog
                                                open={
                                                    isDeleteResultDialogOpen &&
                                                    selectedResultToDelete ===
                                                        result.executionId
                                                }
                                                onOpenChange={(open) => {
                                                    setIsDeleteResultDialogOpen(open);
                                                    if (!open)
                                                        setSelectedResultToDelete(null);
                                                }}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 group hover:bg-transparent focus:bg-transparent"
                                                    title="Delete"
                                                    onClick={() => {
                                                        setSelectedResultToDelete(
                                                            result.executionId,
                                                        );
                                                        setIsDeleteResultDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
                                                </Button>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            Delete Test Case Result
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to
                                                            delete this result? This
                                                            action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel
                                                            onClick={() => {
                                                                setIsDeleteResultDialogOpen(
                                                                    false,
                                                                );
                                                                setSelectedResultToDelete(
                                                                    null,
                                                                );
                                                            }}
                                                        >
                                                            Cancel
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            onClick={() => {
                                                                setIsDeleteResultDialogOpen(
                                                                    false,
                                                                );
                                                                setSelectedResultToDelete(
                                                                    null,
                                                                );
                                                            }}
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
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
                                                refetchAncestorRequirements(),
                                                refetchDescendantRequirements(),
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
