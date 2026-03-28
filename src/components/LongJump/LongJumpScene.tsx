import { getCharacterRunFrames, TILESETS, OBJECTS } from '../../utils/pixelArt'
import { AnimatedSprite } from '../shared/AnimatedSprite'
import { getCustomCharacterFrames } from '../../utils/customCharacters'
import type { Player, PlayerId } from '../../types'

interface PlayerMomentum {
  correct: number
  totalScore: number
  eliminated: boolean
}

export interface LongJumpSceneProps {
  players: Player[]
  playerMomentum: Map<PlayerId, PlayerMomentum>
  phase: 'building' | 'jumping' | 'results'
  jumpingPlayer: PlayerId | null
  jumpDistances: Map<PlayerId, number>
  maxPossibleScore: number
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

function getMomentumColor(correct: number, maxQuestions: number): string {
  const ratio = correct / maxQuestions
  if (ratio <= 0.3) return '#22c55e'   // green (easy zone)
  if (ratio <= 0.6) return '#eab308'   // yellow (medium zone)
  return '#ef4444'                      // red (hard zone)
}

export function LongJumpScene({
  players,
  playerMomentum,
  phase,
  jumpingPlayer,
  jumpDistances,
  maxPossibleScore,
}: LongJumpSceneProps) {
  const hasGrass = !!TILESETS.grass
  const spriteSize = 96

  // Sand pit starts at 55% of width, ends at 95%
  const SAND_START = 55
  const SAND_END = 95
  const TRACK_START = 5
  const TRACK_Y = 58 // percentage top for ground level

  // Convert a score to an X position in the sand pit
  const scoreToX = (score: number) => {
    if (maxPossibleScore === 0) return SAND_START
    const ratio = Math.min(score / maxPossibleScore, 1)
    return SAND_START + ratio * (SAND_END - SAND_START - 5)
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
          <img src={OBJECTS['tree']} alt="" style={{ position: 'absolute', imageRendering: 'pixelated', bottom: '44%', left: '2%', height: 48, width: 'auto', opacity: 0.45 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          <img src={OBJECTS['tree']} alt="" style={{ position: 'absolute', imageRendering: 'pixelated', bottom: '44%', right: '3%', height: 52, width: 'auto', opacity: 0.5 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
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
            height: '14%',
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
            height: '14%',
            background: 'linear-gradient(180deg, #4ade80 0%, #22c55e 100%)',
          }}
        />
      )}

      {/* Running track (brown) */}
      <div
        style={{
          position: 'absolute',
          left: `${TRACK_START}%`,
          width: `${SAND_START - TRACK_START}%`,
          top: `${TRACK_Y}%`,
          bottom: 0,
          background: 'linear-gradient(180deg, #dc6b2f 0%, #c2410c 40%, #9a3412 100%)',
        }}
      />

      {/* Track lane lines */}
      {Array.from({ length: players.length + 1 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${TRACK_START}%`,
            width: `${SAND_START - TRACK_START}%`,
            top: `${TRACK_Y + (i / Math.max(players.length, 1)) * 38}%`,
            height: '1px',
            background: 'rgba(255,255,255,0.2)',
          }}
        />
      ))}

      {/* Sand pit */}
      <div
        style={{
          position: 'absolute',
          left: `${SAND_START}%`,
          width: `${SAND_END - SAND_START}%`,
          top: `${TRACK_Y}%`,
          bottom: 0,
          background: 'linear-gradient(180deg, #e8c872 0%, #d4a44a 30%, #c4913a 100%)',
          borderLeft: '3px solid #a16207',
        }}
      />

      {/* Sand texture dots */}
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${SAND_START + 2 + (i % 5) * 8}%`,
            top: `${TRACK_Y + 8 + Math.floor(i / 5) * 8}%`,
            width: 2,
            height: 2,
            borderRadius: '50%',
            background: 'rgba(160,120,60,0.3)',
          }}
        />
      ))}

