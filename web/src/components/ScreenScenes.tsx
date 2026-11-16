'use client';
import { motion } from 'framer-motion';
import { Duck } from './Duck';
import { Banner, Flash, Rays, j, range } from './sceneKit';

/**
 * Three more full-screen scenes per big rarity (ScreenMayhem picks one at random each pull):
 *   Epic            → Fireworks, Bubble Bath, Lightning
 *   Legendary       → Treasure Chest, Crown Drop, Hall of Fame
 *   Mythic          → Eruption, Meteor Shower, Blood Moon
 *   Ultra Legendary → Hyperspace, Rainbow Ride, Galaxy
 * Decoration only, played after the card is already revealed.
 */

const RAINBOW = ['#f472b6', '#a78bfa', '#38bdf8', '#34d399', '#fde047', '#fb7185'];

function UltraTitle({ duration }: { duration: number }) {
  return (
    <div className="absolute left-0 top-[16vh] w-full text-center">
      <motion.div
        className="ultra-text text-[14vw] font-black uppercase leading-none drop-shadow-[0_0_50px_rgba(255,255,255,0.9)]"
        initial={{ scale: 3, opacity: 0 }}
        animate={{ scale: [3, 1, 1.08, 1, 0.9], opacity: [0, 1, 1, 1, 0] }}
        transition={{ duration, times: [0, 0.15, 0.45, 0.85, 1] }}
      >
        Ultra Legendary
      </motion.div>
    </div>
  );
}

// ------------------------------------------------------------------ Epic

export function Fireworks() {
  const bursts = range(7).map((b) => ({ x: 12 + j(b, 1) * 76, y: 14 + j(b, 2) * 42, t: 0.15 + b * 0.38, c: ['#e879f9', '#38bdf8', '#ffffff', '#c084fc'][b % 4] }));
  return (
    <>
      <motion.div className="absolute inset-0 bg-indigo-950" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.75, 0.75, 0] }} transition={{ duration: 3.4, times: [0, 0.1, 0.85, 1] }} />
      <Banner text="Epic fireworks!" className="text-fuchsia-300" />
      {bursts.map((b, bi) => (
        <div key={bi} className="absolute" style={{ left: `${b.x}vw`, top: `${b.y}vh` }}>
          {/* rocket trail */}
          <motion.span
            className="absolute h-24 w-1 rounded-full"
            style={{ background: `linear-gradient(to top, transparent, ${b.c})`, left: -2 }}
            initial={{ y: '80vh', opacity: 0 }}
            animate={{ y: [ '80vh', '0vh'], opacity: [0, 1, 0] }}
            transition={{ duration: 0.45, delay: b.t - 0.45 > 0 ? b.t - 0.45 : 0, ease: 'easeOut' }}
          />
          <motion.span
            className="absolute -left-20 -top-20 h-40 w-40 rounded-full"
            style={{ background: `radial-gradient(circle, ${b.c}cc, transparent 65%)` }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.6], opacity: [0, 1, 0] }}
            transition={{ duration: 0.7, delay: b.t }}
          />
          {range(28).map((i) => {
            const a = (i / 28) * Math.PI * 2;
            const d = 120 + j(i + bi * 31, 3) * 110;
            return (
              <motion.span
                key={i}
                className="absolute h-2.5 w-2.5 rounded-full"
                style={{ background: b.c, boxShadow: `0 0 12px 3px ${b.c}`, left: -5, top: -5 }}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ x: Math.cos(a) * d, y: [0, Math.sin(a) * d, Math.sin(a) * d + 90], opacity: [0, 1, 0] }}
                transition={{ duration: 1.4, delay: b.t, ease: 'easeOut' }}
              />
            );
          })}
        </div>
      ))}
    </>
  );
}

