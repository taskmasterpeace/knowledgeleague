# Tower Climb, Adaptive Difficulty, Spectator Mode & Post-Game Stats — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Tower Climb (3D voxel physics game mode), adaptive per-player difficulty, spectator mode with guessing detection, post-game stats screen, subject-specific leaderboards, background music, standards tagging, and announcer architecture refactor.

**Architecture:** Game state logic stays in hooks/utils (pure JS), 3D rendering is isolated in a lazy-loaded TowerClimb component using @react-three/fiber + @react-three/cannon. PlayerAnalytics is a standalone module used by all game modes. Spectator protocol extends the existing PeerJS host/client with a new `role` field. Announcer is refactored into a universal core + per-mode line generators.

**Tech Stack:** React 19, TypeScript, Vite 7, Tailwind CSS 4, Zustand 5, PeerJS, Three.js (via @react-three/fiber), Cannon.js (via @react-three/cannon), browser SpeechSynthesis API.

**Spec:** `docs/superpowers/specs/2026-03-21-tower-climb-adaptive-spectator-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/utils/playerAnalytics.ts` | PlayerAnalytics interface, creation, update, behavior tag computation, superlatives |
| `src/utils/adaptiveDifficulty.ts` | Per-player tier tracking, tier adjustment logic, tier-to-difficulty mapping |
| `src/utils/standardsMap.ts` | Category+grade → Common Core standard string mapping |
| `src/utils/speechSynthesis.ts` | Browser SpeechSynthesis wrapper with voice selection + fallback |
| `src/utils/backgroundMusic.ts` | Background music player — load, play, stop, crossfade between tracks |
| `src/utils/towerClimbAnnouncer.ts` | Tower Climb specific announcer line generators |
| `src/utils/marathonAnnouncer.ts` | Marathon specific announcer line generators (extracted from existing) |
| `src/utils/tugOfWarAnnouncer.ts` | Tug of War specific announcer line generators (extracted from existing) |
| `src/components/TowerClimb/TowerClimb.tsx` | Tower Climb game mode — game logic, answer handling, win condition |
| `src/components/TowerClimb/TowerScene.tsx` | Three.js 3D scene — towers, physics, camera, missiles, particles |
| `src/components/TowerClimb/VoxelTower.tsx` | Single tower — block stacking, wobble, collapse physics |
| `src/components/TowerClimb/Missile.tsx` | Missile projectile — arc trajectory, explosion on impact |
| `src/components/TowerClimb/PlayerSprite.tsx` | 2D pixel character billboard sprite in 3D scene |
| `src/components/PostGameStats/PostGameStats.tsx` | Post-game stats screen — player cards, superlatives |
| `src/components/Leaderboards/Leaderboards.tsx` | Subject-specific leaderboards from playerProfile data |
| `src/components/SpectatorDashboard/SpectatorDashboard.tsx` | Phone spectator live dashboard |

### Modified Files
| File | Changes |
|------|---------|
| `src/types.ts` | Add `'stats'`, `'leaderboards'` to GamePhase; `'tower-climb'` to GameEvent; `standard?` to GameQuestion; export PlayerAnalytics, BehaviorTag, SpectatorConnection types |
| `src/hooks/useGameState.ts` | No changes — analytics tracked outside Zustand |
| `src/hooks/useSettings.ts` | Add `adaptiveMode`, `behaviorTags` settings |
| `src/hooks/usePeerHost.ts` | Add `role` field handling, spectator connections, `broadcastSpectatorUpdate`, `broadcastStats` |
| `src/hooks/usePeerClient.ts` | Add `role` to join message, handle `spectatorInit`/`spectatorUpdate`/`statsUpdate` messages |
| `src/hooks/usePeerContext.ts` | Add `broadcastSpectatorUpdate`, `broadcastStats`, `spectators` to context |
| `src/hooks/useQuestionEngine.ts` | Accept per-player adaptive tier, generate question at appropriate difficulty |
| `src/utils/questionEngine.ts` | Add `generateQuestionForTier()` that maps tier → gradeLevel + difficulty |
| `src/utils/mathProblems.ts` | Add `standard` field to generated problems |
| `src/utils/announcer.ts` | Extract marathon/tug lines into separate files, add SpeechSynthesis mode selection |
| `src/hooks/useAnnouncer.ts` | Accept mode parameter, route to mode-specific announcer |
| `src/utils/sounds.ts` | Add mode-specific sound functions, background music control |
| `src/App.tsx` | Add `'stats'`, `'leaderboards'`, `'tower-climb'` routing, lazy-load TowerClimb |
| `src/components/EventSelect/EventSelect.tsx` | Add Tower Climb card |
| `src/components/Victory/Victory.tsx` | Auto-advance to stats phase after 4s |
| `src/components/Menu/Menu.tsx` | Add Leaderboards button |
| `src/components/Settings/Settings.tsx` | Add adaptive mode toggle, behavior tags visibility |
| `src/components/PhoneController/PhoneController.tsx` | Add spectator toggle on join, spectator dashboard view, stats view |
| `src/components/MathMarathon/MathMarathon.tsx` | Integrate PlayerAnalytics tracking |
| `src/components/TugOfWar/TugOfWar.tsx` | Integrate PlayerAnalytics tracking |
| `src/data/science/*.json` | Add `standard` field to entries |
| `src/data/reading/*.json` | Add `standard` field to entries |

---

## Task 1: Type System Extensions

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add new phases, events, and types**

Add to `src/types.ts`:
```typescript
// Update GamePhase
export type GamePhase =
  | 'menu' | 'cpu-select' | 'avatar-select' | 'event-select'
  | 'phone-lobby' | 'playing' | 'victory' | 'stats' | 'trophies' | 'leaderboards'

// Update GameEvent
export type GameEvent = 'marathon' | 'tug-of-war' | 'tower-climb'

// Add standard to GameQuestion
export interface GameQuestion {
  question: string
  choices: string[]
  correctIndex: number
  subject: Subject
  category: QuestionCategory
  difficulty: Difficulty
  standard?: string
}

// New types
export type BehaviorTag = 'on-fire' | 'mashing' | 'guessing' | 'thinking' | 'struggling' | 'warming-up' | 'playing'

export type AdaptiveTier = 1 | 2 | 3

export interface PlayerAnalytics {
  answersTotal: number
  answersCorrect: number
  last5Times: number[]
  last5Correct: boolean[]
  last5Choices: number[]
  last10Correct: boolean[]  // for adaptive difficulty (separate window)
  fullCorrectHistory: boolean[]  // ALL answers in order for streak calculation
  positionHistory: number[]  // position after each answer (for Comeback Kid)
  behaviorTagHistory: BehaviorTag[]  // tag at each question (for "On Fire for 6 questions")
  wrongWindowRecent5: boolean[]  // rolling window of 5 for wobble/instability tracking
  categoryAccuracy: Record<string, { correct: number; total: number }>
  responseTimes: number[]
  behaviorTag: BehaviorTag
  adaptiveTier: AdaptiveTier
  adaptiveHistory: AdaptiveTier[]
  blocksPlaced: number
  blocksLost: number
  missilesLaunched: number
  missilesTaken: number
  splashHitsTaken: number
}

// Spectator connection (host-side tracking)
export interface SpectatorConnection {
  name: string
  connId: string
}

export interface Superlative {
  award: string
  playerName: string
  value: string
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors (existing code still uses old types which are supersets)

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: extend type system for Tower Climb, analytics, adaptive difficulty"
```

---

## Task 2: Player Analytics Module

**Files:**
- Create: `src/utils/playerAnalytics.ts`

- [ ] **Step 1: Create the analytics module**

