# Multi-Subject Engine, Real Sounds & AI Announcer Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform BrainGames from math-only into a multi-subject game (Math/Science/Reading) with grade levels, real sound effects, and an AI announcer.

**Architecture:** Three phases: (1) Extend the type system and question engine to support Science/Reading via JSON question banks + expanded math generators, with a grade level setting. (2) Replace Web Audio synth sounds with real MP3 files. (3) Add AI announcer via Replicate Inworld TTS. All phases are independent and each produces working software.

**Tech Stack:** React 19, TypeScript, Zustand 5, Vite 7, Tailwind CSS 4, Replicate API (Inworld TTS 1.5 Mini)

---

## Chunk 1: Types, Question Engine & Question Banks

### Task 1: Extend Type System

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add new types to `src/types.ts`**

Add these types after the existing `ProblemType`:

```typescript
export type Subject = 'math' | 'science' | 'reading'
export type GradeLevel = 'grade-1' | 'grade-3' | 'adult'

// All question categories across all subjects
export type QuestionCategory =
  // Math (existing)
  | 'addition' | 'subtraction' | 'missing' | 'comparison' | 'skip-counting'
  // Math (grade 3+)
  | 'multiplication' | 'division' | 'fractions' | 'rounding'
  // Math (adult)
  | 'percentages' | 'order-of-operations' | 'square-roots' | 'estimation'
  // Science
  | 'animals' | 'plants' | 'body-senses' | 'weather' | 'space'
  | 'materials' | 'water-cycle' | 'forces' | 'food-chains' | 'fossils'
  | 'traits' | 'magnets' | 'matter' | 'chemistry' | 'biology'
  | 'physics' | 'astronomy' | 'earth-science'
  // Reading
  | 'rhyming' | 'opposites' | 'beginning-sounds' | 'fill-in-blank'
  | 'word-meaning' | 'sight-words' | 'vocabulary' | 'grammar'
  | 'figurative-language' | 'parts-of-speech' | 'sentence-correction'
  | 'etymology' | 'analogies' | 'spelling'

// Universal question format used by all game modes
export interface GameQuestion {
  question: string
  choices: string[]        // always 4 choices
  correctIndex: number     // index into choices array
  subject: Subject
  category: QuestionCategory
  difficulty: Difficulty
}
```

Also update the `Badge` interface to use `QuestionCategory`:

```typescript
export interface Badge {
  category: QuestionCategory  // was ProblemType
  tier: 'bronze' | 'silver' | 'gold' | 'master'
  earnedAt: string
}
```

Keep `ProblemType` and `MathProblem` as-is for backward compatibility within the math generator. They will be converted to `GameQuestion` at the engine boundary.

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: May show errors in playerProfile.ts and other files that reference `ProblemType` for Badge — fix those in later tasks.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add Subject, GradeLevel, QuestionCategory, and GameQuestion types"
```

---

### Task 2: Create Science Question Banks

**Files:**
- Create: `src/data/science/grade-1.json`
- Create: `src/data/science/grade-3.json`
- Create: `src/data/science/adult.json`

- [ ] **Step 1: Create `src/data/science/grade-1.json`**

Create a JSON array with ~60 questions covering Grade 1 science topics. Each question has this shape:

```json
[
  {
    "question": "What do plants need to grow?",
    "choices": ["Rocks", "Sunlight", "Darkness", "Pizza"],
    "correctIndex": 1,
    "category": "plants",
    "difficulty": "easy"
  },
  {
    "question": "What is a baby frog called?",
    "choices": ["Cub", "Puppy", "Tadpole", "Kitten"],
    "correctIndex": 2,
    "category": "animals",
    "difficulty": "easy"
  }
]
```

**Topics and target counts:**
- `animals` (12 questions): baby animals, animal needs, habitats, body coverings
- `plants` (10 questions): seeds, sunlight, water, roots, growth
- `body-senses` (10 questions): 5 senses, body parts and functions
- `weather` (10 questions): rain, snow, seasons, temperature
- `space` (8 questions): sun, moon, stars, day vs night
- `materials` (10 questions): solid vs liquid, hard vs soft, rough vs smooth

**Rules:**
- Grade 1 reading level: short sentences, simple words
- Include one obviously silly wrong answer per question for fun (e.g., "Pizza", "Dinosaurs", "A wizard")
- Spread difficulties: ~40% easy, 40% medium, 20% hard

- [ ] **Step 2: Create `src/data/science/grade-3.json`**

~60 questions covering:
- `water-cycle` (8): evaporation, condensation, precipitation
- `forces` (8): gravity, friction, push/pull, magnets
- `food-chains` (8): producers, consumers, decomposers
- `fossils` (6): what fossils tell us, types
- `traits` (8): inherited vs learned, life cycles
- `magnets` (6): what magnets attract, poles
- `matter` (8): states of matter, changes
- `weather` (8): climate zones, water cycle, prediction

- [ ] **Step 3: Create `src/data/science/adult.json`**

~60 questions covering:
- `chemistry` (12): element symbols, compounds, pH, reactions
- `biology` (12): human body, cells, genetics, organs
- `physics` (12): forces, energy, waves, light, electricity
- `astronomy` (12): planets, stars, galaxies, light-year
- `earth-science` (12): layers of earth, atmosphere, tectonic plates

- [ ] **Step 4: Commit**

```bash
git add src/data/science/
git commit -m "feat: add science question banks for grade-1, grade-3, and adult"
```

---

### Task 3: Create Reading Question Banks

**Files:**
- Create: `src/data/reading/grade-1.json`
- Create: `src/data/reading/grade-3.json`
- Create: `src/data/reading/adult.json`

- [ ] **Step 1: Create `src/data/reading/grade-1.json`**

~60 questions:
- `rhyming` (12): "Which word rhymes with cat?" → Hat/Dog/Cup/Run
- `opposites` (10): "What is the opposite of big?" → Small/Fast/Loud/Tall
- `beginning-sounds` (10): "Which word starts like sun?" → Sit/Moon/Fun/Run
- `fill-in-blank` (10): "The frog can ___ very high." → swim/fly/jump/read
- `word-meaning` (10): "What does happy mean?" → Sad/Glad/Mad/Tired
- `sight-words` (8): "Which is a real word?" with common sight words

- [ ] **Step 2: Create `src/data/reading/grade-3.json`**

~60 questions:
- `vocabulary` (12): "What does enormous mean?" → definitions
- `grammar` (12): verb tense, subject-verb agreement
- `figurative-language` (10): similes, idioms
- `parts-of-speech` (10): identify nouns, verbs, adjectives
- `sentence-correction` (8): pick the correct sentence
- `opposites` (8): harder antonym pairs

- [ ] **Step 3: Create `src/data/reading/adult.json`**

~60 questions:
- `vocabulary` (12): ubiquitous, ephemeral, etc.
- `grammar` (10): affect/effect, who/whom, lay/lie
- `etymology` (10): word origins
- `analogies` (10): hot:cold :: day:___
- `spelling` (10): which is spelled correctly?
- `figurative-language` (8): advanced idioms

- [ ] **Step 4: Commit**

```bash
git add src/data/reading/
git commit -m "feat: add reading question banks for grade-1, grade-3, and adult"
```

---

### Task 4: Expand Math Generator for Grade 3 and Adult

**Files:**
- Modify: `src/utils/mathProblems.ts`

- [ ] **Step 1: Add new math generators to `src/utils/mathProblems.ts`**

Add these functions after the existing `makeSkipCounting()`:

```typescript
function makeMultiplication(): MathProblem {
  const a = randInt(2, 10)
  const b = randInt(2, 10)
  const answer = a * b
  const choices = shuffle([answer, ...generateDistractors(answer)])
  return { question: `${a} × ${b}`, correctAnswer: answer, choices, type: 'multiplication' as ProblemType, difficulty: 'medium' }
}