export function BubbleBath() {
  return (
    <>
      <Flash color="#38bdf8" />
      <motion.div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(56,189,248,0.55), rgba(232,121,249,0.25) 60%, transparent)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 3.4, times: [0, 0.15, 0.8, 1] }}
      />
      <Banner text="Epic bubbles!" className="text-sky-200" />
      {range(26).map((i) => {
        const s = 70 + j(i, 1) * 130;
        const duck = i % 4 === 0;
        const rise = 1.8 + j(i, 3) * 1.2;
        return (
          <motion.div
            key={i}
            className="absolute bottom-0 flex items-center justify-center rounded-full border-2 border-white/80"
            style={{
              left: `${j(i, 2) * 92}vw`, width: s, height: s,
              background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.85), rgba(186,230,253,0.25) 30%, rgba(232,121,249,0.15) 70%, rgba(255,255,255,0.35))',
              boxShadow: '0 0 30px rgba(186,230,253,0.6)',
            }}
            initial={{ y: s, scale: 1, opacity: 1 }}
            animate={{ y: [s, -window.innerHeight * (0.55 + j(i, 4) * 0.35)], x: [0, 20, -20, 0], scale: [1, 1, 1.5], opacity: [1, 1, 0] }}
            transition={{ duration: rise, delay: j(i, 5) * 1.2, ease: 'easeOut', times: [0, 0.85, 1] }}
          >
            {duck && <Duck size={s * 0.7} />}
          </motion.div>
        );
      })}
    </>
  );
}

export function Lightning() {
  const bolt = 'M50 0 L38 40 L55 42 L30 100 L70 52 L52 50 L66 0 Z';
  return (
    <>
      <motion.div
        className="absolute inset-0 bg-[#1a0b2e]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.9, 0.4, 0.95, 0.3, 0.9, 0] }}
        transition={{ duration: 3, times: [0, 0.08, 0.15, 0.3, 0.38, 0.8, 1] }}
      />
      {[0.15, 0.55, 0.95, 1.35].map((t, i) => (
        <motion.div key={`f-${i}`} className="absolute inset-0 bg-fuchsia-200" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0] }} transition={{ duration: 0.25, delay: t }} />
      ))}
      {[0.15, 0.55, 0.95, 1.35].map((t, i) => (
        <motion.svg
          key={`b-${i}`}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute top-0 h-[70vh] w-[18vw]"
          style={{ left: `${8 + i * 22 + j(i, 1) * 6}vw`, filter: 'drop-shadow(0 0 18px #e879f9) drop-shadow(0 0 40px #a855f7)' }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scaleY: [0, 1, 1, 1] }}
          transition={{ duration: 0.6, delay: t, times: [0, 0.2, 0.6, 1] }}
        >
          <path d={bolt} fill="#f5d0fe" />
        </motion.svg>
      ))}
      <Banner text="Epic strike!" className="text-fuchsia-200" />
      <motion.div
        className="absolute bottom-[8vh] left-1/2"
        style={{ marginLeft: '-14vh' }}
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: [0, 1.2, 1, 1, 0], rotate: [-30, 10, 0, 0, 0] }}
        transition={{ duration: 3, delay: 0.5, times: [0, 0.15, 0.25, 0.85, 1] }}
      >
        <Duck size={240} shades className="h-[28vh] w-[28vh] drop-shadow-[0_0_30px_#e879f9]" />
      </motion.div>
    </>
  );
}

// ------------------------------------------------------------------ Legendary

