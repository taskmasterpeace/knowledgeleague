# Phase 1: Math Muscle Polish — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Polish the local Math Muscle game with fixed controls, new scoring, pacing, settings, controller support, AI avatars, persistence, and 4-player scaling.

**Architecture:** Zustand store manages all game state. React components render screens based on `phase`. Input hooks (keyboard, gamepad, CPU) feed answer callbacks into game mode components. New settings stored in localStorage via a `useSettings` hook. Scoring changes from percentage-based to spaces-based for Marathon.

**Tech Stack:** React 19, TypeScript, Vite 7, Tailwind CSS 4, Zustand 5, Vitest, Replicate API (retro-diffusion model)

---

### Task 1: Fix Key Mapping — Both Players Use 1-2-3-4

**Files:**
- Modify: `src/utils/constants.ts:36-37`
- Modify: `src/hooks/useKeyboardInput.ts`
- Modify: `src/components/MathMarathon/MathMarathon.tsx:144-145`
- Modify: `src/components/TugOfWar/TugOfWar.tsx:169-170`
- Modify: `src/components/Menu/Menu.tsx:44`

**Step 1: Update constants — remove P2_KEYS, add code-based mapping**

Replace the key mapping constants in `src/utils/constants.ts`:

```ts
// Keyboard mapping — both players press 1-2-3-4
// P1 uses number row (Digit1-Digit4), P2 uses numpad (Numpad1-Numpad4)
export const P1_CODES: Record<string, number> = { 'Digit1': 0, 'Digit2': 1, 'Digit3': 2, 'Digit4': 3 }
export const P2_CODES: Record<string, number> = { 'Numpad1': 0, 'Numpad2': 1, 'Numpad3': 2, 'Numpad4': 3 }
```

Remove the old `P1_KEYS` and `P2_KEYS` exports.

**Step 2: Rewrite useKeyboardInput to use `e.code` instead of `e.key`**

Replace `src/hooks/useKeyboardInput.ts`:

```ts
import { useEffect, useCallback } from 'react'
import { P1_CODES, P2_CODES } from '../utils/constants'

interface UseKeyboardInputProps {
  onP1Answer: (choiceIndex: number) => void
  onP2Answer: (choiceIndex: number) => void
  enabled: boolean
}

export function useKeyboardInput({ onP1Answer, onP2Answer, enabled }: UseKeyboardInputProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return
    const code = e.code
    if (code in P1_CODES) {
      e.preventDefault()
      onP1Answer(P1_CODES[code])
    } else if (code in P2_CODES) {
      e.preventDefault()
      onP2Answer(P2_CODES[code])
    }
  }, [onP1Answer, onP2Answer, enabled])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
```

**Step 3: Update p2Keys props in both game modes**

In `src/components/MathMarathon/MathMarathon.tsx`, change:
```ts
p2Keys={['7', '8', '9', '0']}
```
to:
```ts
p2Keys={['1', '2', '3', '4']}
```

Same change in `src/components/TugOfWar/TugOfWar.tsx`.

**Step 4: Update Menu screen hint text**

In `src/components/Menu/Menu.tsx`, change:
```
P1: Keys 1-2-3-4 &nbsp;&nbsp; P2: Keys 7-8-9-0
```
to:
```
P1: Number Row 1-2-3-4 &nbsp;&nbsp; P2: Numpad 1-2-3-4
```

**Step 5: Verify build compiles**

Run: `cd /d/git/BrainGames && npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add -A && git commit -m "fix: both players use 1-2-3-4 keys, distinguished by e.code"
```

---

### Task 2: New Scoring System — Spaces-Based Marathon

**Files:**
- Modify: `src/utils/constants.ts`
- Modify: `src/types.ts:18` (position comment)
- Modify: `src/components/MathMarathon/MathMarathon.tsx` (major rewrite)
- Modify: `src/components/shared/ScoreBar.tsx`

**Step 1: Update Marathon constants**

In `src/utils/constants.ts`, replace the Marathon distance constants:

```ts
// Marathon — spaces-based scoring
export const MARATHON_TRACK_LENGTH = 20           // spaces to win
export const MARATHON_FIRST_CORRECT = 3           // spaces for first correct answer
export const MARATHON_SECOND_CORRECT = 2          // spaces for second correct (but not first)
export const MARATHON_WRONG_ANSWER = 1            // spaces for wrong answer (encouragement)
export const MARATHON_NO_ANSWER = 0               // spaces for not answering
```

Remove `MARATHON_CORRECT_BASE`, `MARATHON_CORRECT_MAX`, `MARATHON_WRONG_PENALTY`, `MARATHON_WIN_THRESHOLD`.

Also remove `LOCKOUT_DURATION`, `MASH_LOCKOUT_DURATION`, `MASH_WINDOW`, `CONFIDENCE_BONUS_THRESHOLD` — the new system doesn't use lockouts or mash detection (both players answer independently per question).

**Step 2: Update ScoreBar to show spaces instead of percentage**

Replace `src/components/shared/ScoreBar.tsx`:

