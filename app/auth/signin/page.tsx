'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    console.log('🔐 Sign in attempt started', { email });
    console.log('📡 Supabase client:', supabase);
    console.log('🌍 Environment:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('📥 Sign in response:', { data, error });

      if (error) {
        console.error('❌ Sign in error:', error);
        throw error;
      }

      if (data?.session) {
        console.log('✅ Session created, redirecting to dashboard');
        console.log('💾 Session stored in localStorage');

        // Wait 5 seconds so you can see any errors
        console.log('⏰ Waiting 5 seconds before redirect...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Use window.location for a full page reload to ensure session is loaded
        console.log('🔄 Redirecting now...');
        window.location.href = '/expense-dashboard';
      } else {
        console.log('⚠️ No session returned');
        setMessage('Check your email to confirm your account, then sign in.');
      }
    } catch (err: any) {
      console.error('💥 Caught error:', err);
      setMessage(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
        <p className="text-gray-600 mb-6">Welcome back — sign in to continue</p>

        <form onSubmit={handleSignIn} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {message && (
          <p className="text-center text-sm mt-4 text-red-600">{message}</p>
        )}

        <p className="text-center text-sm text-gray-600 mt-6">
          No account yet?{' '}
          <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-semibold">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}

