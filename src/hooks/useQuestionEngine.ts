import { useState, useCallback } from 'react'
import { generateQuestion, getDifficulty, resetQuestionEngine } from '../utils/questionEngine'
import { useSettings } from './useSettings'
import type { GameQuestion, Difficulty, Subject } from '../types'

export function useQuestionEngine(fixedDifficulty?: Difficulty, forceSubject?: Subject) {
  const { enabledSubjects, gradeLevel, enabledCategories } = useSettings()
  const [problemCount, setProblemCount] = useState(1)

  const subjects = forceSubject ? [forceSubject] : enabledSubjects

  const makeQuestion = useCallback((num: number) => {
    const difficulty = fixedDifficulty ?? getDifficulty(num)
    return generateQuestion({
      enabledSubjects: subjects,
      gradeLevel,
      difficulty,
      enabledCategories,
    })
  }, [fixedDifficulty, subjects, gradeLevel, enabledCategories])

  const [currentProblem, setCurrentProblem] = useState<GameQuestion>(() => makeQuestion(1))

  const nextProblem = useCallback(() => {
    const next = problemCount + 1
    setProblemCount(next)
    setCurrentProblem(makeQuestion(next))
  }, [problemCount, makeQuestion])

  const reset = useCallback(() => {
    resetQuestionEngine()
    setProblemCount(1)
    setCurrentProblem(makeQuestion(1))
  }, [makeQuestion])

  return { currentProblem, problemCount, nextProblem, reset }
}
