import type { MathProblem, Difficulty, ProblemType } from '../types'

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateDistractors(correct: number): number[] {
  const distractors = new Set<number>()
  // off-by-one
  if (correct - 1 >= 0) distractors.add(correct - 1)
  if (correct + 1 <= 20) distractors.add(correct + 1)
  // off-by-two
  if (correct + 2 <= 20) distractors.add(correct + 2)
  if (correct - 2 >= 0) distractors.add(correct - 2)
  // random close values
  while (distractors.size < 3) {
    const d = Math.max(0, correct + randInt(-5, 5))
    if (d !== correct) distractors.add(d)
  }
  return [...distractors].slice(0, 3)
}

const DIFFICULTY_CATEGORIES: Record<Difficulty, ProblemType[]> = {
  easy: ['addition'],
  medium: ['addition', 'subtraction'],
  hard: ['missing', 'comparison', 'skip-counting'],
}

function makeAddition(difficulty: Difficulty): MathProblem {
  if (difficulty === 'medium') {
    const a = randInt(5, 12)
    const b = randInt(3, 8)
    const answer = a + b
    const choices = shuffle([answer, ...generateDistractors(answer)])
    return { question: `${a} + ${b}`, correctAnswer: answer, choices, type: 'addition', difficulty: 'medium' }
  }
  // easy (default)
  const a = randInt(1, 5)
  const b = randInt(1, 5)
  const answer = a + b
  const choices = shuffle([answer, ...generateDistractors(answer)])
  return { question: `${a} + ${b}`, correctAnswer: answer, choices, type: 'addition', difficulty: 'easy' }
}

function makeSubtraction(): MathProblem {
  const answer = randInt(2, 10)
  const a = answer + randInt(2, 10)
  const choices = shuffle([answer, ...generateDistractors(answer)])
  return { question: `${a} - ${a - answer}`, correctAnswer: answer, choices, type: 'subtraction', difficulty: 'medium' }
}

function makeMissing(): MathProblem {
  const answer = randInt(3, 12)
  const a = randInt(1, answer - 1)
  const choices = shuffle([answer, ...generateDistractors(answer)])
  return { question: `${a} + ___ = ${a + answer}`, correctAnswer: answer, choices, type: 'missing', difficulty: 'hard' }
}

function makeComparison(): MathProblem {
  const a = randInt(1, 18)
  let b = randInt(1, 18)
  while (b === a) b = randInt(1, 18)
  const answer = Math.max(a, b)
  const choices = shuffle([answer, ...generateDistractors(answer)])
  return { question: `Which is bigger: ${a} or ${b}?`, correctAnswer: answer, choices, type: 'comparison', difficulty: 'hard' }
}

function makeSkipCounting(): MathProblem {
  const step = [2, 3, 5][randInt(0, 2)]
  const start = step * randInt(1, 3)
  const seq = [start, start + step, start + step * 2]
  const answer = start + step * 3
  const choices = shuffle([answer, ...generateDistractors(answer)])
  return { question: `${seq.join(', ')}, ___`, correctAnswer: answer, choices, type: 'skip-counting', difficulty: 'hard' }
}

function generateForCategory(category: ProblemType, difficulty: Difficulty): MathProblem {
  switch (category) {
    case 'addition': return makeAddition(difficulty)
    case 'subtraction': return makeSubtraction()
    case 'missing': return makeMissing()
    case 'comparison': return makeComparison()
    case 'skip-counting': return makeSkipCounting()
  }
}

export function generateProblem(difficulty: Difficulty, enabledCategories?: ProblemType[]): MathProblem {
  // Get the default categories for this difficulty
  let available = DIFFICULTY_CATEGORIES[difficulty]

  if (enabledCategories && enabledCategories.length > 0) {
    // Intersect with enabled categories
    const intersection = available.filter((c) => enabledCategories.includes(c))

    if (intersection.length > 0) {
      available = intersection
    } else {
      // Search adjacent difficulties: lower first, then higher
      const diffOrder: Difficulty[] = ['easy', 'medium', 'hard']
      const idx = diffOrder.indexOf(difficulty)
      const searchOrder = [
        ...diffOrder.slice(0, idx).reverse(),
        ...diffOrder.slice(idx + 1),
      ]
      for (const d of searchOrder) {
        const adj = DIFFICULTY_CATEGORIES[d].filter((c) => enabledCategories.includes(c))
        if (adj.length > 0) {
          available = adj
          break
        }
      }
      // If still nothing found, fall back to all enabled categories
      if (available === DIFFICULTY_CATEGORIES[difficulty] && enabledCategories.length > 0) {
        available = enabledCategories
      }
    }
  }

  const category = available[Math.floor(Math.random() * available.length)]
  return generateForCategory(category, difficulty)
}

export function getDifficulty(problemNumber: number): Difficulty {
  if (problemNumber <= 3) return 'easy'
  if (problemNumber <= 6) return 'medium'
  return 'hard'
}
