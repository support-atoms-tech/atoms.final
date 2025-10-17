import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/signout
 *
 * Sign out the current user by clearing session cookies
 */
export async function POST(_request: NextRequest) {
    try {
        const cookieStore = await cookies();

        // Clear WorkOS session
        cookieStore.set('workos_session', '', {
            maxAge: 0,
            path: '/',
        });

        // Clear user ID cookie
        cookieStore.set('user_id', '', {
            maxAge: 0,
            path: '/',
        });

        // Clear WorkOS access token
        cookieStore.set('workos_access_token', '', {
            maxAge: 0,
            path: '/',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Signout error:', error);
        return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 });
    }
}
