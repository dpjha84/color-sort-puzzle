import { PlayerProfile, BallSkin, TubeSkin, BackgroundTheme } from '../types/game';

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
