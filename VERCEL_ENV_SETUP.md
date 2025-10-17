# Vercel Environment Variables Setup

## Quick Setup for atoms.tech

### Step 1: Open Vercel Project Settings

1. Go to: https://vercel.com/dashboard
2. Select your project: **atoms.tech**
3. Click: **Settings** (gear icon)
4. Navigate to: **Environment Variables**

---

## Step 2: Add Environment Variables

### WorkOS Configuration

**Add these 3 variables:**

#### 1. WORKOS_API_KEY

- **Name**: `WORKOS_API_KEY`
- **Value**:
    ```
    sk_test_a2V5XzAxSzRDR1cyMjJXSlFXQlI1RDdDUFczUUM3LGxDdWJmN2tNTDBjaHlRNjhUaEtsalQ0ZTM
    ```
- **Environments**: Development, Preview, Production

#### 2. WORKOS_CLIENT_ID

- **Name**: `WORKOS_CLIENT_ID`
- **Value**:
    ```
    client_01K4CGW2J1FGWZYZJDMVWGQZBD
    ```
- **Environments**: Development, Preview, Production

#### 3. WORKOS_COOKIE_PASSWORD

- **Name**: `WORKOS_COOKIE_PASSWORD`
- **Value**: (Your generated 32+ character password from `openssl rand -base64 24`)
- **Environments**: Development, Preview, Production

### AuthKit URLs

#### 4. NEXT_PUBLIC_WORKOS_REDIRECT_URI

- **Name**: `NEXT_PUBLIC_WORKOS_REDIRECT_URI`
- **Value**: (For production)
    ```
    https://atoms.tech/auth/callback
    ```
- **Environments**: Production ONLY
- **Note**: "NEXT_PUBLIC" prefix makes it accessible in browser

#### 5. WORKOS_LOGOUT_REDIRECT_URI

- **Name**: `WORKOS_LOGOUT_REDIRECT_URI`
- **Value**: (For production)
    ```
    https://atoms.tech/login
    ```
- **Environments**: Production ONLY

### Supabase Configuration (Keep Existing)

Verify these are already set:

- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- `NEXT_PUBLIC_APP_URL` ✅

---

## Step 3: Configure Per Environment

### Development Environment

```
WORKOS_API_KEY=sk_test_...
WORKOS_CLIENT_ID=client_...
WORKOS_COOKIE_PASSWORD=your_password
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/auth/callback
WORKOS_LOGOUT_REDIRECT_URI=http://localhost:3000/login
```

### Preview Environment (Staging)

```
WORKOS_API_KEY=sk_test_... (or staging key)
WORKOS_CLIENT_ID=client_...
WORKOS_COOKIE_PASSWORD=your_password
NEXT_PUBLIC_WORKOS_REDIRECT_URI=https://staging.atoms.tech/auth/callback
WORKOS_LOGOUT_REDIRECT_URI=https://staging.atoms.tech/login
```

### Production Environment

```
WORKOS_API_KEY=sk_live_... (production key from WorkOS)
WORKOS_CLIENT_ID=client_... (production client ID)
WORKOS_COOKIE_PASSWORD=your_password
NEXT_PUBLIC_WORKOS_REDIRECT_URI=https://atoms.tech/auth/callback
WORKOS_LOGOUT_REDIRECT_URI=https://atoms.tech/login
```

---

## Step 4: Add Variables in Vercel UI

### For Each Variable:

1. Click **+ Add New**
2. Fill in:
    - **Name**: (e.g., `WORKOS_API_KEY`)
    - **Value**: (the actual value)
    - **Environment**: Select all that apply
3. Click **Save**

**Example for WORKOS_API_KEY:**

```
┌─────────────────────────────────────┐
│ Name                                │
│ WORKOS_API_KEY                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Value                               │
│ sk_test_a2V5XzAxSzRDR1cyMjJXSlFXQlI│
│ 1RDdDUFczUUM3LGxDdWJmN2tNTDBjaHlRNjg│
│ UaEtsalQ0ZTM                        │
└─────────────────────────────────────┘

☑ Development
☑ Preview
☑ Production
```

