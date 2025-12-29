'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useUserMode } from '@/contexts/UserModeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Navigation({ variant = 'expenses' }: { variant?: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { mode, toggleMode, isBusiness } = useUserMode();
  const { isEmbedded } = useAuth();

  // Hide navigation in embedded mode for cleaner iframe experience
  if (isEmbedded) {
    return null;
  }

  const navLinks = [
    { href: '/expenses/dashboard', label: 'Dashboard' },
    { href: '/expenses', label: 'Expenses' },
    { href: '/projects', label: 'Projects' },
    { href: '/budgets', label: 'Budgets' },
    { href: '/subscriptions', label: 'Subscriptions' },
    { href: '/price-tracker', label: 'Prices' },
    { href: '/receipts', label: 'Receipts' },
    { href: '/mileage', label: 'Mileage' },
    { href: '/reports', label: 'Reports' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <nav className="bg-gradient-to-r from-slate-900 to-slate-800 text-slate-100 shadow relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-slate-700 flex items-center justify-center text-slate-50 text-sm font-bold border border-slate-600">
            EM
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">
              Expenses Made Easy
            </span>
            <span className="text-[11px] text-slate-300">
              Expenses · Budgets · Receipts
            </span>
          </div>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-slate-200 hover:text-blue-400 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <button
            onClick={toggleMode}
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isBusiness
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30'
                : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30'
            }`}
            title={`Switch to ${isBusiness ? 'Personal' : 'Business'} Mode`}
          >
            <span className="text-sm">{isBusiness ? '💼' : '👤'}</span>
            <span>{isBusiness ? 'Business' : 'Personal'}</span>
            <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-slate-700 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <div className="hidden sm:flex h-8 w-8 rounded-full bg-slate-700/60 border border-slate-600 items-center justify-center text-[10px] font-semibold text-slate-200">
            ME
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-slate-900 border-t border-slate-700 shadow-lg z-50">
          {/* Mode Toggle - Mobile */}
          <div className="px-3 pt-3">
            <button
              onClick={toggleMode}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isBusiness
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              <span className="text-base">{isBusiness ? '💼' : '👤'}</span>
              <span>{isBusiness ? 'Business Mode' : 'Personal Mode'}</span>
              <span className="text-xs opacity-60 ml-1">(tap to switch)</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1 p-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-sm text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
