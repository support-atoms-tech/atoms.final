import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

/**
 * PATCH /api/organizations/[orgId]/invitations/[invitationId]
 *
 * Updates an organization invitation (e.g., revoke).
 * Uses service role to bypass RLS.
 */
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ orgId: string; invitationId: string }> },
) {
    try {
        const { orgId, invitationId } = await context.params;

        if (!orgId || !invitationId) {
            return NextResponse.json(
                { error: 'Organization ID and Invitation ID are required' },
                { status: 400 },
            );
        }

        const body = await request.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
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

        // Check that requester has permission to manage invitations (must be owner or admin)
        if (
            requesterMembership.role !== 'owner' &&
            requesterMembership.role !== 'admin'
        ) {
            return NextResponse.json(
                { error: 'Insufficient permissions to manage invitations' },
                { status: 403 },
            );
        }

        // Check that the invitation exists and belongs to this organization
        const { data: invitation, error: invitationError } = await supabase
            .from('organization_invitations')
            .select('id, organization_id')
            .eq('id', invitationId)
            .eq('organization_id', orgId)
            .maybeSingle();

        if (invitationError) {
            console.error('Error fetching invitation:', invitationError);
            return NextResponse.json(
                { error: 'Failed to fetch invitation' },
                { status: 500 },
            );
        }

        if (!invitation) {
            return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
        }

        // Update the invitation status
        const { data: updatedInvitation, error: updateError } = await supabase
            .from('organization_invitations')
            .update({
                status,
                updated_by: profile.id,
            })
            .eq('id', invitationId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating invitation:', updateError);
            return NextResponse.json(
                { error: 'Failed to update invitation' },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true, invitation: updatedInvitation });
    } catch (error) {
        console.error('Update invitation API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
