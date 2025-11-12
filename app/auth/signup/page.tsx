'use client';

import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Get Started Free</h1>
        <p className="text-gray-600 mb-6">Create your free account to start tracking expenses</p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Free Plan Includes:</strong>
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1">
            <li>✓ 50 expenses per month</li>
            <li>✓ Basic categorization</li>
            <li>✓ Simple reports</li>
          </ul>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            Create Free Account
          </button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold">
            Sign in
          </Link>
        </p>

        <p className="text-center text-sm text-gray-500 mt-4">
          Want unlimited expenses?{' '}
          <Link href="/pricing" className="text-blue-600 hover:text-blue-700 font-semibold">
            View paid plans
          </Link>
        </p>
      </div>
    </div>
  );
}
