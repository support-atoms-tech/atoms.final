import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

/**
 * PATCH /api/organizations/[orgId]/members/[memberId]/role
 *
 * Updates the role of an organization member.
 * Uses service role to bypass RLS.
 */
export async function PATCH(
    request: NextRequest,
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

        const body = await request.json();
        const { role } = body;

        if (!role) {
            return NextResponse.json({ error: 'Role is required' }, { status: 400 });
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

        // Check that requester has permission to change roles (must be owner or admin)
        if (
            requesterMembership.role !== 'owner' &&
            requesterMembership.role !== 'admin'
        ) {
            return NextResponse.json(
                { error: 'Insufficient permissions to change roles' },
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

        // Prevent changing owner role (only owner can change owner, and only to admin)
        if (targetMember.role === 'owner' && requesterMembership.role !== 'owner') {
            return NextResponse.json(
                { error: 'Only the owner can change the owner role' },
                { status: 403 },
            );
        }

        // Prevent removing the last owner
        if (targetMember.role === 'owner' && role !== 'owner') {
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

        // Update the role
        const { error: updateError } = await supabase
            .from('organization_members')
            .update({ role })
            .eq('organization_id', orgId)
            .eq('user_id', memberId);

        if (updateError) {
            console.error('Error updating member role:', updateError);
            return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
        }

        return NextResponse.json({ success: true, role });
    } catch (error) {
        console.error('Organization member role update API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
