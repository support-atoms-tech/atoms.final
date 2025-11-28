import { randomUUID } from 'crypto';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';
import { InvitationStatus } from '@/types/base/enums.types';

/**
 * POST /api/organizations/[orgId]/invitations
 *
 * Creates a new organization invitation.
 * Uses service role to bypass RLS.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ orgId: string }> },
) {
    try {
        const { orgId } = await context.params;

        if (!orgId) {
            return NextResponse.json(
                { error: 'Organization ID is required' },
                { status: 400 },
            );
        }

        const body = await request.json();
        const { email, role = 'member' } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
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

        // Check that requester has permission to invite members (must be owner or admin)
        if (
            requesterMembership.role !== 'owner' &&
            requesterMembership.role !== 'admin'
        ) {
            return NextResponse.json(
                { error: 'Insufficient permissions to invite members' },
                { status: 403 },
            );
        }

        // Check if email exists in profiles (if user exists, check their membership)
        const { data: targetProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email.trim())
            .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error checking email in profiles:', profileError);
            return NextResponse.json({ error: 'Failed to check email' }, { status: 500 });
        }

        // If user exists, check if they're already a member
        if (targetProfile) {
            const { data: existingMembership, error: existingError } = await supabase
                .from('organization_members')
                .select('id')
                .eq('organization_id', orgId)
                .eq('user_id', targetProfile.id)
                .eq('status', 'active')
                .maybeSingle();

            if (existingError && existingError.code !== 'PGRST116') {
                console.error('Error checking existing membership:', existingError);
                return NextResponse.json(
                    { error: 'Failed to check existing membership' },
                    { status: 500 },
                );
            }

            if (existingMembership) {
                return NextResponse.json(
                    { error: 'User is already a member of this organization' },
                    { status: 409 },
                );
            }
        }

        // Check for duplicate pending invitations
        const { data: duplicateInvitations, error: duplicateError } = await supabase
            .from('organization_invitations')
            .select('id')
            .eq('email', email.trim())
            .eq('organization_id', orgId)
            .eq('status', InvitationStatus.pending);

        if (duplicateError) {
            console.error('Error checking for duplicate invitations:', duplicateError);
            return NextResponse.json(
                { error: 'Failed to check for duplicate invitations' },
                { status: 500 },
            );
        }

        if (duplicateInvitations && duplicateInvitations.length > 0) {
            return NextResponse.json(
                {
                    error: 'An invitation has already been sent to this email for this organization.',
                },
                { status: 409 },
            );
        }

        // Generate invitation token (UUID format)
        const token = randomUUID();

        // Set expiration to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create the invitation
        const { data: newInvitation, error: insertError } = await supabase
            .from('organization_invitations')
            .insert({
                email: email.trim(),
                organization_id: orgId,
                role,
                status: InvitationStatus.pending,
                token,
                expires_at: expiresAt.toISOString(),
                created_by: profile.id,
                updated_by: profile.id,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating invitation:', insertError);
            return NextResponse.json(
                { error: 'Failed to create invitation' },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true, invitation: newInvitation });
    } catch (error) {
        console.error('Create invitation API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
