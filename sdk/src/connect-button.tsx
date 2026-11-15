'use client';
import React from 'react';
import { MOCK_ADDRESS } from './mock';

// Real mode re-exports RainbowKit's ConnectButton once wagmi/RainbowKit are wired in.
// Unstyled on purpose: web applies its own classes/wrapper around this.
export function ConnectButton(): JSX.Element {
  return (
    <button type="button" disabled>
      {MOCK_ADDRESS.slice(0, 6)}…{MOCK_ADDRESS.slice(-4)} (mock)
    </button>
  );
}
