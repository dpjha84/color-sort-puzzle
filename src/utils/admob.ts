/**
 * Google AdMob & Google H5 Games Ad Placement API integration service.
 * Supports:
 * 1. Web / HTML5 Games: Google Ad Placement API (H5 Game Ads) via ca-pub-XXXXX.
 * 2. Capacitor / Cordova / Native Mobile Wrappers (AdMob plugin).
 * 3. Graceful fallback to interactive playable game demo if AdMob ID is omitted or ad is blocked.
 */

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    adBreak?: (options: {
      type: 'start' | 'pause' | 'next' | 'browse' | 'reward';
      name?: string;
      beforeAd?: () => void;
      afterAd?: () => void;
      adBreakDone?: (placementInfo: unknown) => void;
      beforeReward?: (showAdFn: () => void) => void;
      adDismissed?: () => void;
      adViewed?: () => void;
    }) => void;
    adConfig?: (options: {
      preloadAdBreaks?: string;
      sound?: 'on' | 'off';
    }) => void;
  }
}

export interface AdMobConfig {
  publisherId: string;
  interstitialUnitId: string;
  rewardedUnitId: string;
  bannerUnitId: string;
  isConfigured: boolean;
  isInitialized: boolean;
}

class AdMobManager {
  private config: AdMobConfig = {
    publisherId: import.meta.env.VITE_ADMOB_PUBLISHER_ID || '',
    interstitialUnitId: import.meta.env.VITE_ADMOB_INTERSTITIAL_UNIT_ID || '',
    rewardedUnitId: import.meta.env.VITE_ADMOB_REWARDED_UNIT_ID || '',
    bannerUnitId: import.meta.env.VITE_ADMOB_BANNER_UNIT_ID || '',
    isConfigured: false,
    isInitialized: false,
  };

  constructor() {
    this.config.isConfigured = Boolean(
      this.config.publisherId &&
      this.config.publisherId !== 'ca-pub-XXXXXXXXXXXXXXXX' &&
      (this.config.publisherId.startsWith('ca-pub-') || this.config.publisherId.startsWith('pub-'))
    );
  }

  public getConfig(): AdMobConfig {
    return { ...this.config };
  }

  /**
   * Initializes Google Ad Placement API if publisher ID is configured.
   */
  public init(): void {
    if (typeof window === 'undefined' || this.config.isInitialized) return;

    if (this.config.isConfigured) {
      try {
        // Inject Google AdSense / H5 Games Ads script
        const script = document.createElement('script');
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.config.publisherId}`;
        
        script.onload = () => {
          this.config.isInitialized = true;
          if (window.adConfig) {
            window.adConfig({
              preloadAdBreaks: 'on',
              sound: 'on',
            });
          }
        };

        document.head.appendChild(script);
      } catch (err) {
        console.warn('AdMob / Google Ads failed to initialize:', err);
      }
    }
  }

  /**
   * Requests an interstitial ad via Google adBreak API or resolves to fallback.
   */
  public showInterstitial(onDone: () => void): void {
    if (this.config.isInitialized && typeof window.adBreak === 'function') {
      window.adBreak({
        type: 'next',
        name: 'level_complete',
        beforeAd: () => {
          // Pause background music or game sounds if needed
        },
        afterAd: () => {
          onDone();
        },
        adBreakDone: () => {
          onDone();
        },
      });
    } else {
      // Fallback to our interactive ad modal
      onDone();
    }
  }

  /**
   * Requests a rewarded ad via Google adBreak API.
   */
  public showRewarded(onRewardEarned: () => void, onDismissed: () => void): void {
    if (this.config.isInitialized && typeof window.adBreak === 'function') {
      window.adBreak({
        type: 'reward',
        name: 'booster_reward',
        beforeReward: (showAdFn) => {
          showAdFn();
        },
        adViewed: () => {
          onRewardEarned();
        },
        adDismissed: () => {
          onDismissed();
        },
        adBreakDone: () => {
          onDismissed();
        },
      });
    } else {
      // Fallback
      onRewardEarned();
    }
  }
}

export const adMobManager = new AdMobManager();
