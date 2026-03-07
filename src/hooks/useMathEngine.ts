import { useState, useCallback } from 'react'
import { generateProblem, getDifficulty } from '../utils/mathProblems'
import type { MathProblem } from '../types'

export function useMathEngine() {
  const [problemCount, setProblemCount] = useState(1)
  const [currentProblem, setCurrentProblem] = useState<MathProblem>(() =>
    generateProblem(getDifficulty(1))
  )

  const nextProblem = useCallback(() => {
    const next = problemCount + 1
    setProblemCount(next)
    setCurrentProblem(generateProblem(getDifficulty(next)))
  }, [problemCount])

  const reset = useCallback(() => {
    setProblemCount(1)
    setCurrentProblem(generateProblem(getDifficulty(1)))
  }, [])

  return { currentProblem, problemCount, nextProblem, reset }
}
