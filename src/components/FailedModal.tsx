import React from 'react';
import { RotateCcw, PlusCircle, Undo2, Film, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface FailedModalProps {
  isOpen: boolean;
  levelNumber: number;
  onRetry: () => void;
  watchRewardedAd: (onReward: () => void) => void;
  onWatchAdForTube: () => void;
  onWatchAdForUndo: () => void;
}

export const FailedModal: React.FC<FailedModalProps> = ({
  isOpen,
  levelNumber,
  onRetry,
  watchRewardedAd,
  onWatchAdForTube,
  onWatchAdForUndo,
}) => {
  if (!isOpen) return null;

  const startAd = (action: 'tube' | 'undo') => {
    soundManager.playClick();
    watchRewardedAd(() => {
      soundManager.playVictory();
      if (action === 'tube') onWatchAdForTube();
      else onWatchAdForUndo();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-red-500/30 p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Glow backdrop */}
        <div className="absolute -top-12 w-28 h-28 rounded-full bg-red-500/20 blur-2xl pointer-events-none" />

        {(
          <>
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-3xl bg-red-500/20 border border-red-400/40 flex items-center justify-center text-3xl shadow-lg mb-3">
              🧪💔
            </div>

            <h3 className="text-xl font-extrabold text-white">No Valid Moves Left!</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-[260px]">
              You reached a deadlock on Level {levelNumber}. Don't worry! Pick a revive option below:
            </p>

            {/* In-Game Ad Sponsor Banner */}
            <div className="w-full my-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-left">
                <span className="text-xl">📺</span>
                <div>
                  <div className="text-[11px] font-bold text-white flex items-center gap-1">
                    <span>Watch a short ad to revive</span>
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  </div>
                  <div className="text-[10px] text-slate-400">Keep your current progress</div>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-black">
                FREE
              </span>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-2.5 mt-1">
              {/* Option 1: Watch Ad for Extra Tube */}
              <button
                onClick={() => startAd('tube')}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-emerald-900/30 active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-emerald-200" />
                  <span>Watch Ad: Add +1 Tube</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] bg-black/25 px-2 py-0.5 rounded-full">
                  <Film className="w-3 h-3" />
                  <span>Ad</span>
                </div>
              </button>

              {/* Option 2: Watch Ad for Undo 5 Moves */}
              <button
                onClick={() => startAd('undo')}
                className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-blue-900/30 active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Undo2 className="w-4 h-4 text-blue-200" />
                  <span>Watch Ad: Rewind 5 Moves</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] bg-black/25 px-2 py-0.5 rounded-full">
                  <Film className="w-3 h-3" />
                  <span>Ad</span>
                </div>
              </button>

              {/* Option 3: Clean Retry Button */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  onRetry();
                }}
                className="w-full py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/15 active:scale-98 transition-all"
              >
                <RotateCcw className="w-4 h-4 text-slate-300" />
                <span>Retry Level {levelNumber}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
