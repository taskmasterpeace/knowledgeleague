import { useCallback, useState, useRef, useEffect } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { useQuestionEngine } from '../../hooks/useQuestionEngine'
import { useKeyboardInput } from '../../hooks/useKeyboardInput'
import { useGamepad } from '../../hooks/useGamepad'
import { useCPU } from '../../hooks/useCPU'
import { MathProblem } from '../shared/MathProblem'
import { Timer } from '../shared/Timer'
import { ControllerHint } from '../shared/ControllerButtons'
import { ScreenShake, FlashOverlay, ParticleBurst } from '../shared/Effects'
import { useSettings } from '../../hooks/useSettings'
import { sounds } from '../../utils/sounds'
import type { PlayerId, Badge, PlayerAnalytics, Difficulty } from '../../types'
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
import { LongJumpScene } from './LongJumpScene'
import { LockInIndicator } from '../shared/LockInIndicator'
import Countdown from '../shared/Countdown'

type GamePhase = 'countdown' | 'building' | 'jumping' | 'results'

interface MomentumState {
  correct: number
  totalScore: number
  eliminated: boolean
}

// Difficulty multipliers for scoring
const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
}

// Question difficulty progression: questions 1-3 easy, 4-6 medium, 7-10 hard
function getQuestionDifficulty(questionNumber: number): Difficulty {
  if (questionNumber <= 3) return 'easy'
  if (questionNumber <= 6) return 'medium'
  return 'hard'
}

const MAX_QUESTIONS = 10

// Max possible score: 3 easy (3) + 3 medium (6) + 4 hard (12) = 21
const MAX_POSSIBLE_SCORE = 3 * 1 + 3 * 2 + 4 * 3

