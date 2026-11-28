import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import { logEvent } from './analytics';

/** Play Console one-time product ID. Create it under Monetize > In-app products. */
export const REMOVE_ADS_ID = 'remove_ads';
const KEY = 'colorsort_ads_removed_v1';
const BONUS_KEY = 'colorsort_adfree_bonus_v1';

const native = () => Capacitor.isNativePlatform();
const listeners = new Set<() => void>();

let removed = (() => {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
})();

function setRemoved(v: boolean) {
  if (v === removed) return;
  removed = v;
  try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

/** True when this player has bought "Remove ads". Cached on the device so ads stay off while offline. */
export const adsRemoved = (): boolean => removed;

export function useAdsRemoved(): boolean {
  const [v, setV] = useState(removed);
  useEffect(() => {
    const l = () => setV(removed);
    listeners.add(l);
    l();
    return () => { listeners.delete(l); };
  }, []);
  return v;
}

/** Asks Google Play what this account owns. Restores the purchase on a new phone and drops it after a refund. */
export async function refreshEntitlement(): Promise<boolean> {
  if (!native()) return removed;
  try {
    const res = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP });
    const owned = res.purchases.some(
      (p) => p.productIdentifier === REMOVE_ADS_ID && (p.purchaseState === undefined || p.purchaseState === '1'),
    );
    setRemoved(owned); // only reached when Play answered, so an offline start keeps the cached value
  } catch {
    /* Play unavailable: keep the cached value */
  }
  return removed;
}

export async function getRemoveAdsPrice(): Promise<string | null> {
  if (!native()) return null;
  try {
    const { product } = await NativePurchases.getProduct({ productIdentifier: REMOVE_ADS_ID, productType: PURCHASE_TYPE.INAPP });
    return product.priceString || null;
  } catch {
    return null;
  }
}

export type BuyResult = 'ok' | 'cancelled' | 'error';

export async function buyRemoveAds(): Promise<BuyResult> {
  if (!native()) return 'error';
  logEvent('remove_ads_start');
  try {
    await NativePurchases.purchaseProduct({ productIdentifier: REMOVE_ADS_ID, productType: PURCHASE_TYPE.INAPP });
    setRemoved(true);
    logEvent('remove_ads_purchased');
    return 'ok';
  } catch (e) {
    const msg = String((e as { message?: string })?.message ?? e).toLowerCase();
    // Already owned: treat as success so the player is never charged twice or locked out
    if (msg.includes('already') && msg.includes('own')) {
      setRemoved(true);
      return 'ok';
    }
    if (msg.includes('cancel') || msg.includes('user')) {
      logEvent('remove_ads_cancelled');
      return 'cancelled';
    }
    logEvent('remove_ads_error');
    return 'error';
  }
}

/** The thank-you bonus is paid once per device, even if the purchase is restored again later. */
export function claimAdFreeBonus(): boolean {
  try {
    if (localStorage.getItem(BONUS_KEY) === '1') return false;
    localStorage.setItem(BONUS_KEY, '1');
    return true;
  } catch {
    return false;
  }
}
