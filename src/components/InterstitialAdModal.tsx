import React, { useState, useEffect } from 'react';
import { X, Star, Download, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface InterstitialAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
  levelNumber?: number;
}

export const InterstitialAdModal: React.FC<InterstitialAdModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
  levelNumber = 1,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [adAudioMuted, setAdAudioMuted] = useState(false);
  const [interactiveState, setInteractiveState] = useState({
    pin1Pulled: false,
    pin2Pulled: false,
    treasureSaved: false,
    tapsCount: 0,
  });

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(5);
      setCanSkip(false);
      setInteractiveState({
        pin1Pulled: false,
        pin2Pulled: false,
        treasureSaved: false,
        tapsCount: 0,
      });
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        if (prev <= 3) {
          setCanSkip(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePullPin = (pinId: 1 | 2) => {
    soundManager.playPop(650);
    soundManager.triggerHaptic(20);

    if (pinId === 1) {
      setInteractiveState((prev) => ({
        ...prev,
        pin1Pulled: true,
        tapsCount: prev.tapsCount + 1,
      }));
    } else {
      setInteractiveState((prev) => ({
        ...prev,
        pin2Pulled: true,
        treasureSaved: true,
        tapsCount: prev.tapsCount + 1,
      }));
      soundManager.playVictory();
    }
  };

  const handleSkipOrClose = () => {
    soundManager.playClick();
    onClose();
    onCompleted();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl select-none animate-in fade-in duration-200">
      {/* Top Ad Control Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950">
            Ad
          </span>
          <span className="text-xs text-slate-300 font-medium">
            {secondsRemaining > 0 ? `Reward in ${secondsRemaining}s` : 'Reward granted!'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAdAudioMuted(!adAudioMuted)}
            className="text-slate-400 hover:text-white"
          >
            {adAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {canSkip ? (
            <button
              onClick={handleSkipOrClose}
              className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-full active:scale-95 transition-transform"
            >
              <span>Skip Ad</span>
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="w-7 h-7 rounded-full border-2 border-white/30 border-t-amber-400 animate-spin flex items-center justify-center text-[10px] font-bold text-white">
              {secondsRemaining}
            </div>
          )}
        </div>
      </div>

      {/* Main Interactive Ad Canvas (Engaging Playable Mini Game) */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full text-center">
        {/* Playable Game Banner */}
        <div className="relative w-full aspect-4/3 rounded-3xl bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-900 border-2 border-indigo-500/30 overflow-hidden shadow-2xl flex flex-col justify-between p-4">
          <div className="flex items-center justify-between text-left">
            <div>
              <div className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>INTERACTIVE DEMO</span>
              </div>
              <h3 className="text-lg font-extrabold text-white">Rescue the Dragon King!</h3>
            </div>
            <div className="bg-amber-500/20 px-2 py-1 rounded-lg text-amber-300 text-xs font-bold border border-amber-400/30">
              TAP TO PLAY
            </div>
          </div>

          {/* Interactive Playable Area: Pull Pins */}
          <div className="relative my-auto flex flex-col items-center justify-center py-4">
            {interactiveState.treasureSaved ? (
              <div className="flex flex-col items-center gap-2 animate-bounce">
                <span className="text-5xl">👑💎🎉</span>
                <span className="text-emerald-400 font-extrabold text-lg">TREASURE SAVED!</span>
                <span className="text-white/80 text-xs">You solved the puzzle!</span>
              </div>
            ) : (
              <div className="relative w-64 h-40 bg-slate-900/80 rounded-2xl border border-white/20 p-3 flex flex-col justify-between">
                {/* Top: Water Tank */}
                <div className="flex items-center justify-between">
                  <div className="text-2xl animate-pulse">🌊💧</div>
                  {!interactiveState.pin1Pulled ? (
                    <button
                      onClick={() => handlePullPin(1)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg animate-pulse"
                    >
                      PULL PIN 1 🔑
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-bold">PIN 1 OPEN!</span>
                  )}
                </div>

                {/* Middle Divider */}
                <div className="w-full h-1 bg-amber-400/50 rounded-full" />

                {/* Bottom: Hero & Lava */}
                <div className="flex items-center justify-between">
                  <div className="text-3xl">🤴</div>
                  {!interactiveState.pin2Pulled ? (
                    <button
                      onClick={() => handlePullPin(2)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg"
                    >
                      PULL PIN 2 🗝️
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-bold">SAVED!</span>
                  )}
                  <div className="text-2xl">🔥🌋</div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Callout */}
          <div className="text-[11px] text-slate-400">
            {interactiveState.treasureSaved ? 'Great job! Install to play 500+ levels!' : 'Pull the pins in the correct order to save the king!'}
          </div>
        </div>

        {/* App Store Card Bottom Block */}
        <div className="w-full mt-4 bg-slate-900/90 rounded-2xl p-3 border border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-left">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-2xl shadow-md">
              🏰
            </div>
            <div>
              <h4 className="text-white font-bold text-sm leading-tight">Royal Hero Rescue 3D</h4>
              <div className="flex items-center gap-1 text-amber-400 text-xs mt-0.5">
                <Star className="w-3 h-3 fill-amber-400" />
                <span className="font-bold text-white text-[11px]">4.9</span>
                <span className="text-slate-400 text-[10px]">(2.4M reviews)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              alert('Redirecting to App Store simulation! Thank you for trying the demo.');
            }}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>GET</span>
          </button>
        </div>
      </div>

      {/* Bottom Dismiss if timer finished */}
      {canSkip && (
        <div className="p-4 bg-slate-900/60 border-t border-white/10 flex items-center justify-center">
          <button
            onClick={handleSkipOrClose}
            className="w-full max-w-md py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl active:scale-95 transition-transform"
          >
            Continue to Next Level
          </button>
        </div>
      )}
    </div>
  );
};
