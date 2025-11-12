# Tax Deduction Categories Guide

## Overview

This guide explains which expense categories in the Expenses Made Easy app are typically tax-deductible for businesses and self-employed individuals in the United States.

**IMPORTANT DISCLAIMER**: This guide is for informational purposes only and should not be considered professional tax advice. Tax laws vary by jurisdiction and individual circumstances. Always consult with a licensed tax professional or CPA for personalized guidance.

---

## IRS Standard Mileage Rate

For **2025**, the IRS standard mileage rate is:
- **Business use**: $0.67 per mile
- Personal use: NOT deductible

The app automatically calculates this deduction for trips marked as "Business" in the Mileage Tracking feature.

---

## Tax-Deductible Expense Categories

### ✅ Fully Deductible (100%)

These expenses are typically **100% deductible** as ordinary and necessary business expenses:

#### General Business Categories
- **Office Supplies**: Pens, paper, printer ink, folders, etc.
- **Software & Subscriptions**: Business software, cloud services, SaaS tools
- **Professional Services**: Legal fees, accounting, consulting, bookkeeping
- **Advertising & Marketing**: Ads, website hosting, business cards, promotional materials
- **Business Insurance**: Liability insurance, professional insurance, commercial property insurance
- **Bank Fees**: Business account fees, merchant processing fees, wire transfer fees
- **Education & Training**: Job-related courses, professional certifications, workshops
- **Licenses & Permits**: Business licenses, professional certifications, regulatory fees
- **Utilities**: Business-related phone, internet, electricity (must be exclusively for business)
- **Postage & Shipping**: Mail, package delivery for business purposes
- **Equipment Rental**: Tools, machinery, vehicles rented for business use

#### Industry-Specific Categories

**Construction & Contracting**:
- Materials & Supplies
- Tool purchases and repairs
- Equipment rental
- Safety gear and protective equipment
- Subcontractor payments

**Technology & SaaS**:
- Cloud infrastructure (AWS, Azure, Google Cloud)
- Development tools and IDEs
- API services and integrations
- Domain registration and SSL certificates

**Real Estate**:
- MLS fees and subscriptions
- Lockbox fees
- Property photography
- Staging costs
- Home warranty plans for clients

**Healthcare & Medical**:
- Medical supplies and equipment
- Continuing medical education (CME)
- Malpractice insurance
- Electronic health records (EHR) systems

**Retail & E-commerce**:
- Inventory purchases (Cost of Goods Sold)
- Payment processing fees (Stripe, PayPal, Square)
- Packaging and shipping materials
- Returns and refunds

---

### ⚠️ Partially Deductible (50% Rule)

The IRS limits deductions for **meals and entertainment** to **50%** of the expense:

- **Meals & Entertainment**: Business meals with clients, partners, or employees
  - Must be "ordinary and necessary" for business
  - Must not be "lavish or extravagant"
  - Must have business purpose documented
  - Restaurant meals for business discussions: 50% deductible
  - Office snacks/coffee for employees: 50% deductible (as of 2025)

**Exception**: Meals during business travel (overnight trips) are 50% deductible.

**Important**: Keep receipts AND note who you met with and the business purpose!

---

### 🏠 Special Rules: Home Office Deduction

If you use part of your home exclusively for business, you may qualify for the **Home Office Deduction**:

**Simplified Method** (easiest):
- $5 per square foot of home office space
- Maximum 300 square feet ($1,500 max deduction)

**Regular Method** (more complex but potentially higher deduction):
- Calculate percentage of home used for business
- Deduct that percentage of:
  - Mortgage interest or rent
  - Property taxes
  - Utilities (electricity, gas, water)
  - Home insurance
  - Repairs and maintenance
  - Depreciation (for homeowners)

**Requirements**:
- Must be used **exclusively** and **regularly** for business
- Must be your principal place of business OR used to meet clients

---

### 🚗 Vehicle Expenses: Two Methods

You can choose between two methods (but not both):

#### Method 1: Standard Mileage Rate
- **$0.67 per mile** for business use (2025 rate)
- ✅ Built into the app's Mileage Tracking feature
- Easiest method - just track your miles
- Includes gas, oil, repairs, insurance, depreciation

#### Method 2: Actual Expenses
- Track all actual vehicle costs:
  - Gas and oil
  - Repairs and maintenance
  - Insurance
  - Registration fees
  - Lease payments or depreciation
  - Tires
