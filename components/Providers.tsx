'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserModeProvider } from '@/contexts/UserModeContext';
import { MileageTrackingProvider } from '@/contexts/MileageTrackingContext';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <UserModeProvider>
        <MileageTrackingProvider>
          {children}
        </MileageTrackingProvider>
      </UserModeProvider>
    </AuthProvider>
  );
}
