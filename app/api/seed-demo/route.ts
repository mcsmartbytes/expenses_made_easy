import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let userId = body.user_id;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If no user_id provided, get first user or create demo user
    if (!userId) {
      const { data: expenses } = await supabase.from('expenses').select('user_id').limit(1);
      if (expenses && expenses.length > 0 && expenses[0].user_id) {
        userId = expenses[0].user_id;
      } else {
        // Use a demo user ID
        userId = 'demo-user-' + Date.now();
      }
    }

    // Seed Categories
    const categories = [
      { user_id: userId, name: 'Office Supplies', color: '#3B82F6', icon: '📎', is_tax_deductible: true, deduction_percentage: 100 },
      { user_id: userId, name: 'Travel', color: '#8B5CF6', icon: '✈️', is_tax_deductible: true, deduction_percentage: 100 },
      { user_id: userId, name: 'Meals & Entertainment', color: '#EF4444', icon: '🍽️', is_tax_deductible: true, deduction_percentage: 50 },
      { user_id: userId, name: 'Vehicle', color: '#10B981', icon: '🚗', is_tax_deductible: true, deduction_percentage: 100 },
      { user_id: userId, name: 'Utilities', color: '#F59E0B', icon: '💡', is_tax_deductible: true, deduction_percentage: 100 },
      { user_id: userId, name: 'Software & Subscriptions', color: '#6366F1', icon: '💻', is_tax_deductible: true, deduction_percentage: 100 },
      { user_id: userId, name: 'Marketing', color: '#EC4899', icon: '📢', is_tax_deductible: true, deduction_percentage: 100 },
      { user_id: userId, name: 'Professional Services', color: '#14B8A6', icon: '👔', is_tax_deductible: true, deduction_percentage: 100 },
      { user_id: userId, name: 'Insurance', color: '#F97316', icon: '🛡️', is_tax_deductible: true, deduction_percentage: 100 },
      { user_id: userId, name: 'Personal', color: '#64748B', icon: '👤', is_tax_deductible: false, deduction_percentage: 0 },
    ];

    const { data: categoryData } = await supabase.from('categories').insert(categories).select();

    // Create category lookup
    const categoryMap: Record<string, string> = {};
    if (categoryData) {
      categoryData.forEach(cat => {
        categoryMap[cat.name] = cat.id;
      });
    }

    // Seed Expenses (last 60 days)
    const today = new Date();
    const expenses = [
      { user_id: userId, category_id: categoryMap['Office Supplies'], amount: 45.99, description: 'Printer paper and ink cartridges', date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], vendor: 'Office Depot', is_business: true, payment_method: 'credit' },
      { user_id: userId, category_id: categoryMap['Meals & Entertainment'], amount: 78.50, description: 'Client lunch meeting', date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], vendor: 'The Capital Grille', is_business: true, payment_method: 'credit' },
      { user_id: userId, category_id: categoryMap['Software & Subscriptions'], amount: 29.99, description: 'Dropbox Pro monthly', date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], vendor: 'Dropbox', is_business: true, payment_method: 'credit' },
      { user_id: userId, category_id: categoryMap['Vehicle'], amount: 52.40, description: 'Gas fill-up', date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], vendor: 'Shell', is_business: true, payment_method: 'credit' },
      { user_id: userId, category_id: categoryMap['Travel'], amount: 289.00, description: 'Flight to client meeting', date: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], vendor: 'United Airlines', is_business: true, payment_method: 'credit' },
      { user_id: userId, category_id: categoryMap['Travel'], amount: 156.00, description: 'Hotel - 1 night', date: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], vendor: 'Marriott', is_business: true, payment_method: 'credit' },
      { user_id: userId, category_id: categoryMap['Marketing'], amount: 150.00, description: 'Facebook ads campaign', date: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], vendor: 'Meta', is_business: true, payment_method: 'credit' },
      { user_id: userId, category_id: categoryMap['Utilities'], amount: 89.50, description: 'Internet service', date: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], vendor: 'Comcast', is_business: true, payment_method: 'ach' },
      { user_id: userId, category_id: categoryMap['Professional Services'], amount: 350.00, description: 'Accountant consultation', date: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], vendor: 'Smith CPA', is_business: true, payment_method: 'check' },
      { user_id: userId, category_id: categoryMap['Personal'], amount: 125.00, description: 'Grocery shopping', date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], vendor: 'Whole Foods', is_business: false, payment_method: 'credit' },
      { user_id: userId, category_id: categoryMap['Office Supplies'], amount: 199.99, description: 'Wireless keyboard and mouse', date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], vendor: 'Amazon', is_business: true, payment_method: 'credit' },
      { user_id: userId, category_id: categoryMap['Meals & Entertainment'], amount: 42.00, description: 'Team coffee meeting', date: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], vendor: 'Starbucks', is_business: true, payment_method: 'cash' },
      { user_id: userId, category_id: categoryMap['Software & Subscriptions'], amount: 12.99, description: 'Spotify Premium', date: new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], vendor: 'Spotify', is_business: false, payment_method: 'credit' },
      { user_id: userId, category_id: categoryMap['Insurance'], amount: 245.00, description: 'Business liability insurance', date: new Date(today.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], vendor: 'State Farm', is_business: true, payment_method: 'ach' },
      { user_id: userId, category_id: categoryMap['Vehicle'], amount: 48.75, description: 'Gas fill-up', date: new Date(today.getTime() - 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], vendor: 'Chevron', is_business: true, payment_method: 'credit' },
    ];

    await supabase.from('expenses').insert(expenses);

    // Seed Mileage Trips
    const mileageTrips = [
      { user_id: userId, start_time: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), end_time: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(), distance_miles: 28.5, purpose: 'business', notes: 'Client meeting downtown', start_location: { address: '123 Home St, Denver, CO' }, end_location: { address: '456 Business Ave, Denver, CO' } },
      { user_id: userId, start_time: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), end_time: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(), distance_miles: 65.2, purpose: 'business', notes: 'Site visit - Aurora', start_location: { address: '123 Home St, Denver, CO' }, end_location: { address: '789 Industrial Blvd, Aurora, CO' } },
      { user_id: userId, start_time: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), end_time: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), distance_miles: 15.8, purpose: 'business', notes: 'Bank deposit', start_location: { address: '123 Home St, Denver, CO' }, end_location: { address: 'First National Bank, Denver, CO' } },
      { user_id: userId, start_time: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(), end_time: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), distance_miles: 42.0, purpose: 'business', notes: 'Supplier meeting', start_location: { address: '123 Home St, Denver, CO' }, end_location: { address: 'Tech Supplies Inc, Lakewood, CO' } },
      { user_id: userId, start_time: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), end_time: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(), distance_miles: 8.5, purpose: 'personal', notes: 'Personal errands', start_location: { address: '123 Home St, Denver, CO' }, end_location: { address: 'Shopping Center, Denver, CO' } },
      { user_id: userId, start_time: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(), end_time: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000).toISOString(), distance_miles: 95.0, purpose: 'business', notes: 'Conference in Boulder', start_location: { address: '123 Home St, Denver, CO' }, end_location: { address: 'Boulder Convention Center, Boulder, CO' } },
    ];

    await supabase.from('mileage').insert(mileageTrips);

    // Seed Budgets
    const budgets = [
      { user_id: userId, category: 'Office Supplies', amount: 500, period: 'monthly', profile: 'business', alert_threshold: 0.80, is_active: true },
      { user_id: userId, category: 'Travel', amount: 1500, period: 'monthly', profile: 'business', alert_threshold: 0.75, is_active: true },
      { user_id: userId, category: 'Meals & Entertainment', amount: 300, period: 'monthly', profile: 'business', alert_threshold: 0.80, is_active: true },
      { user_id: userId, category: 'Marketing', amount: 500, period: 'monthly', profile: 'business', alert_threshold: 0.90, is_active: true },
      { user_id: userId, category: 'Software & Subscriptions', amount: 200, period: 'monthly', profile: 'business', alert_threshold: 0.80, is_active: true },
    ];

    await supabase.from('budgets').insert(budgets);

    // Seed Recurring Expenses
    const recurringExpenses = [
      { user_id: userId, description: 'Dropbox Pro', amount: 29.99, frequency: 'monthly', category: 'Software & Subscriptions', is_business: true, next_date: new Date(today.getTime() + 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { user_id: userId, description: 'Internet Service', amount: 89.50, frequency: 'monthly', category: 'Utilities', is_business: true, next_date: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { user_id: userId, description: 'Business Insurance', amount: 245.00, frequency: 'monthly', category: 'Insurance', is_business: true, next_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
    ];

    await supabase.from('recurring_expenses').insert(recurringExpenses);

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      data: {
        categories: categories.length,
        expenses: expenses.length,
        mileage_trips: mileageTrips.length,
        budgets: budgets.length,
        recurring_expenses: recurringExpenses.length,
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint with { "user_id": "your-user-id" } to seed demo data',
    warning: 'This will add sample categories, expenses, mileage trips, budgets, and recurring expenses',
  });
}
