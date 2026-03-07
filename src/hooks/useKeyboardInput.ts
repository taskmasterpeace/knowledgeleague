import { useEffect, useCallback } from 'react'
import { P1_KEYS, P2_KEYS } from '../utils/constants'

interface UseKeyboardInputProps {
  onP1Answer: (choiceIndex: number) => void
  onP2Answer: (choiceIndex: number) => void
  enabled: boolean
}

export function useKeyboardInput({ onP1Answer, onP2Answer, enabled }: UseKeyboardInputProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return
    const key = e.key
    if (key in P1_KEYS) {
      e.preventDefault()
      onP1Answer(P1_KEYS[key])
    } else if (key in P2_KEYS) {
      e.preventDefault()
      onP2Answer(P2_KEYS[key])
    }
  }, [onP1Answer, onP2Answer, enabled])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
