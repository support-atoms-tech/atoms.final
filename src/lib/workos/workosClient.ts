import WorkOS from '@workos-inc/node';

if (!process.env.WORKOS_API_KEY) {
    throw new Error('WORKOS_API_KEY environment variable is not set');
}

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default workos;

/**
 * WorkOS SDK Initialization
 *
 * This module provides a singleton instance of the WorkOS SDK client.
 * All WorkOS API calls should use this initialized client.
 *
 * Environment Variables Required:
 * - WORKOS_API_KEY: API key from WorkOS dashboard
 * - WORKOS_CLIENT_ID: OAuth client ID from WorkOS dashboard
 * - WORKOS_REDIRECT_URI: OAuth redirect URI (e.g., https://yourdomain.com/auth/callback)
 */
