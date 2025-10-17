# Supabase + WorkOS AuthKit Integration

## Overview

This guide integrates WorkOS AuthKit with Supabase for:
- User authentication via WorkOS AuthKit
- Access tokens for Supabase REST/GraphQL APIs
- Row-level security (RLS) with role-based access
- Database synchronization

---

## Step 1: Add WorkOS Third-Party Auth to Supabase

### In Supabase Dashboard

**Location**: https://supabase.com/dashboard/project/_/auth/third-party

1. Click "Add Auth Provider"
2. Select "WorkOS"
3. Enter your credentials:
   - **Client ID**: `client_01K4CGW2J1FGWZYZJDMVWGQZBD`
   - **Client Secret**: Get from WorkOS Dashboard
   - **Issuer URL**: (see below)

### Issuer URL Format

Replace `CLIENT_ID` with your WorkOS Client ID:

```
https://api.workos.com/user_management/client_01K4CGW2J1FGWZYZJDMVWGQZBD
```

**Full URL**:
```
https://api.workos.com/user_management/client_01K4CGW2J1FGWZYZJDMVWGQZBD
```

---

## Step 2: Set Up JWT Template in WorkOS

### In WorkOS Dashboard

**Location**: https://dashboard.workos.com/authentication → Sessions

Create a JWT Template with these claims to work with Supabase RLS:

```json
{
  "iss": "{{issuer}}",
  "sub": "{{user.id}}",
  "email": "{{user.email}}",
  "email_verified": {{user.email_verified}},
  "name": "{{user.first_name}} {{user.last_name}}",
  "given_name": "{{user.first_name}}",
  "family_name": "{{user.last_name}}",
  "picture": "{{user.profile_picture_url}}",
  "aud": "authenticated",
  "user_role": "{{user.role}}",
  "role": "authenticated",
  "iat": {{iat}},
  "exp": {{exp}},
  "sub": "{{user.id}}"
}
```

### Key Claims Explained

| Claim | Purpose |
|-------|---------|
| `sub` | User ID (matches Supabase auth.users.id) |
| `email` | User email address |
| `email_verified` | Email verification status |
| `aud` | Audience (set to "authenticated") |
| `role` | Supabase RLS role (must be "authenticated") |
| `user_role` | Your app's role (from WorkOS) |

---

## Step 3: Create Supabase Client with WorkOS

### Initialize Supabase Client

**File**: `/src/lib/supabase/supabase-authkit.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client configured to accept WorkOS AuthKit tokens
 *
 * This client uses WorkOS as the auth provider, allowing:
 * - Access tokens from WorkOS AuthKit to be used with Supabase
 * - Row-level security (RLS) based on authenticated role
 * - Direct access to Supabase REST and GraphQL APIs
 */

const WORKOS_CLIENT_ID = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;
const WORKOS_AUTH_DOMAIN = process.env.WORKOS_AUTH_DOMAIN || 'api.workos.com';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!WORKOS_CLIENT_ID) {
    throw new Error('NEXT_PUBLIC_WORKOS_CLIENT_ID is not set');
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase URL and key are not set');
}

export const supabaseAuthKit = createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: {
        headers: {
            // Supabase will use the Authorization header for authentication
            // The token comes from WorkOS AuthKit session
        },
    },
    auth: {
        // Use the issuer URL format for WorkOS
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

/**
 * Get Supabase client with WorkOS token
 *
 * Use this in server components or API routes where you have
 * access to the WorkOS session token
 */
export async function getSupabaseClientWithToken(token: string) {
    return createClient(SUPABASE_URL, SUPABASE_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
```

### Use in Server Components

**File**: `/src/app/example/page.tsx`

```typescript
import { withAuth } from '@workos-inc/authkit-nextjs';
import { createClient } from '@supabase/supabase-js';

export default async function Page() {
    // Get authenticated user and token from WorkOS
    const { user, accessToken } = await withAuth({
        ensureSignedIn: true,
    });

    // Create Supabase client with WorkOS token
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        },
    );

    // Query Supabase with user's authentication
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return <div>Error loading profile</div>;
    }

    return (
        <div>
            <h1>Welcome {data.full_name}</h1>
            <p>Email: {data.email}</p>
        </div>
    );
}
```

### Use in Client Components

**File**: `/src/app/profile/page.tsx`

```typescript
'use client';

import { useAuth } from '@workos-inc/authkit-nextjs';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function ProfilePage() {
    const { user, accessToken, isLoading } = useAuth();
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        if (!accessToken) return;

        const fetchProfile = async () => {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    global: {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    },
                },
            );

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single();

            setProfile(data);
        };

        fetchProfile();
    }, [accessToken, user?.id]);

    if (isLoading) return <div>Loading...</div>;
    if (!profile) return <div>No profile found</div>;

    return (
        <div>
            <h1>{profile.full_name}</h1>
            <p>{profile.email}</p>
        </div>
    );
}
```

---

## Step 4: Set Up Row-Level Security (RLS)

### Enable RLS on Tables

In Supabase SQL Editor, run:

```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own profile
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Enable RLS on other tables as needed
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their projects"
    ON projects FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM project_members
            WHERE project_id = projects.id
        )
    );
```

### Use JWT Claims in RLS

```sql
-- Check user's role from JWT
CREATE POLICY "Admins can view all users"
    ON profiles FOR SELECT
    USING (
        auth.jwt() ->> 'user_role' = 'admin'
    );

-- Check if user is authenticated
CREATE POLICY "Authenticated users can create records"
    ON posts FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'aud' = 'authenticated'
    );
```

---

