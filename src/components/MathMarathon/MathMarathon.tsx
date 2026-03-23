import { useCallback, useState, useRef, useEffect } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { useQuestionEngine } from '../../hooks/useQuestionEngine'
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
import { sounds } from '../../utils/sounds'
import type { PlayerId, Badge, QuestionCategory, PlayerAnalytics } from '../../types'
import { getOrCreateProfile, recordAnswer } from '../../utils/playerProfile'
import { BadgeToast } from '../shared/BadgeToast'
import { useAnnouncer } from '../../hooks/useAnnouncer'
import { usePeerContext } from '../../hooks/usePeerContext'
import { createPlayerAnalytics, recordAnalyticsAnswer } from '../../utils/playerAnalytics'
import { gradeToStartingTier, adjustTier } from '../../utils/adaptiveDifficulty'
import { playMusic, stopMusic } from '../../utils/backgroundMusic'
import { storeGameAnalytics } from '../../utils/gameAnalyticsStore'
import { MarathonScene } from './MarathonScene'

type RoundAnswer = { choiceIndex: number; correct: boolean; timestamp: number } | null

interface PlayerRoundResult {
  answer: RoundAnswer
  spaces: number
}

interface RoundResult {
  playerResults: Map<PlayerId, PlayerRoundResult>
  correctAnswer: string
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
  const { timePerQuestion, trackLength, difficulty, soundEnabled, gradeLevel } = useSettings()
  const { currentProblem, nextProblem, problemCount } = useQuestionEngine(
    difficulty === 'adaptive' ? undefined : difficulty
  )
  const [timerKey, setTimerKey] = useState(0)
  const [showingResult, setShowingResult] = useState(false)
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null)
  const [flashType, setFlashType] = useState<'correct' | 'wrong' | null>(null)
  const [shaking, setShaking] = useState(false)
  const [showBurst, setShowBurst] = useState(false)
  const [earnedBadge, setEarnedBadge] = useState<Badge | null>(null)
  const [hoppingPlayers, setHoppingPlayers] = useState<Set<PlayerId>>(new Set())
  const { announceCorrect, announceWrong } = useAnnouncer()

  const { broadcastProblem, broadcastResult, broadcastSpectatorUpdate } = usePeerContext()

  const answersRef = useRef<Map<PlayerId, RoundAnswer>>(new Map())
  const roundResolvedRef = useRef(false)
  const profilesRef = useRef<Map<number, string>>(new Map()) // playerId -> profileId
  const timerStartRef = useRef(Date.now())
  const analyticsRef = useRef<Map<PlayerId, PlayerAnalytics>>(new Map())

  useEffect(() => {
    playMusic('marathon')
    return () => stopMusic()
  }, [])

  useEffect(() => {
    for (const player of players) {
      if (player.type === 'human' && !profilesRef.current.has(player.id)) {
        const profile = getOrCreateProfile(player.name)
        profilesRef.current.set(player.id, profile.id)
      }
    }
  }, [players])

  useEffect(() => {
    const tier = gradeToStartingTier(gradeLevel)
    for (const player of players) {
      if (!analyticsRef.current.has(player.id as PlayerId)) {
        analyticsRef.current.set(player.id as PlayerId, createPlayerAnalytics(tier))
      }
    }
  }, [players, gradeLevel])

  useEffect(() => {
    const interval = setInterval(() => {
      if (analyticsRef.current.size > 0 && broadcastSpectatorUpdate) {
        broadcastSpectatorUpdate(Object.fromEntries(analyticsRef.current))
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [broadcastSpectatorUpdate])

  // Broadcast current problem to phone controllers
  useEffect(() => {
    broadcastProblem(currentProblem.question, currentProblem.choices, currentProblem.subject)
  }, [currentProblem, broadcastProblem])

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
      const badge = recordAnswer(profileId, currentProblem.category, result.answer?.correct ?? false, responseTime)
      if (badge) {
        setEarnedBadge(badge)
        if (soundEnabled) sounds.badge()
      }
    }

    // Update analytics for all players
    for (const player of players) {
      const pid = player.id as PlayerId
      const result = playerResults.get(pid)
      if (!result) continue
      const responseTime = result.answer ? result.answer.timestamp - timerStartRef.current : timePerQuestion
      const prev = analyticsRef.current.get(pid)
      if (prev) {
        const updated = recordAnalyticsAnswer(
          prev,
          result.answer?.choiceIndex ?? -1,
          result.answer?.correct ?? false,
          responseTime,
          currentProblem.category,
        )
        updated.positionHistory = [...updated.positionHistory, player.position + (result.spaces ?? 0)]
        const newTier = adjustTier(updated.adaptiveTier, updated.last10Correct)
        if (newTier !== updated.adaptiveTier) {
          updated.adaptiveTier = newTier
          updated.adaptiveHistory = [...updated.adaptiveHistory, newTier]
        }
        analyticsRef.current.set(pid, updated)
      }
    }

    // Play streak sound if any human hit a streak milestone
    for (const player of players) {
      if (player.type !== 'human') continue
      const pid = player.id as PlayerId
      const result = playerResults.get(pid)
      if (result?.answer?.correct) {
        const newStreak = player.streak + 1
        if (newStreak === 3 || newStreak === 5) {
          if (soundEnabled) sounds.streak()
        }
      }
    }

    // Trigger effects based on whether any human got it correct
    const anyHumanCorrect = players.some(p => {
      if (p.type !== 'human') return false
      return playerResults.get(p.id as PlayerId)?.answer?.correct === true
    })
    if (anyHumanCorrect) {
      if (soundEnabled) sounds.correct()
      setFlashType('correct')
      setShowBurst(true)
      // Trigger avatar hop for players who got it correct
      const hoppers = new Set<PlayerId>()
      for (const player of players) {
        const pid = player.id as PlayerId
        if (playerResults.get(pid)?.answer?.correct) hoppers.add(pid)
      }
      setHoppingPlayers(hoppers)
      setTimeout(() => setFlashType(null), 150)
      setTimeout(() => setShowBurst(false), 600)
      setTimeout(() => setHoppingPlayers(new Set()), 400)
    } else {
      if (soundEnabled) sounds.wrong()
      setFlashType('wrong')
      setShaking(true)
      setTimeout(() => setFlashType(null), 150)
      setTimeout(() => setShaking(false), 250)
    }

    // Announcer
    if (anyHumanCorrect) {
      for (const player of players) {
        const pid = player.id as PlayerId
        if (playerResults.get(pid)?.answer?.correct && player.type === 'human') {
          announceCorrect(player.name, player.streak + 1)
          break
        }
      }
    } else {
      const firstHuman = players.find(p => p.type === 'human')
      if (firstHuman) announceWrong(firstHuman.name, firstHuman.streak > 0)
    }

    // Check for winner
    let winnerId: PlayerId | null = null
    let winnerPos = 0
    for (const player of players) {
      const pid = player.id as PlayerId
      const result = playerResults.get(pid)
      if (!result) continue
      const newPos = player.position + result.spaces
      if (newPos >= trackLength && newPos > winnerPos) {
        winnerId = pid
        winnerPos = newPos
      }
    }

    if (winnerId) {
      setWinner(winnerId)
      storeGameAnalytics(analyticsRef.current, new Map(players.map(p => [p.id as PlayerId, p.name])))
      return
    }

    // Broadcast correct answer to phone controllers
    broadcastResult(currentProblem.correctIndex)

    setRoundResult({
      playerResults,
      correctAnswer: currentProblem.choices[currentProblem.correctIndex],
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
  }, [players, currentProblem, trackLength, timePerQuestion, updatePosition, incrementStreak, resetStreak, incrementScore, setWinner, nextProblem, broadcastResult])

  const handleAnswer = useCallback((playerId: PlayerId, choiceIndex: number) => {
    if (showingResult) return
    if (answersRef.current.has(playerId)) return

    const isCorrect = choiceIndex === currentProblem.correctIndex
    answersRef.current.set(playerId, { choiceIndex, correct: isCorrect, timestamp: Date.now() })

    // If all players have answered, resolve immediately
    if (answersRef.current.size >= players.length) {
      resolveRound()
    }
  }, [currentProblem, showingResult, resolveRound, players.length])

  // Register handler for phone controller answers via PeerJS
  useEffect(() => {
    window.__remoteAnswerHandler = (playerId: number, choiceIndex: number) => {
      handleAnswer(playerId as PlayerId, choiceIndex)
    }
    return () => { delete window.__remoteAnswerHandler }
  }, [handleAnswer])

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

  return (
    <ScreenShake trigger={shaking}>
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 stars-bg screen-enter flex flex-col p-4 gap-4">
      <BadgeToast badge={earnedBadge} />
      <FlashOverlay type={flashType} />

      {/* Pixel Art Marathon Scene */}
      <MarathonScene players={players} totalSpaces={trackLength} />

      {/* Timer */}
      {!showingResult && <Timer onTimeUp={handleTimeUp} resetKey={timerKey} timeLimit={timePerQuestion} />}

      {/* Problem or Results */}
      <div className="flex-1 flex items-center justify-center relative">
        <ParticleBurst active={showBurst} color="#4ade80" />
        {showingResult && roundResult ? (
          <div className="pixel-card rounded-lg p-6 w-full max-w-3xl mx-auto screen-enter">
            <div className="text-center mb-4">
              <span className="font-pixel text-lg text-white">{roundResult.question} = </span>
              <span className="font-pixel text-lg text-green-400 text-glow">{roundResult.correctAnswer}</span>
            </div>
            <div className="flex gap-6 flex-wrap justify-center">
              {players.map(player => {
                const result = roundResult.playerResults.get(player.id as PlayerId)
                const isCorrect = result?.answer?.correct
                return (
                  <div key={player.id} className="flex flex-col items-center gap-2">
                    <PlayerAvatar name={player.name} color={player.color} size={50} avatarUrl={player.avatarUrl} />
                    <div className={`font-pixel text-[10px] font-bold px-3 py-1.5 rounded ${
                      isCorrect
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : result?.answer
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {isCorrect ? 'CORRECT!' : result?.answer ? 'WRONG' : 'NO ANSWER'}
                    </div>
                    <div className="font-pixel text-[9px] text-yellow-300">+{result?.spaces ?? 0} spaces</div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <MathProblem
            problem={currentProblem}
            onAnswer={(i) => handleAnswer(1, i)}
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
        <div className="font-pixel text-[8px] text-white/30">PROBLEM #{problemCount}</div>
        <ControllerHint controllerType={controllerType} />
      </div>
    </div>
    </ScreenShake>
  )
}
