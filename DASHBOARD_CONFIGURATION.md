# WorkOS Dashboard Configuration for atoms.tech

## Your Credentials

```
API Key:   sk_test_a2V5XzAxSzRDR1cyMjJXSlFXQlI1RDdDUFczUUM3LGxDdWJmN2tNTDBjaHlRNjhUaEtsalQ0ZTM
Client ID: client_01K4CGW2J1FGWZYZJDMVWGQZBD
```

---

## ✅ Configuration Steps in WorkOS Dashboard

### Step 1: Verify API Key & Client ID

**Location**: https://dashboard.workos.com/api-keys

Your credentials are already active:

- ✅ API Key: `sk_test_a2V5YXo...` (test environment)
- ✅ Client ID: `client_01K4CGW2...`

---

### Step 2: Configure Redirect URIs

**Location**: https://dashboard.workos.com/authentication

**Click "Redirects"** and add these URIs:

**Development**:

```
http://localhost:3000/auth/callback
```

**Production (atoms.tech)**:

```
https://atoms.tech/auth/callback
```

**Click "Add URI" for each one**

---

### Step 3: Set Login Endpoint

**Location**: https://dashboard.workos.com/authentication

**Under "Redirects" section:**

Set **Login Endpoint** to:

```
https://atoms.tech/auth/login
```

(This is where unauthenticated users are redirected)

---

### Step 4: Set Logout Redirect

**Location**: https://dashboard.workos.com/authentication

**Under "Sessions" section:**

Set **Logout Redirect** to:

```
https://atoms.tech/login
```

(Where users are sent after signing out)

---

### Step 5: Activate User Management

**Location**: https://dashboard.workos.com/overview

**Click "Set up User Management"** button

Follow the setup wizard to activate AuthKit.

---

### Step 6: Configure OAuth Providers (Optional)

#### GitHub OAuth

**Location**: https://dashboard.workos.com/authentication

**Under "Providers" → "GitHub":**

1. Get GitHub credentials from: https://github.com/settings/developers
2. Create OAuth App:
    - Application name: atoms.tech
    - Authorization callback URL: `https://atoms.tech/auth/callback`
3. Copy:
    - Client ID
    - Client Secret
4. Paste into WorkOS Dashboard

#### Google OAuth

**Location**: https://dashboard.workos.com/authentication

**Under "Providers" → "Google":**

1. Get Google credentials from: https://console.cloud.google.com/
2. Create OAuth 2.0 Credentials:
    - Type: Web application
    - Authorized redirect URIs: `https://atoms.tech/auth/callback`
3. Copy:
    - Client ID
    - Client Secret
4. Paste into WorkOS Dashboard

---

## 📋 Development Environment Setup

### 1. Generate Secure Password

```bash
openssl rand -base64 24
```

Example output:

```
AbC123dEfG456hIjK789lMnOpQrStUvW
```

### 2. Create `.env.local`

Copy `.env.local.template` to `.env.local`:

```bash
cp .env.local.template .env.local
```

Edit `.env.local` and replace:

```
WORKOS_COOKIE_PASSWORD='AbC123dEfG456hIjK789lMnOpQrStUvW'
```

Keep the test credentials as-is:

```
WORKOS_API_KEY='sk_test_a2V5XzAxSzRDR1cyMjJXSlFXQlI1RDdDUFczUUM3LGxDdWJmN2tNTDBjaHlRNjhUaEtsalQ0ZTM'
WORKOS_CLIENT_ID='client_01K4CGW2J1FGWZYZJDMVWGQZBD'
NEXT_PUBLIC_WORKOS_REDIRECT_URI='http://localhost:3000/auth/callback'
WORKOS_LOGOUT_REDIRECT_URI='http://localhost:3000/login'
```

### 3. Test Locally

```bash
bun dev
```

Visit: http://localhost:3000/auth/login

You should see the WorkOS AuthKit hosted login page.

