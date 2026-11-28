import React, { useEffect } from 'react';
import { adMobManager, BANNER_HEIGHT_PX } from '../utils/admob';
import { useAdsRemoved } from '../utils/purchases';

/** Native AdMob banner overlays the bottom of the screen; this reserves space so it doesn't cover the game. */
export const BannerAd: React.FC = () => {
  const removed = useAdsRemoved();
  useEffect(() => {
    if (removed) adMobManager.hideBanner();
    else adMobManager.showBanner();
  }, [removed]);

  if (!adMobManager.isNative() || removed) return null;
  return <div className="w-full shrink-0" style={{ height: BANNER_HEIGHT_PX }} aria-hidden />;
};
