/** Water theme behind every page: slow waves along the bottom and bubbles drifting up. Decoration only. */
const CREST = 'M0 30 Q75 0 150 30 T300 30 T450 30 T600 30 T750 30 T900 30 T1050 30 T1200 30 V60 H0 Z';
const BUBBLES = Array.from({ length: 18 }, (_, i) => {
  const r = (k: number) => {
    const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return { left: r(1) * 100, size: 8 + r(2) * 26, duration: 9 + r(3) * 10, delay: -r(4) * 18 };
});

export function WaterBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="water-bubble"
          style={{ left: `${b.left}vw`, width: b.size, height: b.size, animationDuration: `${b.duration}s`, animationDelay: `${b.delay}s` }}
        />
      ))}
      <svg className="water-wave absolute bottom-0 left-0 h-[18vh] w-[200%]" viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path d={CREST} fill="rgba(56,189,248,0.16)" />
      </svg>
      <svg className="water-wave water-wave-2 absolute bottom-0 left-0 h-[12vh] w-[200%]" viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path d={CREST} fill="rgba(37,99,235,0.22)" />
      </svg>
      <svg className="water-wave water-wave-3 absolute bottom-0 left-0 h-[7vh] w-[200%]" viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path d={CREST} fill="rgba(125,211,252,0.2)" />
      </svg>
    </div>
  );
}
