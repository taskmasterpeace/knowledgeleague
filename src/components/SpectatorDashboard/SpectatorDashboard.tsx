import type { PlayerAnalytics, BehaviorTag } from '../../types'

interface SpectatorDashboardProps {
  analyticsData: Record<string, PlayerAnalytics> | null
  playerInfo?: { name: string; color: string }[]
}

const BEHAVIOR_ICONS: Record<BehaviorTag, string> = {
  'on-fire': '🔥',
  'mashing': '⚡',
  'guessing': '🎲',
  'thinking': '🧠',
  'struggling': '😟',
  'warming-up': '📈',
  'playing': '🎮',
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

const TIER_LABELS: Record<number, string> = {
  1: 'EASY',
  2: 'MED',
  3: 'HARD',
}

const TIER_COLORS: Record<number, string> = {
  1: '#4ade80',
  2: '#f59e0b',
  3: '#ef4444',
}

function AccuracyDots({ last5Correct }: { last5Correct: boolean[] }) {
  const dots = [...last5Correct]
  // Pad to 5 if needed
  while (dots.length < 5) dots.unshift(false)
  const display = dots.slice(-5)

  return (
    <div className="flex gap-1 items-center">
      {display.map((correct, i) => (
        <div
          key={i}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '2px',
            backgroundColor: correct ? '#4ade80' : '#ef4444',
            opacity: last5Correct.length <= i ? 0.2 : 1,
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}

function PlayerCard({
  name,
  color,
  analytics,
}: {
  name: string
  color: string
  analytics: PlayerAnalytics
}) {
  const accuracy = analytics.answersTotal > 0
    ? Math.round((analytics.answersCorrect / analytics.answersTotal) * 100)
    : 0

  const avgResponseTime = analytics.last5Times.length > 0
    ? (analytics.last5Times.reduce((a, b) => a + b, 0) / analytics.last5Times.length / 1000).toFixed(1)
    : '--'

  const streak = (() => {
    let s = 0
    const hist = analytics.fullCorrectHistory
    for (let i = hist.length - 1; i >= 0; i--) {
      if (hist[i]) s++
      else break
    }
    return s
  })()

  const tag = analytics.behaviorTag
  const tier = analytics.adaptiveTier

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1.5px solid ${color}44`,
        borderRadius: '12px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header row: name + behavior tag */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {/* Color dot */}
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '3px',
            backgroundColor: color,
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: 'var(--font-pixel, monospace)',
            fontSize: '13px',
            color: '#fff',
            fontWeight: 700,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {name}
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(255,255,255,0.07)',
          borderRadius: '20px',
          padding: '3px 8px',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '12px' }}>{BEHAVIOR_ICONS[tag]}</span>
          <span style={{
            fontFamily: 'var(--font-pixel, monospace)',
            fontSize: '9px',
            color: 'rgba(255,255,255,0.7)',
          }}>
            {BEHAVIOR_LABELS[tag]}
          </span>
        </div>
      </div>

      {/* Score + accuracy dots row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{
            fontFamily: 'var(--font-pixel, monospace)',
            fontSize: '20px',
            color,
            fontWeight: 700,
            lineHeight: 1,
          }}>
            {analytics.answersCorrect}
          </span>
          <span style={{
            fontFamily: 'var(--font-pixel, monospace)',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.4)',
          }}>
            /{analytics.answersTotal}
          </span>
          <span style={{
            fontFamily: 'var(--font-pixel, monospace)',
            fontSize: '10px',
            color: accuracy >= 70 ? '#4ade80' : accuracy >= 40 ? '#f59e0b' : '#ef4444',
            marginLeft: '4px',
          }}>
            {accuracy}%
          </span>
        </div>
        <AccuracyDots last5Correct={analytics.last5Correct} />
      </div>

      {/* Stats row: response time, streak, tier */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
      }}>
        <StatChip label="AVG TIME" value={`${avgResponseTime}s`} color="rgba(255,255,255,0.5)" />
        <StatChip
          label="STREAK"
          value={streak > 0 ? `${streak}🔥` : '—'}
          color={streak >= 3 ? '#f59e0b' : 'rgba(255,255,255,0.5)'}
        />
        <StatChip
          label="TIER"
          value={TIER_LABELS[tier] ?? '—'}
          color={TIER_COLORS[tier] ?? 'rgba(255,255,255,0.5)'}
        />
      </div>
    </div>
  )
}

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '6px',
      padding: '4px 8px',
      minWidth: '52px',
    }}>
      <span style={{
        fontFamily: 'var(--font-pixel, monospace)',
        fontSize: '7px',
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: '0.05em',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-pixel, monospace)',
        fontSize: '11px',
        color,
        fontWeight: 700,
        marginTop: '1px',
      }}>
        {value}
      </span>
    </div>
  )
}

export function SpectatorDashboard({ analyticsData, playerInfo }: SpectatorDashboardProps) {
  if (!analyticsData || Object.keys(analyticsData).length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #0f172a, #1e1b4b, #0f172a)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '24px',
      }}>
        <div style={{ fontSize: '48px' }}>👁️</div>
        <p style={{
          fontFamily: 'var(--font-pixel, monospace)',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.5)',
          textAlign: 'center',
        }}>
          Waiting for game data...
        </p>
        <p style={{
          fontFamily: 'var(--font-pixel, monospace)',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.25)',
          textAlign: 'center',
        }}>
          Analytics will appear once the game starts
        </p>
      </div>
    )
  }

  const playerNames = Object.keys(analyticsData)

  // Build a color map from playerInfo, fallback to defaults
  const DEFAULT_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#c084fc', '#22d3ee']
  const colorMap: Record<string, string> = {}
  playerNames.forEach((name, i) => {
    const info = playerInfo?.find(p => p.name === name)
    colorMap[name] = info?.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #0f172a, #1e1b4b, #0f172a)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        paddingBottom: '8px',
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
        <span style={{ fontSize: '16px' }}>👁️</span>
        <span style={{
          fontFamily: 'var(--font-pixel, monospace)',
          fontSize: '12px',
          color: '#c084fc',
          fontWeight: 700,
          letterSpacing: '0.08em',
        }}>
          SPECTATOR
        </span>
        <span style={{
          fontFamily: 'var(--font-pixel, monospace)',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.3)',
          marginLeft: 'auto',
        }}>
          {playerNames.length} player{playerNames.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Scrollable player list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {playerNames.map(name => (
          <PlayerCard
            key={name}
            name={name}
            color={colorMap[name]}
            analytics={analyticsData[name]}
          />
        ))}
      </div>
    </div>
  )
}
