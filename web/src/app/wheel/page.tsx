'use client';
import { useOdds } from '@/lib/sdk';
import { GamePage } from '@/components/GamePage';
import { WheelSpin } from '@/components/WheelSpin';

export default function WheelPage() {
  const { data: odds } = useOdds();
  return (
    <GamePage
      title="Spin the wheel."
      accent="Win 10 tokens."
      blurb="Each slice is sized by the real odds, so the Ultra Legendary sliver really is that thin. Each spin is one pack: the same on-chain draw and 10 real-priced tokens to your wallet."
      verb="Spin"
      renderMachine={(p) => <WheelSpin {...p} odds={odds} />}
    />
  );
}
