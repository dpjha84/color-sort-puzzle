import React, { useMemo } from 'react';

/** Soft drifting colour glows and tiny floating specks behind the game (transform/opacity only: cheap on phones). */
export const AmbientBackground: React.FC = () => {
  const orbs = useMemo(
    () => [
      { x: '-8%', y: '12%', s: 240, c: 'rgba(59,130,246,0.28)', d: 18 },
      { x: '70%', y: '6%', s: 220, c: 'rgba(168,85,247,0.24)', d: 22 },
      { x: '58%', y: '62%', s: 260, c: 'rgba(236,72,153,0.18)', d: 26 },
      { x: '-12%', y: '70%', s: 230, c: 'rgba(16,185,129,0.18)', d: 20 },
      { x: '30%', y: '38%', s: 200, c: 'rgba(56,189,248,0.14)', d: 24 },
    ],
    [],
  );
  const specks = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        x: `${(i * 37 + 11) % 100}%`,
        y: `${(i * 53 + 7) % 100}%`,
        s: 3 + (i % 3) * 2,
        d: 6 + (i % 5) * 1.5,
        delay: -(i * 1.3),
        c: ['#93c5fd', '#c4b5fd', '#f9a8d4', '#fde68a', '#6ee7b7'][i % 5],
      })),
    [],
  );
  return (
    <div className="ambient-bg absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      {orbs.map((o, i) => (
        <span
          key={i}
          className="ambient-orb absolute rounded-full"
          style={{
            left: o.x,
            top: o.y,
            width: o.s,
            height: o.s,
            background: `radial-gradient(circle, ${o.c} 0%, rgba(0,0,0,0) 68%)`,
            animationDuration: `${o.d}s`,
            animationDelay: `${-i * 4}s`,
          }}
        />
      ))}
      {specks.map((p, i) => (
        <span
          key={i}
          className="ambient-speck absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.s,
            height: p.s,
            background: p.c,
            boxShadow: `0 0 ${p.s * 2}px ${p.c}`,
            animationDuration: `${p.d}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};