```typescript
import type { PlayerAnalytics, BehaviorTag, AdaptiveTier, Superlative, PlayerId } from '../types'

export function createPlayerAnalytics(startingTier: AdaptiveTier): PlayerAnalytics {
  return {
    answersTotal: 0,
    answersCorrect: 0,
    last5Times: [],
    last5Correct: [],
    last5Choices: [],
    last10Correct: [],
    fullCorrectHistory: [],
    positionHistory: [],
    behaviorTagHistory: [],
    wrongWindowRecent5: [],
    categoryAccuracy: {},
    responseTimes: [],
    behaviorTag: 'playing',
    adaptiveTier: startingTier,
    adaptiveHistory: [startingTier],
    blocksPlaced: 0,
    blocksLost: 0,
    missilesLaunched: 0,
    missilesTaken: 0,
    splashHitsTaken: 0,
  }
}

export function recordAnalyticsAnswer(
  analytics: PlayerAnalytics,
  choiceIndex: number,
  correct: boolean,
  responseTimeMs: number,
  category: string,
): PlayerAnalytics {
  const a = { ...analytics }

  a.answersTotal++
  if (correct) a.answersCorrect++

  // Rolling windows
  a.last5Times = [...a.last5Times, responseTimeMs].slice(-5)
  a.last5Correct = [...a.last5Correct, correct].slice(-5)
  a.last5Choices = [...a.last5Choices, choiceIndex].slice(-5)
  a.last10Correct = [...a.last10Correct, correct].slice(-10)
  a.fullCorrectHistory = [...a.fullCorrectHistory, correct]
  a.wrongWindowRecent5 = [...a.wrongWindowRecent5, !correct].slice(-5)

  // All response times
  a.responseTimes = [...a.responseTimes, responseTimeMs]

  // Category accuracy
  const cat = a.categoryAccuracy[category] ?? { correct: 0, total: 0 }
  a.categoryAccuracy = {
    ...a.categoryAccuracy,
    [category]: { correct: cat.correct + (correct ? 1 : 0), total: cat.total + 1 },
  }

  // Compute behavior tag and record history
  a.behaviorTag = computeBehaviorTag(a)
  a.behaviorTagHistory = [...a.behaviorTagHistory, a.behaviorTag]

  return a
}

export function computeBehaviorTag(a: PlayerAnalytics): BehaviorTag {
  if (a.last5Times.length < 3) return 'playing'

  const avgTime = a.last5Times.reduce((s, t) => s + t, 0) / a.last5Times.length
  const correctCount = a.last5Correct.filter(Boolean).length
  const total = a.last5Correct.length

  // Check for same-button mashing (3+ of last 5 are the same choice)
  const choiceCounts = new Map<number, number>()
  for (const c of a.last5Choices) choiceCounts.set(c, (choiceCounts.get(c) ?? 0) + 1)
  const maxSameChoice = Math.max(...choiceCounts.values())

  if (avgTime < 1500) {
    if (correctCount >= Math.ceil(total * 0.8)) return 'on-fire'
    if (maxSameChoice >= 3) return 'mashing'
    if (correctCount <= Math.floor(total * 0.2)) return 'guessing'
  }

  if (avgTime >= 3000) {
    if (correctCount >= Math.ceil(total * 0.8)) return 'thinking'
    if (correctCount <= Math.floor(total * 0.2)) return 'struggling'
  }

  // Warming up: last 3 better than previous 3
  if (a.last5Correct.length >= 5) {
    const recent3 = a.last5Correct.slice(-3).filter(Boolean).length
    const prev3 = a.last5Correct.slice(0, -3).filter(Boolean).length
    // Compare against a baseline — need at least 2/3 correct recently and improvement
    if (recent3 > prev3 && recent3 >= 2) return 'warming-up'
  }

  return 'playing'
}

export function computeSuperlatives(
  analyticsMap: Map<PlayerId, PlayerAnalytics>,
  playerNames: Map<PlayerId, string>,
): Superlative[] {
  const superlatives: Superlative[] = []
  const entries = [...analyticsMap.entries()]
  if (entries.length === 0) return superlatives

  // Speed Demon — fastest avg response time (min 3 answers)
  let fastestId: PlayerId | null = null
  let fastestAvg = Infinity
  for (const [id, a] of entries) {
    if (a.responseTimes.length < 3) continue
    const avg = a.responseTimes.reduce((s, t) => s + t, 0) / a.responseTimes.length
    if (avg < fastestAvg) { fastestAvg = avg; fastestId = id }
  }
  if (fastestId !== null) {
    superlatives.push({
      award: 'Speed Demon',
      playerName: playerNames.get(fastestId) ?? 'Unknown',
      value: `${(fastestAvg / 1000).toFixed(1)}s avg`,
    })
  }

  // Sharpshooter — highest accuracy (min 3 answers)
  let sharpId: PlayerId | null = null
  let sharpAcc = 0
  for (const [id, a] of entries) {
    if (a.answersTotal < 3) continue
    const acc = a.answersCorrect / a.answersTotal
    if (acc > sharpAcc) { sharpAcc = acc; sharpId = id }
  }
  if (sharpId !== null) {
    superlatives.push({
      award: 'Sharpshooter',
      playerName: playerNames.get(sharpId) ?? 'Unknown',
      value: `${Math.round(sharpAcc * 100)}%`,
    })
  }

  // Hot Streak — longest streak (from full answer history)
  let streakId: PlayerId | null = null
  let longestStreak = 0
  for (const [id, a] of entries) {
    let maxStreak = 0
    let current = 0
    for (const c of a.fullCorrectHistory) {
      if (c) { current++; maxStreak = Math.max(maxStreak, current) }
      else current = 0
    }
    if (maxStreak > longestStreak) { longestStreak = maxStreak; streakId = id }
  }
  if (streakId !== null && longestStreak >= 3) {
    superlatives.push({
      award: 'Hot Streak',
      playerName: playerNames.get(streakId) ?? 'Unknown',
      value: `${longestStreak} in a row`,
    })
  }

  // Comeback Kid — biggest position recovery (lowest position → final position delta)
  let comebackId: PlayerId | null = null
  let biggestComeback = 0
  for (const [id, a] of entries) {
    if (a.positionHistory.length < 3) continue
    const minPos = Math.min(...a.positionHistory)
    const finalPos = a.positionHistory[a.positionHistory.length - 1]
    const recovery = finalPos - minPos
    if (recovery > biggestComeback) { biggestComeback = recovery; comebackId = id }
  }
  if (comebackId !== null && biggestComeback > 0) {
    superlatives.push({
      award: 'Comeback Kid',
      playerName: playerNames.get(comebackId) ?? 'Unknown',
      value: `recovered ${biggestComeback} positions`,
    })
  }

  // Steady Eddie — most consistent response times (lowest std dev, min 5 answers)
  let steadyId: PlayerId | null = null
  let lowestStdDev = Infinity
  for (const [id, a] of entries) {
    if (a.responseTimes.length < 5) continue
    const avg = a.responseTimes.reduce((s, t) => s + t, 0) / a.responseTimes.length
    const variance = a.responseTimes.reduce((s, t) => s + (t - avg) ** 2, 0) / a.responseTimes.length
    const stdDev = Math.sqrt(variance)
    if (stdDev < lowestStdDev) { lowestStdDev = stdDev; steadyId = id }
  }
  if (steadyId !== null) {
    superlatives.push({
      award: 'Steady Eddie',
      playerName: playerNames.get(steadyId) ?? 'Unknown',
      value: 'like a metronome',
    })
  }

  // Quick Learner — biggest accuracy improvement first half → second half
  let learnerId: PlayerId | null = null
  let biggestImprovement = 0
  for (const [id, a] of entries) {
    if (a.responseTimes.length < 6) continue // need at least 3+3
    const half = Math.floor(a.last10Correct.length / 2)
    if (half < 2) continue
    const firstHalf = a.last10Correct.slice(0, half).filter(Boolean).length / half
    const secondHalf = a.last10Correct.slice(half).filter(Boolean).length / (a.last10Correct.length - half)
    const improvement = secondHalf - firstHalf
    if (improvement > biggestImprovement && improvement > 0.2) {
      biggestImprovement = improvement
      learnerId = id
    }
  }
  if (learnerId !== null) {
    const a = analyticsMap.get(learnerId)!
    const half = Math.floor(a.last10Correct.length / 2)
    const firstPct = Math.round(a.last10Correct.slice(0, half).filter(Boolean).length / half * 100)
    const secondPct = Math.round(a.last10Correct.slice(half).filter(Boolean).length / (a.last10Correct.length - half) * 100)
    superlatives.push({
      award: 'Quick Learner',
      playerName: playerNames.get(learnerId) ?? 'Unknown',
      value: `${firstPct}% → ${secondPct}%`,
    })
  }

  return superlatives
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/utils/playerAnalytics.ts
git commit -m "feat: add PlayerAnalytics module with behavior detection and superlatives"
```

