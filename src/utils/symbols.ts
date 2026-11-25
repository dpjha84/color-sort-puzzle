import { useEffect, useState } from 'react';
import { BallColor } from '../types/game';

const KEY = 'colorsort_symbols_v1';
const EVT = 'colorsort-symbols';

export const SYMBOLS: Partial<Record<BallColor, string>> = {
  red: '●', blue: '▲', emerald: '■', amber: '★', purple: '◆', cyan: '✚', pink: '♥', orange: '⬣',
};

export const getSymbolsOn = (): boolean => {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
};

export const setSymbolsOn = (on: boolean) => {
  try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVT));
};

export const useSymbolsOn = (): boolean => {
  const [on, setOn] = useState(getSymbolsOn);
  useEffect(() => {
    const h = () => setOn(getSymbolsOn());
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);
  return on;
};
