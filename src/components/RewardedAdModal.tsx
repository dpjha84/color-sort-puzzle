import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Gift } from 'lucide-react';
import { soundManager } from '../utils/audio';

export type RewardType = 'hints' | 'tubes' | 'undos';

interface RewardedAdModalProps {
  isOpen: boolean;
  rewardType: RewardType;
  onClose: () => void;
  onRewardGranted: (type: RewardType) => void;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  isOpen,
  rewardType,
  onClose,
  onRewardGranted,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(5);
      setIsCompleted(false);
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCompleted(true);
          soundManager.playVictory();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const rewardLabel =
    rewardType === 'hints'
      ? '+3 Free Hints'
      : rewardType === 'tubes'
      ? '+1 Extra Tube'
      : '+5 Move Undos';

  const handleClaim = () => {
    soundManager.playClick();
    onRewardGranted(rewardType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-amber-500/30 p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Close Button (if completed or user wants to forfeit) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Video Ad Mock Canvas */}
        <div className="w-full flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-extrabold uppercase tracking-wider mb-2">
            <Gift className="w-4 h-4" />
            <span>Rewarded Booster Ad</span>
          </div>

          <div className="relative w-full aspect-16/9 rounded-2xl bg-gradient-to-tr from-cyan-950 via-slate-900 to-indigo-950 border border-white/20 p-4 flex flex-col items-center justify-center shadow-inner overflow-hidden">
            {isCompleted ? (
              <div className="flex flex-col items-center animate-bounce">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1">
                  <Check className="w-7 h-7" />
                </div>
                <span className="text-emerald-400 font-black text-sm">REWARD READY!</span>
              </div>
            ) : (
              <>
                <span className="text-4xl animate-pulse">🚀⭐🎮</span>
                <span className="text-white font-extrabold text-xs mt-2">
                  Galaxy Blast - Match 3 Planets
                </span>
                <span className="text-amber-300 text-[11px] font-mono mt-1">
                  Unlocking reward in {secondsLeft}s...
                </span>
              </>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all duration-1000"
              style={{ width: `${((5 - secondsLeft) / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Reward Status & Button */}
        <div className="w-full mt-5">
          <div className="text-xs text-slate-300 font-medium mb-3">
            Reward for watching: <strong className="text-amber-300">{rewardLabel}</strong>
          </div>

          <button
            onClick={handleClaim}
            disabled={!isCompleted}
            className={`w-full py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
              isCompleted
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 active:scale-98 shadow-amber-500/25'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isCompleted ? `Claim ${rewardLabel}` : `Please wait ${secondsLeft}s`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
