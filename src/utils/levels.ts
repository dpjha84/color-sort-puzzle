import { BallColor, LevelConfig } from '../types/game';

export const COLOR_PALETTE: { color: BallColor; name: string; hex: string; gradient: string }[] = [
  { color: 'red', name: 'Ruby', hex: '#EF4444', gradient: 'radial-gradient(circle at 35% 35%, #F87171, #EF4444 45%, #991B1B 100%)' },
  { color: 'blue', name: 'Sapphire', hex: '#3B82F6', gradient: 'radial-gradient(circle at 35% 35%, #60A5FA, #3B82F6 45%, #1E40AF 100%)' },
  { color: 'emerald', name: 'Emerald', hex: '#10B981', gradient: 'radial-gradient(circle at 35% 35%, #34D399, #10B981 45%, #065F46 100%)' },
  { color: 'amber', name: 'Amber', hex: '#F59E0B', gradient: 'radial-gradient(circle at 35% 35%, #FBBF24, #F59E0B 45%, #92400E 100%)' },
  { color: 'purple', name: 'Amethyst', hex: '#A855F7', gradient: 'radial-gradient(circle at 35% 35%, #C084FC, #A855F7 45%, #6B21A8 100%)' },
  { color: 'cyan', name: 'Topaz', hex: '#06B6D4', gradient: 'radial-gradient(circle at 35% 35%, #22D3EE, #06B6D4 45%, #155E75 100%)' },
  { color: 'pink', name: 'Rose', hex: '#EC4899', gradient: 'radial-gradient(circle at 35% 35%, #F472B6, #EC4899 45%, #9D174D 100%)' },
  { color: 'orange', name: 'Coral', hex: '#F97316', gradient: 'radial-gradient(circle at 35% 35%, #FB923C, #F97316 45%, #9A3412 100%)' },
  { color: 'lime', name: 'Peridot', hex: '#84CC16', gradient: 'radial-gradient(circle at 35% 35%, #A3E635, #84CC16 45%, #3F6212 100%)' },
  { color: 'indigo', name: 'Tanzanite', hex: '#6366F1', gradient: 'radial-gradient(circle at 35% 35%, #818CF8, #6366F1 45%, #3730A3 100%)' },
];

export const EMOJI_MAP: Record<BallColor, string> = {
  red: '❤️',
  blue: '💎',
  emerald: '🍀',
  amber: '⭐',
  purple: '🔮',
  cyan: '🌊',
  pink: '🌸',
  orange: '🔥',
  lime: '🍏',
  indigo: '⚡',
};

export const PLANET_MAP: Record<BallColor, { name: string; icon: string }> = {
  red: { name: 'Mars', icon: '🔴' },
  blue: { name: 'Neptune', icon: '🔵' },
  emerald: { name: 'Terra', icon: '🟢' },
  amber: { name: 'Sun', icon: '🟡' },
  purple: { name: 'Jupiter', icon: '🟣' },
  cyan: { name: 'Uranus', icon: '🌐' },
  pink: { name: 'Venus', icon: '🪐' },
  orange: { name: 'Mercury', icon: '🟠' },
  lime: { name: 'Aurora', icon: '❇️' },
  indigo: { name: 'Cosmos', icon: '🌌' },
};

export const SPORTS_MAP: Record<BallColor, string> = {
  red: '🏀',
  blue: '⚽',
  emerald: '🎾',
  amber: '🎱',
  purple: '🏐',
  cyan: '⚾',
  pink: '🎳',
  orange: '🏈',
  lime: '🥎',
  indigo: '🥏',
};

// Curated starter levels
const CURATED_LEVELS: Record<number, BallColor[][]> = {
  1: [
    ['red', 'blue', 'red', 'blue'],
    ['blue', 'red', 'blue', 'red'],
    [],
    [],
  ],
  2: [
    ['red', 'blue', 'emerald', 'red'],
    ['blue', 'emerald', 'red', 'blue'],
    ['emerald', 'red', 'blue', 'emerald'],
    [],
    [],
  ],
  3: [
    ['red', 'blue', 'amber', 'blue'],
    ['amber', 'emerald', 'red', 'emerald'],
    ['emerald', 'red', 'blue', 'amber'],
    [],
    [],
  ],
  4: [
    ['red', 'blue', 'emerald', 'amber'],
    ['emerald', 'amber', 'red', 'blue'],
    ['amber', 'red', 'blue', 'emerald'],
    ['blue', 'emerald', 'amber', 'red'],
    [],
    [],
  ],
  5: [
    ['purple', 'cyan', 'red', 'blue'],
    ['cyan', 'red', 'purple', 'emerald'],
    ['blue', 'emerald', 'cyan', 'purple'],
    ['red', 'blue', 'emerald', 'cyan'],
    ['emerald', 'purple', 'blue', 'red'],
    [],
    [],
  ],
};

