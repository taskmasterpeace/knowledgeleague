import { describe, it, expect } from 'vitest'
import { generateCountingQuestion, generatePatternQuestion } from './questionEngine'
import type { GradeLevel, Difficulty } from '../types'

describe('generateCountingQuestion', () => {
  it('always has correct answer in choices', () => {
    for (let i = 0; i < 500; i++) {
      const grades: GradeLevel[] = ['grade-1', 'grade-2', 'grade-3', 'adult']
      const diffs: Difficulty[] = ['easy', 'medium', 'hard']
      const grade = grades[Math.floor(Math.random() * grades.length)]
      const diff = diffs[Math.floor(Math.random() * diffs.length)]
      const q = generateCountingQuestion(grade, diff)

      expect(q.choices).toHaveLength(4)
      expect(q.choices[q.correctIndex]).toBe(String(q.imageCount))
      expect(q.imageCount).toBeGreaterThan(0)
      expect(q.imageUrl).toBeTruthy()
      expect(q.category).toBe('counting')
      expect(q.subject).toBe('images')
    }
  })

  it('grade-1 counts are between 2-6', () => {
    for (let i = 0; i < 200; i++) {
      const q = generateCountingQuestion('grade-1', 'medium')
      expect(q.imageCount).toBeGreaterThanOrEqual(2)
      expect(q.imageCount).toBeLessThanOrEqual(6)
    }
  })

  it('grade-2 counts are between 5-10', () => {
    for (let i = 0; i < 200; i++) {
      const q = generateCountingQuestion('grade-2', 'medium')
      expect(q.imageCount).toBeGreaterThanOrEqual(5)
      expect(q.imageCount).toBeLessThanOrEqual(10)
    }
  })

  it('grade-3 counts are between 8-15', () => {
    for (let i = 0; i < 200; i++) {
      const q = generateCountingQuestion('grade-3', 'medium')
      expect(q.imageCount).toBeGreaterThanOrEqual(8)
      expect(q.imageCount).toBeLessThanOrEqual(15)
    }
  })

  it('adult counts are between 12-25', () => {
    for (let i = 0; i < 200; i++) {
      const q = generateCountingQuestion('adult', 'medium')
      expect(q.imageCount).toBeGreaterThanOrEqual(12)
      expect(q.imageCount).toBeLessThanOrEqual(25)
    }
  })

  it('has 4 unique choices (no duplicates)', () => {
    for (let i = 0; i < 300; i++) {
      const q = generateCountingQuestion('grade-2', 'medium')
      const unique = new Set(q.choices)
      expect(unique.size).toBe(4)
    }
  })

  it('all distractors are positive numbers', () => {
    for (let i = 0; i < 300; i++) {
      const q = generateCountingQuestion('grade-1', 'easy')
      q.choices.forEach(c => {
        expect(Number(c)).toBeGreaterThan(0)
      })
    }
  })
})

describe('generatePatternQuestion', () => {
  it('always has correct answer in choices across all grades', () => {
    const grades: GradeLevel[] = ['grade-1', 'grade-2', 'grade-3', 'adult']
    const diffs: Difficulty[] = ['easy', 'medium', 'hard']
    for (let i = 0; i < 500; i++) {
      const grade = grades[Math.floor(Math.random() * grades.length)]
      const diff = diffs[Math.floor(Math.random() * diffs.length)]
      const q = generatePatternQuestion(grade, diff)

      expect(q.choices).toHaveLength(4)
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(4)
      expect(q.category).toBe('pattern')
      expect(q.subject).toBe('images')
      expect(q.patternSequence).toBeDefined()
      expect(q.patternSequence!.length).toBeGreaterThanOrEqual(5)
      // Last element should be '?'
      expect(q.patternSequence![q.patternSequence!.length - 1]).toBe('?')
    }
  })

  it('has 4 unique image URL choices', () => {
    for (let i = 0; i < 300; i++) {
      const q = generatePatternQuestion('grade-2', 'medium')
      const unique = new Set(q.choices)
      expect(unique.size).toBe(4)
      // All choices should be image URLs
      q.choices.forEach(c => {
        expect(c).toMatch(/^\/pixelart\//)
      })
    }
  })

  it('grade-1 produces AB patterns (shorter sequences)', () => {
    for (let i = 0; i < 100; i++) {
      const q = generatePatternQuestion('grade-1', 'easy')
      // Should have pattern sequence with ? at end
      const seq = q.patternSequence!
      expect(seq[seq.length - 1]).toBe('?')
      // AB pattern: should use exactly 2 distinct images
      const images = new Set(seq.filter(s => s !== '?'))
      expect(images.size).toBe(2)
    }
  })

  it('grade-2 medium produces ABC patterns (3 distinct items)', () => {
    for (let i = 0; i < 100; i++) {
      const q = generatePatternQuestion('grade-2', 'medium')
      const seq = q.patternSequence!
      const images = new Set(seq.filter(s => s !== '?'))
      expect(images.size).toBe(3)
    }
  })

  it('correct answer matches the pattern logic', () => {
    // For AB pattern, after ABABAB the next should be A
    for (let i = 0; i < 200; i++) {
      const q = generatePatternQuestion('grade-1', 'easy')
      const seq = q.patternSequence!.filter(s => s !== '?')
      // The correct answer should be seq[0] (pattern restarts)
      expect(q.choices[q.correctIndex]).toBe(seq[0])
    }
  })
})
