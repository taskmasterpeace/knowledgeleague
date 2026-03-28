import { useState } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { getAllProfiles } from '../../utils/playerProfile'
import type { PlayerProfile } from '../../utils/playerProfile'
import { BadgeIcon } from '../shared/BadgeIcon'
import type { QuestionCategory, Subject, Badge } from '../../types'

interface CategoryEntry {
  key: QuestionCategory
  label: string
}

const SUBJECT_SECTIONS: { subject: Subject; label: string; color: string; categories: CategoryEntry[] }[] = [
  {
    subject: 'math',
    label: 'MATH',
    color: 'text-cyan-300',
    categories: [
      { key: 'addition', label: 'Addition' },
      { key: 'subtraction', label: 'Subtraction' },
      { key: 'missing', label: 'Missing Number' },
      { key: 'comparison', label: 'Comparison' },
      { key: 'skip-counting', label: 'Skip Counting' },
      { key: 'multiplication', label: 'Multiplication' },
      { key: 'division', label: 'Division' },
      { key: 'fractions', label: 'Fractions' },
      { key: 'rounding', label: 'Rounding' },
      { key: 'percentages', label: 'Percentages' },
      { key: 'order-of-operations', label: 'Order of Ops' },
      { key: 'square-roots', label: 'Square Roots' },
      { key: 'estimation', label: 'Estimation' },
    ],
  },
  {
    subject: 'science',
    label: 'SCIENCE',
    color: 'text-green-300',
    categories: [
      { key: 'animals', label: 'Animals' },
      { key: 'plants', label: 'Plants' },
      { key: 'body-senses', label: 'Body & Senses' },
      { key: 'weather', label: 'Weather' },
      { key: 'space', label: 'Space' },
      { key: 'materials', label: 'Materials' },
      { key: 'water-cycle', label: 'Water Cycle' },
      { key: 'forces', label: 'Forces' },
      { key: 'food-chains', label: 'Food Chains' },
      { key: 'fossils', label: 'Fossils' },
      { key: 'traits', label: 'Traits' },
      { key: 'magnets', label: 'Magnets' },
      { key: 'matter', label: 'Matter' },
      { key: 'chemistry', label: 'Chemistry' },
      { key: 'biology', label: 'Biology' },
      { key: 'physics', label: 'Physics' },
      { key: 'astronomy', label: 'Astronomy' },
      { key: 'earth-science', label: 'Earth Science' },
    ],
  },
  {
    subject: 'reading',
    label: 'READING',
    color: 'text-purple-300',
    categories: [
      { key: 'rhyming', label: 'Rhyming' },
      { key: 'opposites', label: 'Opposites' },
      { key: 'beginning-sounds', label: 'Beginning Sounds' },
      { key: 'fill-in-blank', label: 'Fill in Blank' },
      { key: 'word-meaning', label: 'Word Meaning' },
      { key: 'sight-words', label: 'Sight Words' },
      { key: 'vocabulary', label: 'Vocabulary' },
      { key: 'grammar', label: 'Grammar' },
      { key: 'figurative-language', label: 'Figurative Lang.' },
      { key: 'parts-of-speech', label: 'Parts of Speech' },
      { key: 'sentence-correction', label: 'Sentence Fix' },
      { key: 'etymology', label: 'Etymology' },
      { key: 'analogies', label: 'Analogies' },
      { key: 'spelling', label: 'Spelling' },
    ],
  },
]

const ALL_CATEGORIES = SUBJECT_SECTIONS.flatMap(s => s.categories)

const TIERS: Badge['tier'][] = ['bronze', 'silver', 'gold', 'master']

const TIER_LABELS: Record<Badge['tier'], string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  master: 'Master',
}

function getFavoriteCategory(profile: PlayerProfile): string {
  let best: QuestionCategory | null = null
  let bestCount = -1
  for (const cat of ALL_CATEGORIES) {
    const correct = profile.stats[cat.key]?.correct ?? 0
    if (correct > bestCount) {
      bestCount = correct
      best = cat.key
    }
  }
  if (!best || bestCount <= 0) return 'None'
  const found = ALL_CATEGORIES.find(c => c.key === best)
  return found ? found.label : 'None'
}

