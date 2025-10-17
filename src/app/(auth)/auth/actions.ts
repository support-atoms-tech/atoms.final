'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { createUser, authenticateWithCode } from '@/lib/workos/workosAuth';
import { getUserOrganizationsServer } from '@/lib/db/server';
import { createClient } from '@/lib/supabase/supabaseServer';
import { COOKIE_NAME } from '@/lib/utils/cookieUtils';
import { OrganizationType } from '@/types';

/**
 * Authenticate user with WorkOS using email and password
 */
export async function login(formData: FormData) {
    const cookieStore = await cookies();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const externalAuthId = (formData.get('external_auth_id') as string) || null;

    if (!email || !password) {
        return {
            error: 'Email and password are required',
            success: false,
        };
    }

    try {
        // For now, use WorkOS API directly to authenticate
        // In production, you'd use the WorkOS SDK method
        const workosApiKey = process.env.WORKOS_API_KEY;
        const clientId = process.env.WORKOS_CLIENT_ID;

        if (!workosApiKey || !clientId) {
            throw new Error('WorkOS credentials not configured');
        }

        // Call WorkOS API to authenticate with password
        const response = await fetch('https://api.workos.com/authkit/sign_in', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${workosApiKey}`,
            },
            body: JSON.stringify({
                client_id: clientId,
                email,
                password,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return {
                error: errorData.message || 'Invalid credentials',
                success: false,
            };
        }

        const authData = await response.json();
        const workosUserId = authData.user.id;

        // If this login was initiated by AuthKit (Standalone Connect), complete the flow
        if (externalAuthId) {
            try {
                const completeResp = await fetch(
                    'https://api.workos.com/authkit/oauth2/complete',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${workosApiKey}`,
                        },
                        body: JSON.stringify({
                            external_auth_id: externalAuthId,
                            user: {
                                id: workosUserId,
                                email: authData.user.email,
                                first_name: authData.user.first_name,
                                last_name: authData.user.last_name,
                            },
                        }),
                    },
                );

                if (!completeResp.ok) {
                    const errText = await completeResp.text();
                    return {
                        success: false,
                        error: `WorkOS API error (${completeResp.status}): ${errText}`,
                    };
                }

                const { redirect_uri } = await completeResp.json();

                if (!redirect_uri) {
                    return { success: false, error: 'No redirect_uri from WorkOS' };
                }

                return {
                    success: true,
                    authkitRedirect: redirect_uri,
                };
            } catch (e: unknown) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                return {
                    success: false,
                    error: `AuthKit completion failed: ${errorMessage}`,
                };
            }
        }

        // Get user organizations from database
        const organizations = await getUserOrganizationsServer(workosUserId);

        let redirectUrl = '/home';

        const enterpriseOrg = organizations.find(
            (org) => org.type === OrganizationType.enterprise,
        );

        const existingPreferredOrgId = cookieStore.get('preferred_org_id')?.value;

        if (enterpriseOrg) {
            redirectUrl = `/org/${enterpriseOrg.id}`;
            cookieStore.set('preferred_org_id', enterpriseOrg.id);
        } else if (!existingPreferredOrgId && organizations.length > 0) {
            const personalOrg = organizations.find(
                (org) => org.type === OrganizationType.personal,
            );

            if (personalOrg) {
                redirectUrl = `/org/${personalOrg.id}`;
                cookieStore.set('preferred_org_id', personalOrg.id);
            }
        }

        // Set user ID cookie (for backwards compatibility with existing code)
        cookieStore.set('user_id', workosUserId);

        revalidatePath('/', 'layout');
        return {
            success: true,
            redirectTo: redirectUrl,
        };
    } catch (error) {
        console.error('Error logging in:', error);
        return {
            error: 'An unexpected error occurred. Please try again.',
            success: false,
        };
    }
}

/**
 * Create a new user account with WorkOS
 */
export async function signup(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    if (!email || !password || !name) {
        return {
            error: 'Email, password, and name are required',
            success: false,
        };
    }

    try {
        const workosApiKey = process.env.WORKOS_API_KEY;
        const clientId = process.env.WORKOS_CLIENT_ID;

        if (!workosApiKey || !clientId) {
            throw new Error('WorkOS credentials not configured');
        }

        // Parse name into first and last
        const nameParts = name.trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || undefined;

        // Create user in WorkOS
        const createResp = await fetch('https://api.workos.com/user_management/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${workosApiKey}`,
            },
            body: JSON.stringify({
                email,
                password,
                first_name: firstName,
                last_name: lastName,
            }),
        });

        if (!createResp.ok) {
            const errorData = await createResp.json();
            return {
                error: errorData.message || 'Failed to create account',
                success: false,
            };
        }

        const userData = await createResp.json();

        // Automatically sign in the new user
        const signInResp = await fetch('https://api.workos.com/authkit/sign_in', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${workosApiKey}`,
            },
            body: JSON.stringify({
                client_id: clientId,
                email,
                password,
            }),
        });

        if (!signInResp.ok) {
            return {
                message: 'Account created. Please log in.',
                success: true,
            };
        }

        revalidatePath('/', 'layout');
        redirect('/home');
    } catch (error) {
        console.error('Error signing up:', error);
        return {
            error: 'An unexpected error occurred',
            success: false,
        };
    }
}

/**
 * Sign out the current user
 */
export async function signOut() {
    try {
        const cookieStore = await cookies();

        // Clear all auth cookies on server side
        Object.values(COOKIE_NAME).forEach((name) => {
            cookieStore.set(name, '', {
                expires: new Date(0),
                path: '/',
            });
        });

        // Also clear WorkOS session cookies
        cookieStore.set('workos_session', '', {
            expires: new Date(0),
            path: '/',
        });

        revalidatePath('/', 'layout');
        redirect('/login');
    } catch (error) {
        console.error('Error signing out:', error);
        return {
            error: 'Failed to sign out',
            success: false,
        };
    }
}
