import { useCallback, useState, useRef } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { useMathEngine } from '../../hooks/useMathEngine'
import { useKeyboardInput } from '../../hooks/useKeyboardInput'
import { useCPU } from '../../hooks/useCPU'
import { MathProblem } from '../shared/MathProblem'
import { Timer } from '../shared/Timer'
import { ScoreBar } from '../shared/ScoreBar'
import { PlayerAvatar } from '../shared/PlayerAvatar'
import {
  MARATHON_CORRECT_BASE, MARATHON_CORRECT_MAX, MARATHON_WRONG_PENALTY,
  MARATHON_WIN_THRESHOLD, LOCKOUT_DURATION, MASH_LOCKOUT_DURATION,
  MASH_WINDOW, CONFIDENCE_BONUS_THRESHOLD, PROBLEM_TIME_LIMIT,
} from '../../utils/constants'

export function MathMarathon() {
  const {
    players, updatePosition, incrementStreak, resetStreak,
    lockPlayer, incrementScore, setWinner, cpuCharacter,
  } = useGameState()
  const { currentProblem, nextProblem, problemCount } = useMathEngine()
  const [timerKey, setTimerKey] = useState(0)
  const problemStartRef = useRef(Date.now())
  const lastWrongRef = useRef<Record<number, number>>({ 1: 0, 2: 0 })
  const [feedback, setFeedback] = useState<Record<number, 'correct' | 'wrong' | null>>({ 1: null, 2: null })

  const advanceProblem = useCallback(() => {
    nextProblem()
    setTimerKey(k => k + 1)
    problemStartRef.current = Date.now()
    setFeedback({ 1: null, 2: null })
  }, [nextProblem])

  const handleAnswer = useCallback((playerId: 1 | 2, choiceIndex: number) => {
    const now = Date.now()
    const player = players[playerId - 1]

    // Check lockout
    if (now < player.lockedUntil) return

    const isCorrect = currentProblem.choices[choiceIndex] === currentProblem.correctAnswer

    if (isCorrect) {
      const elapsed = now - problemStartRef.current
      const timeBonus = Math.max(0, 1 - elapsed / PROBLEM_TIME_LIMIT)
      const distance = MARATHON_CORRECT_BASE + timeBonus * (MARATHON_CORRECT_MAX - MARATHON_CORRECT_BASE)
      // Confidence bonus
      const waited = elapsed >= CONFIDENCE_BONUS_THRESHOLD
      const finalDistance = waited ? distance * 1.3 : distance

      updatePosition(playerId, finalDistance)
      incrementStreak(playerId)
      incrementScore(playerId)
      setFeedback(f => ({ ...f, [playerId]: 'correct' }))

      // Check win
      if (player.position + finalDistance >= MARATHON_WIN_THRESHOLD) {
        setWinner(playerId)
        return
      }
      // Move to next problem after brief delay
      setTimeout(advanceProblem, 600)
    } else {
      // Check for mashing
      const timeSinceLastWrong = now - (lastWrongRef.current[playerId] || 0)
      const lockDuration = timeSinceLastWrong < MASH_WINDOW ? MASH_LOCKOUT_DURATION : LOCKOUT_DURATION
      lastWrongRef.current[playerId] = now

      updatePosition(playerId, -MARATHON_WRONG_PENALTY)
      resetStreak(playerId)
      lockPlayer(playerId, now + lockDuration)
      setFeedback(f => ({ ...f, [playerId]: 'wrong' }))
      setTimeout(() => setFeedback(f => ({ ...f, [playerId]: null })), lockDuration)
    }
  }, [players, currentProblem, updatePosition, incrementStreak, resetStreak, lockPlayer, incrementScore, setWinner, advanceProblem])

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-blue-600 flex flex-col p-6 gap-6">
      {/* Progress bars */}
      <div className="flex flex-col gap-2">
        <ScoreBar position={players[0].position} color={players[0].color} label={players[0].name} />
        <ScoreBar position={players[1].position} color={players[1].color} label={players[1].name} />
      </div>

      {/* Track visualization */}
      <div className="relative h-32 bg-white/10 rounded-2xl border-2 border-white/20 overflow-hidden">
        <div className="absolute top-0 bottom-0 right-4 w-1 bg-yellow-400/50" />
        {players.map((player, i) => (
          <div
            key={player.id}
            className={`absolute transition-all duration-300 ${feedback[player.id] === 'wrong' ? 'animate-bounce' : ''}`}
            style={{
              left: `${Math.min(95, player.position)}%`,
              top: i === 0 ? '10%' : '50%',
            }}
          >
            <PlayerAvatar
              name={player.name}
              color={player.color}
              size={40}
              isLocked={Date.now() < player.lockedUntil}
            />
          </div>
        ))}
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

      {/* Feedback overlays */}
      {feedback[1] === 'correct' && <div className="fixed top-4 left-4 text-6xl animate-bounce">✓</div>}
      {feedback[1] === 'wrong' && <div className="fixed top-4 left-4 text-6xl text-red-500 animate-pulse">✗</div>}
      {feedback[2] === 'correct' && <div className="fixed top-4 right-4 text-6xl animate-bounce">✓</div>}
      {feedback[2] === 'wrong' && <div className="fixed top-4 right-4 text-6xl text-red-500 animate-pulse">✗</div>}

      {/* Problem counter */}
      <div className="text-center text-white/40 text-sm">Problem #{problemCount}</div>
    </div>
  )
}
