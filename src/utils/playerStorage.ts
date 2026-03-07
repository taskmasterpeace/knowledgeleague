import type { PlayerId } from '../types'

interface SavedPlayer {
  name: string
  color: string
  avatarUrl: string | null
  description: string
}

const KEY_PREFIX = 'mathMuscle:player'

export function savePlayer(id: PlayerId, data: SavedPlayer): void {
  localStorage.setItem(`${KEY_PREFIX}${id}`, JSON.stringify(data))
}

export function loadPlayer(id: PlayerId): SavedPlayer | null {
  try {
    const stored = localStorage.getItem(`${KEY_PREFIX}${id}`)
    if (stored) return JSON.parse(stored)
  } catch {}
  return null
}

export function clearPlayer(id: PlayerId): void {
  localStorage.removeItem(`${KEY_PREFIX}${id}`)
}
