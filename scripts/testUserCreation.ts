/**
 * Test WorkOS User Creation with Password Hash
 *
 * Debug script to test different approaches for creating users with password hashes
 */

import { WorkOS } from '@workos-inc/node';

const WORKOS_API_KEY = process.env.WORKOS_API_KEY;

if (!WORKOS_API_KEY) {
    console.error('Missing WORKOS_API_KEY');
    process.exit(1);
}

const workos = new WorkOS(WORKOS_API_KEY);

async function testCreation() {
    console.log('Testing WorkOS user creation...\n');

    try {
        // Test 1: Simple user without password
        console.log('Test 1: Creating user without password...');
        const user1 = await workos.userManagement.createUser({
            email: 'test-simple-' + Date.now() + '@example.com',
            firstName: 'Test',
            lastName: 'User',
        });
        console.log('✅ Success:', user1.id);
        console.log('   Data:', JSON.stringify(user1, null, 2));

        // Test 2: User with password hash
        console.log('\nTest 2: Creating user with password hash...');
        const testHash = '$2a$10$kta7WJKYlt4DNYMN9YdY.OHKWaiGymNXy3J4uZbKTcoPGo2c0va4y';

        try {
            const user2 = await workos.userManagement.createUser({
                email: 'test-hash-' + Date.now() + '@example.com',
                firstName: 'Hash',
                lastName: 'Test',
                password_hash: testHash,
                password_hash_type: 'bcrypt',
            } as any);
            console.log('✅ Success:', user2.id);
        } catch (hashError: any) {
            console.error('❌ Error:', hashError.message);
            console.error('Error details:', JSON.stringify(hashError, null, 2));
        }

        // Test 3: User with emailVerified
        console.log('\nTest 3: Creating user with email_verified...');
        try {
            const user3 = await workos.userManagement.createUser({
                email: 'test-verified-' + Date.now() + '@example.com',
                firstName: 'Verified',
                lastName: 'Test',
                email_verified: true,
            } as any);
            console.log('✅ Success:', user3.id);
        } catch (verifyError: any) {
            console.error('❌ Error:', verifyError.message);
        }

        // Test 4: Check if we can use REST API directly
        console.log('\nTest 4: Testing REST API directly for password hash...');
        const directHash = '$2a$10$wq87lKfdmttnJoUvvJk.dOtA7O6hJaapjin45D2G6nxfqJslGVZku';
        try {
            const response = await fetch('https://api.workos.com/user_management/users', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${WORKOS_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: 'test-rest-' + Date.now() + '@example.com',
                    first_name: 'REST',
                    last_name: 'Test',
                    password_hash: directHash,
                    password_hash_type: 'bcrypt',
                    email_verified: true,
                }),
            });

            const result = await response.json();
            if (response.ok) {
                console.log('✅ REST Success:', result.id);
                console.log('   Response:', JSON.stringify(result, null, 2));
            } else {
                console.error('❌ REST Error:', result);
            }
        } catch (restError: any) {
            console.error('❌ REST Request Error:', restError.message);
        }
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testCreation();
