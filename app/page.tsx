'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Expenses Made Easy
            </h1>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-blue-600 hover:text-blue-700 px-4 py-2 rounded-lg transition"
              >
                Sign In
              </Link>
              <Link
                href="/pricing"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Track Your Expenses Effortlessly
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Manage your finances, categorize expenses, and gain insights with powerful tools
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/pricing"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg"
            >
              Start Free Trial
            </Link>
            <a
              href="#features"
              className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition"
            >
              Learn More
            </a>
          </div>
        </div>

        <div id="features" className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Unlimited Expense Logging</h3>
            <p className="text-gray-600 mb-4">
              Track all your expenses with unlimited entries and detailed categorization
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✓ Unlimited expense entries</li>
              <li>✓ Custom categories</li>
              <li>✓ Receipt uploads</li>
              <li>✓ Quick entry forms</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Budget Management</h3>
            <p className="text-gray-600 mb-4">
              Set budgets, track spending, and get alerts when approaching limits
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✓ Monthly budgets</li>
              <li>✓ Category budgets</li>
              <li>✓ Spending alerts</li>
              <li>✓ Budget insights</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Advanced Reports</h3>
            <p className="text-gray-600 mb-4">
              Generate detailed reports and export your data in multiple formats
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✓ Monthly/yearly reports</li>
              <li>✓ Category breakdown</li>
              <li>✓ Export to CSV/PDF</li>
              <li>✓ Custom date ranges</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Receipt Storage</h3>
            <p className="text-gray-600 mb-4">
              Upload and store receipts with automatic organization
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✓ Photo upload</li>
              <li>✓ Cloud storage</li>
              <li>✓ Auto-categorization</li>
              <li>✓ Quick search</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Multi-Currency Support</h3>
            <p className="text-gray-600 mb-4">
              Track expenses in multiple currencies with automatic conversion
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✓ 150+ currencies</li>
              <li>✓ Real-time rates</li>
              <li>✓ Auto conversion</li>
              <li>✓ Travel friendly</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Progressive Web App</h3>
            <p className="text-gray-600 mb-4">
              Install on any device and work offline with PWA technology
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✓ Install on mobile/desktop</li>
              <li>✓ Offline functionality</li>
              <li>✓ Fast performance</li>
              <li>✓ Native app experience</li>
            </ul>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Choose the perfect plan for your needs. Start with a 14-day free trial!
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
          >
            View Pricing Plans
          </Link>
        </div>

        <footer className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-600">
          <p className="mb-4">
            <strong>Features:</strong> Unlimited Expenses • Budget Tracking • Advanced Reports • Receipt Storage
          </p>
          <p className="text-sm">
            © 2025 Expenses Made Easy. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
