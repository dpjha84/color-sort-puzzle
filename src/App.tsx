import { useState, useEffect, useCallback, useRef } from 'react';
import { Tube, Move, BallSkin, TubeSkin, BackgroundTheme, PlayerProfile, RewardType } from './types/game';
import { generateLevel } from './utils/levels';
import { isBoardSolved, isTubeCompleted, getValidMoves, findBestHint } from './utils/solver';
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
import { LeaderboardModal } from './components/LeaderboardModal';
import { SkinsModal } from './components/SkinsModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { BannerAd } from './components/BannerAd';
import { AndroidInstallModal } from './components/AndroidInstallModal';

export default function App() {
  // Player Profile & Preferences
  const [profile, setProfile] = useState<PlayerProfile>(getPlayerProfile);
  const [isMuted, setIsMuted] = useState(false);

  // Game Play State
  const [currentLevel, setCurrentLevel] = useState(() => profile.currentLevel || 1);
  const [tubes, setTubes] = useState<Tube[]>([]);
  const [selectedTubeIndex, setSelectedTubeIndex] = useState<number | null>(null);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [movesCount, setMovesCount] = useState(0);
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
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showSkinsModal, setShowSkinsModal] = useState(false);
  const [showLevelSelectModal, setShowLevelSelectModal] = useState(false);
  const [showAndroidInstallModal, setShowAndroidInstallModal] = useState(false);

  // Victory score tracking
  const [lastScoreEarned, setLastScoreEarned] = useState(500);
  const [lastStarsEarned, setLastStarsEarned] = useState(3);

  // Initial Level Setup
  const loadLevel = useCallback((lvl: number) => {
    const config = generateLevel(lvl);
    const initialTubes: Tube[] = config.initialTubes.map((ballColors, idx) => ({
      id: idx,
      balls: ballColors.map((color, bIdx) => ({
        id: `tube-${idx}-ball-${bIdx}-${Math.random()}`,
        color,
      })),
      maxCapacity: 4,
      isComplete: isTubeCompleted(ballColors, 4, config.initialTubes),
    }));

    setTubes(initialTubes);
    setSelectedTubeIndex(null);
    setMoveHistory([]);
    setMovesCount(0);
    setTargetMoves(config.targetMoves);
    setTimeSeconds(0);
    setIsGameActive(true);
    setAddedTubeThisRound(false);
    setHintSourceIndex(null);
    setHintTargetIndex(null);
    setShowVictoryModal(false);
    setShowFailedModal(false);
  }, []);

  // Timer loop
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isGameActive && !showVictoryModal && !showFailedModal) {
      timerRef.current = setInterval(() => {
        setTimeSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGameActive, showVictoryModal, showFailedModal]);

  // Resume at the player's saved level on app start (runs once)
  useEffect(() => {
    loadLevel(currentLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadLevel]);

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
      const { levelScore, profile: updatedProfile } = updatePlayerScoreOnWin(
        currentLevel,
        movesCount + 1,
        timeSeconds,
        stars
      );
      setLastScoreEarned(levelScore);
      setProfile(updatedProfile);

      soundManager.playVictory();
      soundManager.triggerHaptic(50);

      setTimeout(() => {
        setShowVictoryModal(true);
      }, 250);
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

    if (newTubes[tubeIndex].isComplete) {
      soundManager.playTubeComplete();
      soundManager.triggerHaptic(35);
    }

    soundManager.playDrop(targetTube.balls.length + 1);
    soundManager.triggerHaptic(15);

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
    const hint = findBestHint(rawColors, 4);

    if (hint) {
      soundManager.playPop(700);
      soundManager.triggerHaptic(30);
      setHintSourceIndex(hint.fromIndex);
      setHintTargetIndex(hint.toIndex);

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
    adMobManager.showRewarded(onReward, () => {
      setAdNotice('No ad available right now. Please try again in a moment.');
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
  const handleNextLevelWithAd = () => {
    setShowVictoryModal(false);
    adMobManager.showInterstitial(handleInterstitialAdCompleted);
  };

  const handleInterstitialAdCompleted = () => {
    const nextLvl = currentLevel + 1;
    setCurrentLevel(nextLvl);
    loadLevel(nextLvl);
  };

  const handleDoubleScoreWithAd = () => {
    const updatedProfile: PlayerProfile = {
      ...profile,
      totalScore: profile.totalScore + lastScoreEarned,
    };
    setProfile(updatedProfile);
    savePlayerProfile(updatedProfile);
    setShowVictoryModal(false);
    adMobManager.showInterstitial(handleInterstitialAdCompleted);
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
      className={`min-h-screen w-full flex flex-col justify-between overflow-hidden ${getThemeClass(
        profile.selectedTheme
      )} transition-colors duration-500`}
    >
      {/* Top Header & Ergonomic Tools */}
      <Header
        levelNumber={currentLevel}
        movesCount={movesCount}
        targetMoves={targetMoves}
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
        onOpenLeaderboard={() => {
          soundManager.playClick();
          setShowLeaderboardModal(true);
        }}
        onOpenSkins={() => {
          soundManager.playClick();
          setShowSkinsModal(true);
        }}
        onOpenLevelSelect={() => {
          soundManager.playClick();
          setShowLevelSelectModal(true);
        }}
        onOpenAndroidInstall={() => {
          soundManager.playClick();
          setShowAndroidInstallModal(true);
        }}
      />

      {/* Main Interactive Tube Canvas */}
      <main className="flex-1 w-full flex flex-col items-center justify-center p-2 relative">
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
        isOpen={showVictoryModal}
        levelNumber={currentLevel}
        movesCount={movesCount}
        timeSeconds={timeSeconds}
        targetMoves={targetMoves}
        scoreEarned={lastScoreEarned}
        starsEarned={lastStarsEarned}
        onNextLevelWithAd={handleNextLevelWithAd}
        onReplay={handleReset}
        onDoubleScoreWithAd={handleDoubleScoreWithAd}
      />

      {/* 3. Level Failed / Deadlock Modal with Revive Ads & Retry */}
      <FailedModal
        isOpen={showFailedModal}
        levelNumber={currentLevel}
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
        onProfileUpdated={(updated) => setProfile(updated)}
      />

      {/* 6. Themes & Ball Skins Modal */}
      <SkinsModal
        isOpen={showSkinsModal}
        onClose={() => setShowSkinsModal(false)}
        playerProfile={profile}
        onUpdateSkin={(skin) => {
          const updated = { ...profile, selectedSkin: skin };
          setProfile(updated);
          savePlayerProfile(updated);
        }}
        onUpdateTubeSkin={(tubeSkin) => {
          const updated = { ...profile, selectedTubeSkin: tubeSkin };
          setProfile(updated);
          savePlayerProfile(updated);
        }}
        onUpdateTheme={(theme) => {
          const updated = { ...profile, selectedTheme: theme };
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
        onSelectLevel={(lvl) => {
          setCurrentLevel(lvl);
          loadLevel(lvl);
        }}
      />

      {/* 8. Android App & APK Modal */}
      <AndroidInstallModal
        isOpen={showAndroidInstallModal}
        onClose={() => setShowAndroidInstallModal(false)}
      />
    </div>
  );
}
