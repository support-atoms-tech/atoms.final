import { createClient } from '@supabase/supabase-js';

import { Database } from '@/types/base/database.types';

/**
 * Supabase client configured to work with WorkOS as third-party auth provider
 *
 * This follows the official WorkOS + Supabase integration guide:
 * https://supabase.com/docs/guides/auth/third-party/workos
 */

const WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID;
const _WORKOS_AUTH_DOMAIN = process.env.WORKOS_AUTH_DOMAIN || 'api.workos.com';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!WORKOS_CLIENT_ID) {
    throw new Error('WORKOS_CLIENT_ID is not set');
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase URL and key are not set');
}

/**
 * Create Supabase client with WorkOS configuration
 *
 * This client is configured to work with WorkOS as a third-party auth provider.
 * Supabase will automatically validate WorkOS tokens using the issuer URL.
 */
export const supabaseAuthKit = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    global: {
        headers: {
            // Supabase will use the Authorization header for authentication
            // The token comes from WorkOS AuthKit session
        },
    },
    auth: {
        // Use the issuer URL format for WorkOS
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

/**
 * Get Supabase client with WorkOS token
 *
 * Use this in server components or API routes where you have
 * access to the WorkOS session token
 */
export function createSupabaseClientWithToken(token: string) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw new Error('Supabase URL and key are not set');
    }

    return createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

/**
 * Create Supabase client for client-side use with WorkOS token
 *
 * Use this in client components where you have access to the WorkOS token
 */
export function createSupabaseClientWithTokenClient(token: string) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw new Error('Supabase URL and key are not set');
    }

    return createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

/**
 * Default Supabase client (without auth)
 * Use this for public operations or when you don't have a token
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
