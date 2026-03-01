import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabaseAdmin';
import { getAuthenticatedUser } from '@/utils/apiAuth';
import {
  getDateRange,
  getPreviousPeriodRange,
  analyzeSpending,
  CategorySpending,
} from '@/lib/analytics';

// GET - analyze spending changes for a user
export async function GET(request: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(request);
  if (authError) return authError;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'month') as 'week' | 'month' | 'quarter' | 'year';

    // Get date ranges
    const currentRange = getDateRange(period);
    const previousRange = getPreviousPeriodRange(period);

    // Fetch current period expenses
    const { data: currentExpenses, error: currentError } = await supabaseAdmin
      .from('expenses')
      .select('amount, category_id, categories(id, name, icon)')
      .eq('user_id', user!.id)
      .gte('date', currentRange.start.toISOString().split('T')[0])
      .lte('date', currentRange.end.toISOString().split('T')[0]);

    if (currentError) throw currentError;

    // Fetch previous period expenses
    const { data: previousExpenses, error: previousError } = await supabaseAdmin
      .from('expenses')
      .select('amount, category_id, categories(id, name, icon)')
      .eq('user_id', user!.id)
      .gte('date', previousRange.start.toISOString().split('T')[0])
      .lte('date', previousRange.end.toISOString().split('T')[0]);

    if (previousError) throw previousError;

    // Group by category
    function groupByCategory(expenses: any[]): CategorySpending[] {
      const grouped: Record<string, CategorySpending> = {};

      for (const expense of expenses) {
        const catId = expense.category_id || 'uncategorized';
        const catName = expense.categories?.name || 'Uncategorized';
        const catIcon = expense.categories?.icon || '📦';

        if (!grouped[catId]) {
          grouped[catId] = {
            category_id: catId,
            category_name: catName,
            category_icon: catIcon,
            total: 0,
            count: 0,
          };
        }

        grouped[catId].total += parseFloat(expense.amount);
        grouped[catId].count += 1;
      }

      return Object.values(grouped);
    }

    const currentGrouped = groupByCategory(currentExpenses || []);
    const previousGrouped = groupByCategory(previousExpenses || []);

    // Analyze spending
    const analysis = analyzeSpending(currentGrouped, previousGrouped);

    return NextResponse.json({
      success: true,
      data: {
        ...analysis,
        period,
        current_period: {
          start: currentRange.start.toISOString().split('T')[0],
          end: currentRange.end.toISOString().split('T')[0],
        },
        previous_period: {
          start: previousRange.start.toISOString().split('T')[0],
          end: previousRange.end.toISOString().split('T')[0],
        },
      },
    });
  } catch (error: any) {
    console.error('Error analyzing spending:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