function makeDivision(): MathProblem {
  const divisor = randInt(2, 10)
  const answer = randInt(2, 10)
  const dividend = divisor * answer
  const choices = shuffle([answer, ...generateDistractors(answer)])
  return { question: `${dividend} ÷ ${divisor}`, correctAnswer: answer, choices, type: 'division' as ProblemType, difficulty: 'medium' }
}

function makeFractions(): MathProblem {
  const wholes = [4, 6, 8, 10, 12, 16, 20]
  const whole = wholes[randInt(0, wholes.length - 1)]
  const divisor = [2, 4][randInt(0, 1)]
  const answer = whole / divisor
  const label = divisor === 2 ? 'half' : 'quarter'
  const choices = shuffle([answer, ...generateDistractors(answer)])
  return { question: `What is one ${label} of ${whole}?`, correctAnswer: answer, choices, type: 'fractions' as ProblemType, difficulty: 'hard' }
}

function makeRounding(): MathProblem {
  const num = randInt(11, 99)
  const answer = Math.round(num / 10) * 10
  const choices = shuffle([answer, ...generateDistractors(answer)])
  return { question: `Round ${num} to the nearest 10`, correctAnswer: answer, choices, type: 'rounding' as ProblemType, difficulty: 'medium' }
}

function makePercentages(): MathProblem {
  const percents = [10, 15, 20, 25, 50]
  const pct = percents[randInt(0, percents.length - 1)]
  const bases = [20, 40, 50, 60, 80, 100, 200]
  const base = bases[randInt(0, bases.length - 1)]
  const answer = (pct / 100) * base
  const choices = shuffle([answer, ...generateDistractors(answer)])
  return { question: `What is ${pct}% of ${base}?`, correctAnswer: answer, choices, type: 'percentages' as ProblemType, difficulty: 'hard' }
}

function makeOrderOfOps(): MathProblem {
  const a = randInt(2, 8)
  const b = randInt(2, 5)
  const c = randInt(1, 6)
  const answer = a + b * c
  const wrongAnswer = (a + b) * c  // common mistake
  const distractors = [wrongAnswer, answer + 1, answer - 1].filter(d => d !== answer)
  const choices = shuffle([answer, ...distractors.slice(0, 3)])
  return { question: `${a} + ${b} × ${c}`, correctAnswer: answer, choices, type: 'order-of-operations' as ProblemType, difficulty: 'hard' }
}

function makeSquareRoots(): MathProblem {
  const roots = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
  const root = roots[randInt(0, roots.length - 1)]
  const answer = root
  const square = root * root
  const choices = shuffle([answer, ...generateDistractors(answer)])
  return { question: `√${square}`, correctAnswer: answer, choices, type: 'square-roots' as ProblemType, difficulty: 'hard' }
}