---

## Task 3: Adaptive Difficulty Engine

**Files:**
- Create: `src/utils/adaptiveDifficulty.ts`
- Modify: `src/utils/questionEngine.ts`
- Modify: `src/hooks/useSettings.ts`

- [ ] **Step 1: Create adaptive difficulty module**

Create `src/utils/adaptiveDifficulty.ts`:
```typescript
import type { AdaptiveTier, GradeLevel, Difficulty } from '../types'

export function gradeToStartingTier(grade: GradeLevel): AdaptiveTier {
  switch (grade) {
    case 'grade-1': return 1
    case 'grade-3': return 2
    case 'adult': return 3
  }
}

export function tierToGradeLevel(tier: AdaptiveTier): GradeLevel {
  switch (tier) {
    case 1: return 'grade-1'
    case 2: return 'grade-3'
    case 3: return 'adult'
  }
}

export function tierToDifficulty(tier: AdaptiveTier): Difficulty {
  switch (tier) {
    case 1: return 'easy'
    case 2: return 'medium'
    case 3: return 'hard'
  }
}

/**
 * Adjusts tier based on rolling accuracy of last 10 answers.
 * 80%+ → bump up, below 40% → drop down, 40-80% → stay.
 */
export function adjustTier(currentTier: AdaptiveTier, last10Correct: boolean[]): AdaptiveTier {
  if (last10Correct.length < 5) return currentTier // need minimum data

  const correctCount = last10Correct.filter(Boolean).length
  const accuracy = correctCount / last10Correct.length

  if (accuracy >= 0.8 && currentTier < 3) return (currentTier + 1) as AdaptiveTier
  if (accuracy < 0.4 && currentTier > 1) return (currentTier - 1) as AdaptiveTier
  return currentTier
}
```

- [ ] **Step 2: Add generateQuestionForTier to questionEngine.ts**

Add to bottom of `src/utils/questionEngine.ts`:
```typescript
import { tierToGradeLevel, tierToDifficulty } from './adaptiveDifficulty'
import type { AdaptiveTier } from '../types'

export function generateQuestionForTier(
  tier: AdaptiveTier,
  enabledSubjects: Subject[],
  enabledCategories?: QuestionCategory[],
): GameQuestion {
  const gradeLevel = tierToGradeLevel(tier)
  const difficulty = tierToDifficulty(tier)
  return generateQuestion({ enabledSubjects, gradeLevel, difficulty, enabledCategories })
}
```

- [ ] **Step 3: Add adaptive settings**

Add to `src/hooks/useSettings.ts` Settings interface:
```typescript
adaptiveMode: 'off' | 'per-player'
behaviorTags: 'spectators-only' | 'post-game' | 'always'
```

Add to defaults:
```typescript
adaptiveMode: 'off',
behaviorTags: 'spectators-only',
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/utils/adaptiveDifficulty.ts src/utils/questionEngine.ts src/hooks/useSettings.ts
git commit -m "feat: add adaptive difficulty engine with per-player tier adjustment"
```

---

## Task 4: Standards Tagging

**Files:**
- Create: `src/utils/standardsMap.ts`
- Modify: `src/utils/mathProblems.ts`
- Modify: `src/utils/questionEngine.ts`

- [ ] **Step 1: Create standards mapping**

Create `src/utils/standardsMap.ts`:
```typescript
import type { QuestionCategory, GradeLevel } from '../types'

// Common Core State Standards mappings
const STANDARDS: Record<string, Record<string, string>> = {
  'grade-1': {
    addition: '1.OA.C.6',
    subtraction: '1.OA.C.6',
    missing: '1.OA.A.1',
    comparison: '1.NBT.B.3',
    'skip-counting': '1.NBT.A.1',
    rhyming: 'RF.1.2',
    opposites: 'L.1.5',
    'beginning-sounds': 'RF.1.2',
    'fill-in-blank': 'L.1.1',
    'word-meaning': 'L.1.4',
    'sight-words': 'RF.1.3',
    animals: '1-LS1-1',
    plants: '1-LS1-1',
    'body-senses': '1-LS1-1',
    weather: '1-ESS1-2',
    space: '1-ESS1-1',
  },
  'grade-3': {
    multiplication: '3.OA.C.7',
    division: '3.OA.C.7',
    fractions: '3.NF.A.1',
    rounding: '3.NBT.A.1',
    addition: '3.NBT.A.2',
    subtraction: '3.NBT.A.2',
    vocabulary: 'L.3.4',
    grammar: 'L.3.1',
    'parts-of-speech': 'L.3.1',
    'figurative-language': 'L.3.5',
    'sentence-correction': 'L.3.2',
    materials: '3-PS2-1',
    'water-cycle': '3-ESS2-1',
    forces: '3-PS2-1',
    'food-chains': '3-LS4-3',
    magnets: '3-PS2-3',
  },
  adult: {
    percentages: '6.RP.A.3',
    'order-of-operations': '5.OA.A.1',
    'square-roots': '8.EE.A.2',
    estimation: '4.NBT.A.3',
    multiplication: '5.NBT.B.5',
    division: '5.NBT.B.6',
    fractions: '5.NF.A.1',
    etymology: 'L.8.4',
    analogies: 'L.8.5',
    spelling: 'L.8.2',
    chemistry: 'HS-PS1-1',
    biology: 'HS-LS1-1',
    physics: 'HS-PS2-1',
    astronomy: 'HS-ESS1-1',
    'earth-science': 'HS-ESS2-1',
  },
}

export function getStandard(category: QuestionCategory, gradeLevel: GradeLevel): string | undefined {
  return STANDARDS[gradeLevel]?.[category]
}
```

- [ ] **Step 2: Add standard field to math problem generation**

In `src/utils/mathProblems.ts`, after generating a problem, look up the standard. Modify the `mathToGameQuestion` function in `questionEngine.ts` to include standard:
```typescript
import { getStandard } from './standardsMap'

// In mathToGameQuestion, add to the return:
standard: getStandard(problem.type as QuestionCategory, gradeLevel),
```

- [ ] **Step 3: Add standard field to pickFromBank in questionEngine.ts**

In `pickFromBank`, add to the return object:
```typescript
standard: getStandard(picked.category as QuestionCategory, /* gradeLevel needs to be passed in */),
```

Update `pickFromBank` signature to accept `gradeLevel: GradeLevel` parameter.

- [ ] **Step 4: Add standard fields to science/reading JSON banks**

Write a Node script `scripts/add-standards-to-banks.mjs` that:
1. Reads each JSON file in `src/data/science/` and `src/data/reading/`
2. For each entry, looks up the standard using the same mapping from `standardsMap.ts`
3. Adds `"standard": "..."` to each entry
4. Writes the file back

Run it:
```bash
node scripts/add-standards-to-banks.mjs
```

Verify a few entries have standards added.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add src/utils/standardsMap.ts src/utils/mathProblems.ts src/utils/questionEngine.ts src/data/ scripts/add-standards-to-banks.mjs
git commit -m "feat: add Common Core standards tagging to all questions"
```

---

## Task 5: Announcer Architecture Refactor

**Files:**
- Create: `src/utils/marathonAnnouncer.ts`
- Create: `src/utils/tugOfWarAnnouncer.ts`
- Create: `src/utils/towerClimbAnnouncer.ts`
- Create: `src/utils/speechSynthesis.ts`
- Modify: `src/utils/announcer.ts`

- [ ] **Step 1: Create SpeechSynthesis wrapper**

Create `src/utils/speechSynthesis.ts`:
```typescript
let cachedVoice: SpeechSynthesisVoice | null = null

function getVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice
  if (!window.speechSynthesis) return null

  const voices = window.speechSynthesis.getVoices()
  // Prefer en-US voices
  const enUS = voices.filter(v => v.lang.startsWith('en-US'))
  cachedVoice = enUS[0] ?? voices.find(v => v.lang.startsWith('en')) ?? voices[0] ?? null
  return cachedVoice
}

