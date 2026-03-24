const STORAGE_KEY = 'knowledgeLeagueKids:customCharacters'

export interface CustomCharacter {
  name: string
  description: string
  idle: string        // base64 data URL
  runFrames: string[] // base64 data URLs
  south: string       // base64 data URL (front-facing portrait)
  createdAt: string
}

function loadAll(): Record<string, CustomCharacter> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return {}
}

function saveAll(chars: Record<string, CustomCharacter>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chars))
}

export function getCustomCharacter(playerName: string): CustomCharacter | null {
  const all = loadAll()
  return all[playerName.toLowerCase()] || null
}

export function getCustomCharacterFrames(playerName: string): string[] {
  const char = getCustomCharacter(playerName)
  if (!char) return []
  if (char.runFrames.length > 0) return char.runFrames
  if (char.idle) return [char.idle]
  return []
}

export function getCustomCharacterPortrait(playerName: string): string {
  const char = getCustomCharacter(playerName)
  return char?.south || char?.idle || ''
}

export function saveCustomCharacter(character: CustomCharacter): void {
  const all = loadAll()
  all[character.name.toLowerCase()] = character
  saveAll(all)
}

export function deleteCustomCharacter(playerName: string): void {
  const all = loadAll()
  delete all[playerName.toLowerCase()]
  saveAll(all)
}

export function getAllCustomCharacters(): CustomCharacter[] {
  return Object.values(loadAll())
}