```tsx
interface Props {
  position: number    // 0 to trackLength
  trackLength: number
  color: string
  label: string
}

export function ScoreBar({ position, trackLength, color, label }: Props) {
  const pct = Math.max(0, Math.min(100, (position / trackLength) * 100))
  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-white font-bold text-sm w-24 truncate">{label}</span>
      <div className="flex-1 h-6 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-white font-bold text-sm w-16 text-right">{Math.round(position)}/{trackLength}</span>
    </div>
  )
}
```

**Step 3: Rewrite MathMarathon with new scoring logic**

Replace `src/components/MathMarathon/MathMarathon.tsx` with the new system where:
- Both players answer independently within the timer
- After both answer (or timer expires), show results for 2 seconds, then next question
- First correct = 3 spaces, second correct = 2, wrong = 1, no answer = 0
- Track is 20 spaces, first to reach 20 wins

```tsx
import { useCallback, useState, useRef, useEffect } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { useMathEngine } from '../../hooks/useMathEngine'
import { useKeyboardInput } from '../../hooks/useKeyboardInput'
import { useGamepad } from '../../hooks/useGamepad'
import { useCPU } from '../../hooks/useCPU'
import { MathProblem } from '../shared/MathProblem'
import { Timer } from '../shared/Timer'
import { ScoreBar } from '../shared/ScoreBar'
import { PlayerAvatar } from '../shared/PlayerAvatar'
import { ControllerHint } from '../shared/ControllerButtons'
import {
  MARATHON_TRACK_LENGTH, MARATHON_FIRST_CORRECT,
  MARATHON_SECOND_CORRECT, MARATHON_WRONG_ANSWER,
  PROBLEM_TIME_LIMIT,
} from '../../utils/constants'

type RoundAnswer = { choiceIndex: number; correct: boolean; timestamp: number } | null

interface RoundResult {
  p1: RoundAnswer
  p2: RoundAnswer
  p1Spaces: number
  p2Spaces: number
  correctAnswer: number
  question: string
}

export function MathMarathon() {
  const {
    players, updatePosition, incrementStreak, resetStreak,
    incrementScore, setWinner, cpuCharacter,
    controllerType, setControllerType,
  } = useGameState()
  const { currentProblem, nextProblem, problemCount } = useMathEngine()
  const [timerKey, setTimerKey] = useState(0)
  const [showingResult, setShowingResult] = useState(false)
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null)

  const answersRef = useRef<{ p1: RoundAnswer; p2: RoundAnswer }>({ p1: null, p2: null })
  const roundResolvedRef = useRef(false)

  const resolveRound = useCallback(() => {
    if (roundResolvedRef.current) return
    roundResolvedRef.current = true

    const { p1, p2 } = answersRef.current

    // Determine spaces earned
    let p1Spaces = MARATHON_NO_ANSWER
    let p2Spaces = MARATHON_NO_ANSWER

    const p1Correct = p1?.correct ?? false
    const p2Correct = p2?.correct ?? false

    if (p1Correct && p2Correct) {
      // Both correct — whoever was first gets 3, other gets 2
      if ((p1!.timestamp) <= (p2!.timestamp)) {
        p1Spaces = MARATHON_FIRST_CORRECT
        p2Spaces = MARATHON_SECOND_CORRECT
      } else {
        p1Spaces = MARATHON_SECOND_CORRECT
        p2Spaces = MARATHON_FIRST_CORRECT
      }
    } else if (p1Correct) {
      p1Spaces = MARATHON_FIRST_CORRECT
      p2Spaces = p2 ? MARATHON_WRONG_ANSWER : MARATHON_NO_ANSWER
    } else if (p2Correct) {
      p2Spaces = MARATHON_FIRST_CORRECT
      p1Spaces = p1 ? MARATHON_WRONG_ANSWER : MARATHON_NO_ANSWER
    } else {
      // Neither correct
      p1Spaces = p1 ? MARATHON_WRONG_ANSWER : MARATHON_NO_ANSWER
      p2Spaces = p2 ? MARATHON_WRONG_ANSWER : MARATHON_NO_ANSWER
    }

    // Apply position updates
    if (p1Spaces > 0) updatePosition(1, p1Spaces)
    if (p2Spaces > 0) updatePosition(2, p2Spaces)

    // Update streaks and scores
    if (p1Correct) { incrementStreak(1); incrementScore(1) } else { resetStreak(1) }
    if (p2Correct) { incrementStreak(2); incrementScore(2) } else { resetStreak(2) }

    // Check for winner
    const p1NewPos = players[0].position + p1Spaces
    const p2NewPos = players[1].position + p2Spaces
    if (p1NewPos >= MARATHON_TRACK_LENGTH || p2NewPos >= MARATHON_TRACK_LENGTH) {
      if (p1NewPos >= MARATHON_TRACK_LENGTH && p2NewPos >= MARATHON_TRACK_LENGTH) {
        // Both cross — whoever has more spaces wins, tie goes to first answerer
        setWinner(p1NewPos >= p2NewPos ? 1 : 2)
      } else {
        setWinner(p1NewPos >= MARATHON_TRACK_LENGTH ? 1 : 2)
      }
      return
    }

    // Show result interstitial
    setRoundResult({
      p1, p2, p1Spaces, p2Spaces,
      correctAnswer: currentProblem.correctAnswer,
      question: currentProblem.question,
    })
    setShowingResult(true)

    setTimeout(() => {
      setShowingResult(false)
      setRoundResult(null)
      answersRef.current = { p1: null, p2: null }
      roundResolvedRef.current = false
      nextProblem()
      setTimerKey(k => k + 1)
    }, 2000)
  }, [players, currentProblem, updatePosition, incrementStreak, resetStreak, incrementScore, setWinner, nextProblem])

  const handleAnswer = useCallback((playerId: 1 | 2, choiceIndex: number) => {
    if (showingResult) return
    const key = playerId === 1 ? 'p1' : 'p2'
    if (answersRef.current[key] !== null) return // already answered

    const isCorrect = currentProblem.choices[choiceIndex] === currentProblem.correctAnswer

    answersRef.current[key] = { choiceIndex, correct: isCorrect, timestamp: Date.now() }

    // If both have answered, resolve immediately
    if (answersRef.current.p1 !== null && answersRef.current.p2 !== null) {
      resolveRound()
    }
  }, [currentProblem, showingResult, resolveRound])

  const handleP1Answer = useCallback((i: number) => handleAnswer(1, i), [handleAnswer])
  const handleP2Answer = useCallback((i: number) => handleAnswer(2, i), [handleAnswer])

  useKeyboardInput({
    onP1Answer: handleP1Answer,
    onP2Answer: players[1].type === 'cpu' ? () => {} : handleP2Answer,
    enabled: !showingResult,
  })

  useGamepad({
    onP1Answer: handleP1Answer,
    onP2Answer: players[1].type === 'cpu' ? () => {} : handleP2Answer,
    enabled: !showingResult,
    onControllerChange: setControllerType,
  })

  useCPU({
    character: cpuCharacter,
    currentProblem,
    enabled: players[1].type === 'cpu' && !showingResult,
    onAnswer: handleP2Answer,
    streak: players[1].streak,
  })

  const handleTimeUp = useCallback(() => {
    resolveRound()
  }, [resolveRound])

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-blue-600 flex flex-col p-6 gap-6">
      {/* Progress bars */}
      <div className="flex flex-col gap-2">
        <ScoreBar position={players[0].position} trackLength={MARATHON_TRACK_LENGTH} color={players[0].color} label={players[0].name} />
        <ScoreBar position={players[1].position} trackLength={MARATHON_TRACK_LENGTH} color={players[1].color} label={players[1].name} />
      </div>

      {/* Track visualization */}
      <div className="relative h-32 bg-white/10 rounded-2xl border-2 border-white/20 overflow-hidden">
        <div className="absolute top-0 bottom-0 right-4 w-1 bg-yellow-400/50" />
        {players.map((player, i) => (
          <div
            key={player.id}
            className="absolute transition-all duration-300"
            style={{
              left: `${Math.min(95, (player.position / MARATHON_TRACK_LENGTH) * 100)}%`,
              top: i === 0 ? '10%' : '50%',
            }}
          >
            <PlayerAvatar
              name={player.name}
              color={player.color}
              size={40}
              avatarUrl={player.avatarUrl}
            />
          </div>
        ))}
      </div>

      {/* Timer */}
      {!showingResult && <Timer onTimeUp={handleTimeUp} resetKey={timerKey} />}

      {/* Problem or Results */}
      <div className="flex-1 flex items-center justify-center">
        {showingResult && roundResult ? (
          <div className="flex flex-col items-center gap-6 bg-white/10 backdrop-blur rounded-2xl p-8 border-2 border-white/20 w-full max-w-2xl">
            <div className="text-3xl font-bold text-white">
              {roundResult.question} = <span className="text-green-300">{roundResult.correctAnswer}</span>
            </div>
            <div className="flex gap-12">
              {[
                { player: players[0], answer: roundResult.p1, spaces: roundResult.p1Spaces },
                { player: players[1], answer: roundResult.p2, spaces: roundResult.p2Spaces },
              ].map(({ player, answer, spaces }) => (
                <div key={player.id} className="flex flex-col items-center gap-2">
                  <PlayerAvatar name={player.name} color={player.color} size={50} avatarUrl={player.avatarUrl} />
                  <div className={`text-2xl font-bold ${answer?.correct ? 'text-green-300' : answer ? 'text-red-300' : 'text-white/40'}`}>
                    {answer?.correct ? 'Correct!' : answer ? 'Wrong' : 'No answer'}
                  </div>
                  <div className="text-yellow-300 text-xl font-bold">+{spaces} spaces</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <MathProblem
            problem={currentProblem}
            onAnswer={() => {}}
            lockedP1={answersRef.current.p1 !== null}
            lockedP2={answersRef.current.p2 !== null}
            p1Keys={['1', '2', '3', '4']}
            p2Keys={['1', '2', '3', '4']}
            controllerType={controllerType}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center">
        <div className="text-white/40 text-sm">Problem #{problemCount}</div>
        <ControllerHint controllerType={controllerType} />
      </div>
    </div>
  )
}
```

