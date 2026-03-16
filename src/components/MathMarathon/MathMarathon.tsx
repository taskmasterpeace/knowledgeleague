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
import { ScreenShake, FlashOverlay, StreakFlame, ParticleBurst } from '../shared/Effects'
import {
  MARATHON_FIRST_CORRECT,
  MARATHON_SECOND_CORRECT, MARATHON_WRONG_ANSWER,
  MARATHON_NO_ANSWER,
} from '../../utils/constants'
import { useSettings } from '../../hooks/useSettings'
import type { PlayerId, Badge } from '../../types'
import { getOrCreateProfile, recordAnswer } from '../../utils/playerProfile'
import { BadgeToast } from '../shared/BadgeToast'

type RoundAnswer = { choiceIndex: number; correct: boolean; timestamp: number } | null

interface PlayerRoundResult {
  answer: RoundAnswer
  spaces: number
}

interface RoundResult {
  playerResults: Map<PlayerId, PlayerRoundResult>
  correctAnswer: number
  question: string
}

// Scoring tiers: 1st correct = 3, 2nd = 2, 3rd+ / wrong = 1, no answer = 0
const CORRECT_TIERS = [MARATHON_FIRST_CORRECT, MARATHON_SECOND_CORRECT, MARATHON_WRONG_ANSWER]

