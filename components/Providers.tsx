'use client';

import { ReactNode } from 'react';
import { UserModeProvider } from '@/contexts/UserModeContext';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <UserModeProvider>
      {children}
    </UserModeProvider>
  );
}
