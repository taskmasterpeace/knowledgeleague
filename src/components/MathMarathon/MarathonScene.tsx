import { useState, useEffect } from 'react'
import { PixelScene } from '../shared/PixelScene'
import type { PixelSceneLayer } from '../shared/PixelScene'
import { PIXEL_ART_MANIFEST, getCharacterAsset } from '../../utils/pixelArt'
import type { Player } from '../../types'

const BASE = '/pixelart'

interface MarathonSceneProps {
  players: Player[]
  totalSpaces?: number
}

const SCENE_HEIGHT = 300
const GROUND_Y = 65
const SCENE_WIDTH = 1600 // virtual width for camera calculation

const CPU_NAME_MAP: Record<string, string> = {
  Kevin: 'kevin',
  Sally: 'sally',
  Benny: 'benny',
  Mia: 'mia',
}

export function MarathonScene({ players, totalSpaces = 20 }: MarathonSceneProps) {
  const [assetsReady, setAssetsReady] = useState(false)

  // Check if key assets exist on mount
  useEffect(() => {
    const skyPath = `${BASE}/${PIXEL_ART_MANIFEST.objects['sky-mountains']}`
    const trackPath = `${BASE}/${PIXEL_ART_MANIFEST.tilesets['dirt-track']}`

    let mounted = true
    const img = new Image()
    img.onload = () => { if (mounted) setAssetsReady(true) }
    img.onerror = () => { if (mounted) setAssetsReady(false) }
    img.src = skyPath

    const img2 = new Image()
    img2.onload = () => { if (mounted) setAssetsReady(true) }
    img2.onerror = () => {} // only need one to succeed for basic check
    img2.src = trackPath

    return () => { mounted = false }
  }, [])

  if (!assetsReady) return null

  // Camera follows leading player
  const maxPosition = Math.max(...players.map(p => p.position), 0)
  const cameraX = (maxPosition / totalSpaces) * SCENE_WIDTH

  const layers: PixelSceneLayer[] = [
    // Layer 0: Sky/mountains background
    {
      src: `${BASE}/${PIXEL_ART_MANIFEST.objects['sky-mountains']}`,
      speed: 0,
      y: 0,
      height: SCENE_HEIGHT,
      repeat: true,
      scale: 1,
    },
    // Layer 1: Bleachers/crowd
    {
      src: `${BASE}/${PIXEL_ART_MANIFEST.objects['bleachers']}`,
      speed: 0.3,
      y: 20,
      repeat: true,
      scale: 1.5,
    },
    // Layer 2: Trees/decorations
    {
      src: `${BASE}/${PIXEL_ART_MANIFEST.objects['trees']}`,
      speed: 0.5,
      y: 30,
      repeat: true,
      scale: 1.5,
    },
    // Layer 3: Dirt track tileset
    {
      src: `${BASE}/${PIXEL_ART_MANIFEST.tilesets['dirt-track']}`,
      speed: 1,
      y: 55,
      repeat: true,
      scale: 2,
    },
    // Layer 4: Grass tileset on top edge of track
    {
      src: `${BASE}/${PIXEL_ART_MANIFEST.tilesets['grass']}`,
      speed: 1,
      y: 52,
      repeat: true,
      scale: 2,
    },
  ]

  const laneCount = Math.max(players.length, 1)

  return (
    <PixelScene
      layers={layers}
      cameraX={cameraX}
      height={SCENE_HEIGHT}
      groundY={GROUND_Y}
      className="rounded-lg overflow-hidden"
    >
      {players.map((player, i) => {
        const laneOffset = ((i + 0.5) / laneCount) * 120 // spread across available space in px
        const xPercent = (player.position / totalSpaces) * 100

        const charKey = CPU_NAME_MAP[player.name]
        const characterSrc = player.type === 'cpu' && charKey
          ? getCharacterAsset(charKey, 'run')
          : getCharacterAsset('default-player', 'run')

        return (
          <div
            key={player.id}
            style={{
              position: 'absolute',
              left: `${xPercent}%`,
              top: `${laneOffset}px`,
              transition: 'left 0.5s ease-out',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Player name label */}
            <div
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '8px',
                color: player.color,
                textShadow: '1px 1px 0 rgba(0,0,0,0.8)',
                whiteSpace: 'nowrap',
                marginBottom: '2px',
              }}
            >
              {player.name}
            </div>
            {/* Character sprite */}
            <img
              src={characterSrc}
              alt={player.name}
              style={{
                width: '64px',
                height: '64px',
                imageRendering: 'pixelated',
              }}
            />
          </div>
        )
      })}
    </PixelScene>
  )
}
