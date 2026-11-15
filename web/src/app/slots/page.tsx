'use client';
import { GamePage } from '@/components/GamePage';
import { SlotMachine } from '@/components/SlotMachine';

export default function SlotsPage() {
  return (
    <GamePage
      title="Pull the lever."
      accent="Win 3–5 tokens."
      blurb="Each spin is one pack: the same on-chain draw, the same public odds, 3–5 real-priced tokens to your wallet. Three crowns is an Ultra Legendary."
      verb="Spin"
      renderMachine={(p) => <SlotMachine {...p} />}
    />
  );
}
