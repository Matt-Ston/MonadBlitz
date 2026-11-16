'use client';
import { useSyncExternalStore } from 'react';
import { useBank, type BankState } from './sdk';

// "Pay from bank" is one app-wide switch (set on Home, used by Packs, Slots and Wheel), remembered per browser.
const KEY = 'coinpack:payFromBank';
const listeners = new Set<() => void>();
let pay = true;
try {
  pay = localStorage.getItem(KEY) !== '0';
} catch {
  /* storage blocked or server render: default on */
}

export function setPayFromBank(on: boolean): void {
  pay = on;
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* not persisted, still applies this session */
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function usePayFromBank(): boolean {
  return useSyncExternalStore(subscribe, () => pay, () => true);
}

/**
 * The bank plus whether the next open should be paid from it: the switch is on and there's a balance.
 * An empty bank falls back to the wallet, so the switch never blocks a first-time player.
 */
export function useBankPay(): { bank: BankState; fromBank: boolean } {
  const bank = useBank();
  const on = usePayFromBank();
  return { bank, fromBank: bank.supported && on && (bank.balanceWei ?? 0n) > 0n };
}
