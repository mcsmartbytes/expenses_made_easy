# Integration Design: Expenses Made Easy ’ MC Smart Bytes Accounting

## Executive Summary

This document outlines the integration strategy between two complementary systems:
- **Expenses Made Easy** (Mobile App): Field expense and mileage tracking
- **MC Smart Bytes Accounting** (Web App): Complete bookkeeping and financial reporting

**Goal**: Seamlessly sync expense data from mobile to accounting system for professional bookkeeping.

---

## System Overview

### Expenses Made Easy (Mobile)
- **Platform**: React Native (Expo)
- **Database**: Supabase (PostgreSQL)
- **User Base**: Business owners, contractors, self-employed
- **Primary Function**: Quick expense/mileage tracking on-the-go

### MC Smart Bytes Accounting (Web)
- **Platform**: Next.js 15 + React 19
- **Database**: Supabase (same instance)
- **User Base**: Bookkeepers, accountants, business owners
- **Primary Function**: Complete double-entry bookkeeping, financial reports

---

## Data Architecture

### Shared Supabase Project
Both apps use the **same Supabase instance**: `https://vckynnyputrvwjhosryl.supabase.co`

**Benefits**:
-  No API layer needed
-  Real-time sync via Supabase subscriptions
-  Unified authentication
-  Single source of truth
-  Lower infrastructure costs

---

## Data Mapping Strategy

### 1. User/Client Relationship

#### Mobile App Structure:
```typescript
// User authenticated via Supabase Auth
user_profiles {
  id: UUID
  user_id: UUID (auth.uid())
  full_name: string
  industry: string  // "Construction", "Real Estate", etc.
  business_name: string
  phone: string
}
```

#### Accounting System Structure:
```typescript
clients {
  id: UUID
  company_name: string
  contact_name: string
  email: string
  industry: string  // Must match mobile app industries!
  plan: "FULL SERVICE" | "BASIC" | "PREMIUM"
  status: "active" | "inactive"
}
```

#### **Mapping Logic**:
```
Mobile user_profiles.user_id ’ Accounting clients.id (via user_id lookup)
Mobile user_profiles.business_name ’ Accounting clients.company_name
Mobile user_profiles.full_name ’ Accounting clients.contact_name
Mobile user_profiles.industry ’ Accounting clients.industry (MUST MATCH!)
```

**Key Decision**: Should one mobile user = one accounting client, or can mobile users have multiple business profiles mapped to separate accounting clients?

**Recommendation**:
- Phase 1: One mobile user ’ One accounting client (simple)
- Phase 2: Support multiple businesses per mobile user (advanced)

---

### 2. Expense ’ Journal Entry Transformation

#### Mobile App Expense:
```typescript
expenses {
  id: UUID
  user_id: UUID
  date: DATE
  description: string
  amount: number
  category: string  // "Fuel", "Office Supplies", etc.
  profile: "business" | "personal"
  receipt_url?: string
  notes?: string
}
```

#### Accounting System Journal Entry:
```typescript
journal_entries {
  id: UUID
  client_id: UUID
  entry_number: string  // Auto-generated "JE-2025-001"
  entry_date: DATE
  description: string
  status: "Posted"
}

ledger_entries {
  id: UUID
  journal_entry_id: UUID
  account_id: UUID  // References chart_of_accounts
  debit_amount: number
  credit_amount: number
}
```

#### **Transformation Logic**:

**Business Expense Example**: $50 fuel purchase
```sql
-- Mobile expense
INSERT INTO expenses (user_id, date, amount, category, profile)
VALUES ('user-123', '2025-10-21', 50.00, 'Fuel', 'business');

-- Accounting journal entry (auto-created)
INSERT INTO journal_entries (client_id, entry_date, description)
VALUES ('client-456', '2025-10-21', 'Fuel expense from mobile app');

-- Debit: Fuel Expense account
INSERT INTO ledger_entries (journal_entry_id, account_id, debit_amount, credit_amount)
VALUES ('je-789', 'account-fuel-expense', 50.00, 0);

-- Credit: Cash/Credit Card account
INSERT INTO ledger_entries (journal_entry_id, account_id, debit_amount, credit_amount)
VALUES ('je-789', 'account-cash', 0, 50.00);
```

**Mapping Table (Category ’ Chart of Account)**:
```
Mobile Category         ’ Accounting Account Number
"Fuel"                 ’ 5000 (Fuel Expense)
"Office Supplies"      ’ 5100 (Office Supplies Expense)
"Meals & Entertainment"’ 5200 (Meals & Entertainment)
"Travel"               ’ 5300 (Travel Expense)
"Equipment"            ’ 1500 (Equipment - Asset)
```

