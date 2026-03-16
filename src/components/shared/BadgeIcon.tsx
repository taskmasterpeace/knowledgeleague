import type { Badge } from '../../types'

interface BadgeIconProps {
  tier: Badge['tier']
  size?: number
  earned?: boolean
}

const TIER_COLORS: Record<Badge['tier'], string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  master: '#E5E4E2',
}

export function BadgeIcon({ tier, size = 24, earned = true }: BadgeIconProps) {
  const color = TIER_COLORS[tier]
  const isMaster = tier === 'master'

  const shield = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: earned
          ? `drop-shadow(0 0 ${size * 0.2}px ${color})`
          : 'grayscale(1)',
        opacity: earned ? 1 : 0.2,
      }}
    >
      {/* Shield body */}
      <path
        d="M12 2 L20 5 L20 12 C20 17 12 22 12 22 C12 22 4 17 4 12 L4 5 Z"
        fill={color}
        stroke={color === '#C0C0C0' ? '#A0A0A0' : color}
        strokeWidth="1"
      />
      {/* Inner highlight */}
      <path
        d="M12 4.5 L18 7 L18 12 C18 15.5 12 19.5 12 19.5"
        stroke="white"
        strokeWidth="0.8"
        strokeOpacity="0.4"
        fill="none"
      />
      {/* Star emblem */}
      <path
        d="M12 7.5 L12.8 9.9 L15.4 9.9 L13.3 11.4 L14.1 13.8 L12 12.3 L9.9 13.8 L10.7 11.4 L8.6 9.9 L11.2 9.9 Z"
        fill="white"
        fillOpacity="0.85"
      />
    </svg>
  )

  if (isMaster && earned) {
    return (
      <span className="rainbow-shimmer" style={{ display: 'inline-flex' }}>
        {shield}
      </span>
    )
  }

  return shield
}
