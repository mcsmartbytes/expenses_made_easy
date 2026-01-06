import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'set' : 'MISSING',
    key: supabaseAnonKey ? 'set' : 'MISSING'
  });
}

export function createClient() {
  return createSupabaseClient(supabaseUrl!, supabaseAnonKey!, {
    db: {
      schema: 'public'  // Use public schema in unified database
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'expenses-made-easy-auth'
    }
  });
}

export const supabase = createClient();
