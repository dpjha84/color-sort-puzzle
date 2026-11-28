import { useState, useEffect, useCallback, useRef } from 'react';
import { logEvent } from './utils/analytics';
import { Tube, Move, BallSkin, TubeSkin, BackgroundTheme, PlayerProfile, RewardType } from './types/game';
import { generateLevel, generateDaily, dailyPoints, todayUTC, DailyConfig } from './utils/levels';
import { LevelConfig } from './types/game';
import { DailyVictoryModal } from './components/DailyVictoryModal';
import { maybeRequestReview } from './utils/review';
import { saveBoard, clearBoard, loadBoard as loadSavedBoard, isValidSavedBoard, isSolvedColors, SavedBoard } from './utils/boardSave';
import { CloudSave, isValidSave, mergeSaves, hasProgress } from './utils/cloudSave';
import { isBoardSolved, isTubeCompleted, getValidMoves, getHint } from './utils/solver';
import { soundManager } from './utils/audio';
import {
  getPlayerProfile,
  savePlayerProfile,
  updatePlayerScoreOnWin,
} from './utils/leaderboard';

import { Header } from './components/Header';
import { GameBoard } from './components/GameBoard';
import { VictoryModal } from './components/VictoryModal';
import { FailedModal } from './components/FailedModal';
import { adMobManager } from './utils/admob';
import { AdDebugPanel } from './components/AdDebugPanel';
import { LeaderboardModal } from './components/LeaderboardModal';
import { SkinsModal } from './components/SkinsModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { BannerAd } from './components/BannerAd';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { RewardsModal } from './components/RewardsModal';
import { AmbientBackground } from './components/AmbientBackground';
import { HomeScreen } from './components/HomeScreen';
import { VictoryRewards } from './types/game';
import {
  ProgressState, ShopItem, loadProgress, saveProgress, applyWin, applyStat, applyPurchase, playerLevel, applyDailyWin, DailyResult,
} from './utils/progress';
import { unlockAchievement, submitScore, syncProgress, submitDailyScore, showDailyLeaderboard, hasDailyLeaderboard, getLastIssue, getCloudStatus, loadCloudSave, saveCloudSave } from './utils/playGames';