**Step 4: Remove unused imports from constants**

Any file that imported `MARATHON_CORRECT_BASE`, `MARATHON_CORRECT_MAX`, `MARATHON_WRONG_PENALTY`, `MARATHON_WIN_THRESHOLD`, `LOCKOUT_DURATION`, `MASH_LOCKOUT_DURATION`, `MASH_WINDOW`, `CONFIDENCE_BONUS_THRESHOLD` needs updating. Only `MathMarathon.tsx` imported these — already handled above.

Keep `PROBLEM_TIME_LIMIT` and `URGENT_THRESHOLD` (used by Timer).

**Step 5: Verify build**

Run: `cd /d/git/BrainGames && npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: spaces-based scoring system with results interstitial"
```

---

### Task 3: Update Tug-of-War to Use New Key Labels

**Files:**
- Modify: `src/components/TugOfWar/TugOfWar.tsx:169-170`

**Step 1: Fix p2Keys**

Already noted in Task 1 Step 3. If not done there, change `p2Keys={['7', '8', '9', '0']}` to `p2Keys={['1', '2', '3', '4']}` in `TugOfWar.tsx`.

**Step 2: Remove lockout-related imports if any**

TugOfWar doesn't import lockout constants — no changes needed.

**Step 3: Commit** (if not already committed with Task 1)

