import type { TugArenaType } from '../types'

const BASE = '/pixelart'

// ── Character assets mapped to actual generated files ──

interface CharacterAssets {
  idle: string      // standing sprite (east-facing)
  run: string[]     // run animation frames
  south: string     // front-facing sprite
}

const CHARACTERS: Record<string, CharacterAssets> = {
  kevin: {
    idle: `${BASE}/characters/kevin/kevin-east.png`,
    run: [
      `${BASE}/characters/kevin/kevin_run-run-east-frame0.png`,
      `${BASE}/characters/kevin/kevin_run-run-east-frame1.png`,
      `${BASE}/characters/kevin/kevin_run-run-east-frame2.png`,
      `${BASE}/characters/kevin/kevin_run-run-east-frame3.png`,
    ],
    south: `${BASE}/characters/kevin/kevin-south.png`,
  },
  sally: {
    idle: `${BASE}/characters/sally/sally-east.png`,
    run: [`${BASE}/characters/sally/sally-east.png`], // no animation yet — use static
    south: `${BASE}/characters/sally/sally-south.png`,
  },
  // Characters not yet generated — will use fallback colored squares
  benny: { idle: '', run: [], south: '' },
  mia: { idle: '', run: [], south: '' },
  'default-player': { idle: '', run: [], south: '' },
}

// ── Tileset assets — use first tile as representative ──

export const TILESETS = {
  'dirt-track': `${BASE}/tilesets/dirt-track/dirt_track-tileset-tiles-0-image.png`,
  grass: `${BASE}/tilesets/grass/grass-tileset-tiles-0-image.png`,
  'mud-pit': `${BASE}/tilesets/mud-pit/mud_tileset-tileset-tiles-0-image.png`,
  stadium: `${BASE}/tilesets/stadium/gym_floor_tileset-tileset-tiles-0-image.png`,
}

// ── Object assets ──

export const OBJECTS = {
  'sky-background': `${BASE}/objects/marathon/sky_background.png`,
  'school-building': `${BASE}/objects/tug/school_building.png`,
}

// ── Menu flying objects ──

export const MENU_OBJECTS = [
  `${BASE}/menu/airplane/airplane.png`,
  `${BASE}/menu/ufo.png`,
]

// ── Public API ──

/**
 * Returns the idle (standing) sprite path for a character.
 * Returns empty string if not available.
 */
export function getCharacterIdle(name: string): string {
  return CHARACTERS[name]?.idle || ''
}

/**
 * Returns the south-facing (portrait) sprite for a character.
 */
export function getCharacterPortrait(name: string): string {
  return CHARACTERS[name]?.south || ''
}

/**
 * Returns run animation frame paths for a character.
 * Falls back to idle sprite if no run frames exist.
 */
export function getCharacterRunFrames(name: string): string[] {
  const char = CHARACTERS[name]
  if (!char) return []
  if (char.run.length > 0) return char.run
  if (char.idle) return [char.idle]
  return []
}

/**
 * Returns a single "run" image for a character — first run frame or idle.
 * This is used by components that just need one sprite to show.
 */
export function getCharacterAsset(characterName: string, _animation: string): string {
  const char = CHARACTERS[characterName]
  if (!char) return ''
  if (_animation === 'run' || _animation === 'pull') {
    return char.run[0] || char.idle || ''
  }
  return char.idle || ''
}

/**
 * Returns a random menu flying object path.
 */
export function getRandomMenuObject(): string {
  if (MENU_OBJECTS.length === 0) return ''
  return MENU_OBJECTS[Math.floor(Math.random() * MENU_OBJECTS.length)]
}

const ARENA_TYPES: TugArenaType[] = ['mud-pit', 'stadium', 'schoolyard']

/**
 * Returns a random arena type.
 */
export function getRandomArena(): TugArenaType {
  return ARENA_TYPES[Math.floor(Math.random() * ARENA_TYPES.length)]
}

/**
 * Returns arena-specific asset paths.
 */
export function getArenaAssets(type: TugArenaType): {
  ground: string
  decorations: string[]
} {
  switch (type) {
    case 'mud-pit':
      return {
        ground: TILESETS['mud-pit'],
        decorations: [],
      }
    case 'stadium':
      return {
        ground: TILESETS.stadium,
        decorations: [],
      }
    case 'schoolyard':
      return {
        ground: TILESETS.grass,
        decorations: OBJECTS['school-building'] ? [OBJECTS['school-building']] : [],
      }
    default:
      return { ground: '', decorations: [] }
  }
}

/**
 * Preload images — resolves even on failure for graceful degradation.
 */
export function preloadImages(paths: string[]): Promise<void> {
  const promises = paths
    .filter((p) => p) // skip empty strings
    .map(
      (path) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = path
        })
    )
  return Promise.all(promises).then(() => {})
}
