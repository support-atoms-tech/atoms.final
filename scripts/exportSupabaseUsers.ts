/**
 * Export Users from Supabase to JSON (Enhanced with Auth Data)
 *
 * This script exports all users from Supabase including:
 * - Profile data (name, email, metadata)
 * - Password hashes from auth.users table
 * - OAuth provider identities (GitHub, Google, etc.)
 * - Email verification status
 *
 * Prerequisites:
 * - Set SUPABASE_SERVICE_ROLE_KEY environment variable
 *
 * Usage: SUPABASE_SERVICE_ROLE_KEY=your_key bun run scripts/exportSupabaseUsers.ts
 *
 * Output: Creates users-export-with-auth.json in the scripts directory
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Service role client has access to auth.users
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// Regular client for public tables
const supabase = createClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
        auth: { autoRefreshToken: false, persistSession: false },
    },
);

interface OAuthIdentity {
    provider: string;
    providerId: string;
    email?: string;
    user_metadata?: Record<string, any>;
}

interface ExportedUser {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    profile_id?: string;
    password_hash?: string;
    password_hash_type?: string;
    email_verified_at?: string;
    oauth_providers?: OAuthIdentity[];
    created_at: string;
    last_login_at?: string;
    metadata?: Record<string, any>;
}

interface UserExportData {
    users: ExportedUser[];
    exportedAt: string;
    totalCount: number;
    stats: {
        withPasswords: number;
        withOAuth: number;
        emailVerified: number;
    };
}

/**
 * Detect password hash algorithm from bcrypt hash format
 * Bcrypt always uses $2a$, $2b$, or $2x$ prefix
 */
function getHashType(hash: string): string {
    if (!hash) return 'unknown';
    if (hash.startsWith('$2')) return 'bcrypt';
    if (hash.startsWith('$argon2')) return 'argon2';
    if (hash.startsWith('$scrypt')) return 'scrypt';
    if (hash.startsWith('{SSHA}')) return 'ssha';
    return 'unknown';
}

/**
 * Extract OAuth providers from Supabase auth metadata
 */
function extractOAuthProviders(authUser: any): OAuthIdentity[] {
    const providers: OAuthIdentity[] = [];

    // Check raw_app_meta_data for provider info
    const providers_list = authUser.raw_app_meta_data?.providers || [];

    // Check identities for provider details
    const identities = authUser.identities || [];

    for (const identity of identities) {
        if (identity.provider !== 'email') {
            providers.push({
                provider: identity.provider,
                providerId: identity.id,
                email: identity.identity_data?.email,
                user_metadata: identity.identity_data,
            });
        }
    }

    return providers;
}

async function exportUsers() {
    console.log('🚀 Starting enhanced user export from Supabase...\n');

    try {
        // Fetch all profiles
        console.log('📥 Fetching profiles from public table...');
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_deleted', false);

        if (profilesError) {
            throw new Error(`Error fetching profiles: ${profilesError.message}`);
        }

        console.log(`✓ Found ${profiles?.length || 0} profiles`);

        // Fetch all auth users (service role access)
        console.log('📥 Fetching auth users (with password hashes)...');
        const { data: authUsers, error: authError } =
            await supabaseAdmin.auth.admin.listUsers({
                perPage: 1000, // Adjust if you have more users
            });

        if (authError) {
            throw new Error(`Error fetching auth users: ${authError.message}`);
        }

        console.log(`✓ Found ${authUsers?.users?.length || 0} auth users`);

        // Create a map of profile data by user ID
        const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

        // Merge auth data with profile data
        const exportedUsers: ExportedUser[] = [];
        let withPasswords = 0;
        let withOAuth = 0;
        let emailVerified = 0;

        for (const authUser of authUsers?.users || []) {
            const profile = profileMap.get(authUser.id);
            const oauthProviders = extractOAuthProviders(authUser);

            const exportedUser: ExportedUser = {
                id: authUser.id,
                email: authUser.email || '',
                full_name: profile?.full_name,
                avatar_url: profile?.avatar_url,
                profile_id: profile?.id,
                created_at: authUser.created_at,
                last_login_at: authUser.last_sign_in_at,
                email_verified_at: authUser.email_confirmed_at,
            };

            // Include password hash if present
            if ((authUser as any).encrypted_password) {
                const hash = (authUser as any).encrypted_password;
                exportedUser.password_hash = hash;
                exportedUser.password_hash_type = getHashType(hash);
                withPasswords++;
            }

            // Include OAuth providers
            if (oauthProviders.length > 0) {
                exportedUser.oauth_providers = oauthProviders;
                withOAuth++;
            }

            // Track email verification
            if (authUser.email_confirmed_at) {
                emailVerified++;
            }

            // Include user metadata
            exportedUser.metadata = authUser.user_metadata;

            exportedUsers.push(exportedUser);
        }

        // Prepare export data
        const exportData: UserExportData = {
            users: exportedUsers,
            exportedAt: new Date().toISOString(),
            totalCount: exportedUsers.length,
            stats: {
                withPasswords,
                withOAuth,
                emailVerified,
            },
        };

        // Save to file
        const fs = require('fs');
        const filePath = './scripts/users-export-with-auth.json';

        fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));

        console.log(`\n${'='.repeat(50)}`);
        console.log(`✅ Export complete!`);
        console.log(`${'='.repeat(50)}`);
        console.log(`📁 File saved to: ${filePath}`);
        console.log(`📊 Total users exported: ${exportData.totalCount}`);
        console.log(`🔐 Users with password hashes: ${withPasswords}`);
        console.log(`🔗 Users with OAuth providers: ${withOAuth}`);
        console.log(`✉️  Email verified users: ${emailVerified}\n`);
    } catch (error) {
        console.error('❌ Export failed:', error);
        process.exit(1);
    }
}

exportUsers();
