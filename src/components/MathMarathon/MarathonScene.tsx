import { getCharacterRunFrames, TILESETS, OBJECTS } from '../../utils/pixelArt'
import { AnimatedSprite } from '../shared/AnimatedSprite'
import { getCustomCharacterFrames } from '../../utils/customCharacters'
import type { Player } from '../../types'

interface MarathonSceneProps {
  players: Player[]
  totalSpaces?: number
}

const SCENE_HEIGHT = 320

const CPU_NAME_MAP: Record<string, string> = {
  Kevin: 'kevin',
  Sally: 'sally',
  Benny: 'benny',
  Mia: 'mia',
  Jayden: 'jayden',
}

const FALLBACK_COLORS: Record<string, string> = {
  kevin: '#ef4444',
  sally: '#a855f7',
  benny: '#22c55e',
  mia: '#f97316',
  jayden: '#06b6d4',
  'default-player': '#3b82f6',
}

function getPlayerFrames(player: Player): string[] {
  // Check for custom pixel art character first
  const customFrames = getCustomCharacterFrames(player.name)
  if (customFrames.length > 0) return customFrames

  // Fall back to built-in CPU characters
  if (player.type === 'cpu') {
    const charKey = CPU_NAME_MAP[player.name] || 'default-player'
    return getCharacterRunFrames(charKey)
  }
  return getCharacterRunFrames('default-player')
}

export function MarathonScene({ players, totalSpaces = 20 }: MarathonSceneProps) {
  const hasSkyBg = !!OBJECTS['sky-background']
  const hasDirtTrack = !!TILESETS['dirt-track']
  const hasGrass = !!TILESETS.grass
  const laneCount = Math.max(players.length, 1)
  const spriteSize = Math.min(128, Math.floor((SCENE_HEIGHT * 0.55) / laneCount))

  return (
    <div
      className="rounded-lg overflow-hidden mb-4"
      style={{
        position: 'relative',
        height: SCENE_HEIGHT,
        width: '100%',
        imageRendering: 'pixelated',
      }}
    >
      {/* Sky background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #1a0533 0%, #2d1b69 30%, #e87d3e 70%, #f4a460 100%)',
        }}
      >
        {hasSkyBg && (
          <img
            src={OBJECTS['sky-background']}
            alt=""
            style={{
              width: '100%',
              height: '70%',
              objectFit: 'cover',
              imageRendering: 'pixelated',
              opacity: 0.8,
            }}
          />
        )}
      </div>

      {/* Background scenery — trees and crowd */}
      {OBJECTS['tree'] && (
        <>
          <img src={OBJECTS['tree']} alt="" style={{ position: 'absolute', imageRendering: 'pixelated', bottom: '44%', left: '8%', height: 52, width: 'auto', opacity: 0.5 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          <img src={OBJECTS['tree']} alt="" style={{ position: 'absolute', imageRendering: 'pixelated', bottom: '44%', left: '35%', height: 44, width: 'auto', opacity: 0.4 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          <img src={OBJECTS['tree']} alt="" style={{ position: 'absolute', imageRendering: 'pixelated', bottom: '44%', right: '20%', height: 48, width: 'auto', opacity: 0.45 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        </>
      )}
      {OBJECTS['bush'] && (
        <>
          <img src={OBJECTS['bush']} alt="" style={{ position: 'absolute', imageRendering: 'pixelated', bottom: '42%', left: '22%', height: 20, width: 'auto', opacity: 0.5 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          <img src={OBJECTS['bush']} alt="" style={{ position: 'absolute', imageRendering: 'pixelated', bottom: '42%', right: '12%', height: 20, width: 'auto', opacity: 0.5 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        </>
      )}
      {OBJECTS['crowd'] && (
        <img
          src={OBJECTS['crowd']}
          alt=""
          style={{ position: 'absolute', imageRendering: 'pixelated', top: 2, right: '4%', height: 64, width: 'auto', opacity: 0.35 }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      )}

      {/* Grass edge */}
      {hasGrass ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '48%',
            height: '20%',
            backgroundImage: `url(${TILESETS.grass})`,
            backgroundRepeat: 'repeat-x',
            backgroundSize: '32px 32px',
            imageRendering: 'pixelated',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '48%',
            height: '20%',
            background: 'linear-gradient(180deg, #4ade80 0%, #22c55e 100%)',
          }}
        />
      )}

      {/* Dirt track */}
      {hasDirtTrack ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '56%',
            bottom: 0,
            backgroundImage: `url(${TILESETS['dirt-track']})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '32px 32px',
            imageRendering: 'pixelated',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '56%',
            bottom: 0,
            background: 'linear-gradient(180deg, #92400e 0%, #78350f 100%)',
          }}
        />
      )}

      {/* Lane dividers */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '58%',
          bottom: '5%',
        }}
      >
        {Array.from({ length: laneCount + 1 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${(i / laneCount) * 100}%`,
              height: '1px',
              background: 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>

      {/* Player sprites */}
      {players.map((player, i) => {
        const xPercent = Math.min((player.position / totalSpaces) * 85 + 5, 90)
        const laneTop = 58 + (i / laneCount) * 36
        const frames = getPlayerFrames(player)
        const charKey = player.type === 'cpu' ? (CPU_NAME_MAP[player.name] || 'default-player') : 'default-player'
        const fallbackColor = FALLBACK_COLORS[charKey] || player.color

        return (
          <div
            key={player.id}
            style={{
              position: 'absolute',
              left: `${xPercent}%`,
              top: `${laneTop}%`,
              transition: 'left 0.5s ease-out',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Player name label */}
            <div
              style={{
                fontFamily: '"Pixelify Sans", "Press Start 2P", monospace',
                fontSize: '12px',
                color: player.color,
                textShadow: '1px 1px 0 rgba(0,0,0,0.9)',
                whiteSpace: 'nowrap',
                marginBottom: '2px',
              }}
            >
              {player.name}
            </div>
            {/* Animated character sprite or fallback */}
            {frames.length > 0 ? (
              <AnimatedSprite
                frames={frames}
                fps={8}
                width={spriteSize}
                height={spriteSize}
                alt={player.name}
              />
            ) : (
              <div
                style={{
                  width: spriteSize,
                  height: spriteSize,
                  borderRadius: '10px',
                  background: fallbackColor,
                  border: '3px solid rgba(255,255,255,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: '18px',
                  color: 'white',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                {player.name[0]}
              </div>
            )}
          </div>
        )
      })}

      {/* Start line */}
      <div
        style={{
          position: 'absolute',
          left: '4%',
          top: '54%',
          bottom: '2%',
          width: '3px',
          background: 'repeating-linear-gradient(180deg, white 0px, white 4px, transparent 4px, transparent 8px)',
          opacity: 0.6,
        }}
      />

      {/* Finish line */}
      <div
        style={{
          position: 'absolute',
          right: '4%',
          top: '54%',
          bottom: '2%',
          width: '6px',
          background: 'repeating-linear-gradient(180deg, white 0px, white 4px, #222 4px, #222 8px)',
          opacity: 0.7,
        }}
      />

      {/* Finish flag pixel art */}
      {OBJECTS['finish-flag'] && (
        <img
          src={OBJECTS['finish-flag']}
          alt=""
          style={{
            position: 'absolute',
            right: '2.5%',
            top: '42%',
            width: 40,
            height: 40,
            imageRendering: 'pixelated',
            opacity: 0.9,
          }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      )}
    </div>
  )
}
