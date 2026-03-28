import type { GameQuestion, Subject, GradeLevel, Difficulty, QuestionCategory } from '../types'
import { generateProblem, getDifficulty, GRADE_MATH_CATEGORIES } from './mathProblems'
import { getStandard } from './standardsMap'

// Items available for counting questions (reuse existing pixel art)
const COUNTING_ITEMS = [
  { name: 'apples', singular: 'apple', imageUrl: '/pixelart/images/apple.png' },
  { name: 'butterflies', singular: 'butterfly', imageUrl: '/pixelart/images/butterfly.png' },
  { name: 'penguins', singular: 'penguin', imageUrl: '/pixelart/images/penguin.png' },
  { name: 'dolphins', singular: 'dolphin', imageUrl: '/pixelart/images/dolphin.png' },
  { name: 'cats', singular: 'cat', imageUrl: '/pixelart/images/cat.png' },
  { name: 'dogs', singular: 'dog', imageUrl: '/pixelart/images/dog.png' },
  { name: 'lions', singular: 'lion', imageUrl: '/pixelart/images/lion.png' },
  { name: 'guitars', singular: 'guitar', imageUrl: '/pixelart/images/guitar.png' },
  { name: 'stars', singular: 'star', imageUrl: '/pixelart/images/star.png' },
  { name: 'flowers', singular: 'flower', imageUrl: '/pixelart/images/flower.png' },
  { name: 'coins', singular: 'coin', imageUrl: '/pixelart/images/coin.png' },
  { name: 'diamonds', singular: 'diamond', imageUrl: '/pixelart/images/diamond.png' },
  { name: 'fish', singular: 'fish', imageUrl: '/pixelart/images/fish.png' },
  { name: 'rockets', singular: 'rocket', imageUrl: '/pixelart/images/rocket.png' },
]

const COUNTING_RANGES: Record<GradeLevel, [number, number]> = {
  'grade-1': [2, 6],
  'grade-2': [5, 10],
  'grade-3': [8, 15],
  'adult': [12, 25],
}

export function generateCountingQuestion(gradeLevel: GradeLevel, difficulty: Difficulty): GameQuestion {
  const [min, max] = COUNTING_RANGES[gradeLevel]
  // Adjust range by difficulty within grade
  let lo = min
  let hi = max
  if (difficulty === 'easy') hi = Math.max(min + 1, Math.floor(min + (max - min) * 0.5))
  else if (difficulty === 'hard') lo = Math.max(min, Math.floor(min + (max - min) * 0.5))

  const count = lo + Math.floor(Math.random() * (hi - lo + 1))
  const item = COUNTING_ITEMS[Math.floor(Math.random() * COUNTING_ITEMS.length)]

  const question = `How many ${item.name}?`

  // Generate 3 distractors close to correct answer
  const distractors = new Set<number>()
  while (distractors.size < 3) {
    const offset = Math.floor(Math.random() * 5) - 2 // -2 to +2
    const d = count + (offset === 0 ? (Math.random() < 0.5 ? -3 : 3) : offset)
    if (d > 0 && d !== count && !distractors.has(d)) {
      distractors.add(d)
    }
  }

  const choices = shuffle([count, ...Array.from(distractors)])
  const correctIndex = choices.indexOf(count)

  return {
    question,
    choices: choices.map(String),
    correctIndex,
    subject: 'images',
    category: 'counting',
    difficulty,
    imageUrl: item.imageUrl,
    imageCount: count,
  }
}

// Pattern items — use pixel art images as pattern elements
const PATTERN_ITEMS = [
  { name: 'apple', imageUrl: '/pixelart/images/apple.png' },
  { name: 'star', imageUrl: '/pixelart/images/star.png' },
  { name: 'butterfly', imageUrl: '/pixelart/images/butterfly.png' },
  { name: 'penguin', imageUrl: '/pixelart/images/penguin.png' },
  { name: 'cat', imageUrl: '/pixelart/images/cat.png' },
  { name: 'dog', imageUrl: '/pixelart/images/dog.png' },
  { name: 'dolphin', imageUrl: '/pixelart/images/dolphin.png' },
  { name: 'guitar', imageUrl: '/pixelart/images/guitar.png' },
  { name: 'lion', imageUrl: '/pixelart/images/lion.png' },
  { name: 'earth', imageUrl: '/pixelart/images/earth.png' },
  { name: 'flower', imageUrl: '/pixelart/images/flower.png' },
  { name: 'coin', imageUrl: '/pixelart/images/coin.png' },
  { name: 'diamond', imageUrl: '/pixelart/images/diamond.png' },
  { name: 'fish', imageUrl: '/pixelart/images/fish.png' },
  { name: 'rocket', imageUrl: '/pixelart/images/rocket.png' },
]

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = shuffle(arr)
  return shuffled.slice(0, n)
}

