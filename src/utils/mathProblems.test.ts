import { describe, it, expect } from 'vitest'
import { generateProblem, generateDistractors } from './mathProblems'

describe('generateProblem', () => {
  it('generates easy addition problems with sums <= 10', () => {
    const problem = generateProblem('easy')
    expect(problem.type).toBe('addition')
    expect(problem.correctAnswer).toBeLessThanOrEqual(10)
    expect(problem.correctAnswer).toBeGreaterThanOrEqual(0)
    expect(problem.choices).toHaveLength(4)
    expect(problem.choices).toContain(problem.correctAnswer)
  })

  it('generates medium problems (subtraction or teen addition)', () => {
    const problem = generateProblem('medium')
    expect(['addition', 'subtraction']).toContain(problem.type)
    expect(problem.correctAnswer).toBeGreaterThanOrEqual(0)
    expect(problem.correctAnswer).toBeLessThanOrEqual(20)
    expect(problem.choices).toHaveLength(4)
    expect(problem.choices).toContain(problem.correctAnswer)
  })

  it('generates hard problems (missing number or skip counting)', () => {
    const problem = generateProblem('hard')
    expect(['missing', 'comparison', 'skip-counting']).toContain(problem.type)
    expect(problem.choices).toHaveLength(4)
    expect(problem.choices).toContain(problem.correctAnswer)
  })
})

describe('generateDistractors', () => {
  it('returns 3 unique distractors different from correct answer', () => {
    const distractors = generateDistractors(12)
    expect(distractors).toHaveLength(3)
    expect(distractors).not.toContain(12)
    const unique = new Set(distractors)
    expect(unique.size).toBe(3)
  })

  it('all distractors are non-negative', () => {
    const distractors = generateDistractors(1)
    distractors.forEach(d => expect(d).toBeGreaterThanOrEqual(0))
  })
})