export function TreasureChest() {
  return (
    <>
      <Flash color="#fbbf24" />
      <Rays color="rgba(252,211,77,0.45)" duration={3.6} />
      <Banner text="Treasure!" className="text-amber-200" />
      <motion.div
        className="absolute bottom-[4vh] left-1/2 h-[22vh] w-[34vh]"
        style={{ marginLeft: '-17vh' }}
        initial={{ y: '40vh' }}
        animate={{ y: ['40vh', '0vh', '0vh', '40vh'] }}
        transition={{ duration: 3.6, times: [0, 0.15, 0.85, 1] }}
      >
        {/* glow pouring out of the chest */}
        <motion.div
          className="absolute -top-[40vh] left-1/2 h-[60vh] w-[30vh] -translate-x-1/2"
          style={{ background: 'linear-gradient(to top, rgba(253,224,71,0.9), transparent)', clipPath: 'polygon(30% 100%, 70% 100%, 100% 0, 0 0)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.7, 0] }}
          transition={{ duration: 3, delay: 0.5 }}
        />
        {/* lid */}
        <motion.div
          className="absolute left-0 top-0 h-[8vh] w-full origin-bottom rounded-t-[3vh] border-4 border-amber-300 bg-gradient-to-b from-amber-700 to-amber-900"
          initial={{ rotateX: 0 }}
          animate={{ rotateX: [0, 0, 110] }}
          transition={{ duration: 0.9, times: [0, 0.4, 1] }}
          style={{ transformPerspective: 600 }}
        />
        {/* box */}
        <div className="absolute bottom-0 h-[14vh] w-full rounded-b-xl border-4 border-amber-300 bg-gradient-to-b from-amber-800 to-amber-950">
          <div className="absolute left-1/2 top-1 h-[4vh] w-[4vh] -translate-x-1/2 rounded-md border-2 border-amber-200 bg-amber-400" />
        </div>
      </motion.div>
      {range(90).map((i) => {
        const a = -Math.PI / 2 + (j(i, 1) - 0.5) * 1.6;
        const v = 45 + j(i, 2) * 45;
        const s = 20 + j(i, 3) * 26;
        return (
          <motion.span
            key={i}
            className="absolute bottom-[18vh] left-1/2 rounded-full border-2 border-amber-200"
            style={{ width: s, height: s, marginLeft: -s / 2, background: 'radial-gradient(circle at 35% 30%, #fff7c2, #fbbf24 55%, #b45309)', boxShadow: '0 0 20px 4px rgba(251,191,36,0.9)' }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{
              x: `${Math.cos(a) * v}vw`,
              y: [`0vh`, `${Math.sin(a) * v}vh`, `${Math.sin(a) * v + 90}vh`],
              opacity: [0, 1, 1],
              rotateY: 720,
            }}
            transition={{ duration: 1.8 + j(i, 4) * 0.6, delay: 0.7 + j(i, 5) * 1.2, ease: 'easeOut' }}
          />
        );
      })}
    </>
  );
}

export function CrownDrop() {
  return (
    <>
      <motion.div className="absolute inset-0 bg-black" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.55, 0.55, 0] }} transition={{ duration: 3.6, times: [0, 0.1, 0.85, 1] }} />
      {/* two spotlights sweeping onto the landing spot */}
      {[-1, 1].map((side) => (
        <motion.div
          key={side}
          className="absolute top-0 h-[130vh] w-[30vw] origin-top"
          style={{ left: side < 0 ? '5vw' : '65vw', background: 'linear-gradient(to bottom, rgba(253,230,138,0.85), rgba(253,230,138,0.05))', clipPath: 'polygon(45% 0, 55% 0, 100% 100%, 0 100%)', mixBlendMode: 'screen' }}
          initial={{ rotate: side * 40, opacity: 0 }}
          animate={{ rotate: [side * 40, side * -25, side * -18], opacity: [0, 0.9, 0.9, 0] }}
          transition={{ duration: 3.4, times: [0, 0.4, 1] }}
        />
      ))}
      <motion.svg
        viewBox="0 0 120 80"
        className="absolute left-1/2 h-[30vh] w-[45vh]"
        style={{ marginLeft: '-22.5vh', top: '30vh', filter: 'drop-shadow(0 0 30px #fbbf24)' }}
        initial={{ y: '-80vh', rotate: -20 }}
        animate={{ y: ['-80vh', '0vh', '-4vh', '0vh', '0vh', '-100vh'], rotate: [-20, 0, 3, 0, 0, 10] }}
        transition={{ duration: 3.6, times: [0, 0.22, 0.3, 0.38, 0.85, 1], ease: 'easeIn' }}
      >
        <path d="M8 70 L4 18 L32 42 L60 6 L88 42 L116 18 L112 70 Z" fill="url(#gold)" stroke="#fef3c7" strokeWidth="3" />
        {[[32, 42], [60, 6], [88, 42], [4, 18], [116, 18]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="6" fill={['#fb7185', '#38bdf8', '#34d399', '#a78bfa', '#fde047'][i]} stroke="#fff" strokeWidth="1.5" />
        ))}
        <rect x="8" y="62" width="104" height="10" rx="3" fill="#b45309" />
        <defs>
          <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fef08a" />
            <stop offset="1" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </motion.svg>
      {/* landing shockwave + sparkles */}
      {range(3).map((i) => (
        <motion.div
          key={`r-${i}`}
          className="absolute left-1/2 top-[52vh] h-40 w-40 rounded-full border-[6px] border-amber-300"
          style={{ marginLeft: '-5rem', marginTop: '-5rem', boxShadow: '0 0 40px #fbbf24' }}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: [0.2, 9], opacity: [0.95, 0] }}
          transition={{ duration: 1.3, delay: 0.8 + i * 0.18, ease: 'easeOut' }}
        />
      ))}
      {range(40).map((i) => (
        <motion.span
          key={`s-${i}`}
          className="absolute rotate-45 bg-amber-100"
          style={{ left: `${j(i, 1) * 100}vw`, top: `${j(i, 2) * 100}vh`, width: 10, height: 10, boxShadow: '0 0 16px 4px #fde047' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.4, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 0.9, delay: 0.85 + j(i, 3) * 2 }}
        />
      ))}
      <Banner text="Legendary!" className="text-amber-200" />
    </>
  );
}

