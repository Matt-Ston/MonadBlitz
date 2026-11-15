'use client';
import '@rainbow-me/rainbowkit/styles.css';
import React, { useState } from 'react';
import { RainbowKitProvider, darkTheme, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { monadTestnet } from './chain';
import { MOCK } from './mock';

// Built once at module load, real mode only. Any projectId string works for injected wallets.
const wagmiConfig = MOCK
  ? undefined
  : getDefaultConfig({
      appName: 'CoinPack',
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'coinpack-demo',
      chains: [monadTestnet],
      ssr: true,
    });

function RealProvider(props: { children: React.ReactNode }): JSX.Element {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig!}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ accentColor: '#836EF9' })} initialChain={monadTestnet}>
          {props.children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function CoinPackProvider(props: { children: React.ReactNode }): JSX.Element {
  if (MOCK) return <>{props.children}</>;
  return <RealProvider>{props.children}</RealProvider>;
}
