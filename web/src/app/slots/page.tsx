'use client';
import { GamePage } from '@/components/GamePage';
import { SlotMachine } from '@/components/SlotMachine';

export default function SlotsPage() {
  return (
    <GamePage
      title="Pull the lever."
      accent="Win 10 tokens."
      blurb="Each spin is one pack: the same on-chain draw, the same public odds, 10 real-priced tokens to your wallet. Three crowns is a jackpot."
      verb="Spin"
      renderMachine={(p) => <SlotMachine {...p} />}
    />
  );
}