function getAvgResponseTime(profile: PlayerProfile): string {
  let totalMs = 0
  let totalAttempts = 0
  for (const key of Object.keys(profile.stats)) {
    const stats = profile.stats[key]
    if (stats) {
      totalMs += stats.totalResponseTimeMs
      totalAttempts += stats.attempts
    }
  }
  if (totalAttempts === 0) return '—'
  const avgSec = totalMs / totalAttempts / 1000
  return `${avgSec.toFixed(1)}s`
}

function hasAnyBadgesInSubject(profile: PlayerProfile, categories: CategoryEntry[]): boolean {
  return categories.some(cat =>
    profile.badges.some(b => b.category === cat.key)
  )
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
          className="pixel-card rounded-lg px-4 py-2 text-white font-pixel-body font-bold text-sm focus:outline-none border-0 cursor-pointer"
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
            <div className="font-pixel-body font-semibold text-base text-white/50 leading-loose">
              No profiles yet —<br />play a game first!
            </div>
          </div>
        </div>
      )}

      {/* Badge grid grouped by subject */}
      {profile && (
        <div className="w-full max-w-2xl flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          {SUBJECT_SECTIONS.map(section => {
            // Only show categories where player has stats or badges
            const relevantCats = section.categories.filter(cat =>
              profile.stats[cat.key] || profile.badges.some(b => b.category === cat.key)
            )
            // Always show at least the section header if they have any activity
            if (relevantCats.length === 0 && !hasAnyBadgesInSubject(profile, section.categories)) {
              return null
            }
            const catsToShow = relevantCats.length > 0 ? relevantCats : section.categories.slice(0, 3)

            return (
              <div key={section.subject}>
                {/* Subject header */}
                <div className={`font-pixel text-xs ${section.color} mb-2 px-1`}>
                  {section.label}
                </div>
                <div className="flex flex-col gap-2">
                  {catsToShow.map(cat => (
                    <div
                      key={cat.key}
                      className="pixel-card rounded-lg flex items-center gap-4 px-4 py-2.5"
                    >
                      <div className="font-pixel-body font-bold text-sm text-white/80 w-28 shrink-0 leading-relaxed">
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
                              <BadgeIcon tier={tier} size={32} earned={earned} />
                              <span
                                className="font-pixel-body font-semibold text-xs"
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
              </div>
            )
          })}

          {/* Show message if no activity at all */}
          {!SUBJECT_SECTIONS.some(s => s.categories.some(cat =>
            profile.stats[cat.key] || profile.badges.some(b => b.category === cat.key)
          )) && (
            <div className="pixel-card rounded-lg p-6 text-center">
              <div className="font-pixel-body font-semibold text-sm text-white/40">
                Play some games to start earning badges!
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats footer */}
      {profile && (
        <div className="pixel-card rounded-lg w-full max-w-2xl px-6 py-4 flex flex-wrap gap-6 justify-around text-center">
          <div>
            <div className="font-pixel-body font-semibold text-xs text-white/40 uppercase mb-1">Games Played</div>
            <div className="font-pixel-body font-bold text-lg text-white text-glow">{profile.gamesPlayed}</div>
          </div>
          <div>
            <div className="font-pixel-body font-semibold text-xs text-white/40 uppercase mb-1">Total Correct</div>
            <div className="font-pixel-body font-bold text-lg text-green-400">{profile.totalCorrect}</div>
          </div>
          <div>
            <div className="font-pixel-body font-semibold text-xs text-white/40 uppercase mb-1">Favorite</div>
            <div className="font-pixel-body font-bold text-sm text-cyan-300">{getFavoriteCategory(profile)}</div>
          </div>
          <div>
            <div className="font-pixel-body font-semibold text-xs text-white/40 uppercase mb-1">Avg Time</div>
            <div className="font-pixel-body font-bold text-lg text-yellow-300 text-glow-gold">{getAvgResponseTime(profile)}</div>
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
