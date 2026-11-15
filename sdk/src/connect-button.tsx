'use client';
import React from 'react';
import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';
import { MOCK, MOCK_ADDRESS } from './mock';

// Mock mode is unstyled on purpose: web wraps it with its own pill styling.
export function ConnectButton(): JSX.Element {
  if (!MOCK) return <RainbowConnectButton />;
  return (
    <button type="button" disabled>
      {MOCK_ADDRESS.slice(0, 6)}…{MOCK_ADDRESS.slice(-4)} (mock)
    </button>
  );
}
