import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

/**
 * GET /api/projects/[projectId]/members
 *
 * Returns all members of a project with their profiles and roles.
 * Uses service role to bypass RLS and ensure all members are returned.
 */
export async function GET(
    _request: NextRequest,
    context: { params: Promise<{ projectId: string }> },
) {
    try {
        const { projectId } = await context.params;

        if (!projectId) {
            return NextResponse.json(
                { error: 'Project ID is required' },
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

        // Check that user is a member of the project
        const { data: membership, error: membershipError } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', projectId)
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

        // Fetch all members of the project
        const { data: members, error: membersError } = await supabase
            .from('project_members')
            .select('user_id, role')
            .eq('project_id', projectId)
            .eq('status', 'active');

        if (membersError) {
            console.error('Error fetching project members:', membersError);
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
            role: roleMap[profile.id] || 'viewer',
        }));

        return NextResponse.json({ members: formattedMembers });
    } catch (error) {
        console.error('Project members API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/projects/[projectId]/members
 *
 * Adds a member to a project.
 * Uses service role to bypass RLS.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ projectId: string }> },
) {
    try {
        const { projectId } = await context.params;

        if (!projectId) {
            return NextResponse.json(
                { error: 'Project ID is required' },
                { status: 400 },
            );
        }

        const body = await request.json();
        const { email, role, orgId } = body;

        if (!email || !role || !orgId) {
            return NextResponse.json(
                { error: 'Email, role, and orgId are required' },
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

        // Check that the requesting user is a member of the project
        const { data: requesterMembership, error: requesterError } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', projectId)
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

        // Check that requester has permission to add members (must be owner or editor)
        if (
            requesterMembership.role !== 'owner' &&
            requesterMembership.role !== 'editor'
        ) {
            return NextResponse.json(
                { error: 'Insufficient permissions to add members' },
                { status: 403 },
            );
        }

        // Find the user by email
        const { data: targetProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email.trim())
            .maybeSingle();

        if (profileError) {
            console.error('Error finding user by email:', profileError);
            return NextResponse.json({ error: 'Failed to find user' }, { status: 500 });
        }

        if (!targetProfile) {
            return NextResponse.json(
                { error: 'User not found. Please ask them to sign up first.' },
                { status: 404 },
            );
        }

        // Check if user is already a project member
        const { data: existingMember, error: existingError } = await supabase
            .from('project_members')
            .select('id')
            .eq('project_id', projectId)
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

        if (existingMember) {
            return NextResponse.json(
                { error: 'User is already a member of this project' },
                { status: 409 },
            );
        }

        // Check that user is a member of the organization
        const { data: orgMembership, error: orgError } = await supabase
            .from('organization_members')
            .select('id')
            .eq('organization_id', orgId)
            .eq('user_id', targetProfile.id)
            .eq('status', 'active')
            .maybeSingle();

        if (orgError && orgError.code !== 'PGRST116') {
            console.error('Error checking organization membership:', orgError);
            return NextResponse.json(
                { error: 'Failed to verify organization membership' },
                { status: 500 },
            );
        }

        if (!orgMembership) {
            return NextResponse.json(
                { error: 'User is not a member of this organization' },
                { status: 403 },
            );
        }

        // Add user to project
        const { data: newMember, error: insertError } = await supabase
            .from('project_members')
            .insert({
                user_id: targetProfile.id,
                project_id: projectId,
                role,
                org_id: orgId,
                status: 'active',
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error adding project member:', insertError);
            return NextResponse.json(
                { error: 'Failed to add member to project' },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true, member: newMember });
    } catch (error) {
        console.error('Add project member API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
