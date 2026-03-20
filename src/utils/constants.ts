import type { CPUCharacter } from '../types'

// Marathon — spaces-based scoring
export const MARATHON_TRACK_LENGTH = 20           // spaces to win
export const MARATHON_FIRST_CORRECT = 3           // spaces for first correct answer
export const MARATHON_SECOND_CORRECT = 2          // spaces for second correct (but not first)
export const MARATHON_WRONG_ANSWER = 1            // spaces for wrong answer (encouragement)
export const MARATHON_NO_ANSWER = 0               // spaces for not answering

// Tug-of-War
export const TUG_CORRECT_PULL = 15              // % pull on correct
export const TUG_SUPER_PULL = 25                // % pull on 3-streak
export const TUG_WRONG_PULL = 10                // % opponent pulls on wrong
export const TUG_STREAK_THRESHOLD = 3           // streak needed for super pull
export const TUG_WIN_THRESHOLD = 80             // % past center to win

// CPU Characters
export const CPU_CHARACTERS: CPUCharacter[] = [
  { name: 'Kevin', speedRange: [0, 3], accuracy: 0.85, tagline: 'Fast but sloppy!', color: '#ef4444',
    avatarUrl: '/avatars/cpu/kevin-portrait.png', animatedUrl: '/avatars/cpu/kevin-walk.gif' },
  { name: 'Sally', speedRange: [4, 8], accuracy: 0.90, tagline: 'Slow and steady', color: '#a855f7',
    avatarUrl: '/avatars/cpu/sally-portrait.png', animatedUrl: '/avatars/cpu/sally-walk.gif' },
  { name: 'Benny', speedRange: [2, 6], accuracy: 0.60, tagline: 'Still learning', color: '#22c55e',
    avatarUrl: '/avatars/cpu/benny-portrait.png', animatedUrl: '/avatars/cpu/benny-walk.gif' },
  { name: 'Mia',   speedRange: [0, 6], accuracy: 0.75, tagline: 'Wildcard!',       color: '#f59e0b',
    avatarUrl: '/avatars/cpu/mia-portrait.png', animatedUrl: '/avatars/cpu/mia-walk.gif' },
]

// Player colors (supports up to 16 players, then cycles)
export const PLAYER_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#ec4899',
  '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#e11d48', '#06b6d4',
  '#8b5cf6', '#d946ef', '#0ea5e9', '#65a30d',
]

// Keyboard mapping — both players press 1-2-3-4
// P1 uses number row (Digit1-Digit4), P2 uses numpad (Numpad1-Numpad4)
export const P1_CODES: Record<string, number> = { 'Digit1': 0, 'Digit2': 1, 'Digit3': 2, 'Digit4': 3 }
export const P2_CODES: Record<string, number> = { 'Numpad1': 0, 'Numpad2': 1, 'Numpad3': 2, 'Numpad4': 3 }
export const P3_CODES: Record<string, number> = { 'KeyQ': 0, 'KeyW': 1, 'KeyE': 2, 'KeyR': 3 }
export const P4_CODES: Record<string, number> = { 'KeyU': 0, 'KeyI': 1, 'KeyO': 2, 'KeyP': 3 }
