import React, { useState } from 'react';
import { X, Trophy, Star, User, Edit3, Check, Globe } from 'lucide-react';
import { PlayerProfile } from '../types/game';
import { playerLevel, ProgressState } from '../utils/progress';
import { showLeaderboard } from '../utils/playGames';
import {
  AVATAR_OPTIONS,
  COUNTRY_OPTIONS,
  savePlayerProfile,
} from '../utils/leaderboard';
import { soundManager } from '../utils/audio';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerProfile: PlayerProfile;
  progress: ProgressState;
  onProfileUpdated: (updated: PlayerProfile) => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  playerProfile,
  progress,
  onProfileUpdated,
}) => {
  const [globalMsg, setGlobalMsg] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(playerProfile.name);
  const [editAvatar, setEditAvatar] = useState(playerProfile.avatar);
  const [editCountry, setEditCountry] = useState(playerProfile.country);

  if (!isOpen) return null;

  const pl = playerLevel(progress.xp);
  const unlockedCount = Object.keys(progress.unlocked).length;

  const handleSaveProfile = () => {
    soundManager.playClick();
    const updated: PlayerProfile = {
      ...playerProfile,
      name: editName.trim() || 'Puzzle Master',
      avatar: editAvatar,
      country: editCountry,
    };
    savePlayerProfile(updated);
    onProfileUpdated(updated);
    setIsEditingProfile(false);
  };

  const openGlobal = async () => {
    soundManager.playClick();
    const ok = await showLeaderboard();
    setGlobalMsg(ok ? null : 'Could not open Google Play Games. Check your connection and sign-in, then try again.');
  };

  const stats: [string, string | number][] = [
    ['Current level', playerProfile.currentLevel],
    ['Levels cleared', progress.stats.levelsWon],
    ['Total stars', playerProfile.totalStars],
    ['Total points', playerProfile.totalScore.toLocaleString()],
    ['Best streak (days)', progress.stats.bestStreak],
    ['Achievements', `${unlockedCount}`],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-extrabold text-base">My Stats</h2>
              <p className="text-[11px] text-slate-400">Your progress and records</p>
            </div>
          </div>
          <button
            onClick={() => { soundManager.playClick(); onClose(); }}
            className="p-1.5 rounded-full bg-white/10 text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 flex flex-col gap-3">
          {/* Player card */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent border border-amber-400/30">
            <span className="text-4xl">{playerProfile.avatar}</span>
            <div className="flex-1 min-w-0">
              <div className="font-black text-white truncate">{playerProfile.name}</div>
              <div className="text-[11px] text-slate-300">Rank {pl.level} · {progress.xp} XP</div>
            </div>
            <button
              onClick={() => { soundManager.playClick(); setIsEditingProfile(!isEditingProfile); }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-white/10 shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit</span>
            </button>
          </div>

          {isEditingProfile && (
            <div className="p-3 bg-slate-950 rounded-2xl border border-amber-500/20 flex flex-col gap-2.5">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>Customize Player Card</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  maxLength={20}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your player nickname"
                  className="flex-1 min-w-0 bg-slate-900 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <select
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  className="bg-slate-900 border border-white/15 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleSaveProfile}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    onClick={() => setEditAvatar(av)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${
                      editAvatar === av ? 'bg-amber-400 ring-2 ring-amber-300 scale-105' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {stats.map(([label, value]) => (
              <div key={label} className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400">{label}</div>
                <div className="text-lg font-black text-white flex items-center gap-1">
                  {label === 'Total stars' && <Star className="w-4 h-4 fill-amber-400 text-amber-400" />}
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Global ranking via Google Play Games */}
          <button
            onClick={openGlobal}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 active:scale-98"
          >
            <Globe className="w-4 h-4" />
            Global Leaderboard
          </button>
          {globalMsg && <p className="text-center text-[11px] text-slate-400">{globalMsg}</p>}
        </div>
      </div>
    </div>
  );
};
