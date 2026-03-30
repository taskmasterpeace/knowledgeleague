import { useCallback, useState, useRef, useEffect } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { useQuestionEngine } from '../../hooks/useQuestionEngine'
import { useKeyboardInput } from '../../hooks/useKeyboardInput'
import { useGamepad } from '../../hooks/useGamepad'
import { useCPU } from '../../hooks/useCPU'
import { MathProblem } from '../shared/MathProblem'
import { Timer } from '../shared/Timer'
import { PlayerAvatar } from '../shared/PlayerAvatar'
import { ControllerHint } from '../shared/ControllerButtons'
import { ScreenShake, FlashOverlay, ParticleBurst } from '../shared/Effects'
import { useSettings } from '../../hooks/useSettings'
import { sounds } from '../../utils/sounds'
import type { PlayerId, Badge, PlayerAnalytics } from '../../types'
import { getOrCreateProfile, recordAnswer } from '../../utils/playerProfile'
import { BadgeToast } from '../shared/BadgeToast'
import { QuitButton } from '../shared/QuitButton'
import { useAnnouncer } from '../../hooks/useAnnouncer'
import { useLockIn } from '../../hooks/useLockIn'
import { usePeerContext } from '../../hooks/usePeerContext'
import { createPlayerAnalytics, recordAnalyticsAnswer } from '../../utils/playerAnalytics'
import { gradeToStartingTier, adjustTier } from '../../utils/adaptiveDifficulty'
import { playMusic, stopMusic } from '../../utils/backgroundMusic'
import { storeGameAnalytics } from '../../utils/gameAnalyticsStore'
import { SpellingBeeScene } from './SpellingBeeScene'
import { LockInIndicator } from '../shared/LockInIndicator'
import Countdown from '../shared/Countdown'
import type { Difficulty } from '../../types'

type RoundAnswer = { choiceIndex: number; correct: boolean; timestamp: number } | null

/**
 * Determine the difficulty for a given round number.
 * Rounds 1-3: easy, 4-6: medium, 7+: hard
 */
function roundDifficulty(round: number): Difficulty {
  if (round <= 3) return 'easy'
  if (round <= 6) return 'medium'
  return 'hard'
}

