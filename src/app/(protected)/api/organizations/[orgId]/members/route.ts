import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

/**
 * GET /api/organizations/[orgId]/members
 *
 * Returns all members of an organization with their profiles and roles.
 * Uses service role to bypass RLS and ensure all members are returned.
 */
export async function GET(
    _request: NextRequest,
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

        // Check that user is a member of the organization
        const { data: membership, error: membershipError } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', orgId)
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .maybeSingle();

        if (membershipError) {
            console.error('Error checking membership:', membershipError);
            return NextResponse.json(
                { error: 'Failed to verify membership' },
                { status: 500 },
            );
        }

        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all members of the organization
        const { data: members, error: membersError } = await supabase
            .from('organization_members')
            .select('user_id, role')
            .eq('organization_id', orgId)
            .eq('status', 'active')
            .eq('is_deleted', false);

        if (membersError) {
            console.error('Error fetching organization members:', membersError);
            return NextResponse.json(
                { error: 'Failed to fetch members' },
                { status: 500 },
            );
        }

        if (!members || members.length === 0) {
            return NextResponse.json({ members: [] });
        }

        // Extract user IDs
        const userIds = members.map((member) => member.user_id);

        // Fetch profiles for the user IDs
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            return NextResponse.json(
                { error: 'Failed to fetch profiles' },
                { status: 500 },
            );
        }

        // Create a map of user_id to role
        const roleMap = members.reduce(
            (acc, member) => {
                acc[member.user_id] = member.role;
                return acc;
            },
            {} as Record<string, string>,
        );

        // Transform the data to match the expected format
        const formattedMembers = (profiles || []).map((profile) => ({
            ...profile,
            role: roleMap[profile.id] || 'member',
        }));

        return NextResponse.json({ members: formattedMembers });
    } catch (error) {
        console.error('Organization members API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
