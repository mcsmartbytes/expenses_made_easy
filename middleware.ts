import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Get the session token from cookies
  const accessToken = req.cookies.get('sb-access-token')?.value;
  const refreshToken = req.cookies.get('sb-refresh-token')?.value;

  // Protected routes that require authentication
  const protectedRoutes = [
    '/expense-dashboard',
    '/expenses',
    '/mileage',
    '/profile',
    '/budgets',
    '/receipts',
  ];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // TEMPORARY: Disable auth check for development
  // Redirect to login if accessing protected route without session
  // if (isProtectedRoute && !accessToken && !refreshToken) {
  //   const redirectUrl = new URL('/auth/login', req.url);
  //   redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
  //   return NextResponse.redirect(redirectUrl);
  // }

  // Redirect to dashboard if accessing auth pages with active session
  if (
    (req.nextUrl.pathname.startsWith('/auth/login') ||
      req.nextUrl.pathname.startsWith('/auth/signup')) &&
    (accessToken || refreshToken)
  ) {
    return NextResponse.redirect(new URL('/expense-dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/expense-dashboard/:path*',
    '/expenses/:path*',
    '/mileage/:path*',
    '/profile/:path*',
    '/budgets/:path*',
    '/receipts/:path*',
    '/auth/login',
    '/auth/signup',
  ],
};
