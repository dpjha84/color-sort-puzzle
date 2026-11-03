// Google Play Games Services (Android only). Everything is a safe no-op on web and when the
// player is signed out, so the game works the same without Play Games.
import { Capacitor } from '@capacitor/core';
import { PlayGames } from '@idleflowgames/capacitor-play-games';

export const PLAY_LEADERBOARD_ID = 'CggInaup8GwQAhAB';
export const PLAY_ACHIEVEMENT_IDS: Record<string, string> = {
  first_clear: 'CggInaup8GwQAhAC',
  clear_10: 'CggInaup8GwQAhAD',
  clear_50: 'CggInaup8GwQAhAJ',
  clear_100: 'CggInaup8GwQAhAI',
  reach_25: 'CggInaup8GwQAhAF',
  three_star_1: 'CggInaup8GwQAhAL',
  three_star_25: 'CggInaup8GwQAhAN',
  stars_100: 'CggInaup8GwQAhAG',
  no_assist_5: 'CggInaup8GwQAhAO',
  speed_30: 'CggInaup8GwQAhAK',
  streak_3: 'CggInaup8GwQAhAM',
  streak_7: 'CggInaup8GwQAhAP',
  hints_10: 'CggInaup8GwQAhAE',
  stylist: 'CggInaup8GwQAhAH',
};

const native = () => Capacitor.isNativePlatform();
let ready: Promise<void> | null = null;

// Called once at startup. Silent sign-in only: never shows a prompt by itself.
export function initPlayGames(): Promise<void> {
  if (!native()) return Promise.resolve();
  if (!ready) {
    ready = (async () => {
      try {
        await PlayGames.initialize();
        await PlayGames.signIn(); // silent
      } catch { /* not configured / offline */ }
    })();
  }
  return ready;
}

async function signedIn(): Promise<boolean> {
  if (!native()) return false;
  try {
    await initPlayGames();
    return (await PlayGames.isSignedIn()).signedIn;
  } catch {
    return false;
  }
}

export async function unlockAchievement(localId: string): Promise<void> {
  const id = PLAY_ACHIEVEMENT_IDS[localId];
  if (!id || !(await signedIn())) return;
  try { await PlayGames.unlockAchievement({ id }); } catch { /* ignore */ }
}

export async function submitScore(score: number): Promise<void> {
  if (!(await signedIn())) return;
  try { await PlayGames.submitScore({ leaderboardId: PLAY_LEADERBOARD_ID, score }); } catch { /* ignore */ }
}

// Opens Google's leaderboard screen. Asks the player to sign in first if needed.
// Returns false if it could not be shown (web, declined sign-in, offline).
export async function showLeaderboard(): Promise<boolean> {
  if (!native()) return false;
  try {
    await initPlayGames();
    if (!(await PlayGames.isSignedIn()).signedIn) {
      const r = await PlayGames.signIn({ silent: false });
      if (!r.signedIn) return false;
    }
    await PlayGames.showLeaderboard({ leaderboardId: PLAY_LEADERBOARD_ID });
    return true;
  } catch {
    return false;
  }
}

// Re-send everything earned so far (Play ignores repeats). Covers achievements unlocked
// before the player signed in to Play Games, or while offline.
export async function syncProgress(unlockedIds: string[], score: number): Promise<void> {
  if (!(await signedIn())) return;
  for (const id of unlockedIds) await unlockAchievement(id);
  if (score > 0) await submitScore(score);
}
