import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { adMobManager } from './utils/admob';

adMobManager.init();

createRoot(document.getElementById('root')!).render(<App />);
