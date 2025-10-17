import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/supabaseServer';

/**
 * GET /api/auth/profile/[userId]
 *
 * Returns the user profile from the database
 * Called by useAuth hook after session is verified
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> },
) {
    try {
        const { userId } = await params;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 },
            );
        }

        // Query database for profile
        const supabase = await createClient();

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !profile) {
            console.error('Profile fetch error:', error);
            return NextResponse.json(
                { error: 'Profile not found' },
                { status: 404 },
            );
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error('Profile API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: 500 },
        );
    }
}
