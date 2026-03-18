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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 stars-bg screen-enter flex flex-col items-center p-6 gap-5">
      {/* Header */}
      <div className="text-center mt-2">
        <h1 className="font-pixel text-3xl text-yellow-300 text-glow-gold leading-relaxed">
          TROPHIES
        </h1>
      </div>

      {/* Profile selector */}
      {profiles.length > 1 && (
        <select
          value={selectedIndex}
          onChange={e => setSelectedIndex(Number(e.target.value))}
          className="pixel-card rounded-lg px-4 py-2 text-white font-pixel text-[9px] focus:outline-none border-0 cursor-pointer"
          style={{ background: 'linear-gradient(180deg, rgba(30,30,60,0.95) 0%, rgba(20,20,50,0.98) 100%)' }}
        >
          {profiles.map((p, i) => (
            <option key={p.id} value={i} style={{ color: '#000', background: '#fff' }}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      {/* No profiles */}
      {profiles.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="pixel-card rounded-lg p-8 text-center">
            <div className="font-pixel text-[10px] text-white/50 leading-loose">
              No profiles yet —<br />play a game first!
            </div>
          </div>
        </div>
      )}

      {/* Badge grid */}
      {profile && (
        <div className="w-full max-w-2xl flex flex-col gap-3">
          {CATEGORIES.map(cat => (
            <div
              key={cat.key}
              className="pixel-card rounded-lg flex items-center gap-4 px-4 py-3"
            >
              <div className="font-pixel text-[8px] text-white/80 w-32 shrink-0 leading-relaxed">
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
                        className="font-pixel text-[6px]"
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
        <div className="pixel-card rounded-lg w-full max-w-2xl px-6 py-4 flex flex-wrap gap-6 justify-around text-center">
          <div>
            <div className="font-pixel text-[7px] text-white/40 uppercase mb-1">Games Played</div>
            <div className="font-pixel text-lg text-white text-glow">{profile.gamesPlayed}</div>
          </div>
          <div>
            <div className="font-pixel text-[7px] text-white/40 uppercase mb-1">Total Correct</div>
            <div className="font-pixel text-lg text-green-400">{profile.totalCorrect}</div>
          </div>
          <div>
            <div className="font-pixel text-[7px] text-white/40 uppercase mb-1">Favorite</div>
            <div className="font-pixel text-[9px] text-cyan-300">{getFavoriteCategory(profile)}</div>
          </div>
          <div>
            <div className="font-pixel text-[7px] text-white/40 uppercase mb-1">Avg Time</div>
            <div className="font-pixel text-lg text-yellow-300 text-glow-gold">{getAvgResponseTime(profile)}</div>
          </div>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => setPhase('menu')}
        className="pixel-btn font-pixel w-full max-w-sm py-4 bg-indigo-700 hover:bg-indigo-600 text-white text-[10px] rounded-lg transition-colors"
      >
        BACK TO MENU
      </button>
    </div>
  )
}
