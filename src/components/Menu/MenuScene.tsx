import { useState } from 'react'
import { AnimatedSprite } from '../shared/AnimatedSprite'
import { getCharacterRunFrames, getRandomMenuObject, TILESETS, MENU_OBJECTS, MENU_BG } from '../../utils/pixelArt'

const CPU_NAMES = ['kevin', 'sally', 'benny', 'mia', 'jayden']

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
    size: Math.round(randomBetween(72, 120)),
  }
}

interface FloatingItem {
  src: string
  x: number        // % from left
  startY: number   // % from top
  floatRange: number // px bob distance
  duration: number // seconds for full bob cycle
  delay: number
  size: number
  spin: boolean
  spinDuration: number
}

function generateFloatingItems(): FloatingItem[] {
  const items = [
    { src: MENU_BG.book, spin: false },
    { src: MENU_BG.pencil, spin: true },
    { src: MENU_BG.trophy, spin: false },
    { src: MENU_BG.book, spin: false },
    { src: MENU_BG.pencil, spin: true },
  ]
  return items.map((item, i) => ({
    ...item,
    x: 8 + i * 20 + randomBetween(-5, 5),
    startY: randomBetween(15, 55),
    floatRange: randomBetween(8, 20),
    duration: randomBetween(3, 6),
    delay: randomBetween(0, 3),
    size: Math.round(randomBetween(48, 72)),
    spinDuration: randomBetween(4, 8),
  }))
}

interface CloudData {
  src: string
  y: number
  duration: number
  delay: number
  size: number
  opacity: number
}

function generateClouds(): CloudData[] {
  return [
    { src: MENU_BG.cloudLarge, y: 6, duration: randomBetween(40, 60), delay: 0, size: 160, opacity: 0.9 },
    { src: MENU_BG.cloudSmall, y: 18, duration: randomBetween(50, 70), delay: randomBetween(5, 15), size: 110, opacity: 0.7 },
    { src: MENU_BG.cloudLarge, y: 10, duration: randomBetween(55, 75), delay: randomBetween(10, 25), size: 140, opacity: 0.6 },
    { src: MENU_BG.cloudSmall, y: 25, duration: randomBetween(45, 65), delay: randomBetween(3, 12), size: 90, opacity: 0.5 },
  ]
}

// Fallback colored squares for characters that don't have sprites yet
const FALLBACK_COLORS: Record<string, string> = {
  kevin: '#ef4444',
  sally: '#a855f7',
  benny: '#22c55e',
  mia: '#f97316',
  jayden: '#06b6d4',
}

export function MenuScene() {
  const [flyingObjects] = useState<FlyingObject[]>(() => {
    if (MENU_OBJECTS.length > 0) {
      return Array.from({ length: 3 }, (_, i) =>
        generateFlyingObject(i * randomBetween(3, 8))
      )
    }
    return []
  })

  const [clouds] = useState<CloudData[]>(generateClouds)
  const [floatingItems] = useState<FloatingItem[]>(generateFloatingItems)

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
        @keyframes cloudDrift {
          from { transform: translateX(-20%); }
          to { transform: translateX(110vw); }
        }
        @keyframes floatUpDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        @keyframes spinSlow {
          0% { transform: rotate(-15deg); }
          25% { transform: rotate(15deg); }
          50% { transform: rotate(-15deg); }
          75% { transform: rotate(10deg); }
          100% { transform: rotate(-15deg); }
        }
      `}</style>

      {/* Drifting clouds */}
      {clouds.map((cloud, i) =>
        cloud.src ? (
          <img
            key={`cloud-${i}`}
            src={cloud.src}
            alt=""
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
            style={{
              position: 'absolute',
              top: `${cloud.y}%`,
              left: 0,
              width: `${cloud.size}px`,
              height: 'auto',
              imageRendering: 'pixelated',
              animation: `cloudDrift ${cloud.duration}s linear ${cloud.delay}s infinite`,
              opacity: cloud.opacity,
            }}
          />
        ) : null
      )}

      {/* Flying objects in the sky (airplane, UFO) */}
      {flyingObjects.map((obj, i) =>
        obj.src ? (
          <img
            key={`fly-${i}`}
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

      {/* Floating educational items (books, pencils, trophies) */}
      {floatingItems.map((item, i) =>
        item.src ? (
          <div
            key={`item-${i}`}
            style={{
              position: 'absolute',
              left: `${item.x}%`,
              top: `${item.startY}%`,
              animation: `floatUpDown ${item.duration}s ease-in-out ${item.delay}s infinite`,
              zIndex: 1,
            }}
          >
            <img
              src={item.src}
              alt=""
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
              style={{
                width: `${item.size}px`,
                height: `${item.size}px`,
                imageRendering: 'pixelated',
                opacity: 0.7,
                ...(item.spin
                  ? { animation: `spinSlow ${item.spinDuration}s ease-in-out infinite` }
                  : {}),
              }}
            />
          </div>
        ) : null
      )}

      {/* Schoolhouse in the background */}
      {MENU_BG.schoolhouse && (
        <img
          src={MENU_BG.schoolhouse}
          alt=""
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
          style={{
            position: 'absolute',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            height: 'auto',
            imageRendering: 'pixelated',
            opacity: 0.35,
            zIndex: 0,
          }}
        />
      )}

      {/* Trees on the sides */}
      {MENU_BG.tree && (
        <>
          <img
            src={MENU_BG.tree}
            alt=""
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
            style={{
              position: 'absolute',
              bottom: '90px',
              left: '5%',
              width: '96px',
              height: 'auto',
              imageRendering: 'pixelated',
              opacity: 0.6,
              zIndex: 0,
            }}
          />
          <img
            src={MENU_BG.tree}
            alt=""
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
            style={{
              position: 'absolute',
              bottom: '90px',
              right: '5%',
              width: '96px',
              height: 'auto',
              imageRendering: 'pixelated',
              opacity: 0.6,
              transform: 'scaleX(-1)',
              zIndex: 0,
            }}
          />
        </>
      )}

      {/* Grass ground strip */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '120px',
          overflow: 'hidden',
          zIndex: 2,
        }}
      >
        {TILESETS.grass ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${TILESETS.grass})`,
              backgroundRepeat: 'repeat-x',
              backgroundSize: '96px 96px',
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

      {/* Characters running on the grass */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-evenly',
          alignItems: 'flex-end',
          padding: '0 10%',
          zIndex: 3,
        }}
      >
        {CPU_NAMES.map((name, i) => {
          const frames = getCharacterRunFrames(name)
          return (
            <div
              key={name}
              style={{
                animation: `bobble ${2 + i * 0.3}s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
              }}
            >
              {frames.length > 0 ? (
                <AnimatedSprite
                  frames={frames}
                  fps={6}
                  width={128}
                  height={128}
                  alt={name}
                />
              ) : (
                <div
                  style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '12px',
                    background: FALLBACK_COLORS[name] || '#6b7280',
                    border: '4px solid rgba(255,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: '24px',
                    color: 'white',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
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
