# Supabase → WorkOS AuthKit Migration Guide

## ✅ Completed Components

### Phase 1: Setup Complete

- ✅ WorkOS SDK installed (`@workos-inc/node@7.71.0`)
- ✅ WorkOS client and auth modules created
- ✅ Types and interfaces defined

### Phase 2: Migration Scripts Ready

- ✅ `scripts/exportSupabaseUsers.ts` - Export users from Supabase
- ✅ `scripts/importUsersToWorkOS.ts` - Import users to WorkOS

### Phase 3: Backend Code Updated

- ✅ `/src/lib/workos/workosClient.ts` - WorkOS SDK initialization
- ✅ `/src/lib/workos/workosAuth.ts` - Auth helper functions
- ✅ `/src/lib/workos/types.ts` - TypeScript interfaces
- ✅ `/src/lib/workos/middleware.ts` - Session middleware
- ✅ `/src/app/(auth)/auth/actions.ts` - Login, signup, signout for WorkOS
- ✅ `/src/app/(auth)/auth/github/route.ts` - GitHub OAuth
- ✅ `/src/app/(auth)/auth/google/route.ts` - Google OAuth
- ✅ `/src/app/(auth)/auth/callback/route.ts` - OAuth callback handler
- ✅ `/src/hooks/useAuth.ts` - Client-side auth hook
- ✅ `/src/lib/providers/user.provider.tsx` - User context provider
- ✅ `/src/app/(protected)/api/auth/session/route.ts` - Session API
- ✅ `/src/app/(protected)/api/auth/profile/[userId]/route.ts` - Profile API
- ✅ `/src/app/(protected)/api/auth/signout/route.ts` - Signout API

---

## 🔧 Configuration Required

### 1. Environment Variables (.env / .env.local)

Add these WorkOS credentials:

```bash
# WorkOS Configuration (from your WorkOS dashboard)
WORKOS_API_KEY=sk_your_api_key_here
WORKOS_CLIENT_ID=your_client_id_here
WORKOS_REDIRECT_URI=https://yourdomain.com/auth/callback
NEXT_PUBLIC_WORKOS_CLIENT_ID=your_client_id_here

# Keep existing Supabase variables (for database queries)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2. OAuth Provider Setup (WorkOS Dashboard)

1. **GitHub OAuth**:
    - Go to WorkOS Dashboard → Authentication → GitHub
    - Add your GitHub OAuth app credentials
    - Configure redirect URL

2. **Google OAuth**:
    - Go to WorkOS Dashboard → Authentication → Google
    - Add your Google OAuth app credentials
    - Configure redirect URL

3. **Email Verification** (Optional):
    - Configure email verification settings in WorkOS Dashboard
    - Adjust security requirements as needed

---

## 📋 Next Steps (In Order)

### Step 1: Update Main Middleware

Update `/src/middleware.ts` to use WorkOS middleware:

```typescript
import { type NextRequest } from 'next/server';

import { updateWorkOSSession } from '@/lib/workos/middleware';

export async function middleware(request: NextRequest) {
    return await updateWorkOSSession(request);
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|mov)$).*)',
    ],
};
```

### Step 2: Migrate User Data

```bash
# Export Supabase users
bun run scripts/exportSupabaseUsers.ts

# Review users-export.json in scripts/ directory

# Import to WorkOS
bun run scripts/importUsersToWorkOS.ts

# Check import-report.json for results
```

### Step 3: Add Database Migration

Create a migration to add `workos_user_id` column to profiles:

```sql
-- Add WorkOS user ID column
ALTER TABLE profiles ADD COLUMN workos_user_id TEXT UNIQUE;