```bash
git add -A && git commit -m "fix: tug-of-war uses correct key labels"
```

---

### Task 4: Settings Menu

**Files:**
- Create: `src/hooks/useSettings.ts`
- Create: `src/components/Settings/Settings.tsx`
- Modify: `src/components/Menu/Menu.tsx` (add gear button)
- Modify: `src/utils/constants.ts` (make values configurable)
- Modify: `src/hooks/useMathEngine.ts` (use settings for difficulty)
- Modify: `src/components/shared/Timer.tsx` (use settings for time limit)

**Step 1: Create useSettings hook with localStorage persistence**

Create `src/hooks/useSettings.ts`:

```ts
import { create } from 'zustand'

export interface Settings {
  difficulty: 'easy' | 'medium' | 'hard' | 'adaptive'
  timePerQuestion: number  // milliseconds
  trackLength: number      // spaces
  soundEnabled: boolean
  musicEnabled: boolean
  vibrationEnabled: boolean
}

const STORAGE_KEY = 'mathMuscle:settings'

const defaults: Settings = {
  difficulty: 'adaptive',
  timePerQuestion: 10_000,
  trackLength: 20,
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
}

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return { ...defaults, ...JSON.parse(stored) }
  } catch {}
  return defaults
}

interface SettingsStore extends Settings {
  update: (patch: Partial<Settings>) => void
  reset: () => void
}

export const useSettings = create<SettingsStore>((set) => ({
  ...loadSettings(),

  update: (patch) => set((s) => {
    const next = { ...s, ...patch }
    const { update: _, reset: __, ...data } = next
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return patch
  }),

  reset: () => {
    localStorage.removeItem(STORAGE_KEY)
    set(defaults)
  },
}))
```

**Step 2: Create Settings component**

Create `src/components/Settings/Settings.tsx`:

```tsx
import { useSettings } from '../../hooks/useSettings'

interface Props {
  onClose: () => void
}

const TIME_OPTIONS = [
  { label: '10s', value: 10_000 },
  { label: '15s', value: 15_000 },
  { label: '20s', value: 20_000 },
  { label: '30s', value: 30_000 },
]

const TRACK_OPTIONS = [10, 15, 20, 30]

const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard', 'adaptive'] as const

export function Settings({ onClose }: Props) {
  const settings = useSettings()

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gradient-to-b from-indigo-700 to-purple-900 rounded-2xl p-8 border-2 border-white/20 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-black text-white mb-6 text-center">SETTINGS</h2>

        <div className="flex flex-col gap-5">
          {/* Difficulty */}
          <div>
            <label className="text-white/70 text-sm font-bold uppercase tracking-wide">Difficulty</label>
            <div className="flex gap-2 mt-1">
              {DIFFICULTY_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => settings.update({ difficulty: d })}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                    settings.difficulty === d
                      ? 'bg-yellow-400 text-gray-900'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Time per question */}
          <div>
            <label className="text-white/70 text-sm font-bold uppercase tracking-wide">Time per Question</label>
            <div className="flex gap-2 mt-1">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => settings.update({ timePerQuestion: t.value })}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    settings.timePerQuestion === t.value
                      ? 'bg-yellow-400 text-gray-900'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Track length */}
          <div>
            <label className="text-white/70 text-sm font-bold uppercase tracking-wide">Track Length</label>
            <div className="flex gap-2 mt-1">
              {TRACK_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => settings.update({ trackLength: n })}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    settings.trackLength === n
                      ? 'bg-yellow-400 text-gray-900'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          {[
            { key: 'soundEnabled' as const, label: 'Sound Effects' },
            { key: 'musicEnabled' as const, label: 'Music' },
            { key: 'vibrationEnabled' as const, label: 'Controller Vibration' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-white/70 text-sm font-bold uppercase tracking-wide">{label}</span>
              <button
                onClick={() => settings.update({ [key]: !settings[key] })}
                className={`w-14 h-7 rounded-full transition-all relative ${
                  settings[key] ? 'bg-green-400' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${
                    settings[key] ? 'left-7' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-white/20 hover:bg-white/30 text-white text-xl font-bold rounded-xl transition-all"
        >
          DONE
        </button>
      </div>
    </div>
  )
}
```

**Step 3: Add gear button to Menu**

In `src/components/Menu/Menu.tsx`, add a settings button and import/render Settings component:

```tsx
import { useState } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { useGamepad } from '../../hooks/useGamepad'
import { ControllerHint } from '../shared/ControllerButtons'
import { Settings } from '../Settings/Settings'

