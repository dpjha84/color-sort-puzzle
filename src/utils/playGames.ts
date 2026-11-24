// Google Play Games Services (Android only). Everything is a safe no-op on web and when the
// player is signed out, so the game works the same without Play Games.
import { Capacitor } from '@capacitor/core';
import { PlayGames } from '@idleflowgames/capacitor-play-games';

export const PLAY_LEADERBOARD_ID = 'CggInaup8GwQAhAB';
// Daily Challenge leaderboard (create it in Play Console, then paste its ID here; empty = hidden)
export const PLAY_DAILY_LEADERBOARD_ID: string = 'CggInaup8GwQAhAa';
export const hasDailyLeaderboard = () => PLAY_DAILY_LEADERBOARD_ID !== '';
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
const errText = (e: unknown) => {
  const o = e as { message?: string; code?: string | number };
  const msg = e instanceof Error || typeof o?.message === 'string' ? o.message : typeof e === 'string' ? e : JSON.stringify(e);
  return `${msg || 'unknown error'}${o?.code ? ` [code ${o.code}]` : ''}`;
};
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

// Runs a Play Games screen. If Google says we are not signed in (the silent sign-in can be stale), it asks the
// player to sign in interactively once and tries again. Returns false if it could not be shown.
async function openPlayScreen(open: () => Promise<void>): Promise<boolean> {
  if (!native()) return false;
  try {
    await initPlayGames();
    if (!(await PlayGames.isSignedIn()).signedIn) {
      const r = await PlayGames.signIn({ silent: false });
      if (!r.signedIn) { lastIssue = `Sign-in not completed (${r.reason ?? 'unknown'})`; return false; }
    }
    try {
      await open();
      return true;
    } catch (first) {
      if (!/not signed in/i.test(errText(first))) throw first;
      const r = await PlayGames.signIn({ silent: false }); // refresh the session, then retry once
      if (!r.signedIn) { lastIssue = `Sign-in not completed (${r.reason ?? 'unknown'})`; return false; }
      await open();
      return true;
    }
  } catch (e) {
    lastIssue = errText(e);
    return false;
  }
}

// Opens Google's leaderboard screen. Asks the player to sign in first if needed.
export const showLeaderboard = (): Promise<boolean> =>
  openPlayScreen(() => PlayGames.showLeaderboard({ leaderboardId: PLAY_LEADERBOARD_ID }));

// Opens Google's achievements screen (same sign-in handling as the leaderboard).
export const showAchievements = (): Promise<boolean> => openPlayScreen(() => PlayGames.showAchievements());

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


export async function submitDailyScore(points: number): Promise<void> {
  if (!hasDailyLeaderboard() || !(await signedIn())) return;
  try { await PlayGames.submitScore({ leaderboardId: PLAY_DAILY_LEADERBOARD_ID, score: points }); } catch { /* ignore */ }
}

// Opens the Daily Challenge leaderboard (falls back to the main one until the daily one is configured).
export const showDailyLeaderboard = (): Promise<boolean> =>
  hasDailyLeaderboard() ? openPlayScreen(() => PlayGames.showLeaderboard({ leaderboardId: PLAY_DAILY_LEADERBOARD_ID })) : showLeaderboard();

// ---------------- Cloud save (Play Games Saved Games) ----------------
const SNAPSHOT_NAME = 'colorsort_save_v1';

/** The saved game, or null when signed out / no save / unreadable. Never throws. */
export async function loadCloudSave(): Promise<unknown | null> {
  if (!(await signedIn())) return null;
  try {
    const { snapshot } = await PlayGames.loadSnapshot({ name: SNAPSHOT_NAME });
    return snapshot?.data ? JSON.parse(snapshot.data) : null;
  } catch {
    return null;
  }
}

export async function saveCloudSave(save: unknown): Promise<boolean> {
  if (!(await signedIn())) return false;
  try {
    const p = await PlayGames.getPlayer();
    await PlayGames.saveSnapshot({
      name: SNAPSHOT_NAME,
      data: JSON.stringify(save),
      description: 'ColorSort progress',
      expectedPlayerId: p.playerId,
    });
    return true;
  } catch (e) {
    lastIssue = errText(e);
    return false;
  }
}