export function generatePatternQuestion(gradeLevel: GradeLevel, difficulty: Difficulty): GameQuestion {
  // Grade 1: simple AB patterns (apple, star, apple, star, ?)
  // Grade 2: ABC patterns (apple, star, cat, apple, star, cat, ?)
  // Grade 3: AABB or ABBC patterns, or number-based
  // Adult: complex multi-element or growing patterns

  let patternItems: typeof PATTERN_ITEMS[number][]
  let sequence: string[] // image URLs
  let answer: string // image URL of the correct next item
  // repeatLen removed — was unused

  if (gradeLevel === 'grade-1' || (gradeLevel === 'grade-2' && difficulty === 'easy')) {
    // AB pattern: 2 items, repeat 2-3 times + ask next
    patternItems = pickN(PATTERN_ITEMS, 2)
    const repeats = difficulty === 'easy' ? 3 : 2
    sequence = []
    for (let r = 0; r < repeats; r++) {
      for (const item of patternItems) sequence.push(item.imageUrl)
    }
    answer = patternItems[0].imageUrl
  } else if (gradeLevel === 'grade-2' || (gradeLevel === 'grade-3' && difficulty === 'easy')) {
    // ABC pattern: 3 items
    patternItems = pickN(PATTERN_ITEMS, 3)
    const repeats = 2
    sequence = []
    for (let r = 0; r < repeats; r++) {
      for (const item of patternItems) sequence.push(item.imageUrl)
    }
    answer = patternItems[0].imageUrl
  } else if (gradeLevel === 'grade-3') {
    // AABB pattern: 2 items doubled
    patternItems = pickN(PATTERN_ITEMS, 2)
    sequence = []
    for (let r = 0; r < 2; r++) {
      sequence.push(patternItems[0].imageUrl, patternItems[0].imageUrl)
      sequence.push(patternItems[1].imageUrl, patternItems[1].imageUrl)
    }
    // Next would be first item again
    answer = patternItems[0].imageUrl
  } else {
    // Adult: ABAC or ABCD patterns
    patternItems = pickN(PATTERN_ITEMS, 4)
    sequence = []
    const pattern = [patternItems[0], patternItems[1], patternItems[2], patternItems[3]]
    for (let r = 0; r < 2; r++) {
      for (const item of pattern) sequence.push(item.imageUrl)
    }
    answer = patternItems[0].imageUrl
  }

  // Add a "?" placeholder at the end
  sequence.push('?')

  // Build choices: correct answer + 3 wrong items
  const wrongPool = PATTERN_ITEMS.filter(p => p.imageUrl !== answer)
  const wrongPicks = pickN(wrongPool, 3)

  // Choices are image URLs — we'll render them as images in the UI
  const allChoices = shuffle([answer, ...wrongPicks.map(w => w.imageUrl)])
  const correctIndex = allChoices.indexOf(answer)

  // Get item name for the answer (for text fallback)
  return {
    question: 'What comes next?',
    choices: allChoices, // image URLs as choices
    correctIndex,
    subject: 'images',
    category: 'pattern',
    difficulty,
    patternSequence: sequence,
  }
}

interface BankQuestion {
  question: string
  choices: string[]
  correctIndex: number
  category: string
  difficulty: string
  imageUrl?: string
}

// Lazy-loaded question banks
let scienceBanks: Record<GradeLevel, BankQuestion[]> | null = null
let readingBanks: Record<GradeLevel, BankQuestion[]> | null = null
let spellingBanks: Record<GradeLevel, BankQuestion[]> | null = null
let imageBanks: Record<GradeLevel, BankQuestion[]> | null = null

