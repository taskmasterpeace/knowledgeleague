import type { AdaptiveTier, GradeLevel, Difficulty } from '../types'

export function gradeToStartingTier(grade: GradeLevel): AdaptiveTier {
  switch (grade) {
    case 'grade-1': return 1
    case 'grade-2': return 1
    case 'grade-3': return 2
    case 'adult': return 3
  }
}

export function tierToGradeLevel(tier: AdaptiveTier): GradeLevel {
  switch (tier) {
    case 1: return 'grade-1'
    case 2: return 'grade-3'
    case 3: return 'adult'
  }
}

export function tierToDifficulty(tier: AdaptiveTier): Difficulty {
  switch (tier) {
    case 1: return 'easy'
    case 2: return 'medium'
    case 3: return 'hard'
  }
}

/**
 * Adjusts tier based on rolling accuracy of last 10 answers.
 * 80%+ → bump up, below 40% → drop down, 40-80% → stay.
 */
export function adjustTier(currentTier: AdaptiveTier, last10Correct: boolean[]): AdaptiveTier {
  if (last10Correct.length < 5) return currentTier

  const correctCount = last10Correct.filter(Boolean).length
  const accuracy = correctCount / last10Correct.length

  if (accuracy >= 0.8 && currentTier < 3) return (currentTier + 1) as AdaptiveTier
  if (accuracy < 0.4 && currentTier > 1) return (currentTier - 1) as AdaptiveTier
  return currentTier
}