export function speakLocal(text: string): boolean {
  if (!window.speechSynthesis) return false
  const voice = getVoice()
  if (!voice) return false

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.voice = voice
  utterance.rate = 1.1
  utterance.volume = 0.7
  window.speechSynthesis.speak(utterance)
  return true
}

export function isAvailable(): boolean {
  return 'speechSynthesis' in window
}

// Preload voices (needed on some browsers)
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => { cachedVoice = null; getVoice() }
}
```

- [ ] **Step 2: Create marathon announcer lines**

Create `src/utils/marathonAnnouncer.ts`:
```typescript
import type { AnnouncerLine } from './announcer'

export function bigJumpLine(name: string): AnnouncerLine {
  const lines = [`Huge leap! ${name} is SPRINTING!`, `${name} just covered serious ground!`]
  return { text: lines[Math.floor(Math.random() * lines.length)], priority: 'normal' }
}

export function fallingBehindLine(name: string): AnnouncerLine {
  return { text: `${name} is falling behind! Can they catch up?`, priority: 'low' }
}

export function finalStretchLine(name: string): AnnouncerLine {
  return { text: `${name} can see the finish line!`, priority: 'high' }
}

export function photoFinishLine(): AnnouncerLine {
  return { text: "It's gonna be a PHOTO FINISH!", priority: 'high' }
}
```

- [ ] **Step 3: Create tug of war announcer lines**

Create `src/utils/tugOfWarAnnouncer.ts`:
```typescript
import type { AnnouncerLine } from './announcer'

export function superPullLine(teamNum: number): AnnouncerLine {
  return { text: `SUPER PULL! Team ${teamNum} is dragging them!`, priority: 'high' }
}

export function momentumShiftLine(): AnnouncerLine {
  return { text: 'The tide is turning!', priority: 'high' }
}

export function nearlyWonLine(): AnnouncerLine {
  return { text: "They're on the edge! One more pull!", priority: 'high' }
}

export function comebackLine(): AnnouncerLine {
  return { text: 'WHAT A COMEBACK!', priority: 'high' }
}
```

- [ ] **Step 4: Create tower climb announcer lines**

Create `src/utils/towerClimbAnnouncer.ts`:
```typescript
import type { AnnouncerLine } from './announcer'

export function blockPlacedLine(name: string): AnnouncerLine {
  const lines = ['Another brick!', `${name}'s tower is rising!`]
  return { text: lines[Math.floor(Math.random() * lines.length)], priority: 'low' }
}

export function missileLaunchedLine(name: string): AnnouncerLine {
  return { text: `THREE IN A ROW! ${name} launched a MISSILE!`, priority: 'high' }
}

export function towerWobblingLine(name: string): AnnouncerLine {
  const lines = [
    `Whoa, ${name}'s tower is looking SHAKY!`,
    "Careful! That thing's about to crumble!",
  ]
  return { text: lines[Math.floor(Math.random() * lines.length)], priority: 'normal' }
}

export function blockFellLine(name: string): AnnouncerLine {
  const lines = [
    'OH NO it crumbled! That\'s what happens when you guess!',
    `Down goes a block! Slow down, ${name}!`,
  ]
  return { text: lines[Math.floor(Math.random() * lines.length)], priority: 'normal' }
}

export function missileHitLine(name: string): AnnouncerLine {
  const lines = [`DIRECT HIT on ${name}!`, `BOOM! ${name} just lost a block!`]
  return { text: lines[Math.floor(Math.random() * lines.length)], priority: 'high' }
}

export function tallestTowerLine(name: string): AnnouncerLine {
  return { text: `New leader! ${name}'s tower is the tallest!`, priority: 'normal' }
}

export function neckAndNeckLine(): AnnouncerLine {
  return { text: "It's a RACE to the top! Who's gonna finish first?!", priority: 'high' }
}

export function almostWonLine(name: string): AnnouncerLine {
  return { text: `ONE MORE BLOCK! ${name} is about to win this!`, priority: 'high' }
}

export function towerVictoryLine(name: string): AnnouncerLine {
  return { text: `TOWER COMPLETE! ${name} wins it! Ten blocks TALL!`, priority: 'high' }
}

export function missileFizzleLine(): AnnouncerLine {
  return { text: 'Missile wasted! Nothing to hit!', priority: 'low' }
}
```

- [ ] **Step 5: Update announcer.ts to support SpeechSynthesis mode**

Add to `src/utils/announcer.ts`, modify the `speak` function to accept an optional `useSpeechSynthesis` flag:
```typescript
import { speakLocal, isAvailable as isSpeechAvailable } from './speechSynthesis'

export function speak(line: AnnouncerLine, config: AnnouncerConfig, useSpeechSynthesis = false): void {
  // ... existing rate limiting and dedup logic ...

  // If SpeechSynthesis mode requested and available, use it
  if (useSpeechSynthesis && isSpeechAvailable()) {
    const cleanText = line.text.replace(/\[.*?\]\s*/g, '')
    speakLocal(cleanText)
    return
  }

  // ... existing Replicate TTS logic ...
}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 7: Commit**

```bash
git add src/utils/speechSynthesis.ts src/utils/marathonAnnouncer.ts src/utils/tugOfWarAnnouncer.ts src/utils/towerClimbAnnouncer.ts src/utils/announcer.ts
git commit -m "feat: refactor announcer into mode-specific modules + SpeechSynthesis support"
```

---

## Task 6: Background Music Module

**Files:**
- Create: `src/utils/backgroundMusic.ts`
- Modify: `src/utils/sounds.ts`

- [ ] **Step 1: Create background music player**

Create `src/utils/backgroundMusic.ts`:
```typescript
let currentTrack: HTMLAudioElement | null = null
let currentTrackName: string | null = null

const TRACKS: Record<string, string> = {
  menu: '/music/menu.mp3',
  marathon: '/music/marathon.mp3',
  'tug-of-war': '/music/tug-of-war.mp3',
  'tower-climb': '/music/tower-climb.mp3',
  victory: '/music/victory.mp3',
}

export function playMusic(trackName: string, volume = 0.3): void {
  if (currentTrackName === trackName && currentTrack && !currentTrack.paused) return

  stopMusic()

  const src = TRACKS[trackName]
  if (!src) return

  const audio = new Audio(src)
  audio.loop = trackName !== 'victory'
  audio.volume = volume
  audio.play().catch(() => {}) // silently fail if file doesn't exist yet
  currentTrack = audio
  currentTrackName = trackName
}

export function stopMusic(): void {
  if (currentTrack) {
    currentTrack.pause()
    currentTrack.currentTime = 0
    currentTrack = null
    currentTrackName = null
  }
}

export function setMusicVolume(volume: number): void {
  if (currentTrack) currentTrack.volume = volume
}
```

- [ ] **Step 2: Add mode-specific sounds to sounds.ts**

Add to `src/utils/sounds.ts`:
```typescript
// Mode-specific sounds
export const marathonSounds = {
  step: () => playSound('marathon/step.wav', 0.4),
  finishLine: () => playSound('marathon/finish-line.wav', 0.7),
}

export const tugSounds = {
  ropePull: () => playSound('tug/rope-pull.wav', 0.5),
  superPull: () => playSound('tug/super-pull.wav', 0.6),
  ropeSnap: () => playSound('tug/rope-snap.wav', 0.7),
}

export const towerSounds = {
  blockPlace: () => playSound('tower/block-place.wav', 0.5),
  blockCrumble: () => playSound('tower/block-crumble.wav', 0.5),
  towerCreak: () => playSound('tower/tower-creak.wav', 0.5),
  towerCollapse: () => playSound('tower/tower-collapse.wav', 0.6),
  missileLaunch: () => playSound('tower/missile-launch.wav', 0.6),
  missileHit: () => playSound('tower/missile-hit.wav', 0.6),
  splashHit: () => playSound('tower/splash-hit.wav', 0.3),
  towerComplete: () => playSound('tower/tower-complete.wav', 0.7),
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/utils/backgroundMusic.ts src/utils/sounds.ts
git commit -m "feat: add background music player and mode-specific sound effects"
```

