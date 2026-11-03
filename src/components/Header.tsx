import React from 'react';
import { Capacitor } from '@capacitor/core';
import {
  Trophy,
  RotateCcw,
  Undo2,
  Lightbulb,
  PlusCircle,
  Volume2,
  VolumeX,
  Palette,
  LayoutGrid,
  Smartphone,
  Gift,
} from 'lucide-react';

const compact = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '')}K` : String(n));

interface HeaderProps {
  levelNumber: number;
  movesCount: number;
  targetMoves: number;
  hintsRemaining: number;
  undosRemaining: number;
  freeTubesRemaining: number;
  isMuted: boolean;
  canUndo: boolean;
  canAddTube: boolean;
  onUndo: () => void;
  onReset: () => void;
  onHint: () => void;
  onAddTube: () => void;
  onToggleSound: () => void;
  onOpenLeaderboard: () => void;
  onOpenSkins: () => void;
  onOpenLevelSelect: () => void;
  onOpenAndroidInstall: () => void;
  onOpenRewards: () => void;
  playerLevel: number;
  coins: number;
  gems: number;
  totalStars: number;
  xpPercent: number;
  onSecretTap?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  levelNumber,
  movesCount,
  targetMoves,
  hintsRemaining,
  undosRemaining,
  freeTubesRemaining,
  isMuted,
  canUndo,
  canAddTube,
  onUndo,
  onReset,
  onHint,
  onAddTube,
  onToggleSound,
  onOpenLeaderboard,
  onOpenSkins,
  onOpenLevelSelect,
  onOpenAndroidInstall,
  onOpenRewards,
  playerLevel,
  coins,
  gems,
  totalStars,
  xpPercent,
  onSecretTap,
}) => {
  return (
    <header className="w-full max-w-4xl mx-auto px-4 py-2 shrink-0 select-none">
      {/* Top Bar: Brand, Level Info, and Utility Icons */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
        {/* Left: Brand & Level Select */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLevelSelect}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold transition-all"
            title="Select Level"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
            <span>Lv. {levelNumber}</span>
          </button>
        </div>

        {/* Center: Moves Counter & Star Target */}
        <div className="flex flex-col items-center">
          <div className="text-white text-base font-bold tracking-wide flex items-center gap-1.5">
            <span>Moves:</span>
            <span className="font-mono tabular-nums text-amber-300">{movesCount}</span>
          </div>
          <div className="text-[11px] text-white/60 font-medium" onClick={onSecretTap}>
            Goal: ≤{targetMoves}
          </div>
        </div>

        {/* Right: Sound, Skins, Android & Leaderboard triggers */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          <button
            onClick={onOpenSkins}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all"
            title="Themes & Skins"
          >
            <Palette className="w-4 h-4 text-purple-400" />
          </button>

          {!Capacitor.isNativePlatform() && (
          <button
            onClick={onOpenAndroidInstall}
            className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 active:scale-95 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1"
            title="Android App & APK"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
          </button>
          )}

          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-300 text-xs font-bold border border-amber-500/30 transition-all"
            title="My Stats"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Stats</span>
          </button>
        </div>
      </div>

      {/* Wallet strip: always visible */}
      <button
        onClick={onOpenRewards}
        className="w-full mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[11px] font-bold text-white/90"
        aria-label="Open rewards"
      >
        <span className="flex items-center gap-1 text-amber-300">🪙 {compact(coins)}</span>
        <span className="flex items-center gap-1 text-cyan-300">💎 {compact(gems)}</span>
        <span className="flex items-center gap-1 text-yellow-300">⭐ {compact(totalStars)}</span>
        <span className="flex items-center gap-1.5 text-purple-300">
          Rank {playerLevel}
          <span className="inline-block w-12 h-1.5 rounded-full bg-white/15 overflow-hidden">
            <span className="block h-full bg-purple-400" style={{ width: `${xpPercent}%` }} />
          </span>
        </span>
      </button>

      {/* Action Controls Bar (Ergonomic Thumb-Reachable) */}
      <div className="flex items-start justify-between gap-1 sm:gap-6 sm:justify-center mt-2.5 w-full max-w-sm mx-auto">
        {/* Reset Button */}
        <button
          onClick={onReset}
          className="flex flex-col items-center gap-1 group active:scale-95 transition-transform flex-1 min-w-0"
        >
          <div className="w-11 h-11 rounded-2xl bg-white/10 group-hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/90 shadow-md">
            <RotateCcw className="w-5 h-5 text-slate-200" />
          </div>
          <span className="text-[10px] font-semibold text-white/70 max-w-full truncate">Reset</span>
        </button>

        {/* Undo Button */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex flex-col items-center gap-1 group transition-transform flex-1 min-w-0 ${
            canUndo ? 'active:scale-95 opacity-100' : 'opacity-40 cursor-not-allowed'
          }`}
        >
          <div className="relative w-11 h-11 rounded-2xl bg-white/10 group-hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/90 shadow-md">
            <Undo2 className="w-5 h-5 text-blue-300" />
            <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-blue-500 text-[9px] font-bold text-white flex items-center justify-center">
              {undosRemaining > 0 ? undosRemaining : 'AD'}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-white/70 max-w-full truncate">Undo</span>
        </button>

        {/* Add Tube Booster Button */}
        <button
          onClick={onAddTube}
          disabled={!canAddTube}
          className={`flex flex-col items-center gap-1 group transition-transform flex-1 min-w-0 ${
            canAddTube ? 'active:scale-95 opacity-100' : 'opacity-40 cursor-not-allowed'
          }`}
        >
          <div className="relative w-11 h-11 rounded-2xl bg-emerald-500/20 group-hover:bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-md">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center">
              +1
            </span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-300 max-w-full truncate">+ Tube</span>
        </button>

        {/* Smart Hint Button */}
        <button
          onClick={onHint}
          className="flex flex-col items-center gap-1 group active:scale-95 transition-transform flex-1 min-w-0"
        >
          <div className="relative w-11 h-11 rounded-2xl bg-amber-500/20 group-hover:bg-amber-500/30 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-md">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-[9px] font-bold text-white flex items-center justify-center">
              {hintsRemaining > 0 ? hintsRemaining : 'AD'}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-amber-300 max-w-full truncate">Hint</span>
        </button>

        {/* Rewards: coins, gems, achievements, XP */}
        <button
          onClick={onOpenRewards}
          className="flex flex-col items-center gap-1 group active:scale-95 transition-transform flex-1 min-w-0"
        >
          <div className="relative w-11 h-11 rounded-2xl bg-purple-500/20 group-hover:bg-purple-500/30 border border-purple-400/40 flex items-center justify-center shadow-md">
            <Gift className="w-5 h-5 text-purple-300" />
            <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-purple-500 text-[9px] font-bold text-white flex items-center justify-center">
              {playerLevel}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-purple-300 max-w-full truncate">Rewards</span>
        </button>
      </div>
    </header>
  );
};
