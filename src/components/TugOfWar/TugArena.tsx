import { useState, useEffect } from 'react'
import { getArenaAssets, getCharacterAsset } from '../../utils/pixelArt'
import type { TugArenaType, Player } from '../../types'

interface TugArenaProps {
  arenaType: TugArenaType
  ropePosition: number       // -100 (left wins) to +100 (right wins), 0 = center
  leftTeam: Player[]
  rightTeam: Player[]
}

const CPU_NAME_MAP: Record<string, string> = {
  Kevin: 'kevin',
  Sally: 'sally',
  Benny: 'benny',
  Mia: 'mia',
}

function getSpriteSrc(player: Player): string {
  if (player.type === 'cpu') {
    const charName = CPU_NAME_MAP[player.name] ?? 'default-player'
    return getCharacterAsset(charName, 'run')
  }
  return getCharacterAsset('default-player', 'run')
}

function CenterFeature({ arenaType }: { arenaType: TugArenaType }) {
  switch (arenaType) {
    case 'mud-pit':
      return (
        <div
          className="absolute left-1/2 bottom-[60px] -translate-x-1/2"
          style={{
            width: 120,
            height: 40,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, #6b3a1f 0%, #4a2510 60%, transparent 100%)',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
            opacity: 0.85,
          }}
        />
      )
    case 'stadium':
      return (
        <div
          className="absolute left-1/2 bottom-0 -translate-x-1/2"
          style={{
            width: 4,
            height: '100%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,100,0.6) 40%, rgba(255,255,100,0.8) 50%, rgba(255,255,100,0.6) 60%, transparent 100%)',
            boxShadow: '0 0 12px rgba(255,255,100,0.4)',
          }}
        />
      )
    case 'schoolyard':
      return (
        <div
          className="absolute left-1/2 bottom-[56px] -translate-x-1/2"
          style={{ width: 24, height: 36 }}
        >
          {/* Cone body */}
          <div style={{
            width: 0,
            height: 0,
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderBottom: '30px solid #f97316',
            margin: '0 auto',
          }} />
          {/* Cone base */}
          <div style={{
            width: 28,
            height: 6,
            background: '#f97316',
            borderRadius: 2,
            marginLeft: -2,
          }} />
        </div>
      )
    default:
      return null
  }
}

function getArenaBackground(arenaType: TugArenaType): React.CSSProperties {
  switch (arenaType) {
    case 'mud-pit':
      return {
        background: 'linear-gradient(180deg, #87ceeb 0%, #5ba3d9 40%, #4a8c2a 60%, #3d7a22 70%, #6b4226 85%, #5a3520 100%)',
      }
    case 'stadium':
      return {
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 30%, #0f3460 50%, #2a2a3e 65%, #3a3a4e 80%, #4a4a5e 100%)',
      }
    case 'schoolyard':
      return {
        background: 'linear-gradient(180deg, #87ceeb 0%, #6db6d6 35%, #4a8c2a 55%, #3d7a22 70%, #5a9a32 85%, #4a8a28 100%)',
      }
    default:
      return {}
  }
}

export function TugArena({ arenaType, ropePosition, leftTeam, rightTeam }: TugArenaProps) {
  const [assetsLoaded, setAssetsLoaded] = useState(false)

  const assets = getArenaAssets(arenaType)

  useEffect(() => {
    if (!assets.background) return
    // Attempt to load at least the background image to confirm assets exist
    const img = new Image()
    img.onload = () => setAssetsLoaded(true)
    img.onerror = () => setAssetsLoaded(false)
    img.src = assets.background
  }, [assets.background])

  if (!assetsLoaded) return null

  const leftX = 20 + ropePosition * 0.15
  const rightX = 80 + ropePosition * 0.15

  return (
    <div
      className="pixel-card rounded-lg overflow-hidden relative"
      style={{ height: 280, imageRendering: 'pixelated' }}
    >
      {/* Arena background */}
      <div className="absolute inset-0" style={getArenaBackground(arenaType)} />

      {/* Decorations layer */}
      <div className="absolute inset-0 pointer-events-none">
        {assets.decorations.map((dec, i) => (
          <img
            key={i}
            src={dec}
            alt=""
            className="absolute opacity-60"
            style={{
              imageRendering: 'pixelated',
              bottom: 80 + i * 20,
              left: `${10 + i * 18}%`,
              height: 48,
              width: 'auto',
            }}
          />
        ))}
      </div>

      {/* Ground surface */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: 60,
          backgroundImage: `url(${assets.ground})`,
          backgroundRepeat: 'repeat-x',
          backgroundSize: '64px 64px',
          imageRendering: 'pixelated',
        }}
      />

      {/* Center feature */}
      <CenterFeature arenaType={arenaType} />

      {/* Rope */}
      <div
        className="absolute left-[10%] right-[10%] transition-transform duration-300"
        style={{
          top: 170,
          height: 8,
          transform: `translateX(${ropePosition * 1.5}px)`,
        }}
      >
        <div
          className="w-full h-full rounded"
          style={{
            background: 'repeating-linear-gradient(90deg, #92400e 0px, #b45309 4px, #78350f 8px)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        />
        {/* Center marker / flag */}
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2"
        >
          <div className="w-0.5 h-10 bg-white/90 mx-auto" />
          <div
            className="absolute top-0.5 left-1"
            style={{
              width: 0,
              height: 0,
              borderTop: '6px solid #facc15',
              borderBottom: '6px solid transparent',
              borderRight: '10px solid transparent',
            }}
          />
        </div>
      </div>

      {/* Left team characters */}
      {leftTeam.map((player, i) => {
        const src = getSpriteSrc(player)
        const yOffset = leftTeam.length > 1 ? i * 16 - 8 : 0
        return (
          <div
            key={player.id}
            className="absolute transition-all duration-300"
            style={{
              left: `${leftX + i * 5}%`,
              bottom: 64 + yOffset,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-pixel text-[6px] text-white text-center mb-0.5 whitespace-nowrap"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
            >
              {player.name}
            </div>
            {src && (
              <img
                src={src}
                alt={player.name}
                style={{
                  width: 64,
                  height: 64,
                  imageRendering: 'pixelated',
                }}
              />
            )}
          </div>
        )
      })}

      {/* Right team characters */}
      {rightTeam.map((player, i) => {
        const src = getSpriteSrc(player)
        const yOffset = rightTeam.length > 1 ? i * 16 - 8 : 0
        return (
          <div
            key={player.id}
            className="absolute transition-all duration-300"
            style={{
              left: `${rightX + i * 5}%`,
              bottom: 64 + yOffset,
              transform: 'translateX(-50%) scaleX(-1)',
            }}
          >
            {/* Name needs to be un-flipped */}
            <div
              className="font-pixel text-[6px] text-white text-center mb-0.5 whitespace-nowrap"
              style={{ transform: 'scaleX(-1)', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
            >
              {player.name}
            </div>
            {src && (
              <img
                src={src}
                alt={player.name}
                style={{
                  width: 64,
                  height: 64,
                  imageRendering: 'pixelated',
                }}
              />
            )}
          </div>
        )
      })}

      {/* Win zone indicators */}
      <div className="absolute left-0 top-0 bottom-0 w-[8%] bg-blue-500/15 border-r border-blue-400/30 flex items-end justify-center pb-2">
        <span className="font-pixel text-[6px] text-blue-300/70">WIN</span>
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-[8%] bg-red-500/15 border-l border-red-400/30 flex items-end justify-center pb-2">
        <span className="font-pixel text-[6px] text-red-300/70">WIN</span>
      </div>
    </div>
  )
}
