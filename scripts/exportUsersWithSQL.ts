/**
 * Export Users from Supabase using SQL (for password hashes and OAuth data)
 *
 * This script uses direct SQL queries to access auth data including:
 * - Password hashes from auth.users table
 * - OAuth provider identities
 * - Email verification status
 *
 * Prerequisites:
 * - Set SUPABASE_DB_PASSWORD environment variable
 *
 * Usage: SUPABASE_DB_PASSWORD=your_password bun run scripts/exportUsersWithSQL.ts
 *
 * Output: Creates users-export-complete.json in the scripts directory
 */

import * as fs from 'fs';
import postgres from 'postgres';

import { Database } from '../src/types/base/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!supabaseUrl || !dbPassword) {
    console.error('Missing environment variables');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_DB_PASSWORD');
    process.exit(1);
}

// Parse Supabase URL to get host and port
// Format: https://ydogoylwenufckscqijp.supabase.co
const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!urlMatch) {
    console.error('Invalid Supabase URL format');
    process.exit(1);
}

const projectRef = urlMatch[1];
const dbHost = `db.${projectRef}.supabase.co`;
const dbPort = 5432;
const dbUser = 'postgres';
const dbName = 'postgres';

interface ExportedUser {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    password_hash?: string;
    password_hash_type?: string;
    email_verified_at?: string;
    oauth_providers?: Array<{
        provider: string;
        provider_id: string;
    }>;
    created_at: string;
    updated_at: string;
    last_sign_in_at?: string;
}

function getHashType(hash: string): string {
    if (!hash) return 'unknown';
    if (hash.startsWith('$2')) return 'bcrypt';
    if (hash.startsWith('$argon2')) return 'argon2';
    if (hash.startsWith('$scrypt')) return 'scrypt';
    if (hash.startsWith('{SSHA}')) return 'ssha';
    return 'unknown';
}

async function exportUsers() {
    console.log('🚀 Starting SQL-based user export from Supabase...\n');

    let sql: any;

    try {
        // Connect to Supabase Postgres database
        console.log(`📡 Connecting to database: ${dbHost}:${dbPort}`);
        sql = postgres({
            host: dbHost,
            port: dbPort,
            database: dbName,
            username: dbUser,
            password: dbPassword,
            ssl: 'require',
        });

        // Test connection
        const test = await sql`SELECT 1 as connected`;
        console.log('✓ Connected successfully\n');

        // Query auth.users table with password hashes
        console.log('📥 Querying auth.users with password hashes...');
        const authUsers = await sql`
            SELECT
                id,
                email,
                encrypted_password,
                email_confirmed_at,
                created_at,
                updated_at,
                last_sign_in_at,
                raw_app_meta_data,
                user_metadata,
                identities
            FROM auth.users
            ORDER BY created_at DESC
        `;

        console.log(`✓ Found ${authUsers.length} auth users`);

        // Query profiles table
        console.log('📥 Querying profiles table...');
        const profiles = await sql`
            SELECT id, full_name, avatar_url
            FROM public.profiles
            WHERE is_deleted = false
            ORDER BY created_at DESC
        `;

        console.log(`✓ Found ${profiles.length} profiles`);

        // Create a map of profile data
        const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

        // Process auth users
        const exportedUsers: ExportedUser[] = [];
        let withPasswords = 0;
        let withOAuth = 0;
        let emailVerified = 0;

        for (const authUser of authUsers) {
            const profile = profileMap.get(authUser.id) as
                | Database['public']['Tables']['profiles']['Row']
                | undefined;

            const user: ExportedUser = {
                id: authUser.id,
                email: authUser.email,
                full_name: profile?.full_name || undefined,
                avatar_url: profile?.avatar_url || undefined,
                created_at: authUser.created_at,
                updated_at: authUser.updated_at,
                last_sign_in_at: authUser.last_sign_in_at,
            };

            // Add password hash if present
            if (authUser.encrypted_password) {
                user.password_hash = authUser.encrypted_password;
                user.password_hash_type = getHashType(authUser.encrypted_password);
                withPasswords++;
            }

            // Add email verification status
            if (authUser.email_confirmed_at) {
                user.email_verified_at = authUser.email_confirmed_at;
                emailVerified++;
            }

            // Extract OAuth providers from identities
            const oauthProviders = [];
            if (authUser.identities && Array.isArray(authUser.identities)) {
                for (const identity of authUser.identities) {
                    if (identity.provider !== 'email') {
                        oauthProviders.push({
                            provider: identity.provider,
                            provider_id: identity.id,
                        });
                    }
                }
            }

            if (oauthProviders.length > 0) {
                user.oauth_providers = oauthProviders;
                withOAuth++;
            }

            exportedUsers.push(user);
        }

        // Save to file
        const exportData = {
            users: exportedUsers,
            exportedAt: new Date().toISOString(),
            totalCount: exportedUsers.length,
            stats: {
                withPasswords,
                withOAuth,
                emailVerified,
            },
        };

        const filePath = './scripts/users-export-complete.json';
        fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));

        console.log(`\n${'='.repeat(50)}`);
        console.log(`✅ Export complete!`);
        console.log(`${'='.repeat(50)}`);
        console.log(`📁 File saved to: ${filePath}`);
        console.log(`📊 Total users exported: ${exportedUsers.length}`);
        console.log(`🔐 Users with password hashes: ${withPasswords}`);
        console.log(`🔗 Users with OAuth providers: ${withOAuth}`);
        console.log(`✉️  Email verified users: ${emailVerified}\n`);
    } catch (error) {
        console.error('❌ Export failed:', error);
        process.exit(1);
    } finally {
        if (sql) {
            await sql.end();
        }
    }
}

exportUsers();
