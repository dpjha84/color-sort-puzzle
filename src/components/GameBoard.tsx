import React, { useMemo, useRef, useState, useCallback } from 'react';
import { Tube, BallSkin, TubeSkin } from '../types/game';
import { TubeView } from './TubeView';
import { BallView } from './BallView';

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

  // ---- Drag & drop (pointer events: works for touch and mouse). Taps still work as before. ----
  const DRAG_THRESHOLD = 10; // px before a press becomes a drag
  const latest = useRef({ tubes, selectedTubeIndex, onTubeSelect });
  latest.current = { tubes, selectedTubeIndex, onTubeSelect };
  const press = useRef<{ idx: number; x: number; y: number; id: number; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [drag, setDrag] = useState<{ src: number; x: number; y: number; hover: number | null } | null>(null);

  const tubeAt = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y)?.closest('[data-tube-index]') as HTMLElement | null;
    return el ? Number(el.dataset.tubeIndex) : null;
  };

  const endPress = useCallback((cancelled: boolean, x: number, y: number) => {
    const p = press.current;
    press.current = null;
    if (!p || !p.dragging) return;
    const { onTubeSelect: select, selectedTubeIndex: sel } = latest.current;
    const target = cancelled ? null : tubeAt(x, y);
    suppressClick.current = true;
    setTimeout(() => (suppressClick.current = false), 350);
    setDrag(null);
    if (sel === null) return;
    if (target !== null && target !== p.idx) select(target); // valid -> moves, invalid -> error + deselect
    else select(p.idx); // dropped back / outside -> put the ball back
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const idx = tubeAt(e.clientX, e.clientY);
    if (idx === null) return;
    const { tubes: ts, selectedTubeIndex: sel } = latest.current;
    const tube = ts[idx];
    if (!tube || tube.balls.length === 0 || tube.isComplete) return;
    if (sel !== null && sel !== idx) return; // a tap-move is in progress: keep tap behaviour
    press.current = { idx, x: e.clientX, y: e.clientY, id: e.pointerId, dragging: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    if (!p.dragging) {
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < DRAG_THRESHOLD) return;
      p.dragging = true;
      try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
      // lift the ball (same as tapping the tube) unless it is already lifted
      if (latest.current.selectedTubeIndex !== p.idx) latest.current.onTubeSelect(p.idx);
    }
    setDrag({ src: p.idx, x: e.clientX, y: e.clientY, hover: tubeAt(e.clientX, e.clientY) });
  };

  const onPointerUp = (e: React.PointerEvent) => endPress(false, e.clientX, e.clientY);
  const onPointerCancel = (e: React.PointerEvent) => endPress(true, e.clientX, e.clientY);

  const guardedSelect = useCallback((i: number) => {
    if (suppressClick.current) return;
    latest.current.onTubeSelect(i);
  }, []);

  const dragBall = drag ? tubes[drag.src]?.balls[tubes[drag.src].balls.length - 1] : undefined;
  const dropStateFor = (i: number): 'valid' | 'invalid' | null => {
    if (!drag || drag.hover !== i || i === drag.src || !dragBall) return null;
    const dest = tubes[i];
    const full = dest.balls.length >= dest.maxCapacity;
    const ok = !full && (dest.balls.length === 0 || dest.balls[dest.balls.length - 1].color === dragBall.color);
    return ok ? 'valid' : 'invalid';
  };

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
    <div
      className="flex-1 w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-2 px-2 select-none overflow-y-auto"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {drag && dragBall && (
        <div
          className="fixed z-[60] pointer-events-none"
          style={{ left: drag.x - ballSize / 2, top: drag.y - ballSize * 1.3, transform: 'scale(1.1)' }}
        >
          <BallView color={dragBall.color} skin={ballSkin} size={ballSize} isSelected />
        </div>
      )}
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
              isDragSource={drag?.src === actualIndex}
              dropState={dropStateFor(actualIndex)}
              onSelect={guardedSelect}
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
                isDragSource={drag?.src === actualIndex}
                dropState={dropStateFor(actualIndex)}
                onSelect={guardedSelect}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