function makeEstimation(): MathProblem {
  const a = randInt(11, 25)
  const b = randInt(3, 9)
  const answer = a * b
  const choices = shuffle([answer, answer + randInt(5, 15), answer - randInt(5, 15), answer + randInt(20, 30)])
  return { question: `Closest to ${a} × ${b}?`, correctAnswer: answer, choices, type: 'estimation' as ProblemType, difficulty: 'medium' }
}
```

- [ ] **Step 2: Update `generateForCategory` switch to include new cases**

Add cases for all new types:

```typescript
function generateForCategory(category: ProblemType, difficulty: Difficulty): MathProblem {
  switch (category) {
    case 'addition': return makeAddition(difficulty)
    case 'subtraction': return makeSubtraction()
    case 'missing': return makeMissing()
    case 'comparison': return makeComparison()
    case 'skip-counting': return makeSkipCounting()
    case 'multiplication': return makeMultiplication()
    case 'division': return makeDivision()
    case 'fractions': return makeFractions()
    case 'rounding': return makeRounding()
    case 'percentages': return makePercentages()
    case 'order-of-operations': return makeOrderOfOps()
    case 'square-roots': return makeSquareRoots()
    case 'estimation': return makeEstimation()
    default: return makeAddition(difficulty)
  }
}
```

- [ ] **Step 3: Add grade-level category mappings**

Add a new export that maps grade levels to available math categories:

```typescript
export const GRADE_MATH_CATEGORIES: Record<string, ProblemType[]> = {
  'grade-1': ['addition', 'subtraction', 'missing', 'comparison', 'skip-counting'],
  'grade-3': ['addition', 'subtraction', 'missing', 'comparison', 'skip-counting', 'multiplication', 'division', 'fractions', 'rounding'],
  'adult': ['addition', 'subtraction', 'multiplication', 'division', 'fractions', 'percentages', 'order-of-operations', 'square-roots', 'estimation'],
}
```

- [ ] **Step 4: Update `generateDistractors` to handle larger numbers**

The current function caps at 20. For adult math, we need larger ranges:

```typescript
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
```

- [ ] **Step 5: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS (new generators use `as ProblemType` cast since the union hasn't grown in types.ts ProblemType — they use QuestionCategory at the engine level)

Note: `ProblemType` stays as the narrow math-only union. The new categories use string casts internally and get converted to `QuestionCategory` in the question engine (Task 5).

- [ ] **Step 6: Commit**

```bash
git add src/utils/mathProblems.ts
git commit -m "feat: add math generators for grade-3 and adult (multiplication, division, fractions, percentages, etc.)"
```

---

### Task 5: Build the Unified Question Engine

**Files:**
- Create: `src/utils/questionEngine.ts`

- [ ] **Step 1: Create `src/utils/questionEngine.ts`**

```typescript
import type { GameQuestion, Subject, GradeLevel, Difficulty, QuestionCategory } from '../types'
import { generateProblem, getDifficulty, GRADE_MATH_CATEGORIES } from './mathProblems'

// Import question banks (Vite handles JSON imports)
import scienceGrade1 from '../data/science/grade-1.json'
import scienceGrade3 from '../data/science/grade-3.json'
import scienceAdult from '../data/science/adult.json'
import readingGrade1 from '../data/reading/grade-1.json'
import readingGrade3 from '../data/reading/grade-3.json'
import readingAdult from '../data/reading/adult.json'

interface BankQuestion {
  question: string
  choices: string[]
  correctIndex: number
  category: string
  difficulty: string
}

const SCIENCE_BANKS: Record<GradeLevel, BankQuestion[]> = {
  'grade-1': scienceGrade1 as BankQuestion[],
  'grade-3': scienceGrade3 as BankQuestion[],
  'adult': scienceAdult as BankQuestion[],
}

const READING_BANKS: Record<GradeLevel, BankQuestion[]> = {
  'grade-1': readingGrade1 as BankQuestion[],
  'grade-3': readingGrade3 as BankQuestion[],
  'adult': readingAdult as BankQuestion[],
}

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
    difficulty: difficulty,
  }
}

function mathToGameQuestion(
  gradeLevel: GradeLevel,
  difficulty: Difficulty,
  enabledCategories?: QuestionCategory[]
): GameQuestion {
  // Filter enabled categories to only math categories for this grade
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
    case 'math':
      return mathToGameQuestion(gradeLevel, difficulty, enabledCategories)

    case 'science':
      return pickFromBank(SCIENCE_BANKS[gradeLevel], 'science', difficulty, enabledCategories)

    case 'reading':
      return pickFromBank(READING_BANKS[gradeLevel], 'reading', difficulty, enabledCategories)

    default:
      return mathToGameQuestion(gradeLevel, difficulty, enabledCategories)
  }
}

export function resetQuestionEngine(): void {
  recentlyShown.clear()
  lastSubjectIndex = -1
}

export { getDifficulty }
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/utils/questionEngine.ts
git commit -m "feat: add unified question engine with subject rotation and bank selection"
```

---

### Task 6: Create `useQuestionEngine` Hook

**Files:**
- Create: `src/hooks/useQuestionEngine.ts`

- [ ] **Step 1: Create `src/hooks/useQuestionEngine.ts`**

```typescript
import { useState, useCallback } from 'react'
import { generateQuestion, getDifficulty, resetQuestionEngine } from '../utils/questionEngine'
import { useSettings } from './useSettings'
import type { GameQuestion, Difficulty } from '../types'

