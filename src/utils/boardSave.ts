// Saves the board being played on this device only (not the cloud), so closing or losing the app
// mid-level returns the player to the exact position. Anything that does not match the level is ignored.
import { BallColor } from '../types/game';

export type BoardKind = 'campaign' | 'daily';
export interface SavedBoard {
  v: 1;
  kind: BoardKind;
  level: number;
  date: string; // daily puzzles: the UTC day it belongs to
  tubes: BallColor[][];
  moves: number;
  time: number;
  history: { f: number; t: number; c: BallColor }[];
  added: boolean; // the extra tube booster was used
  assisted: boolean; // hint or undo used
}

const key = (k: BoardKind) => `colorsort_board_${k}_v1`;

export function saveBoard(b: SavedBoard): void {
  try { localStorage.setItem(key(b.kind), JSON.stringify(b)); } catch { /* storage unavailable */ }
}

export function clearBoard(kind: BoardKind): void {
  try { localStorage.removeItem(key(kind)); } catch { /* ignore */ }
}

export function loadBoard(kind: BoardKind): SavedBoard | null {
  try {
    const raw = localStorage.getItem(key(kind));
    return raw ? (JSON.parse(raw) as SavedBoard) : null;
  } catch {
    return null;
  }
}

const sortedColors = (tubes: BallColor[][]) => tubes.flat().slice().sort().join(',');
const solved = (tubes: BallColor[][]) => tubes.every((t) => t.length === 0 || (t.length === 4 && t.every((c) => c === t[0])));
export const isSolvedColors = solved;

/** True only if the saved board is a genuine, unfinished state of the puzzle that starts from `initial`. */
export function isValidSavedBoard(s: SavedBoard | null, kind: BoardKind, level: number, date: string, initial: BallColor[][]): s is SavedBoard {
  if (!s || s.v !== 1 || s.kind !== kind || s.level !== level) return false;
  if (kind === 'daily' && s.date !== date) return false;
  if (!Array.isArray(s.tubes) || !Array.isArray(s.history)) return false;
  if (s.tubes.length !== initial.length + (s.added ? 1 : 0)) return false;
  if (!s.tubes.every((t) => Array.isArray(t) && t.length <= 4)) return false;
  if (sortedColors(s.tubes) !== sortedColors(initial)) return false; // same balls as the real puzzle
  if (!Number.isInteger(s.moves) || s.moves < 0 || s.moves > 5000) return false;
  if (!Number.isFinite(s.time) || s.time < 0) return false;
  if (s.history.length > s.moves) return false;
  if (!s.history.every((h) => Number.isInteger(h.f) && Number.isInteger(h.t) && h.f >= 0 && h.t >= 0 && h.f < s.tubes.length && h.t < s.tubes.length)) return false;
  return !solved(s.tubes);
}
