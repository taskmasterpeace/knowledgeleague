import { useEffect, useState, useRef } from 'react'

interface Props {
  onTimeUp: () => void
  resetKey: number
  timeLimit: number
}

export function Timer({ onTimeUp, resetKey, timeLimit }: Props) {
  const [remaining, setRemaining] = useState(timeLimit)
  const startRef = useRef(Date.now())

  useEffect(() => {
    startRef.current = Date.now()
    setRemaining(timeLimit)
  }, [resetKey, timeLimit])

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const left = Math.max(0, timeLimit - elapsed)
      setRemaining(left)
      if (left <= 0) {
        clearInterval(interval)
        onTimeUp()
      }
    }, 50)
    return () => clearInterval(interval)
  }, [onTimeUp, resetKey, timeLimit])

  const pct = (remaining / timeLimit) * 100
  const urgent = remaining <= 3000

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="h-4 bg-white/20 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-100 ${urgent ? 'bg-red-500 animate-pulse' : 'bg-green-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
