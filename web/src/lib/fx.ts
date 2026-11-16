/**
 * Tiny event channel between the games and the app-wide decorations (duck mascot, full-screen scenes).
 * Decoration only: events are emitted after a result is known and never change it.
 */
export type FxRect = { x: number; y: number; w: number; h: number };
export type FxEvent =
  | { type: 'busy' } // a pack / spin was just requested
  | { type: 'pull'; rarity: number; rect?: FxRect; uncommon?: boolean } // a card was revealed (display rarity 0–5; uncommon = an Uncommon card)
  | { type: 'pack'; won: boolean; bad?: boolean }; // the whole pack is revealed; bad = lost a fifth or more

type Listener = (e: FxEvent) => void;
const listeners = new Set<Listener>();

export function onFx(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function emitFx(e: FxEvent): void {
  listeners.forEach((l) => l(e));
}

export function rectOf(el: Element | null): FxRect | undefined {
  if (!el) return undefined;
  const b = el.getBoundingClientRect();
  return { x: b.left, y: b.top, w: b.width, h: b.height };
}

// Dev-only handle for trying scenes from the console: __fx({ type: 'pull', rarity: 5 })
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  (window as unknown as { __fx: typeof emitFx }).__fx = emitFx;
}
