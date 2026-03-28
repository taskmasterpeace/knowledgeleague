import { PlayerAvatar } from '../shared/PlayerAvatar'
import type { Player, PlayerId } from '../../types'

interface SpellingBeeSceneProps {
  players: Player[]
  eliminated: Set<PlayerId>
  roundNumber: number
}

const SCENE_HEIGHT = 280

const PODIUM_COLORS = ['#6366f1', '#7c3aed', '#8b5cf6', '#a78bfa']

export function SpellingBeeScene({ players, eliminated, roundNumber }: SpellingBeeSceneProps) {
  const activeCount = players.filter(p => !eliminated.has(p.id as PlayerId)).length
  const podiumWidth = Math.min(120, 600 / players.length)
  const totalWidth = podiumWidth * players.length + (players.length - 1) * 16

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden"
      style={{
        height: SCENE_HEIGHT,
        background: 'linear-gradient(180deg, #0f0a1e 0%, #1a1145 40%, #2d1b69 100%)',
        imageRendering: 'pixelated',
      }}
    >
      {/* Spotlight beams */}
      {players.map((player, i) => {
        const isOut = eliminated.has(player.id as PlayerId)
        const x = 50 - (totalWidth / 2) + i * (podiumWidth + 16) + podiumWidth / 2
        if (isOut) return null
        return (
          <div
            key={`spotlight-${player.id}`}
            className="absolute top-0"
            style={{
              left: `calc(${(x / totalWidth) * 100}% + ${totalWidth / 2 - podiumWidth / 2}px)`,
              width: podiumWidth + 40,
              height: '100%',
              background: `linear-gradient(180deg, rgba(250,204,21,0.12) 0%, rgba(250,204,21,0.03) 60%, transparent 100%)`,
              clipPath: 'polygon(35% 0%, 65% 0%, 90% 100%, 10% 100%)',
              transform: 'translateX(-20px)',
              pointerEvents: 'none',
            }}
          />
        )
      })}

      {/* Round indicator */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
        <div className="font-pixel text-[10px] text-yellow-300/80 text-center tracking-wider">
          ROUND {roundNumber}
        </div>
        <div className="font-pixel text-[7px] text-white/40 text-center mt-1">
          {activeCount} REMAINING
        </div>
      </div>

      {/* Stage floor */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: 50,
          background: 'linear-gradient(180deg, #1e1250 0%, #150d3a 100%)',
          borderTop: '2px solid rgba(99,102,241,0.3)',
        }}
      />

      {/* Stage edge highlights */}
      <div
        className="absolute bottom-[48px] left-[10%] right-[10%]"
        style={{
          height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent)',
        }}
      />

      {/* Players on podiums */}
      <div
        className="absolute bottom-[50px] left-1/2 -translate-x-1/2 flex items-end justify-center"
        style={{ gap: 16 }}
      >
        {players.map((player, i) => {
          const isOut = eliminated.has(player.id as PlayerId)
          return (
            <div
              key={player.id}
              className="flex flex-col items-center transition-all duration-500"
              style={{
                opacity: isOut ? 0.3 : 1,
                filter: isOut ? 'grayscale(1)' : 'none',
                transform: isOut ? 'scale(0.85)' : 'scale(1)',
                width: podiumWidth,
              }}
            >
              {/* Player avatar */}
              <div className="relative mb-2">
                <PlayerAvatar
                  name={player.name}
                  color={player.color}
                  size={48}
                  avatarUrl={player.avatarUrl}
                />
                {/* Eliminated overlay */}
                {isOut && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="font-pixel text-red-500 text-lg font-bold"
                      style={{
                        textShadow: '0 0 8px rgba(239,68,68,0.8), 2px 2px 0 #000',
                      }}
                    >
                      OUT!
                    </span>
                  </div>
                )}
              </div>

              {/* Player name */}
              <div
                className="font-pixel text-[7px] text-center mb-2 truncate w-full"
                style={{
                  color: isOut ? 'rgba(255,255,255,0.3)' : player.color,
                  textShadow: isOut ? 'none' : `0 0 6px ${player.color}40`,
                }}
              >
                {player.name}
              </div>

              {/* Podium */}
              <div
                className="rounded-t-md w-full"
                style={{
                  height: isOut ? 30 : 50,
                  background: isOut
                    ? 'rgba(100,100,100,0.3)'
                    : `linear-gradient(180deg, ${PODIUM_COLORS[i % PODIUM_COLORS.length]}, ${PODIUM_COLORS[i % PODIUM_COLORS.length]}88)`,
                  border: isOut ? '1px solid rgba(100,100,100,0.2)' : '1px solid rgba(255,255,255,0.1)',
                  borderBottom: 'none',
                  transition: 'height 0.5s ease',
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Decorative stars */}
      {[
        { x: '10%', y: '15%', size: 3, delay: '0s' },
        { x: '85%', y: '20%', size: 2, delay: '1s' },
        { x: '25%', y: '8%', size: 2, delay: '0.5s' },
        { x: '70%', y: '12%', size: 3, delay: '1.5s' },
        { x: '50%', y: '5%', size: 2, delay: '0.8s' },
      ].map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-pulse"
          style={{
            left: star.x,
            top: star.y,
            width: star.size,
            height: star.size,
            backgroundColor: '#facc15',
            animationDelay: star.delay,
            animationDuration: '2s',
          }}
        />
      ))}
    </div>
  )
}
