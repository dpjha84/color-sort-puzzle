import { Capacitor } from '@capacitor/core';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';

type Params = Record<string, string | number | boolean>;

// Firebase runs only inside the Android app. The web build (PWA / dev server) does nothing.
const native = () => Capacitor.isNativePlatform();

/** Fire-and-forget event. Never throws and never blocks gameplay. */
export function logEvent(name: string, params: Params = {}) {
  if (!native()) return;
  FirebaseAnalytics.logEvent({ name, params }).catch(() => {});
}

/** Called once the ad-consent flow has finished; turns analytics collection on or off to match. */
export function setAnalyticsEnabled(enabled: boolean) {
  if (!native()) return;
  FirebaseAnalytics.setEnabled({ enabled }).catch(() => {});
  FirebaseCrashlytics.setEnabled({ enabled }).catch(() => {});
}

/** Sends uncaught JavaScript errors to Crashlytics so web-layer crashes are not invisible. */
export function initCrashReporting() {
  if (!native()) return;
  const report = (message: string, stacktrace?: string) => {
    FirebaseCrashlytics.recordException({ message: message.slice(0, 300) }).catch(() => {});
    if (stacktrace) FirebaseCrashlytics.log({ message: stacktrace.slice(0, 1000) }).catch(() => {});
  };
  window.addEventListener('error', (e) => report(e.message || 'window error', e.error?.stack));
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason;
    report(r?.message ? String(r.message) : 'unhandled rejection', r?.stack);
  });
}
