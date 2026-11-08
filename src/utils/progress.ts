// Economy + achievements + XP. Pure functions over a ProgressState that App owns and persists.
// Coins = soft currency (earned every win, spent on boosters). Gems = rare currency (achievements).
export interface Stats {
  levelsWon: number; // first-time clears only (replays can't farm achievements)
  maxLevelCleared: number;
  threeStarWins: number;
  starsEarned: number;
  noAssistWins: number;
  fastWins: number; // first clears under 30 s
  blitzWins: number; // first clears under 15 s
  topRank: number; // highest XP rank reached
  hintsUsed: number;
  styleChanges: number;
  streak: number;
  bestStreak: number;
  lastWinDate: string; // YYYY-MM-DD (local)
}

export interface ProgressState {
  coins: number;
  gems: number;
  xp: number;
  unlocked: Record<string, number>; // achievement id -> unlock timestamp
  stats: Stats;
  levelStars: Record<number, number>; // best stars per level (1-3)
}

export interface Reward { coins: number; gems: number; xp: number }

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  target: number;
  progress: (s: Stats) => number;
  reward: Reward;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_clear', title: 'First Steps', desc: 'Clear your first level', icon: '🌱', target: 1, progress: (s) => s.levelsWon, reward: { coins: 20, gems: 0, xp: 30 } },
  { id: 'clear_10', title: 'Getting Warm', desc: 'Clear 10 levels', icon: '🔥', target: 10, progress: (s) => s.levelsWon, reward: { coins: 50, gems: 0, xp: 60 } },
  { id: 'clear_50', title: 'Puzzle Pro', desc: 'Clear 50 levels', icon: '🧩', target: 50, progress: (s) => s.levelsWon, reward: { coins: 150, gems: 5, xp: 150 } },
  { id: 'clear_100', title: 'Centurion', desc: 'Clear 100 levels', icon: '🏛️', target: 100, progress: (s) => s.levelsWon, reward: { coins: 300, gems: 10, xp: 300 } },
  { id: 'reach_25', title: 'Climber', desc: 'Reach level 25', icon: '⛰️', target: 25, progress: (s) => s.maxLevelCleared, reward: { coins: 100, gems: 2, xp: 100 } },
  { id: 'three_star_1', title: 'Perfectionist', desc: 'Earn 3 stars on a level', icon: '⭐', target: 1, progress: (s) => s.threeStarWins, reward: { coins: 30, gems: 0, xp: 40 } },
  { id: 'three_star_25', title: 'Star Collector', desc: 'Earn 3 stars on 25 levels', icon: '🌟', target: 25, progress: (s) => s.threeStarWins, reward: { coins: 120, gems: 3, xp: 120 } },
  { id: 'stars_100', title: 'Constellation', desc: 'Collect 100 stars', icon: '✨', target: 100, progress: (s) => s.starsEarned, reward: { coins: 100, gems: 2, xp: 100 } },
  { id: 'no_assist_5', title: 'Pure Skill', desc: 'Clear 5 levels without hints or undo', icon: '🧠', target: 5, progress: (s) => s.noAssistWins, reward: { coins: 80, gems: 1, xp: 80 } },
  { id: 'speed_30', title: 'Speed Demon', desc: 'Clear a level in under 30 seconds', icon: '⚡', target: 1, progress: (s) => s.fastWins, reward: { coins: 50, gems: 1, xp: 60 } },
  { id: 'streak_3', title: 'On a Roll', desc: 'Win on 3 days in a row', icon: '📅', target: 3, progress: (s) => s.bestStreak, reward: { coins: 60, gems: 1, xp: 60 } },
  { id: 'streak_7', title: 'Devoted', desc: 'Win on 7 days in a row', icon: '💎', target: 7, progress: (s) => s.bestStreak, reward: { coins: 200, gems: 5, xp: 200 } },
  { id: 'hints_10', title: 'Hint Seeker', desc: 'Use 10 hints', icon: '💡', target: 10, progress: (s) => s.hintsUsed, reward: { coins: 30, gems: 0, xp: 30 } },
  { id: 'reach_50', title: 'Summit', desc: 'Reach level 50', icon: '🏔️', target: 50, progress: (s) => s.maxLevelCleared, reward: { coins: 150, gems: 3, xp: 150 } },
  { id: 'reach_75', title: 'Sky High', desc: 'Reach level 75', icon: '🚀', target: 75, progress: (s) => s.maxLevelCleared, reward: { coins: 200, gems: 4, xp: 200 } },
  { id: 'reach_100', title: 'Legend', desc: 'Reach level 100', icon: '👑', target: 100, progress: (s) => s.maxLevelCleared, reward: { coins: 400, gems: 8, xp: 400 } },
  { id: 'streak_14', title: 'Dedicated', desc: 'Win on 14 days in a row', icon: '📆', target: 14, progress: (s) => s.bestStreak, reward: { coins: 250, gems: 5, xp: 250 } },
  { id: 'streak_30', title: 'Unstoppable', desc: 'Win on 30 days in a row', icon: '🏆', target: 30, progress: (s) => s.bestStreak, reward: { coins: 500, gems: 10, xp: 500 } },
  { id: 'no_assist_25', title: 'Mastermind', desc: 'Clear 25 levels without hints or undo', icon: '🎯', target: 25, progress: (s) => s.noAssistWins, reward: { coins: 200, gems: 4, xp: 200 } },
  { id: 'speed_15', title: 'Lightning', desc: 'Clear a level in under 15 seconds', icon: '⏱️', target: 1, progress: (s) => s.blitzWins, reward: { coins: 100, gems: 2, xp: 100 } },
  { id: 'stars_250', title: 'Star Hoarder', desc: 'Collect 250 stars', icon: '🌠', target: 250, progress: (s) => s.starsEarned, reward: { coins: 200, gems: 4, xp: 200 } },
  { id: 'rank_10', title: 'Veteran', desc: 'Reach Rank 10', icon: '🎖️', target: 10, progress: (s) => s.topRank, reward: { coins: 150, gems: 3, xp: 0 } },
  { id: 'stylist', title: 'Stylist', desc: 'Change a ball skin, tube or theme', icon: '🎨', target: 1, progress: (s) => s.styleChanges, reward: { coins: 20, gems: 0, xp: 20 } },
];

