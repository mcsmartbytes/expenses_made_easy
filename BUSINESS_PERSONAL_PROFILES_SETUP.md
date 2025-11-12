# Business/Personal Profiles Setup Guide

## 🎉 What's Been Completed

You now have a complete **Business/Personal profile system**! This allows you to completely separate your business and personal finances within the same account.

### ✅ Features Implemented
- **Profile Switcher**: Toggle between Business and Personal modes
- **Complete Data Separation**: All expenses and mileage are filtered by active profile
- **Persistent Selection**: Your last selected profile is remembered
- **Automatic Filtering**: Everything (expenses, mileage, reports) automatically filters by profile
- **Visual Indicators**: Clear indication of which profile you're viewing

## 🚀 Setup Instructions

### Step 1: Run Database Schema Update

1. Go to your Supabase dashboard: https://vckynnyputrvwjhosryl.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `supabase_profile_schema.sql` and paste it
5. Click **Run** to execute the SQL

This will:
- Add `profile` column to `expenses` table
- Add `profile` column to `mileage_trips` table
- Create indexes for better performance
- Set default values for existing data

### Step 2: Test the App

1. Restart your app if it's running: `npx expo start`
2. Open and log in
3. You should see the profile switcher at the top of the Dashboard

## 📱 How It Works

### Dashboard Profile Switcher

At the top of your Dashboard, you'll see two buttons:
- **💼 Business** - For business-related expenses and mileage
- **🏠 Personal** - For personal expenses and mileage

### What Happens When You Switch Profiles?

When you tap a profile button:
1. The app saves your selection
2. Dashboard refreshes to show only that profile's data
3. All screens automatically filter by the selected profile:
   - Expenses list
   - Mileage trips
   - Reports
   - Category stats
   - Monthly totals

### Adding New Data

When you add new expenses or mileage trips:
- They are automatically tagged with your **current active profile**
- If you're in Business mode, new expenses are tagged as "business"
- If you're in Personal mode, new expenses are tagged as "personal"

### Generating Reports

Reports are also filtered by profile:
- When you generate a report, it shows data for the **current active profile**
- Business reports show only business expenses/mileage
- Personal reports show only personal expenses/mileage
- The report header clearly indicates which profile it's for

## 🎯 Use Cases

### Use Case 1: Business Owner
You run a small business and need to keep business and personal finances separate:
- Switch to **💼 Business** mode
- Add all business expenses and mileage
- Generate business reports for tax purposes
- Switch to **🏠 Personal** mode for personal tracking

### Use Case 2: Contractor/Freelancer
You're a contractor with multiple clients:
- Use **💼 Business** for all work-related expenses
- Track client mileage in Business mode
- Keep personal expenses in **🏠 Personal** mode
- Generate separate tax reports for each

### Use Case 3: Family Budgeting
You want to track both business and family expenses:
- **💼 Business**: Your side hustle or small business
- **🏠 Personal**: Family groceries, entertainment, personal travel
- See separate totals and reports for each

## 💡 Best Practices

### 1. Choose the Right Profile Before Adding Data
- Always check which profile is active (look at the top of Dashboard)
- Switch to the correct profile BEFORE adding expenses or trips
- The active profile determines where your data goes

### 2. Keep It Simple
- **Business** = Work-related, tax-deductible, client-related
- **Personal** = Everything else

### 3. Use Reports Wisely
- Generate **Business reports** for:
  - Tax filing
  - Client billing
  - Expense reimbursement
  - Quarterly reviews
- Generate **Personal reports** for:
  - Family budgeting
  - Personal finance tracking
  - Spending analysis

### 4. Review Regularly
- Switch between profiles to check both
- Review Business expenses monthly for tax prep
- Review Personal expenses for budget management

## 🔄 How Data Is Organized

