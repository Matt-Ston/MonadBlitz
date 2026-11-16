import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Nav } from '@/components/Nav';
import { DuckMascot } from '@/components/DuckMascot';
import { ScreenMayhem } from '@/components/ScreenMayhem';
import { WaterBackdrop } from '@/components/WaterBackdrop';

export const metadata: Metadata = {
  title: 'CoinPack',
  description: 'Open a pack of 3–5 testnet tokens on Monad. Public odds, on-chain draw.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          <WaterBackdrop />
          <Nav />
          <main className="relative z-[1] mx-auto w-full max-w-5xl px-4 pb-16 pt-6">{children}</main>
          <footer className="relative z-[1] pb-8 text-center text-xs text-white/40">
            Testnet demo on Monad. Mock tokens, no real value.
          </footer>
          <ScreenMayhem />
          <DuckMascot />
        </Providers>
      </body>
    </html>
  );
}
