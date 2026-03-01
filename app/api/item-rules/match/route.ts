import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabaseAdmin';
import { getAuthenticatedUser } from '@/utils/apiAuth';

// Pattern matching logic for item names
function matchesPattern(
  itemName: string,
  pattern: string,
  matchType: 'exact' | 'contains' | 'starts_with'
): boolean {
  const normalizedItem = itemName.toLowerCase().trim();
  const normalizedPattern = pattern.toLowerCase().trim();

  switch (matchType) {
    case 'exact':
      return normalizedItem === normalizedPattern;
    case 'starts_with':
      return normalizedItem.startsWith(normalizedPattern);
    case 'contains':
    default:
      return normalizedItem.includes(normalizedPattern);
  }
}

// POST - find matching rule for an item
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError) return authError;

    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { item_name, vendor } = body;

    if (!item_name) {
      return NextResponse.json(
        { success: false, error: 'Item name is required' },
        { status: 400 }
      );
    }

    // Fetch all active rules for the user
    const { data: rules, error } = await supabaseAdmin
      .from('item_category_rules')
      .select('*, categories(id, name, icon, color)')
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('match_count', { ascending: false });

    if (error) throw error;

    if (!rules || rules.length === 0) {
      return NextResponse.json({
        success: true,
        match: null,
        message: 'No rules found for user',
      });
    }

    // Find first matching rule
    for (const rule of rules) {
      // If rule has vendor_pattern, check vendor match first
      if (rule.vendor_pattern && vendor) {
        const vendorMatches = vendor.toLowerCase().includes(rule.vendor_pattern);
        if (!vendorMatches) continue;
      } else if (rule.vendor_pattern && !vendor) {
        // Rule requires vendor but none provided, skip
        continue;
      }

      // Check item pattern match
      if (matchesPattern(item_name, rule.item_pattern, rule.match_type)) {
        // Increment match count in background (don't wait)
        supabaseAdmin
          .from('item_category_rules')
          .update({ match_count: rule.match_count + 1 })
          .eq('id', rule.id)
          .then(() => {});

        return NextResponse.json({
          success: true,
          match: {
            rule_id: rule.id,
            category_id: rule.category_id,
            category_name: rule.categories?.name || null,
            category_icon: rule.categories?.icon || null,
            category_color: rule.categories?.color || null,
            is_business: rule.is_business,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      match: null,
      message: 'No matching rule found',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST batch - find matching rules for multiple items
export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError) return authError;

    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { items, vendor } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Items array is required' },
        { status: 400 }
      );
    }

    // Fetch all active rules for the user
    const { data: rules, error } = await supabaseAdmin
      .from('item_category_rules')
      .select('*, categories(id, name, icon, color)')
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('match_count', { ascending: false });

    if (error) throw error;

    if (!rules || rules.length === 0) {
      return NextResponse.json({
        success: true,
        matches: {},
        message: 'No rules found for user',
      });
    }

    // Find matches for each item
    const matches: Record<string, any> = {};

    for (const itemName of items) {
      for (const rule of rules) {
        // Check vendor pattern if exists
        if (rule.vendor_pattern && vendor) {
          const vendorMatches = vendor.toLowerCase().includes(rule.vendor_pattern);
          if (!vendorMatches) continue;
        } else if (rule.vendor_pattern && !vendor) {
          continue;
        }

        if (matchesPattern(itemName, rule.item_pattern, rule.match_type)) {
          matches[itemName] = {
            rule_id: rule.id,
            category_id: rule.category_id,
            category_name: rule.categories?.name || null,
            category_icon: rule.categories?.icon || null,
            is_business: rule.is_business,
          };
          break; // First match wins
        }
      }
    }

    return NextResponse.json({
      success: true,
      matches,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET - check if rule exists for pattern
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError) return authError;

    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const pattern = searchParams.get('pattern');

    if (!pattern) {
      return NextResponse.json(
        { success: false, error: 'Pattern is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('item_category_rules')
      .select('id')
      .eq('user_id', user!.id)
      .ilike('item_pattern', pattern)
      .limit(1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      exists: data && data.length > 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
