import { useEffect, useMemo } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { usePeerContext } from '../../hooks/usePeerContext'
import { getLastGameAnalytics } from '../../utils/gameAnalyticsStore'
import { computeSuperlatives } from '../../utils/playerAnalytics'
import { sounds } from '../../utils/sounds'
import { playMusic } from '../../utils/backgroundMusic'
import type { BehaviorTag, Superlative } from '../../types'

function tierLabel(tier: number | undefined): string {
  if (tier === 1) return 'EASY'
  if (tier === 2) return 'MEDIUM'
  if (tier === 3) return 'HARD'
  return `TIER ${tier}`
}

const TAG_EMOJI: Record<BehaviorTag, string> = {
  'on-fire': '🔥',
  'mashing': '⚡',
  'guessing': '🎲',
  'thinking': '🧠',
  'struggling': '😟',
  'warming-up': '📈',
  'playing': '🎮',
}

export function PostGameStats() {
  const { setPhase, rematch } = useGameState()
  usePeerContext()

  const { analytics, playerNames } = useMemo(() => getLastGameAnalytics(), [])

  const superlatives = useMemo<Superlative[]>(() => {
    if (!analytics || !playerNames) return []
    return computeSuperlatives(analytics, playerNames)
  }, [analytics, playerNames])

  useEffect(() => {
    sounds.navigate()
    playMusic('stats')
  }, [])

  // Empty state
  if (!analytics || analytics.size === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 stars-bg screen-enter flex flex-col items-center justify-center gap-6 p-8">
        <div className="font-pixel text-white/60 text-sm">NO STATS AVAILABLE</div>
        <button
          onClick={() => setPhase('trophies')}
          className="pixel-btn font-pixel py-3 px-8 bg-indigo-700 hover:bg-indigo-600 text-white text-xs rounded-lg transition-colors"
        >
          CONTINUE
        </button>
      </div>
    )
  }

  const playerEntries = [...analytics.entries()]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 stars-bg screen-enter flex flex-col items-center gap-8 p-6 overflow-y-auto">
      {/* Header */}
      <div className="text-center mt-4">
        <h1 className="font-pixel text-xl text-cyan-300 tracking-wide">GAME STATS</h1>
        <div className="mt-1 w-24 h-0.5 bg-cyan-500/40 mx-auto" />
      </div>

      {/* Player Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl">
        {playerEntries.map(([playerId, stat]) => {
          const name = playerNames?.get(playerId) ?? `Player ${playerId}`
          const accuracy = stat.answersTotal > 0
            ? Math.round((stat.answersCorrect / stat.answersTotal) * 100)
            : 0
          const avgTimeMs = stat.responseTimes.length > 0
            ? stat.responseTimes.reduce((s, t) => s + t, 0) / stat.responseTimes.length
            : 0
          const avgTime = stat.responseTimes.length > 0
            ? `${(avgTimeMs / 1000).toFixed(1)}s`
            : '—'
          const tagEmoji = TAG_EMOJI[stat.behaviorTag] ?? '🎮'

          // Tier progression: did the tier change?
          const firstTier = stat.adaptiveHistory[0]
          const lastTier = stat.adaptiveHistory[stat.adaptiveHistory.length - 1]
          const tierChanged = firstTier !== undefined && lastTier !== undefined && firstTier !== lastTier

          // Category accuracy — top 3 categories with data
          const catEntries = Object.entries(stat.categoryAccuracy)
            .filter(([, v]) => v.total > 0)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 3)

          return (
            <div key={playerId} className="pixel-card rounded-lg p-4 flex flex-col gap-3 border border-white/10">
              {/* Name */}
              <div className="font-pixel-body font-bold text-base text-white text-center truncate">{name}</div>

              {/* Behavior tag */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">{tagEmoji}</span>
                <span className="font-pixel-body font-bold text-sm text-cyan-400 uppercase">{stat.behaviorTag}</span>
              </div>

              {/* Accuracy */}
              <div className="flex flex-col items-center gap-1">
                <div className="font-pixel-body font-semibold text-sm text-white/50 uppercase">Accuracy</div>
                <div className="font-pixel-body font-bold text-lg text-yellow-300">{accuracy}%</div>
                <div className="font-pixel-body font-semibold text-xs text-white/40">
                  {stat.answersCorrect}/{stat.answersTotal}
                </div>
                {/* Accuracy bar */}
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
              </div>

              {/* Avg response time */}
              <div className="flex flex-col items-center gap-0.5">
                <div className="font-pixel-body font-semibold text-sm text-white/50 uppercase">Avg Time</div>
                <div className="font-pixel-body font-bold text-base text-green-300">{avgTime}</div>
              </div>

              {/* Adaptive tier progression */}
              {tierChanged && (
                <div className="flex items-center justify-center gap-1 bg-purple-900/30 rounded px-2 py-1">
                  <span className="font-pixel-body font-semibold text-xs text-purple-300">
                    {tierLabel(firstTier)} → {tierLabel(lastTier)}
                    {(lastTier ?? 0) > (firstTier ?? 0) ? ' ▲' : ' ▼'}
                  </span>
                </div>
              )}

              {/* Category accuracy breakdown */}
              {catEntries.length > 0 && (
                <div className="flex flex-col gap-1.5 border-t border-white/10 pt-2">
                  <div className="font-pixel-body font-semibold text-xs text-white/40 uppercase text-center">Categories</div>
                  {catEntries.map(([cat, { correct, total }]) => {
                    const catPct = Math.round((correct / total) * 100)
                    return (
                      <div key={cat} className="flex flex-col gap-0.5">
                        <div className="flex justify-between">
                          <span className="font-pixel-body font-semibold text-xs text-white/60 capitalize truncate">{cat}</span>
                          <span className="font-pixel-body font-semibold text-xs text-white/60">{catPct}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full"
                            style={{ width: `${catPct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Superlatives */}
      {superlatives.length > 0 && (
        <div className="w-full max-w-5xl">
          <h2 className="font-pixel text-sm text-yellow-300 text-center mb-4">AWARDS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {superlatives.map((sup, i) => (
              <div key={i} className="pixel-card rounded-lg p-4 border border-yellow-500/20 flex items-start gap-3">
                {/* Trophy icon */}
                <div className="shrink-0 w-8 h-8 flex items-center justify-center bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="font-pixel-body font-bold text-sm text-yellow-300 uppercase">{sup.award}</div>
                  <div className="font-pixel-body font-semibold text-sm text-white truncate">{sup.playerName}</div>
                  <div className="font-pixel-body font-semibold text-xs text-white/50">{sup.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-4 pb-8">
        <button
          onClick={rematch}
          className="pixel-btn font-pixel py-3 px-6 bg-cyan-700 hover:bg-cyan-600 text-white text-xs rounded-lg transition-colors"
        >
          REMATCH
        </button>
        <button
          onClick={() => setPhase('trophies')}
          className="pixel-btn font-pixel py-3 px-8 bg-indigo-700 hover:bg-indigo-600 text-white text-xs rounded-lg transition-colors"
        >
          CONTINUE
        </button>
      </div>
    </div>
  )
}
