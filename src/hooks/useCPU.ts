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

  useEffect(() => {
    if (!enabled || !character || !currentProblem) return

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

      const isCorrect = Math.random() < effectiveAccuracy
      if (isCorrect) {
        // Pick the correct answer
        const correctIndex = currentProblem.choices.indexOf(currentProblem.correctAnswer)
        onAnswer(correctIndex)
      } else {
        // Pick a wrong answer — prefer the closest distractor
        const wrongIndices = currentProblem.choices
          .map((c, i) => ({ val: c, idx: i }))
          .filter(c => c.val !== currentProblem.correctAnswer)
          .sort((a, b) =>
            Math.abs(a.val - currentProblem.correctAnswer) - Math.abs(b.val - currentProblem.correctAnswer)
          )
        // Pick the closest wrong answer most of the time
        const pick = Math.random() < 0.7 ? wrongIndices[0] : wrongIndices[Math.floor(Math.random() * wrongIndices.length)]
        onAnswer(pick.idx)
      }
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [character, currentProblem, enabled, onAnswer, streak])
}
