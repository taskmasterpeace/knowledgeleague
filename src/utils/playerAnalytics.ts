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
      value: `${(fastestAvg / 1000).toFixed(1)}s avg speed`,
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
    if (a.responseTimes.length < 6) continue
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
