import { useEffect, useCallback } from 'react'
import { P1_CODES, P2_CODES } from '../utils/constants'

interface UseKeyboardInputProps {
  onP1Answer: (choiceIndex: number) => void
  onP2Answer: (choiceIndex: number) => void
  enabled: boolean
}

export function useKeyboardInput({ onP1Answer, onP2Answer, enabled }: UseKeyboardInputProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return
    const code = e.code
    if (code in P1_CODES) {
      e.preventDefault()
      onP1Answer(P1_CODES[code])
    } else if (code in P2_CODES) {
      e.preventDefault()
      onP2Answer(P2_CODES[code])
    }
  }, [onP1Answer, onP2Answer, enabled])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