export function MathMarathon() {
  const {
    players, updatePosition, incrementStreak, resetStreak,
    incrementScore, setWinner, cpuCharacter,
    controllerType, setControllerType,
  } = useGameState()
  const { timePerQuestion, trackLength, difficulty } = useSettings()
  const { currentProblem, nextProblem, problemCount } = useMathEngine(
    difficulty === 'adaptive' ? undefined : difficulty
  )
  const [timerKey, setTimerKey] = useState(0)
  const [showingResult, setShowingResult] = useState(false)
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null)
  const [flashType, setFlashType] = useState<'correct' | 'wrong' | null>(null)
  const [shaking, setShaking] = useState(false)
  const [showBurst, setShowBurst] = useState(false)
  const [earnedBadge, setEarnedBadge] = useState<Badge | null>(null)

  const answersRef = useRef<Map<PlayerId, RoundAnswer>>(new Map())
  const roundResolvedRef = useRef(false)
  const profilesRef = useRef<Map<number, string>>(new Map()) // playerId -> profileId
  const timerStartRef = useRef(Date.now())

  useEffect(() => {
    for (const player of players) {
      if (player.type === 'human' && !profilesRef.current.has(player.id)) {
        const profile = getOrCreateProfile(player.name)
        profilesRef.current.set(player.id, profile.id)
      }
    }
  }, [players])

  const resolveRound = useCallback(() => {
    if (roundResolvedRef.current) return
    roundResolvedRef.current = true

    const answers = answersRef.current
    const playerResults = new Map<PlayerId, PlayerRoundResult>()

    // Collect correct answers sorted by timestamp
    const correctAnswers: { id: PlayerId; timestamp: number }[] = []
    for (const player of players) {
      const answer = answers.get(player.id as PlayerId) ?? null
      if (answer?.correct) {
        correctAnswers.push({ id: player.id as PlayerId, timestamp: answer.timestamp })
      }
    }
    correctAnswers.sort((a, b) => a.timestamp - b.timestamp)

    // Assign spaces
    for (const player of players) {
      const pid = player.id as PlayerId
      const answer = answers.get(pid) ?? null
      let spaces = MARATHON_NO_ANSWER

      if (answer?.correct) {
        const rank = correctAnswers.findIndex(c => c.id === pid)
        spaces = CORRECT_TIERS[Math.min(rank, CORRECT_TIERS.length - 1)]
      } else if (answer) {
        spaces = MARATHON_WRONG_ANSWER
      }

      playerResults.set(pid, { answer, spaces })

      if (spaces > 0) updatePosition(pid, spaces)
      if (answer?.correct) { incrementStreak(pid); incrementScore(pid) } else { resetStreak(pid) }
    }

    // Record answers for human players
    for (const player of players) {
      if (player.type !== 'human') continue
      const pid = player.id as PlayerId
      const result = playerResults.get(pid)
      if (!result) continue
      const profileId = profilesRef.current.get(player.id)
      if (!profileId) continue
      const responseTime = result.answer ? result.answer.timestamp - timerStartRef.current : timePerQuestion
      const badge = recordAnswer(profileId, currentProblem.type, result.answer?.correct ?? false, responseTime)
      if (badge) setEarnedBadge(badge)
    }

    // Trigger effects based on whether any human got it correct
    const anyHumanCorrect = players.some(p => {
      if (p.type !== 'human') return false
      return playerResults.get(p.id as PlayerId)?.answer?.correct === true
    })
    if (anyHumanCorrect) {
      setFlashType('correct')
      setShowBurst(true)
      setTimeout(() => setFlashType(null), 150)
      setTimeout(() => setShowBurst(false), 600)
    } else {
      setFlashType('wrong')
      setShaking(true)
      setTimeout(() => setFlashType(null), 150)
      setTimeout(() => setShaking(false), 250)
    }

    // Check for winner
    let winnerId: PlayerId | null = null
    let winnerPos = 0
    for (const player of players) {
      const pid = player.id as PlayerId
      const result = playerResults.get(pid)!
      const newPos = player.position + result.spaces
      if (newPos >= trackLength && newPos > winnerPos) {
        winnerId = pid
        winnerPos = newPos
      }
    }

    if (winnerId) {
      setWinner(winnerId)
      return
    }

    setRoundResult({
      playerResults,
      correctAnswer: currentProblem.correctAnswer,
      question: currentProblem.question,
    })
    setShowingResult(true)

    setTimeout(() => {
      setShowingResult(false)
      setRoundResult(null)
      answersRef.current = new Map()
      roundResolvedRef.current = false
      setEarnedBadge(null)
      nextProblem()
      timerStartRef.current = Date.now()
      setTimerKey(k => k + 1)
    }, 2000)
  }, [players, currentProblem, trackLength, timePerQuestion, updatePosition, incrementStreak, resetStreak, incrementScore, setWinner, nextProblem])

  const handleAnswer = useCallback((playerId: PlayerId, choiceIndex: number) => {
    if (showingResult) return
    if (answersRef.current.has(playerId)) return

    const isCorrect = currentProblem.choices[choiceIndex] === currentProblem.correctAnswer
    answersRef.current.set(playerId, { choiceIndex, correct: isCorrect, timestamp: Date.now() })

    // If all players have answered, resolve immediately
    if (answersRef.current.size >= players.length) {
      resolveRound()
    }
  }, [currentProblem, showingResult, resolveRound, players.length])

  const humanCount = players.filter(p => p.type === 'human').length

  useKeyboardInput({
    onAnswer: (playerId, choiceIndex) => {
      const player = players.find(p => p.id === playerId)
      if (player?.type === 'human') handleAnswer(playerId, choiceIndex)
    },
    enabled: !showingResult,
    playerCount: humanCount,
  })

  useGamepad({
    onP1Answer: (i) => handleAnswer(1, i),
    onP2Answer: (i) => {
      if (players[1]?.type === 'human') handleAnswer(2, i)
    },
    enabled: !showingResult,
    onControllerChange: setControllerType,
  })

  // CPU player (always player 2 in single-player mode)
  const cpuPlayer = players.find(p => p.type === 'cpu')
  useCPU({
    character: cpuCharacter,
    currentProblem,
    enabled: !!cpuPlayer && !showingResult,
    onAnswer: (i) => { if (cpuPlayer) handleAnswer(cpuPlayer.id as PlayerId, i) },
    streak: cpuPlayer?.streak ?? 0,
  })

  const handleTimeUp = useCallback(() => {
    resolveRound()
  }, [resolveRound])

  // Track vertical spacing per player
  const trackSpacing = (i: number) => `${(i / Math.max(players.length - 1, 1)) * 70 + 10}%`

  return (
    <ScreenShake trigger={shaking}>
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-blue-600 flex flex-col p-6 gap-6">
      <BadgeToast badge={earnedBadge} />
      <FlashOverlay type={flashType} />
      {/* Progress bars */}
      <div className="flex flex-col gap-2">
        {players.map(player => (
          <div key={player.id} className="flex items-center gap-2">
            <ScoreBar position={player.position} trackLength={trackLength} color={player.color} label={player.name} />
            <StreakFlame streak={player.streak} />
          </div>
        ))}
      </div>

      {/* Track visualization */}
      <div className="relative h-32 bg-white/10 rounded-2xl border-2 border-white/20 overflow-hidden">
        <div className="absolute top-0 bottom-0 right-4 w-1 bg-yellow-400/50" />
        {players.map((player, i) => (
          <div
            key={player.id}
            className="absolute transition-all duration-300"
            style={{
              left: `${Math.min(95, (player.position / trackLength) * 100)}%`,
              top: trackSpacing(i),
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
      {!showingResult && <Timer onTimeUp={handleTimeUp} resetKey={timerKey} timeLimit={timePerQuestion} />}

      {/* Problem or Results */}
      <div className="flex-1 flex items-center justify-center">
        <ParticleBurst active={showBurst} color="#4ade80" />
        {showingResult && roundResult ? (
          <div className="flex flex-col items-center gap-6 bg-white/10 backdrop-blur rounded-2xl p-8 border-2 border-white/20 w-full max-w-3xl">
            <div className="text-3xl font-bold text-white">
              {roundResult.question} = <span className="text-green-300">{roundResult.correctAnswer}</span>
            </div>
            <div className="flex gap-8 flex-wrap justify-center">
              {players.map(player => {
                const result = roundResult.playerResults.get(player.id as PlayerId)
                return (
                  <div key={player.id} className="flex flex-col items-center gap-2">
                    <PlayerAvatar name={player.name} color={player.color} size={50} avatarUrl={player.avatarUrl} />
                    <div className={`text-2xl font-bold ${result?.answer?.correct ? 'text-green-300' : result?.answer ? 'text-red-300' : 'text-white/40'}`}>
                      {result?.answer?.correct ? 'Correct!' : result?.answer ? 'Wrong' : 'No answer'}
                    </div>
                    <div className="text-yellow-300 text-xl font-bold">+{result?.spaces ?? 0} spaces</div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <MathProblem
            problem={currentProblem}
            onAnswer={() => {}}
            lockedP1={answersRef.current.has(1)}
            lockedP2={answersRef.current.has(2)}
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
    </ScreenShake>
  )
}
