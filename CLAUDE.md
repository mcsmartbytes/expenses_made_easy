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
3. **Mileage Tracking** - GPS auto-tracking, $0.67/mile IRS rate, native mobile support via Capacitor
4. **Recurring Expenses** - Weekly/monthly/quarterly/annual auto-generation
5. **Tax Reports** - Schedule C breakdown, CSV export
6. **PWA** - Installable on mobile, offline support
7. **Budgets** - Category-based spending limits
8. **Personal/Business Mode** - Global toggle that sets defaults for new expenses/mileage
9. **Smart Insights** - Actionable insights with quick actions (Set Budget, Mark Expected)
10. **Price Tracker** - Vendor comparison with savings recommendations
11. **User-Confirmed Learning** - Learns from user corrections, creates merchant/item rules

---

## File Structure

```
app/
├── api/
│   ├── categories/           # GET/POST/PUT/DELETE
│   ├── ocr-receipt/          # POST - AI receipt scan
│   ├── insights/             # Smart insights generation
│   ├── price-history/        # Price tracking & vendor comparison
│   ├── merchant-rules/       # User-confirmed learning rules
│   ├── item-rules/           # Item-level auto-categorization
│   └── recurring-expenses/   # CRUD + /generate
├── (expenses)/               # Route group for expense pages
│   ├── mileage/              # GPS tracking + history
│   ├── price-tracker/        # Vendor comparison UI
│   └── reports/              # Tax reports
├── expenses/                 # List + /new for adding
├── expense-dashboard/        # Main dashboard (legacy route)
└── auth/                     # login/signup/callback

components/
├── Navigation.tsx            # Main nav with mode toggle
├── Providers.tsx             # App-wide context providers
├── ActionableInsights.tsx    # Smart insights with quick actions
└── LearningPromptModal.tsx   # User-confirmed learning UI

contexts/
└── UserModeContext.tsx       # Personal/Business mode state

lib/
├── priceTracking.ts          # Price comparison & savings logic
├── learningDetection.ts      # Detects user corrections
└── moneyMemory.ts            # Price memory & suggestions

utils/
├── supabase.ts               # Client-side Supabase
├── supabaseAdmin.ts          # Server-side (bypasses RLS)
└── nativeMileageTracker.ts   # Capacitor native GPS tracking
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

---

## Personal/Business Mode

Global mode toggle in navigation that affects default behavior:

```typescript
import { useUserMode } from '@/contexts/UserModeContext';

const { mode, toggleMode, isBusiness, isPersonal } = useUserMode();
// mode: 'business' | 'personal'
// Persisted to localStorage
```

- New expenses default `is_business` based on current mode
- Mileage trips default to current mode
- Visual indicator when expense differs from current mode

---

## Smart Insights System

Insights are generated via `/api/insights` and displayed in `ActionableInsights.tsx`:

| Insight Type | Quick Actions |
|--------------|---------------|
| `spending_increase` | Set Budget, Mark Expected |
| `budget_warning` | Adjust Budget, Mark Expected |
| `savings_opportunity` | Take Action, Dismiss |
| `tax_tip` | View Report |
| `mileage_deduction` | View Mileage |

Mileage deduction insights show: "You added $X in deductions just by driving!"

---

## Price Tracker & Vendor Comparison

Enhanced savings recommendations:
- "You've overpaid $X on this item. Vendor B is 18% cheaper!"
- "This item is 15% cheaper at Vendor B"
- "Save 12% by shopping at Vendor A instead of Vendor B"

Vendor pills show percentage difference (+15%, +20%) for quick comparison.

---

## Mobile App (Capacitor)

Native Android/iOS support via Capacitor for background mileage tracking:

```
android/                      # Android Studio project
capacitor.config.ts           # Capacitor configuration
```

Build commands:
```bash
npm run build                 # Build web app
npx cap sync                  # Sync to native projects
```

Android project location (Windows): `C:\Users\mcsma\expenses_android`
