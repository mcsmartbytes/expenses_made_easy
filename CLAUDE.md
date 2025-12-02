# Expenses Made Easy - Project Context

## Quick Reference

| Item | Value |
|------|-------|
| **Live URL** | https://expenses-made-easy-opal.vercel.app/ |
| **Framework** | Next.js 14 (App Router) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Styling** | Tailwind CSS |
| **AI/OCR** | OpenAI GPT-4o-mini |
| **Payments** | Stripe |
| **Hosting** | Vercel |

---

## Project Purpose

Business expense tracking app for self-employed individuals and small businesses. IRS Schedule C compliant with tax deduction tracking, receipt OCR, mileage logging, and recurring expense management.

---

## Key Features

1. **Expense Tracking** - CRUD with categories, business/personal classification
2. **Receipt OCR** - AI extracts vendor, amount, tax breakdown from photos
3. **Mileage Tracking** - GPS auto-tracking, $0.67/mile IRS rate
4. **Recurring Expenses** - Weekly/monthly/quarterly/annual auto-generation
5. **Tax Reports** - Schedule C breakdown, CSV export
6. **PWA** - Installable on mobile, offline support
7. **Budgets** - Category-based spending limits

---

## File Structure

```
app/
├── api/
│   ├── categories/           # GET/POST/PUT/DELETE
│   ├── ocr-receipt/          # POST - AI receipt scan
│   └── recurring-expenses/   # CRUD + /generate
├── expense-dashboard/        # Main dashboard
├── expenses/                 # List + /new for adding
├── recurring/                # Recurring expense management
├── mileage/                  # GPS tracking + history
├── reports/                  # Tax reports
├── profile/                  # Categories + industry
├── budgets/                  # Budget tracking
├── receipts/                 # Receipt gallery
└── auth/                     # login/signup/callback

components/
└── Navigation.tsx            # Main nav (8 items)

utils/
├── supabase.ts               # Client-side Supabase
├── supabaseAdmin.ts          # Server-side (bypasses RLS)
└── industryCategories.ts     # 13 industry presets
```

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `expenses` | Main expense records |
| `categories` | User categories with deduction % |
| `mileage` | Trip records with GPS data |
| `recurring_expenses` | Templates for auto-generation |
| `budgets` | Spending limits by category |
| `user_profiles` | Industry selection |

---

## API Quick Reference

```typescript
// Categories
GET    /api/categories
POST   /api/categories        { categories: [...], user_id }
PUT    /api/categories        { id, ...updates }
DELETE /api/categories?id=xxx

// Receipt OCR
POST   /api/ocr-receipt       { image: base64 }

// Recurring
GET    /api/recurring-expenses?user_id=xxx
POST   /api/recurring-expenses { user_id, amount, description, frequency, ... }
PUT    /api/recurring-expenses { id, ...updates }
DELETE /api/recurring-expenses?id=xxx
POST   /api/recurring-expenses/generate { user_id }
```

---

## Common Patterns

### Supabase Query (Client)
```typescript
const { data, error } = await supabase
  .from('expenses')
  .select('*, categories(name, icon)')
  .eq('user_id', user.id)
  .order('date', { ascending: false });
```

### Supabase Admin (Server - bypasses RLS)
```typescript
import { supabaseAdmin } from '@/utils/supabaseAdmin';
const { data } = await supabaseAdmin.from('categories').select('*');
```

### Page Component Pattern
```typescript
'use client';
import Navigation from '@/components/Navigation';
import { supabase } from '@/utils/supabase';

export default function PageName() {
  // State, effects, handlers
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Content */}
      </main>
    </div>
  );
}
```

---

## Navigation Items

```typescript
const navItems = [
  { href: '/expense-dashboard', label: 'Dashboard' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/recurring', label: 'Recurring' },
  { href: '/budgets', label: 'Budgets' },
  { href: '/receipts', label: 'Receipts' },
  { href: '/mileage', label: 'Mileage' },
  { href: '/reports', label: 'Reports' },
  { href: '/profile', label: 'Profile' },
];
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
```

---

## Recurring Expense Frequencies

- `weekly` - Every 7 days
- `biweekly` - Every 14 days
- `monthly` - Same day next month
- `quarterly` - Every 3 months
- `annually` - Every 12 months

Auto-generation happens on dashboard load via `/api/recurring-expenses/generate`.

---

## Tax Deduction Logic

Categories have `deduction_percentage` (0, 50, or 100).
- 100% = Fully deductible (office supplies, software)
- 50% = Partially deductible (meals)
- 0% = Not deductible (personal)

Reports calculate: `amount * (deduction_percentage / 100)`

---

## PWA Files

- `/public/manifest.json` - App manifest
- `/public/sw.js` - Service worker
- `/public/icons/` - App icons (192x192, 512x512)

---

## Integration

This app can be:
1. **Standalone** - Used at expenses-made-easy-opal.vercel.app
2. **Embedded** - Integrated via iframe into client websites

Demo integration at: https://sealn-super-site.vercel.app/admin/expense-tracker
