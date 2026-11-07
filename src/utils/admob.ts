/**
 * Native Google AdMob integration (Capacitor). Real ads only run inside the Android app;
 * in a normal browser no ads are shown and rewards are granted immediately (dev convenience).
 *
 * Design rules (v1.0.2):
 *  - Ads are PRELOADED in the background. Tapping a button never waits on the network:
 *    if an ad is ready it shows instantly, otherwise the game simply continues.
 *  - Interstitials are shown only from an explicit tap (Next Level). Nothing auto-shows.
 *  - TESTING: builds use Google's official TEST ad units unless VITE_ADMOB_TESTING=false is set
 *    at build time (the release workflow does this). Never tap your own live ads.
 */
import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
} from '@capacitor-community/admob';

const LIVE = {
  banner: 'ca-app-pub-9351754143985661/5311798669',
  interstitial: 'ca-app-pub-9351754143985661/2452207741',
  rewarded: 'ca-app-pub-9351754143985661/3737369259',
};

// Google's official sample ad units (always safe to click).
const TEST = {
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
};

const isTesting = import.meta.env.VITE_ADMOB_TESTING !== 'false';
const IDS = isTesting ? TEST : LIVE;

export const BANNER_HEIGHT_PX = 50;
const RETRY_MS = 45_000;
const LOG_MAX = 80;

type Listener = () => void;

const INTERSTITIAL_COOLDOWN_MS = 3 * 60 * 1000;

class AdMobManager {
  private initPromise: Promise<void> | null = null;
  private ready = false;

  private bannerShown = false;
  private bannerRetry: ReturnType<typeof setTimeout> | null = null;

  private interstitialLoaded = false;
  private interstitialLoading = false;
  private interstitialBusy = false;
  // Interstitials are time-based: at most one per cooldown. Counts from app start, so a new
  // session never opens with an ad, and a rewarded ad also resets it.
  private lastAdShownAt = Date.now();

  private interstitialRetry: ReturnType<typeof setTimeout> | null = null;

  private rewardedLoaded = false;
  private rewardedLoading = false;
  private rewardedBusy = false;
  private rewardedRetry: ReturnType<typeof setTimeout> | null = null;

  // Diagnostics (viewable from the hidden debug panel)
  private logLines: string[] = [];
  private logListeners = new Set<Listener>();

  public isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  // ---------- diagnostics ----------
  private log(msg: string) {
    const t = new Date();
    const stamp = `${t.getMinutes().toString().padStart(2, '0')}:${t.getSeconds().toString().padStart(2, '0')}.${t
      .getMilliseconds()
      .toString()
      .padStart(3, '0')}`;
    this.logLines.push(`${stamp} ${msg}`);
    if (this.logLines.length > LOG_MAX) this.logLines.shift();
    this.logListeners.forEach((l) => l());
  }
  public getLog(): string[] {
    return [...this.logLines];
  }
  public subscribeLog(l: Listener): () => void {
    this.logListeners.add(l);
    return () => this.logListeners.delete(l);
  }

  private online(): boolean {
    return typeof navigator === 'undefined' || navigator.onLine !== false;
  }

