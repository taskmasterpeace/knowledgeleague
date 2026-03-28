interface Props {
  position: number
  trackLength: number
  color: string
  label: string
}

export function ScoreBar({ position, trackLength, color, label }: Props) {
  const pct = Math.max(0, Math.min(100, (position / trackLength) * 100))
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex items-center gap-2 min-w-[100px]">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
        <span className="font-pixel-body text-sm font-semibold text-white/90 truncate">{label}</span>
      </div>
      <div className="flex-1 h-5 bg-gray-900/80 rounded-sm border border-gray-600/50 overflow-hidden relative">
        {/* Tick marks at 25/50/75% */}
        {[25, 50, 75].map(tick => (
          <div key={tick} className="absolute top-0 bottom-0 w-px bg-white/10" style={{ left: `${tick}%` }} />
        ))}
        {/* Fill bar */}
        <div
          className="h-full rounded-sm transition-all duration-500 relative overflow-hidden"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(180deg, ${color} 0%, ${color}cc 50%, ${color}88 100%)`,
            boxShadow: `0 0 8px ${color}66`,
          }}
        >
          {/* Animated shine stripe */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
               style={{ animation: 'shimmer 2s ease-in-out infinite', backgroundSize: '200% 100%' }} />
        </div>
        {/* Finish star */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 text-yellow-400/60 text-xs">★</div>
      </div>
      <span className="font-pixel-body text-sm font-bold text-yellow-300/80 min-w-[50px] text-right">
        {Math.round(position)}/{trackLength}
      </span>
    </div>
  )
}