- Multiply total by business use percentage
- More complex but may yield higher deduction for expensive vehicles

**Commuting is NOT deductible**: Driving from home to your regular workplace is considered personal, not business.

---

## Non-Deductible Expenses

These expenses are generally **NOT tax-deductible**:

- ❌ **Personal expenses**: Groceries, personal clothing, entertainment
- ❌ **Commuting costs**: Regular home-to-work travel
- ❌ **Traffic tickets and parking violations**
- ❌ **Political contributions**
- ❌ **Club memberships** (unless directly related to business, e.g., professional associations)
- ❌ **Personal life insurance premiums**
- ❌ **Home security systems** (unless for business property)
- ❌ **Personal health insurance** (may be deductible separately as self-employed health insurance)

---

## Record-Keeping Requirements

The IRS requires documentation for all deductions:

### What to Keep:
1. **Receipts**: Keep all receipts over $75 (recommended: keep ALL receipts)
2. **Date**: When the expense occurred
3. **Amount**: How much you spent
4. **Business Purpose**: What the expense was for and why it was necessary
5. **Who**: For meals and meetings, note who attended

### How the App Helps:
✅ Receipt photo capture with OCR scanning
✅ Automatic date and amount extraction
✅ Category assignment
✅ Notes field for business purpose
✅ Profile separation (Business vs Personal)
✅ Export to CSV/Excel for tax preparation

### Retention Period:
- Keep records for **at least 3 years** from the date you file your return
- For property/assets: Keep records for **7 years**
- IRS recommends: Keep indefinitely if possible

---

## How to Use This App for Tax Preparation

### Step 1: Separate Business and Personal
- Use the **Profile Toggle** to switch between Business and Personal
- Only track business expenses in the Business profile
- Personal expenses won't be included in tax reports

### Step 2: Categorize Correctly
- Choose the most specific category available
- Use industry-specific categories (enabled via Profile settings)
- Add notes to explain unusual expenses

### Step 3: Capture Receipts
- Use the **OCR Receipt Scan** feature to auto-fill expense data
- App stores receipt photos in the cloud (Supabase Storage)
- Receipts are linked to each expense for audit protection

### Step 4: Track Mileage
- Use the **Live Mileage Tracker** for automatic tracking
- Or manually enter trips after the fact
- Mark all trips as "Business" or "Personal"
- App calculates IRS standard rate automatically

### Step 5: Export for Tax Filing
- Go to **Reports** → **Export Data**
- Choose date range (usually full tax year)
- Export to CSV or Excel
- Provide to your accountant or use with tax software

---

## Common Tax Deduction Mistakes

### ❌ Mistake 1: Not Separating Business and Personal
**Fix**: Use the Business/Personal profile toggle consistently

### ❌ Mistake 2: Missing Receipts
**Fix**: Scan receipts immediately with the OCR feature

### ❌ Mistake 3: Poor Record-Keeping
**Fix**: Add detailed notes in the "Notes" field for each expense

### ❌ Mistake 4: Claiming 100% Vehicle Use for Business
**Fix**: Honestly track business vs personal mileage separately

### ❌ Mistake 5: Deducting Personal Meals as Business
**Fix**: Only deduct meals with clients/partners and note business purpose

### ❌ Mistake 6: Not Knowing Your Industry Categories
**Fix**: Set your industry in Profile → this gives you custom expense categories

---

## Tax Brackets and Why Deductions Matter

### How Deductions Reduce Your Tax Bill

Tax deductions reduce your **taxable income**, not your tax bill directly.

**Example**:
- Gross income: $100,000
- Business deductions: $20,000
- Taxable income: $80,000

If you're in the **24% tax bracket**, $20,000 in deductions saves you **$4,800 in taxes**.

### 2025 Federal Tax Brackets (Single Filers)

| Taxable Income | Tax Rate |
|----------------|----------|
| $0 - $11,600 | 10% |
| $11,601 - $47,150 | 12% |
| $47,151 - $100,525 | 22% |
| $100,526 - $191,950 | 24% |
| $191,951 - $243,725 | 32% |
| $243,726 - $609,350 | 35% |
| $609,351+ | 37% |

*Note: These are marginal rates - only income in each bracket is taxed at that rate.*

### Self-Employment Tax

