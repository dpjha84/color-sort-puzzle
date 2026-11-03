import React, { useState } from 'react';
import { X, Trophy, ShoppingBag, Check } from 'lucide-react';
import { ACHIEVEMENTS, SHOP, ProgressState, ShopItem, playerLevel } from '../utils/progress';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  progress: ProgressState;
  onBuy: (item: ShopItem) => void;
}

export const RewardsModal: React.FC<Props> = ({ isOpen, onClose, progress, onBuy }) => {
  const [tab, setTab] = useState<'ach' | 'shop'>('ach');
  if (!isOpen) return null;
  const pl = playerLevel(progress.xp);
  const pct = Math.min(100, Math.round((pl.into / pl.need) * 100));
  const done = ACHIEVEMENTS.filter((a) => progress.unlocked[a.id]).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 select-none">
      <div className="relative w-full max-w-md max-h-[85vh] rounded-3xl bg-slate-900 border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-black text-lg">
                {pl.level}
              </div>
              <div>
                <div className="text-white font-extrabold text-sm">Rank {pl.level}</div>
                <div className="text-[10px] text-slate-400">{pl.into} / {pl.need} XP</div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 flex gap-2">
            <div className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300 text-sm font-bold">
              🪙 {progress.coins}
            </div>
            <div className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-sm font-bold">
              💎 {progress.gems}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {([['ach', `Achievements ${done}/${ACHIEVEMENTS.length}`, Trophy], ['shop', 'Shop', ShoppingBag]] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  tab === id ? 'bg-white/15 text-white' : 'bg-white/5 text-slate-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto p-3 space-y-2">
          {tab === 'ach' &&
            ACHIEVEMENTS.map((a) => {
              const got = !!progress.unlocked[a.id];
              const val = Math.min(a.progress(progress.stats), a.target);
              return (
                <div key={a.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${got ? 'bg-emerald-500/10 border-emerald-400/30' : 'bg-white/5 border-white/10'}`}>
                  <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-2xl ${got ? 'bg-emerald-500/20' : 'bg-white/10 grayscale opacity-70'}`}>{a.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-white text-sm font-bold">
                      {a.title}
                      {got && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="text-[11px] text-slate-400">{a.desc}</div>
                    {!got && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-amber-400" style={{ width: `${(val / a.target) * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400 tabular-nums">{val}/{a.target}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-[10px] font-bold leading-tight shrink-0">
                    <div className="text-amber-300">+{a.reward.coins} 🪙</div>
                    {a.reward.gems > 0 && <div className="text-cyan-300">+{a.reward.gems} 💎</div>}
                    <div className="text-slate-400">+{a.reward.xp} XP</div>
                  </div>
                </div>
              );
            })}

          {tab === 'shop' &&
            SHOP.map((s) => {
              const can = (s.coins ?? 0) <= progress.coins && (s.gems ?? 0) <= progress.gems;
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-white/10 flex items-center justify-center text-2xl">{s.icon}</div>
                  <div className="flex-1">
                    <div className="text-white text-sm font-bold">{s.title}</div>
                    <div className="text-[11px] text-slate-400">{s.desc}</div>
                  </div>
                  <button
                    onClick={() => onBuy(s.id)}
                    disabled={!can}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition-all active:scale-95 ${
                      can ? (s.gems ? 'bg-cyan-500 text-slate-950' : 'bg-amber-400 text-slate-950') : 'bg-white/10 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {s.gems ? `${s.gems} 💎` : `${s.coins} 🪙`}
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