const KEY = 'colorsort_progress_v1';

const fresh = (): ProgressState => ({
  coins: 50,
  gems: 0,
  xp: 0,
  unlocked: {},
  levelStars: {},
  stats: {
    levelsWon: 0, maxLevelCleared: 0, threeStarWins: 0, starsEarned: 0, noAssistWins: 0,
    fastWins: 0, blitzWins: 0, topRank: 1, hintsUsed: 0, styleChanges: 0, streak: 0, bestStreak: 0, lastWinDate: '',
  },
});

export function loadProgress(currentLevel = 1): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      const base = fresh();
      return { ...base, ...p, stats: { ...base.stats, ...(p.stats || {}) }, unlocked: p.unlocked || {}, levelStars: p.levelStars || {} };
    }
  } catch { /* ignore */ }
  // Existing players: credit levels they already cleared so they don't start from zero
  const p = fresh();
  const cleared = Math.max(0, currentLevel - 1);
  p.stats.maxLevelCleared = cleared;
  p.stats.levelsWon = cleared;
  return p;
}

export function saveProgress(p: ProgressState): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

// Cumulative XP needed to reach level n: 0, 100, 300, 600, 1000...
export const xpForLevel = (n: number) => 50 * n * (n - 1);
export function playerLevel(xp: number): { level: number; into: number; need: number } {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return { level, into: xp - xpForLevel(level), need: xpForLevel(level + 1) - xpForLevel(level) };
}

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export interface WinSummary {
  coins: number;
  xp: number;
  firstClear: boolean;
  unlocked: Achievement[];
  leveledUpTo: number | null;
}

