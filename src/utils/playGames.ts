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
  reach_50: 'CggInaup8GwQAhAX',
  reach_75: 'CggInaup8GwQAhAW',
  reach_100: 'CggInaup8GwQAhAS',
  streak_14: 'CggInaup8GwQAhAZ',
  streak_30: 'CggInaup8GwQAhAR',
  no_assist_25: 'CggInaup8GwQAhAT',
  speed_15: 'CggInaup8GwQAhAU',
  stars_250: 'CggInaup8GwQAhAV',
  rank_10: 'CggInaup8GwQAhAY',
  stylist: 'CggInaup8GwQAhAH',
};

const native = () => Capacitor.isNativePlatform();
let lastIssue = '';
const errText = (e: unknown) => (e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e)) || 'unknown error';
let ready: Promise<void> | null = null;

// Called once at startup. Silent sign-in only: never shows a prompt by itself.
export function initPlayGames(): Promise<void> {
  if (!native()) return Promise.resolve();
  if (!ready) {
    ready = (async () => {
      try {
        await PlayGames.initialize();
        const r = await PlayGames.signIn(); // silent
        if (!r.signedIn) lastIssue = `Not signed in (${r.reason ?? 'unknown'})`;
      } catch (e) {
        lastIssue = errText(e);
      }
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
      if (!r.signedIn) { lastIssue = `Sign-in not completed (${r.reason ?? 'unknown'})`; return false; }
    }
    await PlayGames.showLeaderboard({ leaderboardId: PLAY_LEADERBOARD_ID });
    return true;
  } catch (e) {
    lastIssue = errText(e);
    return false;
  }
}

// Opens Google's achievements screen (same sign-in handling as the leaderboard).
export async function showAchievements(): Promise<boolean> {
  if (!native()) return false;
  try {
    await initPlayGames();
    if (!(await PlayGames.isSignedIn()).signedIn) {
      const r = await PlayGames.signIn({ silent: false });
      if (!r.signedIn) { lastIssue = `Sign-in not completed (${r.reason ?? 'unknown'})`; return false; }
    }
    await PlayGames.showAchievements();
    return true;
  } catch (e) {
    lastIssue = errText(e);
    return false;
  }
}

export function getLastIssue(): string {
  return lastIssue;
}

// One-line status for the My Stats screen.
export async function playGamesStatus(): Promise<string> {
  if (!native()) return 'Play Games: only available in the Android app';
  try {
    await initPlayGames();
    const { signedIn: ok } = await PlayGames.isSignedIn();
    if (!ok) return `Play Games: not signed in${lastIssue ? ` - ${lastIssue}` : ''}`;
    const p = await PlayGames.getPlayer();
    return `Play Games: signed in as ${p.displayName || p.playerId}`;
  } catch (e) {
    return `Play Games: error - ${errText(e)}`;
  }
}

// Re-send everything earned so far (Play ignores repeats). Covers achievements unlocked
// before the player signed in to Play Games, or while offline.
export async function syncProgress(unlockedIds: string[], score: number): Promise<void> {
  if (!(await signedIn())) return;
  for (const id of unlockedIds) await unlockAchievement(id);
  if (score > 0) await submitScore(score);
}
