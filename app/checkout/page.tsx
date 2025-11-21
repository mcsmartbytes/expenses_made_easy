'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'premium';
  const interval = searchParams.get('interval') || 'month';
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setCheckingAuth(false);
  }

  const handleCheckout = async () => {
    if (!user) {
      router.push(`/auth/login?redirect=/checkout?plan=${plan}&interval=${interval}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          interval,
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const stripe = await stripePromise;
      await stripe!.redirectToCheckout({ sessionId: data.sessionId });
    } catch (error: any) {
      console.error(error);
      setError(error.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const planDetails = {
    premium: {
      name: 'Premium',
      monthlyPrice: '$9.99',
      yearlyPrice: '$79.99',
      features: ['Unlimited expenses', 'Budget tracking', 'Receipt attachments', 'Export CSV/PDF'],
    },
    pro: {
      name: 'Pro',
      monthlyPrice: '$19.99',
      yearlyPrice: '$159.99',
      features: ['Everything in Premium', 'Advanced reports', 'Family sharing', 'API access'],
    },
  };

  const selectedPlan = planDetails[plan as keyof typeof planDetails] || planDetails.premium;
  const price = interval === 'year' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2">Complete Purchase</h1>
        <p className="text-gray-600 mb-6">Start your 14-day free trial of {selectedPlan.name} plan</p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold text-lg">{selectedPlan.name} Plan</span>
            <span className="text-2xl font-bold text-blue-600">{price}<span className="text-sm text-gray-600">/{interval}</span></span>
          </div>
          <ul className="space-y-2">
            {selectedPlan.features.map((feature, i) => (
              <li key={i} className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {!user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              Please <Link href={`/auth/login?redirect=/checkout?plan=${plan}&interval=${interval}`} className="font-semibold underline">sign in</Link> or{' '}
              <Link href="/auth/signup" className="font-semibold underline">create an account</Link> to continue.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Processing...' : user ? 'Start Free Trial' : 'Sign In to Continue'}
        </button>

        <p className="text-xs text-center text-gray-500 mt-4">
          14-day free trial. Cancel anytime. No charges during trial.
        </p>

        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between">
          <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-700">
            ← Back to Pricing
          </Link>
          {interval === 'month' && (
            <Link href={`/checkout?plan=${plan}&interval=year`} className="text-sm text-blue-600 hover:text-blue-700">
              Save 33% with yearly →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
