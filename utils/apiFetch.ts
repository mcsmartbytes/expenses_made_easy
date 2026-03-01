import { supabase } from './supabase';

/**
 * Authenticated fetch wrapper that attaches the Supabase access token.
 * Drop-in replacement for fetch() when calling API routes.
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
