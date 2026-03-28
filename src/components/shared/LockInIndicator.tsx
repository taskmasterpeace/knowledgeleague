import type { PlayerId } from '../../types'

interface LockInProps {
  players: { id: number; name: string; color: string }[]
  lockedIn: Set<PlayerId>
}

export function LockInIndicator({ players, lockedIn }: LockInProps) {
  if (players.length < 2) return null

  return (
    <div className="flex gap-3 justify-center items-center py-1">
      {players.map(p => {
        const locked = lockedIn.has(p.id as PlayerId)
        return (
          <div
            key={p.id}
            className="flex items-center gap-1.5 transition-all"
            style={{ opacity: locked ? 1 : 0.35 }}
          >
            <div
              className="w-4 h-4 rounded-sm border"
              style={{
                backgroundColor: locked ? p.color : 'transparent',
                borderColor: p.color,
                boxShadow: locked ? `0 0 6px ${p.color}` : 'none',
                transition: 'all 0.2s',
              }}
            />
            <span
              className="font-pixel-body font-bold text-sm uppercase"
              style={{
                color: locked ? p.color : 'rgba(255,255,255,0.3)',
                textShadow: locked ? `0 0 4px ${p.color}` : 'none',
                transition: 'all 0.2s',
              }}
            >
              {p.name}
            </span>
            {locked && (
              <span className="font-pixel-body font-bold text-sm text-green-400" style={{ animation: 'cd-pop 0.4s ease-out' }}>
                LOCKED
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
