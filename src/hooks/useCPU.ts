import { useEffect, useRef } from 'react'
import type { CPUCharacter, MathProblem } from '../types'

interface UseCPUProps {
  character: CPUCharacter | null
  currentProblem: MathProblem | null
  enabled: boolean
  onAnswer: (choiceIndex: number) => void
  streak: number
}

export function useCPU({ character, currentProblem, enabled, onAnswer, streak }: UseCPUProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onAnswerRef = useRef(onAnswer)
  const answeredRef = useRef<string | null>(null)

  // Keep callback ref fresh without triggering effect
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
        const correctIndex = currentProblem.choices.indexOf(currentProblem.correctAnswer)
        onAnswerRef.current(correctIndex)
      } else {
        const wrongIndices = currentProblem.choices
          .map((c, i) => ({ val: c, idx: i }))
          .filter(c => c.val !== currentProblem.correctAnswer)
          .sort((a, b) =>
            Math.abs(a.val - currentProblem.correctAnswer) - Math.abs(b.val - currentProblem.correctAnswer)
          )
        const pick = Math.random() < 0.7 ? wrongIndices[0] : wrongIndices[Math.floor(Math.random() * wrongIndices.length)]
        onAnswerRef.current(pick.idx)
      }
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [character, currentProblem, enabled, streak])
}
