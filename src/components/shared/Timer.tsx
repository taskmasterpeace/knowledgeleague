import { useEffect, useState, useRef } from 'react'
import { PROBLEM_TIME_LIMIT, URGENT_THRESHOLD } from '../../utils/constants'

interface Props {
  onTimeUp: () => void
  resetKey: number
}

export function Timer({ onTimeUp, resetKey }: Props) {
  const [remaining, setRemaining] = useState(PROBLEM_TIME_LIMIT)
  const startRef = useRef(Date.now())

  useEffect(() => {
    startRef.current = Date.now()
    setRemaining(PROBLEM_TIME_LIMIT)
  }, [resetKey])

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const left = Math.max(0, PROBLEM_TIME_LIMIT - elapsed)
      setRemaining(left)
      if (left <= 0) {
        clearInterval(interval)
        onTimeUp()
      }
    }, 50)
    return () => clearInterval(interval)
  }, [onTimeUp, resetKey])

  const pct = (remaining / PROBLEM_TIME_LIMIT) * 100
  const urgent = remaining <= URGENT_THRESHOLD

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
