import { redirect } from 'next/navigation';

import { getAuthorizationUrl } from '@/lib/workos/workosAuth';

/**
 * Google OAuth initiation route
 * Redirects to WorkOS Google OAuth flow
 */
export async function GET(_request: Request) {
    try {
        const authUrl = await getAuthorizationUrl('google');

        if (!authUrl) {
            throw new Error('Failed to generate authorization URL');
        }

        return redirect(authUrl);
    } catch (error) {
        console.error('Google OAuth error:', error);
        return redirect('/login?error=Could not authenticate with Google');
    }
}
