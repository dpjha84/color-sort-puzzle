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
export function findBestHint(tubes: BallColor[][], maxCapacity = 4, maxDepth = 2500): HintMove | null {
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