```
Your Account
├── 💼 Business Profile
│   ├── Expenses (tagged as 'business')
│   ├── Mileage Trips (tagged as 'business')
│   └── Reports (business only)
│
└── 🏠 Personal Profile
    ├── Expenses (tagged as 'personal')
    ├── Mileage Trips (tagged as 'personal')
    └── Reports (personal only)
```

**Important**: Each profile is completely separate. Switching profiles shows ONLY that profile's data.

## 📊 Dashboard Stats

The Dashboard shows stats for the **currently active profile**:
- **Expenses**: Total expenses for this profile this month
- **Mileage**: Total mileage for this profile this month
- **Top Categories**: Categories for this profile only
- **Recent Expenses**: Latest expenses for this profile

## ⚠️ Important Notes

### Data Isolation
- Business and Personal data are **completely separate**
- You cannot see Personal expenses when in Business mode
- You cannot see Business expenses when in Personal mode
- This is by design to keep finances organized

### Existing Data
- After running the database update, existing data is tagged as:
  - Expenses: Tagged as "personal" by default
  - Mileage: Tagged as "business" by default
- You can manually update these in the database if needed

### Profile Persistence
- Your last selected profile is remembered
- When you close and reopen the app, it returns to your last selection
- Default profile (on first use) is "personal"

## 🐛 Troubleshooting

### "No expenses found" after switching profiles
This is normal! You haven't added any expenses to that profile yet. Add some expenses while that profile is active.

### Can't see my old expenses
Check which profile you're in. Old expenses were tagged as "personal" by default. Switch to Personal mode to see them.

### Mileage trips not showing
Check your active profile. Mileage trips were tagged as "business" by default. Switch to Business mode to see them.

### Want to move data between profiles
You can manually update the `profile` column in Supabase:
1. Go to Supabase → Table Editor
2. Select `expenses` or `mileage_trips` table
3. Find the record
4. Change the `profile` value to 'business' or 'personal'

## 🎓 Tips & Tricks

### Tip 1: Start Fresh with Both Profiles
- Create a test expense in Business mode
- Create a test expense in Personal mode
- Switch between them to see how it works

### Tip 2: Use Profile Names as Reminders
- The switcher is always visible on Dashboard
- Before adding anything, glance at the profile
- Make it a habit to check first

### Tip 3: Review Both Profiles Weekly
- Monday: Review Business expenses
- Friday: Review Personal expenses
- Keep both profiles organized

### Tip 4: Monthly Reports for Both
- End of month: Generate Business report
- Same day: Switch and generate Personal report
- Keep organized records for both

## 📈 Next Level Usage

### Advanced Workflow
1. **Morning**: Switch to 💼 Business
2. **Track work expenses** all day
3. **Track business mileage** for client visits
4. **Evening**: Switch to 🏠 Personal
5. **Track personal expenses** and errands
6. **End of month**: Generate reports for both profiles

### Tax Season
1. Switch to 💼 Business
2. Generate annual IRS-compliant report
3. All business expenses and mileage in one place
4. Ready for your accountant!

## ✨ What Makes This Powerful

- **One App, Two Worlds**: Keep everything in one place but completely separate
- **No Confusion**: Always know which profile you're viewing
- **Tax Ready**: Business expenses are already separated
- **Privacy**: Personal finances don't mix with business
- **Flexibility**: Switch anytime, as often as needed

## 🔮 Future Enhancements

Potential future additions:
1. **Multiple Business Profiles**: Have separate profiles for different businesses
2. **Profile Colors**: Color-code each profile
3. **Quick Switch**: Swipe gesture to switch profiles
4. **Profile Summaries**: See both profiles' totals at once
5. **Profile Sharing**: Share business profile with accountant

---

**You're all set!** Start using Business/Personal profiles today to keep your finances perfectly organized!

## Quick Start Checklist
- [ ] Run the database SQL update in Supabase
- [ ] Restart your app
- [ ] See the profile switcher on Dashboard
- [ ] Test switching between Business and Personal
- [ ] Add a test expense in each profile
- [ ] Generate a test report for each profile
- [ ] Start using it for real!
