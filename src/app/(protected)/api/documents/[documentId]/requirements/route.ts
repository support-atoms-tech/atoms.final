import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

/**
 * GET /api/documents/[documentId]/requirements
 *
 * Fetches requirements for a specific document.
 * Uses service role client to bypass RLS policy issues.
 *
 * Query params:
 * - blockId (optional): Filter to requirements for a specific block
 */
export async function GET(
    request: Request,
    context: { params: Promise<{ documentId: string }> },
) {
    try {
        const { documentId } = await context.params;
        const { searchParams } = new URL(request.url);
        const blockId = searchParams.get('blockId');

        if (!documentId) {
            return NextResponse.json(
                { error: 'Document ID is required' },
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

        // First, get the document to find its project_id
        const { data: document, error: documentError } = await supabase
            .from('documents')
            .select('id, project_id')
            .eq('id', documentId)
            .single();

        if (documentError || !document) {
            return NextResponse.json(
                { error: 'Document not found', details: documentError?.message },
                { status: 404 },
            );
        }

        // Verify membership in the project (active member)
        const { data: membership, error: membershipError } = await supabase
            .from('project_members')
            .select('role, org_id')
            .eq('project_id', document.project_id)
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .maybeSingle();

        if (membershipError) {
            return NextResponse.json(
                {
                    error: 'Failed to verify project membership',
                    details: membershipError.message,
                },
                { status: 500 },
            );
        }

        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Query requirements for this document (optionally filtered by blockId)
        let query = supabase
            .from('requirements')
            .select('*')
            .eq('document_id', documentId)
            .eq('is_deleted', false);

        // Add optional block filter
        if (blockId) {
            query = query.eq('block_id', blockId);
        }

        const { data: requirements, error } = await query.order('position', {
            ascending: true,
        });

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch requirements', details: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({ requirements: requirements || [] });
    } catch (error) {
        console.error('Document requirements API error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch document requirements',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
