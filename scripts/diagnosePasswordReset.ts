/**
 * Diagnose password reset email configuration
 */

import { WorkOS } from '@workos-inc/node';

const WORKOS_API_KEY = process.env.WORKOS_API_KEY;
const WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID;

if (!WORKOS_API_KEY || !WORKOS_CLIENT_ID) {
    console.error('❌ Missing WorkOS credentials');
    process.exit(1);
}

const workos = new WorkOS(WORKOS_API_KEY, {
    clientId: WORKOS_CLIENT_ID,
});

async function diagnosePasswordReset() {
    const testEmail = 'kooshapari@kooshapari.com';

    console.log('\n🔍 Password Reset Configuration Diagnosis');
    console.log('═'.repeat(60));
    console.log(`\nTesting email: ${testEmail}\n`);

    try {
        console.log('Step 1: Creating password reset token...');
        const passwordReset = await workos.userManagement.createPasswordReset({
            email: testEmail,
        });

        console.log('✅ Password reset created successfully\n');
        console.log('📊 Password Reset Details:');
        console.log(`  ID: ${passwordReset.id}`);
        console.log(`  Email: ${passwordReset.email}`);
        console.log(`  Token: ${passwordReset.passwordResetToken}`);
        console.log(`  Reset URL: ${passwordReset.passwordResetUrl}`);
        console.log(`  Expires At: ${passwordReset.expiresAt}\n`);

        // The reset URL is the key!
        console.log('🔑 This is your password reset link:');
        console.log(`\n${passwordReset.passwordResetUrl}\n`);

        console.log("⚠️  Why you're not receiving email:");
        console.log(
            '  1. sendPasswordResetEmail() requires WORKOS_PASSWORD_RESET_URL_BASE configured',
        );
        console.log('  2. This env var needs to be set in WorkOS Dashboard');
        console.log('  3. OR you can use the direct reset URL above\n');

        console.log('✅ Solution: Use the direct reset URL');
        console.log(`  Copy this link: ${passwordReset.passwordResetUrl}`);
        console.log('  Open in browser to reset password\n');

        console.log('📋 To get emails working:');
        console.log('  1. Go to WorkOS Dashboard');
        console.log('  2. Settings → Password Reset');
        console.log('  3. Set Password Reset URL Base to:');
        console.log('     https://yourapp.com/auth/reset-password');
        console.log('  4. Then sendPasswordResetEmail() will work\n');
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

diagnosePasswordReset();
