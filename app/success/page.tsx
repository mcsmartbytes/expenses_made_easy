'use client';
import Link from 'next/link';
import { Suspense } from 'react';

function SuccessContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-2">Welcome to Premium!</h1>
        <p className="text-gray-600 mb-6">Your subscription is now active. Enjoy all premium features!</p>
        <Link href="/expense-dashboard" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return <Suspense fallback={<div>Loading...</div>}><SuccessContent /></Suspense>;
}
