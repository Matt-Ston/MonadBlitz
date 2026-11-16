'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { onFx } from '@/lib/fx';
import { Duck } from './Duck';

/**
 * Full-screen scenes for the rare pulls. They cover the whole viewport, not just the card:
 *   Epic            → Fly-by: a V of ducks crosses the screen
 *   Legendary       → Stampede (ducks charge across) or Golden Rain (coins and parachuting ducks)
 *   Mythic          → Quackzilla: a giant duck in shades rises over the page while it shakes
 *   Ultra Legendary → Disco Duck: spinning lights, duck rain, a dancing line and a crowned giant
 * Decoration only, played after the card is already revealed.
 */
type Kind = 'ripple' | 'flyby' | 'wave' | 'stampede' | 'goldrain' | 'quackzilla' | 'disco' | 'gloom';
const DURATION: Record<Kind, number> = { ripple: 2400, flyby: 2400, wave: 4000, stampede: 3400, goldrain: 3600, quackzilla: 4000, disco: 5600, gloom: 3600 };
const MAIN_CLASS: Partial<Record<Kind, string>> = {
  flyby: 'fx-bright', wave: 'fx-under', goldrain: 'fx-bright', stampede: 'fx-rumble', quackzilla: 'fx-shake', disco: 'fx-disco', gloom: 'fx-gloom',
};
const ALL_MAIN = ['fx-under', 'fx-bright', 'fx-rumble', 'fx-shake', 'fx-disco', 'fx-gloom'];

function kindFor(rarity: number): Kind | null {
  if (rarity >= 5) return 'disco';
  if (rarity === 4) return 'quackzilla';
  if (rarity === 3) return Math.random() < 0.5 ? 'stampede' : 'goldrain';
  if (rarity === 2) return Math.random() < 0.7 ? 'wave' : 'flyby'; // Epic: usually the tidal wave
  return null;
}

