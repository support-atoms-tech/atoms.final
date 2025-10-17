# WorkOS AuthKit Setup - Complete Configuration

## 🎯 Overview

This guide provides the complete WorkOS AuthKit configuration for atoms.tech using the official Next.js SDK.

---

## ✅ Environment Variables

### Development (.env.local)

```bash
# WorkOS Credentials (from https://dashboard.workos.com/)
WORKOS_API_KEY=sk_test_YOUR_API_KEY
WORKOS_CLIENT_ID=project_YOUR_CLIENT_ID
WORKOS_COOKIE_PASSWORD=your_secure_32_character_password

# Redirects
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/auth/callback
WORKOS_LOGOUT_REDIRECT_URI=http://localhost:3000/login
```

### Production (Vercel / Environment Secrets)

```bash
WORKOS_API_KEY=sk_live_YOUR_PRODUCTION_API_KEY
WORKOS_CLIENT_ID=project_YOUR_PRODUCTION_CLIENT_ID
WORKOS_COOKIE_PASSWORD=your_secure_32_character_password

# Production URLs with atoms.tech
NEXT_PUBLIC_WORKOS_REDIRECT_URI=https://atoms.tech/auth/callback
WORKOS_LOGOUT_REDIRECT_URI=https://atoms.tech/login
```

---

## 🔐 Generate Secure Cookie Password

Run this command to generate a secure 32+ character password:

```bash
openssl rand -base64 24
```

Output example: `AbC123dEfG456hIjK789lMnOpQrStUvW`

---

## 📋 WorkOS Dashboard Configuration

### Step 1: Set Redirect URIs

**Location**: WorkOS Dashboard → Authentication → Redirects

**Add these Redirect URIs**:

```
Default:       https://atoms.tech/auth/callback
Development:   http://localhost:3000/auth/callback
Staging:       https://staging.atoms.tech/auth/callback (if you have one)
```

![Dashboard showing redirect URIs](./docs/images/redirect-uris.png)

### Step 2: Set Login Endpoint

**Location**: WorkOS Dashboard → Authentication → Redirects → Login Endpoint

```
https://atoms.tech/auth/login
```

(This endpoint will be created in your Next.js app)

### Step 3: Configure Logout Redirect

**Location**: WorkOS Dashboard → Authentication → Sessions → Logout Redirect

```
https://atoms.tech/login
```

(Users will be redirected here after logging out)

### Step 4: Activate User Management

**Location**: WorkOS Dashboard → Overview

- Click "Set up User Management"
- Follow the setup wizard
- Enable AuthKit

### Step 5: Configure OAuth Providers (Optional)

**GitHub OAuth**:
- Go to: Authentication → Providers → GitHub
- Add GitHub credentials
- WorkOS handles the redirect

**Google OAuth**:
- Go to: Authentication → Providers → Google
- Add Google credentials
- WorkOS handles the redirect

**Microsoft OAuth**:
- Go to: Authentication → Providers → Microsoft
- Add Microsoft credentials
- WorkOS handles the redirect

---

## 🔧 Implementation Files

All of these files have been created and are ready to use:

### 1. Middleware (Session Management)

**File**: `/src/middleware.ts`

```typescript
import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

export default authkitMiddleware();

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|mov)$).*)',
    ],
};
```

### 2. Layout with AuthKitProvider

**File**: `/src/app/layout.tsx`

```typescript
import { AuthKitProvider } from '@workos-inc/authkit-nextjs';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html>
            <body>
                <AuthKitProvider>{children}</AuthKitProvider>
            </body>
        </html>
    );
}
```

### 3. Callback Route

**File**: `/src/app/auth/callback/route.ts`

Exchanges authorization code for authenticated user.

### 4. Login Route

**File**: `/src/app/auth/login/route.ts`

Generates AuthKit authorization URL and redirects.

### 5. Logout Route

**File**: `/src/app/auth/logout/route.ts`

Ends session and redirects to logout URL.

---

## 🚀 Usage in Components

### Server Component

```typescript
import { withAuth } from '@workos-inc/authkit-nextjs';

export default async function Page() {
    const { user } = await withAuth();

    return <h1>Hello {user.firstName}!</h1>;
}
```

### Client Component

