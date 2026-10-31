/**
 * Native Google AdMob integration (Capacitor). Real ads only run inside the Android app;
 * in a normal browser no ads are shown and rewards are granted immediately (dev convenience).
 *
 * TESTING: builds use Google's official TEST ad units unless VITE_ADMOB_TESTING=false is set
 * at build time (the release workflow does this). Never tap your own live ads.
 */
import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPosition,
  BannerAdSize,
  RewardAdPluginEvents,
  InterstitialAdPluginEvents,
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

class AdMobManager {
  private ready = false;
  private initPromise: Promise<void> | null = null;
  private bannerShown = false;
  private interstitialBusy = false;
  private rewardedBusy = false;

  public isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  public init(): Promise<void> {
    if (!this.isNative()) return Promise.resolve();
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      try {
        // GDPR / UMP consent (needs a message set up in AdMob > Privacy & messaging)
        try {
          const info = await AdMob.requestConsentInfo();
          if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) {
            await AdMob.showConsentForm();
          }
        } catch (e) {
          console.warn('AdMob consent step skipped:', e);
        }
        await AdMob.initialize({ initializeForTesting: isTesting });
        this.ready = true;
      } catch (e) {
        console.warn('AdMob init failed:', e);
      }
    })();
    return this.initPromise;
  }

  public async showBanner(): Promise<void> {
    if (!this.isNative() || this.bannerShown) return;
    await this.init();
    if (!this.ready) return;
    try {
      await AdMob.showBanner({
        adId: IDS.banner,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting,
      });
      this.bannerShown = true;
    } catch (e) {
      console.warn('Banner failed:', e);
    }
  }

  /** Shows an interstitial, then always calls onDone (even if no ad is available). */
  public async showInterstitial(onDone: () => void): Promise<void> {
    if (!this.isNative()) return onDone();
    if (this.interstitialBusy) return; // ignore repeated taps while an ad is in progress
    this.interstitialBusy = true;
    await this.init();
    if (!this.ready) {
      this.interstitialBusy = false;
      return onDone();
    }
    let finished = false;
    const watchdog = setTimeout(() => done(), 45000);
    const done = () => {
      if (finished) return;
      finished = true;
      clearTimeout(watchdog);
      handles.forEach((h) => h.remove());
      this.interstitialBusy = false;
      onDone();
    };
    const handles: { remove: () => void }[] = [];
    try {
      handles.push(
        await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, done),
        await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, done),
        await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, done),
      );
      await AdMob.prepareInterstitial({ adId: IDS.interstitial, isTesting });
      await AdMob.showInterstitial();
    } catch (e) {
      console.warn('Interstitial failed:', e);
      done();
    }
  }

  /**
   * Shows a rewarded ad. onReward fires only if the user earned the reward.
   * onUnavailable fires if no ad could be loaded/shown.
   */
  public async showRewarded(onReward: () => void, onUnavailable: () => void): Promise<void> {
    if (!this.isNative()) return onReward();
    if (this.rewardedBusy) return;
    this.rewardedBusy = true;
    await this.init();
    if (!this.ready) {
      this.rewardedBusy = false;
      return onUnavailable();
    }
    let rewarded = false;
    let settled = false;
    const handles: { remove: () => void }[] = [];
    const cleanup = () => {
      handles.forEach((h) => h.remove());
      this.rewardedBusy = false;
    };
    const fail = () => {
      if (settled) return;
      settled = true;
      cleanup();
      onUnavailable();
    };
    try {
      handles.push(
        await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
          rewarded = true;
        }),
        await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
          if (settled) return;
          settled = true;
          cleanup();
          if (rewarded) onReward();
        }),
        await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, fail),
        await AdMob.addListener(RewardAdPluginEvents.FailedToShow, fail),
      );
      await AdMob.prepareRewardVideoAd({ adId: IDS.rewarded, isTesting });
      await AdMob.showRewardVideoAd();
    } catch (e) {
      console.warn('Rewarded failed:', e);
      fail();
    }
  }
}

export const adMobManager = new AdMobManager();
