import { redirect } from 'next/navigation';

import { getAuthorizationUrl } from '@/lib/workos/workosAuth';

/**
 * GitHub OAuth initiation route
 * Redirects to WorkOS GitHub OAuth flow
 */
export async function GET(_request: Request) {
    try {
        const authUrl = await getAuthorizationUrl('github');

        if (!authUrl) {
            throw new Error('Failed to generate authorization URL');
        }

        return redirect(authUrl);
    } catch (error) {
        console.error('GitHub OAuth error:', error);
        return redirect('/login?error=Could not authenticate with GitHub');
    }
}
