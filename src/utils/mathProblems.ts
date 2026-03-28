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
  const range = Math.max(5, Math.ceil(Math.abs(correct) * 0.3))
  // off-by-one
  if (correct - 1 >= 0) distractors.add(correct - 1)
  distractors.add(correct + 1)
  // off-by-two
  distractors.add(correct + 2)
  if (correct - 2 >= 0) distractors.add(correct - 2)
  // random close values
  while (distractors.size < 3) {
    const d = Math.max(0, correct + randInt(-range, range))
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

// a + ___ = c  (find missing addend)
function makeMissing(): MathProblem {
  const answer = randInt(3, 12)
  const a = randInt(1, answer - 1)
  const choices = shuffle([answer, ...generateDistractors(answer)])
  return { question: `${a} + ___ = ${a + answer}`, correctAnswer: answer, choices, type: 'missing', difficulty: 'hard' }
}

// a - ___ = c  (find missing subtrahend: 14 - ? = 7)
function makeMissingSubtrahend(): MathProblem {
  const answer = randInt(2, 10) // the missing number
  const c = randInt(2, 10)      // the result
  const a = c + answer           // the starting number
  const choices = shuffle([answer, ...generateDistractors(answer)])
  return { question: `${a} - ___ = ${c}`, correctAnswer: answer, choices, type: 'missing' as ProblemType, difficulty: 'medium' }
}

// ___ + b = c  (find missing first addend: ? + 8 = 14)
function makeMissingFirst(): MathProblem {
  const answer = randInt(2, 12) // the missing number
  const b = randInt(2, 10)
  const c = answer + b
  const choices = shuffle([answer, ...generateDistractors(answer)])
  return { question: `___ + ${b} = ${c}`, correctAnswer: answer, choices, type: 'missing' as ProblemType, difficulty: 'medium' }
}

// c = ___ + b  OR  c = ___ - b  (flipped equation: 16 = ? + 8)
function makeEquationFlip(): MathProblem {
  if (Math.random() < 0.5) {
    // c = ___ + b
    const answer = randInt(3, 12)
    const b = randInt(2, 10)
    const c = answer + b
    const choices = shuffle([answer, ...generateDistractors(answer)])
    return { question: `${c} = ___ + ${b}`, correctAnswer: answer, choices, type: 'missing' as ProblemType, difficulty: 'hard' }
  } else {
    // c = ___ - b
    const answer = randInt(8, 20)
    const b = randInt(2, answer - 2)
    const c = answer - b
    const choices = shuffle([answer, ...generateDistractors(answer)])
    return { question: `${c} = ___ - ${b}`, correctAnswer: answer, choices, type: 'missing' as ProblemType, difficulty: 'hard' }
  }
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

function makeMultiplication(): MathProblem {
  const a = randInt(2, 10)
  const b = randInt(2, 10)
  const answer = a * b
  const choices = shuffle([answer, ...generateDistractors(answer)])
  return { question: `${a} × ${b}`, correctAnswer: answer, choices, type: 'addition' as ProblemType, difficulty: 'medium' }
}

function makeDivision(): MathProblem {
  const divisor = randInt(2, 10)
  const answer = randInt(2, 10)
  const dividend = divisor * answer
  const choices = shuffle([answer, ...generateDistractors(answer)])
  return { question: `${dividend} ÷ ${divisor}`, correctAnswer: answer, choices, type: 'addition' as ProblemType, difficulty: 'medium' }
}

function makeFractions(): MathProblem {
  const wholes = [4, 6, 8, 10, 12, 16, 20]
  const whole = wholes[randInt(0, wholes.length - 1)]
  const divisor = [2, 4][randInt(0, 1)]
  const answer = whole / divisor
  const label = divisor === 2 ? 'half' : 'quarter'
  const choices = shuffle([answer, ...generateDistractors(answer)])
  return { question: `What is one ${label} of ${whole}?`, correctAnswer: answer, choices, type: 'addition' as ProblemType, difficulty: 'hard' }
}

function makeRounding(): MathProblem {
  const num = randInt(11, 99)
  const answer = Math.round(num / 10) * 10
  const choices = shuffle([answer, ...generateDistractors(answer)])
  return { question: `Round ${num} to the nearest 10`, correctAnswer: answer, choices, type: 'addition' as ProblemType, difficulty: 'medium' }
}

function makePercentages(): MathProblem {
  const percents = [10, 15, 20, 25, 50]
  const pct = percents[randInt(0, percents.length - 1)]
  const bases = [20, 40, 50, 60, 80, 100, 200]
  const base = bases[randInt(0, bases.length - 1)]
  const answer = (pct / 100) * base
  const choices = shuffle([answer, ...generateDistractors(answer)])
  return { question: `What is ${pct}% of ${base}?`, correctAnswer: answer, choices, type: 'addition' as ProblemType, difficulty: 'hard' }
}

function makeOrderOfOps(): MathProblem {
  const a = randInt(2, 8)
  const b = randInt(2, 5)
  const c = randInt(1, 6)
  const answer = a + b * c
  const wrongAnswer = (a + b) * c
  const distractors = [wrongAnswer, answer + 1, answer - 1].filter(d => d !== answer).slice(0, 3)
  while (distractors.length < 3) distractors.push(answer + randInt(2, 10))
  const choices = shuffle([answer, ...distractors.slice(0, 3)])
  return { question: `${a} + ${b} × ${c}`, correctAnswer: answer, choices, type: 'addition' as ProblemType, difficulty: 'hard' }
}

function makeSquareRoots(): MathProblem {
  const roots = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
  const root = roots[randInt(0, roots.length - 1)]
  const answer = root
  const square = root * root
  const choices = shuffle([answer, ...generateDistractors(answer)])
  return { question: `√${square}`, correctAnswer: answer, choices, type: 'addition' as ProblemType, difficulty: 'hard' }
}

function makeEstimation(): MathProblem {
  const a = randInt(11, 25)
  const b = randInt(3, 9)
  const answer = a * b
  const d1 = answer + randInt(5, 15)
  const d2 = Math.max(1, answer - randInt(5, 15))
  const d3 = answer + randInt(20, 30)
  const choices = shuffle([answer, d1, d2, d3])
  return { question: `Closest to ${a} × ${b}?`, correctAnswer: answer, choices, type: 'addition' as ProblemType, difficulty: 'medium' }
}

// Maps internal generator names to the function
const EXTENDED_GENERATORS: Record<string, (difficulty: Difficulty) => MathProblem> = {
  'multiplication': () => makeMultiplication(),
  'division': () => makeDivision(),
  'fractions': () => makeFractions(),
  'rounding': () => makeRounding(),
  'percentages': () => makePercentages(),
  'order-of-operations': () => makeOrderOfOps(),
  'square-roots': () => makeSquareRoots(),
  'estimation': () => makeEstimation(),
  'missing-subtrahend': () => makeMissingSubtrahend(),
  'missing-first': () => makeMissingFirst(),
  'equation-flip': () => makeEquationFlip(),
}

function generateForCategory(category: ProblemType | string, difficulty: Difficulty): MathProblem {
  switch (category) {
    case 'addition': return makeAddition(difficulty)
    case 'subtraction': return makeSubtraction()
    case 'missing': return makeMissing()
    case 'comparison': return makeComparison()
    case 'skip-counting': return makeSkipCounting()
    default: {
      const gen = EXTENDED_GENERATORS[category]
      if (gen) return gen(difficulty)
      return makeAddition(difficulty)
    }
  }
}

export const GRADE_MATH_CATEGORIES: Record<string, string[]> = {
  'grade-1': ['addition', 'subtraction', 'missing', 'comparison', 'skip-counting'],
  'grade-2': ['addition', 'subtraction', 'missing', 'missing-subtrahend', 'missing-first', 'comparison', 'skip-counting', 'multiplication'],
  'grade-3': ['addition', 'subtraction', 'missing', 'missing-subtrahend', 'missing-first', 'equation-flip', 'comparison', 'skip-counting', 'multiplication', 'division', 'fractions', 'rounding'],
  'adult': ['addition', 'subtraction', 'missing', 'missing-subtrahend', 'missing-first', 'equation-flip', 'multiplication', 'division', 'fractions', 'percentages', 'order-of-operations', 'square-roots', 'estimation'],
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
