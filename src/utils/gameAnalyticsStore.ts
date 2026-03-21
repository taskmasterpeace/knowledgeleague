import type { PlayerAnalytics, PlayerId } from '../types'

let lastAnalytics: Map<PlayerId, PlayerAnalytics> | null = null
let lastPlayerNames: Map<PlayerId, string> | null = null

export function storeGameAnalytics(
  analytics: Map<PlayerId, PlayerAnalytics>,
  names: Map<PlayerId, string>,
) {
  lastAnalytics = analytics
  lastPlayerNames = names
}

export function getLastGameAnalytics() {
  return { analytics: lastAnalytics, playerNames: lastPlayerNames }
}

export function clearGameAnalytics() {
  lastAnalytics = null
  lastPlayerNames = null
}
