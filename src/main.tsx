import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { adMobManager } from './utils/admob';

// Initialize AdMob / Google H5 Games Ads if configured via env
adMobManager.init();

createRoot(document.getElementById('root')!).render(<App />);
