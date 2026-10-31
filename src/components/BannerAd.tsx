import React, { useState } from 'react';
import { X, Sparkles, ExternalLink } from 'lucide-react';
import { soundManager } from '../utils/audio';

export const BannerAd: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="w-full max-w-lg mx-auto px-2 pb-1 shrink-0 select-none">
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-2 flex items-center justify-between shadow-lg">
        {/* Ad Indicator Tag */}
        <span className="absolute -top-2 left-3 bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded shadow">
          Ad
        </span>

        {/* Ad Content */}
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-lg shadow-sm shrink-0">
            👑
          </div>
          <div className="min-w-0 text-left">
            <div className="text-white font-bold text-xs truncate flex items-center gap-1">
              <span>Royal Puzzle Blast 3D</span>
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Match 3 gems, build castles! Free on iOS & Android
            </div>
          </div>
        </div>

        {/* Action Button & Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              soundManager.playClick();
              alert('Redirecting to Game download page simulation!');
            }}
            className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] shadow active:scale-95 transition-transform flex items-center gap-1"
          >
            <span>Play</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setIsVisible(false);
            }}
            className="p-1 rounded-full text-slate-400 hover:text-white"
            title="Dismiss Ad"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
