import React from 'react';
import { X, Check, Sparkles, Paintbrush, FlaskConical, Layout } from 'lucide-react';
import { BallSkin, TubeSkin, BackgroundTheme, PlayerProfile } from '../types/game';
import { BallView } from './BallView';
import { soundManager } from '../utils/audio';

interface SkinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerProfile: PlayerProfile;
  onUpdateSkin: (skin: BallSkin) => void;
  onUpdateTubeSkin: (tubeSkin: TubeSkin) => void;
  onUpdateTheme: (theme: BackgroundTheme) => void;
}

export const SkinsModal: React.FC<SkinsModalProps> = ({
  isOpen,
  onClose,
  playerProfile,
  onUpdateSkin,
  onUpdateTubeSkin,
  onUpdateTheme,
}) => {
  if (!isOpen) return null;

  const ballSkins: { id: BallSkin; title: string; subtitle: string; previewColor: 'red' | 'blue' | 'emerald' | 'amber' }[] = [
    { id: 'neon', title: 'Gemstone Orbs', subtitle: '3D glossy crystal spheres', previewColor: 'red' },
    { id: 'emoji', title: 'Emoji Charms', subtitle: 'Playful cute icons', previewColor: 'amber' },
    { id: 'planet', title: 'Cosmic Planets', subtitle: 'Solar system celestial bodies', previewColor: 'blue' },
    { id: 'sports', title: 'Arcade Sports', subtitle: 'Basketball, soccer & tennis', previewColor: 'emerald' },
  ];

  const tubeSkins: { id: TubeSkin; title: string; subtitle: string }[] = [
    { id: 'glass', title: 'Laboratory Beaker', subtitle: 'Graduated glass test tube' },
    { id: 'neon', title: 'Cyber Cylinder', subtitle: 'Glowing neon energy vial' },
    { id: 'flask', title: 'Alchemist Flask', subtitle: 'Curved magic potion flask' },
  ];

  const themeOptions: { id: BackgroundTheme; title: string; previewClass: string }[] = [
    { id: 'dark-slate', title: 'Dark Slate', previewClass: 'from-slate-950 via-slate-900 to-slate-950' },
    { id: 'midnight-space', title: 'Cosmic Nebula', previewClass: 'from-indigo-950 via-purple-950 to-slate-950' },
    { id: 'wood-table', title: 'Mahogany Tavern', previewClass: 'from-amber-950 via-stone-900 to-neutral-950' },
    { id: 'pastel-light', title: 'Studio Mint', previewClass: 'from-teal-950 via-slate-900 to-emerald-950' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[85vh] rounded-3xl bg-slate-900 border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-white font-extrabold text-sm">Theme & Skin Studio</h2>
              <p className="text-[10px] text-slate-400">Personalize balls, tubes & arena</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Customization Options */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Section 1: Ball Skins */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-2.5">
              <Paintbrush className="w-3.5 h-3.5 text-amber-400" />
              <span>Ball Skins</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {ballSkins.map((skin) => {
                const isSelected = playerProfile.selectedSkin === skin.id;
                return (
                  <button
                    key={skin.id}
                    onClick={() => {
                      soundManager.playPop(580);
                      onUpdateSkin(skin.id);
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400/80 shadow-md ring-1 ring-amber-400/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <BallView color="amber" skin={skin.id} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate flex items-center justify-between">
                        <span>{skin.title}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{skin.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Tube Skins */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-2.5">
              <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tube Styles</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {tubeSkins.map((tube) => {
                const isSelected = playerProfile.selectedTubeSkin === tube.id;
                return (
                  <button
                    key={tube.id}
                    onClick={() => {
                      soundManager.playClick();
                      onUpdateTubeSkin(tube.id);
                    }}
                    className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-400/80 shadow-md ring-1 ring-emerald-400/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-2xl">
                      {tube.id === 'glass' ? '🧪' : tube.id === 'neon' ? '💡' : '🏺'}
                    </div>
                    <div className="text-xs font-bold text-white">{tube.title}</div>
                    {isSelected && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                        ACTIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Arena Ambient Background */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-2.5">
              <Layout className="w-3.5 h-3.5 text-blue-400" />
              <span>Arena Atmosphere</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {themeOptions.map((theme) => {
                const isSelected = playerProfile.selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      soundManager.playClick();
                      onUpdateTheme(theme.id);
                    }}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'bg-blue-500/15 border-blue-400/80 shadow-md ring-1 ring-blue-400/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl bg-gradient-to-br ${theme.previewClass} border border-white/20 shrink-0`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate flex items-center justify-between">
                        <span>{theme.title}</span>
                        {isSelected && <Check className="w-3 h-3 text-blue-400" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
