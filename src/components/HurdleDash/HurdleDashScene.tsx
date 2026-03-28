import { getCharacterRunFrames, TILESETS, OBJECTS } from '../../utils/pixelArt'
import { AnimatedSprite } from '../shared/AnimatedSprite'
import { getCustomCharacterFrames } from '../../utils/customCharacters'
import type { Player, PlayerId } from '../../types'

interface HurdleDashSceneProps {
  players: Player[]
  totalHurdles: number
  jumpingPlayers: Set<PlayerId>
  trippedPlayers: Set<PlayerId>
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
  const customFrames = getCustomCharacterFrames(player.name)
  if (customFrames.length > 0) return customFrames

  if (player.type === 'cpu') {
    const charKey = CPU_NAME_MAP[player.name] || 'default-player'
    return getCharacterRunFrames(charKey)
  }
  return getCharacterRunFrames('default-player')
}

export function HurdleDashScene({ players, totalHurdles, jumpingPlayers, trippedPlayers }: HurdleDashSceneProps) {
  const hasGrass = !!TILESETS.grass
  const laneCount = Math.max(players.length, 1)
  const spriteSize = Math.min(128, Math.floor((SCENE_HEIGHT * 0.55) / laneCount))
  const trackTop = 58 // percentage where track area starts

  // Generate hurdle X positions evenly spaced across the track
  const hurdlePositions: number[] = []
  for (let i = 1; i <= totalHurdles; i++) {
    // Map hurdle index to X percent (5% to 90% range)
    hurdlePositions.push((i / (totalHurdles + 1)) * 85 + 5)
  }

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
      {/* Sky gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #1e40af 0%, #3b82f6 40%, #7dd3fc 70%, #bae6fd 100%)',
        }}
      />

      {/* Crowd bleachers in background */}
      {OBJECTS['crowd'] && (
        <>
          <img
            src={OBJECTS['crowd']}
            alt=""
            style={{ position: 'absolute', imageRendering: 'pixelated', top: 4, left: '3%', height: 72, width: 'auto', opacity: 0.5 }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
          <img
            src={OBJECTS['crowd']}
            alt=""
            style={{ position: 'absolute', imageRendering: 'pixelated', top: 4, right: '3%', height: 72, width: 'auto', opacity: 0.5, transform: 'scaleX(-1)' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        </>
      )}

      {/* Clouds */}
      {[15, 40, 65, 85].map((left, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${left}%`,
            top: `${10 + (i % 3) * 8}%`,
            width: 48 + i * 8,
            height: 16 + i * 2,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.4)',
            filter: 'blur(2px)',
          }}
        />
      ))}

      {/* Background trees */}
      {OBJECTS['tree'] && (
        <>
          <img src={OBJECTS['tree']} alt="" style={{ position: 'absolute', imageRendering: 'pixelated', bottom: '44%', left: '15%', height: 46, width: 'auto', opacity: 0.4 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          <img src={OBJECTS['tree']} alt="" style={{ position: 'absolute', imageRendering: 'pixelated', bottom: '44%', left: '50%', height: 50, width: 'auto', opacity: 0.45 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          <img src={OBJECTS['tree']} alt="" style={{ position: 'absolute', imageRendering: 'pixelated', bottom: '44%', right: '10%', height: 44, width: 'auto', opacity: 0.4 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        </>
      )}

      {/* Grass ground */}
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

      {/* Track surface */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '56%',
          bottom: 0,
          background: 'linear-gradient(180deg, #dc6b2f 0%, #c2410c 40%, #9a3412 100%)',
        }}
      />

      {/* Track lane lines */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${trackTop}%`,
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
              background: 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>

      {/* Hurdles */}
      {hurdlePositions.map((xPercent, hurdleIdx) => (
        <div key={hurdleIdx}>
          {/* Render a hurdle for each lane */}
          {players.map((_, laneIdx) => {
            const laneTop = trackTop + (laneIdx / laneCount) * 36
            const playerCleared = players[laneIdx] && players[laneIdx].position > hurdleIdx
            return (
              <div
                key={laneIdx}
                style={{
                  position: 'absolute',
                  left: `${xPercent}%`,
                  top: `${laneTop - 2}%`,
                  transform: 'translateX(-50%)',
                  opacity: playerCleared ? 0.25 : 1,
                  transition: 'opacity 0.3s',
                }}
              >
                {OBJECTS['hurdle'] ? (
                  <img
                    src={OBJECTS['hurdle']}
                    alt="hurdle"
                    style={{ width: 28, height: 28, imageRendering: 'pixelated' }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
                    <rect x="2" y="8" width="3" height="20" fill="#a16207" />
                    <rect x="19" y="8" width="3" height="20" fill="#a16207" />
                    <rect x="0" y="6" width="24" height="4" rx="1" fill="#f59e0b" />
                    <rect x="0" y="6" width="24" height="2" rx="1" fill="#fbbf24" />
                  </svg>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {/* Player sprites */}
      {players.map((player, i) => {
        const xPercent = Math.min((player.position / totalHurdles) * 85 + 5, 90)
        const laneTop = trackTop + (i / laneCount) * 36
        const frames = getPlayerFrames(player)
        const charKey = player.type === 'cpu' ? (CPU_NAME_MAP[player.name] || 'default-player') : 'default-player'
        const fallbackColor = FALLBACK_COLORS[charKey] || player.color

        const isJumping = jumpingPlayers.has(player.id as PlayerId)
        const isTripped = trippedPlayers.has(player.id as PlayerId)

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
              transform: `translate(-50%, -50%) ${isJumping ? 'translateY(-20px)' : ''} ${isTripped ? 'rotate(15deg)' : ''}`,
              animation: isTripped ? 'hurdle-stumble 0.4s ease-in-out' : isJumping ? 'hurdle-jump 0.6s ease-out' : undefined,
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
                fps={isTripped ? 4 : 8}
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
            {/* Hurdle count indicator */}
            <div
              style={{
                fontFamily: '"Pixelify Sans", "Press Start 2P", monospace',
                fontSize: '10px',
                color: '#fbbf24',
                textShadow: '1px 1px 0 rgba(0,0,0,0.9)',
                marginTop: '2px',
              }}
            >
              {player.position}/{totalHurdles}
            </div>
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

      {/* Finish flag */}
      {OBJECTS['finish-flag'] && (
        <img
          src={OBJECTS['finish-flag']}
          alt=""
          style={{
            position: 'absolute',
            right: '2.5%',
            top: '42%',
            width: 36,
            height: 36,
            imageRendering: 'pixelated',
            opacity: 0.9,
          }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes hurdle-jump {
          0% { transform: translate(-50%, -50%) translateY(0); }
          40% { transform: translate(-50%, -50%) translateY(-24px); }
          100% { transform: translate(-50%, -50%) translateY(0); }
        }
        @keyframes hurdle-stumble {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          20% { transform: translate(-50%, -50%) rotate(15deg) translateX(4px); }
          40% { transform: translate(-50%, -50%) rotate(-10deg) translateX(-4px); }
          60% { transform: translate(-50%, -50%) rotate(8deg) translateX(2px); }
          80% { transform: translate(-50%, -50%) rotate(-4deg); }
          100% { transform: translate(-50%, -50%) rotate(0deg); }
        }
      `}</style>
    </div>
  )
}
