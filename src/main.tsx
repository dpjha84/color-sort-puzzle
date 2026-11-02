import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { adMobManager } from './utils/admob';

// The Android app serves its files locally; a service worker only causes stale code / reload glitches.
if (adMobManager.isNative() && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
  if ('caches' in window) caches.keys().then((ks) => ks.forEach((k) => caches.delete(k))).catch(() => {});
}

adMobManager.init();

createRoot(document.getElementById('root')!).render(<App />);
