import { useEffect, useCallback } from 'react'
import { P1_CODES, P2_CODES, P3_CODES, P4_CODES } from '../utils/constants'
import type { PlayerId } from '../types'

interface UseKeyboardInputProps {
  onAnswer: (playerId: PlayerId, choiceIndex: number) => void
  enabled: boolean
  playerCount: number
}

export function useKeyboardInput({ onAnswer, enabled, playerCount }: UseKeyboardInputProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return
    const code = e.code
    if (code in P1_CODES) { e.preventDefault(); onAnswer(1, P1_CODES[code]) }
    else if (playerCount >= 2 && code in P2_CODES) { e.preventDefault(); onAnswer(2, P2_CODES[code]) }
    else if (playerCount >= 3 && code in P3_CODES) { e.preventDefault(); onAnswer(3, P3_CODES[code]) }
    else if (playerCount >= 4 && code in P4_CODES) { e.preventDefault(); onAnswer(4, P4_CODES[code]) }
  }, [onAnswer, enabled, playerCount])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
