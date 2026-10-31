import React, { useState } from 'react';
import { X, Trophy, Medal, Star, User, Search, Edit3, Check } from 'lucide-react';
import { LeaderboardEntry, PlayerProfile } from '../types/game';
import {
  getLeaderboard,
  AVATAR_OPTIONS,
  COUNTRY_OPTIONS,
  savePlayerProfile,
} from '../utils/leaderboard';
import { soundManager } from '../utils/audio';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerProfile: PlayerProfile;
  onProfileUpdated: (updated: PlayerProfile) => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  playerProfile,
  onProfileUpdated,
}) => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'allTime'>('allTime');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(playerProfile.name);
  const [editAvatar, setEditAvatar] = useState(playerProfile.avatar);
  const [editCountry, setEditCountry] = useState(playerProfile.country);

  if (!isOpen) return null;

  const entries = getLeaderboard(timeframe);
  const filtered = entries.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const currentPlayerEntry = entries.find((e) => e.isCurrentPlayer);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg h-[90vh] max-h-[640px] rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-extrabold text-base">Global Champions</h2>
              <p className="text-[11px] text-slate-400">Competitive Ball Sort League</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeframe Tabs & Search */}
        <div className="px-4 pt-3 pb-2 flex flex-col gap-2.5 bg-slate-900/60">
          {/* Segmented Timeframe Switch */}
          <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-white/10">
            {(['daily', 'weekly', 'allTime'] as const).map((tab) => {
              const label = tab === 'daily' ? 'Today' : tab === 'weekly' ? 'This Week' : 'All-Time';
              const active = timeframe === tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    soundManager.playClick();
                    setTimeframe(tab);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    active
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Search Bar & Edit Profile Trigger */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leaderboard..."
                className="w-full bg-slate-950/70 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
              />
            </div>
            <button
              onClick={() => {
                soundManager.playClick();
                setIsEditingProfile(!isEditingProfile);
              }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-white/10 shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">My Profile</span>
            </button>
          </div>
        </div>

        {/* Profile Edit Drawer */}
        {isEditingProfile && (
          <div className="p-3 bg-slate-950 border-b border-amber-500/20 flex flex-col gap-2.5 animate-in slide-in-from-top duration-200">
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
                className="flex-1 bg-slate-900 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />

              <select
                value={editCountry}
                onChange={(e) => setEditCountry(e.target.value)}
                className="bg-slate-900 border border-white/15 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
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

            {/* Avatar Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  key={av}
                  onClick={() => setEditAvatar(av)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 transition-transform ${
                    editAvatar === av
                      ? 'bg-amber-400 ring-2 ring-amber-300 scale-105'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current Player Sticky Ranking Row */}
        {currentPlayerEntry && (
          <div className="px-4 py-2 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent border-y border-amber-400/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="font-mono font-black text-amber-400 w-6 text-center text-sm">
                #{currentPlayerEntry.rank}
              </span>
              <span className="text-xl">{playerProfile.avatar}</span>
              <div className="text-left">
                <div className="font-black text-white flex items-center gap-1">
                  <span>{playerProfile.name}</span>
                  <span className="text-[10px] bg-amber-400 text-slate-950 px-1 rounded font-bold">
                    YOU
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Level {playerProfile.currentLevel} · {playerProfile.totalStars} Stars
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="font-mono font-extrabold text-amber-300">
                {playerProfile.totalScore.toLocaleString()}
              </div>
              <div className="text-[9px] text-slate-400">Total Points</div>
            </div>
          </div>
        )}

        {/* Scrollable Leaderboard List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5 px-2">
          {filtered.map((entry) => {
            const isTop3 = entry.rank <= 3;
            const medalColor =
              entry.rank === 1
                ? 'text-amber-400'
                : entry.rank === 2
                ? 'text-slate-300'
                : 'text-amber-600';

            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                  entry.isCurrentPlayer
                    ? 'bg-amber-500/15 border border-amber-500/30'
                    : 'hover:bg-white/5'
                }`}
              >
                {/* Left: Rank & Player info */}
                <div className="flex items-center gap-3">
                  <div className="w-7 text-center font-mono font-bold flex items-center justify-center">
                    {isTop3 ? (
                      <Medal className={`w-5 h-5 ${medalColor}`} />
                    ) : (
                      <span className="text-slate-400 text-xs">#{entry.rank}</span>
                    )}
                  </div>

                  <span className="text-2xl">{entry.avatar}</span>

                  <div className="text-left">
                    <div className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span className="truncate max-w-[120px] sm:max-w-[160px]">{entry.name}</span>
                      <span className="text-[11px] opacity-80">{entry.country}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>Lv. {entry.level}</span>
                      <span>·</span>
                      <span className="flex items-center text-amber-400">
                        <Star className="w-2.5 h-2.5 fill-amber-400 mr-0.5" />
                        {entry.stars}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Score */}
                <div className="text-right">
                  <span className="font-mono font-black text-xs text-amber-300">
                    {entry.score.toLocaleString()}
                  </span>
                  <div className="text-[9px] text-slate-400">pts</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
