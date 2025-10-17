# WorkOS Migration - Quick Start Guide

## ⚡ 5-Minute Setup

### 1️⃣ Configure Environment Variables

Add to `.env.local`:

```bash
# WorkOS (get from https://dashboard.workos.com/)
WORKOS_API_KEY=sk_test_...
WORKOS_CLIENT_ID=project_01...
WORKOS_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_WORKOS_CLIENT_ID=project_01...
```

### 2️⃣ Update Main Middleware

Edit `/src/middleware.ts`:

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

### 3️⃣ Configure OAuth Providers in WorkOS Dashboard

**GitHub OAuth**:
1. Go to WorkOS Dashboard → Authentication → Providers
2. Add GitHub OAuth credentials
3. Set Redirect URI: `http://localhost:3000/auth/callback`

**Google OAuth**:
1. Go to WorkOS Dashboard → Authentication → Providers
2. Add Google OAuth credentials
3. Set Redirect URI: `http://localhost:3000/auth/callback`

### 4️⃣ Test It

```bash
# Start dev server
bun dev

# Test login
# Navigate to http://localhost:3000/login

# Test GitHub OAuth
# Click "Sign in with GitHub"

# Test Google OAuth
# Click "Sign in with Google"
```

---

## 📚 Full Documentation

- **Complete Migration Guide**: See `WORKOS_MIGRATION_GUIDE.md`
- **Implementation Summary**: See `MIGRATION_SUMMARY.md`
- **API Reference**: See code comments in `src/lib/workos/`

---

## 🔍 What Changed

### For Users
Nothing! Login works the same way.

### For Developers

| Old | New |
|-----|-----|
| Supabase Auth | WorkOS Auth |
| `supabase.auth.signIn()` | `login()` action |
| `supabase.auth.signOut()` | `signOut()` action |
| `supabase.auth.onAuthStateChange()` | `useAuth()` hook |
| Session JWT | Session cookie |

---

## 🆘 Troubleshooting

### Login not working?
- Check WORKOS_API_KEY is set
- Verify WORKOS_CLIENT_ID is correct
- Check browser console for errors

### OAuth redirect loop?
- Verify WORKOS_REDIRECT_URI in .env matches WorkOS Dashboard
- Check OAuth provider credentials are correct
- Clear cookies and try again

### Profile not loading?
- Verify user_id cookie is set
- Check API endpoint `/api/auth/session` works
- Check Supabase database is accessible

---

## 🎯 Next Steps

1. **Set up WorkOS account**: https://dashboard.workos.com
2. **Add environment variables**: See step 1 above
3. **Update middleware**: See step 2 above
4. **Configure OAuth**: See step 3 above
5. **Test authentication**: See step 4 above
6. **Migrate user data**: Run `bun run scripts/importUsersToWorkOS.ts`
7. **Deploy to production**

---

## ✅ Verification Checklist

After setup, verify:

- [ ] You can log in with email/password
- [ ] You can sign up with email/password
- [ ] You can sign in with GitHub
- [ ] You can sign in with Google
- [ ] Session persists after refresh
- [ ] User profile loads correctly
- [ ] Logout clears session
- [ ] Organizations work normally

---

## 📁 Key Files

```
workos/
├── workosClient.ts    ← SDK initialization
├── workosAuth.ts      ← Auth functions
├── middleware.ts      ← Session validation
└── types.ts          ← TypeScript types

auth/
├── actions.ts        ← Login, signup, signout
├── github/route.ts   ← GitHub OAuth
├── google/route.ts   ← Google OAuth
└── callback/route.ts ← OAuth callback

hooks/
└── useAuth.ts        ← Client auth state

api/auth/
├── session/route.ts  ← Session check
├── profile/[userId]/ ← Get profile
└── signout/route.ts  ← Logout
```

---

## 🚀 Go Live Checklist

Before deploying to production:

- [ ] All 5 quick-start steps completed
- [ ] All auth flows tested locally
- [ ] Environment variables set in production
- [ ] Staging deployment successful
- [ ] No errors in logs
- [ ] User data migrated (optional)
- [ ] Team notified
- [ ] Rollback plan ready

---

## 💡 Tips

- **Use Chrome DevTools** to inspect cookies
- **Check Network tab** to debug OAuth flow
- **Read WorkOS docs** for advanced features
- **Monitor logs** during production deployment

---

**Ready?** Start with step 1 above! 🎉

For full details, see the migration guide and implementation summary.
