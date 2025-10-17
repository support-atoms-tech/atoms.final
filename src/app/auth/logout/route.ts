import { signOut } from '@workos-inc/authkit-nextjs';

/**
 * GET /auth/logout
 *
 * Logs out the current user by clearing the session
 *
 * This endpoint:
 * 1. Clears the encrypted session cookie
 * 2. Redirects user back to login page
 *
 * Configuration:
 * - Logout URL is configured in WorkOS Dashboard
 */
export const GET = signOut();