export function useQuestionEngine(fixedDifficulty?: Difficulty) {
  const { enabledSubjects, gradeLevel, enabledCategories } = useSettings()
  const [problemCount, setProblemCount] = useState(1)

  const makeQuestion = useCallback((num: number) => {
    const difficulty = fixedDifficulty ?? getDifficulty(num)
    return generateQuestion({
      enabledSubjects,
      gradeLevel,
      difficulty,
      enabledCategories: enabledCategories as any,
    })
  }, [fixedDifficulty, enabledSubjects, gradeLevel, enabledCategories])

  const [currentProblem, setCurrentProblem] = useState<GameQuestion>(() => makeQuestion(1))

  const nextProblem = useCallback(() => {
    const next = problemCount + 1
    setProblemCount(next)
    setCurrentProblem(makeQuestion(next))
  }, [problemCount, makeQuestion])

  const reset = useCallback(() => {
    resetQuestionEngine()
    setProblemCount(1)
    setCurrentProblem(makeQuestion(1))
  }, [makeQuestion])

  return { currentProblem, problemCount, nextProblem, reset }
}
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useQuestionEngine.ts
git commit -m "feat: add useQuestionEngine hook with subject/grade awareness"
```

---

## Chunk 2: Settings, UI & Game Mode Integration

### Task 7: Update Settings Store

**Files:**
- Modify: `src/hooks/useSettings.ts`

- [ ] **Step 1: Add `gradeLevel` and `enabledSubjects` to Settings**

Update the `Settings` interface and defaults:

```typescript
import type { ProblemType, Subject, GradeLevel, QuestionCategory } from '../types'

export interface Settings {
  difficulty: 'easy' | 'medium' | 'hard' | 'adaptive'
  timePerQuestion: number
  trackLength: number
  soundEnabled: boolean
  musicEnabled: boolean
  vibrationEnabled: boolean
  enabledCategories: QuestionCategory[]
  gradeLevel: GradeLevel
  enabledSubjects: Subject[]
  announcerEnabled: boolean
  announcerVoice: 'alex' | 'ashley' | 'dennis' | 'darlene'
  announcerFrequency: 'chatty' | 'normal' | 'quiet'
}

const defaults: Settings = {
  difficulty: 'adaptive',
  timePerQuestion: 10_000,
  trackLength: 20,
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
  enabledCategories: ['addition', 'subtraction', 'missing', 'comparison', 'skip-counting'],
  gradeLevel: 'grade-1',
  enabledSubjects: ['math'],
  announcerEnabled: false,
  announcerVoice: 'alex',
  announcerFrequency: 'normal',
}
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSettings.ts
git commit -m "feat: add gradeLevel, enabledSubjects, and announcer settings"
```

---

### Task 8: Update Settings UI

**Files:**
- Modify: `src/components/Settings/Settings.tsx`

- [ ] **Step 1: Add Grade Level and Subjects sections to Settings UI**

Add these sections to the Settings component, inserting them between the Difficulty section and the existing Problem Types section.

**Grade Level section** (above Difficulty):

```tsx
{/* Grade Level */}
<div>
  <label className="font-pixel text-[8px] text-white/50 uppercase tracking-wide block mb-2">Grade Level</label>
  <div className="flex gap-2">
    {([['grade-1', 'Grade 1'], ['grade-3', 'Grade 3'], ['adult', 'Adult']] as const).map(([value, label]) => (
      <button
        key={value}
        onClick={() => settings.update({ gradeLevel: value })}
        className={`flex-1 py-2 rounded-lg font-pixel text-[7px] transition-all pixel-btn ${
          settings.gradeLevel === value
            ? 'bg-yellow-500 text-gray-900'
            : 'bg-white/10 text-white/50 hover:bg-white/20'
        }`}
      >
        {label}
      </button>
    ))}
  </div>
</div>
```

**Subjects section** (after Grade Level):

```tsx
{/* Subjects */}
<div>
  <label className="font-pixel text-[8px] text-white/50 uppercase tracking-wide block mb-2">Subjects</label>
  <div className="flex gap-2">
    {([['math', 'Math'], ['science', 'Science'], ['reading', 'Reading']] as [Subject, string][]).map(([key, label]) => {
      const enabled = settings.enabledSubjects.includes(key)
      return (
        <button
          key={key}
          onClick={() => {
            if (enabled && settings.enabledSubjects.length === 1) return
            const next = enabled
              ? settings.enabledSubjects.filter(s => s !== key)
              : [...settings.enabledSubjects, key]
            settings.update({ enabledSubjects: next })
          }}
          className={`flex-1 py-2 rounded-lg font-pixel text-[7px] transition-all pixel-btn ${
            enabled
              ? 'bg-cyan-500 text-gray-900'
              : 'bg-white/10 text-white/50 hover:bg-white/20'
          }`}
        >
          {label}
        </button>
      )
    })}
  </div>
</div>
```

Add the `Subject` import at the top of the file:

```typescript
import type { ProblemType, Subject } from '../../types'
```

The existing "Problem Types" section stays as-is — it controls math categories. In a future iteration, we can add science/reading category toggles if needed.

- [ ] **Step 2: Run type check and test in browser**

Run: `npx tsc --noEmit`
Then open http://localhost:5173, go to Settings, verify the new Grade Level and Subjects sections appear and function.

- [ ] **Step 3: Commit**

```bash
git add src/components/Settings/Settings.tsx
git commit -m "feat: add grade level and subject toggles to settings UI"
```

---

### Task 9: Rename MathProblem Component to QuestionCard

**Files:**
- Modify: `src/components/shared/MathProblem.tsx` (rename + update)

- [ ] **Step 1: Update `MathProblem.tsx` to handle `GameQuestion` with string choices**

Update the component to accept `GameQuestion` and display string choices. Keep the file name as `MathProblem.tsx` for now to minimize import changes, but update the component internals:

```typescript
import type { GameQuestion } from '../../types'
import type { ControllerType } from '../../hooks/useGamepad'
import { ControllerButton } from './ControllerButtons'

