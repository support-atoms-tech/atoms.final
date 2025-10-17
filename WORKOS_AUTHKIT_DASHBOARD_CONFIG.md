# WorkOS AuthKit Dashboard Configuration for atoms.tech

## 🚀 Setup Instructions

### Step 1: Generate Your Configuration

#### Generate Secure Cookie Password

Run this command in your terminal:

```bash
openssl rand -base64 24
```

**Example Output:**

```
AbC123dEfG456hIjK789lMnOpQrStUvW
```

Save this value - you'll need it for environment variables.

---

## 📋 Environment Variables

### Create `.env.local` (Development)

```bash
# WorkOS Credentials
WORKOS_API_KEY=sk_test_YOUR_API_KEY_HERE
WORKOS_CLIENT_ID=project_YOUR_CLIENT_ID_HERE
WORKOS_COOKIE_PASSWORD=AbC123dEfG456hIjK789lMnOpQrStUvW

# Development Redirects
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/auth/callback
WORKOS_LOGOUT_REDIRECT_URI=http://localhost:3000/login

# Keep existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Create Production Secrets (Vercel / Production)

Add these to your production environment:

```bash
WORKOS_API_KEY=sk_live_YOUR_PRODUCTION_API_KEY
WORKOS_CLIENT_ID=project_YOUR_PRODUCTION_CLIENT_ID
WORKOS_COOKIE_PASSWORD=AbC123dEfG456hIjK789lMnOpQrStUvW

NEXT_PUBLIC_WORKOS_REDIRECT_URI=https://atoms.tech/auth/callback
WORKOS_LOGOUT_REDIRECT_URI=https://atoms.tech/login
```

---

## 🔑 WorkOS Dashboard Configuration

### 1. Get Your API Credentials

**Where**: https://dashboard.workos.com/

**Steps**:

1. Sign in to WorkOS Dashboard
2. Go to: API Keys (in sidebar)
3. Copy your **API Key** (starts with `sk_`)
4. Copy your **Client ID** (starts with `project_`)

**Use these values in environment variables above**

---

### 2. Configure Redirect URIs

**Where**: WorkOS Dashboard → Authentication → Redirects

**Add these Redirect URIs** (click "Add URI" for each):

#### Production

```
https://atoms.tech/auth/callback
```

#### Development

```
http://localhost:3000/auth/callback
```

#### Staging (if applicable)

```
https://staging.atoms.tech/auth/callback
```

**Screenshot Guide**:

- Click "Redirects" in the Authentication section
- Click "Add URI"
- Paste the URI
- Click "Add"
- Repeat for each URI

---

### 3. Set Login Endpoint

**Where**: WorkOS Dashboard → Authentication → Redirects → Login Endpoint

**Set this value**:

```
https://atoms.tech/auth/login
```

This tells WorkOS where to redirect users if they try to access the hosted login page directly.

---

### 4. Configure Logout Redirect

**Where**: WorkOS Dashboard → Authentication → Sessions → Logout Redirect

**Set this value**:

```
https://atoms.tech/login
```

Users will be redirected here after logging out.

---

### 5. Set Up User Management

**Where**: WorkOS Dashboard → Overview

**Steps**:

1. Look for "Set up User Management" button
2. Click it
3. Follow the setup wizard
4. This will activate AuthKit

---

### 6. Configure OAuth Providers (Optional but Recommended)

#### GitHub OAuth

**Where**: WorkOS Dashboard → Authentication → Providers → GitHub

**Steps**:

1. Click "GitHub"
2. You'll need GitHub OAuth credentials:
    - Go to: https://github.com/settings/developers
    - Click "New OAuth App"
    - Create an OAuth application
    - Copy: Client ID and Client Secret
3. Paste into WorkOS
4. WorkOS handles the rest automatically

#### Google OAuth

**Where**: WorkOS Dashboard → Authentication → Providers → Google

**Steps**:

1. Click "Google"
2. You'll need Google OAuth credentials:
    - Go to: https://console.cloud.google.com/
    - Create a new project
    - Enable Google+ API
    - Create OAuth 2.0 credentials
    - Copy: Client ID and Client Secret
3. Paste into WorkOS
4. WorkOS handles the rest automatically

#### Microsoft/Azure AD (Optional)

**Where**: WorkOS Dashboard → Authentication → Providers → Microsoft

**Steps**:

1. Click "Microsoft"
2. You'll need Microsoft Azure credentials
3. Paste into WorkOS

---

### 7. Optional: Email Verification

**Where**: WorkOS Dashboard → Authentication → Email Verification

**Configure**:

- Choose verification requirement (optional, required on signup, etc.)
- Customize email template (optional)
- Set sender address

---

## ✅ Verification Checklist

After configuration, verify everything is set up correctly:

- [ ] API Key copied to `.env.local`
- [ ] Client ID copied to `.env.local`
- [ ] Cookie password generated and added
- [ ] Redirect URIs added to WorkOS Dashboard
- [ ] Login endpoint configured
- [ ] Logout redirect configured
- [ ] User Management activated
- [ ] OAuth providers configured (if needed)

---

## 🧪 Test Your Setup

### 1. Start Development Server

```bash
bun dev
```

### 2. Test Login Endpoint

Navigate to: http://localhost:3000/auth/login

**What should happen**:

- You're redirected to WorkOS AuthKit hosted login page
- You can sign up with email/password
- After signup, you're redirected to `http://localhost:3000/home`

