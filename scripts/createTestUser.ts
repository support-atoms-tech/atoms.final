/**
 * Create a test user in WorkOS
 *
 * Usage: WORKOS_API_KEY=your_key bun run scripts/createTestUser.ts
 */

import { WorkOS } from '@workos-inc/node';

const WORKOS_API_KEY = process.env.WORKOS_API_KEY;

if (!WORKOS_API_KEY) {
    console.error('Missing WORKOS_API_KEY environment variable');
    process.exit(1);
}

const workos = new WorkOS(WORKOS_API_KEY);

async function createTestUser() {
    try {
        console.log('🚀 Creating test user...\n');

        const testUser = await workos.userManagement.createUser({
            email: 'test@atoms.tech',
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: 'User',
        });

        console.log('✅ Test user created successfully!');
        console.log('\nCredentials:');
        console.log(`  Email: test@atoms.tech`);
        console.log(`  Password: TestPassword123!`);
        console.log(`  WorkOS ID: ${testUser.id}\n`);
    } catch (error) {
        console.error('❌ Error creating test user:', error);
        process.exit(1);
    }
}

createTestUser();
