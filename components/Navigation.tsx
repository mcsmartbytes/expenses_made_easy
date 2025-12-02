'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  async function handleLogout() {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setMobileMenuOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  }

  const navItems = [
    { href: '/expense-dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/expenses', label: 'Expenses', icon: '📋' },
    { href: '/recurring', label: 'Recurring', icon: '🔄' },
    { href: '/budgets', label: 'Budgets', icon: '💰' },
    { href: '/receipts', label: 'Receipts', icon: '🧾' },
    { href: '/mileage', label: 'Mileage', icon: '🚗' },
    { href: '/reports', label: 'Reports', icon: '📈' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/expense-dashboard" className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="text-xl font-bold text-gray-900">Expenses Made Easy</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            {user ? (
              <button
                onClick={handleLogout}
                disabled={loading}
                className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
              >
                <span className="mr-1">🚪</span>
                {loading ? 'Logging out...' : 'Logout'}
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="ml-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                <span className="mr-1">🔐</span>
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              <div className="border-t my-2 pt-2">
                {user ? (
                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-lg text-sm font-medium text-left text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                  >
                    <span className="mr-2">🚪</span>
                    {loading ? 'Logging out...' : 'Logout'}
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    className="block px-4 py-3 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition text-center"
                  >
                    <span className="mr-2">🔐</span>
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
