/**
 * Import Users to WorkOS (Complete with Passwords and OAuth)
 *
 * This script imports exported Supabase users into WorkOS with:
 * - Password hashes (bcrypt format)
 * - OAuth provider identities (GitHub, Google, etc.)
 * - Email verification status
 * - User metadata
 *
 * Features:
 * - Creates new users
 * - UPDATES existing users (overwrites if present)
 * - Links/updates OAuth identities
 * - Preserves password hashes and email verification
 *
 * Prerequisites:
 * 1. Run mergeAuthData.ts to generate users-export-complete.json
 * 2. Set WORKOS_API_KEY environment variable
 *
 * Usage: bun run scripts/importUsersToWorkOS.ts
 *
 * Output: Creates import-report.json with results and any errors
 */

import * as fs from 'fs';
import { WorkOS } from '@workos-inc/node';

const WORKOS_API_KEY = process.env.WORKOS_API_KEY;

if (!WORKOS_API_KEY) {
    console.error('Missing WORKOS_API_KEY environment variable');
    process.exit(1);
}

const workos = new WorkOS(WORKOS_API_KEY);

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

interface ImportReport {
    successCount: number;
    createdCount: number;
    updatedCount: number;
    errorCount: number;
    oauthLinkedCount: number;
    results: Array<{
        email: string;
        workosUserId?: string;
        status: 'created' | 'updated' | 'error' | 'oauth_linked';
        message: string;
        passwordImported?: boolean;
        oauthProviders?: string[];
        action?: 'create' | 'update' | 'oauth_link';
    }>;
    importedAt: string;
}

function updateProgress(current: number, total: number, message: string = '') {
    const percentage = Math.round((current / total) * 100);
    const barLength = 40;
    const filledLength = Math.round((barLength * current) / total);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    const status = message ? ` ${message}` : '';
    process.stdout.write(`\r[${bar}] ${percentage}% (${current}/${total})${status}`);
}

