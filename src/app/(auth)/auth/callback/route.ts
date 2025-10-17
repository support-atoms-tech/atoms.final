import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { authenticateWithCode } from '@/lib/workos/workosAuth';

/**
 * OAuth callback route for WorkOS
 * Handles the redirect from WorkOS after user authenticates
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const _state = searchParams.get('state');
    const next = searchParams.get('next') || '/home';
    const cookieStore = await cookies();

    if (!code) {
        console.error('Missing authorization code');
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    try {
        // Exchange code for user and session tokens
        const authResponse = await authenticateWithCode(code);

        if (!authResponse.user) {
            console.error('No user returned from WorkOS');
            return NextResponse.redirect(`${origin}/auth/auth-code-error`);
        }

        const workosUserId = authResponse.user.id;

        // Set user ID cookie for session management
        cookieStore.set('user_id', workosUserId);

        // Optional: Set access token if provided
        if (authResponse.accessToken) {
            cookieStore.set('workos_access_token', authResponse.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 7 days
            });
        }

        revalidatePath('/', 'layout');

        const forwardedHost = request.headers.get('x-forwarded-host');
        const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
        const isLocalEnv = process.env.NODE_ENV === 'development';

        // For local development, use origin directly
        if (isLocalEnv) {
            return NextResponse.redirect(`${origin}${next}`);
        }

        // For production, prefer x-forwarded-host when available
        const baseUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin;

        return NextResponse.redirect(`${baseUrl}${next}`);
    } catch (error) {
        console.error('OAuth callback error:', error);
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }
}