function unlockNew(p: ProgressState, summary: WinSummary | null): Achievement[] {
  const fresh: Achievement[] = [];
  p.stats.topRank = Math.max(p.stats.topRank || 1, playerLevel(p.xp).level);
  for (const a of ACHIEVEMENTS) {
    if (!p.unlocked[a.id] && a.progress(p.stats) >= a.target) {
      p.unlocked[a.id] = Date.now();
      p.coins += a.reward.coins;
      p.gems += a.reward.gems;
      p.xp += a.reward.xp;
      fresh.push(a);
    }
  }
  if (summary) {
    summary.coins += fresh.reduce((n, a) => n + a.reward.coins, 0);
    summary.xp += fresh.reduce((n, a) => n + a.reward.xp, 0);
  }
  return fresh;
}

export function applyWin(
  prev: ProgressState,
  w: { level: number; stars: number; timeSeconds: number; assisted: boolean },
): { state: ProgressState; summary: WinSummary } {
  const p: ProgressState = { ...prev, stats: { ...prev.stats }, unlocked: { ...prev.unlocked }, levelStars: { ...(prev.levelStars || {}) } };
  p.levelStars[w.level] = Math.max(p.levelStars[w.level] || 0, w.stars);
  const before = playerLevel(p.xp).level;
  const firstClear = w.level > p.stats.maxLevelCleared;
  const summary: WinSummary = { coins: 0, xp: 0, firstClear, unlocked: [], leveledUpTo: null };

  // Daily streak (counts any win, replay or not)
  const today = dayKey(new Date());
  if (p.stats.lastWinDate !== today) {
    const y = new Date(); y.setDate(y.getDate() - 1);
    p.stats.streak = p.stats.lastWinDate === dayKey(y) ? p.stats.streak + 1 : 1;
    p.stats.bestStreak = Math.max(p.stats.bestStreak, p.stats.streak);
    p.stats.lastWinDate = today;
  }

  if (firstClear) {
    summary.coins = 10 + 5 * w.stars;
    summary.xp = 20 + 10 * w.stars;
    p.stats.levelsWon += 1;
    p.stats.maxLevelCleared = w.level;
    p.stats.starsEarned += w.stars;
    if (w.stars === 3) p.stats.threeStarWins += 1;
    if (!w.assisted) p.stats.noAssistWins += 1;
    if (w.timeSeconds < 30) p.stats.fastWins += 1;
    if (w.timeSeconds < 15) p.stats.blitzWins += 1;
  } else {
    summary.coins = 5; // replays pay a little, but never advance achievements
    summary.xp = 5;
  }
  p.coins += summary.coins;
  p.xp += summary.xp;

  summary.unlocked = unlockNew(p, summary);
  const after = playerLevel(p.xp).level;
  if (after > before) summary.leveledUpTo = after;
  return { state: p, summary };
}

export function applyStat(prev: ProgressState, key: 'hintsUsed' | 'styleChanges'): { state: ProgressState; unlocked: Achievement[] } {
  const p: ProgressState = { ...prev, stats: { ...prev.stats }, unlocked: { ...prev.unlocked } };
  p.stats[key] += 1;
  return { state: p, unlocked: unlockNew(p, null) };
}

export type ShopItem = 'hint' | 'undos' | 'tube' | 'pack';
export const SHOP: { id: ShopItem; title: string; desc: string; icon: string; coins?: number; gems?: number }[] = [
  { id: 'hint', title: '1 Hint', desc: 'Shows the best next move', icon: '💡', coins: 30 },
  { id: 'undos', title: '5 Undos', desc: 'Take back mistakes', icon: '↩️', coins: 40 },
  { id: 'tube', title: '+1 Tube', desc: 'An extra empty tube', icon: '🧪', coins: 60 },
  { id: 'pack', title: 'Booster Pack', desc: '5 hints, 5 undos, 2 tubes', icon: '🎁', gems: 3 },
];

export function applyPurchase(prev: ProgressState, item: ShopItem): ProgressState | null {
  const it = SHOP.find((s) => s.id === item)!;
  if ((it.coins ?? 0) > prev.coins || (it.gems ?? 0) > prev.gems) return null;
  return { ...prev, coins: prev.coins - (it.coins ?? 0), gems: prev.gems - (it.gems ?? 0) };
}