---

## Step 5: Verify Configuration

After adding all variables:

1. **Development** environment should have:
    - WORKOS_API_KEY
    - WORKOS_CLIENT_ID
    - WORKOS_COOKIE_PASSWORD
    - NEXT_PUBLIC_WORKOS_REDIRECT_URI (localhost)
    - WORKOS_LOGOUT_REDIRECT_URI (localhost)

2. **Preview** environment should have:
    - Same as Development (or staging URLs)

3. **Production** environment should have:
    - WORKOS*API_KEY (sk_live*...)
    - WORKOS_CLIENT_ID
    - WORKOS_COOKIE_PASSWORD
    - NEXT_PUBLIC_WORKOS_REDIRECT_URI (https://atoms.tech)
    - WORKOS_LOGOUT_REDIRECT_URI (https://atoms.tech)

---

## Step 6: Deploy

After adding variables:

1. **Option A - Auto Deploy**
    - If connected to Git, push to GitHub
    - Vercel automatically redeploys with new env vars

2. **Option B - Manual Deploy**
    - Go to Vercel Deployments
    - Click "Redeploy" on latest deployment
    - Or push a new commit

---

## Testing Production Deployment

After deployment:

1. Visit: **https://atoms.tech/auth/login**
2. You should see the WorkOS AuthKit login page
3. Test signup:
    - Enter email and password
    - Should redirect to dashboard
4. Verify in WorkOS Dashboard:
    - User should appear in User Management

---

## Troubleshooting

### "Invalid redirect URI" on Production

Check:

- `NEXT_PUBLIC_WORKOS_REDIRECT_URI` matches exactly: `https://atoms.tech/auth/callback`
- No trailing slashes
- URL is set to Production environment in Vercel

### Environment Variables Not Applied

- Wait 5 minutes after adding variables
- Or manually redeploy the project

### Preview Deployments Not Working

- Add separate variables for Preview environment
- Or ensure Development variables are also set for Preview

### localhost Not Working After Deploy

Make sure `.env.local` still exists locally with development URLs:

```
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/auth/callback
WORKOS_LOGOUT_REDIRECT_URI=http://localhost:3000/login
```

---

## Quick Reference

### Copy-Paste Values

**For Vercel:**

```
WORKOS_API_KEY = sk_test_a2V5XzAxSzRDR1cyMjJXSlFXQlI1RDdDUFczUUM3LGxDdWJmN2tNTDBjaHlRNjhUaEtsalQ0ZTM

WORKOS_CLIENT_ID = client_01K4CGW2J1FGWZYZJDMVWGQZBD

WORKOS_COOKIE_PASSWORD = [YOUR GENERATED PASSWORD]

NEXT_PUBLIC_WORKOS_REDIRECT_URI = https://atoms.tech/auth/callback

WORKOS_LOGOUT_REDIRECT_URI = https://atoms.tech/login
```

---

## Verification Checklist

- [ ] Logged into Vercel Dashboard
- [ ] Selected atoms.tech project
- [ ] Opened Environment Variables section
- [ ] Added WORKOS_API_KEY
- [ ] Added WORKOS_CLIENT_ID
- [ ] Added WORKOS_COOKIE_PASSWORD
- [ ] Added NEXT_PUBLIC_WORKOS_REDIRECT_URI (production)
- [ ] Added WORKOS_LOGOUT_REDIRECT_URI (production)
- [ ] Verified Supabase variables exist
- [ ] Triggered deployment
- [ ] Tested https://atoms.tech/auth/login
- [ ] Verified user creation in WorkOS Dashboard

---

## Next Steps

1. ✅ Add environment variables to Vercel
2. ✅ Trigger deployment
3. ✅ Test production at https://atoms.tech/auth/login
4. ✅ Verify user creation in WorkOS
5. ✅ Test Supabase + AuthKit integration (see SUPABASE_AUTHKIT_INTEGRATION.md)

---

**Done!** Your atoms.tech production environment is configured. 🚀