/**
 * Generate a level with guaranteed solvability by simulating reverse moves
 * from a solved state.
 */
export function generateLevel(levelNum: number): LevelConfig {
  if (CURATED_LEVELS[levelNum]) {
    const initialTubes = CURATED_LEVELS[levelNum];
    const colors = new Set<BallColor>();
    initialTubes.forEach((t) => t.forEach((c) => colors.add(c)));
    const emptyCount = initialTubes.filter((t) => t.length === 0).length;

    return {
      levelNumber: levelNum,
      numColors: colors.size,
      numEmptyTubes: emptyCount,
      targetMoves: starTarget(colors.size),
      initialTubes: JSON.parse(JSON.stringify(initialTubes)),
    };
  }

  // Scaling parameters based on level. Colours keep rising (never drop), then the free space shrinks.
  const numColors =
    levelNum <= 3 ? 3
    : levelNum <= 6 ? 4
    : levelNum <= 12 ? 5
    : levelNum <= 22 ? 6
    : levelNum <= 35 ? 7
    : levelNum <= 90 ? 8
    : 9;
  // Late levels get a single spare tube (every other level from 61, every level from 91): same colours,
  // far less room to manoeuvre. Never more than 10 tubes so the board still fits a phone screen.
  const numEmptyTubes = levelNum <= 3 ? 1 : levelNum >= 91 || (levelNum >= 61 && levelNum % 2 === 0) ? 1 : 2;
  const maxCapacity = 4;

  const selectedColors = COLOR_PALETTE.slice(0, numColors).map((c) => c.color);

  // Seeded, so a level is the same board every time it is played (stars/score stay comparable)
  const rand = mulberry32(levelNum * 7919 + 13);
  const shuffleSteps = 60 + Math.min(80, levelNum * 3);
  const minMisplaced = levelNum > 6 ? 0.6 : 0;

  let tubes: BallColor[][] = [];
  for (let attempt = 0; attempt < 40; attempt++) {
    // Solved state: each colour has one full tube of 4 balls
    tubes = [];
    for (let i = 0; i < numColors; i++) tubes.push(Array(maxCapacity).fill(selectedColors[i]));
    for (let i = 0; i < numEmptyTubes; i++) tubes.push([]);

    // Shuffle by valid reverse moves, so the level is always solvable
    let previousFrom = -1;
    let previousTo = -1;
    for (let step = 0; step < shuffleSteps; step++) {
      const validMoves: { from: number; to: number }[] = [];
      for (let from = 0; from < tubes.length; from++) {
        if (tubes[from].length === 0) continue;
        for (let to = 0; to < tubes.length; to++) {
          if (from === to || tubes[to].length >= maxCapacity) continue;
          if (from === previousTo && to === previousFrom) continue; // don't undo the last move
          validMoves.push({ from, to });
        }
      }
      if (validMoves.length > 0) {
        const chosen = validMoves[Math.floor(rand() * validMoves.length)];
        tubes[chosen.to].push(tubes[chosen.from].pop()!);
        previousFrom = chosen.from;
        previousTo = chosen.to;
      }
    }

    const solved = tubes.every((t) => t.length === 0 || (t.length === maxCapacity && t.every((c) => c === t[0])));
    if (!solved && misplacedShare(tubes) >= minMisplaced) break;
  }

  return {
    levelNumber: levelNum,
    numColors,
    numEmptyTubes,
    targetMoves: starTarget(numColors),
    initialTubes: tubes,
  };
}

// 3 stars needs a near-efficient solution (a good solver needs roughly 3 moves per colour)
function starTarget(numColors: number): number {
  return numColors * 4 + 2;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Share of balls that sit on top of a different colour (how scrambled the board is)
function misplacedShare(tubes: BallColor[][]): number {
  let bad = 0;
  let total = 0;
  for (const t of tubes) {
    total += t.length;
    let k = 0;
    while (k < t.length && t[k] === t[0]) k++;
    bad += t.length - k;
  }
  return total ? bad / total : 0;
}

export function getColorDetails(color: BallColor) {
  return COLOR_PALETTE.find((c) => c.color === color) || COLOR_PALETTE[0];
}
