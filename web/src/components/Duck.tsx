/** CoinPack's mascot: our own drawing, a yellow duck in a Monad-purple scarf. Faces right. */
export function Duck({
  size = 72, shades = false, crown = false, sad = false, flip = false, className = '',
}: {
  size?: number;
  shades?: boolean;
  crown?: boolean;
  sad?: boolean;
  /** Face left instead of right. */
  flip?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden="true"
    >
      {/* feet */}
      <ellipse cx="40" cy="92" rx="9" ry="4" fill="#F28C28" />
      <ellipse cx="60" cy="92" rx="9" ry="4" fill="#F28C28" />
      {/* tail + body */}
      <path d="M22 62 L6 50 L20 74 Z" fill="#F5B800" />
      <ellipse cx="48" cy="68" rx="30" ry="23" fill="#FFD43B" />
      {/* wing */}
      <ellipse cx="42" cy="70" rx="15" ry="10" fill="#F5B800" />
      {/* head */}
      <circle cx="64" cy="36" r="19" fill="#FFD43B" />
      {/* scarf */}
      <path d="M48 50 Q64 60 80 49 L79 56 Q64 67 49 57 Z" fill="#836EF9" />
      <path d="M52 57 L46 72 L55 68 Z" fill="#6B55E0" />
      {/* beak */}
      <path d="M79 33 Q98 36 80 46 Q76 40 79 33 Z" fill="#F28C28" />
      {/* cheek */}
      <circle cx="71" cy="43" r="4" fill="#FF9F8A" opacity="0.7" />
      {/* eye */}
      {shades ? (
        <>
          <rect x="56" y="25" width="24" height="10" rx="4" fill="#111" />
          <rect x="44" y="28" width="14" height="3" fill="#111" />
          <rect x="60" y="27" width="6" height="2" rx="1" fill="#fff" opacity="0.6" />
        </>
      ) : sad ? (
        <path d="M63 32 Q68 27 73 32" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="68" cy="30" r="4" fill="#111" />
          <circle cx="69.5" cy="28.5" r="1.3" fill="#fff" />
        </>
      )}
      {crown && (
        <>
          <path d="M48 20 L52 4 L60 14 L66 2 L72 14 L80 5 L82 21 Z" fill="#FCD34D" stroke="#B45309" strokeWidth="1.5" />
          <circle cx="66" cy="13" r="2.5" fill="#F472B6" />
          <circle cx="56" cy="15" r="2" fill="#38BDF8" />
          <circle cx="76" cy="15" r="2" fill="#34D399" />
        </>
      )}
    </svg>
  );
}
