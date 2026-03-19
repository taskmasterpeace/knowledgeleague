import { create } from 'zustand'
import type { QuestionCategory, Subject, GradeLevel } from '../types'

export interface Settings {
  difficulty: 'easy' | 'medium' | 'hard' | 'adaptive'
  timePerQuestion: number  // milliseconds
  trackLength: number      // spaces
  soundEnabled: boolean
  musicEnabled: boolean
  vibrationEnabled: boolean
  enabledCategories: QuestionCategory[]
  gradeLevel: GradeLevel
  enabledSubjects: Subject[]
  announcerEnabled: boolean
  announcerVoice: 'alex' | 'ashley' | 'dennis' | 'darlene'
  announcerFrequency: 'chatty' | 'normal' | 'quiet'
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
  gradeLevel: 'grade-1',
  enabledSubjects: ['math'],
  announcerEnabled: false,
  announcerVoice: 'alex',
  announcerFrequency: 'normal',
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
