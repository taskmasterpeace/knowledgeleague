import { useEffect, useState, useRef } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { sounds } from '../../utils/sounds'

interface Props {
  onTimeUp: () => void
  resetKey: number
  timeLimit: number
}

export function Timer({ onTimeUp, resetKey, timeLimit }: Props) {
  const [remaining, setRemaining] = useState(timeLimit)
  // eslint-disable-next-line react-hooks/purity
  const startRef = useRef(Date.now())
  const lastBeepSecRef = useRef(-1)
  const { soundEnabled } = useSettings()

  useEffect(() => {
    startRef.current = Date.now()
    setRemaining(timeLimit)
    lastBeepSecRef.current = -1
  }, [resetKey, timeLimit])

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const left = Math.max(0, timeLimit - elapsed)
      setRemaining(left)

      // Timer countdown beeps for last 3 seconds
      if (left <= 3000 && left > 0) {
        const sec = Math.ceil(left / 1000)
        if (sec !== lastBeepSecRef.current) {
          lastBeepSecRef.current = sec
          if (soundEnabled) {
            if (sec === 1) {
              sounds.timerFinal()
            } else {
              sounds.timerWarn()
            }
          }
        }
      }

      if (left <= 0) {
        clearInterval(interval)
        onTimeUp()
      }
    }, 50)
    return () => clearInterval(interval)
  }, [onTimeUp, resetKey, timeLimit, soundEnabled])

  const pct = (remaining / timeLimit) * 100
  const seconds = Math.ceil(remaining / 1000)
  const urgent = remaining <= 3000

  // Color shifts from green to yellow to red
  const barColor = urgent ? '#ef4444' : pct > 50 ? '#4ade80' : pct > 25 ? '#facc15' : '#f97316'

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="font-pixel-body text-sm font-bold text-cyan-300/80">TIME</span>
        <div className="flex-1 h-4 bg-gray-900/80 rounded-sm border border-gray-600/50 overflow-hidden relative">
          {/* Striped background */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.3) 8px, rgba(255,255,255,0.3) 9px)',
            }}
          />
          {/* Fill */}
          <div
            className="h-full rounded-sm transition-all duration-100 relative"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(180deg, ${barColor} 0%, ${barColor}aa 100%)`,
              boxShadow: urgent ? `0 0 12px ${barColor}88` : `0 0 6px ${barColor}44`,
              animation: urgent ? 'timer-urgent-flash 0.5s ease-in-out infinite' : 'none',
            }}
          />
        </div>
        <span className={`font-pixel-body text-base font-bold min-w-[36px] text-right ${urgent ? 'text-red-400' : 'text-white/70'}`}
          style={urgent ? { animation: 'timer-urgent-flash 0.5s ease-in-out infinite' } : {}}
        >
          {seconds}s
        </span>
      </div>
    </div>
  )
}