export function HallOfFame() {
  return (
    <>
      <motion.div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 60%, rgba(252,211,77,0.45), rgba(0,0,0,0.6) 70%)' }} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 3.8, times: [0, 0.12, 0.85, 1] }} />
      <Rays color="rgba(253,224,71,0.35)" duration={3.8} />
      <Banner text="Hall of fame!" className="text-amber-100" />
      {/* golden duck on a pedestal rises from the floor */}
      <motion.div
        className="absolute bottom-0 left-1/2 flex flex-col items-center"
        style={{ marginLeft: '-17vh' }}
        initial={{ y: '70vh' }}
        animate={{ y: ['70vh', '0vh', '0vh', '70vh'] }}
        transition={{ duration: 3.8, times: [0, 0.25, 0.85, 1], ease: 'easeOut' }}
      >
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 0.8, repeat: 4 }}>
          <Duck size={260} crown className="h-[30vh] w-[30vh]" />
        </motion.div>
        <div className="h-[22vh] w-[34vh] rounded-t-lg border-4 border-amber-200 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-800 text-center text-[3vh] font-black uppercase leading-[8vh] text-amber-950 shadow-[0_0_60px_rgba(251,191,36,0.8)]">
          #1 Pull
        </div>
      </motion.div>
      {/* gold and white streamers */}
      {range(70).map((i) => (
        <motion.span
          key={i}
          className="absolute top-0 h-5 w-2 rounded-sm"
          style={{ left: `${j(i, 1) * 100}vw`, background: i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#fbbf24' : '#fde68a' }}
          initial={{ y: '-10vh', rotate: 0 }}
          animate={{ y: '110vh', rotate: 720, x: [0, 30, -30, 0] }}
          transition={{ duration: 2 + j(i, 2) * 1.4, delay: 0.4 + j(i, 3) * 1.6, ease: 'linear' }}
        />
      ))}
    </>
  );
}

// ------------------------------------------------------------------ Mythic