If you're self-employed, you also pay:
- **15.3%** self-employment tax (Social Security + Medicare)
  - 12.4% Social Security (on first $168,600 of income in 2025)
  - 2.9% Medicare (no limit)
  - Additional 0.9% Medicare tax on income over $200,000

**Deductions reduce your self-employment tax too!**

---

## Integration with MC Smart Bytes Accounting System

If you're using the **MC Smart Bytes Accounting Web App**, your expense data will automatically sync:

### How it Works:
1. **Add expenses in mobile app** (this app)
2. **Expenses sync to accounting system** (via Supabase)
3. **Bookkeeper reviews and approves**
4. **Expenses become journal entries** (double-entry bookkeeping)
5. **Tax reports generated automatically**

### Category Mapping:
Mobile expense categories are mapped to chart of accounts:

| Mobile Category | Accounting Account | Deductible? |
|-----------------|-------------------|-------------|
| Fuel | 5000 - Fuel Expense | ✅ 100% (business) |
| Office Supplies | 5100 - Office Supplies | ✅ 100% |
| Meals & Entertainment | 5200 - Meals & Entertainment | ⚠️ 50% |
| Software | 5300 - Software & Subscriptions | ✅ 100% |
| Marketing | 5400 - Advertising Expense | ✅ 100% |
| Equipment | 1500 - Fixed Assets | ⚠️ Depreciated over time |

---

## Year-End Tax Preparation Checklist

### Before Tax Season:
- [ ] Review all expenses for accuracy
- [ ] Ensure all receipts are attached
- [ ] Verify business vs personal classification
- [ ] Run annual expense report
- [ ] Export mileage log
- [ ] Calculate total business miles
- [ ] Gather other tax documents (1099s, W-2s, etc.)

### Provide to Tax Professional:
- [ ] Expense report (exported from app)
- [ ] Mileage log (exported from app)
- [ ] Major receipt images (for big purchases)
- [ ] Home office square footage (if applicable)
- [ ] Vehicle information (make, model, year, total miles)
- [ ] Business use percentage

---

## Frequently Asked Questions

### Q: Can I deduct expenses from last year if I forgot to track them?
**A**: Yes, but you'll need to reconstruct records. The IRS requires contemporaneous documentation, so try to find credit card statements, bank records, or emails as proof.

### Q: What if I use my personal car for both business and personal?
**A**: Track mileage separately and only deduct the business percentage. The app's Business/Personal toggle makes this easy.

### Q: Can I deduct my cell phone bill?
**A**: Only the business use percentage. If you use your phone 70% for business, deduct 70% of the bill.

### Q: Are subscription boxes (like industry samples) deductible?
**A**: If they're ordinary and necessary for your business (e.g., product samples for review), yes.

### Q: Can I deduct meals when traveling for business?
**A**: Yes, 50% deductible when traveling overnight for business.

### Q: What if I get audited?
**A**: The IRS wants to see receipts and proof of business purpose. This app provides both with receipt photos and notes.

---

## Resources

### Official IRS Publications:
- **Publication 535**: Business Expenses
- **Publication 463**: Travel, Gift, and Car Expenses
- **Publication 587**: Business Use of Your Home
- **Schedule C**: Profit or Loss from Business (Form 1040)

### Helpful Links:
- [IRS Business Expenses](https://www.irs.gov/businesses/small-businesses-self-employed/deducting-business-expenses)
- [Standard Mileage Rates](https://www.irs.gov/tax-professionals/standard-mileage-rates)
- [Home Office Deduction](https://www.irs.gov/businesses/small-businesses-self-employed/home-office-deduction)

---

## Summary

✅ **Expenses Made Easy** helps you:
- Track 100% of business expenses
- Capture receipts instantly
- Calculate IRS mileage deductions
- Separate business from personal
- Export for tax preparation
- Sync to professional accounting system

💰 **Potential Tax Savings**:
- Average small business deductions: $15,000 - $30,000/year
- At 24% tax bracket: **$3,600 - $7,200 in tax savings**
- Plus self-employment tax savings: **$2,295 - $4,590**
- **Total potential savings: $5,895 - $11,790 per year**

📱 **Start tracking today** to maximize your deductions!

---

*Last updated: October 2025*
*Tax rates and rules based on 2025 IRS guidelines*

**Disclaimer**: This guide is for educational purposes only. Tax laws change frequently and vary by jurisdiction. Always consult a qualified tax professional for advice specific to your situation.
