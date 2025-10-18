/**
 * Diagnose WorkOS configuration and capabilities
 */

const WORKOS_API_KEY = process.env.WORKOS_API_KEY;
const WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID;

if (!WORKOS_API_KEY || !WORKOS_CLIENT_ID) {
    console.error('❌ Missing WORKOS_API_KEY or WORKOS_CLIENT_ID');
    process.exit(1);
}

async function testEndpoint(method: string, path: string, body?: any): Promise<any> {
    try {
        const response = await fetch(`https://api.workos.com${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${WORKOS_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();
        return {
            status: response.status,
            ok: response.ok,
            data,
        };
    } catch (error: any) {
        return {
            error: error.message,
        };
    }
}

async function diagnose() {
    console.log('\n🔍 WorkOS Configuration Diagnosis');
    console.log('═'.repeat(60));
    console.log(`\nAPI Key: ${WORKOS_API_KEY?.substring(0, 20)}...`);
    console.log(`Client ID: ${WORKOS_CLIENT_ID}\n`);

    // Test 1: Basic API Access
    console.log('Test 1: Basic API Access');
    const usersTest = await testEndpoint('GET', '/user_management/users?limit=1');
    console.log(
        `  GET /user_management/users: ${usersTest.ok ? '✅' : '❌'} (${usersTest.status})`,
    );

    if (!usersTest.ok) {
        console.log(`  Error: ${usersTest.data?.message || 'Unknown error'}`);
    }

    // Test 2: Get a specific user
    console.log('\nTest 2: Get Specific User');
    const userId = 'user_01K6EV07KR2MNMDQ60BC03ZM1A'; // kooshapari
    const userTest = await testEndpoint('GET', `/user_management/users/${userId}`);
    console.log(
        `  GET /user_management/users/{id}: ${userTest.ok ? '✅' : '❌'} (${userTest.status})`,
    );

    // Test 3: Identities Endpoint (The problem one)
    console.log('\nTest 3: Identities Endpoint');
    const identitiesTest = await testEndpoint(
        'POST',
        `/user_management/users/${userId}/identities`,
        {
            type: 'oauth',
            provider: 'google',
            external_user_id: 'test123',
        },
    );
    console.log(
        `  POST /user_management/users/{id}/identities: ${identitiesTest.ok ? '✅' : '❌'} (${identitiesTest.status})`,
    );

    if (!identitiesTest.ok) {
        console.log(`  Status: ${identitiesTest.status}`);
        console.log(
            `  Error: ${identitiesTest.data?.message || identitiesTest.data?.error || 'Unknown'}`,
        );

        if (identitiesTest.status === 404) {
            console.log(
                `  💡 404 means endpoint not found - may need organization setup or different API key`,
            );
        } else if (identitiesTest.status === 403) {
            console.log(`  💡 403 means permission denied - check API key scopes`);
        }
    }

    // Test 4: List Organizations
    console.log('\nTest 4: Organizations');
    const orgsTest = await testEndpoint('GET', '/organizations');
    console.log(
        `  GET /organizations: ${orgsTest.ok ? '✅' : '❌'} (${orgsTest.status})`,
    );

    if (orgsTest.ok && orgsTest.data?.data) {
        console.log(`  Found ${orgsTest.data.data.length} organization(s)`);
        orgsTest.data.data.forEach((org: any) => {
            console.log(`    - ${org.name} (${org.id})`);
        });
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 Diagnosis Summary:\n');

    if (
        usersTest.ok &&
        userTest.ok &&
        !identitiesTest.ok &&
        identitiesTest.status === 404
    ) {
        console.log('⚠️  The identities endpoint is not available (404).');
        console.log('   This is a WorkOS configuration issue.\n');
        console.log('   Solutions:');
        console.log('   1. Check WorkOS dashboard for organization setup');
        console.log('   2. Verify API key has identities permissions');
        console.log(
            '   3. Contact WorkOS support about enabling identities for your workspace',
        );
        console.log('   4. In the meantime, users can re-link via OAuth login buttons\n');
    } else if (identitiesTest.ok) {
        console.log('✅ Identities endpoint is working!');
        console.log('   Try running: bun run scripts/fixOAuthIdentities.ts\n');
    } else if (usersTest.ok && userTest.ok) {
        console.log('⚠️  API is working but identities endpoint has unknown issue');
        console.log(`   Status: ${identitiesTest.status}`);
        console.log(`   Error: ${identitiesTest.data?.message}\n`);
    } else {
        console.log('❌ Basic API access failed - check credentials');
        console.log(`   API Key status: ${usersTest.ok ? '✅' : '❌'}\n`);
    }
}

diagnose();
