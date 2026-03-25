import { describe, it, expect } from 'vitest'
import { createPlayerAnalytics, recordAnalyticsAnswer, computeBehaviorTag } from './playerAnalytics'
import type { PlayerAnalytics } from '../types'

describe('createPlayerAnalytics', () => {
  it('initializes with the given starting tier', () => {
    const a = createPlayerAnalytics(2)
    expect(a.adaptiveTier).toBe(2)
    expect(a.adaptiveHistory).toEqual([2])
    expect(a.answersTotal).toBe(0)
    expect(a.answersCorrect).toBe(0)
    expect(a.behaviorTag).toBe('playing')
  })
})

describe('recordAnalyticsAnswer', () => {
  it('increments totals on correct answer', () => {
    let a = createPlayerAnalytics(1)
    a = recordAnalyticsAnswer(a, 0, true, 2000, 'addition')
    expect(a.answersTotal).toBe(1)
    expect(a.answersCorrect).toBe(1)
    expect(a.last5Correct).toEqual([true])
    expect(a.last10Correct).toEqual([true])
    expect(a.responseTimes).toEqual([2000])
  })

  it('increments totals on wrong answer', () => {
    let a = createPlayerAnalytics(1)
    a = recordAnalyticsAnswer(a, 2, false, 3000, 'subtraction')
    expect(a.answersTotal).toBe(1)
    expect(a.answersCorrect).toBe(0)
    expect(a.last5Correct).toEqual([false])
  })

  it('tracks category accuracy', () => {
    let a = createPlayerAnalytics(1)
    a = recordAnalyticsAnswer(a, 0, true, 1000, 'addition')
    a = recordAnalyticsAnswer(a, 1, false, 1500, 'addition')
    a = recordAnalyticsAnswer(a, 0, true, 1200, 'subtraction')
    expect(a.categoryAccuracy['addition']).toEqual({ correct: 1, total: 2 })
    expect(a.categoryAccuracy['subtraction']).toEqual({ correct: 1, total: 1 })
  })

  it('maintains rolling windows of 5 and 10', () => {
    let a = createPlayerAnalytics(1)
    for (let i = 0; i < 12; i++) {
      a = recordAnalyticsAnswer(a, 0, i % 2 === 0, 2000, 'addition')
    }
    expect(a.last5Correct).toHaveLength(5)
    expect(a.last10Correct).toHaveLength(10)
    expect(a.fullCorrectHistory).toHaveLength(12)
  })
})

describe('computeBehaviorTag', () => {
  function makeAnalytics(times: number[], correct: boolean[], choices: number[]): PlayerAnalytics {
    const a = createPlayerAnalytics(1)
    return {
      ...a,
      last5Times: times,
      last5Correct: correct,
      last5Choices: choices,
    }
  }

  it('returns playing with fewer than 3 answers', () => {
    const a = makeAnalytics([1000, 1000], [true, true], [0, 1])
    expect(computeBehaviorTag(a)).toBe('playing')
  })

  it('detects on-fire (fast + accurate)', () => {
    const a = makeAnalytics(
      [800, 900, 1000, 1100, 1200],
      [true, true, true, true, true],
      [0, 1, 2, 3, 0],
    )
    expect(computeBehaviorTag(a)).toBe('on-fire')
  })

  it('detects mashing (fast + same button + low accuracy)', () => {
    const a = makeAnalytics(
      [500, 600, 700, 800, 900],
      [false, true, false, false, false],
      [0, 0, 0, 0, 0],
    )
    expect(computeBehaviorTag(a)).toBe('mashing')
  })

  it('detects thinking (slow + accurate)', () => {
    const a = makeAnalytics(
      [4000, 5000, 3500, 4500, 3000],
      [true, true, true, true, true],
      [0, 1, 2, 3, 0],
    )
    expect(computeBehaviorTag(a)).toBe('thinking')
  })

  it('detects struggling (slow + inaccurate)', () => {
    const a = makeAnalytics(
      [4000, 5000, 3500, 4500, 6000],
      [false, false, false, false, false],
      [0, 1, 2, 3, 0],
    )
    expect(computeBehaviorTag(a)).toBe('struggling')
  })
})