export function Eruption() {
  const crest = 'M0 20 Q50 0 100 20 T200 20 T300 20 T400 20 V40 H0 Z';
  return (
    <>
      <Flash color="#f97316" />
      <motion.div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 300px 120px rgba(244,63,94,0.9)' }} animate={{ opacity: [0, 1, 0.5, 1, 0] }} transition={{ duration: 3.8 }} />
      {/* lava rises from the floor */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[60vh]"
        initial={{ y: '62vh' }}
        animate={{ y: ['62vh', '22vh', '26vh', '22vh', '62vh'] }}
        transition={{ duration: 3.8, times: [0, 0.25, 0.5, 0.75, 1], ease: 'easeInOut' }}
      >
        <motion.svg className="absolute bottom-full left-0 h-[6vh] w-[200%]" viewBox="0 0 400 40" preserveAspectRatio="none" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}>
          <path d={crest} fill="#fb923c" />
        </motion.svg>
        <div className="h-full w-full" style={{ background: 'linear-gradient(to bottom, #fb923c, #ef4444 30%, #7f1d1d)' }} />
      </motion.div>
      {/* fireballs */}
      {range(26).map((i) => {
        const x0 = j(i, 1) * 100;
        const peak = 25 + j(i, 2) * 55;
        const s = 26 + j(i, 3) * 40;
        return (
          <motion.span
            key={i}
            className="absolute bottom-0 rounded-full"
            style={{ left: `${x0}vw`, width: s, height: s, background: 'radial-gradient(circle at 40% 35%, #fef08a, #f97316 45%, #b91c1c)', boxShadow: '0 0 30px 10px rgba(249,115,22,0.85)' }}
            initial={{ y: '10vh', opacity: 0 }}
            animate={{ y: ['10vh', `-${peak}vh`, '10vh'], x: [0, (j(i, 4) - 0.5) * 300], opacity: [0, 1, 1] }}
            transition={{ duration: 1.6 + j(i, 5), delay: 0.4 + j(i, 6) * 2, ease: 'easeOut' }}
          />
        );
      })}
      <Banner text="Mythic eruption!" className="text-orange-200" />
    </>
  );
}

export function MeteorShower() {
  return (
    <>
      <motion.div className="absolute inset-0 bg-[#12051a]" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.85, 0.85, 0] }} transition={{ duration: 3.8, times: [0, 0.1, 0.85, 1] }} />
      {range(60).map((i) => (
        <motion.span key={`st-${i}`} className="absolute h-1 w-1 rounded-full bg-white" style={{ left: `${j(i, 9) * 100}vw`, top: `${j(i, 8) * 100}vh` }} animate={{ opacity: [0, 1, 0.3, 1, 0] }} transition={{ duration: 3.6 }} />
      ))}
      {range(16).map((i) => {
        const startX = 20 + j(i, 1) * 100;
        const t = j(i, 2) * 2.2;
        const s = 30 + j(i, 3) * 50;
        return (
          <motion.div
            key={i}
            className="absolute top-0"
            style={{ left: `${startX}vw` }}
            initial={{ x: 0, y: '-20vh', opacity: 0 }}
            animate={{ x: '-45vw', y: '105vh', opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.1, delay: t, ease: 'easeIn' }}
          >
            {/* tail */}
            <div className="absolute rounded-full" style={{ width: s * 0.5, height: s * 5, left: s * 0.25, top: -s * 4.5, background: 'linear-gradient(to bottom, transparent, rgba(251,113,133,0.9))', transform: 'rotate(-25deg)', transformOrigin: 'bottom center', filter: 'blur(3px)' }} />
            {i % 3 === 0 ? (
              <Duck size={s * 1.3} shades className="drop-shadow-[0_0_20px_#fb7185]" />
            ) : (
              <div className="rounded-full" style={{ width: s, height: s, background: 'radial-gradient(circle at 40% 35%, #fff1f2, #fb7185 40%, #9f1239)', boxShadow: '0 0 40px 12px rgba(251,113,133,0.8)' }} />
            )}
          </motion.div>
        );
      })}
      {/* impact flashes along the ground */}
      {range(6).map((i) => (
        <motion.div
          key={`imp-${i}`}
          className="absolute bottom-0 h-40 w-[30vw] rounded-[50%]"
          style={{ left: `${j(i, 5) * 75}vw`, background: 'radial-gradient(ellipse at 50% 100%, rgba(254,205,211,0.95), rgba(244,63,94,0.5) 40%, transparent 70%)' }}
          initial={{ opacity: 0, scaleY: 0.2 }}
          animate={{ opacity: [0, 1, 0], scaleY: [0.2, 1.4, 1] }}
          transition={{ duration: 0.7, delay: 1 + i * 0.4 }}
        />
      ))}
      <Banner text="Meteor shower!" className="text-rose-200" />
    </>
  );
}