## Step 5: Sync WorkOS User Data to Supabase

### Create User Profile on Sign-Up

**File**: `/src/lib/supabase/sync-user.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

/**
 * Sync WorkOS user to Supabase profiles table
 * Call this after successful WorkOS authentication
 */
export async function syncWorkOSUserToSupabase(
    user: any, // WorkOS user object
    token: string, // WorkOS access token
) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        },
    );

    // Check if user already exists
    const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

    if (existingUser) {
        // Update existing user
        return await supabase
            .from('profiles')
            .update({
                email: user.email,
                full_name: `${user.firstName} ${user.lastName}`,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
    }

    // Create new user profile
    return await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        full_name: `${user.firstName} ${user.lastName}`,
        avatar_url: user.profilePictureUrl,
        created_at: new Date().toISOString(),
    });
}
```

### Call During OAuth Callback

**File**: `/src/app/auth/callback/route.ts`

```typescript
import { authenticateWithCode } from '@workos-inc/authkit-nextjs';
import { syncWorkOSUserToSupabase } from '@/lib/supabase/sync-user';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    try {
        // Authenticate with WorkOS
        const response = await authenticateWithCode({ code });

        // Sync user to Supabase
        if (response.user && response.accessToken) {
            await syncWorkOSUserToSupabase(
                response.user,
                response.accessToken,
            );
        }

        return NextResponse.redirect(new URL('/home', request.url));
    } catch (error) {
        console.error('Authentication error:', error);
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }
}
```

---

## Step 6: Update Environment Variables

### Vercel Environment Variables

Add these to your Vercel project settings:

**Settings** → **Environment Variables**

```bash
# WorkOS Configuration
WORKOS_API_KEY=sk_test_a2V5XzAxSzRDR1cyMjJXSlFXQlI1RDdDUFczUUM3LGxDdWJmN2tNTDBjaHlRNjhUaEtsalQ0ZTM
WORKOS_CLIENT_ID=client_01K4CGW2J1FGWZYZJDMVWGQZBD
WORKOS_COOKIE_PASSWORD=your_secure_password_here

# WorkOS Auth URLs
NEXT_PUBLIC_WORKOS_REDIRECT_URI=https://atoms.tech/auth/callback
WORKOS_LOGOUT_REDIRECT_URI=https://atoms.tech/login

# Supabase Configuration (existing, keep as-is)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Verification Checklist

### Supabase Dashboard

- [ ] WorkOS added as third-party auth provider
- [ ] Issuer URL matches your WorkOS Client ID
- [ ] JWT template configured with correct claims

### WorkOS Dashboard

- [ ] JWT template created with Supabase claims
- [ ] Role claim includes user role
- [ ] Audience set to "authenticated"

### Your Application

- [ ] Supabase client initialized with WorkOS token
- [ ] RLS policies created on tables
- [ ] User sync working (profile created on signup)
- [ ] Can query Supabase with WorkOS access token
- [ ] RLS enforces user isolation

---

## Testing the Integration

### 1. Sign Up with WorkOS

```bash
bun dev
# Visit http://localhost:3000/auth/login
# Sign up with email
```

### 2. Verify User in Supabase

**Supabase Dashboard** → **SQL Editor**:

```sql
SELECT * FROM profiles WHERE email = 'your@email.com';
```

You should see your profile created automatically.

### 3. Test RLS Policy

**Supabase Dashboard** → **SQL Editor**:

```sql
-- This should show your data
SELECT * FROM profiles WHERE id = auth.uid();

-- This should fail or return empty (another user's data)
SELECT * FROM profiles WHERE id != auth.uid();
```

### 4. Query from Your App

Create a test page:

```typescript
import { withAuth } from '@workos-inc/authkit-nextjs';
import { createClient } from '@supabase/supabase-js';

export default async function TestPage() {
    const { user, accessToken } = await withAuth({
        ensureSignedIn: true,
    });

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        },
    );

    const { data, error } = await supabase
        .from('profiles')
        .select('*');

    return (
        <div>
            <h1>Supabase Query Test</h1>
            {error && <p>Error: {error.message}</p>}
            {data && (
                <pre>{JSON.stringify(data, null, 2)}</pre>
            )}
        </div>
    );
}
```

---

## Troubleshooting

### "Invalid issuer" error

Check that the issuer URL matches exactly:
```
https://api.workos.com/user_management/client_01K4CGW2J1FGWZYZJDMVWGQZBD
```

No trailing slashes or typos.

### "Unauthorized" when querying Supabase

Verify:
- WorkOS token is being passed in Authorization header
- JWT template includes `"aud": "authenticated"`
- RLS policies allow the operation
- User ID matches between WorkOS and Supabase

### "User not found" in profiles table

Run sync function during callback:
```typescript
await syncWorkOSUserToSupabase(user, accessToken);
```

### RLS policy not working

Check:
- RLS is enabled on the table
- Policy uses correct JWT claims
- `auth.uid()` matches WorkOS user ID

---

## Next Steps

1. ✅ Add WorkOS to Supabase dashboard
2. ✅ Create JWT template in WorkOS
3. ✅ Initialize Supabase client with tokens
4. ✅ Set up RLS policies
5. ✅ Sync users on signup
6. ✅ Test integration
7. ✅ Deploy to production

---

## Resources

- **Supabase Docs**: https://supabase.com/docs
- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security
- **WorkOS Docs**: https://workos.com/docs
- **JWT Claims**: https://supabase.com/docs/guides/auth/jwts

---

**You now have:** Seamless authentication with WorkOS + Supabase + RLS! 🎉
