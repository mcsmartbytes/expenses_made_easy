# Profile & Industry Setup Guide

## What's Been Added

You now have a **complete profile system** with **industry-based expense suggestions**! This enhancement allows you to:

1. **Set your industry** - Choose from 13+ industry types
2. **Get personalized expense categories** - Industry-specific categories automatically appear
3. **Separate business and personal finances** - Toggle between Business and Personal profiles
4. **Streamlined expense tracking** - Relevant categories are suggested based on your work

---

## Features Implemented

### Profile Management
- Full name, business name, phone number fields
- Industry selection from 13+ industries
- Automatic saving and persistence
- Profile accessible from Dashboard

### Industry-Specific Categories
When you select an industry, you'll get tailored expense categories relevant to your work:

- **Real Estate**: Property Showings, MLS Fees, Staging, etc.
- **Construction & Trades**: Tools & Equipment, Materials, Permits, etc.
- **Healthcare & Medical**: Medical Supplies, Malpractice Insurance, Lab Fees, etc.
- **Consulting**: Client Meetings, Software Subscriptions, Conference Fees, etc.
- **Retail & E-commerce**: Inventory, Packaging, Payment Processing, etc.
- **Restaurant & Food Service**: Food & Ingredients, Kitchen Equipment, etc.
- **Technology & Software**: Cloud Services, Development Tools, etc.
- **Transportation & Delivery**: Fuel, Vehicle Maintenance, Tolls & Parking, etc.
- **Creative Services**: Software Subscriptions, Stock Assets, Portfolio Website, etc.
- **Legal Services**: Legal Research, Bar Dues, Continuing Education, etc.
- **Accounting & Bookkeeping**: Accounting Software, Professional Licenses, etc.
- **Fitness & Wellness**: Equipment, Certifications, Music Licensing, etc.
- **Photography & Videography**: Camera Equipment, Editing Software, etc.

### Smart Category Display
- Industry categories show up **only in Business mode**
- Personal mode uses your custom categories
- No duplicates - industry and custom categories are merged intelligently
- Visual indicator when industry categories are active

---

## Setup Instructions

### Step 1: Run Database Migration

1. Go to your Supabase dashboard: https://vckynnyputrvwjhosryl.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file `supabase_user_profile_schema.sql` in this project
5. Copy all the SQL and paste it into the editor
6. Click **Run** to execute

This creates:
- `user_profiles` table for storing user information
- Proper security policies (users can only see/edit their own profile)
- Automatic timestamp updates

### Step 2: Restart Your App

```bash
# If the app is already running, restart it
npx expo start
```

### Step 3: Set Up Your Profile

1. Open the app and log in
2. On the Dashboard, tap **"👤 My Profile"**
3. Fill in your information:
   - Full Name
   - Phone Number
   - Business Name (optional)
   - **Industry** (important!)
4. Tap **"Save Profile"**

### Step 4: Test Industry Categories

1. Go back to Dashboard
2. Switch to **💼 Business** mode
3. Tap **"+ Add Expense"**
4. Notice the message: **"✨ Industry-specific categories available"**
5. Scroll through the categories - you'll see your industry categories plus any custom ones!

---

## How It Works

### Business Profile + Industry
When you're in **Business mode** and have selected an industry:
- Industry-specific categories appear first
- Custom categories you've created are also available
- Categories are merged and sorted alphabetically
- Perfect for client visits or business expense tracking

### Personal Profile
When you're in **Personal mode**:
- Only your custom categories appear
- Industry categories are hidden (not relevant for personal expenses)
- Clean, simple expense tracking for personal life

### Example Workflow

**Real Estate Agent**:
1. Set industry to "Real Estate"
2. Switch to Business mode
3. Add expense for "Property Showings" (industry category)
4. Add expense for "MLS Fees" (industry category)
5. Switch to Personal mode
6. Add personal groceries (custom category)

---

## Benefits

### 1. No Manual Category Setup
- Previously: Had to create every category manually
- Now: Get 10+ relevant categories instantly

### 2. Industry-Tailored
- Categories match your actual business expenses
- Reduces decision fatigue when logging expenses
- Makes expense tracking faster

### 3. Tax-Ready Organization
- Business categories are already separated
- Industry categories align with common deductions
- Easier tax filing and deduction tracking

### 4. Professional Reports
- Reports show industry-appropriate categories
- Better insights into where money goes
- Easier to share with accountants

---

## Available Industries & Categories

### Real Estate
Property Showings, Marketing & Advertising, Office Rent, MLS Fees, Professional Development, Client Meals, Photography, Staging, Legal Fees, Insurance

### Construction & Trades
Tools & Equipment, Materials & Supplies, Vehicle Maintenance, Fuel, Permits & Licenses, Insurance, Safety Equipment, Subcontractors, Office Supplies, Marketing

### Healthcare & Medical
Medical Supplies, Equipment, Continuing Education, Professional Licenses, Malpractice Insurance, Office Rent, Lab Fees, Medical Software, Marketing, Staff Uniforms

### Consulting & Professional Services
Client Meetings, Travel & Lodging, Software Subscriptions, Office Supplies, Professional Development, Marketing, Insurance, Coworking Space, Conference Fees, Legal & Accounting

### Retail & E-commerce
Inventory, Packaging & Shipping, Point of Sale System, Rent & Utilities, Marketing & Ads, Website Hosting, Payment Processing Fees, Insurance, Store Fixtures, Photography