interface Props {
  problem: GameQuestion
  onAnswer: (choiceIndex: number) => void
  lockedP1: boolean
  lockedP2: boolean
  p1Keys: string[]
  p2Keys: string[]
  controllerType?: ControllerType
}
```

Update the question display to handle both math and text questions:

```tsx
{/* Question card */}
<div className="pixel-card rounded-lg px-8 py-5 text-center relative">
  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 px-3 py-0.5 rounded font-pixel text-[8px] text-white uppercase">
    {problem.subject === 'math' ? 'SOLVE!' : problem.subject === 'science' ? 'SCIENCE!' : 'READING!'}
  </div>
  <div className={`font-pixel text-white text-glow tracking-wider ${
    problem.question.length > 30 ? 'text-lg' : 'text-3xl'
  }`}>
    {problem.subject === 'math'
      ? <>{problem.question} = <span className="text-yellow-300">?</span></>
      : problem.question
    }
  </div>
</div>
```

Update the choice rendering to handle text answers:

```tsx
<span className={`font-pixel text-white drop-shadow-md ${
  choice.length > 10 ? 'text-xs' : choice.length > 5 ? 'text-base' : 'text-2xl'
}`}>
  {choice}
</span>
```

- [ ] **Step 2: Update game mode components to use `GameQuestion`**

In `src/components/MathMarathon/MathMarathon.tsx`:
- Replace `import { useMathEngine } from '../../hooks/useMathEngine'` with `import { useQuestionEngine } from '../../hooks/useQuestionEngine'`
- Replace `const { currentProblem, nextProblem, problemCount } = useMathEngine(...)` with `const { currentProblem, nextProblem, problemCount } = useQuestionEngine(...)`
- Update the answer check: replace `currentProblem.choices[choiceIndex] === currentProblem.correctAnswer` with `choiceIndex === currentProblem.correctIndex`
- Update the result display: replace `roundResult.correctAnswer` with `currentProblem.choices[currentProblem.correctIndex]`
- Update the `RoundResult` interface: change `correctAnswer: number` to `correctAnswer: string`
- In `resolveRound()`, update: `correctAnswer: currentProblem.choices[currentProblem.correctIndex]`
- Update the `recordAnswer` call to use `currentProblem.category` (which is now `QuestionCategory`)

In `src/components/TugOfWar/TugOfWar.tsx`:
- Same `useMathEngine` → `useQuestionEngine` replacement
- Same answer check update: `choiceIndex === currentProblem.correctIndex`
- Same `recordAnswer` update

- [ ] **Step 3: Update playerProfile.ts to use `QuestionCategory`**

In `src/utils/playerProfile.ts`:
- Change the import: `import type { QuestionCategory, Badge } from '../types'`
- Update `PlayerProfile.stats` type: `Record<string, CategoryStats>` (use string key so it's flexible for all categories)
- Update `createProfile`: initialize with empty object `stats: {}` instead of hardcoded categories
- Update `recordAnswer` parameter type: `category: QuestionCategory`
- In `recordAnswer`, lazily create stats entries: `if (!profile.stats[category]) profile.stats[category] = emptyStats()`

- [ ] **Step 4: Run type check**

Run: `npx tsc --noEmit`
Fix any remaining type errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/MathProblem.tsx src/components/MathMarathon/MathMarathon.tsx src/components/TugOfWar/TugOfWar.tsx src/utils/playerProfile.ts
git commit -m "feat: integrate multi-subject question engine into game modes"
```

---

### Task 10: Update Trophy Shelf for Multi-Subject

**Files:**
- Modify: `src/components/TrophyShelf/TrophyShelf.tsx`

- [ ] **Step 1: Group badges by subject in the Trophy Shelf**

Update the Trophy Shelf to organize badges by subject (Math, Science, Reading) instead of by individual category. Show subject headers with category sub-sections.

The key change: instead of iterating over a fixed list of 5 ProblemType categories, iterate over the categories that actually appear in the player's stats:

```typescript
const SUBJECT_LABELS: Record<string, string> = {
  math: 'Math',
  science: 'Science',
  reading: 'Reading',
}

// Group the player's stats by subject
function getSubjectForCategory(cat: string): string {
  const mathCats = ['addition', 'subtraction', 'missing', 'comparison', 'skip-counting',
    'multiplication', 'division', 'fractions', 'rounding',
    'percentages', 'order-of-operations', 'square-roots', 'estimation']
  const scienceCats = ['animals', 'plants', 'body-senses', 'weather', 'space',
    'materials', 'water-cycle', 'forces', 'food-chains', 'fossils',
    'traits', 'magnets', 'matter', 'chemistry', 'biology',
    'physics', 'astronomy', 'earth-science']
  if (mathCats.includes(cat)) return 'math'
  if (scienceCats.includes(cat)) return 'science'
  return 'reading'
}
```