// Deterministic jitter so a scene doesn't reshuffle on re-render.
const j = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Opening flash: the whole screen whites out in the scene's colour, then clears. */
function Flash({ color }: { color: string }) {
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
function Rays({ color, duration }: { color: string; duration: number }) {
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

function Banner({ text, className }: { text: string; className: string }) {
  return (
    <div className={`fx-marquee absolute left-0 top-[28vh] whitespace-nowrap text-[18vw] font-black uppercase leading-none tracking-tight drop-shadow-[0_0_40px_currentColor] ${className}`}>
      {text}
    </div>
  );
}

function FlyBy() {
  const spots = [[0, 0], [-8, -8], [-8, 8], [-16, -16], [-16, 16], [-24, -24], [-24, 24], [-12, 0], [-22, 0]];
  return (
    <>
      <motion.div
        className="absolute inset-0"
        style={{ boxShadow: 'inset 0 0 260px 90px rgba(217,70,239,0.9)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.6, 1, 0] }}
        transition={{ duration: 2.2 }}
      />
      <Flash color="#e879f9" />
      <Rays color="rgba(232,121,249,0.45)" duration={2.2} />
      <Banner text="Epic pull!" className="text-fuchsia-300" />
      {spots.map(([ox, oy], i) => (
        <motion.div
          key={i}
          className="absolute left-0"
          style={{ top: `${42 + oy}vh` }}
          initial={{ x: `${-18 + ox}vw`, y: 0 }}
          animate={{ x: `${118 + ox}vw`, y: [0, -26, 0, -26, 0] }}
          transition={{ x: { duration: 1.8, ease: 'linear' }, y: { duration: 0.5, repeat: 4 } }}
        >
          <Duck size={150} />
        </motion.div>
      ))}
    </>
  );
}

function Stampede() {
  return (
    <>
      <motion.div
        className="absolute inset-0 bg-amber-300/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.5, 0.8, 0] }}
        transition={{ duration: 3.2 }}
      />
      <Flash color="#fbbf24" />
      <Rays color="rgba(252,211,77,0.5)" duration={3.2} />
      <Banner text="Legendary pull!" className="text-amber-200" />
      {range(40).map((i) => {
        const size = 90 + j(i, 1) * 150;
        const leftward = i % 4 === 3;
        return (
          <motion.div
            key={i}
            className="absolute left-0"
            style={{ top: `${8 + j(i, 2) * 80}vh`, zIndex: Math.round(size) }}
            initial={{ x: leftward ? '115vw' : '-25vw', y: 0, rotate: 0 }}
            animate={{ x: leftward ? '-25vw' : '115vw', y: [0, -18, 0], rotate: [-6, 6, -6] }}
            transition={{
              x: { duration: 1.5 + j(i, 3) * 1.2, delay: j(i, 4) * 1.1, ease: 'linear' },
              y: { duration: 0.28, repeat: Infinity },
              rotate: { duration: 0.28, repeat: Infinity },
            }}
          >
            <Duck size={size} flip={leftward} />
          </motion.div>
        );
      })}
    </>
  );
}

function GoldRain() {
  return (
    <>
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 35%, rgba(252,211,77,0.55), rgba(245,158,11,0.18) 45%, transparent 75%)' }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 1, 0.7, 0], scale: [0.6, 1.3, 1.5, 1.7] }}
        transition={{ duration: 3.4 }}
      />
      <Flash color="#fde047" />
      <Rays color="rgba(253,224,71,0.5)" duration={3.4} />
      <Banner text="It's raining gold!" className="text-amber-200" />
      {range(120).map((i) => {
        const s = 22 + j(i, 1) * 44;
        return (
          <motion.span
            key={`c-${i}`}
            className="absolute top-0 rounded-full border-2 border-amber-200"
            style={{
              left: `${j(i, 2) * 100}vw`, width: s, height: s,
              background: 'radial-gradient(circle at 35% 30%, #fff7c2, #fbbf24 55%, #b45309)',
              boxShadow: '0 0 28px 6px rgba(251,191,36,0.95)',
            }}
            initial={{ y: '-12vh', rotateY: 0 }}
            animate={{ y: '112vh', rotateY: 720 }}
            transition={{ duration: 1.3 + j(i, 3) * 1.4, delay: j(i, 4) * 1.6, ease: 'easeIn' }}
          />
        );
      })}
      {range(7).map((i) => (
        <motion.div
          key={`d-${i}`}
          className="absolute top-0"
          style={{ left: `${6 + i * 13}vw` }}
          initial={{ y: '-20vh', rotate: -14 }}
          animate={{ y: '115vh', rotate: [-14, 14, -14, 14] }}
          transition={{ y: { duration: 2.6 + j(i, 5), delay: j(i, 6) * 0.8, ease: 'linear' }, rotate: { duration: 1.2, repeat: 3 } }}
        >
          <Duck size={120 + j(i, 7) * 90} flip={i % 2 === 0} />
        </motion.div>
      ))}
    </>
  );
}

function Quackzilla() {
  return (
    <>
      <motion.div
        className="absolute inset-0"
        style={{ boxShadow: 'inset 0 0 320px 120px rgba(244,63,94,0.95)' }}
        animate={{ opacity: [0, 1, 0.2, 1, 0.2, 1, 0.2, 1, 0] }}
        transition={{ duration: 3.8 }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[220vmax] w-[220vmax]"
        style={{
          marginLeft: '-110vmax', marginTop: '-110vmax',
          background: 'repeating-conic-gradient(rgba(251,113,133,0.35) 0deg 5deg, transparent 5deg 16deg)',
        }}
        initial={{ opacity: 0, rotate: 0 }}
        animate={{ opacity: [0, 0.9, 0.9, 0], rotate: 140 }}
        transition={{ duration: 3.8, ease: 'linear' }}
      />
      <Flash color="#fb7185" />
      <Banner text="Mythic! Mythic! Mythic!" className="text-rose-300" />
      <motion.div
        className="absolute bottom-0 left-1/2"
        style={{ marginLeft: 'min(-35vh, -35vw)' }}
        initial={{ y: '110%', rotate: -6 }}
        animate={{ y: ['110%', '18%', '24%', '18%', '110%'], rotate: [-6, 4, -4, 4, -6] }}
        transition={{ duration: 3.8, times: [0, 0.25, 0.5, 0.75, 1], ease: 'easeInOut' }}
      >
        <Duck size={700} shades className="h-[max(70vh,70vw)] max-h-[90vh] w-[max(70vh,70vw)] max-w-[90vh]" />
      </motion.div>
      {range(10).map((i) => (
        <motion.div
          key={i}
          className="absolute top-0"
          style={{ left: `${j(i, 1) * 92}vw` }}
          initial={{ y: '-20vh', rotate: 0 }}
          animate={{ y: '115vh', rotate: 540 }}
          transition={{ duration: 1.6 + j(i, 2), delay: 0.6 + j(i, 3) * 1.6, ease: 'easeIn' }}
        >
          <Duck size={90 + j(i, 4) * 80} shades />
        </motion.div>
      ))}
    </>
  );
}

function Disco() {
  const beams = ['#f472b6', '#a78bfa', '#38bdf8', '#34d399', '#fde047', '#fb7185'];
  return (
    <>
      <motion.div className="absolute inset-0 bg-black" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0.45, 0.45, 0] }} transition={{ duration: 5.4 }} />
      <Flash color="#f472b6" />
      <Rays color="rgba(167,139,250,0.4)" duration={5.2} />
      {/* spinning light beams from the top of the screen */}
      {beams.map((c, i) => (
        <motion.div
          key={c}
          className="absolute left-1/2 top-0 h-[160vh] w-[26vw] origin-top"
          style={{ marginLeft: '-13vw', background: `linear-gradient(to bottom, ${c}cc, ${c}22 60%, transparent)`, clipPath: 'polygon(46% 0, 54% 0, 100% 100%, 0 100%)', mixBlendMode: 'screen' }}
          initial={{ rotate: -70 + i * 28, opacity: 0 }}
          animate={{ rotate: [-70 + i * 28, 70 - i * 28, -70 + i * 28], opacity: [0, 0.9, 0.9, 0] }}
          transition={{ rotate: { duration: 2.2, repeat: 2, ease: 'easeInOut' }, opacity: { duration: 5.2, times: [0, 0.1, 0.85, 1] } }}
        />
      ))}
      <div className="absolute left-0 top-[18vh] w-full text-center">
        <motion.div
          className="ultra-text text-[15vw] font-black uppercase leading-none drop-shadow-[0_0_50px_rgba(255,255,255,0.9)]"
          initial={{ scale: 4, opacity: 0 }}
          animate={{ scale: [4, 1, 1.12, 1, 1.12, 1, 0.9], opacity: [0, 1, 1, 1, 1, 1, 0] }}
          transition={{ duration: 5.2, times: [0, 0.12, 0.3, 0.5, 0.7, 0.9, 1] }}
        >
          Ultra Legendary
        </motion.div>
      </div>
      {/* duck rain */}
      {range(34).map((i) => (
        <motion.div
          key={`r-${i}`}
          className="absolute top-0"
          style={{ left: `${j(i, 1) * 96}vw` }}
          initial={{ y: '-20vh', rotate: 0 }}
          animate={{ y: '118vh', rotate: i % 2 ? 360 : -360 }}
          transition={{ duration: 1.8 + j(i, 2) * 1.6, delay: 0.3 + j(i, 3) * 2.6, ease: 'easeIn' }}
        >
          <Duck size={70 + j(i, 4) * 110} crown={i % 5 === 0} shades={i % 3 === 0} flip={i % 2 === 0} />
        </motion.div>
      ))}
      {/* the crowned giant spins in at centre stage */}
      <motion.div
        className="absolute left-1/2 top-[46vh]"
        style={{ marginLeft: '-22vmin' }}
        initial={{ scale: 0, rotate: -720, y: 0 }}
        animate={{ scale: [0, 1.25, 1, 1.1, 1, 0], rotate: [-720, 0, 0, 0, 0, 360], y: [0, 0, -30, 0, -30, 0] }}
        transition={{ duration: 5.2, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }}
      >
        <Duck size={400} crown className="h-[44vmin] w-[44vmin]" />
      </motion.div>
      {/* dancing line along the bottom */}
      <div className="absolute inset-x-0 bottom-2 flex justify-around">
        {range(11).map((i) => (
          <motion.div
            key={`l-${i}`}
            initial={{ y: 140 }}
            animate={{ y: [140, 0, -34, 0, -34, 0, -34, 0, -34, 0, 140], rotate: i % 2 ? [0, 12, -12, 12, -12, 0] : [0, -12, 12, -12, 12, 0] }}
            transition={{ duration: 5.2, delay: i * 0.03 }}
          >
            <Duck size={110} shades flip={i % 2 === 0} />
          </motion.div>
        ))}
      </div>
    </>
  );
}

/** Uncommon: green ripples spread across the whole screen while a line of ducklings paddles by. */
function Ripple() {
  return (
    <>
      <motion.div
        className="absolute inset-0"
        style={{ boxShadow: 'inset 0 0 220px 70px rgba(52,211,153,0.75)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.5, 0] }}
        transition={{ duration: 2.2 }}
      />
      {range(5).map((i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute left-1/2 top-[45%] h-40 w-40 rounded-full border-[6px] border-emerald-300"
          style={{ marginLeft: '-5rem', marginTop: '-5rem', boxShadow: '0 0 30px rgba(52,211,153,0.9), inset 0 0 30px rgba(52,211,153,0.5)' }}
          initial={{ scale: 0.1, opacity: 0.95 }}
          animate={{ scale: 14, opacity: 0 }}
          transition={{ duration: 1.7, delay: i * 0.22, ease: 'easeOut' }}
        />
      ))}
      {range(26).map((i) => {
        const s = 8 + j(i, 1) * 14;
        return (
          <motion.span
            key={`g-${i}`}
            className="absolute bottom-0 rotate-45 bg-emerald-300"
            style={{ left: `${j(i, 2) * 100}vw`, width: s, height: s, boxShadow: '0 0 14px rgba(52,211,153,0.95)' }}
            initial={{ y: '5vh', opacity: 0 }}
            animate={{ y: `${-40 - j(i, 3) * 60}vh`, opacity: [0, 1, 0], rotate: 225 }}
            transition={{ duration: 1.4 + j(i, 4) * 0.8, delay: j(i, 5) * 0.8, ease: 'easeOut' }}
          />
        );
      })}
      <Banner text="Uncommon!" className="text-emerald-300" />
      {/* ducklings paddling across in a line, bobbing one after another */}
      {range(6).map((i) => (
        <motion.div
          key={`d-${i}`}
          className="absolute bottom-[10vh] left-0"
          initial={{ x: `${-14 - i * 11}vw` }}
          animate={{ x: `${112 - i * 11}vw`, y: [0, -16, 0, -16, 0, -16, 0] }}
          transition={{ x: { duration: 2.2, ease: 'linear' }, y: { duration: 2.2, delay: i * 0.08 } }}
        >
          <Duck size={i === 0 ? 150 : 90} />
        </motion.div>
      ))}
    </>
  );
}

/** Epic: a tidal wave floods the screen, bubbles rise, and the duck surfs across the crest. */
function Wave() {
  const crest = 'M0 30 Q75 0 150 30 T300 30 T450 30 T600 30 T750 30 T900 30 T1050 30 T1200 30 V60 H0 Z';
  return (
    <>
      <Flash color="#38bdf8" />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[120vh]"
        initial={{ y: '125vh' }}
        animate={{ y: ['125vh', '34vh', '42vh', '34vh', '42vh', '125vh'] }}
        transition={{ duration: 3.8, times: [0, 0.22, 0.4, 0.58, 0.76, 1], ease: 'easeInOut' }}
      >
        {/* two wave crests sliding against each other */}
        <motion.svg className="absolute bottom-full left-0 h-[9vh] w-[200%]" viewBox="0 0 1200 60" preserveAspectRatio="none" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}>
          <path d={crest} fill="rgba(125,211,252,0.75)" />
        </motion.svg>
        <motion.svg className="absolute bottom-full left-0 h-[6vh] w-[200%]" viewBox="0 0 1200 60" preserveAspectRatio="none" animate={{ x: ['-50%', '0%'] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}>
          <path d={crest} fill="rgba(56,189,248,0.95)" />
        </motion.svg>
        <div className="h-full w-full" style={{ background: 'linear-gradient(to bottom, rgba(56,189,248,0.92), rgba(37,99,235,0.9) 35%, rgba(30,27,75,0.95))' }} />
        {/* light shafts under the surface */}
        <div className="absolute inset-0 opacity-40" style={{ background: 'repeating-linear-gradient(100deg, rgba(255,255,255,0.35) 0 3vw, transparent 3vw 11vw)' }} />
        {/* the duck surfs the crest from left to right */}
        <motion.div
          className="absolute bottom-full left-0 -mb-[4vh]"
          initial={{ x: '-25vw', rotate: -8 }}
          animate={{ x: '110vw', rotate: [-8, 8, -8, 8, -8], y: [0, -18, 0, -18, 0] }}
          transition={{ x: { duration: 3.4, delay: 0.3, ease: 'linear' }, rotate: { duration: 3.4 }, y: { duration: 3.4 } }}
        >
          <div className="relative">
            <Duck size={220} shades className="h-[26vh] w-[26vh]" />
            <div className="absolute -bottom-1 left-[8%] h-[2.2vh] w-[84%] rounded-full bg-gradient-to-r from-rose-500 via-amber-300 to-rose-500 shadow-lg" />
          </div>
        </motion.div>
      </motion.div>
      {range(60).map((i) => {
        const s = 10 + j(i, 1) * 34;
        return (
          <motion.span
            key={`b-${i}`}
            className="absolute bottom-0 rounded-full border-2 border-white/80 bg-sky-200/25"
            style={{ left: `${j(i, 2) * 100}vw`, width: s, height: s }}
            initial={{ y: '10vh', opacity: 0 }}
            animate={{ y: '-70vh', opacity: [0, 1, 1, 0], x: [0, 14, -14, 0] }}
            transition={{ duration: 1.6 + j(i, 3) * 1.4, delay: 0.5 + j(i, 4) * 1.8, ease: 'easeOut' }}
          />
        );
      })}
      {range(36).map((i) => {
        const a = (i / 36) * Math.PI - Math.PI;
        return (
          <motion.span
            key={`s-${i}`}
            className="absolute bottom-[30vh] left-1/2 h-4 w-3 rounded-full bg-sky-200"
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ x: Math.cos(a) * (200 + j(i, 5) * 500), y: [0, Math.sin(a) * (220 + j(i, 6) * 300), 260], opacity: [0, 1, 0] }}
            transition={{ duration: 1.3, delay: 0.75 + j(i, 7) * 0.2, ease: 'easeOut' }}
          />
        );
      })}
      <Banner text="Epic splash!" className="text-sky-200" />
    </>
  );
}

/** Bad pack: the colour drains out, it rains, and a soggy duck trudges across under a storm cloud. */
function Gloom() {
  return (
    <>
      <motion.div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(15,23,42,0.92), rgba(30,41,59,0.75) 55%, rgba(15,23,42,0.9))' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 3.4, times: [0, 0.15, 0.8, 1] }}
      />
      {/* storm cloud */}
      <motion.div
        className="absolute left-1/2 top-[4vh] h-[22vh] w-[70vw] rounded-[50%] bg-slate-500 blur-xl"
        style={{ marginLeft: '-35vw', boxShadow: '12vw 3vh 0 2vh #475569, -12vw 4vh 0 1vh #64748b' }}
        initial={{ y: '-40vh', opacity: 0 }}
        animate={{ y: ['-40vh', '0vh', '0vh', '-40vh'], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 3.4, times: [0, 0.2, 0.8, 1] }}
      />
      {range(90).map((i) => (
        <motion.span
          key={`r-${i}`}
          className="absolute top-0 w-[3px] rounded-full bg-sky-300/80"
          style={{ left: `${j(i, 1) * 100}vw`, height: 22 + j(i, 2) * 40 }}
          initial={{ y: '-10vh' }}
          animate={{ y: '112vh' }}
          transition={{ duration: 0.55 + j(i, 3) * 0.5, delay: 0.3 + j(i, 4) * 2.2, ease: 'linear', repeat: 1 }}
        />
      ))}
      <div className="absolute left-0 top-[30vh] w-full text-center">
        <motion.div
          className="text-[12vw] font-black uppercase leading-none text-slate-300 drop-shadow-[0_6px_30px_rgba(0,0,0,0.9)]"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: [-80, 0, 12, 0, 60], opacity: [0, 1, 1, 1, 0], rotate: [0, 0, -3, 2, -6] }}
          transition={{ duration: 3.4, times: [0, 0.2, 0.5, 0.8, 1] }}
        >
          Rough pack…
        </motion.div>
      </div>
      {/* the soggy duck trudges across the bottom, crying */}
      <motion.div
        className="absolute bottom-[6vh] left-0"
        initial={{ x: '-30vw' }}
        animate={{ x: '110vw', y: [0, -6, 0, -6, 0, -6, 0] }}
        transition={{ x: { duration: 3.3, ease: 'linear' }, y: { duration: 1.1, repeat: 2 } }}
      >
        <div className="relative">
          <Duck size={260} sad className="h-[34vh] w-[34vh] grayscale-[35%]" />
          {range(6).map((i) => (
            <motion.span
              key={`t-${i}`}
              className="absolute left-[70%] top-[34%] h-4 w-3 rounded-full bg-sky-300"
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: 160, opacity: 0 }}
              transition={{ duration: 0.8, delay: i * 0.45, repeat: 1 }}
            />
          ))}
        </div>
      </motion.div>
    </>
  );
}

