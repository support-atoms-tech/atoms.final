import { signOut } from '@workos-inc/authkit-nextjs';

/**
 * POST /auth/signout
 *
 * Sign out the current user using WorkOS AuthKit
 */
export const POST = signOut();
