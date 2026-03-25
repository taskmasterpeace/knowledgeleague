import { useEffect, useRef } from 'react'
import type { CPUCharacter, GameQuestion } from '../types'

interface UseCPUProps {
  character: CPUCharacter | null
  currentProblem: GameQuestion | null
  enabled: boolean
  onAnswer: (choiceIndex: number) => void
  streak: number
}

export function useCPU({ character, currentProblem, enabled, onAnswer, streak }: UseCPUProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onAnswerRef = useRef(onAnswer)
  const answeredRef = useRef<string | null>(null)

  // Keep callback ref fresh without triggering effect
  // eslint-disable-next-line react-hooks/refs
  onAnswerRef.current = onAnswer

  useEffect(() => {
    if (!enabled || !character || !currentProblem) return

    // Use the question as a key to avoid re-answering the same problem
    const problemKey = currentProblem.question
    if (answeredRef.current === problemKey) return

    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current)

    const [minSpeed, maxSpeed] = character.speedRange
    const delay = (minSpeed + Math.random() * (maxSpeed - minSpeed)) * 1000

    // After 2 correct in a row, slightly higher chance of getting wrong
    let effectiveAccuracy = character.accuracy
    if (streak >= 2) {
      effectiveAccuracy = Math.max(0.3, effectiveAccuracy - 0.15)
    }

    timerRef.current = setTimeout(() => {
      if (!currentProblem) return
      // Mark this problem as answered
      answeredRef.current = problemKey

      const isCorrect = Math.random() < effectiveAccuracy
      if (isCorrect) {
        onAnswerRef.current(currentProblem.correctIndex)
      } else {
        // Pick a wrong answer (prefer close-to-correct for plausibility)
        const wrongIndices = currentProblem.choices
          .map((_, i) => i)
          .filter(i => i !== currentProblem.correctIndex)
        const pick = wrongIndices[Math.floor(Math.random() * wrongIndices.length)]
        onAnswerRef.current(pick)
      }
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [character, currentProblem, enabled, streak])
}