### 3. Test OAuth (if configured)

- Click "Sign in with GitHub" (if GitHub configured)
- Authorize the app
- You're redirected to `http://localhost:3000/home`
- A new user is created in WorkOS Dashboard

### 4. Verify in Dashboard

- Go to: https://dashboard.workos.com/
- Navigate to: User Management → Users
- You should see your test account

---

## 📁 Implementation Files Created

All these files are ready to use:

```
src/middleware.ts                     ← Session management
src/app/layout.tsx                    ← AuthKitProvider added
src/app/auth/login/route.ts           ← Login endpoint
src/app/auth/callback/route.ts        ← OAuth callback
src/app/auth/logout/route.ts          ← Logout endpoint
src/app/auth/server-example/page.tsx  ← Server component example
src/app/auth/client-example/page.tsx  ← Client component example
```

---

## 🔐 Security Features

✅ **Built-in**:

- Encrypted session cookies (HTTPS-only in production)
- CSRF protection (SameSite Lax)
- Automatic token refresh
- XSS prevention (HttpOnly cookies)
- Session expiry management

---

## 🚀 Next Steps

1. **Copy environment template**: `cp .env.authkit .env.local`
2. **Get credentials**: Visit https://dashboard.workos.com/
3. **Fill environment variables**: Add API Key, Client ID, Cookie Password
4. **Configure dashboard**: Follow steps above
5. **Test locally**: `bun dev`
6. **Deploy**: Push to production when ready

---

## 🆘 Troubleshooting

### "Invalid Redirect URI"

- Ensure `NEXT_PUBLIC_WORKOS_REDIRECT_URI` matches exactly in dashboard
- Check for trailing slashes
- Verify protocol (http vs https)

### "Session not being created"

- Check `WORKOS_COOKIE_PASSWORD` is set (32+ characters)
- Verify cookies are enabled in browser
- Check browser DevTools → Application → Cookies

### "OAuth redirect loops"

- Verify GitHub/Google credentials are correct in WorkOS Dashboard
- Check OAuth provider redirect URIs match
- Clear browser cookies and try again

### User not appearing in dashboard

- Check you're looking in the correct WorkOS Dashboard environment
- Wait a few seconds for user creation to complete
- Refresh the User Management page

---

## 📞 Support

- **WorkOS Documentation**: https://workos.com/docs/authkit
- **API Reference**: https://workos.com/docs/reference/authkit
- **Example Apps**: https://workos.com/docs/authkit/example-apps
- **Support Email**: support@workos.com

---

## 📊 Architecture

```
Your App (atoms.tech)
       ↓
   AuthKit Middleware (src/middleware.ts)
       ↓
   AuthKitProvider (src/app/layout.tsx)
       ↓
   AuthKit (hosted login: workos.com)
       ↓
   OAuth Providers (GitHub, Google, etc.)
       ↓
   Session Cookie (encrypted)
       ↓
   Protected Routes (next.js middleware)
```

---

**Everything is ready! Just add your WorkOS credentials and you're good to go.** 🎉

---

**Last Updated**: October 16, 2025
**Status**: Ready for Production
**Framework**: Next.js 15 + AuthKit 2.10.0
