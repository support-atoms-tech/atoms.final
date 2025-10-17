import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

/**
 * GET /auth/login
 *
 * Initiates the AuthKit authentication flow by generating a sign-in URL
 * and redirecting the user to WorkOS AuthKit.
 *
 * This endpoint:
 * 1. Generates the sign-in URL
 * 2. Redirects to WorkOS AuthKit
 * 3. User authenticates with email/password or OAuth
 * 4. WorkOS redirects back to /auth/callback with an authorization code
 */
export async function GET(_request: Request) {
    try {
        const authUrl = await getSignInUrl();

        if (!authUrl) {
            throw new Error('Failed to generate sign-in URL');
        }

        return redirect(authUrl);
    } catch (error) {
        console.error('Error generating sign-in URL:', error);
        return redirect('/');
    }
}
