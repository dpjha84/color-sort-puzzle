import { BallColor, HintMove } from '../types/game';

interface TubeState {
  tubes: BallColor[][];
  firstMove?: HintMove;
}

/**
 * Checks if a tube is completed (all balls in it have the same color,
 * and either it's at max capacity or all balls of that color in the board are in this tube).
 */
export function isTubeCompleted(tube: BallColor[], maxCapacity = 4, allTubes?: BallColor[][]): boolean {
  if (tube.length === 0) return false;
  const first = tube[0];
  if (!tube.every((b) => b === first)) return false;

  if (tube.length === maxCapacity) return true;

  if (allTubes) {
    const hasColorElsewhere = allTubes.some((t) => t !== tube && t.includes(first));
    return !hasColorElsewhere;
  }
  return false;
}

/**
 * Checks if the entire board is solved:
 * 1. No tube has mixed colors
 * 2. Each color present is consolidated into exactly one tube
 * 3. Total balls > 0
 */
export function isBoardSolved(tubes: BallColor[][], maxCapacity = 4): boolean {
  const seenColors = new Set<BallColor>();
  let totalBalls = 0;

  for (const tube of tubes) {
    if (tube.length === 0) continue;
    totalBalls += tube.length;
    const first = tube[0];
    if (!tube.every((b) => b === first)) {
      return false;
    }
    if (seenColors.has(first)) {
      return false;
    }
    seenColors.add(first);
  }

  return totalBalls > 0;
}

/**
 * Gets all legal moves from the current state
 */
export function getValidMoves(tubes: BallColor[][], maxCapacity = 4): HintMove[] {
  if (isBoardSolved(tubes, maxCapacity)) return [];

  const moves: HintMove[] = [];

  for (let from = 0; from < tubes.length; from++) {
    const fromTube = tubes[from];
    if (fromTube.length === 0) continue;
    // Don't move balls out of already completed tubes
    if (isTubeCompleted(fromTube, maxCapacity, tubes)) continue;

    const ballColor = fromTube[fromTube.length - 1];

    for (let to = 0; to < tubes.length; to++) {
      if (from === to) continue;
      const toTube = tubes[to];

      // Destination is full
      if (toTube.length >= maxCapacity) continue;

      // If toTube is empty OR its top ball matches the color of the moving ball
      if (toTube.length === 0 || toTube[toTube.length - 1] === ballColor) {
        // Optimization: don't move from a tube where all balls are already the same color into an empty tube
        if (toTube.length === 0 && fromTube.every((c) => c === ballColor)) {
          continue;
        }

        moves.push({
          fromIndex: from,
          toIndex: to,
          color: ballColor,
        });
      }
    }
  }

  return moves;
}

/**
 * Serializes tubes to a string for state deduplication
 */
function serializeState(tubes: BallColor[][]): string {
  // Sort tubes strings to group equivalent permutations of empty or identical tubes
  return tubes
    .map((t) => t.join(','))
    .sort()
    .join('|');
}

/**
 * Breadth-First Search (BFS) to find the shortest path to a solved state
 * and return the first move to make.
 */
function legacyHint(tubes: BallColor[][], maxCapacity = 4, maxDepth = 2500): HintMove | null {
  if (isBoardSolved(tubes, maxCapacity)) return null;

  const validMoves = getValidMoves(tubes, maxCapacity);
  if (validMoves.length === 0) return null;

  // Prioritize moves that put a ball onto a matching color over moving to an empty tube
  const sortedMoves = [...validMoves].sort((a, b) => {
    const toA = tubes[a.toIndex];
    const toB = tubes[b.toIndex];
    const isMatchingA = toA.length > 0 && toA[toA.length - 1] === a.color ? 1 : 0;
    const isMatchingB = toB.length > 0 && toB[toB.length - 1] === b.color ? 1 : 0;
    return isMatchingB - isMatchingA;
  });

  // BFS Queue
  const queue: TubeState[] = [];
  const visited = new Set<string>();

  const startHash = serializeState(tubes);
  visited.add(startHash);

  for (const move of sortedMoves) {
    const newTubes = tubes.map((t) => [...t]);
    const ball = newTubes[move.fromIndex].pop()!;
    newTubes[move.toIndex].push(ball);

    if (isBoardSolved(newTubes, maxCapacity)) {
      return move;
    }

    const hash = serializeState(newTubes);
    if (!visited.has(hash)) {
      visited.add(hash);
      queue.push({
        tubes: newTubes,
        firstMove: move,
      });
    }
  }

  let iterations = 0;
  while (queue.length > 0 && iterations < maxDepth) {
    iterations++;
    const current = queue.shift()!;

    const nextMoves = getValidMoves(current.tubes, maxCapacity);
    for (const move of nextMoves) {
      const nextTubes = current.tubes.map((t) => [...t]);
      const ball = nextTubes[move.fromIndex].pop()!;
      nextTubes[move.toIndex].push(ball);

      if (isBoardSolved(nextTubes, maxCapacity)) {
        return current.firstMove || move;
      }

      const hash = serializeState(nextTubes);
      if (!visited.has(hash)) {
        visited.add(hash);
        queue.push({
          tubes: nextTubes,
          firstMove: current.firstMove,
        });
      }
    }
  }

  // If BFS didn't reach solved state within depth, return the best local heuristic move
  return sortedMoves[0] || null;
}

