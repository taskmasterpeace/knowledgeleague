interface SavedPlayer {
  name: string
  color: string
  avatarUrl: string | null
  description: string
}

const KEY_PREFIX = 'mathMuscle:player'

export function savePlayer(id: 1 | 2, data: SavedPlayer): void {
  localStorage.setItem(`${KEY_PREFIX}${id}`, JSON.stringify(data))
}

export function loadPlayer(id: 1 | 2): SavedPlayer | null {
  try {
    const stored = localStorage.getItem(`${KEY_PREFIX}${id}`)
    if (stored) return JSON.parse(stored)
  } catch {}
  return null
}

export function clearPlayer(id: 1 | 2): void {
  localStorage.removeItem(`${KEY_PREFIX}${id}`)
}
