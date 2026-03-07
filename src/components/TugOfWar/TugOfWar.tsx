import { useCallback, useState, useRef } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { useMathEngine } from '../../hooks/useMathEngine'
import { useKeyboardInput } from '../../hooks/useKeyboardInput'
import { useCPU } from '../../hooks/useCPU'
import { MathProblem } from '../shared/MathProblem'
import { Timer } from '../shared/Timer'
import { PlayerAvatar } from '../shared/PlayerAvatar'
import {
  TUG_CORRECT_PULL, TUG_SUPER_PULL, TUG_WRONG_PULL,
  TUG_STREAK_THRESHOLD, TUG_WIN_THRESHOLD,
  LOCKOUT_DURATION, MASH_LOCKOUT_DURATION, MASH_WINDOW,
  CONFIDENCE_BONUS_THRESHOLD, PROBLEM_TIME_LIMIT,
} from '../../utils/constants'

export function TugOfWar() {
  const {
    players, setPosition, incrementStreak, resetStreak,
    lockPlayer, incrementScore, setWinner, cpuCharacter,
  } = useGameState()
  const { currentProblem, nextProblem, problemCount } = useMathEngine()
  const [timerKey, setTimerKey] = useState(0)
  const problemStartRef = useRef(Date.now())
  const lastWrongRef = useRef<Record<number, number>>({ 1: 0, 2: 0 })
  const [feedback, setFeedback] = useState<Record<number, 'correct' | 'wrong' | null>>({ 1: null, 2: null })

  // Rope position: 0 = center, negative = P1 winning, positive = P2 winning
  // We use players[0].position to track rope: -100 to +100
  const ropePos = players[0].position

  const advanceProblem = useCallback(() => {
    nextProblem()
    setTimerKey(k => k + 1)
    problemStartRef.current = Date.now()
    setFeedback({ 1: null, 2: null })
  }, [nextProblem])

  const handleAnswer = useCallback((playerId: 1 | 2, choiceIndex: number) => {
    const now = Date.now()
    const player = players[playerId - 1]

    if (now < player.lockedUntil) return

    const isCorrect = currentProblem.choices[choiceIndex] === currentProblem.correctAnswer
    const direction = playerId === 1 ? -1 : 1 // P1 pulls left (negative), P2 pulls right (positive)

    if (isCorrect) {
      const streak = player.streak + 1
      const pull = streak >= TUG_STREAK_THRESHOLD ? TUG_SUPER_PULL : TUG_CORRECT_PULL
      const elapsed = now - problemStartRef.current
      const waited = elapsed >= CONFIDENCE_BONUS_THRESHOLD
      const finalPull = waited ? pull * 1.3 : pull

      const newPos = ropePos + direction * finalPull
      setPosition(1, newPos)
      incrementStreak(playerId)
      incrementScore(playerId)
      setFeedback(f => ({ ...f, [playerId]: 'correct' }))

      // Check win
      if (Math.abs(newPos) >= TUG_WIN_THRESHOLD) {
        setWinner(newPos < 0 ? 1 : 2)
        return
      }
      setTimeout(advanceProblem, 600)
    } else {
      const timeSinceLastWrong = now - (lastWrongRef.current[playerId] || 0)
      const lockDuration = timeSinceLastWrong < MASH_WINDOW ? MASH_LOCKOUT_DURATION : LOCKOUT_DURATION
      lastWrongRef.current[playerId] = now

      // Opponent auto-pulls
      const opponentDirection = playerId === 1 ? 1 : -1
      const newPos = ropePos + opponentDirection * TUG_WRONG_PULL
      setPosition(1, newPos)
      resetStreak(playerId)
      lockPlayer(playerId, now + lockDuration)
      setFeedback(f => ({ ...f, [playerId]: 'wrong' }))
      setTimeout(() => setFeedback(f => ({ ...f, [playerId]: null })), lockDuration)

      if (Math.abs(newPos) >= TUG_WIN_THRESHOLD) {
        setWinner(newPos < 0 ? 1 : 2)
      }
    }
  }, [players, currentProblem, ropePos, setPosition, incrementStreak, resetStreak, lockPlayer, incrementScore, setWinner, advanceProblem])

  const handleP1Answer = useCallback((i: number) => handleAnswer(1, i), [handleAnswer])
  const handleP2Answer = useCallback((i: number) => handleAnswer(2, i), [handleAnswer])

  useKeyboardInput({
    onP1Answer: handleP1Answer,
    onP2Answer: players[1].type === 'cpu' ? () => {} : handleP2Answer,
    enabled: true,
  })

  useCPU({
    character: cpuCharacter,
    currentProblem,
    enabled: players[1].type === 'cpu',
    onAnswer: (i) => handleAnswer(2, i),
    streak: players[1].streak,
  })

  const handleTimeUp = useCallback(() => {
    advanceProblem()
  }, [advanceProblem])

  // Rope visualization: map ropePos (-100 to 100) to flag position (0% to 100%)
  const flagPct = 50 + (ropePos / 2)

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-500 to-emerald-800 flex flex-col p-6 gap-6">
      {/* Player info */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col items-center">
          <PlayerAvatar
            name={players[0].name}
            color={players[0].color}
            size={60}
            isWinning={ropePos < -20}
            isLosing={ropePos > 20}
            isLocked={Date.now() < players[0].lockedUntil}
          />
          <div className="text-yellow-300 text-sm font-bold mt-1">
            {players[0].streak >= TUG_STREAK_THRESHOLD ? 'SUPER PULL!' : `Streak: ${players[0].streak}`}
          </div>
        </div>
        <div className="text-white text-xl font-bold">VS</div>
        <div className="flex flex-col items-center">
          <PlayerAvatar
            name={players[1].name}
            color={players[1].color}
            size={60}
            isWinning={ropePos > 20}
            isLosing={ropePos < -20}
            isLocked={Date.now() < players[1].lockedUntil}
          />
          <div className="text-yellow-300 text-sm font-bold mt-1">
            {players[1].streak >= TUG_STREAK_THRESHOLD ? 'SUPER PULL!' : `Streak: ${players[1].streak}`}
          </div>
        </div>
      </div>

      {/* Rope */}
      <div className="relative h-16 bg-gradient-to-r from-blue-500/30 via-amber-800/40 to-red-500/30 rounded-2xl border-2 border-white/20 overflow-hidden">
        {/* Win zones */}
        <div className="absolute left-0 top-0 bottom-0 w-[10%] bg-blue-500/20 border-r-2 border-blue-400/40" />
        <div className="absolute right-0 top-0 bottom-0 w-[10%] bg-red-500/20 border-l-2 border-red-400/40" />
        {/* Rope line */}
        <div className="absolute top-1/2 left-[5%] right-[5%] h-2 bg-amber-700 rounded -translate-y-1/2" />
        {/* Flag */}
        <div
          className="absolute top-1 transition-all duration-300"
          style={{ left: `${flagPct}%`, transform: 'translateX(-50%)' }}
        >
          <div className="w-1 h-12 bg-white mx-auto" />
          <div className="w-6 h-4 bg-yellow-400 -mt-12 ml-0.5" />
        </div>
      </div>

      {/* Timer */}
      <Timer onTimeUp={handleTimeUp} resetKey={timerKey} />

      {/* Problem */}
      <div className="flex-1 flex items-center justify-center">
        <MathProblem
          problem={currentProblem}
          onAnswer={() => {}}
          lockedP1={Date.now() < players[0].lockedUntil}
          lockedP2={Date.now() < players[1].lockedUntil}
          p1Keys={['1', '2', '3', '4']}
          p2Keys={['7', '8', '9', '0']}
        />
      </div>

      {/* Feedback */}
      {feedback[1] === 'correct' && <div className="fixed top-4 left-4 text-6xl animate-bounce">✓</div>}
      {feedback[1] === 'wrong' && <div className="fixed top-4 left-4 text-6xl text-red-500 animate-pulse">✗</div>}
      {feedback[2] === 'correct' && <div className="fixed top-4 right-4 text-6xl animate-bounce">✓</div>}
      {feedback[2] === 'wrong' && <div className="fixed top-4 right-4 text-6xl text-red-500 animate-pulse">✗</div>}

      <div className="text-center text-white/40 text-sm">Problem #{problemCount}</div>
    </div>
  )
}