---

## Task 7: Spectator Protocol in PeerJS

**Files:**
- Modify: `src/hooks/usePeerHost.ts`
- Modify: `src/hooks/usePeerClient.ts`
- Modify: `src/hooks/usePeerContext.ts`

- [ ] **Step 1: Update usePeerHost to handle spectators**

In `src/hooks/usePeerHost.ts`:
- Add `spectatorsRef = useRef<Map<string, DataConnection>>(new Map())`
- Add `spectators` state: `useState<{ name: string; connId: string }[]>([])`
- In the `conn.on('data')` handler, check for `role: 'spectator'` in join messages
- Add `broadcastSpectatorUpdate(analytics)` function that sends to spectatorsRef
- Add `broadcastStats(playerStats)` function
- Cap spectators at 10
- Send `spectatorInit` on spectator connect

Key changes to the join handler:
```typescript
if (data.type === 'join' && data.name) {
  if (data.role === 'spectator') {
    // Spectator join
    if (spectatorsRef.current.size >= 10) {
      conn.send({ type: 'lobbyFull', reason: 'spectator' })
      return
    }
    spectatorsRef.current.set(conn.connectionId, conn)
    setSpectators(prev => [...prev, { name: data.name!, connId: conn.connectionId }])
    // Send current state
    conn.send({ type: 'spectatorInit', players: remotePlayersRef.current })
    return
  }
  // ... existing player join logic ...
}
```

- [ ] **Step 2: Update usePeerClient to handle spectator mode**

In `src/hooks/usePeerClient.ts`:
- Add `role` state ('player' | 'spectator')
- Add `spectatorData` state for analytics updates
- Update `connect()` to accept role parameter
- Handle `spectatorInit` and `spectatorUpdate` message types
- Handle `statsUpdate` message type

- [ ] **Step 3: Update PeerContext**

In `src/hooks/usePeerContext.ts`:
- Add `spectators`, `broadcastSpectatorUpdate`, `broadcastStats` to context interface

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePeerHost.ts src/hooks/usePeerClient.ts src/hooks/usePeerContext.ts
git commit -m "feat: add spectator protocol to PeerJS host/client"
```

---

## Task 8: Settings UI Updates

**Files:**
- Modify: `src/components/Settings/Settings.tsx`

- [ ] **Step 1: Add adaptive mode toggle**

In the Difficulty section of Settings, add:
```tsx
{/* Adaptive Mode */}
<div className="flex items-center justify-between">
  <span className="font-pixel text-[9px] text-white/70">Adaptive (per player)</span>
  <button
    onClick={() => update({ adaptiveMode: adaptiveMode === 'off' ? 'per-player' : 'off' })}
    className={`w-10 h-5 rounded-full transition-colors ${
      adaptiveMode === 'per-player' ? 'bg-green-500' : 'bg-white/20'
    }`}
  >
    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
      adaptiveMode === 'per-player' ? 'translate-x-5' : 'translate-x-0.5'
    }`} />
  </button>
</div>
```

- [ ] **Step 2: Add behavior tags visibility**

Add a new section in Settings:
```tsx
{/* Behavior Tags */}
<div className="flex flex-col gap-2">
  <span className="font-pixel text-[9px] text-white/50">BEHAVIOR TAGS</span>
  {(['spectators-only', 'post-game', 'always'] as const).map(opt => (
    <button
      key={opt}
      onClick={() => update({ behaviorTags: opt })}
      className={`font-pixel text-[9px] px-3 py-1.5 rounded ${
        behaviorTags === opt ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 text-white/50'
      }`}
    >
      {opt === 'spectators-only' ? 'Spectators Only' : opt === 'post-game' ? 'Post-Game' : 'Always Visible'}
    </button>
  ))}
</div>
```

- [ ] **Step 3: Verify it renders**

Run: `npm run dev` and open Settings modal to verify new controls appear.

- [ ] **Step 4: Commit**

```bash
git add src/components/Settings/Settings.tsx
git commit -m "feat: add adaptive mode and behavior tags to Settings UI"
```

---

## Task 9: Install Three.js Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Three.js ecosystem**

```bash
npm install three @react-three/fiber @react-three/cannon @types/three
```

- [ ] **Step 2: Verify build still works**

Run: `npx tsc --noEmit && npm run build`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install Three.js, react-three-fiber, and cannon physics"
```

---

## Task 10: Tower Climb — 3D Scene Components

**Files:**
- Create: `src/components/TowerClimb/VoxelTower.tsx`
- Create: `src/components/TowerClimb/Missile.tsx`
- Create: `src/components/TowerClimb/PlayerSprite.tsx`
- Create: `src/components/TowerClimb/TowerScene.tsx`

- [ ] **Step 1: Create VoxelTower component**

Create `src/components/TowerClimb/VoxelTower.tsx` — a single tower with block stacking physics:
- Props: `blockCount`, `wobbleIntensity`, `color`, `position` (x,z in scene)
- Each block is a `<Box>` from @react-three/cannon with mass
- Blocks spawn above and drop with gravity
- `wobbleIntensity` (0-2) controls oscillating force applied to top blocks
- When a block needs to "fall off", apply impulse to top block

Key approach:
- Use `useBox` from @react-three/cannon for each block
- Blocks are 1x1x1 voxels with pixel-textured material
- Stack position: y = blockIndex * 1.05 (slight gap for physics settling)
- Wobble: apply small oscillating torque to all blocks based on `wobbleIntensity`

- [ ] **Step 2: Create Missile component**

Create `src/components/TowerClimb/Missile.tsx`:
- Props: `from` (vec3), `to` (vec3), `onImpact` callback
- Animated along parabolic arc using `useFrame`
- Trail particles using instanced points
- On arrival, trigger `onImpact` and show explosion particles (orange/red spheres that expand and fade)

- [ ] **Step 3: Create PlayerSprite component**

Create `src/components/TowerClimb/PlayerSprite.tsx`:
- Props: `avatarUrl`, `name`, `color`, `position` (vec3)
- Approach: render a flat `<mesh>` plane with `<planeGeometry>` that always faces camera using `useFrame` to copy camera quaternion
- If `avatarUrl` exists, load as `<textureLoader>` and apply to the plane
- If no avatar, use a `<meshBasicMaterial>` with the player's color
- Name label: render as a second smaller plane below with a canvas-generated texture (use `CanvasTexture` to render text to a 2D canvas, then use as Three.js texture)
- No @react-three/drei dependency needed — pure Three.js primitives

- [ ] **Step 4: Create TowerScene component**

Create `src/components/TowerClimb/TowerScene.tsx`:
- Props: `players` array with `{ id, name, color, blockCount, wobbleIntensity, avatarUrl, type: 'human' | 'cpu' }`
- Props: `missiles` array with `{ id, fromPlayerId, toPlayerId }`
- Props: `onMissileImpact(missileId, targetId)` callback
- Renders `<Canvas>` with `<Physics>` wrapper
- Ground plane
- Towers spaced evenly along X axis — CPU players get towers identical to human players (same physics, same visuals)
- Camera auto-positions to frame all towers, tracking tallest
- Ambient + directional light for voxel shading
- CPU towers render with their CPU character avatar sprite

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add src/components/TowerClimb/
git commit -m "feat: add 3D Tower Climb scene — voxel towers, missiles, player sprites"
```

---

## Task 11: Tower Climb — Game Logic

**Files:**
- Create: `src/components/TowerClimb/TowerClimb.tsx`

- [ ] **Step 1: Create TowerClimb game mode component**

Create `src/components/TowerClimb/TowerClimb.tsx`:

This follows the same pattern as MathMarathon.tsx but with tower mechanics:

State:
- `towerBlocks: Map<PlayerId, number>` — authoritative block count per player
- `analytics: Map<PlayerId, PlayerAnalytics>` — per-player analytics (wobble tracked via `wrongWindowRecent5`)
- `missiles: { id, from, to }[]` — active missiles in flight
- `shakeIntensity: number` — current screen shake (0 = none, decays over time)

