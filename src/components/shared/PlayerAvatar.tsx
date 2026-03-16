interface Props {
  name: string
  color: string
  size?: number
  isWinning?: boolean
  isLosing?: boolean
  isLocked?: boolean
  isHopping?: boolean
  avatarUrl?: string | null
}

export function PlayerAvatar({ name, color, size = 80, isWinning, isLosing, isLocked, isHopping, avatarUrl }: Props) {
  const initials = name.slice(0, 2).toUpperCase()

  if (avatarUrl) {
    return (
      <div className="flex flex-col items-center gap-1">
        <img
          src={avatarUrl}
          alt={name}
          width={size}
          height={size}
          className={`rounded-lg border-2 transition-all ${isHopping ? 'animate-hop' : ''}`}
          style={{
            imageRendering: 'pixelated',
            borderColor: color,
            opacity: isLocked ? 0.4 : 1,
            filter: isLocked ? 'grayscale(0.5)' : 'none',
          }}
        />
        <span className="text-white font-bold text-sm">{name}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size * 1.5} viewBox="0 0 80 120">
        {/* Head */}
        <circle cx="40" cy="25" r="18" fill={color} opacity={isLocked ? 0.4 : 1} />
        <text x="40" y="30" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
          {initials}
        </text>
        {/* Body */}
        <line x1="40" y1="43" x2="40" y2="80" stroke={color} strokeWidth="4" opacity={isLocked ? 0.4 : 1} />
        {/* Arms */}
        <line x1="40" y1="55" x2="20" y2={isWinning ? '45' : isLosing ? '70' : '65'} stroke={color} strokeWidth="3" opacity={isLocked ? 0.4 : 1} />
        <line x1="40" y1="55" x2="60" y2={isWinning ? '45' : isLosing ? '70' : '65'} stroke={color} strokeWidth="3" opacity={isLocked ? 0.4 : 1} />
        {/* Legs */}
        <line x1="40" y1="80" x2="25" y2="115" stroke={color} strokeWidth="3" opacity={isLocked ? 0.4 : 1} />
        <line x1="40" y1="80" x2="55" y2="115" stroke={color} strokeWidth="3" opacity={isLocked ? 0.4 : 1} />
      </svg>
      <span className="text-white font-bold text-sm">{name}</span>
    </div>
  )
}
