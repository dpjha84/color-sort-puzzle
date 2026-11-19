import React, { useMemo, useRef, useState, useCallback, useLayoutEffect, useEffect } from 'react';
import { Tube, BallSkin, TubeSkin, BallColor } from '../types/game';
import { TubeView } from './TubeView';
import { BallView } from './BallView';
import { Burst, BurstKind } from './Burst';
import { getColorDetails } from '../utils/levels';

interface Flight {
  key: number;
  ballId: string;
  color: BallColor;
  sx: number;
  sy: number;
  dx: number;
  dy: number;
  toIdx: number;
  completes: boolean;
}
interface BurstFx {
  key: number;
  x: number;
  y: number;
  colors: string[];
  kind: BurstKind;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A ball in flight: lifts out, arcs over the tubes, lands with a squash and a little rebound. */
const FlyingBall: React.FC<{ f: Flight; size: number; skin: BallSkin; onTouch: (f: Flight) => void; onDone: (f: Flight) => void }> = ({ f, size, skin, onTouch, onDone }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const dist = Math.hypot(f.dx - f.sx, f.dy - f.sy);
    const dur = Math.round(Math.min(520, 340 + dist * 0.22));
    const safety = setTimeout(() => onDone(f), dur + 250); // never leave a ball hidden
    if (!el || typeof el.animate !== 'function') {
      onDone(f);
      return () => clearTimeout(safety);
    }
    const dx = f.dx - f.sx;
    const dy = f.dy - f.sy;
    const apexY = Math.min(0, dy) - size * 1.05;
    const anim = el.animate(
      [
        { transform: 'translate(0px,0px) scale(1,1)', offset: 0, easing: 'cubic-bezier(.25,.1,.4,1)' },
        { transform: `translate(${dx * 0.5}px,${apexY}px) scale(0.94,1.1)`, offset: 0.42, easing: 'cubic-bezier(.55,0,.9,.55)' },
        { transform: `translate(${dx}px,${dy}px) scale(1.2,0.8)`, offset: 0.72, easing: 'cubic-bezier(.2,.8,.4,1)' },
        { transform: `translate(${dx}px,${dy - size * 0.16}px) scale(0.94,1.07)`, offset: 0.87, easing: 'cubic-bezier(.5,0,.9,.6)' },
        { transform: `translate(${dx}px,${dy}px) scale(1,1)`, offset: 1 },
      ],
      { duration: dur, fill: 'forwards' },
    );
    const touch = setTimeout(() => onTouch(f), Math.round(dur * 0.72)); // first touch-down: thud + sparkles
    anim.onfinish = () => onDone(f);
    return () => {
      clearTimeout(safety);
      clearTimeout(touch);
      try { anim.cancel(); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      ref={ref}
      className="fixed z-[58] pointer-events-none"
      style={{ left: f.sx - size / 2, top: f.sy - size / 2, width: size, height: size, transformOrigin: '50% 100%', willChange: 'transform' }}
    >
      <BallView color={f.color} skin={skin} size={size} isSelected />
    </div>
  );
};

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
  const dragFrom = useRef<{ id: string; x: number; y: number; at: number } | null>(null);
  const sizeRef = useRef(40);
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
    // remember where the finger let go, so the ball flies on from there
    const dragged = latest.current.tubes[p.idx]?.balls.slice(-1)[0];
    if (dragged) dragFrom.current = { id: dragged.id, x, y: y - sizeRef.current * 0.8, at: Date.now() };
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

  // Fit the whole board in the space we are given: size the balls from the measured area, so all
  // tubes are visible at once on any screen (no scrolling), whatever the font scale or phone size.
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { row1, row2, ballSize } = useMemo(() => {
    const rows = totalTubes <= 4 ? 1 : 2;
    const perRow = rows === 1 ? totalTubes : Math.ceil(totalTubes / 2);
    let size = totalTubes <= 4 ? 52 : totalTubes <= 6 ? 46 : totalTubes <= 8 ? 42 : 38;
    if (box && box.w > 0 && box.h > 0) {
      const gap = box.w >= 640 ? 16 : 10;
      const byWidth = (box.w - 16 - (perRow - 1) * gap) / perRow - 16; // tube width = ball + 16
      // a tube block = lifted-ball zone (ball+8) + 4 balls + 28 + base shadow (12), i.e. 5 balls + 48
      const byHeight = (box.h - 16 - 8 * (rows - 1) - 48 * rows) / (5 * rows);
      size = Math.min(size + 6, byWidth, byHeight);
    }
    size = Math.max(20, Math.floor(size));
    return {
      row1: rows === 1 ? tubes : tubes.slice(0, perRow),
      row2: rows === 1 ? [] : tubes.slice(perRow),
      ballSize: size,
    };
  }, [tubes, totalTubes, box]);

  sizeRef.current = ballSize;

  // ---- Juice: balls fly between tubes, land with a squash, completed tubes celebrate ----
  const [flights, setFlights] = useState<Flight[]>([]);
  const [bursts, setBursts] = useState<BurstFx[]>([]);
  const [thud, setThud] = useState<Record<number, number>>({});
  const [celebrate, setCelebrate] = useState<Record<number, number>>({});
  const [introTick, setIntroTick] = useState(1);
  const flightsRef = useRef<Flight[]>([]);
  flightsRef.current = flights;
  const landedKeys = useRef(new Set<number>());
  const fxKey = useRef(0);
  const prevRef = useRef<{
    tubes: Tube[];
    sel: number | null;
    tubeOf: Map<string, number>;
    pos: Map<string, { x: number; y: number }>;
  } | null>(null);
  const hiddenIds = useMemo(() => new Set(flights.map((f) => f.ballId)), [flights]);

  const finish = useCallback((f: Flight) => {
    setFlights((cur) => cur.filter((x) => x.key !== f.key));
  }, []);

  const touch = useCallback((f: Flight) => {
    if (landedKeys.current.has(f.key)) return;
    landedKeys.current.add(f.key);
    setThud((t) => ({ ...t, [f.toIdx]: (t[f.toIdx] || 0) + 1 }));
    const size = sizeRef.current;
    const hex = getColorDetails(f.color).hex;
    const add = (b: Omit<BurstFx, 'key'>) => setBursts((cur) => [...cur.slice(-5), { ...b, key: ++fxKey.current }]);
    if (f.completes) {
      setCelebrate((c) => ({ ...c, [f.toIdx]: (c[f.toIdx] || 0) + 1 }));
      const el = boxRef.current?.querySelector(`[data-tube-index="${f.toIdx}"]`);
      const r = el?.getBoundingClientRect();
      add({ x: r ? r.left + r.width / 2 : f.dx, y: r ? r.top + r.height / 2 : f.dy, colors: [hex, '#ffffff', '#fde68a'], kind: 'sparkle' });
    } else {
      add({ x: f.dx, y: f.dy + size * 0.45, colors: [hex], kind: 'puff' });
    }
  }, []);

  // used when a newer move or a tap supersedes a flight: do the landing effects and drop the overlay
  const land = useCallback((f: Flight) => {
    touch(f);
    finish(f);
  }, [touch, finish]);

  useLayoutEffect(() => {
    const root = boxRef.current;
    if (!root) return;
    const prev = prevRef.current;

    // where every ball is right now
    const pos = new Map<string, { x: number; y: number }>();
    root.querySelectorAll<HTMLElement>('[data-ball-id]').forEach((el) => {
      const r = el.getBoundingClientRect();
      pos.set(el.dataset.ballId as string, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    });
    // a lifted ball is still springing up when we measure, so use its resting lifted position
    if (selectedTubeIndex !== null) {
      const top = tubes[selectedTubeIndex]?.balls.slice(-1)[0];
      const tr = root.querySelector(`[data-tube-index="${selectedTubeIndex}"]`)?.getBoundingClientRect();
      if (top && tr) pos.set(top.id, { x: tr.left + tr.width / 2, y: tr.top + (ballSize + 16) / 2 - 11 });
    }
    const tubeOf = new Map<string, number>();
    tubes.forEach((t, i) => t.balls.forEach((b) => tubeOf.set(b.id, i)));

    if (prev) {
      const tubesChanged = prev.tubes !== tubes;
      if (!tubesChanged) {
        // only the selection changed: let any ball still in the air settle first
        if (prev.sel !== selectedTubeIndex) flightsRef.current.forEach(land);
      } else {
        flightsRef.current.forEach(land); // a newer move supersedes unfinished flights
        const moved: string[] = [];
        let overlap = 0;
        tubeOf.forEach((i, id) => {
          const pi = prev.tubeOf.get(id);
          if (pi === undefined) return;
          overlap++;
          if (pi !== i) moved.push(id);
        });
        if (moved.length === 1 && !prefersReducedMotion()) {
          const id = moved[0];
          const toIdx = tubeOf.get(id) as number;
          const df = dragFrom.current;
          const from = df && df.id === id && Date.now() - df.at < 1500 ? { x: df.x, y: df.y } : prev.pos.get(id);
          const to = pos.get(id);
          const color = tubes[toIdx].balls.find((b) => b.id === id)?.color;
          if (from && to && color && Math.hypot(to.x - from.x, to.y - from.y) > 4) {
            const completes = tubes[toIdx].isComplete && !prev.tubes[toIdx]?.isComplete;
            const fl: Flight = { key: ++fxKey.current, ballId: id, color, sx: from.x, sy: from.y, dx: to.x, dy: to.y, toIdx, completes };
            setFlights((cur) => [...cur, fl]);
          }
        } else if (moved.length > 1 || (overlap === 0 && tubeOf.size > 0)) {
          setIntroTick((t) => t + 1); // a fresh board: tubes bounce in
          setCelebrate({});
        }
      }
    }
    dragFrom.current = null;
    prevRef.current = { tubes, sel: selectedTubeIndex, tubeOf, pos };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tubes, selectedTubeIndex, ballSize]);

  return (
    <div
      ref={boxRef}
      className="flex-1 min-h-0 w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-2 px-2 select-none overflow-hidden"
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
      {flights.map((f) => (
        <FlyingBall key={f.key} f={f} size={ballSize} skin={ballSkin} onTouch={touch} onDone={finish} />
      ))}
      {bursts.map((b) => (
        <Burst
          key={b.key}
          x={b.x}
          y={b.y}
          colors={b.colors}
          kind={b.kind}
          size={ballSize}
          onDone={() => setBursts((cur) => cur.filter((x) => x.key !== b.key))}
        />
      ))}
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
              hiddenBallIds={hiddenIds}
              intro={introTick}
              introDelay={actualIndex * 55}
              thud={thud[actualIndex] || 0}
              celebrate={celebrate[actualIndex] || 0}
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
                hiddenBallIds={hiddenIds}
                intro={introTick}
                introDelay={actualIndex * 55}
                thud={thud[actualIndex] || 0}
                celebrate={celebrate[actualIndex] || 0}
                onSelect={guardedSelect}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
