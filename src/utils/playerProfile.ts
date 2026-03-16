import type { ProblemType, Badge } from '../types'

export interface CategoryStats {
  attempts: number
  correct: number
  bestStreak: number
  currentStreak: number
  totalResponseTimeMs: number
  lastPlayed: string
}

export interface PlayerProfile {
  id: string
  name: string
  stats: Record<ProblemType, CategoryStats>
  gamesPlayed: number
  totalCorrect: number
  badges: Badge[]
  createdAt: string
  lastPlayedAt: string
}

const PROFILES_INDEX_KEY = 'brainGames:profiles'
const PROFILE_KEY_PREFIX = 'brainGames:profile:'
const BADGE_THRESHOLDS: { tier: Badge['tier']; required: number }[] = [
  { tier: 'master', required: 100 },
  { tier: 'gold', required: 50 },
  { tier: 'silver', required: 25 },
  { tier: 'bronze', required: 10 },
]

function emptyStats(): CategoryStats {
  return { attempts: 0, correct: 0, bestStreak: 0, currentStreak: 0, totalResponseTimeMs: 0, lastPlayed: '' }
}

function createProfile(name: string): PlayerProfile {
  return {
    id: crypto.randomUUID(),
    name,
    stats: {
      addition: emptyStats(),
      subtraction: emptyStats(),
      missing: emptyStats(),
      comparison: emptyStats(),
      'skip-counting': emptyStats(),
    },
    gamesPlayed: 0,
    totalCorrect: 0,
    badges: [],
    createdAt: new Date().toISOString(),
    lastPlayedAt: new Date().toISOString(),
  }
}

function getProfilesIndex(): Record<string, string> {
  try {
    const stored = localStorage.getItem(PROFILES_INDEX_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return {}
}

function saveProfilesIndex(index: Record<string, string>): void {
  localStorage.setItem(PROFILES_INDEX_KEY, JSON.stringify(index))
}

function loadProfile(id: string): PlayerProfile | null {
  try {
    const stored = localStorage.getItem(PROFILE_KEY_PREFIX + id)
    if (stored) return JSON.parse(stored)
  } catch {}
  return null
}

function saveProfile(profile: PlayerProfile): void {
  localStorage.setItem(PROFILE_KEY_PREFIX + profile.id, JSON.stringify(profile))
}

export function getOrCreateProfile(name: string): PlayerProfile {
  const index = getProfilesIndex()
  const existingId = index[name]
  if (existingId) {
    const profile = loadProfile(existingId)
    if (profile) return profile
  }
  const profile = createProfile(name)
  index[name] = profile.id
  saveProfilesIndex(index)
  saveProfile(profile)
  return profile
}

export function recordAnswer(
  profileId: string,
  category: ProblemType,
  correct: boolean,
  responseTimeMs: number
): Badge | null {
  const profile = loadProfile(profileId)
  if (!profile) return null

  const stats = profile.stats[category]
  stats.attempts++
  stats.totalResponseTimeMs += responseTimeMs
  stats.lastPlayed = new Date().toISOString()

  if (correct) {
    stats.correct++
    stats.currentStreak++
    if (stats.currentStreak > stats.bestStreak) {
      stats.bestStreak = stats.currentStreak
    }
    profile.totalCorrect++
  } else {
    stats.currentStreak = 0
  }

  profile.lastPlayedAt = new Date().toISOString()

  // Check for new badge (highest tier first)
  let newBadge: Badge | null = null
  for (const { tier, required } of BADGE_THRESHOLDS) {
    if (stats.correct >= required) {
      const alreadyHas = profile.badges.some(b => b.category === category && b.tier === tier)
      if (!alreadyHas) {
        newBadge = { category, tier, earnedAt: new Date().toISOString() }
        profile.badges.push(newBadge)
        break
      }
    }
  }

  saveProfile(profile)
  return newBadge
}

export function recordGameComplete(profileId: string): void {
  const profile = loadProfile(profileId)
  if (!profile) return
  profile.gamesPlayed++
  profile.lastPlayedAt = new Date().toISOString()
  saveProfile(profile)
}

export function getAllProfiles(): PlayerProfile[] {
  const index = getProfilesIndex()
  const profiles: PlayerProfile[] = []
  for (const id of Object.values(index)) {
    const profile = loadProfile(id)
    if (profile) profiles.push(profile)
  }
  return profiles
}