  // ---------- init ----------
  public init(): Promise<void> {
    if (!this.isNative()) return Promise.resolve();
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      try {
        // Event log (permanent, observe-only)
        const evs: string[] = [
          ...Object.values(InterstitialAdPluginEvents),
          ...Object.values(RewardAdPluginEvents),
          BannerAdPluginEvents.Loaded,
          BannerAdPluginEvents.FailedToLoad,
          BannerAdPluginEvents.Opened,
          BannerAdPluginEvents.Closed,
        ];
        for (const ev of evs) {
          try {
            await AdMob.addListener(ev as any, () => this.log(`event ${ev}`));
          } catch {
            /* ignore */
          }
        }
        // If a banner fails to load the plugin destroys it; allow a later retry.
        await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => {
          this.bannerShown = false;
          if (this.bannerRetry) clearTimeout(this.bannerRetry);
          this.bannerRetry = setTimeout(() => this.showBanner(), RETRY_MS);
        });
        // GDPR / UMP consent (needs a message set up in AdMob > Privacy & messaging)
        try {
          const info = await AdMob.requestConsentInfo();
          if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) {
            await AdMob.showConsentForm();
          }
        } catch (e) {
          this.log(`consent skipped: ${String(e).slice(0, 80)}`);
        }
        await AdMob.initialize({ initializeForTesting: isTesting });
        this.ready = true;
        this.log(`init ok (testing=${isTesting})`);
        this.preloadInterstitial();
        this.preloadRewarded();
        window.addEventListener('online', () => {
          this.log('network online');
          this.showBanner();
          this.preloadInterstitial();
          this.preloadRewarded();
        });
      } catch (e) {
        this.log(`init failed: ${String(e).slice(0, 80)}`);
      }
    })();
    return this.initPromise;
  }

  // ---------- banner ----------
  public async showBanner(): Promise<void> {
    if (!this.isNative() || this.bannerShown) return;
    await this.init();
    if (!this.ready || !this.online()) return;
    try {
      this.bannerShown = true;
      await AdMob.showBanner({
        adId: IDS.banner,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting,
      });
      this.log('banner requested');
    } catch (e) {
      this.bannerShown = false;
      this.log(`banner failed: ${String(e).slice(0, 80)}`);
    }
  }

  // ---------- interstitial ----------
  public preloadInterstitial(): void {
    if (!this.isNative() || !this.ready || this.interstitialLoaded || this.interstitialLoading) return;
    if (!this.online()) return;
    this.interstitialLoading = true;
    AdMob.prepareInterstitial({ adId: IDS.interstitial, isTesting })
      .then(() => {
        this.interstitialLoaded = true;
        this.log('interstitial preloaded');
      })
      .catch((e) => {
        this.log(`interstitial preload failed: ${String(e).slice(0, 60)}`);
        if (this.interstitialRetry) clearTimeout(this.interstitialRetry);
        this.interstitialRetry = setTimeout(() => this.preloadInterstitial(), RETRY_MS);
      })
      .finally(() => {
        this.interstitialLoading = false;
      });
  }

  /**
   * Call ONLY from an explicit user tap. Shows the preloaded interstitial if there is one,
   * otherwise continues immediately. onDone is always called exactly once.
   */
  public async showInterstitial(onDone: () => void): Promise<void> {
    this.log('showInterstitial requested (tap)');
    if (!this.isNative()) return onDone();
    if (this.interstitialBusy) return; // ignore repeated taps while an ad is in progress
    const since = Date.now() - this.lastAdShownAt;
    if (since < INTERSTITIAL_COOLDOWN_MS) {
      this.log(`interstitial skipped: cooldown (${Math.round(since / 1000)}s of ${INTERSTITIAL_COOLDOWN_MS / 1000}s)`);
      return onDone();
    }
    if (!this.interstitialLoaded) {
      this.log('interstitial not ready -> skip');
      this.preloadInterstitial();
      return onDone();
    }
    this.interstitialBusy = true;
    this.interstitialLoaded = false;
    this.lastAdShownAt = Date.now();
    let finished = false;
    const handles: { remove: () => void }[] = [];
    const watchdog = setTimeout(() => done(), 60_000);
    const done = () => {
      if (finished) return;
      finished = true;
      clearTimeout(watchdog);
      handles.forEach((h) => h.remove());
      this.interstitialBusy = false;
      this.preloadInterstitial(); // get the next one ready
      onDone();
    };
    try {
      handles.push(
        await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, done),
        await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, done),
      );
      await AdMob.showInterstitial();
    } catch (e) {
      this.log(`interstitial show failed: ${String(e).slice(0, 60)}`);
      done();
    }
  }

  // ---------- rewarded ----------
  public preloadRewarded(): void {
    if (!this.isNative() || !this.ready || this.rewardedLoaded || this.rewardedLoading) return;
    if (!this.online()) return;
    this.rewardedLoading = true;
    AdMob.prepareRewardVideoAd({ adId: IDS.rewarded, isTesting })
      .then(() => {
        this.rewardedLoaded = true;
        this.log('rewarded preloaded');
      })
      .catch((e) => {
        this.log(`rewarded preload failed: ${String(e).slice(0, 60)}`);
        if (this.rewardedRetry) clearTimeout(this.rewardedRetry);
        this.rewardedRetry = setTimeout(() => this.preloadRewarded(), RETRY_MS);
      })
      .finally(() => {
        this.rewardedLoading = false;
      });
  }

  public isRewardedReady(): boolean {
    return !this.isNative() || this.rewardedLoaded;
  }

  /**
   * Shows a rewarded ad. onReward fires only if the user earned the reward.
   * onUnavailable fires immediately if no ad is ready (never blocks on the network).
   */
  public async showRewarded(onReward: () => void, onUnavailable: () => void): Promise<void> {
    this.log('showRewarded requested (tap)');
    if (!this.isNative()) return onReward();
    if (this.rewardedBusy) return;
    if (!this.rewardedLoaded) {
      this.log('rewarded not ready');
      this.preloadRewarded();
      return onUnavailable();
    }
    this.rewardedBusy = true;
    this.rewardedLoaded = false;
    this.lastAdShownAt = Date.now(); // a rewarded ad counts toward the interstitial cooldown
    let rewarded = false;
    let settled = false;
    const handles: { remove: () => void }[] = [];
    const watchdog = setTimeout(() => finish(false), 120_000);
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      handles.forEach((h) => h.remove());
      this.rewardedBusy = false;
      this.preloadRewarded();
      if (ok) onReward();
      else if (!rewarded) onUnavailable();
    };
    try {
      handles.push(
        await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
          rewarded = true;
        }),
        await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => finish(rewarded)),
        await AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => finish(false)),
      );
      await AdMob.showRewardVideoAd();
    } catch (e) {
      this.log(`rewarded show failed: ${String(e).slice(0, 60)}`);
      finish(false);
    }
  }
}

export const adMobManager = new AdMobManager();
