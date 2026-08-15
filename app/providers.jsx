'use client';

import { SessionProvider } from 'next-auth/react';
import PresenceHeartbeat from '@/components/PresenceHeartbeat';

export function Providers({ children }) {
  return (
    <SessionProvider>
      <PresenceHeartbeat />
      {children}
    </SessionProvider>
  );
}