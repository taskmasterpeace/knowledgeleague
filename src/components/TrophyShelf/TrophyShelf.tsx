import { useState } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { getAllProfiles } from '../../utils/playerProfile'
import type { PlayerProfile } from '../../utils/playerProfile'
import { BadgeIcon } from '../shared/BadgeIcon'
import type { ProblemType, Badge } from '../../types'

const CATEGORIES: { key: ProblemType; label: string }[] = [
  { key: 'addition', label: 'Addition' },
  { key: 'subtraction', label: 'Subtraction' },
  { key: 'missing', label: 'Missing Number' },
  { key: 'comparison', label: 'Comparison' },
  { key: 'skip-counting', label: 'Skip Counting' },
]

const TIERS: Badge['tier'][] = ['bronze', 'silver', 'gold', 'master']

const TIER_LABELS: Record<Badge['tier'], string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  master: 'Master',
}

function getFavoriteCategory(profile: PlayerProfile): string {
  let best: ProblemType = 'addition'
  let bestCount = -1
  for (const cat of CATEGORIES) {
    const correct = profile.stats[cat.key]?.correct ?? 0
    if (correct > bestCount) {
      bestCount = correct
      best = cat.key
    }
  }
  const found = CATEGORIES.find(c => c.key === best)
  return found ? found.label : 'None'
}

function getAvgResponseTime(profile: PlayerProfile): string {
  let totalMs = 0
  let totalAttempts = 0
  for (const cat of CATEGORIES) {
    const stats = profile.stats[cat.key]
    if (stats) {
      totalMs += stats.totalResponseTimeMs
      totalAttempts += stats.attempts
    }
  }
  if (totalAttempts === 0) return '—'
  const avgSec = totalMs / totalAttempts / 1000
  return `${avgSec.toFixed(1)}s`
}

export function TrophyShelf() {
  const { setPhase } = useGameState()
  const profiles = getAllProfiles()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const profile = profiles[selectedIndex] ?? null

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-950 flex flex-col items-center p-6 gap-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-6xl font-black text-white tracking-tighter drop-shadow-lg">
          🏆 TROPHIES
        </h1>
      </div>

      {/* Profile selector */}
      {profiles.length > 1 && (
        <select
          value={selectedIndex}
          onChange={e => setSelectedIndex(Number(e.target.value))}
          className="px-4 py-2 rounded-xl bg-white/10 text-white border border-white/20 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          {profiles.map((p, i) => (
            <option key={p.id} value={i} style={{ color: '#000' }}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      {/* No profiles */}
      {profiles.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white/50 text-2xl font-semibold text-center">
            No profiles yet — play a game first!
          </div>
        </div>
      )}

      {/* Badge grid */}
      {profile && (
        <div className="w-full max-w-2xl flex flex-col gap-4">
          {CATEGORIES.map(cat => (
            <div
              key={cat.key}
              className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4"
            >
              <div className="text-white font-bold text-lg w-40 shrink-0">
                {cat.label}
              </div>
              <div className="flex gap-4 flex-1 justify-center">
                {TIERS.map(tier => {
                  const earned = profile.badges.some(
                    b => b.category === cat.key && b.tier === tier
                  )
                  return (
                    <div
                      key={tier}
                      className="flex flex-col items-center gap-1"
                      title={`${TIER_LABELS[tier]}${earned ? ' (earned)' : ''}`}
                    >
                      <BadgeIcon tier={tier} size={36} earned={earned} />
                      <span
                        className="text-xs font-semibold"
                        style={{ color: earned ? '#fbbf24' : 'rgba(255,255,255,0.2)' }}
                      >
                        {TIER_LABELS[tier]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats footer */}
      {profile && (
        <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex flex-wrap gap-6 justify-around text-center">
          <div>
            <div className="text-white/40 text-xs uppercase tracking-widest font-semibold">Games Played</div>
            <div className="text-white text-2xl font-black">{profile.gamesPlayed}</div>
          </div>
          <div>
            <div className="text-white/40 text-xs uppercase tracking-widest font-semibold">Total Correct</div>
            <div className="text-white text-2xl font-black">{profile.totalCorrect}</div>
          </div>
          <div>
            <div className="text-white/40 text-xs uppercase tracking-widest font-semibold">Favorite Category</div>
            <div className="text-white text-2xl font-black">{getFavoriteCategory(profile)}</div>
          </div>
          <div>
            <div className="text-white/40 text-xs uppercase tracking-widest font-semibold">Avg Response</div>
            <div className="text-white text-2xl font-black">{getAvgResponseTime(profile)}</div>
          </div>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => setPhase('menu')}
        className="w-full max-w-sm py-4 bg-white/10 hover:bg-white/20 text-white text-2xl font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 border border-white/20"
      >
        ← BACK
      </button>
    </div>
  )
}
