import { describe, it, expect } from 'vitest'
import { adjustTier, gradeToStartingTier, tierToGradeLevel, tierToDifficulty } from './adaptiveDifficulty'

describe('gradeToStartingTier', () => {
  it('maps grade-1 and grade-2 to tier 1', () => {
    expect(gradeToStartingTier('grade-1')).toBe(1)
    expect(gradeToStartingTier('grade-2')).toBe(1)
  })

  it('maps grade-3 to tier 2', () => {
    expect(gradeToStartingTier('grade-3')).toBe(2)
  })

  it('maps adult to tier 3', () => {
    expect(gradeToStartingTier('adult')).toBe(3)
  })
})

describe('tierToGradeLevel', () => {
  it('maps tiers to grade levels', () => {
    expect(tierToGradeLevel(1)).toBe('grade-1')
    expect(tierToGradeLevel(2)).toBe('grade-3')
    expect(tierToGradeLevel(3)).toBe('adult')
  })
})

describe('tierToDifficulty', () => {
  it('maps tiers to difficulties', () => {
    expect(tierToDifficulty(1)).toBe('easy')
    expect(tierToDifficulty(2)).toBe('medium')
    expect(tierToDifficulty(3)).toBe('hard')
  })
})

describe('adjustTier', () => {
  it('returns same tier with fewer than 5 answers', () => {
    expect(adjustTier(1, [true, true, true, true])).toBe(1)
    expect(adjustTier(2, [false, false])).toBe(2)
    expect(adjustTier(3, [])).toBe(3)
  })

  it('bumps up when accuracy >= 80%', () => {
    expect(adjustTier(1, [true, true, true, true, true])).toBe(2)
    expect(adjustTier(1, [true, true, true, true, false, true, true, true, true, true])).toBe(2)
    expect(adjustTier(2, [true, true, true, true, true, true, true, true, false, true])).toBe(3)
  })

  it('drops down when accuracy < 40%', () => {
    expect(adjustTier(2, [false, false, false, true, false])).toBe(1)
    expect(adjustTier(3, [false, false, false, false, false, true, false, false, false, false])).toBe(2)
  })

  it('stays same when accuracy is between 40-80%', () => {
    expect(adjustTier(2, [true, true, false, false, true])).toBe(2) // 60%
    expect(adjustTier(2, [true, false, true, false, true, false, true])).toBe(2) // ~57%
  })

  it('never goes above tier 3', () => {
    expect(adjustTier(3, [true, true, true, true, true])).toBe(3)
  })

  it('never goes below tier 1', () => {
    expect(adjustTier(1, [false, false, false, false, false])).toBe(1)
  })
})
