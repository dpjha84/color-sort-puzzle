import React, { useState } from 'react';
import { X, Smartphone, Download, Check, Copy, Terminal, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { soundManager } from '../utils/audio';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyCommand = (cmd: string, stepIndex: number) => {
    soundManager.playClick();
    navigator.clipboard.writeText(cmd);
    setCopiedStep(stepIndex);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const handleInstallClick = async () => {
    soundManager.playClick();
    if (isInstallable) {
      await install();
    } else {
      alert(
        'To install directly on Android Chrome:\n1. Tap the 3 dots (⋮) in the top right.\n2. Tap "Install App" or "Add to Home screen".'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-extrabold text-base">Android App Hub</h2>
              <p className="text-[11px] text-slate-400">Play locally or build native APK / AAB</p>
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
          {/* Method 1: Instant 1-Tap Android Install (PWA / TWA) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                  Instant Mobile Install
                </span>
                <h3 className="text-sm font-extrabold text-white mt-1">
                  1-Tap Install to Android Phone
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Runs full-screen with offline caching, high frame rate, and no browser address bar.
                </p>
              </div>
            </div>

            <div className="mt-3">
              {isInstalled ? (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  <Check className="w-4 h-4" />
                  <span>Already installed on this device in Standalone mode!</span>
                </div>
              ) : (
                <button
                  onClick={handleInstallClick}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>{isInstallable ? 'Install Android App Now' : 'Add to Android Home Screen'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Method 2: Native Android Studio / Gradle APK */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Terminal className="w-4 h-4" />
                <span>Native Android Studio Project (Capacitor)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Full native Android project files are configured in <code className="text-slate-200">/android/</code> with package <code className="text-slate-200">com.colorsort.odyssey</code>, AdMob App ID, and portrait orientation lock.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <div className="text-[10px] text-slate-400">Step 1: Sync Web Build to Android</div>
                  <code className="text-emerald-300 font-mono text-[11px]">npx cap sync android</code>
                </div>
                <button
                  onClick={() => copyCommand('npx cap sync android', 1)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 shrink-0"
                >
                  {copiedStep === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <div className="text-[10px] text-slate-400">Step 2: Open in Android Studio & Run APK</div>
                  <code className="text-emerald-300 font-mono text-[11px]">npx cap open android</code>
                </div>
                <button
                  onClick={() => copyCommand('npx cap open android', 2)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 shrink-0"
                >
                  {copiedStep === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <div className="text-[10px] text-slate-400">Step 3: Build Signed Release APK / AAB</div>
                  <code className="text-emerald-300 font-mono text-[11px]">cd android &amp;&amp; ./gradlew assembleRelease</code>
                </div>
                <button
                  onClick={() => copyCommand('cd android && ./gradlew assembleRelease', 3)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 shrink-0"
                >
                  {copiedStep === 3 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-white/10 flex items-center justify-end">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
