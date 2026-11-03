// Google Play Games Services bridge. Local achievements/XP work without it.
// To go live: Play Console > Grow > Play Games Services: create the leaderboard and achievements,
// install a Capacitor Play Games plugin, then fill the IDs below. Until configured these are safe no-ops.
import { registerPlugin } from '@capacitor/core';

export const PLAY_LEADERBOARD_ID = ''; // e.g. 'CgkI...'
export const PLAY_ACHIEVEMENT_IDS: Record<string, string> = {
  // first_clear: 'CgkI...',
};

interface PlayGamesPlugin {
  signIn(): Promise<void>;
  submitScore(o: { leaderboardId: string; score: number }): Promise<void>;
  showLeaderboard(o: { leaderboardId: string }): Promise<void>;
  unlockAchievement(o: { achievementId: string }): Promise<void>;
}
const Plugin = registerPlugin<PlayGamesPlugin>('PlayGames');

export const isLeaderboardConfigured = () => PLAY_LEADERBOARD_ID !== '';

export async function unlockAchievement(localId: string): Promise<void> {
  const achievementId = PLAY_ACHIEVEMENT_IDS[localId];
  if (!achievementId) return;
  try { await Plugin.unlockAchievement({ achievementId }); } catch { /* plugin missing or signed out */ }
}

export async function submitScore(score: number): Promise<void> {
  if (!isLeaderboardConfigured()) return;
  try { await Plugin.submitScore({ leaderboardId: PLAY_LEADERBOARD_ID, score }); } catch { /* ignore */ }
}

// Opens the native Google Play Games leaderboard. Returns false if it could not be shown.
export async function showLeaderboard(): Promise<boolean> {
  if (!isLeaderboardConfigured()) return false;
  try {
    await Plugin.signIn();
    await Plugin.showLeaderboard({ leaderboardId: PLAY_LEADERBOARD_ID });
    return true;
  } catch {
    return false;
  }
}
