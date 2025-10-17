import { handleAuth } from '@workos-inc/authkit-nextjs';

/**
 * GET /auth/callback
 *
 * OAuth callback route for WorkOS AuthKit
 *
 * This route:
 * 1. Receives authorization code from WorkOS
 * 2. Exchanges code for authenticated user
 * 3. Creates encrypted session
 * 4. Redirects to dashboard
 *
 * Configuration:
 * - Must match NEXT_PUBLIC_WORKOS_REDIRECT_URI in environment
 * - Must be configured in WorkOS Dashboard under Redirects
 */
export const GET = handleAuth();
