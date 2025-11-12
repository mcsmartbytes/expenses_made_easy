// Shared types - matches bytes_super_site schema

export interface Expense {
  id: string;
  user_id?: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string | null;
  receipt_url: string | null;
  notes: string | null;
  profile?: 'business' | 'personal';
  created_at: string;
}

export interface MileageTrip {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  start_location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  end_location: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  distance_miles: number;
  purpose: 'business' | 'personal';
  profile?: 'business' | 'personal';
  notes: string | null;
  fuel_stops: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
    amount?: number;
  }>;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Personal Care',
  'Housing',
  'Insurance',
  'Savings',
  'Other',
];

export const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Digital Wallet',
];

// IRS Standard Mileage Rate for 2024
export const IRS_MILEAGE_RATE = 0.67;