### Restaurant & Food Service
Food & Ingredients, Kitchen Equipment, Staff Uniforms, Rent & Utilities, Licenses & Permits, Marketing, POS System, Cleaning Supplies, Insurance, Waste Disposal

### Technology & Software
Software Licenses, Cloud Services, Development Tools, Hardware, Internet & Hosting, Marketing, Contract Labor, Professional Development, Office Equipment, Insurance

### Transportation & Delivery
Fuel, Vehicle Maintenance, Vehicle Insurance, Tolls & Parking, GPS & Navigation, Vehicle Lease, Licenses & Permits, Safety Equipment, Phone & Data, Marketing

### Creative Services
Software Subscriptions, Stock Photos/Assets, Equipment, Portfolio Website, Marketing, Coworking Space, Client Meetings, Professional Development, Insurance, Supplies

### Legal Services
Legal Research, Bar Dues, Continuing Legal Education, Malpractice Insurance, Office Rent, Legal Software, Marketing, Client Entertainment, Filing Fees, Professional Memberships

### Accounting & Bookkeeping
Accounting Software, Professional Licenses, Continuing Education, Insurance, Office Rent, Marketing, Client Meetings, Professional Memberships, Office Supplies, Tax Research

### Fitness & Wellness
Equipment, Rent & Utilities, Insurance, Certifications, Marketing, Music Licensing, Cleaning Supplies, Retail Products, Website & Apps, Uniforms

### Photography & Videography
Camera Equipment, Lighting & Gear, Editing Software, Storage & Backup, Marketing, Travel, Insurance, Website Hosting, Props & Backdrops, Education

---

## Tips & Best Practices

### 1. Choose the Right Industry
- Pick the industry that best matches your primary business
- If you have multiple businesses, choose your main one
- You can always change it later in Profile settings

### 2. Combine with Custom Categories
- Industry categories are a starting point
- Add custom categories for unique expenses
- Both work together seamlessly

### 3. Use Business Mode for Work
- Always switch to Business mode before client visits
- Industry categories only show in Business mode
- This keeps your expense entry fast and focused

### 4. Update Your Profile
- Keep your profile information current
- Change industry if your business changes
- Update business name for accurate reports

### 5. Review Categories Periodically
- Check if industry categories match your actual spending
- Add custom categories for anything missing
- Remove unused custom categories to reduce clutter

---

## Troubleshooting

### Industry Categories Not Showing
**Problem**: Don't see industry categories when adding expenses

**Solutions**:
1. Make sure you're in **Business mode** (check profile switcher at top)
2. Verify you've selected an industry in Profile settings
3. Restart the app after setting your industry
4. Check that the database migration ran successfully

### Categories Look Wrong
**Problem**: Seeing unexpected or duplicate categories

**Solutions**:
1. Categories are merged from industry + custom
2. They're sorted alphabetically automatically
3. Check your custom categories in Categories screen
4. Remove duplicates from custom categories if needed

### Profile Won't Save
**Problem**: Getting an error when saving profile

**Solutions**:
1. Verify the database migration was run correctly
2. Check your internet connection
3. Make sure you're logged in
4. Check Supabase dashboard for any errors

### Old Expenses Missing Categories
**Problem**: Existing expenses don't show new industry categories

**Solutions**:
- This is expected! Industry categories only appear for **new** expenses
- Old expenses keep their original categories
- Categories are assigned at expense creation time

---

## Technical Details

### Database Schema
- Table: `user_profiles`
- Fields: `full_name`, `industry`, `business_name`, `phone`
- Security: Row-level security enabled
- Relationships: One profile per user

### Category Logic
```
IF activeProfile === 'business' AND userHasIndustry:
  categories = industryCategories + customCategories (merged, deduplicated, sorted)
ELSE:
  categories = customCategories (sorted)
```

### Files Modified
- `src/screens/Settings/ProfileScreen.tsx` - New profile management screen
- `src/services/industryCategories.ts` - Industry category definitions
- `src/screens/Expenses/AddExpenseScreen.tsx` - Enhanced to show industry categories
- `src/navigation/AppNavigator.tsx` - Added Profile route
- `supabase_user_profile_schema.sql` - Database schema

---

## Future Enhancements

Potential additions for the future:
1. **Multiple Profiles**: Support multiple businesses with different industries
2. **Custom Industry Categories**: Let users customize their industry's categories
3. **Category Analytics**: Show which industry categories you use most
4. **Smart Suggestions**: AI-powered category suggestions based on description
5. **Industry Benchmarks**: Compare your spending to industry averages

---

## Quick Start Checklist

- [ ] Run database migration in Supabase
- [ ] Restart the app
- [ ] Open Profile from Dashboard
- [ ] Set your full name and industry
- [ ] Save your profile
- [ ] Switch to Business mode on Dashboard
- [ ] Add a test expense to see industry categories
- [ ] Verify categories appear correctly
- [ ] Test switching between Business and Personal modes

---

**You're all set!** Your expense tracking app now understands your industry and provides tailored categories to make expense logging faster and more relevant to your business.

## Questions?

If you have questions or need to add a new industry:
1. Check the existing industries in `src/services/industryCategories.ts`
2. Add your industry and categories there
3. Restart the app to see the new industry

Happy expense tracking! 🎉
