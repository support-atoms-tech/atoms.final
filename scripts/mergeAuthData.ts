/**
 * Merge Supabase Auth Data with Profiles
 *
 * Combines:
 * - exp-2.csv (auth.users with password hashes)
 * - exp.csv (auth.identities with OAuth providers)
 * - users-export.json (profiles)
 *
 * Creates a complete migration file with passwords and OAuth data.
 *
 * Usage: bun run scripts/mergeAuthData.ts
 *
 * Output: Creates users-export-complete.json with all auth data
 */

import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

import { Database } from '../src/types/base/database.types';

interface AuthUser {
    id: string;
    email: string;
    encrypted_password?: string;
    email_confirmed_at?: string;
    raw_user_meta_data?: string;
    last_sign_in_at?: string;
    created_at: string;
    updated_at: string;
}

interface OAuthIdentity {
    user_id: string;
    provider: string;
    provider_id: string;
    email?: string;
}

interface ProfileUser {
    id: string;
    full_name?: string;
    avatar_url?: string;
    email: string;
    last_login_at?: string;
}

interface MigratedUser {
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

function parseCSV(filePath: string): any[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    return parse(content, {
        columns: true,
        skip_empty_lines: true,
    });
}

function getHashType(hash: string): string {
    if (!hash) return 'unknown';
    if (hash.startsWith('$2')) return 'bcrypt';
    if (hash.startsWith('$argon2')) return 'argon2';
    if (hash.startsWith('$scrypt')) return 'scrypt';
    if (hash.startsWith('{SSHA}')) return 'ssha';
    return 'unknown';
}

async function mergeData() {
    console.log('🚀 Starting auth data merge...\n');

    try {
        // Parse CSV files
        console.log('📥 Parsing CSV files...');
        const authUsers = parseCSV('./exp-2.csv') as AuthUser[];
        const oauthIdentities = parseCSV('./exp.csv') as OAuthIdentity[];
        console.log(`✓ Found ${authUsers.length} auth users`);
        console.log(`✓ Found ${oauthIdentities.length} OAuth identities`);

        // Read profiles
        console.log('📥 Reading profiles...');
        const profilesData = JSON.parse(
            fs.readFileSync('./scripts/users-export.json', 'utf-8'),
        );
        const profiles = profilesData.profiles || [];
        console.log(`✓ Found ${profiles.length} profiles\n`);

        // Create maps for quick lookup
        const profileMap = new Map(profiles.map((p: ProfileUser) => [p.id, p]));
        const oauthMap = new Map<string, OAuthIdentity[]>();

        // Group OAuth identities by user_id
        for (const identity of oauthIdentities) {
            if (identity.provider !== 'email') {
                // Skip email provider, it's for basic auth
                if (!oauthMap.has(identity.user_id)) {
                    oauthMap.set(identity.user_id, []);
                }
                oauthMap.get(identity.user_id)!.push(identity);
            }
        }

        // Merge auth users with profiles
        const migratedUsers: MigratedUser[] = [];
        let withPasswords = 0;
        let withOAuth = 0;
        let emailVerified = 0;

        for (const authUser of authUsers) {
            const profile = profileMap.get(authUser.id) as
                | Database['public']['Tables']['profiles']['Row']
                | undefined;
            const identities = oauthMap.get(authUser.id) || [];

            const migratedUser: MigratedUser = {
                id: authUser.id,
                email: authUser.email,
                full_name: profile?.full_name || undefined,
                avatar_url: profile?.avatar_url || undefined,
                created_at: authUser.created_at,
                updated_at: authUser.updated_at,
                last_sign_in_at: authUser.last_sign_in_at,
            };

            // Add password hash if present and not null
            if (authUser.encrypted_password && authUser.encrypted_password.trim()) {
                migratedUser.password_hash = authUser.encrypted_password;
                migratedUser.password_hash_type = getHashType(
                    authUser.encrypted_password,
                );
                withPasswords++;
            }

            // Add email verification status
            if (authUser.email_confirmed_at) {
                migratedUser.email_verified_at = authUser.email_confirmed_at;
                emailVerified++;
            }

            // Add OAuth providers
            if (identities.length > 0) {
                migratedUser.oauth_providers = identities.map((id) => ({
                    provider: id.provider,
                    provider_id: id.provider_id,
                }));
                withOAuth++;
            }

            migratedUsers.push(migratedUser);
        }

        // Create final export
        const completeData = {
            users: migratedUsers,
            totalCount: migratedUsers.length,
            exportedAt: new Date().toISOString(),
            stats: {
                withPasswords,
                withOAuth,
                emailVerified,
            },
        };

        // Save merged file
        const outputFile = './scripts/users-export-complete.json';
        fs.writeFileSync(outputFile, JSON.stringify(completeData, null, 2));

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ Data merge complete!`);
        console.log(`${'='.repeat(60)}`);
        console.log(`📁 File saved to: ${outputFile}`);
        console.log(`\n📊 Migration Statistics:`);
        console.log(`   Total users: ${migratedUsers.length}`);
        console.log(`   🔐 With password hashes: ${withPasswords}`);
        console.log(`   🔗 With OAuth providers: ${withOAuth}`);
        console.log(`   ✉️  Email verified: ${emailVerified}`);
        console.log(`\n✨ Ready for WorkOS import!`);
        console.log(`\nNext: bun run scripts/importUsersToWorkOS.ts\n`);
    } catch (error) {
        console.error('❌ Merge failed:', error);
        process.exit(1);
    }
}

mergeData();
