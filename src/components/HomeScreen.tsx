import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import {
  Play,
  LayoutGrid,
  Gift,
  Trophy,
  Palette,
  Volume2,
  VolumeX,
  Smartphone,
  Instagram,
  Star,
  Share2,
  CalendarDays,
  Flame,
  Check,
} from 'lucide-react';
import { DailyState, liveDailyStreak } from '../utils/progress';
import { dailyDifficultyFor, todayUTC } from '../utils/levels';

export const INSTAGRAM_URL = 'https://www.instagram.com/pixelpocket.apps/';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.colorsort.odyssey';
const APP_VERSION = '1.0.7';

const compact = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '')}K` : String(n));

interface HomeScreenProps {
  level: number;
  hasPlayed: boolean;
  coins: number;
  gems: number;
  totalStars: number;
  rank: number;
  xpPercent: number;
  isMuted: boolean;
  onPlay: () => void;
  onOpenLevels: () => void;
  onOpenRewards: () => void;
  onOpenStats: () => void;
  onOpenSkins: () => void;
  onOpenAndroidInstall: () => void;
  onToggleSound: () => void;
  daily: DailyState;
  hasDailyLeaderboard: boolean;
  onStartDaily: () => void;
  onOpenDailyLeaderboard: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  level,
  hasPlayed,
  coins,
  gems,
  totalStars,
  rank,
  xpPercent,
  isMuted,
  onPlay,
  onOpenLevels,
  onOpenRewards,
  onOpenStats,
  onOpenSkins,
  onOpenAndroidInstall,
  onToggleSound,
  daily,
  hasDailyLeaderboard,
  onStartDaily,
  onOpenDailyLeaderboard,
}) => {
  const [notice, setNotice] = useState<string | null>(null);
  const isNative = Capacitor.isNativePlatform();

  // Daily challenge: ticks once a second so the countdown and the new-day rollover stay live
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const today = new Date(now).toISOString().slice(0, 10) || todayUTC();
  const dailyDone = daily.lastDate === today;
  const streak = liveDailyStreak(daily, today);
  const msLeft = Math.max(0, Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate() + 1) - now);
  const pad = (n: number) => String(n).padStart(2, '0');
  const countdown = `${pad(Math.floor(msLeft / 3600000))}:${pad(Math.floor((msLeft % 3600000) / 60000))}:${pad(Math.floor((msLeft % 60000) / 1000))}`;

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2200);
  };

  const share = async () => {
    const text = `I'm playing ColorSort, a free ball-sort puzzle. Try it: ${PLAY_STORE_URL}`;
    try {
      if (isNative) {
        // Android WebView has no Web Share API: use the native share sheet (WhatsApp, Messages, ...)
        await Share.share({ title: 'ColorSort', text, dialogTitle: 'Share ColorSort' });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: 'ColorSort', text });
        return;
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError' || /cancel/i.test((e as Error)?.message ?? '')) return; // player closed the share sheet
    }
    try {
      await navigator.clipboard.writeText(text);
      flash('Link copied');
    } catch {
      flash(PLAY_STORE_URL);
    }
  };

  const tile =
    'flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/10 py-3 px-1 text-white transition-all min-w-0';
  const tileLabel = 'text-[11px] font-semibold text-white/80 max-w-full truncate';

  return (
    <div className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain">
      <div className="min-h-full w-full max-w-sm mx-auto px-5 py-3 flex flex-col items-center justify-center gap-5 [@media(max-height:560px)]:gap-3 select-none">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-end gap-1" aria-hidden>
            {['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'].map((c, i) => (
              <span
                key={c}
                className="block rounded-full shadow-lg animate-bob"
                style={{
                  width: 22,
                  height: 22,
                  background: `radial-gradient(circle at 35% 30%, #fff8, ${c} 55%)`,
                  marginBottom: i % 2 ? 0 : 8,
                  animationDelay: `${i * 160}ms`,
                }}
              />
            ))}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
            Color<span className="text-amber-300">Sort</span>
          </h1>
          <p className="text-xs text-white/60">Sort the colours. Clear the tubes.</p>
        </div>

        {/* Wallet */}
        <button
          onClick={onOpenRewards}
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-bold text-white/90"
          aria-label="Open rewards"
        >
          <span className="text-amber-300">🪙 {compact(coins)}</span>
          <span className="text-cyan-300">💎 {compact(gems)}</span>
          <span className="text-yellow-300">⭐ {compact(totalStars)}</span>
          <span className="flex items-center gap-1.5 text-purple-300">
            XP Lv {rank}
            <span className="inline-block w-12 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <span className="block h-full bg-purple-400" style={{ width: `${xpPercent}%` }} />
            </span>
          </span>
        </button>

        {/* Primary action */}
        <button
          onClick={onPlay}
          className="w-full flex items-center justify-center gap-3 rounded-3xl bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 font-extrabold text-xl py-4 shadow-xl shadow-amber-900/40 active:scale-[0.97] transition-transform animate-cta-glow"
        >
          <Play className="w-6 h-6 fill-slate-950" />
          <span>{hasPlayed ? 'Continue' : 'Play'}</span>
          <span className="text-base font-bold opacity-70">· Level {level}</span>
        </button>

        {/* Daily challenge */}
        <div className="w-full rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-fuchsia-500/10 p-3 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-400/15 flex items-center justify-center">
              {dailyDone ? <Check className="w-5 h-5 text-emerald-400" strokeWidth={3} /> : <CalendarDays className="w-5 h-5 text-amber-300" />}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white">Daily Challenge</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-amber-200">{dailyDifficultyFor(today)}</span>
              </div>
              <div className="text-[11px] text-white/60 truncate">
                {dailyDone ? `Done today · best ${daily.todayPoints.toLocaleString('en-US')} pts` : `Win for +${100 + Math.min(Math.max(streak, 0), 6) * 20} 🪙 and your streak`}
              </div>
            </div>
            <button
              onClick={onStartDaily}
              className="shrink-0 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-sm px-4 py-2 active:scale-95 transition-transform"
            >
              {dailyDone ? 'Retry' : 'Play'}
            </button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/60">
            <span className="flex items-center gap-1 font-semibold text-orange-300"><Flame className="w-3.5 h-3.5" />{streak > 0 ? `${streak}-day streak` : 'Start a streak'}</span>
            <span className="tabular-nums">New puzzle in {countdown}</span>
            <button onClick={onOpenDailyLeaderboard} className="flex items-center gap-1 font-semibold text-white/80 underline underline-offset-2">
              <Trophy className="w-3.5 h-3.5 text-amber-300" />{hasDailyLeaderboard ? 'Leaderboard' : 'Ranks'}
            </button>
          </div>
        </div>

        {/* Secondary actions */}
        <div className="w-full grid grid-cols-3 gap-2.5">
          <button onClick={onOpenLevels} className={tile}>
            <LayoutGrid className="w-6 h-6 text-amber-400" />
            <span className={tileLabel}>Levels</span>
          </button>
          <button onClick={onOpenRewards} className={tile}>
            <Gift className="w-6 h-6 text-purple-300" />
            <span className={tileLabel}>Rewards</span>
          </button>
          <button onClick={onOpenStats} className={tile}>
            <Trophy className="w-6 h-6 text-amber-300" />
            <span className={tileLabel}>My Stats</span>
          </button>
          <button onClick={onOpenSkins} className={tile}>
            <Palette className="w-6 h-6 text-fuchsia-400" />
            <span className={tileLabel}>Themes</span>
          </button>
          <button onClick={onToggleSound} className={tile} aria-pressed={isMuted}>
            {isMuted ? <VolumeX className="w-6 h-6 text-red-400" /> : <Volume2 className="w-6 h-6 text-emerald-400" />}
            <span className={tileLabel}>{isMuted ? 'Sound off' : 'Sound on'}</span>
          </button>
          {isNative ? (
            <button onClick={share} className={tile}>
              <Share2 className="w-6 h-6 text-sky-400" />
              <span className={tileLabel}>Share</span>
            </button>
          ) : (
            <button onClick={onOpenAndroidInstall} className={tile}>
              <Smartphone className="w-6 h-6 text-emerald-400" />
              <span className={tileLabel}>Android app</span>
            </button>
          )}
        </div>

        {/* Community */}
        <div className="w-full flex flex-col items-center gap-2">
          <div className="w-full flex gap-2.5">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-0 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600/80 to-orange-500/80 text-white text-sm font-bold py-2.5 active:scale-95 transition-transform"
            >
              <Instagram className="w-4 h-4 shrink-0" />
              <span className="truncate">Follow us</span>
            </a>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-0 flex items-center justify-center gap-2 rounded-2xl bg-white/10 border border-white/15 text-white text-sm font-bold py-2.5 active:scale-95 transition-transform"
            >
              <Star className="w-4 h-4 shrink-0 text-amber-300" />
              <span className="truncate">Rate us</span>
            </a>
          </div>
          {!isNative && (
            <button onClick={share} className="text-xs font-semibold text-white/60 underline underline-offset-2">
              Share with a friend
            </button>
          )}
          <p className="text-[10px] text-white/40">Pixel Pocket · v{APP_VERSION}</p>
        </div>
      </div>

      {notice && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-xl bg-slate-800 text-white text-xs border border-white/20 shadow-lg">
          {notice}
        </div>
      )}
    </div>
  );
};
