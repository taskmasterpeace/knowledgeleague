export type GamePhase =
  | 'menu'
  | 'cpu-select'
  | 'avatar-select'
  | 'event-select'
  | 'phone-lobby'
  | 'playing'
  | 'victory'
  | 'trophies'

export type GameEvent = 'marathon' | 'tug-of-war'

export type PlayerType = 'human' | 'cpu'

export type PlayerId = number

export interface Player {
  id: PlayerId
  name: string
  color: string
  type: PlayerType
  position: number        // 0-100 for marathon, -100 to 100 for tug
  streak: number          // consecutive correct answers
  lockedUntil: number     // timestamp when lockout ends
  score: number           // problems answered correctly
  avatarUrl: string | null // AI-generated avatar GIF URL
}

export interface CPUCharacter {
  name: string
  speedRange: [number, number]  // min/max seconds to answer
  accuracy: number              // 0-1 probability of correct answer
  tagline: string
  color: string
  avatarUrl: string
  animatedUrl: string
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export type Subject = 'math' | 'science' | 'reading'
export type GradeLevel = 'grade-1' | 'grade-3' | 'adult'

export type ProblemType = 'addition' | 'subtraction' | 'missing' | 'comparison' | 'skip-counting'

// All question categories across all subjects
export type QuestionCategory =
  // Math (grade 1)
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

export interface Badge {
  category: QuestionCategory
  tier: 'bronze' | 'silver' | 'gold' | 'master'
  earnedAt: string
}

// Universal question format used by all game modes
export interface GameQuestion {
  question: string
  choices: string[]        // always 4 choices
  correctIndex: number     // index into choices array
  subject: Subject
  category: QuestionCategory
  difficulty: Difficulty
}

// Legacy math problem format (used internally by math generator)
export interface MathProblem {
  question: string
  correctAnswer: number
  choices: number[]       // 4 choices, one is correct
  type: ProblemType
  difficulty: Difficulty
}