- [ ] **Step 2: Run type check and verify in browser**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/TrophyShelf/TrophyShelf.tsx
git commit -m "feat: update trophy shelf to group badges by subject"
```

---

## Chunk 3: Real Sound Effects

### Task 11: Download and Bundle Sound Effect Files

**Files:**
- Create: `public/sounds/correct.mp3`
- Create: `public/sounds/wrong.mp3`
- Create: `public/sounds/select.mp3`
- Create: `public/sounds/navigate.mp3`
- Create: `public/sounds/timer-warn.mp3`
- Create: `public/sounds/timer-final.mp3`
- Create: `public/sounds/streak.mp3`
- Create: `public/sounds/badge.mp3`
- Create: `public/sounds/victory.mp3`
- Create: `public/sounds/game-start.mp3`

- [ ] **Step 1: Generate sound effects**

Use a script or manual process to acquire free-licensed sound effects. Options:
1. Download from Mixkit.co (free, no attribution)
2. Download from Freesound.org (CC0 licensed)
3. Use `ffmpeg` to create simple tones if needed

Target specs for each file:
- Format: MP3, mono, 44.1kHz
- `correct.mp3`: bright chime/ding, ~0.5s
- `wrong.mp3`: buzzer/error, ~0.5s
- `select.mp3`: click/pop, ~0.2s
- `navigate.mp3`: soft tick, ~0.1s
- `timer-warn.mp3`: warning beep, ~0.3s
- `timer-final.mp3`: urgent beep, ~0.3s
- `streak.mp3`: power-up whoosh, ~0.8s
- `badge.mp3`: unlock jingle, ~1s
- `victory.mp3`: triumphant fanfare, ~2s
- `game-start.mp3`: countdown beeps, ~1.5s

- [ ] **Step 2: Verify files are in place**

```bash
ls -la public/sounds/
```
Expected: 10 MP3 files

- [ ] **Step 3: Commit**

```bash
git add public/sounds/
git commit -m "feat: add real sound effect MP3 files"
```

---

### Task 12: Replace Web Audio with Real Sound Files

**Files:**
- Modify: `src/utils/sounds.ts`

- [ ] **Step 1: Rewrite `sounds.ts` to use Audio elements**

Replace the entire file with:

```typescript
const audioCache = new Map<string, HTMLAudioElement>()

function playSound(file: string, volume = 0.5): void {
  let audio = audioCache.get(file)
  if (!audio) {
    audio = new Audio(`/sounds/${file}`)
    audioCache.set(file, audio)
  }
  audio.volume = volume
  audio.currentTime = 0
  audio.play().catch(() => {})
}

// Preload all sounds on first user interaction
let preloaded = false
export function preloadSounds(): void {
  if (preloaded) return
  preloaded = true
  const files = ['correct.mp3', 'wrong.mp3', 'select.mp3', 'navigate.mp3',
    'timer-warn.mp3', 'timer-final.mp3', 'streak.mp3', 'badge.mp3',
    'victory.mp3', 'game-start.mp3']
  for (const file of files) {
    const audio = new Audio(`/sounds/${file}`)
    audio.preload = 'auto'
    audioCache.set(file, audio)
  }
}

export const sounds = {
  correct: () => playSound('correct.mp3', 0.6),
  wrong: () => playSound('wrong.mp3', 0.5),
  select: () => playSound('select.mp3', 0.4),
  navigate: () => playSound('navigate.mp3', 0.3),
  timerWarn: () => playSound('timer-warn.mp3', 0.5),
  timerFinal: () => playSound('timer-final.mp3', 0.6),
  streak: () => playSound('streak.mp3', 0.6),
  badge: () => playSound('badge.mp3', 0.7),
  victory: () => playSound('victory.mp3', 0.7),
  gameStart: () => playSound('game-start.mp3', 0.6),
}
```

- [ ] **Step 2: Add preload call on first user interaction**

In `src/components/Menu/Menu.tsx`, add a call to `preloadSounds()` when any button is clicked:

```typescript
import { preloadSounds } from '../../utils/sounds'
// In the first button's onClick handler:
preloadSounds()
```

- [ ] **Step 3: Run type check and test in browser**

Run: `npx tsc --noEmit`
Test: Play a game and verify sounds play at correct moments.

- [ ] **Step 4: Commit**

```bash
git add src/utils/sounds.ts src/components/Menu/Menu.tsx
git commit -m "feat: replace Web Audio synth with real sound effect files"
```

---

## Chunk 4: AI Announcer

### Task 13: Build Announcer Engine

**Files:**
- Create: `src/utils/announcer.ts`

- [ ] **Step 1: Create `src/utils/announcer.ts`**

```typescript
import type { Subject } from '../types'

export interface AnnouncerLine {
  text: string
  priority: 'high' | 'normal' | 'low'
  pregenId?: string  // matches filename in public/sounds/announcer/
}

interface AnnouncerConfig {
  enabled: boolean
  voice: string
  frequency: 'chatty' | 'normal' | 'quiet'
}

const RATE_LIMITS: Record<string, number> = {
  chatty: 3000,
  normal: 5000,
  quiet: 10000,
}

let lastSpoken = 0
let currentAudio: HTMLAudioElement | null = null
const recentLines = new Set<string>()