Wobble mechanic uses `analytics[pid].wrongWindowRecent5` (rolling window of 5 answers). Count wrong answers (`true` values) in the window:
- 2 wrong in last 5 → tower wobbles (visual + `towerCreak` sound)
- 3 wrong in last 5 → top block falls off, clear the window

Game loop:
1. Broadcast question to phones
2. On correct answer:
   - `towerBlocks[playerId]++`
   - Apply splash damage (micro-shake all opponents, `shakeIntensity += 0.15`)
   - If streak >= 3: fire missile at random opponent
     - **0-block check**: if target has 0 blocks, missile fizzles — play `missileFizzle` announcer line, "poof" particle, no retarget
     - Otherwise: `towerBlocks[targetId]--`, `shakeIntensity += 0.4`
   - **Simultaneous win check**: first answer received by host wins. Process answers sequentially in arrival order. Check win condition (blocks >= 10) immediately after incrementing — first player to hit 10 wins, remaining answers for that round are ignored.
3. On wrong answer:
   - Block crumble animation (no progress)
   - Track in `wrongWindowRecent5` (rolling window of 5)
   - If 2 wrong in window → wobble visual + screen shake 0.2s + `towerCreak` sound
   - If 3 wrong in window → top block falls off (`towerBlocks[playerId]--`), clear `wrongWindowRecent5`, screen shake 0.25s + `towerCollapse` sound
4. Track analytics via `recordAnalyticsAnswer()`, also `positionHistory.push(towerBlocks[pid])`
5. Use SpeechSynthesis announcer for tower-specific lines
6. On win: broadcast game over, transition to victory

Screen shakes (use existing `ScreenShake` component, trigger via state):
| Event | Intensity | Duration |
|---|---|---|
| Missile launched | 0.3 | 300ms |
| Tower wobbling (2 wrong) | 0.2 | 200ms |
| Block falls (3rd wrong) | 0.25 | 250ms |
| Splash damage | 0.15 | 150ms |
| Missile hit | 0.4 | 400ms |

CPU support:
- CPU player uses existing `useCPU` hook (same as Marathon/TugOfWar)
- CPU gets a visible tower in the 3D scene with their character avatar
- CPU can launch missiles at human player (on streak 3)
- CPU can be hit by missiles from human player
- CPU wobble/instability follows same rules

Rendering:
- Full-screen TowerScene with game state passed as props
- Question overlay at bottom (MathProblem component, same as other modes)
- Timer
- HUD showing block counts per player

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/TowerClimb/TowerClimb.tsx
git commit -m "feat: add Tower Climb game logic — blocks, missiles, wobble, win condition"
```

---

## Task 12: Wire Tower Climb into App

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/EventSelect/EventSelect.tsx`

- [ ] **Step 1: Add Tower Climb to EventSelect**

Add a third card in `EventSelect.tsx`:
```tsx
<button
  onClick={() => selectEvent('tower-climb')}
  className="pixel-card rounded-lg flex flex-col items-center gap-4 p-8 hover:scale-105 transition-all active:scale-95 w-64 group"
>
  {/* Tower SVG icon */}
  <svg width="100" height="100" viewBox="0 0 100 100">
    {/* Stacked voxel blocks */}
    <rect x="35" y="70" width="30" height="12" fill="#3b82f6" stroke="#2563eb" strokeWidth="1" rx="1" />
    <rect x="35" y="56" width="30" height="12" fill="#22c55e" stroke="#16a34a" strokeWidth="1" rx="1" />
    <rect x="35" y="42" width="30" height="12" fill="#f59e0b" stroke="#d97706" strokeWidth="1" rx="1" />
    <rect x="35" y="28" width="30" height="12" fill="#ef4444" stroke="#dc2626" strokeWidth="1" rx="1" />
    {/* Falling block above */}
    <rect x="37" y="10" width="26" height="10" fill="#a855f7" stroke="#9333ea" strokeWidth="1" rx="1" opacity="0.7" />
    {/* Motion lines */}
    <line x1="42" y1="22" x2="42" y2="18" stroke="white" strokeWidth="1" opacity="0.4" />
    <line x1="50" y1="22" x2="50" y2="16" stroke="white" strokeWidth="1" opacity="0.4" />
    <line x1="58" y1="22" x2="58" y2="18" stroke="white" strokeWidth="1" opacity="0.4" />
    {/* Explosion star */}
    <polygon points="82,40 84,36 88,38 86,34 90,32 86,30 88,26 84,28 82,24 80,28 76,26 78,30 74,32 78,34 76,38 80,36"
      fill="#f59e0b" opacity="0.8" />
  </svg>
  <span className="font-pixel text-xs text-white group-hover:text-cyan-300 transition-colors text-center leading-relaxed">
    TOWER<br />CLIMB
  </span>
  <span className="font-pixel text-[7px] text-white/50 text-center">Build fast, attack faster!</span>
</button>
```

Update `selectEvent` type to accept `'tower-climb'`.

- [ ] **Step 2: Add lazy-loaded Tower Climb route to App.tsx**

In `src/App.tsx`:
```typescript
import { Suspense, lazy } from 'react'
const TowerClimb = lazy(() => import('./components/TowerClimb/TowerClimb').then(m => ({ default: m.TowerClimb })))
```

In HostApp rendering:
```tsx
{phase === 'playing' && event === 'tower-climb' && (
  <Suspense fallback={
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="font-pixel text-white animate-pulse">Loading Tower Climb...</p>
    </div>
  }>
    <TowerClimb />
  </Suspense>
)}
```

- [ ] **Step 3: Add stats and leaderboards phases**

In HostApp rendering, add:
```tsx
{phase === 'stats' && <PostGameStats />}
{phase === 'leaderboards' && <Leaderboards />}
```

(Components will be created in later tasks)

- [ ] **Step 4: Verify dev server loads**

Run: `npm run dev`, navigate to event select, verify Tower Climb card appears.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/EventSelect/EventSelect.tsx
git commit -m "feat: wire Tower Climb into event select and app routing"
```

---

## Task 13: Integrate PlayerAnalytics into MathMarathon

**Files:**
- Modify: `src/components/MathMarathon/MathMarathon.tsx`

- [ ] **Step 1: Add analytics tracking**

In MathMarathon, add:
```typescript
import { createPlayerAnalytics, recordAnalyticsAnswer } from '../../utils/playerAnalytics'
import { gradeToStartingTier } from '../../utils/adaptiveDifficulty'

// Inside the component:
const { gradeLevel, adaptiveMode } = useSettings()
const analyticsRef = useRef<Map<PlayerId, PlayerAnalytics>>(new Map())

// Initialize analytics for each player
useEffect(() => {
  const tier = gradeToStartingTier(gradeLevel)
  for (const player of players) {
    if (!analyticsRef.current.has(player.id)) {
      analyticsRef.current.set(player.id, createPlayerAnalytics(tier))
    }
  }
}, [players, gradeLevel])
```

In `resolveRound`, after recording answer for each player, also update analytics:
```typescript
const responseTime = result.answer ? result.answer.timestamp - timerStartRef.current : timePerQuestion
analyticsRef.current.set(pid, recordAnalyticsAnswer(
  analyticsRef.current.get(pid)!,
  result.answer?.choiceIndex ?? -1,
  result.answer?.correct ?? false,
  responseTime,
  currentProblem.category,
))
```

- [ ] **Step 1b: Track position history**

After each round resolves, record each player's current position:
```typescript
for (const player of players) {
  const a = analyticsRef.current.get(player.id)
  if (a) {
    a.positionHistory = [...a.positionHistory, player.position]
    analyticsRef.current.set(player.id, a)
  }
}
```

- [ ] **Step 2: Store analytics for post-game access**

Create a shared module `src/utils/gameAnalyticsStore.ts`:
```typescript
import type { PlayerAnalytics, PlayerId, Superlative } from '../types'

let lastAnalytics: Map<PlayerId, PlayerAnalytics> | null = null
let lastPlayerNames: Map<PlayerId, string> | null = null

export function storeGameAnalytics(
  analytics: Map<PlayerId, PlayerAnalytics>,
  names: Map<PlayerId, string>,
) {
  lastAnalytics = analytics
  lastPlayerNames = names
}

