import { useEffect, useRef, useState } from 'react'
import type { PlayerAnalytics, BehaviorTag, AdaptiveTier } from '../../types'

interface SpectatorDashboardProps {
  analyticsData: Record<string, PlayerAnalytics> | null
  playerNames: Record<string, string>
  eventName?: string
}

const BEHAVIOR_EMOJI: Record<BehaviorTag, string> = {
  'on-fire': '\u{1F525}',
  'mashing': '\u{1F3AF}',
  'guessing': '\u{1F3B2}',
  'thinking': '\u{1F914}',
  'struggling': '\u{1F630}',
  'warming-up': '\u{1F321}\uFE0F',
  'playing': '\u{1F3AE}',
}

const BEHAVIOR_LABELS: Record<BehaviorTag, string> = {
  'on-fire': 'On Fire',
  'mashing': 'Mashing',
  'guessing': 'Guessing',
  'thinking': 'Thinking',
  'struggling': 'Struggling',
  'warming-up': 'Warming Up',
  'playing': 'Playing',
}

const TIER_LABELS: Record<AdaptiveTier, string> = {
  1: 'EASY',
  2: 'MEDIUM',
  3: 'HARD',
}

const TIER_COLORS: Record<AdaptiveTier, string> = {
  1: '#4ade80',
  2: '#f59e0b',
  3: '#ef4444',
}

const SUBJECT_MAP: Record<string, string> = {
  addition: 'Math',
  subtraction: 'Math',
  missing: 'Math',
  comparison: 'Math',
  'skip-counting': 'Math',
  multiplication: 'Math',
  division: 'Math',
  fractions: 'Math',
  rounding: 'Math',
  percentages: 'Math',
  'order-of-operations': 'Math',
  'square-roots': 'Math',
  estimation: 'Math',
  animals: 'Science',
  plants: 'Science',
  'body-senses': 'Science',
  weather: 'Science',
  space: 'Science',
  materials: 'Science',
  'water-cycle': 'Science',
  forces: 'Science',
  'food-chains': 'Science',
  fossils: 'Science',
  traits: 'Science',
  magnets: 'Science',
  matter: 'Science',
  chemistry: 'Science',
  biology: 'Science',
  physics: 'Science',
  astronomy: 'Science',
  'earth-science': 'Science',
  rhyming: 'Reading',
  opposites: 'Reading',
  'beginning-sounds': 'Reading',
  'fill-in-blank': 'Reading',
  'word-meaning': 'Reading',
  'sight-words': 'Reading',
  vocabulary: 'Reading',
  grammar: 'Reading',
  'figurative-language': 'Reading',
  'parts-of-speech': 'Reading',
  'sentence-correction': 'Reading',
  etymology: 'Reading',
  analogies: 'Reading',
  spelling: 'Reading',
}

const SUBJECT_COLORS: Record<string, string> = {
  Math: '#22d3ee',
  Science: '#4ade80',
  Reading: '#c084fc',
}

const DEFAULT_PLAYER_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#c084fc', '#22d3ee']

interface CommentaryEntry {
  id: number
  text: string
  color: string
  timestamp: string
}

function getAccuracyColor(pct: number): string {
  if (pct >= 80) return '#4ade80'
  if (pct >= 50) return '#f59e0b'
  return '#ef4444'
}

function getCurrentStreak(history: boolean[]): number {
  let s = 0
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i]) s++
    else break
  }
  return s
}

function getSubjectAccuracy(
  categoryAccuracy: Record<string, { correct: number; total: number }>,
  subject: string,
): { correct: number; total: number; pct: number } {
  let correct = 0
  let total = 0
  for (const [cat, stats] of Object.entries(categoryAccuracy)) {
    if ((SUBJECT_MAP[cat] ?? 'Math') === subject) {
      correct += stats.correct
      total += stats.total
    }
  }
  return { correct, total, pct: total > 0 ? Math.round((correct / total) * 100) : 0 }
}