export function BloodMoon() {
  return (
    <>
      <motion.div className="absolute inset-0 bg-black" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.9, 0.9, 0] }} transition={{ duration: 4, times: [0, 0.12, 0.85, 1] }} />
      <motion.div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 38%, rgba(225,29,72,0.55), transparent 55%)' }} initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 1, 0] }} transition={{ duration: 4, times: [0, 0.3, 0.5, 0.85, 1] }} />
      {/* the moon rises, then the shadow slides over and leaves a red corona */}
      <motion.div
        className="absolute left-1/2 h-[44vmin] w-[44vmin] rounded-full"
        style={{ marginLeft: '-22vmin', background: 'radial-gradient(circle at 40% 35%, #fecdd3, #f43f5e 55%, #881337)', boxShadow: '0 0 80px 30px rgba(244,63,94,0.7)' }}
        initial={{ top: '100vh' }}
        animate={{ top: ['100vh', '16vh', '16vh', '100vh'] }}
        transition={{ duration: 4, times: [0, 0.3, 0.85, 1], ease: 'easeOut' }}
      >
        <motion.div
          className="absolute inset-0 rounded-full bg-black"
          initial={{ x: '-110%' }}
          animate={{ x: ['-110%', '-110%', '0%', '0%'] }}
          transition={{ duration: 3.4, times: [0, 0.4, 0.7, 1] }}
        />
      </motion.div>
      {/* duck silhouettes cross the moon */}
      {range(7).map((i) => (
        <motion.div
          key={i}
          className="absolute left-0"
          style={{ top: `${20 + j(i, 1) * 30}vh`, filter: 'brightness(0) drop-shadow(0 0 8px #f43f5e)' }}
          initial={{ x: '-20vw' }}
          animate={{ x: '120vw', y: [0, -20, 0, -20, 0] }}
          transition={{ x: { duration: 2.4 + j(i, 2), delay: 1.2 + j(i, 3) * 1, ease: 'linear' }, y: { duration: 1.2, repeat: 2 } }}
        >
          <Duck size={70 + j(i, 4) * 60} />
        </motion.div>
      ))}
      <Banner text="Blood moon!" className="text-rose-300" />
    </>
  );
}

// ------------------------------------------------------------------ Ultra Legendary

