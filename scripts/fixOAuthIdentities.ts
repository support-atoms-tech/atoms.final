/**
 * Fix OAuth Identity Linking
 *
 * Re-attempts to link OAuth identities for users where the initial import failed.
 * This script processes the users who had OAuth linking errors.
 *
 * Usage: bun run scripts/fixOAuthIdentities.ts
 */

import * as fs from 'fs';

const WORKOS_API_KEY = process.env.WORKOS_API_KEY;

if (!WORKOS_API_KEY) {
    console.error('❌ Missing WORKOS_API_KEY');
    process.exit(1);
}

interface OAuthError {
    provider: string;
    error: string;
}

interface ImportResult {
    email: string;
    workosUserId?: string;
    status: string;
    oauthErrors?: OAuthError[];
}

interface ImportReport {
    results: ImportResult[];
}

function updateProgress(current: number, total: number) {
    const percentage = Math.round((current / total) * 100);
    const barLength = 40;
    const filledLength = Math.round((barLength * current) / total);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    process.stdout.write(`\r[${bar}] ${percentage}% (${current}/${total})`);
}

async function linkOAuthIdentity(
    userId: string,
    provider: string,
    providerId: string,
): Promise<boolean> {
    try {
        const response = await fetch(
            `https://api.workos.com/user_management/users/${userId}/identities`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${WORKOS_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'oauth',
                    provider: provider,
                    external_user_id: providerId,
                }),
            },
        );

        const data = await response.json();

        if (response.ok) {
            return true;
        } else if (data.code === 'identity_already_exists') {
            // Identity already linked, treat as success
            return true;
        } else if (data.message?.includes('Cannot POST')) {
            // API endpoint issue - this is a WorkOS configuration issue
            return false;
        }
        return false;
    } catch (error) {
        return false;
    }
}

async function fixOAuthIdentities() {
    console.log('\n🔗 Fixing OAuth Identity Linking');
    console.log('═'.repeat(60));
    console.log('\n');

    try {
        // Read import report
        const reportFile = './scripts/import-report.json';
        if (!fs.existsSync(reportFile)) {
            throw new Error(`Report file not found: ${reportFile}`);
        }

        const reportData: ImportReport = JSON.parse(fs.readFileSync(reportFile, 'utf-8'));

        // Find users with OAuth errors
        const usersWithOAuthErrors = reportData.results.filter(
            (r) => r.oauthErrors && r.oauthErrors.length > 0,
        );

        console.log(
            `Found ${usersWithOAuthErrors.length} users with OAuth linking errors\n`,
        );

        if (usersWithOAuthErrors.length === 0) {
            console.log('✅ No OAuth errors to fix!\n');
            return;
        }

        // Get OAuth provider data from export
        const exportFile = './scripts/users-export-complete.json';
        const exportData = JSON.parse(fs.readFileSync(exportFile, 'utf-8'));
        const userMap = new Map(exportData.users.map((u: any) => [u.email, u]));

        let successCount = 0;
        let failedCount = 0;
        const stillFailedUsers: any[] = [];

        // Process each user with OAuth errors
        for (let i = 0; i < usersWithOAuthErrors.length; i++) {
            const user = usersWithOAuthErrors[i];
            const userData = userMap.get(user.email);

            if (!userData || !(userData as any).oauth_providers) {
                failedCount++;
                continue;
            }

            // Try to link each OAuth provider
            for (const oauthProvider of (userData as any).oauth_providers) {
                const success = await linkOAuthIdentity(
                    user.workosUserId!,
                    oauthProvider.provider,
                    oauthProvider.provider_id,
                );

                if (success) {
                    successCount++;
                    // Remove error from report
                    if (user.oauthErrors) {
                        user.oauthErrors = user.oauthErrors.filter(
                            (e) => e.provider !== oauthProvider.provider,
                        );
                    }
                } else {
                    failedCount++;
                    stillFailedUsers.push({
                        email: user.email,
                        provider: oauthProvider.provider,
                    });
                }
            }

            updateProgress(i + 1, usersWithOAuthErrors.length);
        }

        console.log('\n\n');

        console.log(`${'='.repeat(60)}`);
        console.log(`✅ OAuth Identity Linking Results`);
        console.log(`${'='.repeat(60)}`);
        console.log(`🔗 Successfully linked: ${successCount}`);
        console.log(`❌ Still failing: ${failedCount}\n`);

        if (stillFailedUsers.length > 0) {
            console.log('⚠️  Users with persistent OAuth errors:');
            stillFailedUsers.forEach((u) => {
                console.log(`   • ${u.email} (${u.provider})`);
            });

            console.log('\n💡 These errors suggest a WorkOS API configuration issue:');
            console.log('   1. Check WorkOS dashboard for organization setup');
            console.log('   2. Verify OAuth provider integrations are configured');
            console.log(
                '   3. Confirm API key has user_management.identities permissions',
            );
            console.log('   4. Contact WorkOS support if issue persists\n');
        } else {
            console.log('🎉 All OAuth identities successfully linked!\n');
        }

        // Save updated report
        fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
        console.log(`📁 Updated report saved to: ${reportFile}\n`);
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

fixOAuthIdentities();
