import React from 'react';
import { BallColor, BallSkin } from '../types/game';
import { getColorDetails, EMOJI_MAP, PLANET_MAP, SPORTS_MAP } from '../utils/levels';

interface BallViewProps {
  color: BallColor;
  skin?: BallSkin;
  isSelected?: boolean;
  size?: number; // pixel diameter
  className?: string;
}

export const BallView: React.FC<BallViewProps> = ({
  color,
  skin = 'neon',
  isSelected = false,
  size = 52,
  className = '',
}) => {
  const colorDetails = getColorDetails(color);

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      className={`relative rounded-full shrink-0 flex items-center justify-center transition-all duration-200 ${
        isSelected
          ? 'scale-110 shadow-[0_0_18px_rgba(255,255,255,0.7)] ring-2 ring-white/90 z-20'
          : 'shadow-[0_4px_10px_rgba(0,0,0,0.45)]'
      } ${className}`}
    >
      {/* 3D Sphere Base with Radial Gradient */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background: colorDetails.gradient,
        }}
      >
        {/* Specular Glare / Rim Light (Top-Left Highlight) */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            top: '8%',
            left: '14%',
            width: '42%',
            height: '32%',
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)',
            transform: 'rotate(-25deg)',
          }}
        />

        {/* Secondary Ambient Rim (Bottom-Right Bounce Light) */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            bottom: '6%',
            right: '8%',
            width: '50%',
            height: '40%',
            background: 'radial-gradient(circle at center, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 80%)',
          }}
        />

        {/* Inner Crease Shadow */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: 'inset 0 -3px 6px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.4)',
          }}
        />
      </div>

      {/* Skin Embellishments */}
      {skin === 'emoji' && (
        <span
          className="relative z-10 select-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
          style={{ fontSize: `${size * 0.44}px` }}
        >
          {EMOJI_MAP[color]}
        </span>
      )}

      {skin === 'planet' && (
        <div className="relative z-10 flex flex-col items-center select-none pointer-events-none">
          <span style={{ fontSize: `${size * 0.44}px` }}>{PLANET_MAP[color].icon}</span>
        </div>
      )}

      {skin === 'sports' && (
        <span
          className="relative z-10 select-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
          style={{ fontSize: `${size * 0.44}px` }}
        >
          {SPORTS_MAP[color]}
        </span>
      )}

      {skin === 'neon' && (
        /* Subtle gemstone facet sheen */
        <div className="relative z-10 w-2 h-2 rounded-full bg-white/70 blur-[0.5px] pointer-events-none" />
      )}
    </div>
  );
};
