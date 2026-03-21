import type { GameQuestion, Subject, GradeLevel, Difficulty, QuestionCategory, AdaptiveTier } from '../types'
import { tierToGradeLevel, tierToDifficulty } from './adaptiveDifficulty'
import { generateProblem, getDifficulty, GRADE_MATH_CATEGORIES } from './mathProblems'

interface BankQuestion {
  question: string
  choices: string[]
  correctIndex: number
  category: string
  difficulty: string
}

// Lazy-loaded question banks
let scienceBanks: Record<GradeLevel, BankQuestion[]> | null = null
let readingBanks: Record<GradeLevel, BankQuestion[]> | null = null

async function loadBanks() {
  if (!scienceBanks) {
    const [s1, s3, sa] = await Promise.all([
      import('../data/science/grade-1.json'),
      import('../data/science/grade-3.json'),
      import('../data/science/adult.json'),
    ])
    scienceBanks = {
      'grade-1': s1.default as BankQuestion[],
      'grade-3': s3.default as BankQuestion[],
      'adult': sa.default as BankQuestion[],
    }
  }
  if (!readingBanks) {
    const [r1, r3, ra] = await Promise.all([
      import('../data/reading/grade-1.json'),
      import('../data/reading/grade-3.json'),
      import('../data/reading/adult.json'),
    ])
    readingBanks = {
      'grade-1': r1.default as BankQuestion[],
      'grade-3': r3.default as BankQuestion[],
      'adult': ra.default as BankQuestion[],
    }
  }
}

// Eagerly start loading
loadBanks()

// Track recently shown questions to avoid repeats
const recentlyShown = new Set<string>()
const MAX_RECENT = 30

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
  const shuffled = shuffle(picked.choices)
  const newCorrectIndex = shuffled.indexOf(correctAnswer)

  return {
    question: picked.question,
    choices: shuffled,
    correctIndex: newCorrectIndex,
    subject,
    category: picked.category as QuestionCategory,
    difficulty,
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

  const problem = generateProblem(difficulty, mathCats as any)

  return {
    question: problem.question,
    choices: problem.choices.map(String),
    correctIndex: problem.choices.indexOf(problem.correctAnswer),
    subject: 'math',
    category: problem.type as QuestionCategory,
    difficulty: problem.difficulty,
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
        return pickFromBank(bank, 'science', difficulty, enabledCategories)
      }
      // Fallback to math if banks not loaded yet
      return mathToGameQuestion(gradeLevel, difficulty, enabledCategories)
    }

    case 'reading': {
      const bank = readingBanks?.[gradeLevel]
      if (bank && bank.length > 0) {
        return pickFromBank(bank, 'reading', difficulty, enabledCategories)
      }
      return mathToGameQuestion(gradeLevel, difficulty, enabledCategories)
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

export function generateQuestionForTier(
  tier: AdaptiveTier,
  enabledSubjects: Subject[],
  enabledCategories?: QuestionCategory[],
): GameQuestion {
  const gradeLevel = tierToGradeLevel(tier)
  const difficulty = tierToDifficulty(tier)
  return generateQuestion({ enabledSubjects, gradeLevel, difficulty, enabledCategories })
}
