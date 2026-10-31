import React, { useEffect } from 'react';
import { adMobManager, BANNER_HEIGHT_PX } from '../utils/admob';

/** Native AdMob banner overlays the bottom of the screen; this reserves space so it doesn't cover the game. */
export const BannerAd: React.FC = () => {
  useEffect(() => {
    adMobManager.showBanner();
  }, []);

  if (!adMobManager.isNative()) return null;
  return <div className="w-full shrink-0" style={{ height: BANNER_HEIGHT_PX }} aria-hidden />;
};
