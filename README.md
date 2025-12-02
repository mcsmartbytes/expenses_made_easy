# Expenses Made Easy

A professional business expense tracking application with IRS-compliant tax classification, AI-powered receipt scanning, GPS-based mileage tracking, recurring expense management, and comprehensive tax reporting.

**Live Site:** https://expenses-made-easy-opal.vercel.app/

**Install as App:** Available as a Progressive Web App (PWA) - install on your phone's home screen!

---

## Features

### Core Features
- **Expense Tracking** - Add, edit, and categorize business/personal expenses
- **AI Receipt Scanning** - Upload receipt photos, AI extracts vendor, amount, date, tax breakdown
- **GPS Mileage Tracking** - Automatic trip tracking with IRS standard mileage rate ($0.67/mile for 2025)
- **Recurring Expenses** - Set up monthly, weekly, quarterly, or annual recurring expenses
- **Tax Reports** - IRS Schedule C compliant reports with CSV export
- **Category Management** - Custom categories with tax deduction percentages
- **Budget Tracking** - Set and track spending budgets by category
- **Receipt Gallery** - Visual gallery of all scanned receipts

### Progressive Web App (PWA)
- Install on Android or iPhone home screen
- Full-screen app experience (no browser bar)
- Offline support with cached pages
- App shortcuts for quick actions (long-press icon)
- Automatic install prompt

### AI-Powered OCR
- Scan receipts with GPT-4 Vision
- Auto-extracts: vendor, subtotal, tax, total, date, items, payment method
- Shows tax breakdown (subtotal, tax rate, total)
- Auto-fills expense form

### Recurring Expenses
- Frequencies: Weekly, Biweekly, Monthly, Quarterly, Annually
- Auto-generates expenses when due (on dashboard load)
- Pause/Resume individual recurring expenses
- Upcoming expenses preview (next 30 days)
- Estimated monthly total calculation

### Mileage Tracking
- GPS-based automatic tracking (starts at 5+ mph)
- Manual tracking option
- Full trip history with filters
- Business/Personal classification
- CSV export for mileage logs
- Real-time speed display

### Industry-Specific Categories
Select your industry to get pre-loaded expense categories:
- Real Estate
- Construction
- Healthcare
- Consulting
- Retail
- Restaurant / Food Service
- Technology
- Transportation / Logistics
- Creative / Design
- Legal
- Accounting / Finance
- Fitness / Wellness
- Photography / Videography

