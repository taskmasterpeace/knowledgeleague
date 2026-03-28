import { useState } from 'react'
import { getAllProfiles } from '../../utils/playerProfile'
import type { PlayerProfile, CategoryStats } from '../../utils/playerProfile'
import { useGameState } from '../../hooks/useGameState'
import { sounds } from '../../utils/sounds'
import type { QuestionCategory } from '../../types'

type SubjectTab = 'math' | 'science' | 'reading'

interface CategoryEntry {
  key: QuestionCategory
  label: string
}

const SUBJECT_CATEGORIES: Record<SubjectTab, CategoryEntry[]> = {
  math: [
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
  science: [
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
  reading: [
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
}

const TAB_COLORS: Record<SubjectTab, { active: string; text: string; accent: string }> = {
  math: { active: 'bg-cyan-500/30 border-cyan-400/50', text: 'text-cyan-300', accent: 'text-cyan-400' },
  science: { active: 'bg-green-500/30 border-green-400/50', text: 'text-green-300', accent: 'text-green-400' },
  reading: { active: 'bg-purple-500/30 border-purple-400/50', text: 'text-purple-300', accent: 'text-purple-400' },
}

const RANK_COLORS = ['text-yellow-300', 'text-gray-300', 'text-amber-600', 'text-white/60']
const RANK_LABELS = ['1ST', '2ND', '3RD']

interface SubjectAggregate {
  profile: PlayerProfile
  totalCorrect: number
  totalAttempts: number
  bestStreak: number
}

interface CategoryRankEntry {
  profile: PlayerProfile
  stats: CategoryStats
}

function aggregateSubject(profile: PlayerProfile, categories: CategoryEntry[]): SubjectAggregate {
  let totalCorrect = 0
  let totalAttempts = 0
  let bestStreak = 0

  for (const cat of categories) {
    const s = profile.stats[cat.key]
    if (s) {
      totalCorrect += s.correct
      totalAttempts += s.attempts
      if (s.bestStreak > bestStreak) bestStreak = s.bestStreak
    }
  }

  return { profile, totalCorrect, totalAttempts, bestStreak }
}

function formatAccuracy(correct: number, attempts: number): string {
  if (attempts === 0) return '—'
  return `${Math.round((correct / attempts) * 100)}%`
}

export function Leaderboards() {
  const { setPhase } = useGameState()
  const [activeTab, setActiveTab] = useState<SubjectTab>('math')
  const profiles = getAllProfiles()

  const handleTabChange = (tab: SubjectTab) => {
    sounds.navigate()
    setActiveTab(tab)
  }

  const handleBack = () => {
    sounds.select()
    setPhase('menu')
  }

  const categories = SUBJECT_CATEGORIES[activeTab]
  const colors = TAB_COLORS[activeTab]

  // Aggregate stats per profile for this subject
  const aggregates: SubjectAggregate[] = profiles
    .map(p => aggregateSubject(p, categories))
    .sort((a, b) => b.totalCorrect - a.totalCorrect)

  // Per-category breakdown: top player per category
  const categoryBreakdown: { cat: CategoryEntry; entries: CategoryRankEntry[] }[] = categories
    .map(cat => {
      const entries: CategoryRankEntry[] = profiles
        .filter(p => p.stats[cat.key] && p.stats[cat.key].attempts > 0)
        .map(p => ({ profile: p, stats: p.stats[cat.key] }))
        .sort((a, b) => b.stats.correct - a.stats.correct)
      return { cat, entries }
    })
    .filter(({ entries }) => entries.length > 0)

  const tabLabels: { id: SubjectTab; label: string }[] = [
    { id: 'math', label: 'MATH' },
    { id: 'science', label: 'SCIENCE' },
    { id: 'reading', label: 'READING' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 stars-bg screen-enter flex flex-col items-center p-6 gap-5">
      {/* Header */}
      <div className="text-center mt-2">
        <h1 className={`font-pixel text-3xl ${colors.text} leading-relaxed`}>
          LEADERBOARDS
        </h1>
      </div>

      {/* Subject Tabs */}
      <div className="flex gap-2 w-full max-w-2xl">
        {tabLabels.map(({ id, label }) => {
          const isActive = activeTab === id
          const c = TAB_COLORS[id]
          return (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex-1 font-pixel text-sm py-2 rounded-lg border transition-all ${
                isActive
                  ? `${c.active} ${c.text} border-current`
                  : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* No profiles */}
      {profiles.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="pixel-card rounded-lg p-8 text-center">
            <div className="font-pixel-body font-semibold text-base text-white/50 leading-loose">
              No profiles yet —<br />play a game to appear here!
            </div>
          </div>
        </div>
      )}

      {profiles.length > 0 && (
        <div className="w-full max-w-2xl flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>

          {/* Overall Rankings */}
          <div>
            <div className={`font-pixel text-xs ${colors.text} mb-2 px-1`}>
              OVERALL RANKINGS
            </div>
            <div className="flex flex-col gap-2">
              {aggregates.filter(a => a.totalAttempts > 0).map((agg, idx) => (
                <div
                  key={agg.profile.id}
                  className="pixel-card rounded-lg flex items-center gap-3 px-4 py-3"
                >
                  {/* Rank */}
                  <div className={`font-pixel-body font-bold text-base w-8 shrink-0 text-center ${RANK_COLORS[Math.min(idx, RANK_COLORS.length - 1)]}`}>
                    {idx < 3 ? RANK_LABELS[idx] : `${idx + 1}`}
                  </div>

                  {/* Name */}
                  <div className="font-pixel-body font-semibold text-sm text-white flex-1 truncate">
                    {agg.profile.name}
                  </div>

                  {/* Correct */}
                  <div className="text-center shrink-0">
                    <div className={`font-pixel-body font-bold text-base ${colors.accent}`}>{agg.totalCorrect}</div>
                    <div className="font-pixel-body font-semibold text-xs text-white/30 uppercase">correct</div>
                  </div>

                  {/* Accuracy */}
                  <div className="text-center shrink-0 w-12">
                    <div className="font-pixel-body font-bold text-sm text-white/80">
                      {formatAccuracy(agg.totalCorrect, agg.totalAttempts)}
                    </div>
                    <div className="font-pixel-body font-semibold text-xs text-white/30 uppercase">acc</div>
                  </div>

                  {/* Best streak */}
                  <div className="text-center shrink-0 w-12">
                    <div className="font-pixel-body font-bold text-sm text-yellow-300">{agg.bestStreak}</div>
                    <div className="font-pixel-body font-semibold text-xs text-white/30 uppercase">streak</div>
                  </div>
                </div>
              ))}

              {aggregates.every(a => a.totalAttempts === 0) && (
                <div className="pixel-card rounded-lg p-4 text-center">
                  <div className="font-pixel-body font-semibold text-sm text-white/40">
                    No activity in this subject yet
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Per-Category Breakdown */}
          {categoryBreakdown.length > 0 && (
            <div>
              <div className={`font-pixel text-xs ${colors.text} mb-2 px-1`}>
                BY CATEGORY
              </div>
              <div className="flex flex-col gap-2">
                {categoryBreakdown.map(({ cat, entries }) => (
                  <div
                    key={cat.key}
                    className="pixel-card rounded-lg px-4 py-3"
                  >
                    {/* Category label */}
                    <div className={`font-pixel text-sm ${colors.text} mb-2`}>
                      {cat.label}
                    </div>

                    {/* Top 3 entries */}
                    <div className="flex flex-col gap-1.5">
                      {entries.slice(0, 3).map((entry, idx) => (
                        <div key={entry.profile.id} className="flex items-center gap-3">
                          <div className={`font-pixel-body font-bold text-xs w-6 shrink-0 ${RANK_COLORS[Math.min(idx, RANK_COLORS.length - 1)]}`}>
                            {idx < 3 ? RANK_LABELS[idx] : `${idx + 1}`}
                          </div>
                          <div className="font-pixel-body font-semibold text-sm text-white/80 flex-1 truncate">
                            {entry.profile.name}
                          </div>
                          <div className="font-pixel-body font-semibold text-sm text-white/60 shrink-0">
                            {entry.stats.correct} correct
                          </div>
                          <div className="font-pixel-body font-semibold text-xs text-white/40 shrink-0 w-10 text-right">
                            {formatAccuracy(entry.stats.correct, entry.stats.attempts)}
                          </div>
                          <div className="font-pixel-body font-semibold text-xs text-yellow-300/70 shrink-0 w-12 text-right">
                            🔥{entry.stats.bestStreak}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Back button */}
      <button
        onClick={handleBack}
        className="pixel-btn font-pixel w-full max-w-sm py-4 bg-indigo-700 hover:bg-indigo-600 text-white text-[10px] rounded-lg transition-colors"
      >
        BACK TO MENU
      </button>
    </div>
  )
}
