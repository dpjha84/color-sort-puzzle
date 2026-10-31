import React, { useMemo } from 'react';
import { Tube, BallSkin, TubeSkin } from '../types/game';
import { TubeView } from './TubeView';

interface GameBoardProps {
  tubes: Tube[];
  selectedTubeIndex: number | null;
  hintSourceIndex: number | null;
  hintTargetIndex: number | null;
  ballSkin: BallSkin;
  tubeSkin: TubeSkin;
  onTubeSelect: (index: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  tubes,
  selectedTubeIndex,
  hintSourceIndex,
  hintTargetIndex,
  ballSkin,
  tubeSkin,
  onTubeSelect,
}) => {
  const totalTubes = tubes.length;

  // Split tubes into 1 or 2 rows for ergonomic mobile viewport
  const { row1, row2, ballSize } = useMemo(() => {
    let size = 48;
    if (totalTubes <= 4) {
      size = 52;
      return {
        row1: tubes,
        row2: [],
        ballSize: size,
      };
    } else if (totalTubes <= 6) {
      size = 46;
      const mid = Math.ceil(totalTubes / 2);
      return {
        row1: tubes.slice(0, mid),
        row2: tubes.slice(mid),
        ballSize: size,
      };
    } else if (totalTubes <= 8) {
      size = 42;
      const mid = Math.ceil(totalTubes / 2);
      return {
        row1: tubes.slice(0, mid),
        row2: tubes.slice(mid),
        ballSize: size,
      };
    } else {
      size = 38;
      const mid = Math.ceil(totalTubes / 2);
      return {
        row1: tubes.slice(0, mid),
        row2: tubes.slice(mid),
        ballSize: size,
      };
    }
  }, [tubes, totalTubes]);

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-2 px-2 select-none overflow-y-auto">
      {/* Row 1 */}
      <div className="flex items-end justify-center flex-wrap gap-2.5 sm:gap-4 md:gap-6 my-1">
        {row1.map((tube, i) => {
          const actualIndex = i;
          return (
            <TubeView
              key={tube.id}
              tube={tube}
              index={actualIndex}
              isSelectedSource={selectedTubeIndex === actualIndex}
              isHintSource={hintSourceIndex === actualIndex}
              isHintTarget={hintTargetIndex === actualIndex}
              ballSkin={ballSkin}
              tubeSkin={tubeSkin}
              ballSize={ballSize}
              onSelect={onTubeSelect}
            />
          );
        })}
      </div>

      {/* Row 2 (if any) */}
      {row2.length > 0 && (
        <div className="flex items-end justify-center flex-wrap gap-2.5 sm:gap-4 md:gap-6 mt-2 mb-1">
          {row2.map((tube, i) => {
            const actualIndex = row1.length + i;
            return (
              <TubeView
                key={tube.id}
                tube={tube}
                index={actualIndex}
                isSelectedSource={selectedTubeIndex === actualIndex}
                isHintSource={hintSourceIndex === actualIndex}
                isHintTarget={hintTargetIndex === actualIndex}
                ballSkin={ballSkin}
                tubeSkin={tubeSkin}
                ballSize={ballSize}
                onSelect={onTubeSelect}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