export function speak(line: AnnouncerLine, config: AnnouncerConfig): void {
  if (!config.enabled) return

  const now = Date.now()
  const rateLimit = RATE_LIMITS[config.frequency] || 5000

  // Rate limiting (high priority bypasses)
  if (line.priority !== 'high' && now - lastSpoken < rateLimit) return

  // Quiet mode only plays high priority
  if (config.frequency === 'quiet' && line.priority !== 'high') return

  // Don't repeat same line within 30s
  if (recentLines.has(line.text)) return
  recentLines.add(line.text)
  setTimeout(() => recentLines.delete(line.text), 30000)

  // Stop current audio
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }

  lastSpoken = now

  // Try pre-generated file first
  if (line.pregenId) {
    const audio = new Audio(`/sounds/announcer/${config.voice}/${line.pregenId}.mp3`)
    audio.volume = 0.7
    currentAudio = audio
    audio.play().catch(() => {
      // Pre-generated file not found, try dynamic TTS
      generateAndSpeak(line.text, config.voice)
    })
    return
  }

  // Dynamic TTS via Replicate
  generateAndSpeak(line.text, config.voice)
}

async function generateAndSpeak(text: string, voice: string): Promise<void> {
  try {
    const response = await fetch('/api/replicate/v1/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version: 'inworld/tts-1.5-mini',
        input: {
          text,
          speaker: voice,
          output_format: 'mp3',
        },
      }),
    })

    if (!response.ok) return

    const prediction = await response.json()
    const id = prediction.id

    // Poll for result
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 300))
      const statusRes = await fetch(`/api/replicate/v1/predictions/${id}`)
      const status = await statusRes.json()

      if (status.status === 'succeeded' && status.output) {
        const audioUrl = typeof status.output === 'string' ? status.output : status.output[0]
        const audio = new Audio(audioUrl)
        audio.volume = 0.7
        currentAudio = audio
        audio.play().catch(() => {})
        return
      }

      if (status.status === 'failed') return
    }
  } catch {
    // Silently fail — announcer is non-critical
  }
}

export function stopAnnouncer(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  recentLines.clear()
}

// Pre-built announcer line generators
export function correctLine(playerName: string, streak: number): AnnouncerLine {
  if (streak >= 5) return { text: `[happy] ${playerName} is unstoppable! ${streak} in a row!`, priority: 'high' }
  if (streak >= 3) return { text: `[happy] ${playerName} is on fire!`, priority: 'normal', pregenId: 'on-fire' }
  const lines = ['Nice one!', 'That\'s right!', 'Brilliant!', 'Correct!']
  return { text: `[happy] ${lines[Math.floor(Math.random() * lines.length)]}`, priority: 'low', pregenId: 'correct-generic' }
}

export function wrongLine(playerName: string, hadStreak: boolean): AnnouncerLine {
  if (hadStreak) return { text: `[surprised] Ooh, ${playerName} breaks the streak!`, priority: 'normal' }
  return { text: '[sad] Not quite!', priority: 'low', pregenId: 'wrong-generic' }
}

export function leadChangeLine(playerName: string): AnnouncerLine {
  return { text: `[happy] ${playerName} takes the lead!`, priority: 'normal' }
}

export function closeRaceLine(): AnnouncerLine {
  return { text: `[excited] It's neck and neck!`, priority: 'high', pregenId: 'neck-and-neck' }
}

export function subjectChangeLine(subject: Subject): AnnouncerLine {
  const labels = { math: 'math', science: 'science', reading: 'reading' }
  return { text: `[happy] Time for some ${labels[subject]}!`, priority: 'low' }
}

export function victoryLine(playerName: string): AnnouncerLine {
  return { text: `[happy] And the winner is ${playerName}! What a game!`, priority: 'high' }
}
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/utils/announcer.ts
git commit -m "feat: add announcer engine with pre-gen and dynamic TTS support"
```

---

### Task 14: Create useAnnouncer Hook

**Files:**
- Create: `src/hooks/useAnnouncer.ts`

- [ ] **Step 1: Create `src/hooks/useAnnouncer.ts`**

```typescript
import { useEffect, useRef } from 'react'
import { useSettings } from './useSettings'
import { useGameState } from './useGameState'
import {
  speak, correctLine, wrongLine, leadChangeLine,
  closeRaceLine, victoryLine, stopAnnouncer,
} from '../utils/announcer'

