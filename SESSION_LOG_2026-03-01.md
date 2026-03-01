# Session Log - March 1, 2026

## What Was Done: Fix Authentication

### Problem
Authentication was completely disabled since November 2025 due to a redirect loop. The root cause was a **cookie/localStorage mismatch**: the middleware checked for `sb-access-token` and `sb-refresh-token` cookies, but the Supabase client stores sessions in `localStorage`. The middleware never found a session, causing an infinite redirect loop between login and dashboard.

Workarounds that were in place:
- Middleware auth check commented out entirely (lines 24-30)
- Signin page had a 5-second delay before redirect
- Signin page used `window.location.href` instead of Next.js router
- All API routes were completely unauthenticated — any caller could pass any `user_id`

### Solution Applied

**Approach**: Client-side auth via AuthContext (already working) + server-side API route auth via Bearer token verification. No `@supabase/ssr` needed — keeps Capacitor mobile builds and embedded iframe mode working.

### Files Created (2)
- `utils/apiAuth.ts` — Server-side utility that extracts and verifies `Authorization: Bearer <token>` headers using `supabase.auth.getUser(token)`
- `utils/apiFetch.ts` — Client-side fetch wrapper that gets the current Supabase session and attaches the access token to all API requests

### API Routes Secured (23 files)
All API routes now verify the user's Bearer token before processing. `user_id` is extracted from the verified token instead of trusting client-provided values.

Updated routes:
- `analytics/forecast`, `analytics/spending-change`
- `categories` (POST/PUT/DELETE — GET stays public)
- `create-checkout-session`
- `estimates/[id]/pdf`, `estimates/send`
- `exports/year-end`
- `gamification`, `insights`
- `item-rules`, `item-rules/match`
- `line-items`
- `memory-suggestions`
- `merchant-rules`, `merchant-rules/match`
- `ocr-receipt`
- `price-history`
- `projects`, `projects/[id]`
- `recurring-expenses`, `recurring-expenses/generate`
- `subscriptions`, `subscriptions/detect`

Skipped (use their own auth): `seed-demo`, `webhooks/stripe`

### Client-Side Updates (12 files, ~33 call sites)
All `fetch('/api/...')` calls replaced with `apiFetch('/api/...')`:
- `app/(expenses)/expenses/dashboard/page.tsx`
- `app/(expenses)/expenses/page.tsx`
- `app/(expenses)/subscriptions/page.tsx`
- `app/(expenses)/projects/new/page.tsx`
- `app/(expenses)/projects/[id]/page.tsx`
- `app/checkout/page.tsx`
- `app/expenses/new/page.tsx`
- `app/recurring/page.tsx`
- `app/profile/page.tsx`
- `components/MerchantRulesManager.tsx`
- `components/ItemCategoryRulesManager.tsx`
- `lib/learningDetection.ts`

### Auth Page Cleanup
- Deleted `app/auth/signin/page.tsx` (buggy duplicate with 5-second delay and debug logs)
- Kept `app/auth/login/page.tsx` (clean implementation)
- Updated 3 pages linking to `/auth/signin` → `/auth/login`
- Removed `/auth/signin` from `PUBLIC_ROUTES` in `contexts/AuthContext.tsx`

### Middleware Cleanup
- Removed all dead cookie-checking code from `middleware.ts`
- Simplified to a no-op pass-through (auth is handled elsewhere)

### Commit
`e0ddb75` — `fix: Re-enable authentication and secure all API routes`

---

## Remaining Work

### Still Outstanding
- 278+ uncommitted files (mostly WSL file mode noise, but includes real content)
- Manifest 401 on Vercel preview URLs — needs investigation
- CRON_SECRET env var needs setting in Vercel
- Budget tracking, multi-currency, enhanced analytics (not started)
- Comprehensive testing (180+ items in TESTING_CHECKLIST.md)

### Testing This Auth Fix
1. Login flow: Navigate to app → redirected to login → sign in → lands on dashboard
2. Protected routes: Visit `/expenses` without logging in → redirected to login
3. API security: Call `/api/insights` without Bearer token → 401 response
4. Expense creation: Log in → add expense → verify it saves with correct user_id
5. Dashboard: All data loads correctly
6. Logout: Click logout → session cleared → redirected to login