const SCENES: Record<Kind, () => JSX.Element> = {
  ripple: Ripple, flyby: FlyBy, wave: Wave, stampede: Stampede, goldrain: GoldRain, quackzilla: Quackzilla, disco: Disco, gloom: Gloom,
};

export function ScreenMayhem() {
  const [scene, setScene] = useState<{ id: number; kind: Kind } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const off = onFx((e) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      // Card pulls pick a win scene by rarity; a pack that lost a fifth or more gets the sad one.
      const kind: Kind | null =
        e.type === 'pull' ? (e.uncommon ? 'ripple' : kindFor(e.rarity)) : e.type === 'pack' && e.bad ? 'gloom' : null;
      if (!kind) return;
      const main = document.querySelector('main');
      const cls = MAIN_CLASS[kind];
      clearTimeout(timer);
      main?.classList.remove(...ALL_MAIN);
      if (cls) main?.classList.add(cls);
      setScene({ id: Date.now(), kind });
      timer = setTimeout(() => {
        if (cls) main?.classList.remove(cls);
        setScene(null);
      }, DURATION[kind]);
    });
    return () => {
      off();
      clearTimeout(timer);
    };
  }, []);

  if (!scene) return null;
  const Scene = SCENES[scene.kind];
  return (
    <div key={scene.id} className="pointer-events-none fixed inset-0 z-[57] overflow-hidden">
      <Scene />
    </div>
  );
}