export function Menu() {
  const { setPhase, startSinglePlayer, controllerType, setControllerType } = useGameState()
  const [showSettings, setShowSettings] = useState(false)

  useGamepad({
    onP1Answer: () => {},
    onP2Answer: () => {},
    enabled: false,
    onControllerChange: setControllerType,
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-purple-800 flex flex-col items-center justify-center gap-12 p-8 relative">
      {/* Settings gear */}
      <button
        onClick={() => setShowSettings(true)}
        className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>

      <div className="text-center">
        <h1 className="text-8xl font-black text-white tracking-tighter drop-shadow-lg">
          MATH MUSCLE
        </h1>
        <p className="text-2xl text-white/70 mt-4 font-medium">Kids Edition</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-md">
        <button
          onClick={() => {
            startSinglePlayer()
            setPhase('cpu-select')
          }}
          className="w-full py-6 bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-3xl font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          1 PLAYER
        </button>
        <button
          onClick={() => setPhase('avatar-select')}
          className="w-full py-6 bg-green-400 hover:bg-green-300 text-gray-900 text-3xl font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          2 PLAYERS
        </button>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="text-white/40 text-sm">
          P1: Number Row 1-2-3-4 &nbsp;&nbsp; P2: Numpad 1-2-3-4
        </div>
        <ControllerHint controllerType={controllerType} />
      </div>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  )
}
```

**Step 4: Wire settings into Timer**

Modify `src/components/shared/Timer.tsx` to accept `timeLimit` prop:

```tsx
import { useEffect, useState, useRef } from 'react'

interface Props {
  onTimeUp: () => void
  resetKey: number
  timeLimit: number
}

export function Timer({ onTimeUp, resetKey, timeLimit }: Props) {
  const [remaining, setRemaining] = useState(timeLimit)
  const startRef = useRef(Date.now())

  useEffect(() => {
    startRef.current = Date.now()
    setRemaining(timeLimit)
  }, [resetKey, timeLimit])

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const left = Math.max(0, timeLimit - elapsed)
      setRemaining(left)
      if (left <= 0) {
        clearInterval(interval)
        onTimeUp()
      }
    }, 50)
    return () => clearInterval(interval)
  }, [onTimeUp, resetKey, timeLimit])

  const pct = (remaining / timeLimit) * 100
  const urgent = remaining <= 3000

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="h-4 bg-white/20 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-100 ${urgent ? 'bg-red-500 animate-pulse' : 'bg-green-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
```

**Step 5: Update Timer usage in both game modes**

In `MathMarathon.tsx` and `TugOfWar.tsx`, import `useSettings` and pass `timeLimit`:

```tsx
import { useSettings } from '../../hooks/useSettings'
// ...
const { timePerQuestion } = useSettings()
// ...
<Timer onTimeUp={handleTimeUp} resetKey={timerKey} timeLimit={timePerQuestion} />
```

Also in `MathMarathon.tsx`, use `useSettings().trackLength` instead of `MARATHON_TRACK_LENGTH`:

```tsx
const { timePerQuestion, trackLength } = useSettings()
// Replace all MARATHON_TRACK_LENGTH references with trackLength
```

**Step 6: Wire settings difficulty into useMathEngine**

Modify `src/hooks/useMathEngine.ts` to accept an optional difficulty override:

```ts
import { useState, useCallback } from 'react'
import { generateProblem, getDifficulty } from '../utils/mathProblems'
import type { MathProblem, Difficulty } from '../types'

