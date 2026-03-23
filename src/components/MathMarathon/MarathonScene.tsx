import { getCharacterAsset, TILESETS, OBJECTS } from '../../utils/pixelArt'
import type { Player } from '../../types'

interface MarathonSceneProps {
  players: Player[]
  totalSpaces?: number
}

const SCENE_HEIGHT = 200

const CPU_NAME_MAP: Record<string, string> = {
  Kevin: 'kevin',
  Sally: 'sally',
  Benny: 'benny',
  Mia: 'mia',
}

// Fallback colors for characters without sprites
const FALLBACK_COLORS: Record<string, string> = {
  kevin: '#ef4444',
  sally: '#a855f7',
  benny: '#22c55e',
  mia: '#f97316',
  'default-player': '#3b82f6',
}

export function MarathonScene({ players, totalSpaces = 20 }: MarathonSceneProps) {
  const hasSkyBg = !!OBJECTS['sky-background']
  const hasDirtTrack = !!TILESETS['dirt-track']
  const hasGrass = !!TILESETS.grass
  const laneCount = Math.max(players.length, 1)
  const laneHeight = Math.min(50, (SCENE_HEIGHT * 0.35) / laneCount)

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

      {/* Grass edge */}
      {hasGrass ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '52%',
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
            top: '52%',
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
            top: '60%',
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
            top: '60%',
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
          top: '62%',
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
        const laneTop = 62 + (i / laneCount) * 33
        const charKey = player.type === 'cpu' ? (CPU_NAME_MAP[player.name] || 'default-player') : 'default-player'
        const characterSrc = getCharacterAsset(charKey, 'run')
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
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '7px',
                color: player.color,
                textShadow: '1px 1px 0 rgba(0,0,0,0.9)',
                whiteSpace: 'nowrap',
                marginBottom: '2px',
              }}
            >
              {player.name}
            </div>
            {/* Character sprite or fallback */}
            {characterSrc ? (
              <img
                src={characterSrc}
                alt={player.name}
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
                style={{
                  width: `${laneHeight}px`,
                  height: `${laneHeight}px`,
                  imageRendering: 'pixelated',
                }}
              />
            ) : (
              <div
                style={{
                  width: `${laneHeight - 8}px`,
                  height: `${laneHeight - 8}px`,
                  borderRadius: '6px',
                  background: fallbackColor,
                  border: '2px solid rgba(255,255,255,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: '10px',
                  color: 'white',
                  textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
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
          top: '58%',
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
          top: '58%',
          bottom: '2%',
          width: '6px',
          background: 'repeating-linear-gradient(180deg, white 0px, white 4px, #222 4px, #222 8px)',
          opacity: 0.7,
        }}
      />
    </div>
  )
}
