'use client';
import { motion } from 'framer-motion';

// Shared pieces for the full-screen scenes (ScreenMayhem.tsx, ScreenScenes.tsx).

// Deterministic jitter so a scene doesn't reshuffle on re-render.
export const j = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
export const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Opening flash: the whole screen whites out in the scene's colour, then clears. */
export function Flash({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute inset-0"
      style={{ background: `radial-gradient(circle at 50% 45%, #ffffff, ${color} 45%, ${color}55 100%)`, mixBlendMode: 'screen' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 0.85, 0] }}
      transition={{ duration: 0.9, times: [0, 0.25, 1], ease: 'easeOut' }}
    />
  );
}

/** Rotating sun rays behind everything, filling the screen. */
export function Rays({ color, duration }: { color: string; duration: number }) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 h-[240vmax] w-[240vmax]"
      style={{ marginLeft: '-120vmax', marginTop: '-120vmax', background: `repeating-conic-gradient(${color} 0deg 6deg, transparent 6deg 18deg)`, mixBlendMode: 'screen' }}
      initial={{ opacity: 0, rotate: 0 }}
      animate={{ opacity: [0, 0.8, 0.7, 0], rotate: 120 }}
      transition={{ duration, ease: 'linear' }}
    />
  );
}

export function Banner({ text, className }: { text: string; className: string }) {
  return (
    <div className={`fx-marquee absolute left-0 top-[28vh] whitespace-nowrap text-[18vw] font-black uppercase leading-none tracking-tight drop-shadow-[0_0_40px_currentColor] ${className}`}>
      {text}
    </div>
  );
}

