'use server';

import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

/**
 * Redirect user to WorkOS sign-in URL
 * The form submission triggers this server action, which redirects to WorkOS
 * for secure authentication handling
 */
export async function login(_formData: FormData) {
    try {
        const signInUrl = await getSignInUrl();

        if (!signInUrl) {
            return {
                error: 'Failed to initialize sign in',
                success: false,
            };
        }

        redirect(signInUrl);
    } catch (error) {
        // Rethrow Next.js redirect errors - they should not be caught
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
            throw error;
        }
        console.error('Error initiating login:', error);
        return {
            error: 'An error occurred. Please try again.',
            success: false,
        };
    }
}

/**
 * Get WorkOS sign-up URL for client-side redirect
 */
export async function getSignUpUrl(): Promise<string | null> {
    try {
        const url = await getSignInUrl();
        return url || null;
    } catch (error) {
        console.error('Error getting sign-up URL:', error);
        throw new Error('Failed to initialize sign-up');
    }
}
