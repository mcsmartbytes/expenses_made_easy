import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabaseAdmin';
import { getAuthenticatedUser } from '@/utils/apiAuth';

// GET - fetch all categories
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - create one or more categories
export async function POST(request: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(request);
  if (authError) return authError;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { categories } = body;

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Categories array is required' },
        { status: 400 }
      );
    }

    const categoriesToInsert = categories.map((cat: any) => {
      const { user_id: _catUserId, ...rest } = cat;
      return { ...rest, user_id: user!.id };
    });

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert(categoriesToInsert)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - delete a category by ID
export async function DELETE(request: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(request);
  if (authError) return authError;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - update a category
export async function PUT(request: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(request);
  if (authError) return authError;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
