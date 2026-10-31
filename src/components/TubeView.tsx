import React from 'react';
import { Tube, BallSkin, TubeSkin } from '../types/game';
import { BallView } from './BallView';
import { Sparkles, ArrowDown, ArrowUp } from 'lucide-react';

interface TubeViewProps {
  tube: Tube;
  index: number;
  isSelectedSource: boolean;
  isHintSource?: boolean;
  isHintTarget?: boolean;
  ballSkin?: BallSkin;
  tubeSkin?: TubeSkin;
  ballSize?: number;
  onSelect: (index: number) => void;
}

export const TubeView: React.FC<TubeViewProps> = ({
  tube,
  index,
  isSelectedSource,
  isHintSource = false,
  isHintTarget = false,
  ballSkin = 'neon',
  tubeSkin = 'glass',
  ballSize = 48,
  onSelect,
}) => {
  const maxCapacity = tube.maxCapacity;
  const balls = tube.balls;
  const isFull = balls.length >= maxCapacity;
  const isComplete = tube.isComplete;

  // Tube height calculation: based on capacity + rim headroom + bottom padding
  const tubeHeight = ballSize * maxCapacity + 28;
  const tubeWidth = ballSize + 16;

  // The lifted ball (if this tube is selected as the source, the top ball floats above the tube)
  const hasLiftedBall = isSelectedSource && balls.length > 0;
  const restingBalls = hasLiftedBall ? balls.slice(0, balls.length - 1) : balls;
  const liftedBall = hasLiftedBall ? balls[balls.length - 1] : null;

  return (
    <div
      onClick={() => onSelect(index)}
      className="relative flex flex-col items-center cursor-pointer group touch-manipulation select-none active:scale-[0.98] transition-transform"
      style={{
        width: `${tubeWidth}px`,
      }}
      role="button"
      tabIndex={0}
      aria-label={`Tube ${index + 1}, contains ${balls.length} of ${maxCapacity} balls`}
    >
      {/* Hint Indicator Overlay */}
      {isHintSource && (
        <div className="absolute -top-12 z-30 flex flex-col items-center animate-bounce">
          <div className="bg-amber-400 text-amber-950 text-[11px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-0.5">
            <ArrowUp className="w-3 h-3" />
            <span>PICK</span>
          </div>
        </div>
      )}

      {isHintTarget && (
        <div className="absolute -top-12 z-30 flex flex-col items-center animate-bounce">
          <div className="bg-emerald-400 text-emerald-950 text-[11px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-0.5">
            <ArrowDown className="w-3 h-3" />
            <span>DROP</span>
          </div>
        </div>
      )}

      {/* Lifted Ball Zone (Floats smoothly above the beaker mouth) */}
      <div
        className="relative z-20 flex items-center justify-center pointer-events-none"
        style={{
          height: `${ballSize + 16}px`,
          marginBottom: '-8px',
        }}
      >
        {liftedBall && (
          <div className="animate-float-slow transform -translate-y-2">
            <BallView
              color={liftedBall.color}
              skin={ballSkin}
              size={ballSize}
              isSelected={true}
            />
          </div>
        )}
      </div>

      {/* Glass Tube Container */}
      <div
        className={`relative flex flex-col justify-end items-center rounded-b-3xl border transition-all duration-200 ${
          isSelectedSource
            ? 'ring-2 ring-amber-400/90 shadow-[0_0_24px_rgba(251,191,36,0.35)] border-amber-300/80'
            : isHintSource
            ? 'ring-2 ring-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.4)] border-amber-400'
            : isHintTarget
            ? 'ring-2 ring-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.4)] border-emerald-400'
            : isComplete
            ? 'border-emerald-400/50 shadow-[0_0_16px_rgba(52,211,153,0.25)]'
            : 'border-white/30 hover:border-white/60'
        } ${
          tubeSkin === 'neon'
            ? 'bg-slate-900/60 backdrop-blur-md shadow-[0_0_15px_rgba(99,102,241,0.25)]'
            : tubeSkin === 'flask'
            ? 'bg-slate-800/40 backdrop-blur-md rounded-t-lg'
            : 'glass-tube backdrop-blur-md'
        }`}
        style={{
          width: `${tubeWidth}px`,
          height: `${tubeHeight}px`,
          paddingBottom: '10px',
        }}
      >
        {/* Beaker Rim / Lip */}
        <div
          className={`absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full border border-white/40 z-10 ${
            tubeSkin === 'neon'
              ? 'bg-indigo-500/30 border-indigo-300'
              : 'glass-tube-rim'
          }`}
          style={{
            width: `${tubeWidth + 6}px`,
            height: '7px',
          }}
        />

        {/* Graduated Measurement Markings on the glass side */}
        <div className="absolute left-1.5 top-6 bottom-6 flex flex-col justify-between pointer-events-none opacity-40">
          <div className="w-2.5 h-[1.5px] bg-white/70" />
          <div className="w-1.5 h-[1.5px] bg-white/50" />
          <div className="w-2.5 h-[1.5px] bg-white/70" />
          <div className="w-1.5 h-[1.5px] bg-white/50" />
          <div className="w-2.5 h-[1.5px] bg-white/70" />
        </div>

        {/* Vertical Glass Specular Highlight (Reflection stripe) */}
        <div
          className="absolute right-2 top-2 bottom-4 w-1 rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 80%)',
          }}
        />

        {/* Stacked Balls inside the tube (Bottom to Top) */}
        <div className="relative z-10 flex flex-col-reverse items-center justify-start w-full gap-1.5">
          {restingBalls.map((ball) => (
            <div
              key={ball.id}
              className="transform transition-transform duration-200 active:scale-95"
            >
              <BallView
                color={ball.color}
                skin={ballSkin}
                size={ballSize}
              />
            </div>
          ))}

          {/* Empty Slot Guides (ghost dots if needed, very subtle) */}
          {Array.from({ length: maxCapacity - balls.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              style={{ width: `${ballSize}px`, height: `${ballSize}px` }}
              className="shrink-0 rounded-full border border-dashed border-white/10 opacity-30 flex items-center justify-center pointer-events-none"
            />
          ))}
        </div>

        {/* Completed Tube Stamp / Cap */}
        {isComplete && (
          <div className="absolute inset-0 rounded-b-3xl bg-emerald-500/10 pointer-events-none flex flex-col items-center justify-start pt-3">
            <div className="bg-emerald-500/90 text-white rounded-full p-1 shadow-lg shadow-emerald-500/40 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>

      {/* Tube Base / Ground Plate shadow */}
      <div
        className="h-2 rounded-full bg-black/40 blur-xs mt-1 pointer-events-none"
        style={{
          width: `${tubeWidth * 0.9}px`,
        }}
      />
    </div>
  );
};
