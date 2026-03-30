import { useState, useEffect } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { useSettings } from '../../hooks/useSettings'
import { sounds } from '../../utils/sounds'
import { PARTY_TRANSITION_DURATION } from '../../utils/constants'
import { PlayerAvatar } from '../shared/PlayerAvatar'

const EVENT_DISPLAY_NAMES: Record<string, string> = {
  'marathon': 'MATH MARATHON',
  'tug-of-war': 'TUG OF WAR',
  'hurdle-dash': 'HURDLE DASH',
  'long-jump': 'LONG JUMP',
  'spelling-bee': 'SPELLING BEE',
}

const MEDAL_ICONS = ['🥇', '🥈', '🥉']

export function PartyTransition() {
  const { partyEvents, partyCurrentIndex, partyTotalScores, partyResults, players, setPhase, event } = useGameState()
  const { soundEnabled } = useSettings()
  const [countdown, setCountdown] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [imgError, setImgError] = useState(false)

  const currentEvent = partyEvents[partyCurrentIndex] ?? event
  const displayName = currentEvent ? EVENT_DISPLAY_NAMES[currentEvent] ?? currentEvent.toUpperCase() : 'NEXT EVENT'
  const eventImageSrc = currentEvent ? `/pixelart/events/${currentEvent}.png` : null
  const isFirstEvent = partyCurrentIndex === 0 && partyResults.length === 0
  const totalEvents = partyEvents.length

  // Build sorted standings
  const standings = players
    .map(p => ({ ...p, totalScore: partyTotalScores[p.id] ?? 0 }))
    .sort((a, b) => b.totalScore - a.totalScore)

  // Reveal animation after a short delay
  useEffect(() => {
    const revealTimer = setTimeout(() => setRevealed(true), 300)
    return () => clearTimeout(revealTimer)
  }, [])

  // Auto-start countdown sequence
  useEffect(() => {
    // After the transition duration, start the 3-2-1-GO countdown
    const startCountdownTimer = setTimeout(() => {
      setCountdown(3)
    }, PARTY_TRANSITION_DURATION - 4000 > 0 ? PARTY_TRANSITION_DURATION - 4000 : 0)

    return () => clearTimeout(startCountdownTimer)
  }, [])

  // Countdown ticker
  useEffect(() => {
    if (countdown === null) return

    if (countdown > 0) {
      if (soundEnabled) sounds.navigate()
      const tick = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(tick)
    }

    // countdown === 0 means "GO!"
    if (soundEnabled) sounds.gameStart()
    const goTimer = setTimeout(() => {
      setPhase('playing')
    }, 600)
    return () => clearTimeout(goTimer)
  }, [countdown, soundEnabled, setPhase])

  const handleSkip = () => {
    if (soundEnabled) sounds.select()
    setPhase('playing')
  }

  return (
    <div className="min-h-screen screen-enter flex flex-col items-center justify-center gap-6 p-6 relative overflow-hidden">
      {/* Dark space background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#05001a] via-[#0d0830] to-[#05001a]" />

      {/* Star field */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 10% 20%, white 50%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 30% 60%, white 50%, transparent 100%), ' +
            'radial-gradient(1px 1px at 50% 10%, white 50%, transparent 100%), ' +
            'radial-gradient(1px 1px at 70% 40%, white 50%, transparent 100%), ' +
            'radial-gradient(1.5px 1.5px at 90% 70%, white 50%, transparent 100%), ' +
            'radial-gradient(1px 1px at 15% 80%, white 50%, transparent 100%), ' +
            'radial-gradient(1px 1px at 55% 45%, white 50%, transparent 100%), ' +
            'radial-gradient(1px 1px at 85% 15%, white 50%, transparent 100%)',
          backgroundSize: '200px 200px',
          animation: 'starDrift 60s linear infinite',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-2xl">

        {/* Event counter */}
        <div
          className="font-pixel text-sm tracking-widest text-yellow-300/80 uppercase"
          style={{ letterSpacing: '0.25em' }}
        >
          EVENT {partyCurrentIndex + 1} of {totalEvents}
        </div>

        {/* Event image + name reveal */}
        <div
          className="flex flex-col items-center gap-4 transition-all duration-700 ease-out"
          style={{
            opacity: revealed ? 1 : 0,
            transform: revealed ? 'scale(1) translateY(0)' : 'scale(0.6) translateY(40px)',
          }}
        >
          {/* Event image */}
          {eventImageSrc && !imgError && (
            <img
              src={eventImageSrc}
              alt={displayName}
              className="w-40 h-40 object-contain drop-shadow-lg"
              style={{ imageRendering: 'pixelated' }}
              onError={() => setImgError(true)}
            />
          )}

          {/* Fallback gradient circle when image fails */}
          {(imgError || !eventImageSrc) && (
            <div
              className="w-40 h-40 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6b21a8 0%, #a855f7 50%, #c084fc 100%)',
                boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)',
              }}
            >
              <span className="text-5xl">⚡</span>
            </div>
          )}

          {/* Event name — HUGE and dramatic */}
          <h1
            className="font-pixel text-4xl md:text-5xl text-center leading-tight"
            style={{
              color: '#ffe066',
              textShadow:
                '0 0 20px rgba(255, 224, 102, 0.8), ' +
                '0 0 40px rgba(255, 165, 0, 0.5), ' +
                '0 4px 0 #b8860b',
              animation: revealed ? 'pulse 2s ease-in-out infinite' : 'none',
            }}
          >
            {displayName}
          </h1>
        </div>

        {/* Standings (only after first event) */}
        {!isFirstEvent && (
          <div
            className="pixel-card w-full max-w-md transition-all duration-500"
            style={{
              opacity: revealed ? 1 : 0,
              transitionDelay: '400ms',
            }}
          >
            <h2 className="font-pixel text-xs text-center text-purple-300 mb-3 tracking-wider uppercase">
              Current Standings
            </h2>
            <div className="flex flex-col gap-2">
              {standings.map((player, idx) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{
                    background: idx === 0
                      ? 'linear-gradient(90deg, rgba(255, 215, 0, 0.15) 0%, transparent 100%)'
                      : 'rgba(255, 255, 255, 0.03)',
                  }}
                >
                  {/* Medal or rank */}
                  <span className="font-pixel text-lg w-8 text-center shrink-0">
                    {idx < 3 ? MEDAL_ICONS[idx] : `${idx + 1}.`}
                  </span>

                  {/* Avatar */}
                  <PlayerAvatar
                    name={player.name}
                    color={player.color}
                    size={36}
                    avatarUrl={player.avatarUrl}
                  />

                  {/* Name */}
                  <span className="font-pixel-body text-sm text-white/90 flex-1 truncate">
                    {player.name}
                  </span>

                  {/* Score */}
                  <span
                    className="font-pixel text-sm tabular-nums"
                    style={{ color: '#ffe066' }}
                  >
                    {player.totalScore} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Countdown overlay */}
        {countdown !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <span
              className="font-pixel text-8xl md:text-9xl"
              style={{
                color: countdown === 0 ? '#22c55e' : '#ffffff',
                textShadow:
                  countdown === 0
                    ? '0 0 40px rgba(34, 197, 94, 0.9), 0 0 80px rgba(34, 197, 94, 0.5)'
                    : '0 0 30px rgba(255, 255, 255, 0.7), 0 0 60px rgba(168, 85, 247, 0.5)',
                animation: 'countdownPop 0.6s ease-out',
              }}
              key={countdown}
            >
              {countdown === 0 ? 'GO!' : countdown}
            </span>
          </div>
        )}

        {/* Skip button */}
        {countdown === null && (
          <button
            onClick={handleSkip}
            className="font-pixel text-xs text-white/50 hover:text-white/90 transition-colors mt-2 px-4 py-2 rounded-lg hover:bg-white/5"
          >
            SKIP &raquo;
          </button>
        )}
      </div>

      {/* Inline keyframes for countdown pop animation */}
      <style>{`
        @keyframes countdownPop {
          0% { transform: scale(2.5); opacity: 0; }
          40% { transform: scale(0.9); opacity: 1; }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
