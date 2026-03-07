import { useState, useCallback } from 'react'
import { generateProblem, getDifficulty } from '../utils/mathProblems'
import type { MathProblem, Difficulty } from '../types'

export function useMathEngine(fixedDifficulty?: Difficulty) {
  const [problemCount, setProblemCount] = useState(1)
  const [currentProblem, setCurrentProblem] = useState<MathProblem>(() =>
    generateProblem(fixedDifficulty ?? getDifficulty(1))
  )

  const nextProblem = useCallback(() => {
    const next = problemCount + 1
    setProblemCount(next)
    setCurrentProblem(generateProblem(fixedDifficulty ?? getDifficulty(next)))
  }, [problemCount, fixedDifficulty])

  const reset = useCallback(() => {
    setProblemCount(1)
    setCurrentProblem(generateProblem(fixedDifficulty ?? getDifficulty(1)))
  }, [fixedDifficulty])

  return { currentProblem, problemCount, nextProblem, reset }
}
