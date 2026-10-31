export type BallColor =
  | 'red'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'purple'
  | 'cyan'
  | 'pink'
  | 'orange'
  | 'lime'
  | 'indigo';

export type BallSkin = 'neon' | 'emoji' | 'planet' | 'sports';
export type TubeSkin = 'glass' | 'neon' | 'flask';
export type BackgroundTheme = 'dark-slate' | 'midnight-space' | 'wood-table' | 'pastel-light';

export interface Ball {
  id: string;
  color: BallColor;
}

export interface Tube {
  id: number;
  balls: Ball[];
  maxCapacity: number;
  isComplete: boolean;
}

export interface Move {
  fromTubeIndex: number;
  toTubeIndex: number;
  ball: Ball;
}

export interface LevelConfig {
  levelNumber: number;
  numColors: number;
  numEmptyTubes: number;
  targetMoves: number;
  initialTubes: BallColor[][];
}

export interface PlayerProfile {
  id: string;
  name: string;
  avatar: string;
  country: string;
  currentLevel: number;
  totalStars: number;
  totalScore: number;
  hintsRemaining: number;
  freeTubesRemaining: number;
  undoRemaining: number;
  selectedSkin: BallSkin;
  selectedTubeSkin: TubeSkin;
  selectedTheme: BackgroundTheme;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  country: string;
  level: number;
  stars: number;
  score: number;
  isCurrentPlayer?: boolean;
}

export interface HintMove {
  fromIndex: number;
  toIndex: number;
  color: BallColor;
}
