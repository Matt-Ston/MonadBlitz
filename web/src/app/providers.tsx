'use client';
import { CoinPackProvider } from '@/lib/sdk';

export function Providers({ children }: { children: React.ReactNode }) {
  return <CoinPackProvider>{children}</CoinPackProvider>;
}
