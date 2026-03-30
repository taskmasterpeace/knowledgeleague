import { useState, useCallback } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { useSettings } from '../../hooks/useSettings'
import { sounds } from '../../utils/sounds'
import { PARTY_EVENT_COUNTS } from '../../utils/constants'

const EVENT_NAMES: Record<string, string> = {
  'marathon': 'Math Marathon',
  'tug-of-war': 'Tug of War',
  'hurdle-dash': 'Hurdle Dash',
  'long-jump': 'Long Jump',
  'spelling-bee': 'Spelling Bee',
}

const ALL_EVENTS = Object.keys(EVENT_NAMES)

function shuffleEvents(count: number): string[] {
  const result: string[] = []
  while (result.length < count) {
    const remaining = count - result.length
    const batch = [...ALL_EVENTS].sort(() => Math.random() - 0.5).slice(0, remaining)
    result.push(...batch)
  }
  return result.slice(0, count)
}

export function PartySetup() {
  const { startPartyMode, setPhase, players } = useGameState()
  const { soundEnabled } = useSettings()
  const [eventCount, setEventCount] = useState<number>(PARTY_EVENT_COUNTS[0])
  const [previewEvents, setPreviewEvents] = useState<string[]>(() => shuffleEvents(PARTY_EVENT_COUNTS[0]))
  const [isLaunching, setIsLaunching] = useState(false)

  const handlePickCount = useCallback((count: number) => {
    if (soundEnabled) sounds.navigate()
    setEventCount(count)
    setPreviewEvents(shuffleEvents(count))
  }, [soundEnabled])

  const handleReshuffle = useCallback(() => {
    if (soundEnabled) sounds.navigate()
    setPreviewEvents(shuffleEvents(eventCount))
  }, [soundEnabled, eventCount])

  const handleStart = useCallback(() => {
    if (isLaunching) return
    setIsLaunching(true)
    if (soundEnabled) sounds.select()
    startPartyMode(eventCount)
  }, [isLaunching, soundEnabled, startPartyMode, eventCount])

  const handleBack = useCallback(() => {
    if (soundEnabled) sounds.navigate()
    setPhase('avatar-select')
  }, [soundEnabled, setPhase])

  return (
    <div className="min-h-screen screen-enter flex flex-col items-center justify-center gap-6 p-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0520] via-[#121040] to-[#0a0520]" />

      {/* Slow-scrolling star field layer 1 (far) */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(1px 1px at 10% 20%, white 50%, transparent 100%), radial-gradient(1px 1px at 30% 60%, white 50%, transparent 100%), radial-gradient(1.5px 1.5px at 50% 10%, white 50%, transparent 100%), radial-gradient(1px 1px at 70% 40%, white 50%, transparent 100%), radial-gradient(1px 1px at 90% 70%, white 50%, transparent 100%), radial-gradient(1.5px 1.5px at 15% 80%, white 50%, transparent 100%), radial-gradient(1px 1px at 55% 45%, white 50%, transparent 100%), radial-gradient(1px 1px at 85% 15%, white 50%, transparent 100%)',
          backgroundSize: '200px 200px',
          animation: 'starDrift 60s linear infinite',
        }}
      />

      {/* Star field layer 2 (near, brighter, faster) */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: 'radial-gradient(2px 2px at 20% 30%, #facc15 50%, transparent 100%), radial-gradient(2px 2px at 60% 70%, #67e8f9 50%, transparent 100%), radial-gradient(2px 2px at 80% 20%, #facc15 50%, transparent 100%), radial-gradient(1.5px 1.5px at 40% 90%, #c084fc 50%, transparent 100%), radial-gradient(2px 2px at 10% 50%, #67e8f9 50%, transparent 100%)',
          backgroundSize: '300px 300px',
          animation: 'starDrift 35s linear infinite reverse',
        }}
      />

      {/* Floating sparkle particles */}
      {Array.from({ length: 16 }, (_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            left: `${8 + (i * 6.2) % 90}%`,
            top: `${5 + (i * 11) % 85}%`,
            background: i % 4 === 0 ? '#facc15' : i % 4 === 1 ? '#67e8f9' : i % 4 === 2 ? '#c084fc' : '#f472b6',
            animation: `sparkleFloat ${3 + (i % 4)}s ease-in-out ${i * 0.25}s infinite alternate`,
            opacity: 0.6,
          }}
        />
      ))}

      {/* Radial glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '80%',
          height: '60%',
          left: '10%',
          top: '25%',
          background: 'radial-gradient(ellipse at center, rgba(192,132,252,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Back button */}
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 pixel-card px-4 py-2 rounded-lg font-pixel text-[8px] text-white/70 hover:text-white hover:scale-105 transition-all z-10"
      >
        BACK
      </button>

      {/* ===== TITLE ===== */}
      <div className="text-center relative z-10">
        <h1
          className="font-pixel text-4xl sm:text-5xl text-yellow-300 leading-relaxed"
          style={{
            textShadow: '0 0 20px rgba(250,204,21,0.6), 0 0 40px rgba(250,204,21,0.3), 3px 3px 0 #000',
            animation: 'partyPulse 2s ease-in-out infinite',
          }}
        >
          PARTY MODE
        </h1>
        <p className="font-pixel-body text-sm text-purple-300/80 mt-1">
          Multiple events, one champion!
        </p>
      </div>

      {/* ===== PLAYER ROSTER ===== */}
      <div className="relative z-10 flex gap-4 items-end justify-center flex-wrap">
        {players.map((player) => (
          <div key={player.id} className="flex flex-col items-center gap-1">
            {player.avatarUrl ? (
              <img
                src={player.avatarUrl}
                alt={player.name}
                className="w-12 h-12 rounded-lg border-2"
                style={{ imageRendering: 'pixelated', borderColor: player.color }}
              />
            ) : (
              <div
                className="w-12 h-12 rounded-lg border-2 flex items-center justify-center font-pixel text-[10px] text-white"
                style={{ backgroundColor: player.color, borderColor: player.color }}
              >
                {player.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="font-pixel-body text-[10px] text-white/80">{player.name}</span>
          </div>
        ))}
      </div>

      {/* ===== EVENT COUNT PICKER ===== */}
      <div className="relative z-10 text-center">
        <p className="font-pixel text-[10px] text-white/60 mb-3">HOW MANY EVENTS?</p>
        <div className="flex gap-4 justify-center">
          {PARTY_EVENT_COUNTS.map((count) => (
            <button
              key={count}
              onClick={() => handlePickCount(count)}
              className={`pixel-btn rounded-xl font-pixel text-2xl px-8 py-4 transition-all ${
                eventCount === count
                  ? 'bg-purple-600 text-white shadow-[0_0_24px_rgba(168,85,247,0.5)] scale-110'
                  : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'
              }`}
              style={eventCount === count ? {
                animation: 'countGlow 1.5s ease-in-out infinite',
              } : undefined}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* ===== EVENT PREVIEW ===== */}
      <div className="relative z-10 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-3 px-2">
          <p className="font-pixel text-[10px] text-white/60">EVENT LINEUP</p>
          <button
            onClick={handleReshuffle}
            className="font-pixel text-[8px] text-cyan-300/70 hover:text-cyan-300 transition-colors"
          >
            RESHUFFLE
          </button>
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          {previewEvents.map((event, i) => (
            <div
              key={`${event}-${i}`}
              className="pixel-card rounded-lg flex flex-col items-center gap-2 p-3 w-28 sm:w-32"
              style={{
                animation: `eventSlideIn 0.4s ease-out ${i * 0.1}s both`,
              }}
            >
              <div className="relative">
                <span
                  className="absolute -top-2 -left-2 font-pixel text-[8px] text-yellow-300 bg-black/60 rounded-full w-5 h-5 flex items-center justify-center border border-yellow-300/40"
                >
                  {i + 1}
                </span>
                <img
                  src={`/pixelart/events/${event}.png`}
                  alt={EVENT_NAMES[event]}
                  className="w-full rounded"
                  style={{ imageRendering: 'pixelated' }}
                  onError={(e) => {
                    // CSS gradient fallback
                    const target = e.currentTarget
                    target.style.display = 'none'
                    const fallback = target.nextElementSibling as HTMLElement | null
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
                <div
                  className="w-full aspect-square rounded items-center justify-center font-pixel text-[8px] text-white/60 bg-gradient-to-br from-purple-900 to-indigo-900"
                  style={{ display: 'none' }}
                >
                  {EVENT_NAMES[event]}
                </div>
              </div>
              <span className="font-pixel-body text-[10px] text-white/70 text-center leading-tight">
                {EVENT_NAMES[event]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== START BUTTON ===== */}
      <button
        onClick={handleStart}
        disabled={isLaunching}
        className="relative z-10 pixel-btn rounded-xl font-pixel text-xl sm:text-2xl px-10 py-5 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 text-black hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          textShadow: '1px 1px 0 rgba(255,255,255,0.3)',
          boxShadow: '0 0 30px rgba(250,204,21,0.4), 0 4px 0 #b45309',
          animation: isLaunching ? 'none' : 'startBounce 1.5s ease-in-out infinite',
        }}
      >
        {isLaunching ? 'LOADING...' : 'START PARTY!'}
      </button>

      {/* CSS animations */}
      <style>{`
        @keyframes starDrift {
          from { background-position: 0 0; }
          to { background-position: 200px 200px; }
        }
        @keyframes sparkleFloat {
          from { transform: translateY(0) scale(1); opacity: 0.4; }
          to { transform: translateY(-12px) scale(1.3); opacity: 0.8; }
        }
        @keyframes partyPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes countGlow {
          0%, 100% { box-shadow: 0 0 16px rgba(168,85,247,0.4); }
          50% { box-shadow: 0 0 32px rgba(168,85,247,0.7); }
        }
        @keyframes eventSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes startBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
