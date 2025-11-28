'use client';

import type { RealtimeChannel } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowBigDownIcon, Filter, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useOrgMemberRole } from '@/hooks/queries/useOrgMember';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import {
    ORGANIZATION_ROLE_ARRAY,
    OrganizationRole,
    hasOrganizationPermission,
} from '@/lib/auth/permissions';
import { useUser } from '@/lib/providers/user.provider';

export default function OrgMembers() {
    const params = useParams<{ orgId: string }>();
    const { user } = useUser();
    const { toast, dismiss } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilters, setRoleFilters] = useState<OrganizationRole[]>([]);
    const { supabase, isLoading: authLoading } = useAuthenticatedSupabase();

    const { data: userRoleQuery } = useOrgMemberRole(params.orgId, user?.id || '');
    const userRole: OrganizationRole | null = userRoleQuery ?? null;

    const queryClient = useQueryClient();
    const subscriptionRef = useRef<RealtimeChannel | null>(null);

    const {
        data: members = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ['organization-members', params?.orgId || ''],
        queryFn: async () => {
            if (!params?.orgId) return [];
            const response = await fetch(`/api/organizations/${params.orgId}/members`, {
                method: 'GET',
                cache: 'no-store',
            });
            if (!response.ok) {
                throw new Error('Failed to fetch organization members');
            }
            const data = await response.json();
            return data.members || [];
        },
        enabled: !!params?.orgId && !authLoading,
    });

    // Subscribe to realtime changes for organization members
    useEffect(() => {
        if (!supabase || !params?.orgId || authLoading) {
            return;
        }

        const channel = supabase
            .channel(`organization-members:${params.orgId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'organization_members',
                    filter: `organization_id=eq.${params.orgId}`,
                },
                (payload) => {
                    console.log(
                        '[OrgMembers] Realtime change detected:',
                        payload.eventType,
                        payload,
                    );
                    // Invalidate and refetch when any change occurs (INSERT, UPDATE, DELETE)
                    queryClient.invalidateQueries({
                        queryKey: ['organization-members', params.orgId],
                    });
                },
            )
            .subscribe((status) => {
                console.log('[OrgMembers] Realtime subscription status:', status);
            });

        subscriptionRef.current = channel;

        return () => {
            channel.unsubscribe();
            subscriptionRef.current = null;
        };
    }, [supabase, params?.orgId, authLoading, queryClient]);

    const handleRemoveMember = async (memberId: string) => {
        if (!hasOrganizationPermission(userRole, 'removeMember')) {
            toast({
                title: 'Error',
                description: 'You do not have permission to remove members.',
                variant: 'destructive',
            });
            return;
        }

        if (!params?.orgId) {
            toast({
                title: 'Error',
                description: 'Organization ID is required.',
                variant: 'destructive',
            });
            return;
        }

        try {
            const response = await fetch(
                `/api/organizations/${params.orgId}/members/${memberId}`,
                {
                    method: 'DELETE',
                    cache: 'no-store',
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to remove member');
            }

            // Update member count via API
            await fetch(`/api/organizations/${params.orgId}/update-member-count`, {
                method: 'POST',
                cache: 'no-store',
            });

            toast({
                title: 'Success',
                description: 'Member removed successfully!',
                variant: 'default',
            });

            // Auto-dismiss the toast after 5 seconds
            setTimeout(() => {
                dismiss();
            }, 5000);

            refetch();
        } catch (error) {
            console.error('Error removing member:', error);
            toast({
                title: 'Error',
                description:
                    error instanceof Error ? error.message : 'Failed to remove member.',
                variant: 'destructive',
            });
        }
    };

    const handleChangeRole = async (memberId: string, selectedRole: OrganizationRole) => {
        if (!hasOrganizationPermission(userRole, 'changeRole')) {
            toast({
                title: 'Error',
                description: 'You do not have permission to change roles.',
                variant: 'destructive',
            });
            return;
        }

        if (!memberId || !params?.orgId || !selectedRole) {
            toast({
                title: 'Error',
                description: 'Invalid operation. Please select a role.',
                variant: 'destructive',
            });
            return;
        }

        try {
            const response = await fetch(
                `/api/organizations/${params.orgId}/members/${memberId}/role`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ role: selectedRole }),
                    cache: 'no-store',
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update role');
            }

            toast({
                title: 'Success',
                description: `Role updated to ${selectedRole} successfully!`,
                variant: 'default',
            });

            // Auto-dismiss the toast after 5 seconds
            setTimeout(() => {
                dismiss();
            }, 5000);

            refetch();
        } catch (error) {
            console.error('Error changing role:', error);
            toast({
                title: 'Error',
                description: 'Failed to change role. Please try again.',
                variant: 'destructive',
            });
        }
    };

    // Ensure the current user is always at the top of the member list
    const sortedMembers = [...members].sort((a, b) => {
        if (a.id === user?.id) return -1;
        if (b.id === user?.id) return 1;
        if (a.role === 'owner') return -1;
        if (b.role === 'owner') return 1;
        return 0;
    });

    // Filter and search functionality
    const filteredMembers = sortedMembers.filter((member) => {
        const matchesSearch =
            member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRoles =
            roleFilters.length === 0 ||
            roleFilters.includes(member.role as OrganizationRole);
        return matchesSearch && matchesRoles;
    });

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4 pb-2">
                <div>
                    <CardTitle className="text-xl">Members</CardTitle>
                    <CardDescription>Manage organization members</CardDescription>
                </div>
                <div className="flex w-full md:w-auto space-x-2 pb-3">
                    <Input
                        type="text"
                        placeholder="Search by name or email"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-64"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="default" className="w-9 h-9">
                                <Filter className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {ORGANIZATION_ROLE_ARRAY.map((role) => (
                                <DropdownMenuItem
                                    key={role}
                                    onSelect={(e) => e.preventDefault()}
                                    onClick={() =>
                                        setRoleFilters((prev) =>
                                            prev.includes(role as OrganizationRole)
                                                ? prev.filter((r) => r !== role)
                                                : [...prev, role as OrganizationRole],
                                        )
                                    }
                                >
                                    <span
                                        className={`mr-2 inline-block w-4 h-4 rounded-full ${
                                            roleFilters.includes(role as OrganizationRole)
                                                ? 'bg-primary'
                                                : 'bg-gray-200'
                                        }`}
                                    ></span>
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between animate-pulse"
                            >
                                <div className="flex items-center gap-3 mr-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                    <div className="space-y-1">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                                    </div>
                                </div>
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredMembers.length > 0 ? (
                    <div className="space-y-3">
                        {filteredMembers.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3 mr-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Users className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                            {member.full_name || 'User'}
                                            {member.id === user?.id && ' (you)'}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {member.email}
                                        </div>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                                member.role === 'owner'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : member.role === 'admin'
                                                      ? 'bg-blue-100 text-blue-800'
                                                      : 'bg-green-100 text-green-800'
                                            } ${member.id === user?.id || !hasOrganizationPermission(userRole, 'changeRole') ? 'pointer-events-none' : ''}`}
                                        >
                                            {member.id === user?.id ||
                                            !hasOrganizationPermission(
                                                userRole,
                                                'changeRole',
                                            ) ? (
                                                member.role
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {member.role}
                                                    <ArrowBigDownIcon className="h-4 w-4" />
                                                </div>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {['member', 'admin'].map((role) => (
                                            <DropdownMenuItem
                                                key={role}
                                                onClick={() => {
                                                    handleChangeRole(
                                                        member.id,
                                                        role as OrganizationRole,
                                                    );
                                                }}
                                            >
                                                {role.charAt(0).toUpperCase() +
                                                    role.slice(1)}
                                            </DropdownMenuItem>
                                        ))}
                                        {hasOrganizationPermission(
                                            userRole,
                                            'removeMember',
                                        ) && (
                                            <>
                                                <hr></hr>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleRemoveMember(member.id)
                                                    }
                                                    className="text-red-600"
                                                >
                                                    Remove
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <Users className="h-8 w-8 mx-auto text-muted-foreground" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                            No members found
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Invite members to collaborate
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