export function getLastGameAnalytics() {
  return { analytics: lastAnalytics, playerNames: lastPlayerNames }
}

export function clearGameAnalytics() {
  lastAnalytics = null
  lastPlayerNames = null
}
```

At end of game (when winner is set):
```typescript
import { storeGameAnalytics } from '../../utils/gameAnalyticsStore'
storeGameAnalytics(analyticsRef.current, new Map(players.map(p => [p.id, p.name])))
```

On rematch, clear analytics:
```typescript
// In the rematch handler or when phase returns to event-select:
import { clearGameAnalytics } from '../../utils/gameAnalyticsStore'
clearGameAnalytics()
```

- [ ] **Step 3: Broadcast analytics to spectators**

Add spectator broadcast interval:
```typescript
const { broadcastSpectatorUpdate } = usePeerContext()

useEffect(() => {
  const interval = setInterval(() => {
    if (analyticsRef.current.size > 0) {
      broadcastSpectatorUpdate(Object.fromEntries(analyticsRef.current))
    }
  }, 3000)
  return () => clearInterval(interval)
}, [broadcastSpectatorUpdate])
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/components/MathMarathon/MathMarathon.tsx
git commit -m "feat: integrate PlayerAnalytics tracking into MathMarathon"
```

---

## Task 14: Integrate PlayerAnalytics into TugOfWar

**Files:**
- Modify: `src/components/TugOfWar/TugOfWar.tsx`

- [ ] **Step 1: Add same analytics tracking pattern as Marathon**

Same pattern as Task 13 — initialize analytics, record on each answer, broadcast to spectators, store on game end.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/TugOfWar/TugOfWar.tsx
git commit -m "feat: integrate PlayerAnalytics tracking into TugOfWar"
```

---

## Task 15: Post-Game Stats Screen

**Files:**
- Create: `src/components/PostGameStats/PostGameStats.tsx`
- Modify: `src/components/Victory/Victory.tsx`

- [ ] **Step 1: Create PostGameStats component**

Create `src/components/PostGameStats/PostGameStats.tsx`:
- Reads analytics from `getLastGameAnalytics()` (from `gameAnalyticsStore.ts`)
- Computes superlatives via `computeSuperlatives()`
- Renders player cards (avatar, name, accuracy, avg response time, streak, behavior tag, tier progression)
- Renders superlative awards below
- "Continue" button → `setPhase('trophies')`
- "Rematch" button → `rematch()`
- Pixel art styling consistent with Victory screen

- [ ] **Step 2: Update Victory to auto-advance to stats**

In `src/components/Victory/Victory.tsx`, add auto-advance:
```typescript
useEffect(() => {
  const timer = setTimeout(() => setPhase('stats'), 4000)
  return () => clearTimeout(timer)
}, [])
```

Also add a "Skip" button that goes directly to stats.

- [ ] **Step 3: Add PostGameStats to App.tsx routing**

```typescript
import { PostGameStats } from './components/PostGameStats/PostGameStats'
// In HostApp:
{phase === 'stats' && <PostGameStats />}
```

- [ ] **Step 4: Broadcast stats to phone players**

In PostGameStats, on mount:
```typescript
import { getLastGameAnalytics } from '../../utils/gameAnalyticsStore'
const { broadcastStats } = usePeerContext()
useEffect(() => {
  const { analytics } = getLastGameAnalytics()
  if (analytics) {
    for (const [pid, data] of analytics) {
      broadcastStats(pid, data, superlatives)
    }
  }
}, [])
```

- [ ] **Step 5: Verify it renders**

Run: `npm run dev`, play a quick Marathon, verify stats screen appears after victory.

- [ ] **Step 6: Commit**

```bash
git add src/components/PostGameStats/PostGameStats.tsx src/components/Victory/Victory.tsx src/App.tsx
git commit -m "feat: add post-game stats screen with player cards and superlatives"
```

---

## Task 16: Subject-Specific Leaderboards

**Files:**
- Create: `src/components/Leaderboards/Leaderboards.tsx`
- Modify: `src/components/Menu/Menu.tsx`

- [ ] **Step 1: Create Leaderboards component**

Create `src/components/Leaderboards/Leaderboards.tsx`:
- Reads all profiles via `getAllProfiles()`
- Three tabs: Math, Science, Reading
- Maps `QuestionCategory` to subjects using a lookup
- Per-subject leaderboard: rank by total correct, show accuracy %, best streak
- Per-category breakdown within the selected subject tab
- Back button → `setPhase('menu')`
- Same pixel art styling as TrophyShelf

- [ ] **Step 2: Add Leaderboards button to Menu**

In `src/components/Menu/Menu.tsx`, add a button:
```tsx
<button
  onClick={() => { preloadSounds(); setPhase('leaderboards') }}
  className="pixel-btn font-pixel py-3 px-6 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded-lg transition-colors"
>
  LEADERBOARDS
</button>
```

- [ ] **Step 3: Add to App.tsx routing**

```typescript
import { Leaderboards } from './components/Leaderboards/Leaderboards'
{phase === 'leaderboards' && <Leaderboards />}
```

- [ ] **Step 4: Verify it renders**

Run: `npm run dev`, click Leaderboards from menu, verify it shows profile data.

- [ ] **Step 5: Commit**

```bash
git add src/components/Leaderboards/Leaderboards.tsx src/components/Menu/Menu.tsx src/App.tsx
git commit -m "feat: add subject-specific leaderboards accessible from menu"
```

---

## Task 17: Spectator Dashboard (Phone)

**Files:**
- Create: `src/components/SpectatorDashboard/SpectatorDashboard.tsx`
- Modify: `src/components/PhoneController/PhoneController.tsx`

- [ ] **Step 1: Create SpectatorDashboard component**

Create `src/components/SpectatorDashboard/SpectatorDashboard.tsx`:
- Props: `analyticsData: Record<string, PlayerAnalytics>`, `playerInfo: { name, color }[]`
- Renders a scrollable list of player cards
- Each card shows: name, score, behavior tag with icon, rolling accuracy dots (green/red), avg response time, streak, adaptive tier
- Auto-updates every time new analytics data arrives (every 3s from host)
- Behavior tag icons as inline SVGs:
  - on-fire: flame icon
  - mashing: repeated button icon
  - guessing: dice icon
  - thinking: brain icon
  - struggling: concerned face
  - warming-up: arrow up icon

- [ ] **Step 2: Add spectator mode to PhoneController**

In `src/components/PhoneController/PhoneController.tsx`:
- Add "Play" / "Watch" toggle on the join screen (two pill buttons)
- If Watch is selected, `connect(roomId, name, 'spectator')`
- Show SpectatorDashboard instead of answer buttons
- Handle `spectatorInit` and `spectatorUpdate` messages
- Handle `statsUpdate` to show post-game stats view

- [ ] **Step 2b: Add spectator eye icon in PhoneLobby**

In `src/components/PhoneLobby/PhoneLobby.tsx`:
- When rendering remote players in the lobby list, spectators (received via separate spectator list from host) show an eye icon (inline SVG) instead of a colored dot
- Spectators listed below players with "Spectators" label

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/SpectatorDashboard/SpectatorDashboard.tsx src/components/PhoneController/PhoneController.tsx
git commit -m "feat: add spectator dashboard for phone viewers with live analytics"
```

---

## Task 18: Phone Stats View

**Files:**
- Modify: `src/components/PhoneController/PhoneController.tsx`
- Modify: `src/hooks/usePeerClient.ts`

- [ ] **Step 1: Add statsUpdate handling to usePeerClient**

In `usePeerClient.ts`, add state:
```typescript
const [personalStats, setPersonalStats] = useState<PlayerAnalytics | null>(null)
const [superlatives, setSuperlatives] = useState<Superlative[]>([])
```

Handle the message:
```typescript
} else if (data.type === 'statsUpdate') {
  setPersonalStats(data.personalStats)
  setSuperlatives(data.superlatives ?? [])
}
```

Return these in the hook's return value.

- [ ] **Step 2: Add stats view to PhoneController**

Between the gameOver screen and idle, show personal stats:
- Accuracy, avg response time, best streak
- Behavior breakdown
- Category accuracy breakdown
- Adaptive tier progression
- Tower-specific stats if applicable

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/PhoneController/PhoneController.tsx src/hooks/usePeerClient.ts
git commit -m "feat: add personal stats view for phone players after game"
```

