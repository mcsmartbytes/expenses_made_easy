import { NextResponse } from 'next/server';

// Auth is handled client-side by AuthContext (route protection)
// and server-side by apiAuth.ts (API route Bearer token verification).
// Middleware is intentionally minimal — no cookie-based auth checks
// because the Supabase client uses localStorage, not cookies.

export async function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
