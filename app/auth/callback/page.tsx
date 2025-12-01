'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    async function handle() {
      try {
        // Try to exchange code or hash for a session (PKCE/OTP flows)
        await supabase.auth.exchangeCodeForSession(window.location.href).catch(() => {});
      } catch {
        setStatus('error');
      } finally {
        setStatus('done');
        router.replace('/expense-dashboard');
      }
    }
    handle();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Completing sign-in…</p>
    </div>
  );
}