async function loadBanks() {
  if (!scienceBanks) {
    const [s1, s2, s3, sa] = await Promise.all([
      import('../data/science/grade-1.json'),
      import('../data/science/grade-2.json'),
      import('../data/science/grade-3.json'),
      import('../data/science/adult.json'),
    ])
    scienceBanks = {
      'grade-1': s1.default as BankQuestion[],
      'grade-2': s2.default as BankQuestion[],
      'grade-3': s3.default as BankQuestion[],
      'adult': sa.default as BankQuestion[],
    }
  }
  if (!readingBanks) {
    const [r1, r2, r3, ra] = await Promise.all([
      import('../data/reading/grade-1.json'),
      import('../data/reading/grade-2.json'),
      import('../data/reading/grade-3.json'),
      import('../data/reading/adult.json'),
    ])
    readingBanks = {
      'grade-1': r1.default as BankQuestion[],
      'grade-2': r2.default as BankQuestion[],
      'grade-3': r3.default as BankQuestion[],
      'adult': ra.default as BankQuestion[],
    }
  }
  if (!spellingBanks) {
    const [sp1, sp2, sp3, spa] = await Promise.all([
      import('../data/spelling/grade-1.json'),
      import('../data/spelling/grade-2.json'),
      import('../data/spelling/grade-3.json'),
      import('../data/spelling/adult.json'),
    ])
    spellingBanks = {
      'grade-1': sp1.default as BankQuestion[],
      'grade-2': sp2.default as BankQuestion[],
      'grade-3': sp3.default as BankQuestion[],
      'adult': spa.default as BankQuestion[],
    }
  }
  if (!imageBanks) {
    const [i1, i2, i3, ia] = await Promise.all([
      import('../data/images/grade-1.json'),
      import('../data/images/grade-2.json'),
      import('../data/images/grade-3.json'),
      import('../data/images/adult.json'),
    ])
    imageBanks = {
      'grade-1': i1.default as BankQuestion[],
      'grade-2': i2.default as BankQuestion[],
      'grade-3': i3.default as BankQuestion[],
      'adult': ia.default as BankQuestion[],
    }
  }
}

// Eagerly start loading
loadBanks()

// Track recently shown questions to avoid repeats
const recentlyShown = new Set<string>()
const MAX_RECENT = 100

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickFromBank(
  bank: BankQuestion[],
  subject: Subject,
  difficulty: Difficulty,
  gradeLevel: GradeLevel,
  enabledCategories?: QuestionCategory[]
): GameQuestion {
  let pool = bank

  // Filter by enabled categories if specified
  if (enabledCategories && enabledCategories.length > 0) {
    const filtered = pool.filter(q => enabledCategories.includes(q.category as QuestionCategory))
    if (filtered.length > 0) pool = filtered
  }

  // Filter by difficulty
  const byDifficulty = pool.filter(q => q.difficulty === difficulty)
  if (byDifficulty.length > 0) pool = byDifficulty

  // Avoid recently shown
  const fresh = pool.filter(q => !recentlyShown.has(q.question))
  if (fresh.length > 0) pool = fresh

  // Pick random
  const picked = pool[Math.floor(Math.random() * pool.length)]

  // Track as recently shown
  recentlyShown.add(picked.question)
  if (recentlyShown.size > MAX_RECENT) {
    const first = recentlyShown.values().next().value
    if (first) recentlyShown.delete(first)
  }

  // Shuffle choices but track correct answer
  const correctAnswer = picked.choices[picked.correctIndex]
  if (correctAnswer === undefined) {
    // Corrupted question — skip and try next
    return pickFromBank(bank, subject, difficulty, gradeLevel, enabledCategories)
  }
  const shuffled = shuffle(picked.choices)
  const newCorrectIndex = shuffled.indexOf(correctAnswer)

  // Defensive: if correctAnswer somehow not in shuffled (shouldn't happen)
  if (newCorrectIndex === -1) {
    shuffled[0] = correctAnswer
    return {
      question: picked.question,
      choices: shuffled,
      correctIndex: 0,
      subject,
      category: picked.category as QuestionCategory,
      difficulty,
      standard: getStandard(picked.category as QuestionCategory, gradeLevel),
      ...(picked.imageUrl ? { imageUrl: picked.imageUrl } : {}),
    }
  }

  return {
    question: picked.question,
    choices: shuffled,
    correctIndex: newCorrectIndex,
    subject,
    category: picked.category as QuestionCategory,
    difficulty,
    standard: getStandard(picked.category as QuestionCategory, gradeLevel),
    ...(picked.imageUrl ? { imageUrl: picked.imageUrl } : {}),
  }
}