export function useAnnouncer() {
  const { announcerEnabled, announcerVoice, announcerFrequency } = useSettings()
  const { players, winner, phase } = useGameState()
  const prevPositionsRef = useRef<Record<number, number>>({})

  const config = {
    enabled: announcerEnabled,
    voice: announcerVoice,
    frequency: announcerFrequency,
  }

  // React to winner
  useEffect(() => {
    if (winner && phase === 'victory') {
      const winnerPlayer = players.find(p => p.id === winner)
      if (winnerPlayer) {
        speak(victoryLine(winnerPlayer.name), config)
      }
    }
  }, [winner, phase])

  // Check for close race and lead changes
  useEffect(() => {
    if (phase !== 'playing') return
    if (players.length < 2) return

    const sorted = [...players].sort((a, b) => b.position - a.position)
    const leader = sorted[0]
    const second = sorted[1]

    if (leader && second) {
      const gap = leader.position - second.position
      if (gap <= 2 && gap >= 0 && leader.position > 3) {
        speak(closeRaceLine(), config)
      }

      // Lead change detection
      const prevPositions = prevPositionsRef.current
      const prevLeaderId = Object.entries(prevPositions)
        .sort(([, a], [, b]) => b - a)[0]?.[0]

      if (prevLeaderId && String(leader.id) !== prevLeaderId && leader.position > 3) {
        speak(leadChangeLine(leader.name), config)
      }
    }

    // Update previous positions
    const newPositions: Record<number, number> = {}
    for (const p of players) newPositions[p.id] = p.position
    prevPositionsRef.current = newPositions
  }, [players.map(p => p.position).join(',')])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAnnouncer()
  }, [])

  // Return a function game modes can call directly after answer resolution
  return {
    announceCorrect: (playerName: string, streak: number) => {
      speak(correctLine(playerName, streak), config)
    },
    announceWrong: (playerName: string, hadStreak: boolean) => {
      speak(wrongLine(playerName, hadStreak), config)
    },
  }
}
```

- [ ] **Step 2: Integrate into game modes**

In `MathMarathon.tsx`, add after the existing hooks:

```typescript
const { announceCorrect, announceWrong } = useAnnouncer()
```

In the `resolveRound()` function, after the effects section, add announcer calls:

```typescript
// Announcer
if (anyHumanCorrect) {
  for (const player of players) {
    const pid = player.id as PlayerId
    if (playerResults.get(pid)?.answer?.correct) {
      announceCorrect(player.name, player.streak + 1)
      break // only announce one player per round
    }
  }
} else {
  const firstHuman = players.find(p => p.type === 'human')
  if (firstHuman) announceWrong(firstHuman.name, firstHuman.streak > 0)
}
```

Similar integration in `TugOfWar.tsx`.

- [ ] **Step 3: Add announcer settings to Settings UI**

In `src/components/Settings/Settings.tsx`, add an Announcer section after the Subjects section:

```tsx
{/* Announcer */}
<div>
  <label className="font-pixel text-[8px] text-white/50 uppercase tracking-wide block mb-2">AI Announcer</label>
  <div className="pixel-card rounded-lg px-4 py-3 flex items-center justify-between mb-2">
    <span className="font-pixel text-[8px] text-white/60 uppercase">Announcer</span>
    <button
      onClick={() => settings.update({ announcerEnabled: !settings.announcerEnabled })}
      className={`w-14 h-7 rounded-full transition-all relative ${
        settings.announcerEnabled ? 'bg-green-500' : 'bg-white/20'
      }`}
    >
      <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${
        settings.announcerEnabled ? 'left-7' : 'left-0.5'
      }`} />
    </button>
  </div>
  {settings.announcerEnabled && (
    <>
      <div className="flex gap-2 mb-2">
        {(['alex', 'ashley', 'dennis', 'darlene'] as const).map(voice => (
          <button
            key={voice}
            onClick={() => settings.update({ announcerVoice: voice })}
            className={`flex-1 py-1.5 rounded-lg font-pixel text-[6px] capitalize transition-all pixel-btn ${
              settings.announcerVoice === voice
                ? 'bg-yellow-500 text-gray-900'
                : 'bg-white/10 text-white/50 hover:bg-white/20'
            }`}
          >
            {voice}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {(['chatty', 'normal', 'quiet'] as const).map(freq => (
          <button
            key={freq}
            onClick={() => settings.update({ announcerFrequency: freq })}
            className={`flex-1 py-1.5 rounded-lg font-pixel text-[6px] capitalize transition-all pixel-btn ${
              settings.announcerFrequency === freq
                ? 'bg-yellow-500 text-gray-900'
                : 'bg-white/10 text-white/50 hover:bg-white/20'
            }`}
          >
            {freq}
          </button>
        ))}
      </div>
    </>
  )}
</div>
```

- [ ] **Step 4: Run type check**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAnnouncer.ts src/components/MathMarathon/MathMarathon.tsx src/components/TugOfWar/TugOfWar.tsx src/components/Settings/Settings.tsx
git commit -m "feat: add AI announcer hook with game mode integration and settings UI"
```

---

### Task 15: Final Integration Testing

- [ ] **Step 1: Run full type check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Run tests**

Run: `npx vitest run`
Expected: All existing tests pass

- [ ] **Step 3: Manual testing checklist**

Open http://localhost:5173 and verify:

1. **Settings**:
   - [ ] Grade Level buttons work (Grade 1, Grade 3, Adult)
   - [ ] Subject toggles work (Math, Science, Reading)
   - [ ] At least one subject must stay enabled
   - [ ] Announcer toggle shows/hides voice and frequency options
   - [ ] All settings persist across page reload

2. **Math Marathon with Science + Reading enabled**:
   - [ ] Questions rotate between Math, Science, and Reading
   - [ ] Science questions show "SCIENCE!" badge, reading shows "READING!"
   - [ ] Text answers display correctly (not cut off, readable)
   - [ ] Correct/wrong detection works for all subjects
   - [ ] Score tracking works across subjects
   - [ ] Badges earned for science/reading categories appear in toast

3. **Tug of War**:
   - [ ] Same subject rotation works
   - [ ] Rope movement works correctly

4. **Grade Levels**:
   - [ ] Grade 1: Simple math, basic science, rhyming/opposites
   - [ ] Grade 3: Multiplication/division appear, harder science
   - [ ] Adult: Percentages, order of operations, advanced vocab

5. **Sounds**:
   - [ ] Correct answer plays chime
   - [ ] Wrong answer plays buzzer
   - [ ] Menu clicks play select sound
   - [ ] Timer warning sounds play at 3s/2s/1s
   - [ ] Victory fanfare plays

6. **Trophy Shelf**:
   - [ ] Badges grouped by subject (Math, Science, Reading)
   - [ ] Stats show correctly for all categories

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete multi-subject engine, real sounds, and AI announcer integration"
```
