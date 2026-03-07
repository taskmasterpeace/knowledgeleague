import type { CPUCharacter } from '../types'

// Timing
export const PROBLEM_TIME_LIMIT = 10_000       // 10 seconds per problem
export const LOCKOUT_DURATION = 2_000           // 2s lockout on wrong answer
export const MASH_LOCKOUT_DURATION = 4_000      // 4s lockout for button mashing
export const MASH_WINDOW = 500                  // 0.5s window to detect mashing
export const CONFIDENCE_BONUS_THRESHOLD = 3_000 // 3s wait = confidence bonus
export const URGENT_THRESHOLD = 3_000           // 3s remaining = urgent mode

// Marathon distances
export const MARATHON_CORRECT_BASE = 5          // base % gain on correct
export const MARATHON_CORRECT_MAX = 30          // max % gain (fast answer)
export const MARATHON_WRONG_PENALTY = 3         // % slide back on wrong
export const MARATHON_WIN_THRESHOLD = 100       // % to win

// Tug-of-War
export const TUG_CORRECT_PULL = 15              // % pull on correct
export const TUG_SUPER_PULL = 25                // % pull on 3-streak
export const TUG_WRONG_PULL = 10                // % opponent pulls on wrong
export const TUG_STREAK_THRESHOLD = 3           // streak needed for super pull
export const TUG_WIN_THRESHOLD = 80             // % past center to win

// CPU Characters
export const CPU_CHARACTERS: CPUCharacter[] = [
  { name: 'Kevin', speedRange: [1, 3], accuracy: 0.85, tagline: 'Fast but sloppy!', color: '#ef4444' },
  { name: 'Sally', speedRange: [4, 7], accuracy: 0.90, tagline: 'Slow and steady', color: '#a855f7' },
  { name: 'Benny', speedRange: [2, 5], accuracy: 0.60, tagline: 'Still learning', color: '#22c55e' },
  { name: 'Mia',   speedRange: [1, 6], accuracy: 0.75, tagline: 'Wildcard!',       color: '#f59e0b' },
]

// Player colors
export const PLAYER_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#ec4899']

// Keyboard mapping
export const P1_KEYS: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3 }
export const P2_KEYS: Record<string, number> = { '7': 0, '8': 1, '9': 2, '0': 3 }
