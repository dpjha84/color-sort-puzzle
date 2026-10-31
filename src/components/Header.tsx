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
} from 'lucide-react';

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
}) => {
  return (
    <header className="w-full max-w-4xl mx-auto px-4 py-2 shrink-0 select-none">
      {/* Top Bar: Brand, Level Info, and Utility Icons */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
        {/* Left: Brand & Level Select */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLevelSelect}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold backdrop-blur-sm transition-all"
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
          <div className="text-[11px] text-white/60 font-medium">
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
            title="Global Leaderboard"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Ranks</span>
          </button>
        </div>
      </div>

      {/* Action Controls Bar (Ergonomic Thumb-Reachable) */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 mt-2.5">
        {/* Reset Button */}
        <button
          onClick={onReset}
          className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
        >
          <div className="w-11 h-11 rounded-2xl bg-white/10 group-hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/90 shadow-md backdrop-blur-sm">
            <RotateCcw className="w-5 h-5 text-slate-200" />
          </div>
          <span className="text-[10px] font-semibold text-white/70">Reset</span>
        </button>

        {/* Undo Button */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex flex-col items-center gap-1 group transition-transform ${
            canUndo ? 'active:scale-95 opacity-100' : 'opacity-40 cursor-not-allowed'
          }`}
        >
          <div className="relative w-11 h-11 rounded-2xl bg-white/10 group-hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/90 shadow-md backdrop-blur-sm">
            <Undo2 className="w-5 h-5 text-blue-300" />
            {undosRemaining > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-[10px] font-bold text-white flex items-center justify-center">
                {undosRemaining}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold text-white/70">Undo</span>
        </button>

        {/* Add Tube Booster Button */}
        <button
          onClick={onAddTube}
          disabled={!canAddTube}
          className={`flex flex-col items-center gap-1 group transition-transform ${
            canAddTube ? 'active:scale-95 opacity-100' : 'opacity-40 cursor-not-allowed'
          }`}
        >
          <div className="relative w-11 h-11 rounded-2xl bg-emerald-500/20 group-hover:bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-md backdrop-blur-sm">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center">
              +1
            </span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-300">+ Tube</span>
        </button>

        {/* Smart Hint Button */}
        <button
          onClick={onHint}
          className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
        >
          <div className="relative w-11 h-11 rounded-2xl bg-amber-500/20 group-hover:bg-amber-500/30 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-md backdrop-blur-sm">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center">
              {hintsRemaining}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-amber-300">Hint</span>
        </button>
      </div>
    </header>
  );
};
