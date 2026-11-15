'use client';
import React from 'react';
import { MOCK } from './mock';

// Real mode (wagmi + react-query + RainbowKit) lands once contracts/ deployments exist.
// Until then CoinPackProvider is a passthrough; every hook below works off the mock store.
export function CoinPackProvider(props: { children: React.ReactNode }): JSX.Element {
  if (!MOCK) {
    console.warn('@coinpack/sdk: NEXT_PUBLIC_MOCK=0 but real mode is not wired yet; behaving as mock.');
  }
  return <>{props.children}</>;
}