---

## Task 19: Generate Sound Effects

**Files:**
- Create sound WAV files in `public/sounds/tower/`, `public/sounds/marathon/`, `public/sounds/tug/`

- [ ] **Step 1: Create sound effect directories**

```bash
mkdir -p public/sounds/tower public/sounds/marathon public/sounds/tug
```

- [ ] **Step 2: Generate sound effects using Web Audio**

Create `scripts/generate-tower-sounds.mjs` that generates the Tower Climb specific sounds using Web Audio synthesis (same approach as existing `generate-sounds.mjs`):
- `block-place.wav` — short low thud
- `block-crumble.wav` — crackle/shatter
- `tower-creak.wav` — creaking noise
- `tower-collapse.wav` — crash with debris
- `missile-launch.wav` — whoosh with ascending pitch
- `missile-hit.wav` — explosion
- `splash-hit.wav` — light impact
- `tower-complete.wav` — triumphant chime

Also generate Marathon and Tug sounds:
- `step.wav`, `finish-line.wav`
- `rope-pull.wav`, `super-pull.wav`, `rope-snap.wav`

- [ ] **Step 3: Run the generator**

```bash
node scripts/generate-tower-sounds.mjs
```

- [ ] **Step 4: Commit**

```bash
git add public/sounds/ scripts/generate-tower-sounds.mjs
git commit -m "feat: generate Tower Climb, Marathon, and Tug of War sound effects"
```

---

## Task 20: E2E Testing

**Files:**
- Create: `scripts/tower-climb-e2e.mjs`
- Modify: `scripts/full-e2e-test.mjs`

- [ ] **Step 1: Create Tower Climb E2E test**

Create `scripts/tower-climb-e2e.mjs` using Playwright (same pattern as existing E2E tests):
- Start game, select Tower Climb
- Verify 3D canvas renders (check for `<canvas>` element)
- Answer questions, verify block count increases
- Verify wrong answers don't add blocks
- Verify streak of 3 triggers missile (check for missile element or state)
- Verify win at 10 blocks transitions to victory

- [ ] **Step 2: Add Tower Climb assertions to full E2E test**

In `scripts/full-e2e-test.mjs`, add a test group for Tower Climb:
- Can navigate to Tower Climb from event select
- Canvas element is present
- Game state updates on correct/wrong answers

- [ ] **Step 3: Add stats screen assertions**

Test that stats screen appears after victory and shows player data.

- [ ] **Step 4: Run all E2E tests**

```bash
node scripts/full-e2e-test.mjs
```

Expected: All existing tests pass + new Tower Climb tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/tower-climb-e2e.mjs scripts/full-e2e-test.mjs
git commit -m "test: add E2E tests for Tower Climb, stats screen, and leaderboards"
```

---

## Task 21: Final Integration & Polish

**Files:**
- Multiple files — final wiring and cleanup

- [ ] **Step 1: Wire background music into game modes**

In each game mode component (MathMarathon, TugOfWar, TowerClimb), add:
```typescript
import { playMusic, stopMusic } from '../../utils/backgroundMusic'
const { musicEnabled } = useSettings()

useEffect(() => {
  if (musicEnabled) playMusic('marathon') // or 'tug-of-war' or 'tower-climb'
  return () => stopMusic()
}, [musicEnabled])
```

In Menu: `playMusic('menu')` on mount.
In Victory: `playMusic('victory')`.

- [ ] **Step 2: Wire adaptive difficulty into question generation**

In game modes, when `adaptiveMode === 'per-player'`, use `generateQuestionForTier()` with the player's current tier from analytics:
```typescript
import { adjustTier } from '../../utils/adaptiveDifficulty'

// After recording answer, check if tier should change:
const newTier = adjustTier(analytics.adaptiveTier, analytics.last10Correct)
if (newTier !== analytics.adaptiveTier) {
  analytics.adaptiveTier = newTier
  analytics.adaptiveHistory.push(newTier)
}
```

Note: In multiplayer, questions are shared (same question for all players), so adaptive difficulty adjusts the overall difficulty based on the average tier of all players. In Tower Climb (where everyone answers simultaneously), use the median player's tier for question generation.

- [ ] **Step 3: Set up music tracks**

```bash
mkdir -p public/music
cp "C:\Users\taskm\Downloads\Menu.mp3" public/music/menu.mp3
```

Other tracks (marathon.mp3, tug-of-war.mp3, tower-climb.mp3, victory.mp3) need to be generated via Suno using the prompts from the brainstorming session. The background music module gracefully handles missing files (silent fail on `.play()`), so the game works without them. Add placeholder silence files for now:

```bash
# Generate 1-second silent MP3 placeholders so the music module doesn't 404
for track in marathon tug-of-war tower-climb victory; do
  cp public/sounds/navigate.wav "public/music/${track}.mp3" 2>/dev/null || true
done
```

User will replace these with Suno-generated tracks. The Suno prompts are documented in the spec brainstorming session.

- [ ] **Step 4: Run full test suite**

```bash
npx tsc --noEmit
node scripts/full-e2e-test.mjs
```

Expected: All tests pass, no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: final integration — music, adaptive difficulty, polish"
```

---

## Task Summary

| Task | Description | Dependencies |
|------|-------------|-------------|
| 1 | Type system extensions | None |
| 2 | PlayerAnalytics module | Task 1 |
| 3 | Adaptive difficulty engine | Task 1 |
| 4 | Standards tagging | Task 1 |
| 5 | Announcer architecture refactor | Task 1 |
| 6 | Background music module | None |
| 7 | Spectator protocol (PeerJS) | Task 1, 2 |
| 8 | Settings UI updates | Task 3 |
| 9 | Install Three.js deps | None |
| 10 | Tower Climb 3D scene | Task 9 |
| 11 | Tower Climb game logic | Task 2, 5, 6, 10 |
| 12 | Wire Tower Climb into app | Task 11 |
| 13 | Analytics in MathMarathon | Task 2, 7 |
| 14 | Analytics in TugOfWar | Task 2, 7 |
| 15 | Post-game stats screen | Task 2, 13 |
| 16 | Subject-specific leaderboards | Task 1 |
| 17 | Spectator dashboard (phone) | Task 7, 2 |
| 18 | Phone stats view | Task 15, 7 |
| 19 | Sound effect generation | Task 6 |
| 20 | E2E testing | Task 12, 15, 16 |
| 21 | Final integration & polish | All |

**Execution order:**
1. **First:** Task 1 (types) + Task 6 (music module) + Task 9 (Three.js install) — these three have no dependencies and can run in parallel
2. **After Task 1:** Tasks 2, 3, 4, 5, 16 can run in parallel (all depend only on Task 1)
3. **After Task 1+2:** Task 7 (spectator protocol)
4. **After Task 3:** Task 8 (settings UI)
5. **After Task 9:** Task 10 (3D scene)
6. **After Tasks 2+5+6+10:** Task 11 (Tower Climb game logic)
7. **After Task 11:** Task 12 (wire into app)
8. **After Tasks 2+7:** Tasks 13, 14, 17 can run in parallel
9. **After Task 13:** Task 15 (post-game stats)
10. **After Tasks 15+7:** Task 18 (phone stats)
11. **After Task 6:** Task 19 (sound effects)
12. **After Tasks 12+15+16:** Task 20 (E2E tests)
13. **Last:** Task 21 (final integration)

**Design decision — adaptive difficulty in multiplayer:**
When all players see the same question (shared screen), adaptive difficulty uses the **median player's tier** for question generation. This is a pragmatic compromise since truly per-player questions would require each phone to show different questions (not supported in current architecture). The per-player tier still adjusts independently for stats/spectator display purposes. This is called out here as a known deviation from the spec's "per-player" framing — the spec's intent is that difficulty responds to player skill, which median-tier achieves for the group.
