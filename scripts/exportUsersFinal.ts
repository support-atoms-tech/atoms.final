/**
 * Export Users from Supabase - Complete User Migration Data
 *
 * This script exports all user data needed for WorkOS migration:
 * - Profile data from public tables
 * - Reads existing users-export.json for profile info
 * - Creates a migration-ready JSON file
 *
 * Usage: bun run scripts/exportUsersFinal.ts
 *
 * Output: Creates users-export-ready-for-import.json
 */

import * as fs from 'fs';

interface OAuthProvider {
    provider: string;
    provider_id?: string;
}

interface MigrationUser {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    password_hash?: string;
    password_hash_type?: string;
    email_verified_at?: string;
    oauth_providers?: OAuthProvider[];
    created_at: string;
    last_login_at?: string;
    preferences?: Record<string, any>;
}

interface MigrationData {
    users: MigrationUser[];
    totalCount: number;
    exportedAt: string;
    instructions: string;
}

async function processUsers() {
    console.log('🚀 Processing user export data for WorkOS migration...\n');

    try {
        // Read the existing profiles export
        const exportFile = './scripts/users-export.json';
        if (!fs.existsSync(exportFile)) {
            throw new Error(
                `Profiles export file not found: ${exportFile}\nRun the profile export first.`,
            );
        }

        const profilesData = JSON.parse(fs.readFileSync(exportFile, 'utf-8'));
        const profiles = profilesData.profiles || [];

        console.log(`📥 Found ${profiles.length} profiles`);
        console.log('📝 Preparing migration data...\n');

        // Transform profiles into migration-ready format
        const migrationUsers: MigrationUser[] = profiles.map((profile: any) => ({
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            created_at: profile.created_at,
            last_login_at: profile.last_login_at,
            preferences: profile.preferences,
            // These would be populated from auth.users if we had direct access:
            // password_hash: string (from encrypted_password column)
            // password_hash_type: 'bcrypt' (Supabase uses bcrypt)
            // email_verified_at: string
            // oauth_providers: Array<{provider, provider_id}>
        }));

        // Create migration data
        const migrationData: MigrationData = {
            users: migrationUsers,
            totalCount: migrationUsers.length,
            exportedAt: new Date().toISOString(),
            instructions: `
IMPORTANT: This export contains PROFILE data only. To complete the migration with passwords and OAuth:

1. PASSWORD HASHES:
   - Supabase stores encrypted passwords in auth.users table with column "encrypted_password"
   - Hash algorithm: bcrypt (all Supabase passwords are bcrypt)
   - WorkOS supports: bcrypt, scrypt, firebase-scrypt, ssha, pbkdf2, argon2
   - Action: Export auth.users data with encrypted_password field and add to this JSON

2. OAUTH PROVIDERS:
   - Supabase stores OAuth identities in auth.identities table
   - Fields needed: provider (github, google, etc), provider_user_id
   - Action: Query auth.identities and link to users, add oauth_providers array to each user

3. EMAIL VERIFICATION:
   - Stored in auth.users.email_confirmed_at
   - Action: Add email_verified_at field for verified users

4. MIGRATION FLOW:
   a. For each user, create in WorkOS with:
      - email, firstName, lastName
      - password_hash + password_hash_type (if password exists)
      - email_verified (if email_confirmed_at is set)

   b. For users with OAuth, link identities after creation:
      - Use WorkOS createIdentity API
      - Set provider, external_user_id, email

NOTE: Currently you'll need to manually:
1. Export auth.users and auth.identities tables using Supabase dashboard
2. Merge the data into this JSON file
3. Run the import script with complete auth data
            `,
        };

        // Save migration file
        const outputFile = './scripts/users-export-ready-for-import.json';
        fs.writeFileSync(outputFile, JSON.stringify(migrationData, null, 2));

        console.log(`\n${'='.repeat(60)}`);
        console.log(`📊 Migration Data Prepared`);
        console.log(`${'='.repeat(60)}`);
        console.log(`📁 File saved to: ${outputFile}`);
        console.log(`👥 Total users: ${migrationUsers.length}`);
        console.log(`\n⚠️  NEXT STEPS:`);
        console.log(`\n1. Export auth data from Supabase:`);
        console.log(`   - Go to Supabase Dashboard > SQL Editor`);
        console.log(`   - Run: SELECT * FROM auth.users;`);
        console.log(`   - Export as JSON`);
        console.log(`   - Look for "encrypted_password" and "email_confirmed_at" fields`);
        console.log(`\n2. Export OAuth identities:`);
        console.log(`   - Run: SELECT * FROM auth.identities;`);
        console.log(`   - Export as JSON`);
        console.log(`   - Extract provider and external_user_id for each identity`);
        console.log(`\n3. Merge the data:`);
        console.log(`   - Add password_hash and oauth_providers to users in this JSON`);
        console.log(`\n4. Run import:`);
        console.log(`   - bun run scripts/importUsersToWorkOS.ts`);
        console.log();
    } catch (error) {
        console.error('❌ Processing failed:', error);
        process.exit(1);
    }
}

processUsers();
