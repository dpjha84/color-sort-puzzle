import React, { useEffect, useState } from 'react';
import { Trophy, Flame, RotateCcw, Home as HomeIcon, Star } from 'lucide-react';
import { DailyResult } from '../utils/progress';

interface DailyVictoryModalProps {
  isOpen: boolean;
  date: string;
  difficulty: string;
  movesCount: number;
  timeSeconds: number;
  targetMoves: number;
  starsEarned: number;
  result: DailyResult | null;
  counted: boolean; // false = the puzzle's day has passed, so this run is practice only
  hasLeaderboard: boolean;
  onLeaderboard: () => void;
  onPlayAgain: () => void;
  onHome: () => void;
}

const fmt = (n: number) => n.toLocaleString('en-US');

export const DailyVictoryModal: React.FC<DailyVictoryModalProps> = ({
  isOpen, date, difficulty, movesCount, timeSeconds, targetMoves, starsEarned, result, counted, hasLeaderboard, onLeaderboard, onPlayAgain, onHome,
}) => {
  // a late tap from the final move must not hit a button
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    setArmed(false);
    if (!isOpen) return;
    const t = setTimeout(() => setArmed(true), 700);
    return () => clearTimeout(t);
  }, [isOpen]);

  if (!isOpen || !result) return null;
  const btn = 'w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-bold text-sm active:scale-[0.97] transition-transform disabled:opacity-50';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm p-4 flex">
      <div className="relative my-auto mx-auto w-full max-w-sm rounded-3xl bg-slate-900 border border-amber-400/40 p-6 shadow-2xl flex flex-col items-center text-center animate-card-pop">
        <div className="text-[11px] font-bold tracking-widest text-amber-300 uppercase">Daily Challenge · {difficulty}</div>
        <div className="text-xs text-white/50 mb-3">{date}</div>
        <Trophy className="w-12 h-12 text-amber-400 mb-1" />
        <h2 className="text-2xl font-extrabold">{counted ? 'Challenge cleared!' : 'Practice cleared'}</h2>

        <div className="flex gap-1 my-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className={i < starsEarned ? 'text-amber-400' : 'text-slate-700'} style={i < starsEarned ? { animation: `star-pop 520ms ${300 + i * 220}ms cubic-bezier(.3,1.4,.5,1) both` } : undefined}>
              <Star className="w-9 h-9" fill="currentColor" />
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 w-full py-3 mb-3">
          <div className="text-[11px] text-white/60">{counted ? 'Daily points' : 'Points (not counted)'}</div>
          <div className="text-4xl font-extrabold text-amber-300 tabular-nums">{fmt(result.points)}</div>
          {counted && result.improved && <div className="text-xs font-bold text-emerald-300 mt-0.5">New best today!</div>}
          {counted && !result.first && !result.improved && <div className="text-xs text-white/60 mt-0.5">Best today: {fmt(result.bestToday)}</div>}
          <div className="text-[11px] text-white/50 mt-1">{movesCount} moves (goal ≤{targetMoves}) · {timeSeconds}s</div>
        </div>

        {counted && result.first && (
          <div className="w-full mb-3">
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-bold">
              <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300">+{result.coins} 🪙</span>
              {result.gems > 0 && <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300">+{result.gems} 💎</span>}
              <span className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-300">+{result.xp} XP</span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1.5 text-sm font-bold text-orange-300">
              <Flame className="w-4 h-4" /> {result.streak}-day streak
            </div>
            <div className="text-[11px] text-white/50 mt-0.5">Come back tomorrow to keep it going</div>
          </div>
        )}
        {!counted && <div className="text-xs text-white/60 mb-3">A new daily puzzle is out. This run earns no reward.</div>}

        <div className="w-full flex flex-col gap-2">
          {counted && hasLeaderboard && (
            <button disabled={!armed} onClick={onLeaderboard} className={`${btn} bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950`}>
              <Trophy className="w-4 h-4" /> Daily leaderboard
            </button>
          )}
          <button disabled={!armed} onClick={onPlayAgain} className={`${btn} bg-white/10 border border-white/15 text-white`}>
            <RotateCcw className="w-4 h-4" /> Play again{counted ? ' to beat your score' : ''}
          </button>
          <button disabled={!armed} onClick={onHome} className={`${btn} bg-amber-500 text-slate-950`}>
            <HomeIcon className="w-4 h-4" /> Home
          </button>
        </div>
      </div>
    </div>
  );
};