// ---------------------------------------------------------------------------------------------
// Weighted A* solver. The plain BFS above gives up on boards with 7+ colours and then falls back to
// a one-step guess, which can bounce a ball back and forth. This search finds a full solution (not
// always the shortest), and the whole path is remembered so successive hints follow one plan.
// ---------------------------------------------------------------------------------------------

/** How far a state is from solved: balls sitting on a different colour, plus split colours. */
function heuristic(tubes: BallColor[][]): number {
  let misplaced = 0;
  const bottoms = new Map<BallColor, number>();
  for (const t of tubes) {
    if (t.length === 0) continue;
    let k = 0;
    while (k < t.length && t[k] === t[0]) k++;
    misplaced += t.length - k;
    bottoms.set(t[0], (bottoms.get(t[0]) || 0) + 1);
  }
  let split = 0;
  bottoms.forEach((n) => {
    split += n - 1;
  });
  return misplaced + split * 2;
}

const concreteKey = (tubes: BallColor[][]) => tubes.map((t) => t.join(',')).join('|');

// state (exact tube arrangement) -> next move of the plan found for it
const planCache = new Map<string, HintMove>();

export function solvePlan(tubes: BallColor[][], maxCapacity: number, maxNodes: number, maxMs: number): HintMove[] | null {
  interface Node {
    tubes: BallColor[][];
    g: number;
    f: number;
    parent: Node | null;
    move: HintMove | null;
  }
  const startTime = Date.now();
  const WEIGHT = 3;
  const heap: Node[] = [];
  const push = (n: Node) => {
    heap.push(n);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p].f <= heap[i].f) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = (): Node => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && heap[l].f < heap[m].f) m = l;
        if (r < heap.length && heap[r].f < heap[m].f) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };

  const visited = new Set<string>([serializeState(tubes)]);
  push({ tubes, g: 0, f: WEIGHT * heuristic(tubes), parent: null, move: null });
  let nodes = 0;
  while (heap.length > 0 && nodes < maxNodes) {
    if ((nodes & 255) === 0 && Date.now() - startTime > maxMs) return null;
    const cur = pop();
    nodes++;
    for (const move of getValidMoves(cur.tubes, maxCapacity)) {
      const next = cur.tubes.map((t) => [...t]);
      next[move.toIndex].push(next[move.fromIndex].pop()!);
      const node: Node = { tubes: next, g: cur.g + 1, f: 0, parent: cur, move };
      if (isBoardSolved(next, maxCapacity)) {
        const path: HintMove[] = [];
        for (let n: Node | null = node; n && n.move; n = n.parent) path.push(n.move);
        return path.reverse();
      }
      const key = serializeState(next);
      if (visited.has(key)) continue;
      visited.add(key);
      node.f = node.g + WEIGHT * heuristic(next);
      push(node);
    }
  }
  return null;
}

export function findBestHint(tubes: BallColor[][], maxCapacity = 4, maxDepth = 2500): HintMove | null {
  if (isBoardSolved(tubes, maxCapacity)) return null;

  const key = concreteKey(tubes);
  const cached = planCache.get(key);
  if (cached) return cached;

  const plan = solvePlan(tubes, maxCapacity, 60000, 700);
  if (plan && plan.length > 0) {
    if (planCache.size > 4000) planCache.clear();
    // remember every step so later hints (after the player follows them) reuse the same plan
    const state = tubes.map((t) => [...t]);
    for (const mv of plan) {
      planCache.set(concreteKey(state), mv);
      state[mv.toIndex].push(state[mv.fromIndex].pop()!);
    }
    return plan[0];
  }
  return legacyHint(tubes, maxCapacity, maxDepth);
}
