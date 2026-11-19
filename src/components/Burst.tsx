import React, { useEffect, useRef } from 'react';

export type BurstKind = 'sparkle' | 'puff';

interface BurstProps {
  x: number; // viewport px
  y: number;
  colors: string[];
  kind: BurstKind;
  size: number; // roughly one ball diameter, sets how far particles travel
  onDone: () => void;
}

const reduced = () =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A short particle burst (sparkles or a dust puff). Plain DOM + Web Animations: light enough for low-end phones. */
export const Burst: React.FC<BurstProps> = ({ x, y, colors, kind, size, onDone }) => {
  const root = useRef<HTMLDivElement>(null);
  const n = kind === 'sparkle' ? 14 : 6;

  useEffect(() => {
    const done = setTimeout(onDone, kind === 'sparkle' ? 1000 : 600);
    const el = root.current;
    if (!el || reduced()) {
      onDone();
      return () => clearTimeout(done);
    }
    Array.from(el.children).forEach((c, i) => {
      const node = c as HTMLElement;
      if (typeof node.animate !== 'function') return;
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.6;
      const dist = kind === 'sparkle' ? size * (0.9 + Math.random() * 0.9) : size * (0.35 + Math.random() * 0.3);
      const dx = Math.cos(a) * dist;
      const dy = Math.sin(a) * dist - (kind === 'sparkle' ? size * 0.25 : size * 0.05);
      const fall = kind === 'sparkle' ? size * 0.5 : 0;
      node.animate(
        [
          { transform: 'translate(-50%,-50%) scale(0.2)', opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.1)`, opacity: 1, offset: 0.55 },
          { transform: `translate(calc(-50% + ${dx * 1.1}px), calc(-50% + ${dy + fall}px)) scale(0.2)`, opacity: 0 },
        ],
        { duration: kind === 'sparkle' ? 760 + Math.random() * 200 : 460, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' },
      );
    });
    return () => clearTimeout(done);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={root} className="fixed z-[55] pointer-events-none" style={{ left: x, top: y }} aria-hidden>
      {Array.from({ length: n }).map((_, i) => {
        const c = colors[i % colors.length];
        const d = kind === 'sparkle' ? 5 + (i % 3) * 2 : 6 + (i % 2) * 3;
        return (
          <span
            key={i}
            className="absolute block"
            style={{
              width: d,
              height: d,
              left: 0,
              top: 0,
              background: kind === 'puff' ? 'rgba(255,255,255,0.55)' : c,
              borderRadius: kind === 'sparkle' && i % 2 ? 2 : 999,
              rotate: kind === 'sparkle' ? `${i * 37}deg` : undefined,
              boxShadow: kind === 'sparkle' ? `0 0 6px ${c}` : undefined,
              opacity: 0,
            }}
          />
        );
      })}
    </div>
  );
};
