import { useState, useCallback } from 'react'
import { generateProblem, getDifficulty } from '../utils/mathProblems'
import { useSettings } from './useSettings'
import type { MathProblem, Difficulty } from '../types'

export function useMathEngine(fixedDifficulty?: Difficulty) {
  const { enabledCategories } = useSettings()
  const [problemCount, setProblemCount] = useState(1)
  const [currentProblem, setCurrentProblem] = useState<MathProblem>(() =>
    generateProblem(fixedDifficulty ?? getDifficulty(1), enabledCategories)
  )

  const nextProblem = useCallback(() => {
    const next = problemCount + 1
    setProblemCount(next)
    setCurrentProblem(generateProblem(fixedDifficulty ?? getDifficulty(next), enabledCategories))
  }, [problemCount, fixedDifficulty, enabledCategories])

  const reset = useCallback(() => {
    setProblemCount(1)
    setCurrentProblem(generateProblem(fixedDifficulty ?? getDifficulty(1), enabledCategories))
  }, [fixedDifficulty, enabledCategories])

  return { currentProblem, problemCount, nextProblem, reset }
}
