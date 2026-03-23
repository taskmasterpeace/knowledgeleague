import type { PixelArtManifest, TugArenaType } from '../types'

const BASE = '/pixelart'

function charPaths(name: string) {
  return {
    idle: `characters/${name}/idle.png`,
    run: `characters/${name}/run.png`,
    celebrate: `characters/${name}/celebrate.png`,
    pull: `characters/${name}/pull.png`,
    portrait: `characters/${name}/portrait.png`,
  }
}

export const PIXEL_ART_MANIFEST: PixelArtManifest = {
  characters: {
    kevin: charPaths('kevin'),
    sally: charPaths('sally'),
    benny: charPaths('benny'),
    mia: charPaths('mia'),
    'default-player': charPaths('default-player'),
  },
  tilesets: {
    'dirt-track': 'tilesets/dirt-track.png',
    grass: 'tilesets/grass.png',
    mud: 'tilesets/mud.png',
    'arena-floor': 'tilesets/arena-floor.png',
  },
  objects: {
    'sky-mountains': 'objects/sky-mountains.png',
    'finish-line': 'objects/finish-line.png',
    'start-line': 'objects/start-line.png',
    decorations: 'objects/decorations.png',
    bleachers: 'objects/bleachers.png',
    'lane-markers': 'objects/lane-markers.png',
    rope: 'objects/rope.png',
    'mud-splash': 'objects/mud-splash.png',
    'field-banners': 'objects/field-banners.png',
    'center-flag': 'objects/center-flag.png',
    'stadium-stands': 'objects/stadium-stands.png',
    'stadium-lights': 'objects/stadium-lights.png',
    scoreboard: 'objects/scoreboard.png',
    barrier: 'objects/barrier.png',
    'school-building': 'objects/school-building.png',
    'playground-markings': 'objects/playground-markings.png',
    'traffic-cones': 'objects/traffic-cones.png',
    trees: 'objects/trees.png',
    'spectator-kids': 'objects/spectator-kids.png',
  },
  menuObjects: [
    'menu/airplane.png',
    'menu/ufo.png',
    'menu/drone.png',
    'menu/star.png',
    'menu/rocket.png',
    'menu/balloon.png',
    'menu/bird.png',
  ],
}

/**
 * Preload images by creating Image objects and waiting for them to load.
 * Resolves even if some images fail (graceful degradation).
 */
export function preloadImages(paths: string[]): Promise<void> {
  const promises = paths.map(
    (path) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => resolve() // resolve anyway — graceful
        img.src = path
      })
  )
  return Promise.all(promises).then(() => {})
}

/**
 * Returns the full path for a character's animation.
 * Returns empty string if the character or animation is not found.
 */
export function getCharacterAsset(characterName: string, animation: string): string {
  const character = PIXEL_ART_MANIFEST.characters[characterName]
  if (!character) return ''
  const path = (character as Record<string, string | undefined>)[animation]
  if (!path) return ''
  return `${BASE}/${path}`
}

/**
 * Returns a random menu object path from the manifest.
 */
export function getRandomMenuObject(): string {
  const objects = PIXEL_ART_MANIFEST.menuObjects
  const index = Math.floor(Math.random() * objects.length)
  return `${BASE}/${objects[index]}`
}

const ARENA_TYPES: TugArenaType[] = ['mud-pit', 'stadium', 'schoolyard']

/**
 * Returns a random arena type.
 */
export function getRandomArena(): TugArenaType {
  return ARENA_TYPES[Math.floor(Math.random() * ARENA_TYPES.length)]
}

/**
 * Returns arena-specific asset paths based on arena type.
 */
export function getArenaAssets(type: TugArenaType): {
  background: string
  ground: string
  decorations: string[]
} {
  const t = (name: string) => `${BASE}/tilesets/${name}.png`
  const o = (name: string) => `${BASE}/objects/${name}.png`

  switch (type) {
    case 'mud-pit':
      return {
        background: t('grass'),
        ground: t('mud'),
        decorations: [o('rope'), o('mud-splash'), o('field-banners'), o('center-flag')],
      }
    case 'stadium':
      return {
        background: t('arena-floor'),
        ground: t('arena-floor'),
        decorations: [
          o('stadium-stands'),
          o('stadium-lights'),
          o('scoreboard'),
          o('barrier'),
          o('rope'),
        ],
      }
    case 'schoolyard':
      return {
        background: t('grass'),
        ground: t('grass'),
        decorations: [
          o('school-building'),
          o('playground-markings'),
          o('traffic-cones'),
          o('trees'),
          o('spectator-kids'),
        ],
      }
    default:
      return { background: '', ground: '', decorations: [] }
  }
}
