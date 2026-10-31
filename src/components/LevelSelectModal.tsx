import React from 'react';
import { X, Lock, Star, Play } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface LevelSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  highestUnlockedLevel: number;
  onSelectLevel: (lvl: number) => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  isOpen,
  onClose,
  currentLevel,
  highestUnlockedLevel,
  onSelectLevel,
}) => {
  if (!isOpen) return null;

  const totalLevels = 50;
  const levels = Array.from({ length: totalLevels }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg h-[85vh] max-h-[600px] rounded-3xl bg-slate-900 border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
          <div>
            <h2 className="text-white font-extrabold text-base">Select Level</h2>
            <p className="text-[11px] text-slate-400">
              Unlocked: {highestUnlockedLevel} / {totalLevels} Levels
            </p>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Levels Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 sm:grid-cols-5 gap-3">
          {levels.map((lvl) => {
            const isUnlocked = lvl <= highestUnlockedLevel;
            const isCurrent = lvl === currentLevel;
            const isPast = lvl < highestUnlockedLevel;
            // Simulated stars for past levels: 3 stars for lower levels, 2 for some
            const stars = isPast ? (lvl % 4 === 0 ? 2 : 3) : 0;

            return (
              <button
                key={lvl}
                disabled={!isUnlocked}
                onClick={() => {
                  soundManager.playClick();
                  onSelectLevel(lvl);
                  onClose();
                }}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center border transition-all ${
                  isCurrent
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30 scale-105 ring-2 ring-amber-300'
                    : isUnlocked
                    ? 'bg-white/10 hover:bg-white/20 text-white border-white/15 active:scale-95'
                    : 'bg-black/20 text-white/20 border-white/5 cursor-not-allowed'
                }`}
              >
                {isUnlocked ? (
                  <>
                    <span className="font-extrabold text-sm sm:text-base font-mono">
                      {lvl}
                    </span>

                    {/* Star display */}
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-2.5 h-2.5 ${
                            s <= stars
                              ? isCurrent
                                ? 'fill-slate-950 text-slate-950'
                                : 'fill-amber-400 text-amber-400'
                              : 'fill-transparent text-white/30'
                          }`}
                        />
                      ))}
                    </div>

                    {isCurrent && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center">
                        <Play className="w-2.5 h-2.5 fill-current" />
                      </div>
                    )}
                  </>
                ) : (
                  <Lock className="w-4 h-4 text-white/30" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