async function processUser(user: MigratedUser, report: ImportReport) {
    try {
        // Parse full name into firstName and lastName
        let firstName = 'User';
        let lastName = '';

        if (user.full_name) {
            const nameParts = user.full_name.split(' ');
            firstName = nameParts[0];
            if (nameParts.length > 1) {
                lastName = nameParts.slice(1).join(' ');
            }
        }

        // Use REST API directly for better control
        const userPayload: any = {
            email: user.email,
            first_name: firstName,
            last_name: lastName,
        };

        // Add password hash (only if valid hash type)
        const validHashTypes = [
            'bcrypt',
            'firebase-scrypt',
            'ssha',
            'scrypt',
            'pbkdf2',
            'argon2',
        ];
        if (
            user.password_hash &&
            user.password_hash_type &&
            validHashTypes.includes(user.password_hash_type)
        ) {
            userPayload.password_hash = user.password_hash;
            userPayload.password_hash_type = user.password_hash_type;
        }

        // Set email as verified
        if (user.email_verified_at) {
            userPayload.email_verified = true;
        }

        // First, try to CREATE user
        let response = await fetch('https://api.workos.com/user_management/users', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${WORKOS_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userPayload),
        });

        let responseData = await response.json();
        let workosUserId: string | null = null;
        let isUpdate = false;

        // If user exists, UPDATE instead of create
        if (!response.ok && responseData.errors?.[0]?.code === 'email_not_available') {
            // Get user ID by email first
            const listResponse = await fetch(
                `https://api.workos.com/user_management/users?email=${encodeURIComponent(user.email)}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${WORKOS_API_KEY}`,
                    },
                },
            );

            const listData = await listResponse.json();
            if (listData.data && listData.data.length > 0) {
                workosUserId = listData.data[0].id;

                // UPDATE the user
                response = await fetch(
                    `https://api.workos.com/user_management/users/${workosUserId}`,
                    {
                        method: 'PATCH',
                        headers: {
                            Authorization: `Bearer ${WORKOS_API_KEY}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(userPayload),
                    },
                );

                responseData = await response.json();
                isUpdate = true;
            } else {
                throw new Error('User not found for update');
            }
        }

        if (!response.ok && !isUpdate) {
            throw new Error(`API Error: ${JSON.stringify(responseData)}`);
        }

        if (!workosUserId) {
            workosUserId = responseData.id;
        }

        // Track result
        const resultData: any = {
            email: user.email,
            workosUserId,
            status: isUpdate ? 'updated' : 'created',
            message: isUpdate ? 'User updated successfully' : 'User created successfully',
            action: isUpdate ? 'update' : 'create',
            passwordImported: !!user.password_hash,
        };

        // Link OAuth providers if present
        const linkedProviders: string[] = [];
        if (user.oauth_providers && user.oauth_providers.length > 0) {
            for (const oauth of user.oauth_providers) {
                try {
                    // Try linking via identities endpoint
                    let identityResponse = await fetch(
                        `https://api.workos.com/user_management/users/${workosUserId}/identities`,
                        {
                            method: 'POST',
                            headers: {
                                Authorization: `Bearer ${WORKOS_API_KEY}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                type: 'oauth',
                                provider: oauth.provider,
                                external_user_id: oauth.provider_id,
                            }),
                        },
                    );

                    let responseData = await identityResponse.json();

                    if (identityResponse.ok) {
                        linkedProviders.push(oauth.provider);
                        report.oauthLinkedCount++;
                    } else if (responseData.code === 'identity_already_exists') {
                        // Identity already linked, count as success
                        linkedProviders.push(oauth.provider);
                        report.oauthLinkedCount++;
                    } else {
                        // Log error for investigation
                        throw new Error(
                            `Failed to link ${oauth.provider}: ${responseData.message || JSON.stringify(responseData)}`,
                        );
                    }
                } catch (oauthError: any) {
                    const errorMessage = oauthError?.message || String(oauthError);
                    // Store OAuth errors but don't fail the whole import
                    if (!resultData.oauthErrors) {
                        resultData.oauthErrors = [];
                    }
                    resultData.oauthErrors.push({
                        provider: oauth.provider,
                        error: errorMessage,
                    });
                }
            }

            if (linkedProviders.length > 0) {
                resultData.oauthProviders = linkedProviders;
            }
        }

        report.results.push(resultData);
        report.successCount++;
        if (isUpdate) {
            report.updatedCount++;
        } else {
            report.createdCount++;
        }
        return null;
    } catch (error: any) {
        const errorMessage = error?.message || String(error);
        return {
            email: user.email,
            status: 'error',
            message: errorMessage,
        };
    }
}

async function importUsers() {
    console.log('\n🚀 Starting WorkOS user import...\n');

    try {
        // Read complete export file
        const exportFile = './scripts/users-export-complete.json';
        if (!fs.existsSync(exportFile)) {
            throw new Error(
                `Complete export file not found: ${exportFile}\nRun mergeAuthData.ts first`,
            );
        }

        const exportData = JSON.parse(fs.readFileSync(exportFile, 'utf-8'));
        const users = exportData.users || [];

        const report: ImportReport = {
            successCount: 0,
            createdCount: 0,
            updatedCount: 0,
            errorCount: 0,
            oauthLinkedCount: 0,
            results: [],
            importedAt: new Date().toISOString(),
        };

        const CONCURRENCY = 5;
        let processed = 0;
        const errors: any[] = [];

        // Process users in parallel batches
        for (let i = 0; i < users.length; i += CONCURRENCY) {
            const batch = users.slice(i, i + CONCURRENCY);
            const promises = batch.map((user: MigratedUser) => processUser(user, report));

            const results = await Promise.all(promises);

            results.forEach((error) => {
                if (error) {
                    errors.push(error);
                    report.errorCount++;
                    report.results.push(error);
                }
            });

            processed += batch.length;
            updateProgress(processed, users.length);
        }

        console.log('\n');

        // Save report
        const reportFile = './scripts/import-report.json';
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

        // Count OAuth linking failures
        let oauthFailures = 0;
        report.results.forEach((result: any) => {
            if (result.oauthErrors && result.oauthErrors.length > 0) {
                oauthFailures += result.oauthErrors.length;
            }
        });

        // Show errors if any
        if (errors.length > 0) {
            console.log(`\n❌ Import Errors (${errors.length}):`);
            errors.forEach((err) => {
                console.log(`  • ${err.email}: ${err.message}`);
            });
        }

        // Show OAuth linking failures
        if (oauthFailures > 0) {
            console.log(`\n⚠️  OAuth Linking Issues (${oauthFailures}):`);
            report.results.forEach((result: any) => {
                if (result.oauthErrors && result.oauthErrors.length > 0) {
                    result.oauthErrors.forEach((oauthErr: any) => {
                        console.log(
                            `  • ${result.email} - ${oauthErr.provider}: ${oauthErr.error.split(':').pop()?.trim()}`,
                        );
                    });
                }
            });
            console.log(
                `\n💡 Note: OAuth identities require WorkOS API organization setup. See report for details.\n`,
            );
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ Import Complete!`);
        console.log(`${'='.repeat(60)}`);
        console.log(`✅ Success: ${report.successCount}`);
        console.log(`   ✨ Created: ${report.createdCount}`);
        console.log(`   📝 Updated: ${report.updatedCount}`);
        console.log(`❌ Import Errors: ${report.errorCount}`);
        console.log(`🔗 OAuth identities linked: ${report.oauthLinkedCount}`);
        console.log(`⚠️  OAuth linking issues: ${oauthFailures}`);
        console.log(`📊 Total processed: ${users.length}`);
        console.log(`📁 Report saved to: ${reportFile}\n`);
    } catch (error) {
        console.error('\n❌ Import failed:', error);
        process.exit(1);
    }
}

importUsers();