export default function App() {
  // Player Profile & Preferences
  const [profile, setProfile] = useState<PlayerProfile>(getPlayerProfile);
  const [isMuted, setIsMuted] = useState(false);

  // Coins, gems, XP, achievements
  const [progress, setProgressState] = useState<ProgressState>(() => loadProgress(getPlayerProfile().currentLevel));
  const progressRef = useRef(progress);
  const setProgress = (p: ProgressState) => {
    progressRef.current = p;
    setProgressState(p);
    saveProgress(p);
  };
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  // 'home' on launch; 'game' once the player taps Play. Game state stays alive while on home.
  const [screen, setScreen] = useState<'home' | 'game'>('home');
  const [lastRewards, setLastRewards] = useState<VictoryRewards>({ coins: 0, xp: 0, unlocked: [], leveledUpTo: null });
  const assistedRef = useRef(false); // hint or undo used this round

  // Daily challenge mode (campaign progress is untouched while playing it)
  const [mode, setMode] = useState<'campaign' | 'daily'>('campaign');
  const [dailyCfg, setDailyCfg] = useState<DailyConfig | null>(null);
  const modeRef = useRef<'campaign' | 'daily'>('campaign');
  modeRef.current = mode;
  const [dailyResult, setDailyResult] = useState<DailyResult | null>(null);
  const [showDailyVictory, setShowDailyVictory] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Game Play State
  const [currentLevel, setCurrentLevel] = useState(() => profile.currentLevel || 1);
  const [tubes, setTubes] = useState<Tube[]>([]);
  const [selectedTubeIndex, setSelectedTubeIndex] = useState<number | null>(null);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [movesCount, setMovesCount] = useState(0);
  const moveHistoryRef = useRef<Move[]>([]);
  moveHistoryRef.current = moveHistory;
  const [targetMoves, setTargetMoves] = useState(10);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [isGameActive, setIsGameActive] = useState(true);

  // Boosters state for current round
  const [addedTubeThisRound, setAddedTubeThisRound] = useState(false);
  const [hintSourceIndex, setHintSourceIndex] = useState<number | null>(null);
  const [hintTargetIndex, setHintTargetIndex] = useState<number | null>(null);

  // Modals
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [adNotice, setAdNotice] = useState<string | null>(null);
  const [showAdDebug, setShowAdDebug] = useState(false);
  const secretTaps = useRef<number[]>([]);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showSkinsModal, setShowSkinsModal] = useState(false);
  const [showLevelSelectModal, setShowLevelSelectModal] = useState(false);
  const [showAndroidInstallModal, setShowAndroidInstallModal] = useState(false);

  // Victory score tracking
  const [lastScoreEarned, setLastScoreEarned] = useState(500);
  const [lastStarsEarned, setLastStarsEarned] = useState(3);

  // Initial Level Setup
  const loadBoard = useCallback((config: LevelConfig, saved?: SavedBoard) => {
    const source = saved ? saved.tubes : config.initialTubes;
    const initialTubes: Tube[] = source.map((ballColors, idx) => ({
      id: idx,
      balls: ballColors.map((color, bIdx) => ({
        id: `tube-${idx}-ball-${bIdx}-${Math.random()}`,
        color,
      })),
      maxCapacity: 4,
      isComplete: isTubeCompleted(ballColors, 4, source),
    }));

    setTubes(initialTubes);
    setSelectedTubeIndex(null);
    setMoveHistory(saved ? saved.history.map((h) => ({ fromTubeIndex: h.f, toTubeIndex: h.t, ball: { id: `undo-${Math.random()}`, color: h.c } })) : []);
    setMovesCount(saved ? saved.moves : 0);
    setTargetMoves(config.targetMoves);
    setTimeSeconds(saved ? Math.floor(saved.time) : 0);
    setIsGameActive(true);
    setAddedTubeThisRound(saved ? saved.added : false);
    assistedRef.current = saved ? saved.assisted : false;
    setHintSourceIndex(null);
    setHintTargetIndex(null);
    setShowVictoryModal(false);
    setShowFailedModal(false);
    setShowDailyVictory(false);
  }, []);
  const loadLevel = useCallback((lvl: number) => {
    setMode('campaign');
    setDailyCfg(null);
    loadBoard(generateLevel(lvl));
    logEvent('level_start', { level: lvl, mode: 'campaign' });
  }, [loadBoard]);
  const startDaily = useCallback(() => {
    const cfg = generateDaily(todayUTC());
    setMode('daily');
    setDailyCfg(cfg);
    setDailyResult(null);
    const saved = loadSavedBoard('daily');
    loadBoard(cfg, isValidSavedBoard(saved, 'daily', cfg.levelNumber, cfg.date, cfg.initialTubes) ? saved : undefined);
    logEvent('level_start', { level: cfg.levelNumber, mode: 'daily' });
    goGameRef.current();
  }, [loadBoard]);
  const goGameRef = useRef<() => void>(() => {});

  // Dead-end detection: after a move, if the solver proves the board can no longer be won, offer a free rewind
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    setStuck(false);
    if (screen !== 'game' || !isGameActive || !tubes.length || showVictoryModal || showDailyVictory || showFailedModal) return;
    const colors = tubes.map((t) => t.balls.map((b) => b.color));
    if (isBoardSolved(colors, 4) || getValidMoves(colors, 4).length === 0) return; // finished, or the no-moves screen handles it
    const timer = setTimeout(() => {
      if (getHint(colors, 4).unsolvable) setStuck(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [tubes, screen, isGameActive, showVictoryModal, showDailyVictory, showFailedModal]);

  // Free "smart undo": step back until the position can be won again (no undo charge; counts as assisted)
  const handleRewind = () => {
    soundManager.playClick();
    const nt = tubes.map((t) => ({ ...t, balls: [...t.balls] }));
    const hist = [...moveHistory];
    let undone = 0;
    while (hist.length) {
      const m = hist.pop()!;
      const ball = nt[m.toTubeIndex].balls.pop()!;
      nt[m.fromTubeIndex].balls.push(ball);
      undone++;
      if (!getHint(nt.map((t) => t.balls.map((b) => b.color)), 4).unsolvable) break;
    }
    const fixed = nt.map((t) => ({ ...t, isComplete: isTubeCompleted(t.balls.map((b) => b.color), t.maxCapacity) }));
    assistedRef.current = true;
    soundManager.playPop(480);
    setTubes(fixed);
    setMoveHistory(hist);
    setMovesCount((m) => Math.max(0, m - undone));
    setSelectedTubeIndex(null);
    setStuck(false);
  };

  // A hint describes one exact board: drop the highlight the moment the board changes (move, undo, +tube, reset, revive)
  useEffect(() => {
    setHintSourceIndex(null);
    setHintTargetIndex(null);
  }, [tubes]);

  // Timer loop
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (screen === 'game' && isGameActive && !showVictoryModal && !showDailyVictory && !showFailedModal) {
      timerRef.current = setInterval(() => {
        setTimeSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, isGameActive, showVictoryModal, showDailyVictory, showFailedModal]);

  // Navigation: Play pushes a history entry so the Android back button returns to home (and back on home exits)
  const goGame = useCallback(() => {
    setScreen('game');
    try {
      if (window.history.state?.screen !== 'game') window.history.pushState({ screen: 'game' }, '');
    } catch {
      /* history unavailable: the Home button still works */
    }
  }, []);
  goGameRef.current = goGame;
  const goHome = useCallback(() => {
    try {
      if (window.history.state?.screen === 'game') {
        window.history.back(); // popstate below switches the screen
        return;
      }
    } catch {
      /* fall through */
    }
    setScreen('home');
  }, []);
  useEffect(() => {
    const onPop = () => setScreen('home');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Push earned achievements/score to Play Games once at launch (no-op when signed out)
  useEffect(() => {
    syncProgress(Object.keys(progressRef.current.unlocked), profile.totalScore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Cloud save (Play Games Saved Games) ----
  const snapshot = (): CloudSave => ({ v: 1, savedAt: Date.now(), profile: getPlayerProfile(), progress: progressRef.current });
  const lastSavedSig = useRef('');
  const sigOf = (c: CloudSave) => `${c.progress.xp}|${c.progress.coins}|${c.progress.gems}|${c.progress.stats.levelsWon}|${c.progress.stats.maxLevelCleared}|${c.progress.daily.totalWins}|${c.profile.currentLevel}|${Object.keys(c.progress.unlocked).length}`;
  const saveNow = async () => {
    const snap = snapshot();
    if (!hasProgress(snap)) return;
    const sig = sigOf(snap);
    if (sig === lastSavedSig.current) return;
    if (await saveCloudSave(snap)) lastSavedSig.current = sig;
  };
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueCloudSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { saveTimer.current = null; saveNow(); }, 4000);
  };
  // Pull the cloud copy, keep whichever side is further along, then push the merged result back.
  const syncCloud = async (): Promise<string> => {
    const raw = await loadCloudSave();
    if (isValidSave(raw)) {
      const { merged, winner } = mergeSaves(snapshot(), raw);
      if (winner === 'cloud') {
        // looks are per device: keep the skins/theme chosen here instead of the cloud copy's
        const local = getPlayerProfile();
        merged.profile = { ...merged.profile, selectedSkin: local.selectedSkin, selectedTubeSkin: local.selectedTubeSkin, selectedTheme: local.selectedTheme };
        savePlayerProfile(merged.profile);
        setProfile(merged.profile);
        setProgress(merged.progress);
        if (!moveHistoryRef.current.length && modeRef.current === 'campaign') {
          setCurrentLevel(merged.profile.currentLevel);
          loadLevel(merged.profile.currentLevel);
        }
        lastSavedSig.current = sigOf(merged);
        setToast('Progress restored from your Google Play Games account');
        setTimeout(() => setToast(null), 3500);
      }
    }
    await saveNow();
    return getCloudStatus();
  };
  useEffect(() => {
    syncCloud();
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
        saveNow();
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resume at the player's saved level on app start (runs once)
  useEffect(() => {
    const cfg = generateLevel(currentLevel);
    const saved = loadSavedBoard('campaign');
    if (isValidSavedBoard(saved, 'campaign', currentLevel, '', cfg.initialTubes)) {
      setMode('campaign');
      setDailyCfg(null);
      loadBoard(cfg, saved); // pick up exactly where the player left off
    } else {
      loadLevel(currentLevel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadLevel]);

  // Keep this device's copy of the board current (moves, undo history, time). Finished or stuck boards are cleared.
  const timeRef = useRef(0);
  timeRef.current = timeSeconds;
  const persistBoard = () => {
    if (!tubes.length) return;
    const kind = mode;
    if (kind === 'daily' && (!dailyCfg || dailyCfg.date !== todayUTC())) return;
    const colors = tubes.map((t) => t.balls.map((b) => b.color));
    if (showVictoryModal || showDailyVictory || showFailedModal || isSolvedColors(colors)) {
      clearBoard(kind);
      return;
    }
    saveBoard({
      v: 1,
      kind,
      level: kind === 'daily' ? dailyCfg!.levelNumber : currentLevel,
      date: kind === 'daily' ? dailyCfg!.date : '',
      tubes: colors,
      moves: movesCount,
      time: timeRef.current,
      history: moveHistory.map((m) => ({ f: m.fromTubeIndex, t: m.toTubeIndex, c: m.ball.color })),
      added: addedTubeThisRound,
      assisted: assistedRef.current,
    });
  };
  const persistRef = useRef(persistBoard);
  persistRef.current = persistBoard;
  useEffect(() => {
    persistRef.current();
  }, [tubes, movesCount, moveHistory, addedTubeThisRound, showVictoryModal, showDailyVictory, showFailedModal]);
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') persistRef.current(); };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  // Handle Sound Mute Toggle
  const handleToggleSound = () => {
    soundManager.playClick();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.isMuted = nextMuted;
  };

  // Check if Board is Complete
  const checkWinCondition = (currentTubes: Tube[]) => {
    const rawColors = currentTubes.map((t) => t.balls.map((b) => b.color));
    if (isBoardSolved(rawColors, 4)) {
      setIsGameActive(false);
      setSelectedTubeIndex(null);
      setHintSourceIndex(null);
      setHintTargetIndex(null);
      setShowFailedModal(false);

      // Calculate Stars: 3 stars if within target, 2 stars if <= target * 1.5, 1 star otherwise
      let stars = 1;
      if (movesCount + 1 <= targetMoves) {
        stars = 3;
      } else if (movesCount + 1 <= targetMoves * 1.5) {
        stars = 2;
      }

      setLastStarsEarned(stars);

      if (mode === 'daily' && dailyCfg) {
        const pts = dailyPoints(movesCount + 1, targetMoves, timeSeconds);
        const counted = dailyCfg.date === todayUTC(); // a puzzle left open past midnight is practice only
        let res: DailyResult = { first: false, coins: 0, gems: 0, xp: 0, streak: progressRef.current.daily.streak, points: pts, bestToday: pts, improved: false, froze: 0, chest: null, freezes: progressRef.current.daily.freezes ?? 0 };
        if (counted) {
          const out = applyDailyWin(progressRef.current, dailyCfg.date, pts);
          setProgress(out.state); // applyDailyWin already pays the rewards
          res = out.result;
          submitDailyScore(pts);
          queueCloudSave();
        }
        setDailyResult(res);
        logEvent('level_end', { mode: 'daily', success: true, level: dailyCfg.levelNumber, moves: movesCount + 1, time_s: timeSeconds, points: pts, streak: res.streak, counted });
        setTimeout(() => { soundManager.playVictory(); soundManager.triggerHaptic(50); }, 480);
        setTimeout(() => setShowDailyVictory(true), 800);
        return true;
      }

      const { levelScore, profile: updatedProfile } = updatePlayerScoreOnWin(
        currentLevel,
        movesCount + 1,
        timeSeconds,
        stars
      );
      setLastScoreEarned(levelScore);
      setProfile(updatedProfile);
      submitScore(updatedProfile.totalScore);

      const res = applyWin(progressRef.current, {
        level: currentLevel,
        stars,
        timeSeconds,
        assisted: assistedRef.current,
      });
      setProgress(res.state);
      setLastRewards({ coins: res.summary.coins, xp: res.summary.xp, unlocked: res.summary.unlocked, leveledUpTo: res.summary.leveledUpTo });
      logEvent('level_end', { mode: 'campaign', success: true, level: currentLevel, stars, moves: movesCount + 1, time_s: timeSeconds, assisted: assistedRef.current });
      res.summary.unlocked.forEach((a) => unlockAchievement(a.id));
      queueCloudSave();
      if (stars === 3) maybeRequestReview(res.state.stats.levelsWon);

      setTimeout(() => {
        soundManager.playVictory();
        soundManager.triggerHaptic(50);
      }, 480);

      setTimeout(() => {
        setShowVictoryModal(true);
      }, 800); // let the last ball land and the tube celebrate first
      return true;
    }
    return false;
  };

  // Check if Stuck (Deadlock)
  const checkDeadlock = (currentTubes: Tube[]) => {
    const rawColors = currentTubes.map((t) => t.balls.map((b) => b.color));
    // Guard: never deadlock if board is already solved
    if (isBoardSolved(rawColors, 4)) {
      return false;
    }
    const validMoves = getValidMoves(rawColors, 4);

    if (validMoves.length === 0) {
      soundManager.playError();
      logEvent('level_end', { mode: modeRef.current, success: false, level: currentLevel, moves: movesCount, time_s: timeSeconds });
      setTimeout(() => {
        setShowFailedModal(true);
      }, 500);
      return true;
    }
    return false;
  };

  // Handle Tube Selection & Ball Movement
  const handleTubeSelect = (tubeIndex: number) => {
    const targetTube = tubes[tubeIndex];

    // Case 1: No source tube currently selected
    if (selectedTubeIndex === null) {
      if (targetTube.balls.length === 0) {
        soundManager.playClick();
        return; // Can't pick up from empty tube
      }
      if (targetTube.isComplete) {
        soundManager.playClick();
        return; // Don't pick up from completed tube
      }

      soundManager.playPop(520);
      soundManager.triggerHaptic(15);
      setSelectedTubeIndex(tubeIndex);
      setHintSourceIndex(null);
      setHintTargetIndex(null);
      return;
    }

    // Case 2: User tapped the exact same tube again -> Deselect and put ball back
    if (selectedTubeIndex === tubeIndex) {
      soundManager.playDrop(targetTube.balls.length);
      setSelectedTubeIndex(null);
      return;
    }

    // Case 3: Transferring ball from source to destination tube
    const sourceTube = tubes[selectedTubeIndex];
    const ballToMove = sourceTube.balls[sourceTube.balls.length - 1];

    // Validation Rules:
    // 1. Destination must not be full
    // 2. Destination must either be empty OR top ball matches moving ball color
    const isDestFull = targetTube.balls.length >= targetTube.maxCapacity;
    const isDestEmpty = targetTube.balls.length === 0;
    const isDestColorMatch =
      !isDestEmpty &&
      targetTube.balls[targetTube.balls.length - 1].color === ballToMove.color;

    if (isDestFull || (!isDestEmpty && !isDestColorMatch)) {
      // Invalid move!
      soundManager.playError();
      soundManager.triggerHaptic(25);
      setSelectedTubeIndex(null);
      return;
    }

    // Perform valid transfer
    const preliminaryTubes = tubes.map((t, idx) => {
      if (idx === selectedTubeIndex) {
        return {
          ...t,
          balls: t.balls.slice(0, t.balls.length - 1),
        };
      }
      if (idx === tubeIndex) {
        return {
          ...t,
          balls: [...t.balls, ballToMove],
        };
      }
      return t;
    });

    const rawColorsAfterMove = preliminaryTubes.map((t) => t.balls.map((b) => b.color));
    const newTubes: Tube[] = preliminaryTubes.map((t) => ({
      ...t,
      isComplete: isTubeCompleted(t.balls.map((b) => b.color), t.maxCapacity, rawColorsAfterMove),
    }));

    // sounds and buzz land with the ball (it takes ~0.3s to fly), not when the finger lifts
    const landDepth = targetTube.balls.length + 1;
    const completes = newTubes[tubeIndex].isComplete;
    setTimeout(() => {
      soundManager.playDrop(landDepth);
      soundManager.triggerHaptic(15);
      if (completes) {
        soundManager.playTubeComplete();
        soundManager.triggerHaptic(35);
      }
    }, 300);

    // Record in history for Undo
    setMoveHistory((prev) => [
      ...prev,
      {
        fromTubeIndex: selectedTubeIndex,
        toTubeIndex: tubeIndex,
        ball: ballToMove,
      },
    ]);

    setTubes(newTubes);
    setSelectedTubeIndex(null);
    setMovesCount((m) => m + 1);

    // Check Win or Deadlock
    const won = checkWinCondition(newTubes);
    if (!won) {
      checkDeadlock(newTubes);
    }
  };

  // Undo Last Move
  const handleUndo = () => {
    if (moveHistory.length === 0) return;

    if (profile.undoRemaining <= 0) {
      watchRewardedAd(() => handleRewardGranted('undos'));
      return;
    }

    logEvent('undo_used', { level: currentLevel, mode });
    assistedRef.current = true;
    soundManager.playPop(480);
    soundManager.triggerHaptic(20);

    const lastMove = moveHistory[moveHistory.length - 1];
    const newTubes = tubes.map((t, idx) => {
      if (idx === lastMove.toTubeIndex) {
        const balls = t.balls.slice(0, t.balls.length - 1);
        return {
          ...t,
          balls,
          isComplete: isTubeCompleted(balls.map((b) => b.color), t.maxCapacity),
        };
      }
      if (idx === lastMove.fromTubeIndex) {
        const balls = [...t.balls, lastMove.ball];
        return {
          ...t,
          balls,
          isComplete: isTubeCompleted(balls.map((b) => b.color), t.maxCapacity),
        };
      }
      return t;
    });

    setTubes(newTubes);
    setMoveHistory((prev) => prev.slice(0, prev.length - 1));
    setMovesCount((m) => Math.max(0, m - 1));
    setSelectedTubeIndex(null);

    // Update profile
    const updatedProfile: PlayerProfile = {
      ...profile,
      undoRemaining: Math.max(0, profile.undoRemaining - 1),
    };
    setProfile(updatedProfile);
    savePlayerProfile(updatedProfile);
  };

  // Reset Level
  const handleReset = () => {
    soundManager.playClick();
    if (mode === 'daily' && dailyCfg) {
      setDailyResult(null);
      loadBoard(dailyCfg);
      return;
    }
    loadLevel(currentLevel);
  };

  // Hint Booster
  const handleHint = () => {
    if (profile.hintsRemaining <= 0) {
      watchRewardedAd(() => handleRewardGranted('hints'));
      return;
    }

    soundManager.playClick();
    const rawColors = tubes.map((t) => t.balls.map((b) => b.color));
    const { hint, unsolvable } = getHint(rawColors, 4);

    if (unsolvable) {
      // The position can no longer be solved: say so instead of giving a pointless hint (none is used up)
      soundManager.playError();
      setAdNotice('No solution from here. Undo a few moves or reset the level.');
      setTimeout(() => setAdNotice(null), 3500);
      return;
    }

    if (hint) {
      setSelectedTubeIndex(null); // a half-made pick would fight the hint
      soundManager.playPop(700);
      soundManager.triggerHaptic(30);
      setHintSourceIndex(hint.fromIndex);
      setHintTargetIndex(hint.toIndex);
      assistedRef.current = true;
      logEvent('hint_used', { level: currentLevel, mode });
      const st = applyStat(progressRef.current, 'hintsUsed');
      setProgress(st.state);
      st.unlocked.forEach((a) => unlockAchievement(a.id));

      const updatedProfile: PlayerProfile = {
        ...profile,
        hintsRemaining: Math.max(0, profile.hintsRemaining - 1),
      };
      setProfile(updatedProfile);
      savePlayerProfile(updatedProfile);
    } else {
      soundManager.playError();
      setShowFailedModal(true);
    }
  };

  // Add Tube Booster
  const handleAddTube = () => {
    if (addedTubeThisRound) return;

    if (profile.freeTubesRemaining <= 0) {
      watchRewardedAd(() => handleRewardGranted('tubes'));
      return;
    }

    soundManager.playVictory();
    soundManager.triggerHaptic(40);
    logEvent('add_tube', { level: currentLevel });

    const newTube: Tube = {
      id: tubes.length,
      balls: [],
      maxCapacity: 4,
      isComplete: false,
    };

    setTubes((prev) => [...prev, newTube]);
    setAddedTubeThisRound(true);

    const updatedProfile: PlayerProfile = {
      ...profile,
      freeTubesRemaining: Math.max(0, profile.freeTubesRemaining - 1),
    };
    setProfile(updatedProfile);
    savePlayerProfile(updatedProfile);
  };

  // Real rewarded ad: reward only if the player finishes watching
  const watchRewardedAd = (onReward: () => void) => {
    logEvent('rewarded_ad_requested');
    adMobManager.showRewarded(() => { logEvent('rewarded_ad_granted'); onReward(); }, () => {
      logEvent('rewarded_ad_unavailable');
      setAdNotice('Ad not ready yet. Please try again in a few seconds.');
      setTimeout(() => setAdNotice(null), 3000);
    });
  };

  // Rewarded Ad Grant
  const handleRewardGranted = (type: RewardType) => {
    const updatedProfile: PlayerProfile = { ...profile };
    if (type === 'hints') {
      updatedProfile.hintsRemaining += 3;
    } else if (type === 'tubes') {
      updatedProfile.freeTubesRemaining += 1;
    } else if (type === 'undos') {
      updatedProfile.undoRemaining += 5;
    }
    setProfile(updatedProfile);
    savePlayerProfile(updatedProfile);
  };

  // Spend coins/gems on boosters
  const handleBuy = (item: ShopItem) => {
    const next = applyPurchase(progressRef.current, item);
    if (!next) return;
    logEvent('shop_purchase', { item });
    setProgress(next);
    const updated: PlayerProfile = { ...profile };
    if (item === 'hint') updated.hintsRemaining += 1;
    if (item === 'undos') updated.undoRemaining += 5;
    if (item === 'tube') updated.freeTubesRemaining += 1;
    if (item === 'pack') {
      updated.hintsRemaining += 5;
      updated.undoRemaining += 5;
      updated.freeTubesRemaining += 2;
    }
    setProfile(updated);
    savePlayerProfile(updated);
    soundManager.playPop(640);
  };

  const trackStyleChange = () => {
    const st = applyStat(progressRef.current, 'styleChanges');
    setProgress(st.state);
    st.unlocked.forEach((a) => unlockAchievement(a.id));
  };

  // Revive from failure modal
  const handleReviveWithTube = () => {
    const newTube: Tube = {
      id: tubes.length,
      balls: [],
      maxCapacity: 4,
      isComplete: false,
    };
    setTubes((prev) => [...prev, newTube]);
    setAddedTubeThisRound(true);
    setShowFailedModal(false);
  };

  const handleReviveWithUndo = () => {
    let count = 0;
    let currentHistory = [...moveHistory];
    let currentTubes = [...tubes];

    while (count < 5 && currentHistory.length > 0) {
      const lastMove = currentHistory.pop()!;
      currentTubes = currentTubes.map((t, idx) => {
        if (idx === lastMove.toTubeIndex) {
          const balls = t.balls.slice(0, t.balls.length - 1);
          return { ...t, balls };
        }
        if (idx === lastMove.fromTubeIndex) {
          const balls = [...t.balls, lastMove.ball];
          return { ...t, balls };
        }
        return t;
      });
      count++;
    }

    setTubes(currentTubes);
    setMoveHistory(currentHistory);
    setShowFailedModal(false);
  };

  // Victory flow: trigger interstitial ad then next level
  // The victory screen stays up until the ad is closed (or skipped), then the next level loads.
  const handleNextLevelWithAd = () => {
    adMobManager.showInterstitial(handleInterstitialAdCompleted);
  };

  const handleInterstitialAdCompleted = () => {
    const nextLvl = currentLevel + 1;
    setCurrentLevel(nextLvl);
    loadLevel(nextLvl);
  };

  // "Double score" is a rewarded ad: score is doubled only if the player watches it fully
  const handleDoubleScoreWithAd = () => {
    watchRewardedAd(() => {
      const updatedProfile: PlayerProfile = {
        ...profile,
        totalScore: profile.totalScore + lastScoreEarned,
      };
      setProfile(updatedProfile);
      savePlayerProfile(updatedProfile);
      // Bonus coins match what this win paid
      setProgress({ ...progressRef.current, coins: progressRef.current.coins + lastRewards.coins });
      setShowVictoryModal(false);
      // No second ad right after a rewarded one: go straight to the next level
      handleInterstitialAdCompleted();
    });
  };

  // Theme background styles
  const getThemeClass = (theme: BackgroundTheme) => {
    switch (theme) {
      case 'midnight-space':
        return 'bg-gradient-to-b from-indigo-950 via-slate-950 to-purple-950 text-white';
      case 'wood-table':
        return 'bg-gradient-to-b from-stone-900 via-amber-950/70 to-stone-950 text-amber-50';
      case 'pastel-light':
        return 'bg-gradient-to-b from-teal-950 via-slate-900 to-emerald-950 text-white';
      case 'dark-slate':
      default:
        return 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white';
    }
  };

  return (
    <div
      className={`relative isolate h-screen h-dvh w-full flex flex-col overflow-hidden ${getThemeClass(
        profile.selectedTheme
      )} transition-colors duration-500`}
    >
      <AmbientBackground />
      {screen === 'home' ? (
        <HomeScreen
          level={currentLevel}
          hasPlayed={progress.stats.levelsWon > 0 || moveHistory.length > 0 || currentLevel > 1}
          coins={progress.coins}
          gems={progress.gems}
          totalStars={profile.totalStars}
          rank={playerLevel(progress.xp).level}
          xpPercent={Math.round((playerLevel(progress.xp).into / playerLevel(progress.xp).need) * 100)}
          isMuted={isMuted}
          onPlay={() => {
            soundManager.playClick();
            if (mode === 'daily') loadLevel(currentLevel); // back to the campaign
            goGame();
          }}
          onOpenLevels={() => {
            soundManager.playClick();
            setShowLevelSelectModal(true);
          }}
          onOpenRewards={() => {
            soundManager.playClick();
            setShowRewardsModal(true);
          }}
          onOpenStats={() => {
            soundManager.playClick();
            setShowLeaderboardModal(true);
          }}
          onOpenSkins={() => {
            soundManager.playClick();
            setShowSkinsModal(true);
          }}
          onOpenAndroidInstall={() => {
            soundManager.playClick();
            setShowAndroidInstallModal(true);
          }}
          onToggleSound={handleToggleSound}
          daily={progress.daily}
          hasDailyLeaderboard={hasDailyLeaderboard()}
          onStartDaily={() => { soundManager.playClick(); startDaily(); }}
          onOpenDailyLeaderboard={() => {
            soundManager.playClick();
            showDailyLeaderboard().then((ok) => { if (!ok) { setToast(`Could not open the leaderboard. ${getLastIssue()}`.trim()); setTimeout(() => setToast(null), 3000); } });
          }}
        />
      ) : (
        <>
      {/* Top Header & Ergonomic Tools */}
      <Header
        levelNumber={currentLevel}
        levelLabel={mode === 'daily' ? 'Daily' : undefined}
        movesCount={movesCount}
        targetMoves={targetMoves}
        onOpenRewards={() => setShowRewardsModal(true)}
        onOpenHome={() => {
          soundManager.playClick();
          goHome();
        }}
        playerLevel={playerLevel(progress.xp).level}
        coins={progress.coins}
        gems={progress.gems}
        totalStars={profile.totalStars}
        xpPercent={Math.round((playerLevel(progress.xp).into / playerLevel(progress.xp).need) * 100)}
        hintsRemaining={profile.hintsRemaining}
        undosRemaining={profile.undoRemaining}
        freeTubesRemaining={profile.freeTubesRemaining}
        isMuted={isMuted}
        canUndo={moveHistory.length > 0}
        canAddTube={!addedTubeThisRound}
        onUndo={handleUndo}
        onReset={handleReset}
        onHint={handleHint}
        onAddTube={handleAddTube}
        onToggleSound={handleToggleSound}
        onOpenLevelSelect={() => {
          soundManager.playClick();
          setShowLevelSelectModal(true);
        }}
        onSecretTap={() => {
          const now = Date.now();
          secretTaps.current = [...secretTaps.current.filter((t) => now - t < 4000), now];
          if (secretTaps.current.length >= 7) {
            secretTaps.current = [];
            setShowAdDebug(true);
          }
        }}
      />

      {/* Main Interactive Tube Canvas */}
      <main className="flex-1 min-h-0 w-full flex flex-col items-center justify-center p-2 relative">
        <GameBoard
          tubes={tubes}
          selectedTubeIndex={selectedTubeIndex}
          hintSourceIndex={hintSourceIndex}
          hintTargetIndex={hintTargetIndex}
          ballSkin={profile.selectedSkin}
          tubeSkin={profile.selectedTubeSkin}
          onTubeSelect={handleTubeSelect}
        />
      </main>
        </>
      )}

      {showAdDebug && <AdDebugPanel onClose={() => setShowAdDebug(false)} />}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-xl bg-slate-800 text-white text-xs border border-white/20 shadow-lg">{toast}</div>
      )}

      {stuck && !showFailedModal && !showVictoryModal && !showDailyVictory && screen === 'game' && (
        <div className="fixed top-[158px] left-1/2 -translate-x-1/2 z-[55] w-[calc(100%-1.5rem)] max-w-sm rounded-2xl bg-slate-900/95 border border-amber-400/40 shadow-xl px-3 py-1.5 flex items-center gap-3 animate-in fade-in duration-200">
          <span className="text-xl" aria-hidden>🧩</span>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-xs font-bold text-white leading-tight">Can't be solved from here</div>
            <div className="text-[10px] text-slate-400 leading-tight">Rewind is free</div>
          </div>
          <button onClick={handleRewind} className="shrink-0 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs px-3 py-2 active:scale-95 transition-transform">Rewind</button>
          <button onClick={() => setStuck(false)} aria-label="Dismiss" className="shrink-0 text-slate-400 text-lg leading-none px-1">×</button>
        </div>
      )}

      {adNotice && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-xl bg-slate-800 text-white text-xs border border-white/20 shadow-lg">
          {adNotice}
        </div>
      )}

      {/* Mobile-Compliant Bottom Banner Ad */}
      <BannerAd />

      {/* MODALS */}
      {/* 2. Victory Modal */}
      <VictoryModal
        isOpen={showVictoryModal && screen === 'game'}
        levelNumber={currentLevel}
        movesCount={movesCount}
        timeSeconds={timeSeconds}
        targetMoves={targetMoves}
        scoreEarned={lastScoreEarned}
        starsEarned={lastStarsEarned}
        coinsEarned={lastRewards.coins}
        xpEarned={lastRewards.xp}
        unlocked={lastRewards.unlocked}
        leveledUpTo={lastRewards.leveledUpTo}
        onNextLevelWithAd={handleNextLevelWithAd}
        onReplay={handleReset}
        onDoubleScoreWithAd={handleDoubleScoreWithAd}
      />

      <DailyVictoryModal
        isOpen={showDailyVictory && screen === 'game' && mode === 'daily'}
        date={dailyCfg?.date ?? ''}
        difficulty={dailyCfg?.difficulty ?? ''}
        movesCount={movesCount}
        timeSeconds={timeSeconds}
        targetMoves={targetMoves}
        starsEarned={lastStarsEarned}
        result={dailyResult}
        counted={!!dailyCfg && dailyCfg.date === todayUTC()}
        hasLeaderboard={hasDailyLeaderboard()}
        onLeaderboard={() => { showDailyLeaderboard(); }}
        onPlayAgain={handleReset}
        onHome={() => { setShowDailyVictory(false); goHome(); }}
      />

      {/* 3. Level Failed / Deadlock Modal with Revive Ads & Retry */}
      <FailedModal
        isOpen={showFailedModal && screen === 'game'}
        levelNumber={currentLevel}
        label={mode === 'daily' ? 'Daily' : undefined}
        onRetry={() => {
          setShowFailedModal(false);
          handleReset();
        }}
        watchRewardedAd={watchRewardedAd}
        onWatchAdForTube={handleReviveWithTube}
        onWatchAdForUndo={handleReviveWithUndo}
      />

      {/* 5. Global Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        playerProfile={profile}
        progress={progress}
        onProfileUpdated={(updated) => setProfile(updated)}
        onSyncCloud={syncCloud}
      />

      {/* 6. Themes & Ball Skins Modal */}
      <SkinsModal
        isOpen={showSkinsModal}
        onClose={() => setShowSkinsModal(false)}
        playerProfile={profile}
        onUpdateSkin={(skin) => {
          const updated = { ...profile, selectedSkin: skin };
          trackStyleChange();
          setProfile(updated);
          savePlayerProfile(updated);
        }}
        onUpdateTubeSkin={(tubeSkin) => {
          const updated = { ...profile, selectedTubeSkin: tubeSkin };
          trackStyleChange();
          setProfile(updated);
          savePlayerProfile(updated);
        }}
        onUpdateTheme={(theme) => {
          const updated = { ...profile, selectedTheme: theme };
          trackStyleChange();
          setProfile(updated);
          savePlayerProfile(updated);
        }}
      />

      {/* 7. Level Map & Select Modal */}
      <LevelSelectModal
        isOpen={showLevelSelectModal}
        onClose={() => setShowLevelSelectModal(false)}
        currentLevel={currentLevel}
        highestUnlockedLevel={profile.currentLevel}
        levelStars={progress.levelStars}
        onSelectLevel={(lvl) => {
          setCurrentLevel(lvl);
          loadLevel(lvl);
          if (screen === 'home') goGame();
        }}
      />

      {/* Rewards: XP level, coins, gems, achievements, shop */}
      <RewardsModal
        isOpen={showRewardsModal}
        onClose={() => setShowRewardsModal(false)}
        progress={progress}
        onBuy={handleBuy}
      />

      {/* 8. Android App & APK Modal */}
      <AndroidInstallModal
        isOpen={showAndroidInstallModal}
        onClose={() => setShowAndroidInstallModal(false)}
      />
    </div>
  );
}
