import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

/**
 * DELETE /api/organizations/[orgId]/members/[memberId]
 *
 * Removes a member from an organization.
 * Uses service role to bypass RLS.
 */
export async function DELETE(
    _request: NextRequest,
    context: { params: Promise<{ orgId: string; memberId: string }> },
) {
    try {
        const { orgId, memberId } = await context.params;

        if (!orgId || !memberId) {
            return NextResponse.json(
                { error: 'Organization ID and Member ID are required' },
                { status: 400 },
            );
        }

        const { user } = await withAuth();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const profile = await getOrCreateProfileForWorkOSUser(user);
        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not provisioned' },
                { status: 409 },
            );
        }

        const supabase = getSupabaseServiceRoleClient();
        if (!supabase) {
            return NextResponse.json(
                { error: 'Supabase service client unavailable' },
                { status: 500 },
            );
        }

        // Check that the requesting user is a member of the organization
        const { data: requesterMembership, error: requesterError } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', orgId)
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .maybeSingle();

        if (requesterError) {
            console.error('Error checking requester membership:', requesterError);
            return NextResponse.json(
                { error: 'Failed to verify membership' },
                { status: 500 },
            );
        }

        if (!requesterMembership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check that requester has permission to remove members (must be owner or admin)
        if (
            requesterMembership.role !== 'owner' &&
            requesterMembership.role !== 'admin'
        ) {
            return NextResponse.json(
                { error: 'Insufficient permissions to remove members' },
                { status: 403 },
            );
        }

        // Check that the target member exists and is in the organization
        const { data: targetMember, error: targetError } = await supabase
            .from('organization_members')
            .select('id, role')
            .eq('organization_id', orgId)
            .eq('user_id', memberId)
            .eq('status', 'active')
            .maybeSingle();

        if (targetError) {
            console.error('Error checking target membership:', targetError);
            return NextResponse.json(
                { error: 'Failed to verify target membership' },
                { status: 500 },
            );
        }

        if (!targetMember) {
            return NextResponse.json(
                { error: 'Member not found in organization' },
                { status: 404 },
            );
        }

        // Prevent removing the last owner
        if (targetMember.role === 'owner') {
            const { count } = await supabase
                .from('organization_members')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', orgId)
                .eq('role', 'owner')
                .eq('status', 'active');

            if (count === 1) {
                return NextResponse.json(
                    { error: 'Cannot remove the last owner' },
                    { status: 400 },
                );
            }
        }

        // Find all projects in this organization
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id, name')
            .eq('organization_id', orgId)
            .eq('is_deleted', false);

        if (projectsError) {
            console.error('Error fetching organization projects:', projectsError);
            return NextResponse.json(
                { error: 'Failed to fetch organization projects' },
                { status: 500 },
            );
        }

        // Deactivate project memberships for all projects in this organization
        if (projects && projects.length > 0) {
            const projectIds = projects.map((p) => p.id);

            // Find all active project memberships for this user in these projects
            const { data: projectMemberships, error: pmError } = await supabase
                .from('project_members')
                .select('id, project_id, role')
                .in('project_id', projectIds)
                .eq('user_id', memberId)
                .eq('status', 'active');

            if (pmError) {
                console.error('Error fetching project memberships:', pmError);
                return NextResponse.json(
                    { error: 'Failed to fetch project memberships' },
                    { status: 500 },
                );
            }

            // Get the organization owner to transfer ownership if needed
            const { data: orgOwner, error: orgOwnerError } = await supabase
                .from('organization_members')
                .select('user_id')
                .eq('organization_id', orgId)
                .eq('role', 'owner')
                .eq('status', 'active')
                .limit(1)
                .maybeSingle();

            if (orgOwnerError) {
                console.error('Error fetching organization owner:', orgOwnerError);
                return NextResponse.json(
                    { error: 'Failed to fetch organization owner' },
                    { status: 500 },
                );
            }

            if (!orgOwner) {
                return NextResponse.json(
                    { error: 'Organization has no owner' },
                    { status: 500 },
                );
            }

            // Process each project membership
            if (projectMemberships && projectMemberships.length > 0) {
                for (const pm of projectMemberships) {
                    if (pm.role === 'owner') {
                        // Check if this user is the last owner of this project
                        const { count: ownerCount } = await supabase
                            .from('project_members')
                            .select('*', { count: 'exact', head: true })
                            .eq('project_id', pm.project_id)
                            .eq('role', 'owner')
                            .eq('status', 'active');

                        if (ownerCount === 1) {
                            // User is the last owner - transfer ownership to org owner
                            // First, check if org owner is already a member of this project
                            const { data: orgOwnerMembership, error: checkError } =
                                await supabase
                                    .from('project_members')
                                    .select('id, role')
                                    .eq('project_id', pm.project_id)
                                    .eq('user_id', orgOwner.user_id)
                                    .maybeSingle();

                            if (checkError && checkError.code !== 'PGRST116') {
                                console.error(
                                    'Error checking org owner membership:',
                                    checkError,
                                );
                                return NextResponse.json(
                                    { error: 'Failed to check org owner membership' },
                                    { status: 500 },
                                );
                            }

                            if (orgOwnerMembership) {
                                // Org owner is already a member - promote to owner
                                const { error: promoteError } = await supabase
                                    .from('project_members')
                                    .update({ role: 'owner' })
                                    .eq('id', orgOwnerMembership.id);

                                if (promoteError) {
                                    console.error(
                                        'Error promoting org owner to project owner:',
                                        promoteError,
                                    );
                                    return NextResponse.json(
                                        { error: 'Failed to transfer project ownership' },
                                        { status: 500 },
                                    );
                                }
                            } else {
                                // Org owner is not a member - add them as owner
                                const { error: addOwnerError } = await supabase
                                    .from('project_members')
                                    .insert({
                                        project_id: pm.project_id,
                                        user_id: orgOwner.user_id,
                                        role: 'owner',
                                        org_id: orgId,
                                        status: 'active',
                                    });

                                if (addOwnerError) {
                                    console.error(
                                        'Error adding org owner as project owner:',
                                        addOwnerError,
                                    );
                                    return NextResponse.json(
                                        { error: 'Failed to transfer project ownership' },
                                        { status: 500 },
                                    );
                                }
                            }

                            // Demote the current owner to viewer
                            const { error: demoteError } = await supabase
                                .from('project_members')
                                .update({ role: 'viewer' })
                                .eq('id', pm.id);

                            if (demoteError) {
                                console.error(
                                    'Error demoting project owner:',
                                    demoteError,
                                );
                                return NextResponse.json(
                                    { error: 'Failed to demote project owner' },
                                    { status: 500 },
                                );
                            }
                        }
                    }

                    // Deactivate the project membership
                    const { error: deactivateError } = await supabase
                        .from('project_members')
                        .update({ status: 'inactive' })
                        .eq('id', pm.id);

                    if (deactivateError) {
                        console.error(
                            `Error deactivating project membership ${pm.id}:`,
                            deactivateError,
                        );
                        return NextResponse.json(
                            { error: 'Failed to deactivate project memberships' },
                            { status: 500 },
                        );
                    }
                }
            }
        }

        // Remove the member from the organization
        const { error: deleteError } = await supabase
            .from('organization_members')
            .delete()
            .eq('organization_id', orgId)
            .eq('user_id', memberId);

        if (deleteError) {
            console.error('Error removing member:', deleteError);
            return NextResponse.json(
                { error: 'Failed to remove member' },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Organization member removal API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