export function SpellingBee() {
  const {
    players, incrementStreak, resetStreak,
    incrementScore, setWinner, cpuCharacter,
    controllerType, setControllerType,
  } = useGameState()
  const { timePerQuestion, difficulty, soundEnabled, gradeLevel } = useSettings()

  const [roundNumber, setRoundNumber] = useState(1)
  const [eliminated, setEliminated] = useState<Set<PlayerId>>(new Set())

  // Force spelling-only questions at the round's difficulty
  const spellingDifficulty = difficulty === 'adaptive' ? roundDifficulty(roundNumber) : difficulty
  const { currentProblem, nextProblem } = useQuestionEngine(spellingDifficulty, 'spelling')

  const [timerKey, setTimerKey] = useState(0)
  const [showingResult, setShowingResult] = useState(false)
  const [roundResultData, setRoundResultData] = useState<{
    answers: Map<PlayerId, RoundAnswer>
    newlyEliminated: Set<PlayerId>
  } | null>(null)
  const [flashType, setFlashType] = useState<'correct' | 'wrong' | null>(null)
  const [shaking, setShaking] = useState(false)
  const [showBurst, setShowBurst] = useState(false)
  const [earnedBadge, setEarnedBadge] = useState<Badge | null>(null)
  const [countdownDone, setCountdownDone] = useState(false)
  useEffect(() => {
    if (countdownDone) timerStartRef.current = Date.now()
  }, [countdownDone])
  const { announceCorrect, announceWrong } = useAnnouncer()
  const { lockedIn, onLockIn, resetLockIn } = useLockIn(players)

  const { broadcastProblem, broadcastResult, broadcastSpectatorUpdate } = usePeerContext()

  const answersRef = useRef<Map<PlayerId, RoundAnswer>>(new Map())
  const roundResolvedRef = useRef(false)
  const profilesRef = useRef<Map<number, string>>(new Map())
  const timerStartRef = useRef(0)
  const analyticsRef = useRef<Map<PlayerId, PlayerAnalytics>>(new Map())

  // Music
  useEffect(() => {
    playMusic('marathon')
    return () => stopMusic()
  }, [])

  // Player profiles
  useEffect(() => {
    for (const player of players) {
      if (player.type === 'human' && !profilesRef.current.has(player.id)) {
        const profile = getOrCreateProfile(player.name)
        profilesRef.current.set(player.id, profile.id)
      }
    }
  }, [players])

  // Analytics init
  useEffect(() => {
    const tier = gradeToStartingTier(gradeLevel)
    for (const player of players) {
      if (!analyticsRef.current.has(player.id as PlayerId)) {
        analyticsRef.current.set(player.id as PlayerId, createPlayerAnalytics(tier))
      }
    }
  }, [players, gradeLevel])

  // Spectator broadcast
  useEffect(() => {
    const interval = setInterval(() => {
      if (analyticsRef.current.size > 0 && broadcastSpectatorUpdate) {
        broadcastSpectatorUpdate(Object.fromEntries(analyticsRef.current))
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [broadcastSpectatorUpdate])

  // Broadcast problem to phone controllers
  useEffect(() => {
    broadcastProblem(currentProblem.question, currentProblem.choices, currentProblem.subject, currentProblem.correctIndex)
  }, [currentProblem, broadcastProblem])

  const activePlayers = players.filter(p => !eliminated.has(p.id as PlayerId))

  const resolveRound = useCallback(() => {
    if (roundResolvedRef.current) return
    roundResolvedRef.current = true

    const answers = answersRef.current
    const newlyEliminated = new Set<PlayerId>()

    // Determine who got it wrong among remaining players
    const activeIds = players
      .filter(p => !eliminated.has(p.id as PlayerId))
      .map(p => p.id as PlayerId)

    const wrongIds: PlayerId[] = []
    const correctIds: PlayerId[] = []

    for (const pid of activeIds) {
      const answer = answers.get(pid) ?? null
      if (answer?.correct) {
        correctIds.push(pid)
      } else {
        wrongIds.push(pid)
      }
    }

    // Mercy rule: if ALL active players got it wrong, nobody is eliminated
    const mercyRule = correctIds.length === 0 && wrongIds.length > 0

    if (!mercyRule) {
      for (const pid of wrongIds) {
        newlyEliminated.add(pid)
      }
    }

    // Update streaks / scores
    for (const player of players) {
      const pid = player.id as PlayerId
      if (eliminated.has(pid)) continue
      const answer = answers.get(pid) ?? null
      if (answer?.correct) {
        incrementStreak(pid)
        incrementScore(pid)
      } else {
        resetStreak(pid)
      }
    }

    // Record answers for profiles
    for (const player of players) {
      if (player.type !== 'human') continue
      const pid = player.id as PlayerId
      if (eliminated.has(pid)) continue
      const answer = answers.get(pid) ?? null
      const profileId = profilesRef.current.get(player.id)
      if (!profileId) continue
      const responseTime = answer ? answer.timestamp - timerStartRef.current : timePerQuestion
      const badge = recordAnswer(profileId, currentProblem.category, answer?.correct ?? false, responseTime)
      if (badge) {
        setEarnedBadge(badge)
        if (soundEnabled) sounds.badge()
      }
    }

    // Update analytics
    for (const player of players) {
      const pid = player.id as PlayerId
      if (eliminated.has(pid)) continue
      const answer = answers.get(pid) ?? null
      const responseTime = answer ? answer.timestamp - timerStartRef.current : timePerQuestion
      const prev = analyticsRef.current.get(pid)
      if (prev) {
        const updated = recordAnalyticsAnswer(
          prev,
          answer?.choiceIndex ?? -1,
          answer?.correct ?? false,
          responseTime,
          currentProblem.category,
        )
        const newTier = adjustTier(updated.adaptiveTier, updated.last10Correct)
        if (newTier !== updated.adaptiveTier) {
          updated.adaptiveTier = newTier
          updated.adaptiveHistory = [...updated.adaptiveHistory, newTier]
        }
        analyticsRef.current.set(pid, updated)
      }
    }

    // Effects
    const anyHumanCorrect = players.some(p => {
      if (p.type !== 'human') return false
      if (eliminated.has(p.id as PlayerId)) return false
      return answers.get(p.id as PlayerId)?.correct === true
    })

    if (anyHumanCorrect) {
      if (soundEnabled) sounds.correct()
      setFlashType('correct')
      setShowBurst(true)
      setTimeout(() => setFlashType(null), 150)
      setTimeout(() => setShowBurst(false), 600)
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
        if (answers.get(pid)?.correct && player.type === 'human' && !eliminated.has(pid)) {
          announceCorrect(player.name, player.streak + 1)
          break
        }
      }
    } else {
      const firstHuman = players.find(p => p.type === 'human' && !eliminated.has(p.id as PlayerId))
      if (firstHuman) announceWrong(firstHuman.name, firstHuman.streak > 0)
    }

    // Apply eliminations
    const nextEliminated = new Set([...eliminated, ...newlyEliminated])
    setEliminated(nextEliminated)

    // Check win condition
    const remaining = players.filter(p => !nextEliminated.has(p.id as PlayerId))

    if (remaining.length <= 1) {
      if (remaining.length === 1) {
        setWinner(remaining[0].id as PlayerId)
      } else {
        // All eliminated somehow (shouldn't happen with mercy rule, but fallback)
        // Award winner to last player who was eliminated (they all went out together)
        const lastActive = players.find(p => !eliminated.has(p.id as PlayerId))
        if (lastActive) setWinner(lastActive.id as PlayerId)
      }
      storeGameAnalytics(analyticsRef.current, new Map(players.map(p => [p.id as PlayerId, p.name])))
      return
    }

    // Broadcast correct answer
    broadcastResult(currentProblem.correctIndex)

    setRoundResultData({ answers: new Map(answers), newlyEliminated })
    setShowingResult(true)

    setTimeout(() => {
      setShowingResult(false)
      setRoundResultData(null)
      answersRef.current = new Map()
      roundResolvedRef.current = false
      setEarnedBadge(null)
      resetLockIn()
      setRoundNumber(r => r + 1)
      nextProblem()
      timerStartRef.current = Date.now()
      setTimerKey(k => k + 1)
    }, 2500)
  }, [
    players, currentProblem, eliminated, timePerQuestion,
    incrementStreak, resetStreak, incrementScore, setWinner,
    nextProblem, broadcastResult, resetLockIn, soundEnabled,
    announceCorrect, announceWrong, gradeLevel,
  ])

  const handleAnswer = useCallback((playerId: PlayerId, choiceIndex: number) => {
    if (showingResult) return
    if (eliminated.has(playerId)) return
    if (answersRef.current.has(playerId)) return

    const isCorrect = choiceIndex === currentProblem.correctIndex
    answersRef.current.set(playerId, { choiceIndex, correct: isCorrect, timestamp: Date.now() })
    onLockIn(playerId)

    // If all active players have answered, resolve immediately
    if (answersRef.current.size >= activePlayers.length) {
      resolveRound()
    }
  }, [currentProblem, showingResult, eliminated, resolveRound, activePlayers.length, onLockIn])

  // Phone controller answer handler
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
    enabled: countdownDone && !showingResult,
    playerCount: humanCount,
  })

  useGamepad({
    onP1Answer: (i) => handleAnswer(1, i),
    onP2Answer: (i) => {
      if (players[1]?.type === 'human') handleAnswer(2, i)
    },
    enabled: countdownDone && !showingResult,
    onControllerChange: setControllerType,
  })

  // CPU players
  const cpuPlayer = players.find(p => p.type === 'cpu' && !eliminated.has(p.id as PlayerId))
  useCPU({
    character: cpuCharacter,
    currentProblem,
    enabled: !!cpuPlayer && countdownDone && !showingResult,
    onAnswer: (i) => { if (cpuPlayer) handleAnswer(cpuPlayer.id as PlayerId, i) },
    streak: cpuPlayer?.streak ?? 0,
  })

  const handleTimeUp = useCallback(() => {
    resolveRound()
  }, [resolveRound])

  return (
    <ScreenShake trigger={shaking}>
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 stars-bg screen-enter flex flex-col p-4 gap-4">
      {!countdownDone && (
        <Countdown
          playerNames={players.map(p => p.name)}
          eventName="Spelling Bee"
          onComplete={() => setCountdownDone(true)}
        />
      )}
      <QuitButton />
      <BadgeToast badge={earnedBadge} />
      <FlashOverlay type={flashType} />

      {/* Spelling Bee Scene */}
      <SpellingBeeScene
        players={players}
        eliminated={eliminated}
        roundNumber={roundNumber}
      />

      {/* Timer */}
      {countdownDone && !showingResult && <Timer onTimeUp={handleTimeUp} resetKey={timerKey} timeLimit={timePerQuestion} />}

      {/* Lock-in indicators */}
      {!showingResult && <LockInIndicator players={activePlayers} lockedIn={lockedIn} />}

      {/* Problem or Results */}
      <div className="flex-1 flex items-center justify-center relative">
        <ParticleBurst active={showBurst} color="#facc15" />
        {showingResult && roundResultData ? (
          <div className="pixel-card rounded-lg p-6 w-full max-w-3xl mx-auto screen-enter">
            <div className="text-center mb-4">
              <span className="font-pixel text-sm text-white/60 mr-2">ANSWER:</span>
              <span className="font-pixel text-lg text-green-400 text-glow">
                {currentProblem.choices[currentProblem.correctIndex]}
              </span>
            </div>
            <div className="flex gap-6 flex-wrap justify-center">
              {players.map(player => {
                const pid = player.id as PlayerId
                const wasAlreadyOut = eliminated.has(pid) && !roundResultData.newlyEliminated.has(pid)
                if (wasAlreadyOut) return null

                const answer = roundResultData.answers.get(pid) ?? null
                const isCorrect = answer?.correct
                const justEliminated = roundResultData.newlyEliminated.has(pid)

                return (
                  <div key={player.id} className="flex flex-col items-center gap-2">
                    <PlayerAvatar
                      name={player.name}
                      color={player.color}
                      size={50}
                      avatarUrl={player.avatarUrl}
                    />
                    <div className={`font-pixel text-[10px] font-bold px-3 py-1.5 rounded ${
                      isCorrect
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : justEliminated
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {isCorrect ? 'SAFE!' : justEliminated ? 'ELIMINATED!' : 'MERCY!'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-3xl mx-auto">
            {/* Spelling word display with larger font */}
            <div className="text-center mb-4">
              <span
                className="font-pixel text-2xl text-yellow-300 tracking-[0.3em]"
                style={{ textShadow: '0 0 12px rgba(250,204,21,0.4)' }}
              >
                {currentProblem.question}
              </span>
              <div className="font-pixel text-[8px] text-white/40 mt-2">
                Fill in the missing letter{currentProblem.question.split('_').length > 2 ? 's' : ''}
              </div>
            </div>
            <MathProblem
              problem={currentProblem}
              onAnswer={(i) => handleAnswer(1, i)}
              lockedP1={answersRef.current.has(1)}
              lockedP2={answersRef.current.has(2)}
              p1Keys={['1', '2', '3', '4']}
              p2Keys={['1', '2', '3', '4']}
              controllerType={controllerType}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center">
        <div className="font-pixel text-[8px] text-white/30">ROUND #{roundNumber}</div>
        <ControllerHint controllerType={controllerType} />
      </div>
    </div>
    </ScreenShake>
  )
}