function formatTime(): string {
  const d = new Date()
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

// ─── Sub-components ──────────────────────────────────────────────

function AccuracyBar({ pct }: { pct: number }) {
  const color = getAccuracyColor(pct)
  return (
    <div style={{
      width: '100%',
      height: '6px',
      background: 'rgba(255,255,255,0.08)',
      borderRadius: '3px',
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${Math.min(pct, 100)}%`,
        height: '100%',
        background: color,
        borderRadius: '3px',
        transition: 'width 0.5s ease',
      }} />
    </div>
  )
}

function TierBadge({ tier }: { tier: AdaptiveTier }) {
  return (
    <span style={{
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '7px',
      color: TIER_COLORS[tier],
      background: `${TIER_COLORS[tier]}18`,
      border: `1px solid ${TIER_COLORS[tier]}44`,
      borderRadius: '4px',
      padding: '2px 5px',
      letterSpacing: '0.05em',
    }}>
      {TIER_LABELS[tier]}
    </span>
  )
}

function SubjectDots({ categoryAccuracy }: { categoryAccuracy: Record<string, { correct: number; total: number }> }) {
  const subjects = ['Math', 'Science', 'Reading']
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {subjects.map(subj => {
        const stats = getSubjectAccuracy(categoryAccuracy, subj)
        if (stats.total === 0) {
          return (
            <div key={subj} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '2px',
                background: 'rgba(255,255,255,0.12)',
                flexShrink: 0,
              }} />
              <span style={{
                fontFamily: "'Pixelify Sans', 'Press Start 2P', monospace",
                fontSize: '10px',
                color: 'rgba(255,255,255,0.2)',
              }}>
                {subj[0]}
              </span>
            </div>
          )
        }
        const color = SUBJECT_COLORS[subj] ?? '#fff'
        return (
          <div key={subj} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '2px',
              background: color,
              opacity: stats.pct >= 50 ? 1 : 0.4,
              flexShrink: 0,
            }} />
            <span style={{
              fontFamily: "'Pixelify Sans', 'Press Start 2P', monospace",
              fontSize: '10px',
              color: `${color}cc`,
            }}>
              {subj[0]} {stats.pct}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

function PlayerRow({
  name,
  analytics,
  color,
}: {
  name: string
  analytics: PlayerAnalytics
  color: string
}) {
  const accuracy = analytics.answersTotal > 0
    ? Math.round((analytics.answersCorrect / analytics.answersTotal) * 100)
    : 0
  const streak = getCurrentStreak(analytics.fullCorrectHistory)
  const tag = analytics.behaviorTag

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1.5px solid ${color}44`,
      borderRadius: '10px',
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      {/* Row 1: name + behavior tag + tier */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '2px',
            backgroundColor: color,
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: "'Pixelify Sans', 'Press Start 2P', monospace",
            fontSize: '14px',
            color: '#fff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <span style={{
            fontFamily: "'Pixelify Sans', 'Press Start 2P', monospace",
            fontSize: '12px',
            background: 'rgba(255,255,255,0.07)',
            borderRadius: '12px',
            padding: '2px 6px',
            color: 'rgba(255,255,255,0.7)',
          }}>
            {BEHAVIOR_EMOJI[tag]} {BEHAVIOR_LABELS[tag]}
          </span>
          <TierBadge tier={analytics.adaptiveTier} />
        </div>
      </div>

      {/* Row 2: score + accuracy bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          fontFamily: "'Pixelify Sans', 'Press Start 2P', monospace",
          fontSize: '18px',
          color,
          fontWeight: 700,
          lineHeight: 1,
          minWidth: '28px',
        }}>
          {analytics.answersCorrect}
        </span>
        <span style={{
          fontFamily: "'Pixelify Sans', 'Press Start 2P', monospace",
          fontSize: '12px',
          color: 'rgba(255,255,255,0.35)',
        }}>
          /{analytics.answersTotal}
        </span>
        <div style={{ flex: 1 }}>
          <AccuracyBar pct={accuracy} />
        </div>
        <span style={{
          fontFamily: "'Pixelify Sans', 'Press Start 2P', monospace",
          fontSize: '13px',
          color: getAccuracyColor(accuracy),
          minWidth: '32px',
          textAlign: 'right',
        }}>
          {accuracy}%
        </span>
        {streak >= 3 && (
          <span style={{
            fontFamily: "'Pixelify Sans', 'Press Start 2P', monospace",
            fontSize: '12px',
            color: '#f59e0b',
          }}>
            {`${streak}\u{1F525}`}
          </span>
        )}
      </div>

      {/* Row 3: category breakdown */}
      <SubjectDots categoryAccuracy={analytics.categoryAccuracy} />
    </div>
  )
}

function CommentaryFeed({ entries }: { entries: CommentaryEntry[] }) {
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [entries])

  if (entries.length === 0) {
    return (
      <div style={{
        fontFamily: "'Pixelify Sans', 'Press Start 2P', monospace",
        fontSize: '12px',
        color: 'rgba(255,255,255,0.25)',
        textAlign: 'center',
        padding: '12px',
      }}>
        Waiting for action...
      </div>
    )
  }

  return (
    <div
      ref={feedRef}
      style={{
        maxHeight: '140px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '6px',
      }}
    >
      {entries.map(entry => (
        <div key={entry.id} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
          <span style={{
            fontFamily: "'Pixelify Sans', 'Press Start 2P', monospace",
            fontSize: '10px',
            color: 'rgba(255,255,255,0.2)',
            minWidth: '48px',
            flexShrink: 0,
            lineHeight: '14px',
          }}>
            {entry.timestamp}
          </span>
          <span style={{
            fontFamily: "'Pixelify Sans', 'Press Start 2P', monospace",
            fontSize: '12px',
            color: entry.color,
            lineHeight: '14px',
          }}>
            {entry.text}
          </span>
        </div>
      ))}
    </div>
  )
}

function ClassReport({ analyticsData, playerNames }: {
  analyticsData: Record<string, PlayerAnalytics>
  playerNames: Record<string, string>
}) {
  const ids = Object.keys(analyticsData)
  if (ids.length === 0) return null

  // Overall accuracy
  let totalCorrect = 0
  let totalAnswers = 0
  let strugglingCount = 0
  let onFireCount = 0

  // Aggregate subject accuracy
  const subjectTotals: Record<string, { correct: number; total: number }> = {
    Math: { correct: 0, total: 0 },
    Science: { correct: 0, total: 0 },
    Reading: { correct: 0, total: 0 },
  }

  for (const id of ids) {
    const a = analyticsData[id]
    totalCorrect += a.answersCorrect
    totalAnswers += a.answersTotal
    if (a.behaviorTag === 'struggling') strugglingCount++
    if (a.behaviorTag === 'on-fire') onFireCount++

    for (const [cat, stats] of Object.entries(a.categoryAccuracy)) {
      const subj = SUBJECT_MAP[cat] ?? 'Math'
      if (subjectTotals[subj]) {
        subjectTotals[subj].correct += stats.correct
        subjectTotals[subj].total += stats.total
      }
    }
  }

  const overallPct = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0

  // Strongest / weakest
  let strongest = '--'
  let strongestPct = -1
  let weakest = '--'
  let weakestPct = 101

  for (const [subj, stats] of Object.entries(subjectTotals)) {
    if (stats.total === 0) continue
    const pct = Math.round((stats.correct / stats.total) * 100)
    if (pct > strongestPct) { strongestPct = pct; strongest = subj }
    if (pct < weakestPct) { weakestPct = pct; weakest = subj }
  }

  const _playerNames = playerNames // keep linter happy
  void _playerNames

  const statItems = [
    { label: 'CLASS ACCURACY', value: `${overallPct}%`, color: getAccuracyColor(overallPct) },
    { label: 'STRONGEST', value: strongest, color: SUBJECT_COLORS[strongest] ?? '#fff' },
    { label: 'WEAKEST', value: weakest, color: weakestPct < 50 ? '#ef4444' : '#f59e0b' },
    { label: 'ON FIRE', value: `${onFireCount}`, color: '#f59e0b' },
    { label: 'STRUGGLING', value: `${strugglingCount}`, color: strugglingCount > 0 ? '#ef4444' : '#4ade80' },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '6px',
    }}>
      {statItems.map(item => (
        <div key={item.label} style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '8px',
          padding: '8px 6px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
        }}>
          <span style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '6px',
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.05em',
            textAlign: 'center',
          }}>
            {item.label}
          </span>
          <span style={{
            fontFamily: "'Pixelify Sans', 'Press Start 2P', monospace",
            fontSize: '15px',
            color: item.color,
            fontWeight: 700,
          }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Commentary generation logic ─────────────────────────────────

function generateCommentary(
  prev: Record<string, PlayerAnalytics> | null,
  curr: Record<string, PlayerAnalytics>,
  playerNames: Record<string, string>,
): CommentaryEntry[] {
  const entries: CommentaryEntry[] = []
  const now = formatTime()
  let nextId = Date.now()

  for (const id of Object.keys(curr)) {
    const name = playerNames[id] ?? id
    const c = curr[id]
    const p = prev?.[id]

    if (!p) continue

    // Behavior tag change
    if (c.behaviorTag !== p.behaviorTag) {
      if (c.behaviorTag === 'on-fire') {
        entries.push({ id: nextId++, text: `${name} is ON FIRE! \u{1F525}`, color: '#f59e0b', timestamp: now })
      } else if (c.behaviorTag === 'struggling') {
        entries.push({ id: nextId++, text: `${name} is struggling...`, color: '#ef4444', timestamp: now })
      } else if (c.behaviorTag === 'warming-up') {
        entries.push({ id: nextId++, text: `${name} is warming up!`, color: '#22d3ee', timestamp: now })
      } else if (c.behaviorTag === 'mashing') {
        entries.push({ id: nextId++, text: `${name} is button mashing!`, color: '#f59e0b', timestamp: now })
      }
    }

    // Streak milestones
    const currStreak = getCurrentStreak(c.fullCorrectHistory)
    const prevStreak = getCurrentStreak(p.fullCorrectHistory)
    if (currStreak >= 3 && currStreak > prevStreak && currStreak % 1 === 0) {
      if (currStreak === 3) {
        entries.push({ id: nextId++, text: `${name} hits a 3-streak!`, color: '#4ade80', timestamp: now })
      } else if (currStreak === 5) {
        entries.push({ id: nextId++, text: `${name} is UNSTOPPABLE - 5 in a row!`, color: '#f59e0b', timestamp: now })
      } else if (currStreak >= 7 && currStreak !== prevStreak) {
        entries.push({ id: nextId++, text: `${name} with a LEGENDARY ${currStreak}-streak!`, color: '#c084fc', timestamp: now })
      }
    }

    // Accuracy milestones
    const currAcc = c.answersTotal > 0 ? Math.round((c.answersCorrect / c.answersTotal) * 100) : 0
    const prevAcc = p.answersTotal > 0 ? Math.round((p.answersCorrect / p.answersTotal) * 100) : 0
    if (currAcc >= 90 && prevAcc < 90 && c.answersTotal >= 5) {
      entries.push({ id: nextId++, text: `${name} crosses 90% accuracy!`, color: '#4ade80', timestamp: now })
    }
    if (currAcc < 40 && prevAcc >= 40 && c.answersTotal >= 5) {
      entries.push({ id: nextId++, text: `${name} drops below 40%...`, color: '#ef4444', timestamp: now })
    }

    // Tier change
    if (c.adaptiveTier !== p.adaptiveTier) {
      const dir = c.adaptiveTier > p.adaptiveTier ? 'up' : 'down'
      entries.push({
        id: nextId++,
        text: `${name} difficulty ${dir} to ${TIER_LABELS[c.adaptiveTier]}`,
        color: dir === 'up' ? '#c084fc' : '#22d3ee',
        timestamp: now,
      })
    }

    // Answer count milestones
    if (c.answersTotal > 0 && c.answersTotal % 10 === 0 && c.answersTotal !== p.answersTotal) {
      entries.push({
        id: nextId++,
        text: `${name} reaches ${c.answersTotal} answers!`,
        color: '#fff',
        timestamp: now,
      })
    }
  }

  // Lead changes: find who has most correct answers
  const ids = Object.keys(curr)
  if (ids.length >= 2 && prev) {
    const currLeader = ids.reduce((a, b) => curr[a].answersCorrect >= curr[b].answersCorrect ? a : b)
    const prevLeader = ids.reduce((a, b) => {
      const pa = prev[a]?.answersCorrect ?? 0
      const pb = prev[b]?.answersCorrect ?? 0
      return pa >= pb ? a : b
    })
    if (currLeader !== prevLeader && curr[currLeader].answersTotal >= 3) {
      const leaderName = playerNames[currLeader] ?? currLeader
      entries.push({
        id: nextId++,
        text: `${leaderName} takes the lead!`,
        color: '#22d3ee',
        timestamp: now,
      })
    }
  }

  return entries
}

// ─── Main Component ──────────────────────────────────────────────

export function SpectatorDashboard({ analyticsData, playerNames, eventName }: SpectatorDashboardProps) {
  const prevDataRef = useRef<Record<string, PlayerAnalytics> | null>(null)
  const [commentary, setCommentary] = useState<CommentaryEntry[]>([])

  // Generate commentary when analytics change
  useEffect(() => {
    if (!analyticsData || Object.keys(analyticsData).length === 0) return

    const newEntries = generateCommentary(prevDataRef.current, analyticsData, playerNames)
    if (newEntries.length > 0) {
      setCommentary(prev => [...prev, ...newEntries].slice(-10))
    }
    prevDataRef.current = { ...analyticsData }
  }, [analyticsData, playerNames])

  // Waiting state
  if (!analyticsData || Object.keys(analyticsData).length === 0) {
    return (
      <div className="game-screen" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '24px',
      }}>
        <div style={{ fontSize: '48px' }}>{'\u{1F441}\uFE0F'}</div>
        <p style={{
          fontFamily: "'Pixelify Sans', 'Press Start 2P', monospace",
          fontSize: '16px',
          color: 'rgba(255,255,255,0.5)',
          textAlign: 'center',
        }}>
          Waiting for game data...
        </p>
        <p style={{
          fontFamily: "'Pixelify Sans', 'Press Start 2P', monospace",
          fontSize: '12px',
          color: 'rgba(255,255,255,0.25)',
          textAlign: 'center',
        }}>
          Analytics will appear once the game starts
        </p>
      </div>
    )
  }

  const playerIds = Object.keys(analyticsData)
  const colorMap: Record<string, string> = {}
  playerIds.forEach((id, i) => {
    colorMap[id] = DEFAULT_PLAYER_COLORS[i % DEFAULT_PLAYER_COLORS.length]
  })

  const eventLabel = eventName === 'marathon' ? 'MARATHON'
    : eventName === 'tug-of-war' ? 'TUG OF WAR'
    : eventName === 'hurdle-dash' ? 'HURDLE DASH'
    : 'LIVE'

  return (
    <div className="game-screen" style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      minHeight: '100vh',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        position: 'sticky',
        top: 0,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(8px)',
        zIndex: 10,
      }}>
        <span style={{ fontSize: '14px' }}>{'\u{1F441}\uFE0F'}</span>
        <span style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '10px',
          color: '#c084fc',
          fontWeight: 700,
          letterSpacing: '0.08em',
        }}>
          SPECTATOR
        </span>
        <span className="text-glow" style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '8px',
          color: '#22d3ee',
          marginLeft: '4px',
        }}>
          {eventLabel}
        </span>
        <span style={{
          fontFamily: "'Pixelify Sans', 'Press Start 2P', monospace",
          fontSize: '12px',
          color: 'rgba(255,255,255,0.3)',
          marginLeft: 'auto',
        }}>
          {playerIds.length}P
        </span>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {/* ── Live Scoreboard ── */}
        <SectionHeader label="SCOREBOARD" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {playerIds.map(id => (
            <PlayerRow
              key={id}
              name={playerNames[id] ?? id}
              analytics={analyticsData[id]}
              color={colorMap[id]}
            />
          ))}
        </div>

        {/* ── Live Commentary ── */}
        <SectionHeader label="COMMENTARY" />
        <div className="pixel-card" style={{ borderRadius: '10px', overflow: 'hidden' }}>
          <CommentaryFeed entries={commentary} />
        </div>

        {/* ── Class Report ── */}
        <SectionHeader label="CLASS REPORT" />
        <ClassReport analyticsData={analyticsData} playerNames={playerNames} />
      </div>
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '4px',
    }}>
      <span style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '7px',
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: '0.12em',
      }}>
        {label}
      </span>
      <div style={{
        flex: 1,
        height: '1px',
        background: 'rgba(255,255,255,0.08)',
      }} />
    </div>
  )
}
