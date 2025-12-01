# Expenses Made Easy

A professional business expense tracking application with IRS-compliant tax classification, AI-powered receipt scanning, GPS-based mileage tracking, and comprehensive tax reporting.

**Live Site:** https://expenses-made-easy-opal.vercel.app/

---

## Features

### Core Features
- **Expense Tracking** - Add, edit, and categorize business/personal expenses
- **AI Receipt Scanning** - Upload receipt photos, AI extracts vendor, amount, date, tax breakdown
- **GPS Mileage Tracking** - Automatic trip tracking with IRS standard mileage rate ($0.67/mile for 2025)
- **Tax Reports** - IRS Schedule C compliant reports with CSV export
- **Category Management** - Custom categories with tax deduction percentages

### AI-Powered OCR
- Scan receipts with GPT-4 Vision
- Auto-extracts: vendor, subtotal, tax, total, date, items, payment method
- Shows tax breakdown (subtotal, tax rate, total)
- Auto-fills expense form

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
│   │   ├── categories/         # Categories CRUD API
│   │   ├── ocr-receipt/        # AI receipt scanning
│   │   ├── create-checkout-session/
│   │   └── webhooks/stripe/
│   ├── auth/
│   │   ├── login/
│   │   ├── signup/
│   │   └── callback/
│   ├── expense-dashboard/      # Main dashboard
│   ├── expenses/
│   │   └── new/                # Add expense with OCR
│   ├── profile/                # Profile & category management
│   ├── reports/                # Tax reports
│   ├── mileage/                # Mileage tracking
│   ├── budgets/                # Budget tracking
│   ├── receipts/               # Receipt gallery
│   ├── settings/               # User settings
│   └── page.tsx                # Landing page
├── components/
│   └── Navigation.tsx
├── utils/
│   ├── supabase.ts             # Supabase client
│   ├── supabaseAdmin.ts        # Admin client (bypasses RLS)
│   ├── industryCategories.ts   # Industry category definitions
│   └── subscription.ts         # Subscription utilities
└── public/
```

---

## Key Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/auth/login` | User login |
| `/auth/signup` | User registration |
| `/expense-dashboard` | Main dashboard |
| `/expenses/new` | Add expense with OCR |
| `/profile` | Profile & categories |
| `/reports` | Tax reports |
| `/mileage` | Mileage tracking |
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

### Tax Reports
- Date range selection
- Schedule C line item breakdown
- Mileage deductions
- CSV export for accountants
- Tax savings estimates

### Category Management
- Add custom categories
- Select industry for pre-loaded categories
- Set tax deduction percentages
- Map to Schedule C lines

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