export function useMathEngine(fixedDifficulty?: Difficulty) {
  const [problemCount, setProblemCount] = useState(1)
  const [currentProblem, setCurrentProblem] = useState<MathProblem>(() =>
    generateProblem(fixedDifficulty ?? getDifficulty(1))
  )

  const nextProblem = useCallback(() => {
    const next = problemCount + 1
    setProblemCount(next)
    setCurrentProblem(generateProblem(fixedDifficulty ?? getDifficulty(next)))
  }, [problemCount, fixedDifficulty])

  const reset = useCallback(() => {
    setProblemCount(1)
    setCurrentProblem(generateProblem(fixedDifficulty ?? getDifficulty(1)))
  }, [fixedDifficulty])

  return { currentProblem, problemCount, nextProblem, reset }
}
```

Then in game modes, use it:

```tsx
const { difficulty } = useSettings()
const { currentProblem, nextProblem, problemCount } = useMathEngine(
  difficulty === 'adaptive' ? undefined : difficulty
)
```

**Step 7: Remove PROBLEM_TIME_LIMIT and URGENT_THRESHOLD from constants**

These are now settings-driven. Remove from `constants.ts`. Remove the import from Timer.tsx (already done in Step 4).

**Step 8: Verify build**

Run: `cd /d/git/BrainGames && npx tsc --noEmit`

**Step 9: Commit**

```bash
git add -A && git commit -m "feat: settings menu with difficulty, timer, track length, and toggles"
```

---

### Task 5: PlayStation Controller Polish

**Files:**
- Modify: `src/hooks/useGamepad.ts`

**Step 1: Add DualSense/DualShock product IDs and Start button handling**

In `src/hooks/useGamepad.ts`, update `detectControllerType`:

```ts
function detectControllerType(gamepad: Gamepad): ControllerType {
  const id = gamepad.id.toLowerCase()
  if (id.includes('dualsense') || id.includes('dualshock') || id.includes('054c') ||
      id.includes('playstation') || id.includes('sony') ||
      id.includes('054c:0ce6') || id.includes('054c:09cc')) {
    return 'playstation'
  }
  if (id.includes('xbox') || id.includes('xinput') || id.includes('045e') || id.includes('microsoft')) {
    return 'xbox'
  }
  return 'generic'
}
```

Add Start button (index 9) to trigger a callback, and add haptic feedback support:

Add to `UseGamepadProps`:
```ts
onPause?: () => void
vibrationEnabled?: boolean
```

Add Start button detection in the poll loop (after face button checks):
```ts
// Start/Options button (index 9) → pause
if (gp.buttons[9]?.pressed && !(prev[9] || false)) {
  if (onPauseRef.current) onPauseRef.current()
}
```

Add a vibration helper export:
```ts
export function vibrateController(durationMs = 200, intensity = 0.5) {
  const gamepads = navigator.getGamepads()
  for (const gp of gamepads) {
    if (!gp?.vibrationActuator) continue
    gp.vibrationActuator.playEffect('dual-rumble', {
      duration: durationMs,
      strongMagnitude: intensity,
      weakMagnitude: intensity * 0.5,
    }).catch(() => {})
  }
}
```

**Step 2: Verify build**

Run: `cd /d/git/BrainGames && npx tsc --noEmit`

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: PlayStation controller polish with Start button and haptic feedback"
```

---

### Task 6: Generate CPU Character Avatars

**Files:**
- Create: `src/utils/cpuAvatars.ts`
- Modify: `src/components/CPUSelect/CPUSelect.tsx` (show generated avatars)
- Modify: `src/types.ts` (add avatarUrl to CPUCharacter)

**Step 1: Add avatarUrl to CPUCharacter type**

In `src/types.ts`, add to `CPUCharacter`:
```ts
export interface CPUCharacter {
  name: string
  speedRange: [number, number]
  accuracy: number
  tagline: string
  color: string
  avatarUrl?: string | null
}
```

**Step 2: Create cpuAvatars utility**

Create `src/utils/cpuAvatars.ts`:

```ts
import { generateAvatar } from './replicate'
import { CPU_CHARACTERS } from './constants'

const STORAGE_KEY = 'mathMuscle:cpuAvatars'

const CPU_PROMPTS: Record<string, string> = {
  Kevin: 'A boy with red spiky hair, competitive, wearing a red jersey, pixel art character',
  Sally: 'A girl with purple braids, calm and focused, wearing a purple dress, pixel art character',
  Benny: 'A younger boy with messy green hair, friendly smile, wearing a green t-shirt, pixel art character',
  Mia: 'A girl with wild orange curly hair, mischievous grin, wearing an orange hoodie, pixel art character',
}

interface CachedAvatars {
  [name: string]: string // name → URL
}

export function getCachedCPUAvatars(): CachedAvatars {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return {}
}

export async function generateCPUAvatar(name: string): Promise<string> {
  const prompt = CPU_PROMPTS[name]
  if (!prompt) throw new Error(`No prompt for CPU character: ${name}`)

  const url = await generateAvatar({ prompt })

  // Cache it
  const cached = getCachedCPUAvatars()
  cached[name] = url
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cached))

  return url
}

export async function generateAllCPUAvatars(
  onProgress?: (name: string, url: string) => void
): Promise<CachedAvatars> {
  const cached = getCachedCPUAvatars()
  const results = { ...cached }

  for (const cpu of CPU_CHARACTERS) {
    if (results[cpu.name]) continue // already cached
    try {
      const url = await generateCPUAvatar(cpu.name)
      results[cpu.name] = url
      onProgress?.(cpu.name, url)
    } catch (err) {
      console.error(`Failed to generate avatar for ${cpu.name}:`, err)
    }
  }

  return results
}
```

**Step 3: Update CPUSelect to show avatars and offer generation**