export function Hyperspace() {
  return (
    <>
      <motion.div className="absolute inset-0 bg-black" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.92, 0.92, 0] }} transition={{ duration: 4.6, times: [0, 0.08, 0.85, 1] }} />
      {/* star streaks shooting out of the centre */}
      {range(110).map((i) => {
        const a = j(i, 1) * 360;
        return (
          <div key={i} className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transform: `rotate(${a}deg)` }}>
            <motion.span
              className="absolute h-[3px] rounded-full"
              style={{ width: 40 + j(i, 2) * 140, background: `linear-gradient(to right, transparent, ${RAINBOW[i % RAINBOW.length]})` }}
              initial={{ x: 0, opacity: 0 }}
              animate={{ x: [0, 900 + j(i, 3) * 400], opacity: [0, 1, 0] }}
              transition={{ duration: 0.9, delay: j(i, 4) * 3.2, ease: 'easeIn', repeat: 1 }}
            />
          </div>
        );
      })}
      {/* rainbow tunnel rings */}
      {range(10).map((i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute left-1/2 top-1/2 h-40 w-40 rounded-full border-[5px]"
          style={{ marginLeft: '-5rem', marginTop: '-5rem', borderColor: RAINBOW[i % RAINBOW.length], boxShadow: `0 0 30px ${RAINBOW[i % RAINBOW.length]}` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 12], opacity: [0, 1, 0] }}
          transition={{ duration: 1.6, delay: i * 0.3, ease: 'easeIn' }}
        />
      ))}
      {/* the crowned duck warps in */}
      <motion.div
        className="absolute left-1/2 top-1/2"
        style={{ marginLeft: '-20vmin', marginTop: '-20vmin' }}
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: [0, 0.2, 1.3, 1, 1, 6], rotate: [0, 360, 720, 720, 720, 720], opacity: [1, 1, 1, 1, 1, 0] }}
        transition={{ duration: 4.4, times: [0, 0.2, 0.4, 0.5, 0.85, 1] }}
      >
        <Duck size={400} crown shades className="h-[40vmin] w-[40vmin] drop-shadow-[0_0_40px_#a78bfa]" />
      </motion.div>
      <UltraTitle duration={4.4} />
    </>
  );
}

export function RainbowRide() {
  // The duck slides along the rainbow's arc (left foot → top → right foot).
  const steps = range(13).map((k) => Math.PI - (k / 12) * Math.PI);
  return (
    <>
      <motion.div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(56,189,248,0.6), rgba(167,139,250,0.4))' }} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 4.6, times: [0, 0.1, 0.85, 1] }} />
      <Flash color="#f472b6" />
      <motion.div
        className="absolute left-1/2 top-[30vh] h-[140vmin] w-[140vmin] rounded-full"
        style={{
          marginLeft: '-70vmin',
          background: `radial-gradient(circle, transparent 50%, ${RAINBOW[5]} 50% 54%, ${RAINBOW[4]} 54% 58%, ${RAINBOW[3]} 58% 62%, ${RAINBOW[2]} 62% 66%, ${RAINBOW[1]} 66% 70%, ${RAINBOW[0]} 70% 74%, transparent 74%)`,
          filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.7))',
        }}
        initial={{ clipPath: 'inset(0 100% 50% 0)', opacity: 1 }}
        animate={{ clipPath: ['inset(0 100% 50% 0)', 'inset(0 0% 50% 0)', 'inset(0 0% 50% 0)', 'inset(0 0% 50% 0)'], opacity: [1, 1, 1, 0] }}
        transition={{ duration: 4.4, times: [0, 0.3, 0.85, 1] }}
      />
      <motion.div
        className="absolute"
        initial={{ left: '-10vw', top: '100vh' }}
        animate={{
          left: steps.map((a) => `calc(50vw + ${(Math.cos(a) * 48).toFixed(2)}vmin - 9vmin)`),
          top: steps.map((a) => `calc(30vh + 70vmin - ${(Math.sin(a) * 50).toFixed(2)}vmin - 16vmin)`),
          rotate: steps.map((a) => ((Math.PI / 2 - a) * 180) / Math.PI),
        }}
        transition={{ duration: 3, delay: 1, ease: 'easeInOut' }}
      >
        <Duck size={180} crown shades className="h-[18vmin] w-[18vmin]" />
      </motion.div>
      {range(80).map((i) => (
        <motion.span
          key={i}
          className="absolute top-0 h-2 w-2 rotate-45"
          style={{ left: `${j(i, 1) * 100}vw`, background: RAINBOW[i % RAINBOW.length], boxShadow: `0 0 10px ${RAINBOW[i % RAINBOW.length]}` }}
          initial={{ y: '-5vh', opacity: 0 }}
          animate={{ y: '105vh', opacity: [0, 1, 1, 0], rotate: 360 }}
          transition={{ duration: 2 + j(i, 2) * 1.5, delay: j(i, 3) * 2.4, ease: 'linear' }}
        />
      ))}
      <UltraTitle duration={4.4} />
    </>
  );
}