      {/* Distance markers in sand */}
      {[0, 25, 50, 75, 100].map(pct => {
        const x = SAND_START + (pct / 100) * (SAND_END - SAND_START - 5)
        const label = maxPossibleScore > 0
          ? `${Math.round((pct / 100) * maxPossibleScore)}m`
          : `${pct}%`
        return (
          <div key={pct}>
            <div
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${TRACK_Y}%`,
                bottom: '2%',
                width: '1px',
                background: 'rgba(139,69,19,0.3)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: `${x}%`,
                bottom: '3%',
                transform: 'translateX(-50%)',
                fontFamily: '"Pixelify Sans", "Press Start 2P", monospace',
                fontSize: '10px',
                color: 'rgba(139,69,19,0.6)',
              }}
            >
              {label}
            </div>
          </div>
        )
      })}

      {/* Take-off board marker */}
      {OBJECTS['takeoff-board'] ? (
        <img
          src={OBJECTS['takeoff-board']}
          alt=""
          style={{
            position: 'absolute',
            left: `${SAND_START - 2}%`,
            top: `${TRACK_Y - 4}%`,
            width: 40,
            height: 40,
            imageRendering: 'pixelated',
          }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            left: `${SAND_START - 1}%`,
            top: `${TRACK_Y - 2}%`,
            width: '2%',
            height: '6%',
            background: '#ffffff',
            border: '1px solid #ccc',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: `${SAND_START - 2}%`,
          top: `${TRACK_Y - 6}%`,
          fontFamily: '"Pixelify Sans", "Press Start 2P", monospace',
          fontSize: '10px',
          color: 'white',
          textShadow: '1px 1px 0 rgba(0,0,0,0.8)',
          whiteSpace: 'nowrap',
        }}
      >
        JUMP!
      </div>

      {/* Momentum meters during building phase */}
      {phase === 'building' && (
        <div
          style={{
            position: 'absolute',
            left: '2%',
            top: '4%',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {players.map(player => {
            const pid = player.id as PlayerId
            const momentum = playerMomentum.get(pid)
            const correct = momentum?.correct ?? 0
            const eliminated = momentum?.eliminated ?? false
            const barWidth = 120
            const fillPct = (correct / 10) * 100

            return (
              <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    fontFamily: '"Pixelify Sans", "Press Start 2P", monospace',
                    fontSize: '11px',
                    color: eliminated ? 'rgba(255,255,255,0.3)' : player.color,
                    textShadow: '1px 1px 0 rgba(0,0,0,0.9)',
                    width: 50,
                    textAlign: 'right',
                    textDecoration: eliminated ? 'line-through' : 'none',
                  }}
                >
                  {player.name}
                </div>
                <div
                  style={{
                    width: barWidth,
                    height: 10,
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 2,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: `${fillPct}%`,
                      height: '100%',
                      background: eliminated
                        ? 'rgba(100,100,100,0.5)'
                        : getMomentumColor(correct, 10),
                      transition: 'width 0.3s ease-out, background-color 0.3s',
                    }}
                  />
                  {eliminated && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: '"Pixelify Sans", "Press Start 2P", monospace',
                        fontSize: '9px',
                        color: 'rgba(255,100,100,0.8)',
                      }}
                    >
                      LOCKED
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: '"Pixelify Sans", "Press Start 2P", monospace',
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.6)',
                    width: 20,
                  }}
                >
                  {correct}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Player sprites */}
      {players.map((player, i) => {
        const pid = player.id as PlayerId
        const momentum = playerMomentum.get(pid)
        const distance = jumpDistances.get(pid) ?? 0
        const eliminated = momentum?.eliminated ?? false
        const laneOffset = (i / Math.max(players.length, 1)) * 36

        const frames = getPlayerFrames(player)
        const charKey = player.type === 'cpu' ? (CPU_NAME_MAP[player.name] || 'default-player') : 'default-player'
        const fallbackColor = FALLBACK_COLORS[charKey] || player.color

        // Position depends on phase
        let xPercent: number
        const yTop = TRACK_Y + laneOffset
        let animClass = ''

        if (phase === 'building') {
          // Idle at start of track
          xPercent = TRACK_START + 5
        } else if (phase === 'jumping' && jumpingPlayer === pid) {
          // Currently jumping — use CSS animation
          xPercent = scoreToX(distance)
          animClass = 'long-jump-arc'
        } else if (phase === 'jumping' && distance > 0) {
          // Already landed
          xPercent = scoreToX(distance)
        } else if (phase === 'results') {
          xPercent = distance > 0 ? scoreToX(distance) : TRACK_START + 5
        } else {
          // Waiting to jump
          xPercent = TRACK_START + 5
        }

        // Determine if currently running (pre-jump animation)
        const isRunning = phase === 'jumping' && jumpingPlayer === pid

        return (
          <div
            key={player.id}
            className={animClass}
            style={{
              position: 'absolute',
              left: `${xPercent}%`,
              top: `${yTop}%`,
              transition: phase === 'results' ? 'left 0.5s ease-out' : 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: 'translate(-50%, -50%)',
              opacity: phase === 'building' && eliminated ? 0.5 : 1,
              zIndex: jumpingPlayer === pid ? 10 : 1,
            }}
          >
            {/* Player name label */}
            <div
              style={{
                fontFamily: '"Pixelify Sans", "Press Start 2P", monospace',
                fontSize: '11px',
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
                fps={isRunning ? 12 : 4}
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
            {/* Distance label during results */}
            {(phase === 'results' || (phase === 'jumping' && distance > 0 && jumpingPlayer !== pid)) && (
              <div
                style={{
                  fontFamily: '"Pixelify Sans", "Press Start 2P", monospace',
                  fontSize: '12px',
                  color: '#fbbf24',
                  textShadow: '1px 1px 0 rgba(0,0,0,0.9)',
                  marginTop: '2px',
                  background: 'rgba(0,0,0,0.5)',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                {distance}m
              </div>
            )}
          </div>
        )
      })}

      {/* Foul line */}
      <div
        style={{
          position: 'absolute',
          left: `${SAND_START}%`,
          top: `${TRACK_Y - 2}%`,
          bottom: '2%',
          width: '2px',
          background: 'repeating-linear-gradient(180deg, white 0px, white 4px, transparent 4px, transparent 8px)',
          opacity: 0.6,
        }}
      />

      {/* CSS animations */}
      <style>{`
        @keyframes long-jump-arc {
          0% { transform: translate(-50%, -50%) translateX(-200px); }
          30% { transform: translate(-50%, -50%) translateX(-60px) translateY(-60px); }
          50% { transform: translate(-50%, -50%) translateY(-80px); }
          70% { transform: translate(-50%, -50%) translateX(20px) translateY(-40px); }
          90% { transform: translate(-50%, -50%) translateX(0) translateY(-5px); }
          100% { transform: translate(-50%, -50%) translateX(0) translateY(0); }
        }
        .long-jump-arc {
          animation: long-jump-arc 1.2s ease-in-out forwards;
        }
      `}</style>
    </div>
  )
}
