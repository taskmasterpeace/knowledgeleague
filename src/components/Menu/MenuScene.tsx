import { useState, useEffect, useMemo } from 'react'
import { getCharacterAsset, getRandomMenuObject, PIXEL_ART_MANIFEST } from '../../utils/pixelArt'

const CPU_NAMES = ['kevin', 'sally', 'benny', 'mia']

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

interface FlyingObject {
  src: string
  duration: number
  yPosition: number
  delay: number
  size: number
}

function generateFlyingObject(initialDelay?: number): FlyingObject {
  return {
    src: getRandomMenuObject(),
    duration: randomBetween(15, 30),
    yPosition: randomBetween(5, 35),
    delay: initialDelay ?? randomBetween(0, 10),
    size: Math.round(randomBetween(32, 48)),
  }
}

export function MenuScene() {
  const [assetsReady, setAssetsReady] = useState(false)
  const [flyingObjects, setFlyingObjects] = useState<FlyingObject[]>([])

  const characterSrcs = useMemo(
    () => CPU_NAMES.map((name) => getCharacterAsset(name, 'idle')),
    []
  )

  const grassSrc = useMemo(() => `/pixelart/${PIXEL_ART_MANIFEST.tilesets.grass}`, [])

  // Check if assets are available (at least the manifest exists)
  useEffect(() => {
    // We always render — individual images handle their own errors via onError
    setAssetsReady(true)

    // Generate initial flying objects with staggered delays
    const objects = Array.from({ length: 3 }, (_, i) => generateFlyingObject(i * randomBetween(3, 8)))
    setFlyingObjects(objects)
  }, [])

  if (!assetsReady) return null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes bobble {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes flyAcross {
          from { transform: translateX(110vw); }
          to { transform: translateX(-10vw); }
        }
      `}</style>

      {/* Flying objects in the sky */}
      {flyingObjects.map((obj, i) => (
        <img
          key={i}
          src={obj.src}
          alt=""
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
          style={{
            position: 'absolute',
            top: `${obj.yPosition}%`,
            left: 0,
            width: `${obj.size}px`,
            height: 'auto',
            imageRendering: 'pixelated',
            animation: `flyAcross ${obj.duration}s linear ${obj.delay}s infinite`,
            opacity: 0.85,
          }}
        />
      ))}

      {/* Grass ground strip */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          overflow: 'hidden',
        }}
      >
        <img
          src={grassSrc}
          alt=""
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            imageRendering: 'pixelated',
            opacity: 0.7,
          }}
        />
      </div>

      {/* CPU characters idling on the grass */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-evenly',
          alignItems: 'flex-end',
          padding: '0 10%',
        }}
      >
        {characterSrcs.map((src, i) => (
          <img
            key={CPU_NAMES[i]}
            src={src}
            alt={CPU_NAMES[i]}
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
            style={{
              width: '64px',
              height: '64px',
              imageRendering: 'pixelated',
              animation: `bobble ${2 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
