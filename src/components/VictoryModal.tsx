import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Star, Trophy, ArrowRight, RotateCcw, Sparkles, Film } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface VictoryModalProps {
  isOpen?: boolean;
  levelNumber: number;
  movesCount: number;
  timeSeconds: number;
  targetMoves: number;
  scoreEarned: number;
  starsEarned: number;
  onNextLevelWithAd: () => void;
  onReplay: () => void;
  onDoubleScoreWithAd: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen = true,
  levelNumber,
  movesCount,
  timeSeconds,
  targetMoves,
  scoreEarned,
  starsEarned,
  onNextLevelWithAd,
  onReplay,
  onDoubleScoreWithAd,
}) => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!isOpen) return;
    soundManager.playVictory();
    soundManager.triggerHaptic(50);

    // Trigger Confetti explosion
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#A855F7', '#EC4899'],
      });
    } catch {
      // Confetti fallback
    }

    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onNextLevelWithAd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onNextLevelWithAd]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Glow backdrop */}
        <div className="absolute -top-12 w-32 h-32 rounded-full bg-emerald-500/25 blur-3xl pointer-events-none" />

        {/* Level Complete Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 text-xs font-black uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Level {levelNumber} Cleared!</span>
        </div>

        {/* 3-Star Rating Display */}
        <div className="flex items-center justify-center gap-2 my-2">
          {[1, 2, 3].map((starIndex) => {
            const isEarned = starIndex <= starsEarned;
            return (
              <div
                key={starIndex}
                className={`transition-all duration-300 transform ${
                  isEarned
                    ? 'scale-110 text-amber-400 filter drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                    : 'text-slate-700 scale-95'
                }`}
              >
                <Star
                  className={`w-9 h-9 ${isEarned ? 'fill-amber-400' : 'fill-slate-800'}`}
                />
              </div>
            );
          })}
        </div>

        {/* Score Breakdown Cards */}
        <div className="w-full grid grid-cols-3 gap-2 my-4">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-2.5 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-medium">Moves</span>
            <span className="text-sm font-extrabold text-white font-mono mt-0.5">
              {movesCount}
            </span>
            <span className="text-[9px] text-emerald-400">Target ≤{targetMoves}</span>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-2.5 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-medium">Time</span>
            <span className="text-sm font-extrabold text-white font-mono mt-0.5">
              {timeSeconds}s
            </span>
            <span className="text-[9px] text-blue-400">Fast solve!</span>
          </div>

          <div className="rounded-2xl bg-amber-500/10 border border-amber-400/30 p-2.5 flex flex-col items-center">
            <span className="text-[10px] text-amber-400 font-medium">Points</span>
            <span className="text-sm font-black text-amber-300 font-mono mt-0.5">
              +{scoreEarned}
            </span>
            <span className="text-[9px] text-amber-300/80">Added</span>
          </div>
        </div>

        {/* Engagement Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          {/* Double Score with Ad */}
          <button
            onClick={() => {
              soundManager.playClick();
              onDoubleScoreWithAd();
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-between shadow-lg shadow-amber-900/30 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-slate-950" />
              <span>Claim 2X Score (+{scoreEarned * 2})</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] bg-slate-950/20 px-2 py-0.5 rounded-full font-bold">
              <Film className="w-3 h-3" />
              <span>Ad</span>
            </div>
          </button>

          {/* Primary: Continue to Next Level (Triggers Interstitial Ad as requested!) */}
          <button
            onClick={() => {
              soundManager.playClick();
              onNextLevelWithAd();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-98 transition-all"
          >
            <span>Next Level ({countdown}s)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Replay Level */}
          <button
            onClick={() => {
              soundManager.playClick();
              onReplay();
            }}
            className="w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-98 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Play Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
