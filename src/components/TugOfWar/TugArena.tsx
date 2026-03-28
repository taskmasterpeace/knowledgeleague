import { getArenaAssets, getCharacterRunFrames, OBJECTS } from '../../utils/pixelArt'
import { AnimatedSprite } from '../shared/AnimatedSprite'
import { getCustomCharacterFrames } from '../../utils/customCharacters'
import type { TugArenaType, Player } from '../../types'

interface TugArenaProps {
  arenaType: TugArenaType
  ropePosition: number
  leftTeam: Player[]
  rightTeam: Player[]
}

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
}

function getPlayerFrames(player: Player): string[] {
  const customFrames = getCustomCharacterFrames(player.name)
  if (customFrames.length > 0) return customFrames
  if (player.type === 'cpu') {
    const charName = CPU_NAME_MAP[player.name] ?? 'default-player'
    return getCharacterRunFrames(charName)
  }
  return getCharacterRunFrames('default-player')
}

function getPlayerColor(player: Player): string {
  if (player.type === 'cpu') {
    return FALLBACK_COLORS[CPU_NAME_MAP[player.name]] || player.color
  }
  return player.color
}

const SPRITE_SIZE = 112

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
          <div style={{
            width: 0,
            height: 0,
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderBottom: '30px solid #f97316',
            margin: '0 auto',
          }} />
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

function PlayerSprite({ player, flipped }: { player: Player; flipped?: boolean }) {
  const frames = getPlayerFrames(player)
  const color = getPlayerColor(player)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        className="font-pixel-body text-[11px] text-white text-center mb-0.5 whitespace-nowrap"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)', transform: flipped ? 'scaleX(-1)' : undefined }}
      >
        {player.name}
      </div>
      {frames.length > 0 ? (
        <AnimatedSprite
          frames={frames}
          fps={6}
          width={SPRITE_SIZE}
          height={SPRITE_SIZE}
          alt={player.name}
        />
      ) : (
        <div
          style={{
            width: SPRITE_SIZE - 16,
            height: SPRITE_SIZE - 16,
            borderRadius: '10px',
            background: color,
            border: '3px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '16px',
            color: 'white',
            textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
          }}
        >
          {player.name[0]}
        </div>
      )}
    </div>
  )
}

export function TugArena({ arenaType, ropePosition, leftTeam, rightTeam }: TugArenaProps) {
  const assets = getArenaAssets(arenaType)

  const leftX = 20 + ropePosition * 0.15
  const rightX = 80 + ropePosition * 0.15

  return (
    <div
      className="rounded-lg overflow-hidden relative"
      style={{ height: 320, imageRendering: 'pixelated' }}
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
            onError={(e) => { ;(e.currentTarget as HTMLImageElement).style.display = 'none' }}
            style={{
              imageRendering: 'pixelated',
              bottom: 80 + i * 20,
              left: `${10 + i * 18}%`,
              height: 48,
              width: 'auto',
            }}
          />
        ))}
        {/* Crowd bleachers for stadium */}
        {arenaType === 'stadium' && OBJECTS['crowd'] && (
          <>
            <img
              src={OBJECTS['crowd']}
              alt=""
              className="absolute opacity-70"
              onError={(e) => { ;(e.currentTarget as HTMLImageElement).style.display = 'none' }}
              style={{ imageRendering: 'pixelated', top: 4, left: '2%', height: 80, width: 'auto' }}
            />
            <img
              src={OBJECTS['crowd']}
              alt=""
              className="absolute opacity-70"
              onError={(e) => { ;(e.currentTarget as HTMLImageElement).style.display = 'none' }}
              style={{ imageRendering: 'pixelated', top: 4, right: '2%', height: 80, width: 'auto', transform: 'scaleX(-1)' }}
            />
          </>
        )}
      </div>

      {/* Ground surface */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: 60,
          backgroundImage: assets.ground ? `url(${assets.ground})` : undefined,
          background: assets.ground ? undefined : 'linear-gradient(180deg, #6b4226 0%, #5a3520 100%)',
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
          top: 186,
          height: 16,
          transform: `translateX(${ropePosition * 1.5}px)`,
        }}
      >
        {OBJECTS['tug-rope'] ? (
          <img
            src={OBJECTS['tug-rope']}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              imageRendering: 'pixelated',
            }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div
            className="w-full h-full rounded"
            style={{
              background: 'repeating-linear-gradient(90deg, #92400e 0px, #b45309 4px, #78350f 8px)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          />
        )}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
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

      {/* Left team */}
      {leftTeam.map((player, i) => {
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
            <PlayerSprite player={player} />
          </div>
        )
      })}

      {/* Right team (flipped) */}
      {rightTeam.map((player, i) => {
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
            <PlayerSprite player={player} flipped />
          </div>
        )
      })}

      {/* Win zone indicators */}
      <div className="absolute left-0 top-0 bottom-0 w-[8%] bg-blue-500/15 border-r border-blue-400/30 flex items-end justify-center pb-2">
        <span className="font-pixel-body text-[10px] text-blue-300/70">WIN</span>
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-[8%] bg-red-500/15 border-l border-red-400/30 flex items-end justify-center pb-2">
        <span className="font-pixel-body text-[10px] text-red-300/70">WIN</span>
      </div>
    </div>
  )
}