---

### 3. Mileage ’ Expense Transformation

#### Mobile Mileage Trip:
```typescript
mileage_trips {
  id: UUID
  user_id: UUID
  start_time: TIMESTAMP
  end_time: TIMESTAMP
  distance_miles: number
  purpose: string
  rate_per_mile: number  // IRS rate: $0.67
  total_deduction: number  // Calculated
  profile: "business" | "personal"
}
```

#### **Transformation to Expense**:
Mileage trips can be automatically converted to expenses:
```
Mileage: 100 miles × $0.67 = $67.00 vehicle expense
```

Then treated as a regular expense and mapped to:
- Account 5400: Vehicle Expenses
- Or Account 5000: Mileage Deduction (if separate account preferred)

---

## Sync Implementation Options

### Option A: Real-Time Supabase Subscriptions (Recommended)

**How it works**:
1. Mobile app saves expense to `expenses` table
2. Accounting app listens via Supabase Realtime
3. Trigger automatically creates journal entry
4. No manual sync needed

**Implementation**:
```typescript
// In accounting web app
const subscription = supabase
  .channel('expenses-sync')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'expenses',
    filter: 'profile=eq.business'  // Only business expenses
  }, handleNewExpense)
  .subscribe();

async function handleNewExpense(payload) {
  const expense = payload.new;

  // Find client by user_id
  const client = await getClientByUserId(expense.user_id);

  // Map category to account
  const accountId = await mapCategoryToAccount(expense.category, client.industry);

  // Create journal entry
  await createJournalEntry({
    client_id: client.id,
    entry_date: expense.date,
    description: expense.description,
    debit_account: accountId,
    credit_account: getCashAccount(client.id),
    amount: expense.amount
  });
}
```

**Pros**:
-  Instant sync
-  No batch processing needed
-  User sees expense immediately in accounting system

**Cons**:
-   Requires accounting app to be running (or use Supabase Edge Functions)
-   More complex error handling

---

### Option B: Batch Sync via Scheduled Job

**How it works**:
1. Mobile app saves expenses normally
2. Accounting app has "Sync Mobile Expenses" button
3. Pulls all unsynced expenses and creates journal entries
4. Marks expenses as synced

**Implementation**:
```typescript
// Add sync tracking column
ALTER TABLE expenses ADD COLUMN synced_to_accounting BOOLEAN DEFAULT false;

// Sync function in accounting app
async function syncMobileExpenses(clientId: string) {
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', clientId)
    .eq('profile', 'business')
    .eq('synced_to_accounting', false);

  for (const expense of expenses) {
    await createJournalEntry(expense);

    await supabase
      .from('expenses')
      .update({ synced_to_accounting: true })
      .eq('id', expense.id);
  }
}
```

**Pros**:
-  Simpler error handling
-  Accounting app controls when sync happens
-  Can review before importing

**Cons**:
-   Not real-time
-   User must manually trigger sync

---

### Option C: Hybrid Approach (Best of Both)

**How it works**:
1. Use Supabase Edge Function for automatic sync
2. Edge Function runs on INSERT to `expenses` table
3. Accounting app can also manually trigger sync for missed items
4. Best of both worlds

**Implementation**:
```typescript
// Supabase Edge Function
export const handler = async (req) => {
  const expense = req.body.record;  // New expense from webhook

  if (expense.profile !== 'business') return;  // Skip personal

  try {
    await createJournalEntry(expense);
    await markExpenseSynced(expense.id);
  } catch (error) {
    await logSyncError(expense.id, error);
    // Accounting app can retry failed syncs manually
  }
};
```

---

## Category Mapping System

### Industry-Specific Mapping

Since both apps support industry-specific categories, we need intelligent mapping:

```typescript
const categoryMappings = {
  'Construction': {
    'Materials': '5100',      // Direct Materials account
    'Equipment Rental': '5300', // Equipment Rental Expense
    'Subcontractors': '5200',  // Subcontractor Costs
    'Fuel': '5400'            // Vehicle Fuel
  },
  'Real Estate': {
    'Property Showings': '5100', // Marketing Expense
    'MLS Fees': '5200',          // Professional Fees
    'Staging': '5300',           // Staging Costs
    'Fuel': '5500'              // Vehicle Expenses
  },
  'Technology': {
    'Cloud Infrastructure': '5100', // Cloud/Hosting
    'Software': '5200',             // Software Expense
    'Equipment': '1500',            // Fixed Asset
    'Marketing': '5400'             // Customer Acquisition
  }
};

function mapExpenseToAccount(expense, clientIndustry) {
  const mapping = categoryMappings[clientIndustry];
  return mapping?.[expense.category] || getDefaultExpenseAccount();
}
```

