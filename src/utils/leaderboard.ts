import { LeaderboardEntry, PlayerProfile, BallSkin, TubeSkin, BackgroundTheme } from '../types/game';

const PROFILE_KEY = 'colorsort_player_profile';
const LEADERBOARD_KEY = 'colorsort_global_leaderboard';

export const AVATAR_OPTIONS = [
  '🧙‍♂️', '🦊', '🐱', '🚀', '👑', '🤖', '🦄', '🐯', '🐼', '🦁', '🌟', '⚡'
];

export const COUNTRY_OPTIONS = [
  { code: 'US', flag: '🇺🇸', name: 'United States' },
  { code: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: 'FR', flag: '🇫🇷', name: 'France' },
  { code: 'IN', flag: '🇮🇳', name: 'India' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia' },
];

const INITIAL_TOP_PLAYERS: Omit<LeaderboardEntry, 'rank'>[] = [
  { id: 'bot-1', name: 'Aria Starlight', avatar: '👑', country: '🇺🇸', level: 48, stars: 142, score: 28450 },
  { id: 'bot-2', name: 'Kenji Takahashi', avatar: '🐱', country: '🇯🇵', level: 45, stars: 133, score: 26100 },
  { id: 'bot-3', name: 'Elena Rostov', avatar: '🧙‍♂️', country: 'DE', level: 41, stars: 121, score: 23800 },
  { id: 'bot-4', name: 'Mateo Silva', avatar: '🦊', country: '🇧🇷', level: 39, stars: 114, score: 21950 },
  { id: 'bot-5', name: 'Chloe Laurent', avatar: '🦄', country: '🇫🇷', level: 36, stars: 106, score: 19800 },
  { id: 'bot-6', name: 'Liam O’Connor', avatar: '⚡', country: 'GB', level: 34, stars: 99, score: 18400 },
  { id: 'bot-7', name: 'Ji-hoon Park', avatar: '🤖', country: '🇰🇷', level: 31, stars: 91, score: 16900 },
  { id: 'bot-8', name: 'Ananya Sharma', avatar: '🌟', country: '🇮🇳', level: 29, stars: 85, score: 15200 },
  { id: 'bot-9', name: 'Oliver Smith', avatar: '🦁', country: 'AU', level: 27, stars: 79, score: 13950 },
  { id: 'bot-10', name: 'Noah Tremblay', avatar: '🐼', country: '🇨🇦', level: 25, stars: 72, score: 12600 },
  { id: 'bot-11', name: 'Sara Lind', avatar: '🚀', country: 'DE', level: 23, stars: 66, score: 11400 },
  { id: 'bot-12', name: 'Lucas Rossi', avatar: '🦊', country: 'US', level: 21, stars: 60, score: 10100 },
  { id: 'bot-13', name: 'Maya Lin', avatar: '👑', country: 'JP', level: 19, stars: 54, score: 9150 },
  { id: 'bot-14', name: 'Ethan Hunt', avatar: '⚡', country: 'GB', level: 17, stars: 48, score: 8100 },
  { id: 'bot-15', name: 'Zoe Vance', avatar: '🐱', country: 'AU', level: 15, stars: 42, score: 7050 },
];

export function getPlayerProfile(): PlayerProfile {
  if (typeof window === 'undefined') {
    return defaultProfile;
  }

  const stored = localStorage.getItem(PROFILE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }

  const newProfile: PlayerProfile = {
    id: 'user-' + Math.random().toString(36).substring(2, 9),
    name: 'Puzzle Master',
    avatar: '🧙‍♂️',
    country: '🇺🇸',
    currentLevel: 1,
    totalStars: 0,
    totalScore: 0,
    hintsRemaining: 3,
    freeTubesRemaining: 1,
    undoRemaining: 5,
    selectedSkin: 'neon',
    selectedTubeSkin: 'glass',
    selectedTheme: 'dark-slate',
  };

  savePlayerProfile(newProfile);
  return newProfile;
}

const defaultProfile: PlayerProfile = {
  id: 'guest',
  name: 'Puzzle Master',
  avatar: '🧙‍♂️',
  country: '🇺🇸',
  currentLevel: 1,
  totalStars: 0,
  totalScore: 0,
  hintsRemaining: 3,
  freeTubesRemaining: 1,
  undoRemaining: 5,
  selectedSkin: 'neon',
  selectedTubeSkin: 'glass',
  selectedTheme: 'dark-slate',
};

export function savePlayerProfile(profile: PlayerProfile): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }
}

export function getLeaderboard(timeframe: 'daily' | 'weekly' | 'allTime' = 'allTime'): LeaderboardEntry[] {
  const profile = getPlayerProfile();

  // Create combined list including the player
  const playerEntry: Omit<LeaderboardEntry, 'rank'> = {
    id: profile.id,
    name: profile.name,
    avatar: profile.avatar,
    country: profile.country,
    level: profile.currentLevel,
    stars: profile.totalStars,
    score: profile.totalScore,
    isCurrentPlayer: true,
  };

  // Adjust scores slightly for daily/weekly flavor
  const multiplier = timeframe === 'daily' ? 0.25 : timeframe === 'weekly' ? 0.6 : 1;
  const list = INITIAL_TOP_PLAYERS.map((p) => ({
    ...p,
    score: Math.round(p.score * multiplier),
    stars: Math.round(p.stars * multiplier),
  }));

  const combined = [...list, {
    ...playerEntry,
    score: Math.round(playerEntry.score * (timeframe === 'allTime' ? 1 : 0.8)),
  }];

  // Sort descending by score, then level
  combined.sort((a, b) => b.score - a.score || b.level - a.level);

  return combined.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
    isCurrentPlayer: entry.id === profile.id,
  }));
}

export function updatePlayerScoreOnWin(level: number, moves: number, timeSeconds: number, starsEarned: number) {
  const profile = getPlayerProfile();
  
  // Calculate score: base level points + moves efficiency + speed bonus
  const basePoints = level * 500;
  const movesBonus = Math.max(0, 300 - moves * 15);
  const timeBonus = Math.max(0, 200 - timeSeconds * 5);
  const levelScore = basePoints + movesBonus + timeBonus + starsEarned * 100;

  profile.totalScore += levelScore;
  profile.totalStars += starsEarned;
  if (level >= profile.currentLevel) {
    profile.currentLevel = level + 1;
  }

  savePlayerProfile(profile);
  return { levelScore, profile };
}
