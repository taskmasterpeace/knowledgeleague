export type GamePhase =
  | 'menu'
  | 'cpu-select'
  | 'avatar-select'
  | 'event-select'
  | 'playing'
  | 'victory'

export type GameEvent = 'marathon' | 'tug-of-war'

export type PlayerType = 'human' | 'cpu'

export type PlayerId = 1 | 2 | 3 | 4

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

export type ProblemType = 'addition' | 'subtraction' | 'missing' | 'comparison' | 'skip-counting'

export interface MathProblem {
  question: string
  correctAnswer: number
  choices: number[]       // 4 choices, one is correct
  type: ProblemType
  difficulty: Difficulty
}
