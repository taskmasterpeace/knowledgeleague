import { useState, useEffect } from 'react'
import { getCharacterIdle, getRandomMenuObject, TILESETS, MENU_OBJECTS } from '../../utils/pixelArt'

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
    size: Math.round(randomBetween(48, 80)),
  }
}

// Fallback colored squares for characters that don't have sprites yet
const FALLBACK_COLORS: Record<string, string> = {
  kevin: '#ef4444',
  sally: '#a855f7',
  benny: '#22c55e',
  mia: '#f97316',
}

export function MenuScene() {
  const [flyingObjects, setFlyingObjects] = useState<FlyingObject[]>([])

  useEffect(() => {
    if (MENU_OBJECTS.length > 0) {
      const objects = Array.from({ length: 3 }, (_, i) =>
        generateFlyingObject(i * randomBetween(3, 8))
      )
      setFlyingObjects(objects)
    }
  }, [])

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
      {flyingObjects.map((obj, i) =>
        obj.src ? (
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
        ) : null
      )}

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
        {TILESETS.grass ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${TILESETS.grass})`,
              backgroundRepeat: 'repeat-x',
              backgroundSize: '64px 64px',
              backgroundPosition: 'bottom',
              imageRendering: 'pixelated',
              opacity: 0.7,
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(180deg, #4ade80 0%, #22c55e 100%)',
              opacity: 0.5,
            }}
          />
        )}
      </div>

      {/* Characters idling on the grass */}
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
        {CPU_NAMES.map((name, i) => {
          const src = getCharacterIdle(name)
          return (
            <div
              key={name}
              style={{
                animation: `bobble ${2 + i * 0.3}s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
              }}
            >
              {src ? (
                <img
                  src={src}
                  alt={name}
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                  style={{
                    width: '64px',
                    height: '64px',
                    imageRendering: 'pixelated',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    background: FALLBACK_COLORS[name] || '#6b7280',
                    border: '3px solid rgba(255,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: '14px',
                    color: 'white',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                  }}
                >
                  {name[0].toUpperCase()}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
