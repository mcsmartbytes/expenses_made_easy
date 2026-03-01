import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Extracts and verifies the authenticated user from the request.
 * Expects an Authorization: Bearer <access_token> header.
 * Returns { user } on success or { error: NextResponse } on failure.
 */
export async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.replace('Bearer ', '');

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      ),
    };
  }

  return { user, error: null };
}