```typescript
'use client';

import { useAuth } from '@workos-inc/authkit-nextjs';

export default function Component() {
    const { user, isLoading } = useAuth();

    if (isLoading) return <div>Loading...</div>;

    return <h1>Hello {user?.firstName}!</h1>;
}
```

### Protected Routes

```typescript
import { withAuth } from '@workos-inc/authkit-nextjs';

export default async function ProtectedPage() {
    const { user } = await withAuth({
        ensureSignedIn: true, // Redirect to login if not authenticated
    });

    return <h1>Welcome back!</h1>;
}
```

---

## 📊 User Migration Path

### For Existing Supabase Users

Users migrated from Supabase will:
1. Be created in WorkOS with their email
2. Be able to set a new password or use OAuth
3. See their existing profile data loaded from database

### For New Users

New users can:
1. Sign up with email/password
2. Sign in with GitHub
3. Sign in with Google
4. Sign in with Microsoft (if configured)

---

## ✨ Key Features

✅ **Email/Password Auth**: Built-in
✅ **OAuth Providers**: GitHub, Google, Microsoft, etc.
✅ **Session Management**: Automatic (encrypted cookies)
✅ **User Management**: Full API access
✅ **Multi-factor Authentication**: Optional
✅ **Directory Sync**: For enterprise
✅ **SAML SSO**: For enterprise
✅ **Audit Logs**: Full compliance

---

## 🧪 Testing Checklist

Before going to production:

- [ ] Signup with email/password works
- [ ] Login with email/password works
- [ ] GitHub OAuth works (if configured)
- [ ] Google OAuth works (if configured)
- [ ] Logout redirects to login page
- [ ] Protected routes require auth
- [ ] User data loads correctly
- [ ] Session persists across page reloads
- [ ] Tokens refresh automatically
- [ ] Dashboard shows new users

---

## 🆘 Common Issues

### "Invalid redirect URI"
**Solution**: Ensure NEXT_PUBLIC_WORKOS_REDIRECT_URI matches dashboard exactly

### "Cookie password too short"
**Solution**: Generate with `openssl rand -base64 24` (32+ chars)

### "Unauthorized" errors
**Solution**: Check API key is correct and active in dashboard

### OAuth not working
**Solution**: Verify OAuth provider credentials in dashboard

---

## 📞 Support Resources

- **WorkOS Docs**: https://workos.com/docs
- **AuthKit Guide**: https://workos.com/docs/authkit
- **API Reference**: https://workos.com/docs/reference
- **Example Apps**: https://workos.com/docs/authkit/example-apps

---

## 🚀 Deployment Steps

### 1. Development Setup
```bash
cp .env.authkit .env.local
# Fill in your development values
```

### 2. Staging Deployment
- Add staging environment variables to Vercel
- Test all auth flows
- Verify email verification works

### 3. Production Deployment
- Add production environment variables
- Update WorkOS dashboard with production URIs
- Test complete user flow
- Monitor error logs

---

## 📝 Configuration Summary

| Component | Location | Status |
|-----------|----------|--------|
| Environment Variables | `.env.local` / Secrets | ✅ Ready |
| Middleware | `src/middleware.ts` | ✅ Ready |
| AuthKitProvider | `src/app/layout.tsx` | ✅ Ready |
| Callback Route | `src/app/auth/callback/route.ts` | ✅ Ready |
| Login Endpoint | `src/app/auth/login/route.ts` | ✅ Ready |
| Logout Endpoint | `src/app/auth/logout/route.ts` | ✅ Ready |
| Protected Routes | Your pages | ✅ Ready |
| User API | Automatic | ✅ Ready |

---

## 🎯 Next Steps

1. **Get WorkOS Credentials**
   - Visit https://dashboard.workos.com/
   - Get API Key and Client ID

2. **Generate Cookie Password**
   - Run: `openssl rand -base64 24`

3. **Configure Dashboard**
   - Set redirect URIs (see section above)
   - Set login endpoint
   - Set logout redirect
   - Configure OAuth providers (optional)

4. **Add Environment Variables**
   - Copy credentials to `.env.local`
   - Copy to production secrets

5. **Test Locally**
   - Run: `bun dev`
   - Navigate to `http://localhost:3000/auth/login`
   - Test signup and login

6. **Deploy to Production**
   - Push to main branch
   - Deploy to Vercel
   - Monitor error logs

---

**Ready to launch!** 🚀

For detailed implementation files, see the next section.