---

## User Experience Flow

### Client Onboarding

1. **Mobile App**:
   - User signs up: `mcsmart@example.com`
   - Creates profile: "MC Smart Bytes LLC", Industry: "Accounting"

2. **Accounting App**:
   - Bookkeeper creates client: `mcsmart@example.com`
   - System links mobile user ’ accounting client automatically
   - Imports industry-specific chart of accounts

3. **Automatic Sync Setup**:
   - Mobile app expense ’ Automatically creates journal entry
   - Bookkeeper reviews and approves entries
   - Client sees expenses reflected in reports

### Daily Workflow

**Business Owner (Mobile)**:
1. Buys fuel: $50
2. Scans receipt with OCR
3. Mobile app saves to `expenses` table
4.  Done

**Bookkeeper (Accounting Web)**:
1. Sees notification: "1 new expense from mobile"
2. Reviews the auto-created journal entry
3. Approves or adjusts if needed
4.  Books balanced

---

## Security Considerations

### Row Level Security (RLS)

Both apps already use RLS:
- Mobile: Users see only their own expenses
- Accounting: Bookkeepers see only their assigned clients

### Data Sharing Permission

```sql
-- New table to grant bookkeeper access to mobile user data
CREATE TABLE client_bookkeeper_access (
  id UUID PRIMARY KEY,
  client_user_id UUID,  -- Mobile app user
  bookkeeper_user_id UUID,  -- Accounting app user
  access_level TEXT  -- "view" | "edit" | "full"
);

-- Modified RLS policy for expenses
CREATE POLICY "Bookkeepers can view client expenses"
  ON expenses FOR SELECT
  USING (
    auth.uid() = user_id  -- User sees own
    OR EXISTS (
      SELECT 1 FROM client_bookkeeper_access
      WHERE client_user_id = expenses.user_id
      AND bookkeeper_user_id = auth.uid()
    )
  );
```

---

## Phase 1 Implementation Plan (MVP)

### Week 1: Foundation
- [ ] Add `synced_to_accounting` column to expenses table
- [ ] Create `client_bookkeeper_access` table
- [ ] Build category mapping configuration

### Week 2: Sync Logic
- [ ] Create journal entry auto-generation function
- [ ] Implement category ’ account mapping
- [ ] Add "Sync Mobile Expenses" button in accounting app

### Week 3: Testing
- [ ] Test with multiple industries
- [ ] Verify RLS permissions work
- [ ] Test error handling (bad categories, missing accounts)

### Week 4: Polish
- [ ] Add sync status indicators
- [ ] Create sync history/audit log
- [ ] Add manual retry for failed syncs

---

## Phase 2 Enhancements (Future)

- **Bi-directional Sync**: Edit journal entries ’ update mobile expenses
- **Receipt Attachment**: Link mobile receipt photos to accounting journal entries
- **Approval Workflow**: Bookkeeper must approve before posting
- **Bulk Operations**: Sync entire month at once
- **Analytics Integration**: Compare mobile spending patterns to budget

---

## Technical Requirements

### Database Schema Changes

```sql
-- Mobile app (expenses table)
ALTER TABLE expenses ADD COLUMN synced_to_accounting BOOLEAN DEFAULT false;
ALTER TABLE expenses ADD COLUMN sync_error TEXT;
ALTER TABLE expenses ADD COLUMN accounting_journal_entry_id UUID;

-- Accounting app (journal_entries table)
ALTER TABLE journal_entries ADD COLUMN source TEXT DEFAULT 'manual';  -- 'manual' | 'mobile_app'
ALTER TABLE journal_entries ADD COLUMN mobile_expense_id UUID;

-- Shared access control
CREATE TABLE client_bookkeeper_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_user_id UUID NOT NULL,
  bookkeeper_user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  granted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(mobile_user_id, bookkeeper_user_id)
);
```

---

## Summary

**Integration Strategy**: Direct Supabase connection with automatic sync
**Sync Method**: Hybrid (automatic with manual fallback)
**Data Flow**: Expenses ’ Journal Entries via category mapping
**Security**: RLS + Access control table
**Timeline**: 4 weeks to MVP, 8 weeks to full feature set

This integration transforms Expenses Made Easy from a standalone tracker into a complete bookkeeping pipeline, making MC Smart Bytes a one-stop solution for business financial management.

---

## Next Steps

1. **Review this design** with your team
2. **Choose sync method** (recommend Hybrid Option C)
3. **Test category mappings** with real client data
4. **Build MVP** following Phase 1 plan
5. **Launch beta** with select clients

Ready to build! =€
