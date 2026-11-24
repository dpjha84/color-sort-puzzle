// Cloud save: pure merge rules. The player keeps whichever side is furthest along, and nothing is ever lost:
// achievements are unioned and per-level stars keep the best. XP only ever goes up, so it is a safe tie-breaker.
import { PlayerProfile } from '../types/game';
import { ProgressState } from './progress';

export interface CloudSave {
  v: 1;
  savedAt: number;
  profile: PlayerProfile;
  progress: ProgressState;
}

export const rankOf = (progress: ProgressState): [number, number, number] => [
  progress.stats?.maxLevelCleared ?? 0,
  progress.stats?.levelsWon ?? 0,
  progress.xp ?? 0,
];

const cmp = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  return 0;
};

/** True if the data looks like a real save (guards against a corrupt or foreign snapshot). */
export function isValidSave(x: unknown): x is CloudSave {
  const s = x as CloudSave;
  return !!s && s.v === 1 && !!s.profile && !!s.progress && typeof s.progress.xp === 'number' && !!s.progress.stats && typeof s.progress.stats.maxLevelCleared === 'number' && typeof s.profile.currentLevel === 'number';
}

export function mergeSaves(local: CloudSave, cloud: CloudSave): { merged: CloudSave; winner: 'local' | 'cloud' | 'same' } {
  const c = cmp(rankOf(local.progress), rankOf(cloud.progress));
  const win = c >= 0 ? local : cloud;
  const lose = c >= 0 ? cloud : local;
  const winner: 'local' | 'cloud' | 'same' = c === 0 ? 'same' : c > 0 ? 'local' : 'cloud';

  const stats = { ...win.progress.stats };
  (Object.keys(stats) as (keyof typeof stats)[]).forEach((k) => {
    const a = win.progress.stats[k];
    const b = lose.progress.stats[k];
    if (typeof a === 'number' && typeof b === 'number' && k !== 'streak') (stats as unknown as Record<string, number>)[k] = Math.max(a, b);
  });

  const unlocked: Record<string, number> = { ...lose.progress.unlocked };
  Object.entries(win.progress.unlocked).forEach(([id, ts]) => (unlocked[id] = Math.min(ts, unlocked[id] ?? ts)));

  const levelStars: Record<number, number> = { ...(lose.progress.levelStars || {}) };
  Object.entries(win.progress.levelStars || {}).forEach(([lvl, st]) => {
    levelStars[Number(lvl)] = Math.max(st, levelStars[Number(lvl)] ?? 0);
  });

  const daily = { ...win.progress.daily, bestStreak: Math.max(win.progress.daily?.bestStreak ?? 0, lose.progress.daily?.bestStreak ?? 0), bestPoints: Math.max(win.progress.daily?.bestPoints ?? 0, lose.progress.daily?.bestPoints ?? 0), totalWins: Math.max(win.progress.daily?.totalWins ?? 0, lose.progress.daily?.totalWins ?? 0) };

  const profile: PlayerProfile = {
    ...win.profile,
    currentLevel: Math.max(win.profile.currentLevel, lose.profile.currentLevel),
    totalStars: Math.max(win.profile.totalStars, lose.profile.totalStars),
    totalScore: Math.max(win.profile.totalScore, lose.profile.totalScore),
  };

  return {
    winner,
    merged: { v: 1, savedAt: Math.max(local.savedAt, cloud.savedAt), profile, progress: { ...win.progress, stats, unlocked, levelStars, daily } },
  };
}

/** Does this save hold real progress (so a fresh install never uploads an empty save over a good one)? */
export const hasProgress = (s: CloudSave) => (s.progress.stats?.levelsWon ?? 0) > 0 || (s.profile?.currentLevel ?? 1) > 1;
