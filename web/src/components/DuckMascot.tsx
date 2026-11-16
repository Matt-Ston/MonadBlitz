'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { onFx, type FxEvent } from '@/lib/fx';
import { Duck } from './Duck';

type Look = { shades?: boolean; crown?: boolean; sad?: boolean };

const BUSY_LINES = ['Good luck!', 'Quack quack…', 'Big one incoming?', 'I have a good feeling!'];
const PULL_LINES: Record<number, string> = {
  1: 'Nice one!',
  2: 'Ooh, shiny!',
  3: 'LEGENDARY! QUACK!',
  4: 'MYTHIC?! NO WAY!',
  5: 'ULTRA LEGENDARY!!!',
};
const HEART_COLORS = ['#fb7185', '#fcd34d', '#c084fc', '#38bdf8'];

/**
 * The duck lives in the bottom-left corner on every page. It reacts to the games, and on an Epic-or-better
 * card it flies across the screen to that card, fusses over it, then flies home.
 */
export function DuckMascot() {
  const controls = useAnimationControls();
  const home = useRef<HTMLDivElement | null>(null);
  const flying = useRef(false);
  const [look, setLook] = useState<Look>({});
  const [bubble, setBubble] = useState<{ id: number; text: string } | null>(null);
  const [hearts, setHearts] = useState(0); // bump to replay the heart burst
  const [tears, setTears] = useState(0); // bump to replay the crying
  const bubbleTimer = useRef<ReturnType<typeof setTimeout>>();

  function say(text: string, ms = 2200) {
    clearTimeout(bubbleTimer.current);
    setBubble({ id: Date.now(), text });
    bubbleTimer.current = setTimeout(() => setBubble(null), ms);
  }

  async function hop() {
    if (flying.current) return;
    await controls.start({ y: [0, -22, 0, -10, 0], rotate: [0, -8, 6, -4, 0], transition: { duration: 0.6 } });
  }

  async function flyTo(e: Extract<FxEvent, { type: 'pull' }>) {
    if (flying.current || !home.current) return;
    flying.current = true;
    const me = home.current.getBoundingClientRect();
    // Land on the card's left edge, beak pointing at it; with no card (slots / wheel) go to mid-screen.
    const tx = e.rect ? e.rect.x - me.width * 0.55 : window.innerWidth / 2 - me.width * 1.6;
    const ty = e.rect ? e.rect.y + e.rect.h * 0.5 - me.height / 2 : window.innerHeight * 0.42;
    const dx = Math.max(8, tx) - me.left;
    const dy = ty - me.top;
    const big = e.rarity >= 5 ? 1.8 : e.rarity >= 4 ? 1.6 : e.rarity >= 3 ? 1.45 : 1.25;

    setLook({ shades: e.rarity === 4, crown: e.rarity >= 5 });
    say(PULL_LINES[e.rarity] ?? 'Quack!', 3200);
    await controls.start({
      x: [0, dx * 0.5, dx],
      y: [0, Math.min(dy, 0) - 140, dy],
      rotate: [0, -25, 0],
      scale: [1, big * 1.1, big],
      transition: { duration: 0.75, ease: 'easeInOut' },
    });
    setHearts((n) => n + 1);
    // Fuss over the card: nuzzle it, then a happy spin for the best ones.
    await controls.start({
      x: [dx, dx + 14, dx - 6, dx + 14, dx],
      rotate: [0, 14, -10, 14, 0],
      y: [dy, dy - 10, dy, dy - 10, dy],
      transition: { duration: 0.9 },
    });
    if (e.rarity >= 3) {
      setHearts((n) => n + 1);
      await controls.start({ rotate: [0, 360], y: [dy, dy - 46, dy], transition: { duration: 0.7 } });
    }
    await controls.start({
      x: [dx, dx * 0.5, 0],
      y: [dy, Math.min(dy, 0) - 110, 0],
      rotate: [0, 20, 0],
      scale: [big, 1.2, 1],
      transition: { duration: 0.7, ease: 'easeInOut' },
    });
    controls.set({ rotate: 0 });
    setLook({});
    flying.current = false;
  }

  useEffect(() => {
    return onFx((e) => {
      if (e.type === 'busy') {
        setLook({});
        say(BUSY_LINES[Math.floor(Math.random() * BUSY_LINES.length)]);
        void hop();
      } else if (e.type === 'pull') {
        if (e.uncommon) {
          say('Uncommon! Not bad!', 1800);
          void hop();
        } else if (e.rarity >= 2) void flyTo(e);
        else if (e.rarity === 1) {
          say(PULL_LINES[1], 1400);
          void hop();
        }
      } else if (e.type === 'pack' && !flying.current) {
        setLook({ sad: !e.won });
        say(e.won ? 'We’re up! Quack!' : e.bad ? 'Ouch… that one hurt.' : 'Next one’s ours…', e.bad ? 3200 : 2200);
        if (e.bad) setTears((n) => n + 1);
        void hop();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={home} className="pointer-events-none fixed bottom-28 left-3 z-[58] h-[72px] w-[72px] sm:h-[88px] sm:w-[88px]">
      <motion.div animate={controls} className="relative h-full w-full">
        {/* idle bob */}
        <motion.button
          type="button"
          aria-label="CoinPack duck"
          onClick={() => {
            say('Quack!', 1200);
            void hop();
          }}
          className="pointer-events-auto block h-full w-full cursor-pointer drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)]"
          animate={{ y: [0, -5, 0], rotate: [0, -2, 2, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Duck size={88} {...look} className="h-full w-full" />
        </motion.button>

        {/* hearts and sparkles when it reaches a good card */}
        {hearts > 0 &&
          Array.from({ length: 8 }, (_, i) => (
            <motion.span
              key={`${hearts}-${i}`}
              className="absolute left-1/2 top-1/3 text-lg"
              style={{ color: HEART_COLORS[i % HEART_COLORS.length] }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
              animate={{ x: (i - 3.5) * 16, y: -50 - (i % 3) * 22, opacity: 0, scale: 1.5 }}
              transition={{ duration: 1.1, delay: i * 0.05, ease: 'easeOut' }}
            >
              {i % 2 ? '✦' : '♥'}
            </motion.span>
          ))}

        {tears > 0 &&
          Array.from({ length: 6 }, (_, i) => (
            <motion.span
              key={`tear-${tears}-${i}`}
              className="absolute left-[68%] top-[34%] h-2.5 w-2 rounded-full bg-sky-300"
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: 46, opacity: 0 }}
              transition={{ duration: 0.7, delay: i * 0.4 }}
            />
          ))}

        {/* centred over the duck so it stays on screen wherever the duck flies */}
        <div className="absolute bottom-full left-1/2 mb-1 flex w-0 justify-center">
        <AnimatePresence>
          {bubble && (
            <motion.div
              key={bubble.id}
              className="whitespace-nowrap rounded-2xl bg-white px-3 py-1.5 text-[11px] font-black text-black shadow-lg"
              initial={{ opacity: 0, scale: 0.5, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 420, damping: 18 }}
            >
              {bubble.text}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