export function LongJump() {
  const {
    players, setWinner, cpuCharacter,
    controllerType, setControllerType,
    incrementScore,
  } = useGameState()
  const { timePerQuestion, difficulty, soundEnabled, gradeLevel } = useSettings()
  const [questionNumber, setQuestionNumber] = useState(1)
  const currentDifficulty = getQuestionDifficulty(questionNumber)

  // Use fixed difficulty based on question progression, not adaptive
  const { currentProblem, nextProblem, problemCount } = useQuestionEngine(
    difficulty === 'adaptive' ? currentDifficulty : difficulty
  )

  const [phase, setPhase] = useState<GamePhase>('countdown')
  const [timerKey, setTimerKey] = useState(0)
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

  // Player momentum tracking
  const [playerMomentum, setPlayerMomentum] = useState<Map<PlayerId, MomentumState>>(
    () => new Map(players.map(p => [p.id as PlayerId, { correct: 0, totalScore: 0, eliminated: false }]))
  )

  // Jump phase state
  const [jumpingPlayer, setJumpingPlayer] = useState<PlayerId | null>(null)
  const [jumpDistances, setJumpDistances] = useState<Map<PlayerId, number>>(new Map())
  const [jumpQueue, setJumpQueue] = useState<PlayerId[]>([])

  const answersRef = useRef<Map<PlayerId, { choiceIndex: number; correct: boolean; timestamp: number }>>(new Map())
  const roundResolvedRef = useRef(false)
  const profilesRef = useRef<Map<number, string>>(new Map())
  const timerStartRef = useRef(0)
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
    if (phase === 'building') {
      broadcastProblem(currentProblem.question, currentProblem.choices, currentProblem.subject)
    }
  }, [currentProblem, broadcastProblem, phase])

  // Check if all players are eliminated or max questions reached
  const checkBuildingComplete = useCallback((momentum: Map<PlayerId, MomentumState>, qNum: number) => {
    const allEliminated = players.every(p => momentum.get(p.id as PlayerId)?.eliminated)
    return allEliminated || qNum > MAX_QUESTIONS
  }, [players])

  // Start the jump animation sequence
  const startJumpPhase = useCallback((momentum: Map<PlayerId, MomentumState>) => {
    setPhase('jumping')

    // Build jump queue — order by score (lowest first so best jumper goes last for drama)
    const sorted = [...players]
      .map(p => ({ id: p.id as PlayerId, score: momentum.get(p.id as PlayerId)?.totalScore ?? 0 }))
      .sort((a, b) => a.score - b.score)

    setJumpQueue(sorted.map(s => s.id))
  }, [players])

  // Process jump queue — animate one player at a time
  useEffect(() => {
    if (phase !== 'jumping') return
    if (jumpQueue.length === 0) {
      // All jumps complete — go to results
      setTimeout(() => {
        setPhase('results')
      }, 500)
      return
    }

    const nextJumper = jumpQueue[0]
    const score = playerMomentum.get(nextJumper)?.totalScore ?? 0

    setJumpingPlayer(nextJumper)

    // After animation duration, record the landing and move to next
    const animDuration = 1500
    const timer = setTimeout(() => {
      setJumpDistances(prev => {
        const next = new Map(prev)
        next.set(nextJumper, score)
        return next
      })
      setJumpingPlayer(null)

      // Small pause, then next jumper
      setTimeout(() => {
        setJumpQueue(prev => prev.slice(1))
      }, 600)
    }, animDuration)

    return () => clearTimeout(timer)
  }, [phase, jumpQueue, playerMomentum])

  // Determine winner when results phase begins
  useEffect(() => {
    if (phase !== 'results') return

    // Wait a moment for the display, then declare winner
    const timer = setTimeout(() => {
      let bestId: PlayerId | null = null
      let bestScore = -1

      for (const player of players) {
        const pid = player.id as PlayerId
        const score = playerMomentum.get(pid)?.totalScore ?? 0
        if (score > bestScore) {
          bestScore = score
          bestId = pid
        }
      }

      if (bestId !== null) {
        // Update final scores for display
        for (const player of players) {
          const pid = player.id as PlayerId
          const score = playerMomentum.get(pid)?.totalScore ?? 0
          // Set position to score for victory screen
          if (score > 0) {
            incrementScore(pid)
          }
        }

        storeGameAnalytics(analyticsRef.current, new Map(players.map(p => [p.id as PlayerId, p.name])))
        setWinner(bestId)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [phase, players, playerMomentum, setWinner, incrementScore])

  const resolveRound = useCallback(() => {
    if (roundResolvedRef.current) return
    roundResolvedRef.current = true

    const answers = answersRef.current
    let anyHumanCorrect = false
    const updatedMomentum = new Map(playerMomentum)
    let newQuestionNumber = questionNumber

    for (const player of players) {
      const pid = player.id as PlayerId
      const prev = updatedMomentum.get(pid)
      if (!prev || prev.eliminated) continue

      const answer = answers.get(pid) ?? null

      if (answer?.correct) {
        // Correct: add momentum with difficulty multiplier
        const multiplier = DIFFICULTY_MULTIPLIER[currentDifficulty]
        const newCorrect = prev.correct + 1
        const newScore = prev.totalScore + multiplier
        updatedMomentum.set(pid, {
          correct: newCorrect,
          totalScore: newScore,
          eliminated: false,
        })
        if (player.type === 'human') anyHumanCorrect = true
        incrementScore(pid)
      } else {
        // Wrong or no answer: eliminated
        updatedMomentum.set(pid, {
          ...prev,
          eliminated: true,
        })
      }
    }

    // Record answers for human players (profiles + badges)
    for (const player of players) {
      if (player.type !== 'human') continue
      const pid = player.id as PlayerId
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

    // Update analytics for all players
    for (const player of players) {
      const pid = player.id as PlayerId
      const answer = answers.get(pid) ?? null
      const responseTime = answer ? answer.timestamp - timerStartRef.current : timePerQuestion
      const prevAnalytics = analyticsRef.current.get(pid)
      if (prevAnalytics) {
        const updated = recordAnalyticsAnswer(
          prevAnalytics,
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
      const humanCorrect = players.find(p => {
        if (p.type !== 'human') return false
        return answers.get(p.id as PlayerId)?.correct === true
      })
      if (humanCorrect) announceCorrect(humanCorrect.name, humanCorrect.streak + 1)
    } else {
      const firstHuman = players.find(p => p.type === 'human')
      if (firstHuman) announceWrong(firstHuman.name, firstHuman.streak > 0)
    }

    // Broadcast correct answer
    broadcastResult(currentProblem.correctIndex)

    setPlayerMomentum(updatedMomentum)
    newQuestionNumber = questionNumber + 1

    // Check if building phase is over
    if (checkBuildingComplete(updatedMomentum, newQuestionNumber)) {
      // Short delay to show the last result, then jump phase
      setTimeout(() => {
        startJumpPhase(updatedMomentum)
      }, 1500)
    } else {
      // Next question after brief pause
      setTimeout(() => {
        answersRef.current = new Map()
        roundResolvedRef.current = false
        setEarnedBadge(null)
        resetLockIn()
        setQuestionNumber(newQuestionNumber)
        nextProblem()
        timerStartRef.current = Date.now()
        setTimerKey(k => k + 1)
      }, 1500)
    }
  }, [
    players, currentProblem, currentDifficulty, questionNumber, playerMomentum,
    timePerQuestion, incrementScore, nextProblem, broadcastResult, soundEnabled,
    announceCorrect, announceWrong, resetLockIn, checkBuildingComplete, startJumpPhase,
  ])

  const handleAnswer = useCallback((playerId: PlayerId, choiceIndex: number) => {
    if (phase !== 'building') return

    // If player already eliminated, ignore
    const momentum = playerMomentum.get(playerId)
    if (momentum?.eliminated) return

    // If already answered this round, ignore
    if (answersRef.current.has(playerId)) return

    const isCorrect = choiceIndex === currentProblem.correctIndex
    answersRef.current.set(playerId, { choiceIndex, correct: isCorrect, timestamp: Date.now() })
    onLockIn(playerId)

    // Count how many non-eliminated players there are
    const activePlayers = players.filter(p => !playerMomentum.get(p.id as PlayerId)?.eliminated)

    // If all active players have answered, resolve immediately
    if (answersRef.current.size >= activePlayers.length) {
      resolveRound()
    }
  }, [currentProblem, phase, resolveRound, players, playerMomentum, onLockIn])

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
    enabled: countdownDone && phase === 'building',
    playerCount: humanCount,
  })

  useGamepad({
    onP1Answer: (i) => handleAnswer(1, i),
    onP2Answer: (i) => {
      if (players[1]?.type === 'human') handleAnswer(2, i)
    },
    enabled: countdownDone && phase === 'building',
    onControllerChange: setControllerType,
  })

  // CPU player
  const cpuPlayer = players.find(p => p.type === 'cpu')
  useCPU({
    character: cpuCharacter,
    currentProblem,
    enabled: !!cpuPlayer && countdownDone && phase === 'building' && !playerMomentum.get(cpuPlayer?.id as PlayerId)?.eliminated,
    onAnswer: (i) => { if (cpuPlayer) handleAnswer(cpuPlayer.id as PlayerId, i) },
    streak: cpuPlayer?.streak ?? 0,
  })

  const handleTimeUp = useCallback(() => {
    resolveRound()
  }, [resolveRound])

  // Determine if we're showing results between rounds (brief pause after answer)
  const showingResult = roundResolvedRef.current

  // Count how many players are still active
  const activePlayers = players.filter(p => !playerMomentum.get(p.id as PlayerId)?.eliminated)
  const eliminatedCount = players.length - activePlayers.length

  // Scene phase mapping
  const scenePhase = phase === 'countdown' || phase === 'building' ? 'building' : phase

  return (
    <ScreenShake trigger={shaking}>
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 stars-bg screen-enter flex flex-col p-4 gap-4">
      {!countdownDone && (
        <Countdown
          playerNames={players.map(p => p.name)}
          eventName="Long Jump"
          onComplete={() => { setCountdownDone(true); setPhase('building') }}
        />
      )}
      <QuitButton />
      <BadgeToast badge={earnedBadge} />
      <FlashOverlay type={flashType} />

      {/* Scene */}
      <LongJumpScene
        players={players}
        playerMomentum={playerMomentum}
        phase={scenePhase}
        jumpingPlayer={jumpingPlayer}
        jumpDistances={jumpDistances}
        maxPossibleScore={MAX_POSSIBLE_SCORE}
      />

      {/* Building phase UI */}
      {phase === 'building' && (
        <>
          {/* Difficulty indicator */}
          <div className="flex justify-center items-center gap-4">
            <div className="font-pixel text-[8px] text-white/50">
              QUESTION {questionNumber}/{MAX_QUESTIONS}
            </div>
            <div className={`font-pixel text-[8px] px-2 py-1 rounded ${
              currentDifficulty === 'easy'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : currentDifficulty === 'medium'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {currentDifficulty.toUpperCase()}
              {' '}(x{DIFFICULTY_MULTIPLIER[currentDifficulty]})
            </div>
            {eliminatedCount > 0 && (
              <div className="font-pixel text-[7px] text-red-400/60">
                {eliminatedCount} ELIMINATED
              </div>
            )}
          </div>

          {/* Timer */}
          {countdownDone && !showingResult && <Timer onTimeUp={handleTimeUp} resetKey={timerKey} timeLimit={timePerQuestion} />}

          {/* Lock-in indicators */}
          {!showingResult && <LockInIndicator players={activePlayers} lockedIn={lockedIn} />}

          {/* Problem */}
          <div className="flex-1 flex items-center justify-center relative">
            <ParticleBurst active={showBurst} color="#4ade80" />
            <MathProblem
              problem={currentProblem}
              onAnswer={(i) => handleAnswer(1, i)}
              lockedP1={answersRef.current.has(1) || (playerMomentum.get(1)?.eliminated ?? false)}
              lockedP2={answersRef.current.has(2) || (playerMomentum.get(2 as PlayerId)?.eliminated ?? false)}
              p1Keys={['1', '2', '3', '4']}
              p2Keys={['1', '2', '3', '4']}
              controllerType={controllerType}
            />
          </div>
        </>
      )}

      {/* Jump phase UI */}
      {phase === 'jumping' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="pixel-card rounded-lg p-6 text-center screen-enter">
            <div className="font-pixel text-lg text-cyan-300 text-glow mb-2">JUMP PHASE!</div>
            {jumpingPlayer !== null && (
              <div className="font-pixel text-sm text-white">
                {players.find(p => p.id === jumpingPlayer)?.name} is jumping...
              </div>
            )}
            <div className="flex gap-4 mt-4 justify-center flex-wrap">
              {players.map(player => {
                const pid = player.id as PlayerId
                const distance = jumpDistances.get(pid)
                const momentum = playerMomentum.get(pid)
                return (
                  <div key={player.id} className="flex flex-col items-center gap-1">
                    <div
                      className="font-pixel text-[9px]"
                      style={{ color: player.color }}
                    >
                      {player.name}
                    </div>
                    <div className="font-pixel text-[8px] text-white/60">
                      {distance !== undefined
                        ? `${distance}m`
                        : jumpingPlayer === pid
                        ? '...'
                        : `${momentum?.totalScore ?? 0}m pending`
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Results phase UI */}
      {phase === 'results' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="pixel-card rounded-lg p-8 text-center screen-enter max-w-lg w-full">
            <div className="font-pixel text-lg text-yellow-300 text-glow mb-4">FINAL RESULTS</div>
            <div className="flex flex-col gap-3">
              {[...players]
                .sort((a, b) => {
                  const aScore = playerMomentum.get(a.id as PlayerId)?.totalScore ?? 0
                  const bScore = playerMomentum.get(b.id as PlayerId)?.totalScore ?? 0
                  return bScore - aScore
                })
                .map((player, rank) => {
                  const pid = player.id as PlayerId
                  const momentum = playerMomentum.get(pid)
                  const distance = momentum?.totalScore ?? 0
                  const medal = rank === 0 ? 'GOLD' : rank === 1 ? 'SILVER' : 'BRONZE'
                  const medalColor = rank === 0 ? 'text-yellow-300' : rank === 1 ? 'text-gray-300' : 'text-orange-400'

                  return (
                    <div
                      key={player.id}
                      className="flex items-center gap-4 justify-center"
                    >
                      <span className={`font-pixel text-[10px] ${medalColor}`}>{medal}</span>
                      <span
                        className="font-pixel text-xs"
                        style={{ color: player.color }}
                      >
                        {player.name}
                      </span>
                      <span className="font-pixel text-xs text-white">
                        {distance}m
                      </span>
                      <span className="font-pixel text-[7px] text-white/40">
                        ({momentum?.correct ?? 0} correct)
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center">
        <div className="font-pixel text-[8px] text-white/30">
          {phase === 'building' ? `LONG JUMP - Q${problemCount}` : 'LONG JUMP'}
        </div>
        <ControllerHint controllerType={controllerType} />
      </div>
    </div>
    </ScreenShake>
  )
}