### Tax Classification System
- 7 IRS tax classification types
- 25+ Schedule C line items
- Real-time deduction calculations
- Deduction percentages (100%, 50%, 0%)

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **Supabase** | Database & Auth |
| **OpenAI GPT-4o-mini** | Receipt OCR |
| **Stripe** | Subscription payments |
| **Vercel** | Hosting |
| **PWA** | Mobile app experience |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- OpenAI API key (for OCR)
- Stripe account (for payments, optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/mcsmartbytes/expenses_made_easy.git
cd expenses_made_easy

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your credentials to .env.local
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (required for receipt scanning)
OPENAI_API_KEY=sk-your-openai-key

# Stripe (optional - for subscriptions)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

Run these SQL files in Supabase SQL Editor:
1. `TAX_CLASSIFICATION_SCHEMA.sql` - Tax classification tables
2. `supabase_user_profile_schema.sql` - User profiles with industry
3. Recurring expenses table (see below)

#### Recurring Expenses Table

```sql
CREATE TABLE recurring_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  vendor TEXT,
  payment_method TEXT DEFAULT 'credit',
  is_business BOOLEAN DEFAULT true,
  notes TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'annually')),
  start_date DATE NOT NULL,
  next_due_date DATE NOT NULL,
  last_generated_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recurring expenses" ON recurring_expenses
  FOR ALL USING (auth.uid() = user_id);
```

### Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## Project Structure

```
expenses_made_easy/
├── app/
│   ├── api/
│   │   ├── categories/              # Categories CRUD API
│   │   ├── ocr-receipt/             # AI receipt scanning
│   │   ├── recurring-expenses/      # Recurring expenses API
│   │   │   └── generate/            # Auto-generate due expenses
│   │   ├── create-checkout-session/
│   │   └── webhooks/stripe/
│   ├── auth/
│   │   ├── login/
│   │   ├── signup/
│   │   └── callback/
│   ├── expense-dashboard/           # Main dashboard
│   ├── expenses/
│   │   └── new/                     # Add expense with OCR
│   ├── recurring/                   # Recurring expenses management
│   ├── profile/                     # Profile & category management
│   ├── reports/                     # Tax reports
│   ├── mileage/                     # Mileage tracking
│   ├── budgets/                     # Budget tracking
│   ├── receipts/                    # Receipt gallery
│   ├── settings/                    # User settings
│   └── page.tsx                     # Landing page
├── components/
│   └── Navigation.tsx
├── utils/
│   ├── supabase.ts                  # Supabase client
│   ├── supabaseAdmin.ts             # Admin client (bypasses RLS)
│   ├── industryCategories.ts        # Industry category definitions
│   └── subscription.ts              # Subscription utilities
├── public/
│   ├── manifest.json                # PWA manifest
│   ├── sw.js                        # Service worker
│   └── icons/                       # App icons
└── CLAUDE.md                        # Project context
```

---

## Key Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/auth/login` | User login |
| `/auth/signup` | User registration |
| `/expense-dashboard` | Main dashboard |
| `/expenses` | All expenses with edit/delete |
| `/expenses/new` | Add expense with OCR |
| `/recurring` | Recurring expenses management |
| `/profile` | Profile & categories |
| `/reports` | Tax reports |
| `/mileage` | Mileage tracking with history |
| `/budgets` | Budget management |
| `/receipts` | Receipt gallery |
| `/settings` | App settings |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/categories` | GET | List all categories |
| `/api/categories` | POST | Create categories |
| `/api/categories` | PUT | Update category |
| `/api/categories` | DELETE | Delete category |
| `/api/ocr-receipt` | POST | Scan receipt with AI |
| `/api/recurring-expenses` | GET | List recurring expenses |
| `/api/recurring-expenses` | POST | Create recurring expense |
| `/api/recurring-expenses` | PUT | Update recurring expense |
| `/api/recurring-expenses` | DELETE | Delete recurring expense |
| `/api/recurring-expenses/generate` | POST | Generate due expenses |

---

## Features in Detail

### Receipt Scanning
1. Upload a receipt photo
2. Click "Scan Receipt with AI"
3. AI extracts:
   - Vendor name
   - Subtotal (before tax)
   - Tax amount & rate
   - Total
   - Date
   - Items purchased
   - Payment method
4. Form auto-fills with extracted data

### Recurring Expenses
1. Go to Recurring page
2. Click "Add Recurring Expense"
3. Set amount, description, frequency, start date
4. Expenses auto-generate when due (on dashboard load)
5. Pause/resume anytime

### Mileage Tracking
1. Open Mileage page
2. Auto-tracking starts at 5+ mph (or click Manual Start)
3. Stop & save when trip ends
4. View full history with filters
5. Export to CSV

### Tax Reports
- Date range selection
- Schedule C line item breakdown
- Mileage deductions
- CSV export for accountants
- Tax savings estimates

### PWA Installation

**Android (Chrome):**
1. Visit the app URL
2. You'll see an "Install App" popup
3. Tap "Install Now"
4. App icon appears on home screen

**iPhone (Safari):**
1. Visit the app URL
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables in Vercel
Make sure to add all env variables in:
**Project Settings → Environment Variables**

---

## Documentation

- `CLAUDE.md` - Project context and quick reference
- `PROJECT_SUMMARY.md` - Detailed feature documentation
- `TAX_CLASSIFICATION_SCHEMA.sql` - Database schema
- `TESTING_CHECKLIST.md` - Testing guide
- `.env.example` - Environment template

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## License

MIT License - see LICENSE file for details

---

## Support

For issues and feature requests, please use the GitHub Issues page.

---

**Built with Next.js, Supabase, and OpenAI**