-- Create mapping table for reference
CREATE TABLE user_id_mapping (
    supabase_user_id TEXT PRIMARY KEY,
    workos_user_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Step 4: Update Login & Signup Pages

The auth actions are already updated to use WorkOS, but ensure your login/signup pages use the new server actions:

**Login Page** (`/src/app/(auth)/login/page.tsx`):

- Ensure form submits to `login` action from `./auth/actions`
- GitHub button redirects to `/auth/github`
- Google button redirects to `/auth/google`

**Signup Page** (`/src/app/(auth)/signup/page.tsx`):

- Ensure form submits to `signup` action from `./auth/actions`

### Step 5: Test Authentication Flows

#### Email/Password Login

1. Navigate to `/login`
2. Enter email and password
3. Verify redirect to `/home` or preferred org

#### Email/Password Signup

1. Navigate to `/signup`
2. Enter name, email, password
3. Verify account creation
4. Verify automatic login redirect

#### GitHub OAuth

1. Click "Sign in with GitHub"
2. Authorize app
3. Verify user creation/linking in WorkOS
4. Verify redirect to dashboard

#### Google OAuth

1. Click "Sign in with Google"
2. Authorize app
3. Verify user creation/linking in WorkOS
4. Verify redirect to dashboard

### Step 6: Verify Data Integrity

After migration, verify:

```bash
# Check WorkOS users were created
curl -H "Authorization: Bearer $WORKOS_API_KEY" \
  https://api.workos.com/user_management/users

# Verify user can log in with old password
# (if password was imported)

# Verify OAuth users can log in with their providers

# Check that all organization/project relationships still work
```

---

## 🔑 Key Architecture Changes

### Before (Supabase Auth)

```
Login Request → Supabase Auth → Session Cookie → Supabase JWT
```

### After (WorkOS Auth)

```
Login Request → WorkOS Auth → Session Cookie (workos_session) → WorkOS User ID
```

### Database Integration

- **Still using Supabase** for database queries (profiles, organizations, projects)
- **WorkOS handles** authentication only
- User ID mapping maintains referential integrity

---

## 🧪 Testing Checklist

- [ ] Email/password login works
- [ ] Email/password signup works
- [ ] GitHub OAuth works
- [ ] Google OAuth works
- [ ] Session persists across page reloads
- [ ] Logout clears session and redirects to login
- [ ] User profile loads correctly after login
- [ ] Organization access controls still work
- [ ] Project access controls still work
- [ ] Admin pages still require admin role
- [ ] Unapproved users redirect to approval page

---

## 🆘 Troubleshooting

### Issue: "WORKOS_API_KEY not configured"

**Solution**: Ensure all environment variables are set and Next.js is restarted

### Issue: OAuth redirect loops

**Solution**:

- Verify WORKOS_REDIRECT_URI matches WorkOS Dashboard
- Check OAuth provider credentials in WorkOS Dashboard
- Verify callback route handles both code and state parameters

### Issue: User data not migrating

**Solution**:

- Check import-report.json for errors
- Verify Supabase database is accessible
- Check for duplicate emails (WorkOS requires unique emails)

### Issue: Session not persisting

**Solution**:

- Verify workos_session cookie is being set
- Check browser cookie settings
- Verify middleware is running on all protected routes

---

## 📚 Key Files Reference

| File                                  | Purpose                         |
| ------------------------------------- | ------------------------------- |
| `src/lib/workos/workosClient.ts`      | WorkOS SDK initialization       |
| `src/lib/workos/workosAuth.ts`        | Authentication helper functions |
| `src/lib/workos/middleware.ts`        | Server-side session validation  |
| `src/app/(auth)/auth/actions.ts`      | Login, signup, signout logic    |
| `src/hooks/useAuth.ts`                | Client-side auth state          |
| `src/lib/providers/user.provider.tsx` | User context management         |
| `scripts/exportSupabaseUsers.ts`      | Data export for migration       |
| `scripts/importUsersToWorkOS.ts`      | Data import from export         |

---

## 🚀 Deployment Strategy

### Staged Rollout

1. Deploy backend changes to staging
2. Test all auth flows in staging
3. Enable WorkOS for 10% of users (feature flag)
4. Monitor error rates
5. Gradually increase percentage
6. Full cutover when confident
7. Keep Supabase code as fallback for 2 weeks

### Rollback Plan

- Keep both auth implementations running for 2 weeks
- Feature flag to switch between implementations
- Monitor for issues before removing Supabase code

---

## ✨ Benefits of This Migration

✅ **Scalability** - WorkOS handles enterprise SSO, Directory Sync, etc.
✅ **Security** - Industry-standard authentication
✅ **Compliance** - SOC 2, HIPAA, GDPR ready
✅ **OAuth** - GitHub & Google out of the box
✅ **User Management** - Centralized user directory
✅ **Multi-Tenancy** - Built-in organization support
✅ **API-First** - Complete control via API
✅ **Less Maintenance** - WorkOS manages infrastructure

---

## 📞 Support

For issues during migration:

1. Check the WorkOS documentation: https://workos.com/docs
2. Review error logs in WorkOS Dashboard
3. Contact WorkOS support: support@workos.com
4. Check implementation in example files

---

## Timeline

- **Days 1-2**: Configuration & Environment Setup
- **Days 3-4**: User Migration (export → import)
- **Days 5-6**: Testing All Auth Flows
- **Days 7**: Staging Deployment & Validation
- **Days 8-9**: Production Rollout (staged)
- **Day 10+**: Monitoring & Cleanup

**Total: ~10 days for complete migration**
