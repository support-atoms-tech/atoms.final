import { cookies } from 'next/headers';

import workos from './workosClient';

/**
 * Constants for WorkOS authentication
 */
export const WORKOS_COOKIE_NAME = 'workos_session';
export const WORKOS_REFRESH_COOKIE_NAME = 'workos_refresh_token';

/**
 * Get WorkOS Authorization URL for OAuth flow
 *
 * @param provider - OAuth provider ('authkit', 'github', 'google', etc.)
 * @param state - Optional state parameter for CSRF protection
 * @returns Authorization URL to redirect user to
 */
export async function getAuthorizationUrl(provider: string, state?: string) {
    const redirectUri = process.env.WORKOS_REDIRECT_URI;

    if (!redirectUri) {
        throw new Error('WORKOS_REDIRECT_URI environment variable is not set');
    }

    const clientId = process.env.WORKOS_CLIENT_ID;
    if (!clientId) {
        throw new Error('WORKOS_CLIENT_ID environment variable is not set');
    }

    const url = await workos.authKit.getAuthorizationUrl({
        provider: provider as any,
        clientId,
        redirectUri,
        state,
    });

    return url;
}

/**
 * Exchange OAuth code for user and session tokens
 *
 * @param code - Authorization code from OAuth callback
 * @returns User object and session tokens
 */
export async function authenticateWithCode(code: string) {
    const clientId = process.env.WORKOS_CLIENT_ID;
    if (!clientId) {
        throw new Error('WORKOS_CLIENT_ID environment variable is not set');
    }

    const redirectUri = process.env.WORKOS_REDIRECT_URI;
    if (!redirectUri) {
        throw new Error('WORKOS_REDIRECT_URI environment variable is not set');
    }

    const response = await workos.authKit.authenticateWithCode({
        code,
        clientId,
        redirectUri,
    });

    return response;
}

/**
 * Get current user from session
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get(WORKOS_COOKIE_NAME);

        if (!sessionCookie || !sessionCookie.value) {
            return null;
        }

        // In a real implementation, you would verify the token and fetch user details
        // For now, this is a placeholder
        return null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

/**
 * Create a new WorkOS user
 *
 * @param email - User email
 * @param firstName - User first name (optional)
 * @param lastName - User last name (optional)
 * @param password - User password hash (optional, for password imports)
 * @returns Created user object
 */
export async function createUser(
    email: string,
    firstName?: string,
    lastName?: string,
    password?: string,
) {
    const userData: any = {
        email,
    };

    if (firstName) userData.firstName = firstName;
    if (lastName) userData.lastName = lastName;
    if (password) userData.passwordHash = password;

    const user = await workos.userManagement.createUser(userData);
    return user;
}

/**
 * Get user by ID
 *
 * @param userId - WorkOS user ID
 * @returns User object
 */
export async function getUser(userId: string) {
    const user = await workos.userManagement.getUser(userId);
    return user;
}

/**
 * Update user
 *
 * @param userId - WorkOS user ID
 * @param updates - Fields to update
 * @returns Updated user object
 */
export async function updateUser(userId: string, updates: Record<string, any>) {
    const user = await workos.userManagement.updateUser(userId, updates);
    return user;
}

/**
 * List users with optional filtering
 *
 * @param options - Filter and pagination options
 * @returns List of users
 */
export async function listUsers(options?: Record<string, any>) {
    const users = await workos.userManagement.listUsers(options);
    return users;
}