Replace `src/components/CPUSelect/CPUSelect.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { CPU_CHARACTERS } from '../../utils/constants'
import { PlayerAvatar } from '../shared/PlayerAvatar'
import { getCachedCPUAvatars, generateCPUAvatar } from '../../utils/cpuAvatars'

export function CPUSelect() {
  const { setCPUCharacter, setPhase, setPlayerAvatar } = useGameState()
  const [avatars, setAvatars] = useState<Record<string, string>>(() => getCachedCPUAvatars())
  const [generating, setGenerating] = useState<string | null>(null)

  const handleSelect = (cpu: typeof CPU_CHARACTERS[0]) => {
    setCPUCharacter(cpu)
    if (avatars[cpu.name]) {
      setPlayerAvatar(2, avatars[cpu.name])
    }
    setPhase('avatar-select')
  }

  const handleGenerate = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setGenerating(name)
    try {
      const url = await generateCPUAvatar(name)
      setAvatars(prev => ({ ...prev, [name]: url }))
    } catch (err) {
      console.error('Failed to generate avatar:', err)
    }
    setGenerating(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-700 flex flex-col items-center justify-center gap-8 p-8">
      <h2 className="text-5xl font-black text-white tracking-tight">PICK YOUR OPPONENT</h2>

      <div className="grid grid-cols-2 gap-6 max-w-2xl w-full">
        {CPU_CHARACTERS.map((cpu) => (
          <button
            key={cpu.name}
            onClick={() => handleSelect(cpu)}
            className="flex flex-col items-center gap-3 p-6 bg-white/15 backdrop-blur rounded-2xl border-2 border-white/20 hover:bg-white/25 hover:scale-105 transition-all active:scale-95"
          >
            {avatars[cpu.name] ? (
              <img
                src={avatars[cpu.name]}
                alt={cpu.name}
                className="w-16 h-16 rounded-lg border-2"
                style={{ imageRendering: 'pixelated', borderColor: cpu.color }}
              />
            ) : (
              <PlayerAvatar name={cpu.name} color={cpu.color} size={60} />
            )}
            <span className="text-white text-xl font-bold">{cpu.name}</span>
            <span className="text-white/80 text-lg font-medium">{cpu.tagline}</span>
            <div className="flex gap-4 text-sm text-white/50">
              <span>Speed: {cpu.speedRange[0]}-{cpu.speedRange[1]}s</span>
              <span>Accuracy: {Math.round(cpu.accuracy * 100)}%</span>
            </div>
            {!avatars[cpu.name] && (
              <button
                onClick={(e) => handleGenerate(cpu.name, e)}
                disabled={generating !== null}
                className="mt-1 px-3 py-1 bg-purple-500 hover:bg-purple-400 disabled:bg-gray-500/50 text-white text-xs font-bold rounded-lg transition-all"
              >
                {generating === cpu.name ? 'Generating...' : 'Generate Avatar'}
              </button>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
```

**Step 4: Verify build**

Run: `cd /d/git/BrainGames && npx tsc --noEmit`

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: generate AI avatars for CPU characters via Replicate"
```

---

### Task 7: Character Persistence

**Files:**
- Create: `src/utils/playerStorage.ts`
- Modify: `src/components/AvatarSelect/AvatarSelect.tsx`

**Step 1: Create playerStorage utility**

Create `src/utils/playerStorage.ts`:

```ts
interface SavedPlayer {
  name: string
  color: string
  avatarUrl: string | null
  description: string
}

const KEY_PREFIX = 'mathMuscle:player'

export function savePlayer(id: 1 | 2, data: SavedPlayer): void {
  localStorage.setItem(`${KEY_PREFIX}${id}`, JSON.stringify(data))
}

export function loadPlayer(id: 1 | 2): SavedPlayer | null {
  try {
    const stored = localStorage.getItem(`${KEY_PREFIX}${id}`)
    if (stored) return JSON.parse(stored)
  } catch {}
  return null
}

export function clearPlayer(id: 1 | 2): void {
  localStorage.removeItem(`${KEY_PREFIX}${id}`)
}
```

**Step 2: Update AvatarSelect to load/save profiles**

In `src/components/AvatarSelect/AvatarSelect.tsx`, after the existing imports, add:

```ts
import { loadPlayer, savePlayer, clearPlayer } from '../../utils/playerStorage'
```

In `AvatarSelect`, when initializing `setups`, check for saved profiles:

```ts
const savedP1 = loadPlayer(1)
const savedP2 = loadPlayer(2)

const [setups, setSetups] = useState<PlayerSetup[]>(() => {
  const makeSetup = (id: 1 | 2, saved: ReturnType<typeof loadPlayer>): PlayerSetup => {
    if (saved) {
      if (saved.name) setPlayerName(id, saved.name)
      if (saved.color) setPlayerColor(id, saved.color)
      if (saved.avatarUrl) setPlayerAvatar(id, saved.avatarUrl)
      return {
        name: saved.name || `Player ${id}`,
        mode: 'none',
        description: saved.description || '',
        uploadedImage: null,
        generating: false,
        error: null,
      }
    }
    return { name: players[id - 1].name, mode: 'none', description: '', uploadedImage: null, generating: false, error: null }
  }
  return [makeSetup(1, savedP1), makeSetup(2, savedP2)]
})

