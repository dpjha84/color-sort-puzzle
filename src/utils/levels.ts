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
      targetMoves: Math.max(10, colors.size * 6),
      initialTubes: JSON.parse(JSON.stringify(initialTubes)),
    };
  }

  // Scaling parameters based on level
  let numColors = 3;
  let numEmptyTubes = 2;
  const maxCapacity = 4;

  if (levelNum <= 3) {
    numColors = 3;
    numEmptyTubes = 1;
  } else if (levelNum <= 6) {
    numColors = 4;
    numEmptyTubes = 2;
  } else if (levelNum <= 12) {
    numColors = 5;
    numEmptyTubes = 2;
  } else if (levelNum <= 22) {
    numColors = 6;
    numEmptyTubes = 2;
  } else if (levelNum <= 35) {
    numColors = 7;
    numEmptyTubes = 2;
  } else {
    numColors = Math.min(8, 5 + Math.floor((levelNum - 35) / 10));
    numEmptyTubes = 2;
  }

  const selectedColors = COLOR_PALETTE.slice(0, numColors).map((c) => c.color);

  // Solved state: each color has 1 full tube of 4 balls
  const tubes: BallColor[][] = [];
  for (let i = 0; i < numColors; i++) {
    tubes.push(Array(maxCapacity).fill(selectedColors[i]));
  }
  for (let i = 0; i < numEmptyTubes; i++) {
    tubes.push([]);
  }

  // Shuffle by performing valid reverse moves
  // A reverse move moves a top ball from tube A to tube B if tube B has room
  const shuffleSteps = 40 + Math.min(60, levelNum * 3);
  let previousFrom = -1;
  let previousTo = -1;

  for (let step = 0; step < shuffleSteps; step++) {
    const validMoves: { from: number; to: number }[] = [];

    for (let from = 0; from < tubes.length; from++) {
      if (tubes[from].length === 0) continue;
      for (let to = 0; to < tubes.length; to++) {
        if (from === to) continue;
        if (tubes[to].length >= maxCapacity) continue;
        // Avoid immediate undo of the immediately previous move
        if (from === previousTo && to === previousFrom) continue;

        validMoves.push({ from, to });
      }
    }

    if (validMoves.length > 0) {
      const chosen = validMoves[Math.floor(Math.random() * validMoves.length)];
      const ball = tubes[chosen.from].pop()!;
      tubes[chosen.to].push(ball);
      previousFrom = chosen.from;
      previousTo = chosen.to;
    }
  }

  // Ensure tubes aren't already solved
  const isAlreadySolved = tubes.every(
    (t) => t.length === 0 || (t.length === maxCapacity && t.every((c) => c === t[0]))
  );
  if (isAlreadySolved) {
    return generateLevel(levelNum);
  }

  return {
    levelNumber: levelNum,
    numColors,
    numEmptyTubes,
    targetMoves: numColors * 6 + 4,
    initialTubes: tubes,
  };
}

export function getColorDetails(color: BallColor) {
  return COLOR_PALETTE.find((c) => c.color === color) || COLOR_PALETTE[0];
}
