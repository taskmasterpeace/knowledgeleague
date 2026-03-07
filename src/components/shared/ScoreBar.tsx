interface Props {
  position: number    // 0 to trackLength
  trackLength: number
  color: string
  label: string
}

export function ScoreBar({ position, trackLength, color, label }: Props) {
  const pct = Math.max(0, Math.min(100, (position / trackLength) * 100))
  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-white font-bold text-sm w-24 truncate">{label}</span>
      <div className="flex-1 h-6 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-white font-bold text-sm w-16 text-right">{Math.round(position)}/{trackLength}</span>
    </div>
  )
}