const [welcomeBack, setWelcomeBack] = useState<Record<number, boolean>>({
  1: !!savedP1,
  2: !!savedP2,
})
```

In `handleContinue`, save the profiles:

```ts
const handleContinue = () => {
  humanPlayers.forEach((p) => {
    const setup = setups[p.id - 1]
    setPlayerName(p.id, setup.name || `Player ${p.id}`)
    savePlayer(p.id, {
      name: setup.name || `Player ${p.id}`,
      color: p.color,
      avatarUrl: p.avatarUrl,
      description: setup.description,
    })
  })
  setPhase('event-select')
}
```

Add a "Clear" button per player card that calls `clearPlayer(id)` and resets the setup.

Show "Welcome back, [Name]!" text when `welcomeBack[player.id]` is true.

**Step 3: Verify build**

Run: `cd /d/git/BrainGames && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: character persistence in localStorage with welcome back flow"
```

---

### Task 8: Scale to 4 Players

**Files:**
- Modify: `src/types.ts` (expand Player id type)
- Modify: `src/hooks/useGameState.ts` (players array up to 4)
- Modify: `src/utils/constants.ts` (P3/P4 key mappings)
- Modify: `src/hooks/useKeyboardInput.ts` (4 player support)
- Modify: `src/components/Menu/Menu.tsx` (3/4 player buttons)
- Modify: `src/components/MathMarathon/MathMarathon.tsx` (N players)
- Modify: `src/components/AvatarSelect/AvatarSelect.tsx` (N player cards)
- Modify: `src/components/Victory/Victory.tsx` (N player results)
- Modify: `src/components/shared/ScoreBar.tsx` (no changes needed, already generic)

**This is the largest task. Break it into sub-steps:**

**Step 1: Expand Player type**

In `src/types.ts`:
```ts
export interface Player {
  id: 1 | 2 | 3 | 4
  // ... rest stays the same
}
```

**Step 2: Add P3/P4 key codes to constants**

In `src/utils/constants.ts`:
```ts
export const P3_CODES: Record<string, number> = { 'KeyQ': 0, 'KeyW': 1, 'KeyE': 2, 'KeyR': 3 }
export const P4_CODES: Record<string, number> = { 'KeyU': 0, 'KeyI': 1, 'KeyO': 2, 'KeyP': 3 }
```

**Step 3: Expand useKeyboardInput for 4 players**

```ts
import { useEffect, useCallback } from 'react'
import { P1_CODES, P2_CODES, P3_CODES, P4_CODES } from '../utils/constants'

interface UseKeyboardInputProps {
  onAnswer: (playerId: 1 | 2 | 3 | 4, choiceIndex: number) => void
  enabled: boolean
  playerCount: number
}

export function useKeyboardInput({ onAnswer, enabled, playerCount }: UseKeyboardInputProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return
    const code = e.code
    if (code in P1_CODES) { e.preventDefault(); onAnswer(1, P1_CODES[code]) }
    else if (playerCount >= 2 && code in P2_CODES) { e.preventDefault(); onAnswer(2, P2_CODES[code]) }
    else if (playerCount >= 3 && code in P3_CODES) { e.preventDefault(); onAnswer(3, P3_CODES[code]) }
    else if (playerCount >= 4 && code in P4_CODES) { e.preventDefault(); onAnswer(4, P4_CODES[code]) }
  }, [onAnswer, enabled, playerCount])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
```

**Step 4: Update Zustand store for variable player count**

In `src/hooks/useGameState.ts`:

- Change `players` type from `[Player, Player]` to `Player[]`
- Add `playerCount` state and `setPlayerCount` action
- Update `startSinglePlayer`, `resetGame`, `rematch` to handle variable count
- All `.map()` calls already work with arrays — just update type casts

**Step 5: Update Menu with 3/4 player buttons**

Add buttons for 3 PLAYERS and 4 PLAYERS in `src/components/Menu/Menu.tsx`.

**Step 6: Update MathMarathon for N players**

The resolveRound logic needs to sort all players by answer timestamp to assign FIRST_CORRECT (3), SECOND_CORRECT (2), third correct (1), wrong (1), skip (0). This is the core change.

**Step 7: Update AvatarSelect, Victory for N players**

AvatarSelect already uses `humanPlayers.map()` — just ensure it handles 3-4 human players.

Victory needs to show all players ranked by position, not just winner/loser.

**Step 8: Verify build**

Run: `cd /d/git/BrainGames && npx tsc --noEmit`

**Step 9: Commit**

```bash
git add -A && git commit -m "feat: scale to 4 players locally with P3/P4 key mappings"
```

---

## Execution Order

Tasks 1-3 are sequential (key mapping → scoring → tug-of-war fix).
Tasks 4-7 are independent of each other and can be done in any order.
Task 8 depends on all prior tasks being stable.

**Recommended order:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

## Verification Checklist

After all tasks:

1. `npx tsc --noEmit` — no type errors
2. `npx vitest run` — all tests pass
3. Start dev server: `npm run dev -- --port 5555`
4. Manual test: 1-player Marathon with CPU opponent
5. Manual test: 2-player with numpad
6. Manual test: Settings menu changes persist after reload
7. Manual test: CPU avatars generate and cache
8. Manual test: Player profiles persist across sessions