export function Galaxy() {
  return (
    <>
      <motion.div className="absolute inset-0 bg-[#05010f]" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.94, 0.94, 0] }} transition={{ duration: 4.8, times: [0, 0.1, 0.85, 1] }} />
      {range(90).map((i) => (
        <motion.span key={`s-${i}`} className="absolute rounded-full bg-white" style={{ left: `${j(i, 1) * 100}vw`, top: `${j(i, 2) * 100}vh`, width: 1 + j(i, 3) * 3, height: 1 + j(i, 3) * 3 }} animate={{ opacity: [0, 1, 0.2, 1, 0] }} transition={{ duration: 4.6, delay: j(i, 4) * 0.5 }} />
      ))}
      {/* spiral galaxy */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[120vmin] w-[120vmin] rounded-full"
        style={{
          marginLeft: '-60vmin', marginTop: '-60vmin',
          background: 'conic-gradient(from 0deg, #f472b6, transparent 15%, #a78bfa 25%, transparent 40%, #38bdf8 50%, transparent 65%, #fde047 75%, transparent 90%, #f472b6)',
          maskImage: 'radial-gradient(circle, black 5%, rgba(0,0,0,0.6) 35%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle, black 5%, rgba(0,0,0,0.6) 35%, transparent 70%)',
          filter: 'blur(6px)',
        }}
        initial={{ scale: 0, rotate: 0, opacity: 0 }}
        animate={{ scale: [0, 1, 1.1], rotate: 540, opacity: [0, 0.95, 0.95, 0] }}
        transition={{ duration: 4.6, ease: 'easeOut' }}
      />
      {/* orbiting planets */}
      {range(5).map((i) => {
        const r = 18 + i * 7;
        return (
          <motion.div
            key={`p-${i}`}
            className="absolute left-1/2 top-1/2 h-0 w-0"
            initial={{ rotate: j(i, 5) * 360, opacity: 0 }}
            animate={{ rotate: j(i, 5) * 360 + (i % 2 ? 300 : -300), opacity: [0, 1, 1, 0] }}
            transition={{ duration: 4.4, ease: 'linear' }}
          >
            <span
              className="absolute rounded-full"
              style={{ left: `${r}vmin`, width: `${3 + i}vmin`, height: `${3 + i}vmin`, background: `radial-gradient(circle at 35% 30%, #ffffff, ${RAINBOW[i]} 50%, #1e1b4b)`, boxShadow: `0 0 20px ${RAINBOW[i]}` }}
            />
          </motion.div>
        );
      })}
      {/* astronaut duck floats through */}
      <motion.div
        className="absolute left-0 top-[48vh]"
        initial={{ x: '-30vw', rotate: -30 }}
        animate={{ x: ['-30vw', '35vw', '45vw', '120vw'], y: [0, -40, 20, -60], rotate: [-30, 0, 20, 200] }}
        transition={{ duration: 4.4, times: [0, 0.35, 0.65, 1], ease: 'easeInOut' }}
      >
        <div className="relative">
          <Duck size={220} crown className="h-[26vmin] w-[26vmin]" />
          {/* helmet */}
          <div className="absolute -inset-[8%] rounded-full border-4 border-sky-200/70 bg-sky-200/10 shadow-[0_0_30px_rgba(186,230,253,0.7)]" />
        </div>
      </motion.div>
      <UltraTitle duration={4.6} />
    </>
  );
}
