import { create } from 'zustand'
import type { ProblemType } from '../types'

export interface Settings {
  difficulty: 'easy' | 'medium' | 'hard' | 'adaptive'
  timePerQuestion: number  // milliseconds
  trackLength: number      // spaces
  soundEnabled: boolean
  musicEnabled: boolean
  vibrationEnabled: boolean
  enabledCategories: ProblemType[]
}

const STORAGE_KEY = 'brainGames:settings'
const LEGACY_KEY = 'mathMuscle:settings'

const defaults: Settings = {
  difficulty: 'adaptive',
  timePerQuestion: 10_000,
  trackLength: 20,
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
  enabledCategories: ['addition', 'subtraction', 'missing', 'comparison', 'skip-counting'],
}

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY)
    if (stored) return { ...defaults, ...JSON.parse(stored) }
  } catch {}
  return defaults
}

interface SettingsStore extends Settings {
  update: (patch: Partial<Settings>) => void
  reset: () => void
}

export const useSettings = create<SettingsStore>((set) => ({
  ...loadSettings(),

  update: (patch) => set((s) => {
    const next = { ...s, ...patch }
    const { update: _, reset: __, ...data } = next
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return patch
  }),

  reset: () => {
    localStorage.removeItem(STORAGE_KEY)
    set(defaults)
  },
}))
