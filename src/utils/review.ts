// Ask for a Play Store rating once, right after a 3-star win (a happy moment). Google decides whether the dialog shows.
import { Capacitor } from '@capacitor/core';
import { InAppReview } from '@capacitor-community/in-app-review';

const KEY = 'colorsort_review_asked_v1';

export function maybeRequestReview(levelsWon: number): void {
  if (!Capacitor.isNativePlatform() || levelsWon < 8) return;
  try {
    if (localStorage.getItem(KEY)) return;
    localStorage.setItem(KEY, String(Date.now()));
  } catch { return; }
  setTimeout(() => { InAppReview.requestReview().catch(() => { /* ignore */ }); }, 1500);
}