---

## 🚀 Production Setup for atoms.tech

### Production Environment Variables

Set these in Vercel or your production environment:

```bash
# Same test credentials for testing
WORKOS_API_KEY='sk_test_a2V5YXo...' # (will be sk_live_... in production)
WORKOS_CLIENT_ID='client_01K4CGW2...' # (production client ID)
WORKOS_COOKIE_PASSWORD='your_secure_password' # Use same generated password

# Production URLs
NEXT_PUBLIC_WORKOS_REDIRECT_URI='https://atoms.tech/auth/callback'
WORKOS_LOGOUT_REDIRECT_URI='https://atoms.tech/login'

# Keep existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL='...'
NEXT_PUBLIC_SUPABASE_ANON_KEY='...'
```

### Production Redirects in Dashboard

Make sure these are configured:

**Primary Redirect URI**:

```
https://atoms.tech/auth/callback
```

**Login Endpoint**:

```
https://atoms.tech/auth/login
```

**Logout Redirect**:

```
https://atoms.tech/login
```

---

## ✅ Verification Checklist

After configuration, verify in WorkOS Dashboard:

- [ ] API Key visible under "API Keys"
- [ ] Client ID matches: `client_01K4CGW2J1FGWZYZJDMVWGQZBD`
- [ ] Redirects configured:
    - [ ] `http://localhost:3000/auth/callback` (development)
    - [ ] `https://atoms.tech/auth/callback` (production)
- [ ] Login Endpoint set: `https://atoms.tech/auth/login`
- [ ] Logout Redirect set: `https://atoms.tech/login`
- [ ] User Management activated
- [ ] OAuth providers configured (if needed)

---

## 🧪 Testing Your Setup

### Local Testing

1. **Start development server**:

    ```bash
    bun dev
    ```

2. **Visit login page**:

    ```
    http://localhost:3000/auth/login
    ```

3. **You should see**:
    - WorkOS AuthKit hosted login page
    - Option to sign up with email
    - (GitHub/Google buttons if configured)

4. **Test signup**:
    - Enter email and password
    - Click "Sign up"
    - Should redirect to dashboard

5. **Verify in WorkOS Dashboard**:
    - Go to: https://dashboard.workos.com/user-management/users
    - Your test account should appear

6. **Test login**:
    - Visit `/auth/logout` to logout
    - Visit `/auth/login` again
    - Enter credentials
    - Should authenticate successfully

---

## 📊 Configuration Summary

| Component       | Development                           | Production                         |
| --------------- | ------------------------------------- | ---------------------------------- |
| Redirect URI    | `http://localhost:3000/auth/callback` | `https://atoms.tech/auth/callback` |
| Login Endpoint  | `http://localhost:3000/auth/login`    | `https://atoms.tech/auth/login`    |
| Logout Redirect | `http://localhost:3000/login`         | `https://atoms.tech/login`         |
| API Key         | `sk_test_a2V5...`                     | `sk_live_...` (production)         |
| Client ID       | `client_01K4CGW2...`                  | `client_...` (production)          |

---

## 🔐 Security Notes

✅ **Test credentials are for development only**
✅ **Generate production credentials before going live**
✅ **Use strong cookie password (32+ characters)**
✅ **Keep `.env.local` out of git** (add to `.gitignore`)
✅ **Use Vercel secrets for production**
✅ **Enable HTTPS in production** (automatic with Vercel)

---

## 🚀 Next Steps

1. ✅ Generate cookie password: `openssl rand -base64 24`
2. ✅ Copy `.env.local.template` to `.env.local`
3. ✅ Update `WORKOS_COOKIE_PASSWORD` in `.env.local`
4. ✅ Configure WorkOS Dashboard (steps above)
5. ✅ Test locally: `bun dev`
6. ✅ Deploy to production when ready

---

**Ready to launch!** 🎉

All configuration is complete. Just generate your password and test!
