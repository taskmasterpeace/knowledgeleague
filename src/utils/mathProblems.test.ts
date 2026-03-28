import { describe, it, expect } from 'vitest'
import { generateProblem, generateDistractors } from './mathProblems'
import type { ProblemType } from '../types'

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

describe('correctAnswer always in choices (stress test)', () => {
  it('correct answer is in choices for 1000 random easy problems', () => {
    for (let i = 0; i < 1000; i++) {
      const problem = generateProblem('easy')
      expect(problem.choices).toContain(problem.correctAnswer)
      expect(new Set(problem.choices).size).toBe(4) // no duplicates
    }
  })

  it('correct answer is in choices for 1000 random medium problems', () => {
    for (let i = 0; i < 1000; i++) {
      const problem = generateProblem('medium')
      expect(problem.choices).toContain(problem.correctAnswer)
      expect(new Set(problem.choices).size).toBe(4)
    }
  })

  it('correct answer is in choices for 1000 random hard problems', () => {
    for (let i = 0; i < 1000; i++) {
      const problem = generateProblem('hard')
      expect(problem.choices).toContain(problem.correctAnswer)
      expect(new Set(problem.choices).size).toBe(4)
    }
  })

  it('correct answer is in choices for all extended generators', () => {
    const cats = ['multiplication', 'division', 'fractions', 'rounding', 'percentages', 'order-of-operations', 'square-roots', 'estimation']
    for (const cat of cats) {
      for (let i = 0; i < 200; i++) {
        const problem = generateProblem('medium', [cat as ProblemType[]])
        expect(problem.choices).toContain(problem.correctAnswer)
      }
    }
  })
})

describe('missing number equation formats', () => {
  it('generates a + ? = c format', () => {
    for (let i = 0; i < 100; i++) {
      const problem = generateProblem('easy', ['missing'] as ProblemType[])
      expect(problem.question).toMatch(/\+\s*___\s*=|___/)
      expect(problem.choices).toContain(problem.correctAnswer)
      expect(problem.choices).toHaveLength(4)
    }
  })

  it('generates a - ? = c format (missing-subtrahend)', () => {
    for (let i = 0; i < 100; i++) {
      const problem = generateProblem('medium', ['missing-subtrahend'] as ProblemType[])
      expect(problem.question).toMatch(/-\s*___\s*=/)
      expect(problem.choices).toContain(problem.correctAnswer)
      expect(problem.choices).toHaveLength(4)
    }
  })

  it('generates ? + b = c format (missing-first)', () => {
    for (let i = 0; i < 100; i++) {
      const problem = generateProblem('medium', ['missing-first'] as ProblemType[])
      expect(problem.question).toMatch(/___\s*\+/)
      expect(problem.choices).toContain(problem.correctAnswer)
      expect(problem.choices).toHaveLength(4)
    }
  })

  it('generates c = ? + b format (equation-flip)', () => {
    for (let i = 0; i < 100; i++) {
      const problem = generateProblem('hard', ['equation-flip'] as ProblemType[])
      expect(problem.question).toMatch(/=\s*___\s*\+|=\s*___\s*-/)
      expect(problem.choices).toContain(problem.correctAnswer)
      expect(problem.choices).toHaveLength(4)
    }
  })
})
