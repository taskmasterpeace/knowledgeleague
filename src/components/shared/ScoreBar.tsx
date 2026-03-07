interface Props {
  position: number    // 0-100
  color: string
  label: string
}

export function ScoreBar({ position, color, label }: Props) {
  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-white font-bold text-sm w-24 truncate">{label}</span>
      <div className="flex-1 h-6 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.max(0, Math.min(100, position))}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-white font-bold text-sm w-12 text-right">{Math.round(position)}%</span>
    </div>
  )
}