function mathToGameQuestion(
  gradeLevel: GradeLevel,
  difficulty: Difficulty,
  enabledCategories?: QuestionCategory[]
): GameQuestion {
  const gradeMathCats = GRADE_MATH_CATEGORIES[gradeLevel] || GRADE_MATH_CATEGORIES['grade-1']
  let mathCats = gradeMathCats

  if (enabledCategories && enabledCategories.length > 0) {
    const filtered = gradeMathCats.filter(c => enabledCategories.includes(c as QuestionCategory))
    if (filtered.length > 0) mathCats = filtered
  }

  const problem = generateProblem(difficulty, mathCats as ProblemType[])

  // Defensive: ensure correctAnswer is in the choices array
  const { choices, correctAnswer } = problem
  if (!choices.includes(correctAnswer)) {
    // Replace a random wrong choice with the correct answer
    choices = [...choices]
    choices[Math.floor(Math.random() * choices.length)] = correctAnswer
    choices = shuffle(choices)
  }

  const correctIndex = choices.indexOf(correctAnswer)

  return {
    question: problem.question,
    choices: choices.map(String),
    correctIndex,
    subject: 'math',
    category: problem.type as QuestionCategory,
    difficulty: problem.difficulty,
    standard: getStandard(problem.type as QuestionCategory, gradeLevel),
  }
}

export interface QuestionEngineOptions {
  enabledSubjects: Subject[]
  gradeLevel: GradeLevel
  difficulty: Difficulty
  enabledCategories?: QuestionCategory[]
}

let lastSubjectIndex = -1

export function generateQuestion(options: QuestionEngineOptions): GameQuestion {
  const { enabledSubjects, gradeLevel, difficulty, enabledCategories } = options

  // Rotate through enabled subjects
  lastSubjectIndex = (lastSubjectIndex + 1) % enabledSubjects.length
  const subject = enabledSubjects[lastSubjectIndex]

  switch (subject) {
    case 'science': {
      const bank = scienceBanks?.[gradeLevel]
      if (bank && bank.length > 0) {
        return pickFromBank(bank, 'science', difficulty, gradeLevel, enabledCategories)
      }
      // Fallback to math if banks not loaded yet
      return mathToGameQuestion(gradeLevel, difficulty, enabledCategories)
    }

    case 'reading': {
      const bank = readingBanks?.[gradeLevel]
      if (bank && bank.length > 0) {
        return pickFromBank(bank, 'reading', difficulty, gradeLevel, enabledCategories)
      }
      return mathToGameQuestion(gradeLevel, difficulty, enabledCategories)
    }

    case 'spelling': {
      const bank = spellingBanks?.[gradeLevel]
      if (bank && bank.length > 0) {
        return pickFromBank(bank, 'spelling', difficulty, gradeLevel, enabledCategories)
      }
      return mathToGameQuestion(gradeLevel, difficulty, enabledCategories)
    }

    case 'images': {
      // Mix: ~33% counting, ~33% pattern, ~33% visual-id
      const roll = Math.random()
      if (roll < 0.33) {
        return generateCountingQuestion(gradeLevel, difficulty)
      } else if (roll < 0.66) {
        return generatePatternQuestion(gradeLevel, difficulty)
      }
      const bank = imageBanks?.[gradeLevel]
      if (bank && bank.length > 0) {
        return pickFromBank(bank, 'images', difficulty, gradeLevel, enabledCategories)
      }
      // Fallback to counting or pattern
      return Math.random() < 0.5
        ? generateCountingQuestion(gradeLevel, difficulty)
        : generatePatternQuestion(gradeLevel, difficulty)
    }

    case 'math':
    default:
      return mathToGameQuestion(gradeLevel, difficulty, enabledCategories)
  }
}

export function resetQuestionEngine(): void {
  recentlyShown.clear()
  lastSubjectIndex = -1
}

export { getDifficulty }

