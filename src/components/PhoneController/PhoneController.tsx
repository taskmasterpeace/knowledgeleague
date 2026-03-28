import { useState, useEffect, useRef, useCallback } from 'react'
import { usePeerClient } from '../../hooks/usePeerClient'
import { SpectatorDashboard } from '../SpectatorDashboard/SpectatorDashboard'

interface Props {
  roomId: string
}

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  math:     { bg: '#0e3a4a', text: '#22d3ee', border: '#22d3ee', glow: '0 0 12px rgba(34,211,238,0.4)' },
  science:  { bg: '#0e3a1e', text: '#4ade80', border: '#4ade80', glow: '0 0 12px rgba(74,222,128,0.4)' },
  reading:  { bg: '#2a1a3e', text: '#c084fc', border: '#c084fc', glow: '0 0 12px rgba(192,132,252,0.4)' },
  spelling: { bg: '#3a2e0e', text: '#facc15', border: '#facc15', glow: '0 0 12px rgba(250,204,21,0.4)' },
}

// Arcade cabinet button colors — saturated retro palette
const ANSWER_COLORS = [
  { bg: '#2563eb', shadow: '#1d4ed8', highlight: '#60a5fa', label: '#93c5fd' },  // Blue
  { bg: '#16a34a', shadow: '#15803d', highlight: '#4ade80', label: '#86efac' },  // Green
  { bg: '#d97706', shadow: '#b45309', highlight: '#fbbf24', label: '#fde68a' },  // Amber
  { bg: '#dc2626', shadow: '#b91c1c', highlight: '#f87171', label: '#fca5a5' },  // Red
]
const ANSWER_LABELS = ['A', 'B', 'C', 'D']

// Pixel art UI assets
const UI_ASSETS = {
  gamepad: '/pixelart/ui/gamepad.png',
  checkmark: '/pixelart/ui/checkmark.png',
  xMark: '/pixelart/ui/x-mark.png',
  trophy: '/pixelart/ui/trophy.png',
  hourglass: '/pixelart/ui/hourglass.png',
}

function vibrate(ms: number | number[]) {
  try { navigator?.vibrate?.(ms) } catch { /* noop */ }
}

/** CRT scanline overlay — gives that retro monitor feel */
function CRTOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-50"
      style={{
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0,0,0,0.08) 2px,
          rgba(0,0,0,0.08) 4px
        )`,
        mixBlendMode: 'multiply',
      }}
    />
  )
}

/** Pixel art image with crisp rendering */
function PixelImg({ src, alt, size, className = '' }: { src: string; alt: string; size: number; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: 'pixelated', width: size, height: size }}
      draggable={false}
    />
  )
}

/** Animated pixel border frame */
function PixelFrame({ children, color = '#facc15', className = '' }: { children: React.ReactNode; color?: string; className?: string }) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        border: `3px solid ${color}`,
        boxShadow: `
          inset 0 0 0 1px rgba(0,0,0,0.5),
          0 0 0 1px rgba(0,0,0,0.5),
          inset 0 1px 0 rgba(255,255,255,0.15),
          0 4px 12px rgba(0,0,0,0.4),
          0 0 20px ${color}22
        `,
        background: 'linear-gradient(180deg, rgba(20,16,40,0.95) 0%, rgba(12,10,30,0.98) 100%)',
      }}
    >
      {/* Corner pixel decorations */}
      <div className="absolute -top-1 -left-1 w-2 h-2" style={{ background: color }} />
      <div className="absolute -top-1 -right-1 w-2 h-2" style={{ background: color }} />
      <div className="absolute -bottom-1 -left-1 w-2 h-2" style={{ background: color }} />
      <div className="absolute -bottom-1 -right-1 w-2 h-2" style={{ background: color }} />
      {children}
    </div>
  )
}

/** Floating pixel sparkles background decoration */
function PixelSparkles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-yellow-300/40"
          style={{
            left: `${10 + (i * 12)}%`,
            top: `${15 + ((i * 17) % 70)}%`,
            animation: `sparkle-float ${2 + (i * 0.3)}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
    </div>
  )
}

export function PhoneController({ roomId }: Props) {
  const [name, setName] = useState('')
  const [joined, setJoined] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'player' | 'spectator'>('player')
  const [showStats, setShowStats] = useState(false)
  const {
    connected, connectionError, playerId, role, question, choices, subject,
    lockedIn, correctIndex, myChoiceIndex, gameOver,
    spectatorData, personalStats, superlatives,
    sendAnswer, connect,
  } = usePeerClient()

  const handleJoin = () => {
    if (!name.trim()) return
    vibrate(50)
    connect(roomId, name.trim(), selectedRole)
    setJoined(true)
  }

  // ─── JOIN SCREEN ─── arcade cabinet "insert coin" aesthetic
  if (!joined) {
    return (
      <div className="h-[100dvh] bg-[#0a0818] flex flex-col items-center justify-center gap-4 p-5 relative overflow-hidden">
        <CRTOverlay />
        <PixelSparkles />

        {/* Decorative top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />

        {/* Logo + Title */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <img src="/logo.png" alt="" className="w-20 h-20 object-contain" style={{ imageRendering: 'pixelated' }} />
          <h1 className="font-pixel text-xl text-yellow-300" style={{ textShadow: '0 0 20px rgba(250,204,21,0.5), 0 2px 0 rgba(0,0,0,0.8)' }}>
            JOIN GAME
          </h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-px bg-cyan-400/40" />
            <span className="font-pixel text-[10px] text-cyan-300/70 tracking-wider">{roomId}</span>
            <div className="w-8 h-px bg-cyan-400/40" />
          </div>
        </div>

        {/* Role toggle — arcade style */}
        <PixelFrame color="#6366f1" className="w-full max-w-xs rounded-none relative z-10">
          <div className="flex">
            <button
              onClick={() => { setSelectedRole('player'); vibrate(20) }}
              className={`flex-1 py-3.5 font-pixel-body font-bold text-lg transition-all ${
                selectedRole === 'player'
                  ? 'text-gray-900'
                  : 'text-white/30 hover:text-white/50'
              }`}
              style={selectedRole === 'player' ? {
                background: 'linear-gradient(180deg, #facc15, #eab308)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 8px rgba(250,204,21,0.3)',
              } : {}}
            >
              <PixelImg src={UI_ASSETS.gamepad} alt="" size={20} className="inline-block mr-1.5 -mt-0.5" />
              Play
            </button>
            <div className="w-px bg-indigo-400/30" />
            <button
              onClick={() => { setSelectedRole('spectator'); vibrate(20) }}
              className={`flex-1 py-3.5 font-pixel-body font-bold text-lg transition-all ${
                selectedRole === 'spectator'
                  ? 'text-white'
                  : 'text-white/30 hover:text-white/50'
              }`}
              style={selectedRole === 'spectator' ? {
                background: 'linear-gradient(180deg, #8b5cf6, #7c3aed)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 8px rgba(139,92,246,0.3)',
              } : {}}
            >
              Watch
            </button>
          </div>
        </PixelFrame>

        {/* Name input — styled like a retro text entry */}
        <PixelFrame color="#facc15" className="w-full max-w-xs rounded-none relative z-10">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="YOUR NAME"
            className="w-full text-center text-2xl font-bold py-4 px-4 bg-transparent text-yellow-300 placeholder-yellow-300/20 outline-none font-pixel-body tracking-wider"
            style={{ textShadow: '0 0 8px rgba(250,204,21,0.3)', caretColor: '#facc15' }}
            autoFocus
            maxLength={12}
          />
        </PixelFrame>

        {/* GO button — big chunky arcade button */}
        <button
          onClick={handleJoin}
          disabled={!name.trim()}
          className="w-full max-w-xs relative z-10 font-pixel text-xl py-5 transition-all active:translate-y-1 disabled:opacity-30 disabled:translate-y-0"
          style={{
            background: selectedRole === 'spectator'
              ? 'linear-gradient(180deg, #8b5cf6, #7c3aed)'
              : 'linear-gradient(180deg, #facc15, #eab308)',
            color: selectedRole === 'spectator' ? '#fff' : '#1a1a2e',
            border: '3px solid',
            borderColor: selectedRole === 'spectator' ? '#a78bfa' : '#fde68a',
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.3),
              inset 0 -2px 0 rgba(0,0,0,0.2),
              0 4px 0 ${selectedRole === 'spectator' ? '#5b21b6' : '#a16207'},
              0 6px 12px rgba(0,0,0,0.4)
            `,
            textShadow: selectedRole === 'spectator'
              ? '0 1px 2px rgba(0,0,0,0.3)'
              : '0 1px 0 rgba(255,255,255,0.3)',
          }}
        >
          {selectedRole === 'spectator' ? 'WATCH' : "LET'S GO!"}
        </button>

        {/* Bottom decorative border */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />

        <style>{`
          @keyframes sparkle-float {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
            50% { transform: translateY(-8px) scale(1.5); opacity: 0.8; }
          }
        `}</style>
      </div>
    )
  }

  // ─── CONNECTING STATE ───
  if (!connected) {
    return (
      <div className="h-[100dvh] bg-[#0a0818] flex flex-col items-center justify-center gap-6 p-6 relative">
        <CRTOverlay />
        {connectionError ? (
          <>
            <PixelImg src={UI_ASSETS.xMark} alt="Error" size={64} className="animate-bounce" />
            <p className="font-pixel-body font-semibold text-lg text-red-400 text-center">{connectionError}</p>
            <button
              onClick={() => { setJoined(false); vibrate(30) }}
              className="font-pixel py-3 px-8 text-sm text-white transition-all active:translate-y-1"
              style={{
                background: 'linear-gradient(180deg, #4f46e5, #4338ca)',
                border: '3px solid #818cf8',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 3px 0 #312e81',
              }}
            >
              TRY AGAIN
            </button>
          </>
        ) : (
          <>
            <PixelImg src={UI_ASSETS.gamepad} alt="" size={80} className="opacity-60" style={{ animation: 'controller-pulse 1.5s ease-in-out infinite' } as React.CSSProperties} />
            <p className="font-pixel text-base text-cyan-300" style={{ textShadow: '0 0 10px rgba(34,211,238,0.4)' }}>
              CONNECTING...
            </p>
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 bg-cyan-400"
                  style={{ animation: `dot-blink 1s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </>
        )}
        <style>{`
          @keyframes controller-pulse {
            0%, 100% { transform: scale(1) rotate(-5deg); }
            50% { transform: scale(1.1) rotate(5deg); }
          }
          @keyframes dot-blink {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </div>
    )
  }

  // ─── SPECTATOR VIEW ───
  if (role === 'spectator') {
    const analyticsData = spectatorData?.analytics ?? null
    const players = (spectatorData?.players ?? []) as { name: string; playerId?: number }[]
    const playerNamesMap: Record<string, string> = {}
    for (const p of players) {
      const key = p.playerId != null ? String(p.playerId) : p.name
      playerNamesMap[key] = p.name
    }
    if (analyticsData) {
      for (const key of Object.keys(analyticsData as Record<string, unknown>)) {
        if (!playerNamesMap[key]) playerNamesMap[key] = key
      }
    }
    const eventNameFromHost = (spectatorData?.eventName as string) ?? undefined
    return (
      <SpectatorDashboard
        analyticsData={analyticsData}
        playerNames={playerNamesMap}
        eventName={eventNameFromHost}
      />
    )
  }

  // ─── GAME OVER SCREEN ─── victory arcade style
  if (gameOver) {
    const isWinner = gameOver.winnerName === name
    return (
      <div className="h-[100dvh] bg-[#0a0818] flex flex-col items-center justify-center gap-4 p-5 relative overflow-hidden">
        <CRTOverlay />
        <PixelSparkles />
        {!showStats ? (
          <>
            {isWinner ? (
              <div className="flex flex-col items-center gap-3">
                <PixelImg src={UI_ASSETS.trophy} alt="Trophy" size={80} className="animate-bounce" />
                <h1
                  className="font-pixel text-2xl text-yellow-300"
                  style={{
                    textShadow: '0 0 20px rgba(250,204,21,0.6), 0 0 40px rgba(250,204,21,0.3), 0 2px 0 rgba(0,0,0,0.8)',
                    animation: 'winner-glow 1.5s ease-in-out infinite',
                  }}
                >
                  YOU WIN!
                </h1>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <PixelImg src={UI_ASSETS.trophy} alt="" size={56} className="opacity-60" />
                <h1 className="font-pixel text-lg text-white" style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
                  GAME OVER
                </h1>
                <p className="font-pixel-body font-bold text-lg text-yellow-300">{gameOver.winnerName} wins!</p>
              </div>
            )}

            {/* Leaderboard — arcade high score table style */}
            <PixelFrame color={isWinner ? '#facc15' : '#6366f1'} className="w-full max-w-xs">
              <div className="p-3 flex flex-col gap-1.5">
                {gameOver.rankings.map((r, i) => {
                  const isMe = r.name === name
                  const placeLabels = ['1ST', '2ND', '3RD']
                  const placeLabel = i < 3 ? placeLabels[i] : `${i + 1}TH`
                  const placeColors = ['#facc15', '#94a3b8', '#f59e0b', '#6b7280']
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2"
                      style={{
                        background: isMe ? 'rgba(250,204,21,0.1)' : 'transparent',
                        borderLeft: isMe ? '3px solid #facc15' : '3px solid transparent',
                      }}
                    >
                      <span
                        className="font-pixel text-[10px] w-10"
                        style={{ color: placeColors[i] ?? '#6b7280' }}
                      >
                        {placeLabel}
                      </span>
                      <span className={`font-pixel-body font-bold text-base flex-1 ${isMe ? 'text-yellow-300' : 'text-white/70'}`}>
                        {r.name}{isMe ? ' (you)' : ''}
                      </span>
                      <span className="font-pixel text-[9px] text-white/40">{r.score}</span>
                    </div>
                  )
                })}
              </div>
            </PixelFrame>

            {personalStats && (
              <button
                onClick={() => { setShowStats(true); vibrate(30) }}
                className="font-pixel text-[10px] px-6 py-3 text-white transition-all active:translate-y-1"
                style={{
                  background: 'linear-gradient(180deg, #8b5cf6, #7c3aed)',
                  border: '3px solid #a78bfa',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 3px 0 #5b21b6',
                }}
              >
                VIEW MY STATS
              </button>
            )}

            <p className="font-pixel-body font-semibold text-sm text-white/20 animate-pulse">Waiting for host...</p>
          </>
        ) : (
          <StatsView
            personalStats={personalStats}
            superlatives={superlatives}
            onBack={() => setShowStats(false)}
          />
        )}

        <style>{`
          @keyframes winner-glow {
            0%, 100% { filter: brightness(1); }
            50% { filter: brightness(1.3); }
          }
        `}</style>
      </div>
    )
  }

  // ─── WAITING FOR GAME TO START ─── arcade "insert coin" idle
  if (choices.length === 0) {
    return (
      <div className="h-[100dvh] bg-[#0a0818] flex flex-col items-center justify-center gap-5 p-6 relative overflow-hidden">
        <CRTOverlay />
        <PixelSparkles />

        {/* Floating gamepad pixel art */}
        <div style={{ animation: 'controller-float 3s ease-in-out infinite' }}>
          <PixelImg src={UI_ASSETS.gamepad} alt="Gamepad" size={96} />
        </div>

        {/* Player info */}
        <PixelFrame color="#22d3ee" className="px-6 py-3">
          <div className="text-center">
            <p className="font-pixel text-lg text-white" style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
              {name}
            </p>
            <p className="font-pixel text-[9px] text-cyan-300/60 mt-1">PLAYER {playerId}</p>
          </div>
        </PixelFrame>

        {/* Animated "GET READY" text */}
        <div className="flex flex-col items-center gap-3 mt-2">
          <p
            className="font-pixel text-base text-yellow-300"
            style={{
              textShadow: '0 0 15px rgba(250,204,21,0.5)',
              animation: 'ready-blink 1.2s ease-in-out infinite',
            }}
          >
            GET READY
          </p>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5"
                style={{
                  backgroundColor: '#facc15',
                  animation: 'dot-wave 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>

        <p className="font-pixel-body font-semibold text-sm text-white/20 mt-6">
          Look at the big screen!
        </p>

        <style>{`
          @keyframes controller-float {
            0%, 100% { transform: translateY(0) rotate(-3deg); }
            50% { transform: translateY(-15px) rotate(3deg); }
          }
          @keyframes ready-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
          @keyframes dot-wave {
            0%, 100% { transform: translateY(0); opacity: 0.3; }
            50% { transform: translateY(-6px); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  // ─── GAMEPLAY SCREEN ─── the main event: arcade answer buttons
  return (
    <GameplayScreen
      name={name}
      question={question}
      choices={choices}
      subject={subject}
      lockedIn={lockedIn}
      correctIndex={correctIndex}
      myChoiceIndex={myChoiceIndex}
      sendAnswer={sendAnswer}
    />
  )
}

// ═══════════════════════════════════════════════════════════════
// Gameplay Screen — extracted for clarity
// ═══════════════════════════════════════════════════════════════

function GameplayScreen({
  name, question, choices, subject, lockedIn, correctIndex, myChoiceIndex, sendAnswer,
}: {
  name: string
  question: string | null
  choices: string[]
  subject: string
  lockedIn: boolean
  correctIndex: number | null
  myChoiceIndex: number | null
  sendAnswer: (i: number) => void
}) {
  const maxChoiceLen = Math.max(...choices.map(c => c.length))
  const isLongText = maxChoiceLen > 8
  const showResult = correctIndex !== null
  const wasCorrect = myChoiceIndex !== null && correctIndex === myChoiceIndex

  const handleAnswer = useCallback((i: number) => {
    if (lockedIn) return
    vibrate(30)
    sendAnswer(i)
  }, [lockedIn, sendAnswer])

  // Vibrate on result
  const resultVibrated = useRef(false)
  useEffect(() => {
    if (showResult && !resultVibrated.current) {
      resultVibrated.current = true
      vibrate(wasCorrect ? [50, 50, 50] : [200])
    }
    if (!showResult) resultVibrated.current = false
  }, [showResult, wasCorrect])

  const subjectStyle = SUBJECT_COLORS[subject] ?? SUBJECT_COLORS.math

  return (
    <div className="h-[100dvh] bg-[#0a0818] flex flex-col overflow-hidden relative">
      <CRTOverlay />

      {/* Full-screen result flash with pixel art icon */}
      {showResult && (
        <div
          className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center"
          style={{ animation: 'result-flash 0.6s ease-out forwards' }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: wasCorrect
                ? 'radial-gradient(ellipse at center, rgba(34,197,94,0.35) 0%, transparent 70%)'
                : myChoiceIndex !== null
                ? 'radial-gradient(ellipse at center, rgba(239,68,68,0.35) 0%, transparent 70%)'
                : 'transparent',
            }}
          />
        </div>
      )}

      {/* ── Header: subject + question ── */}
      <div className="shrink-0 relative z-20">
        {/* Subject bar — colored stripe across top */}
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{
            background: `linear-gradient(90deg, ${subjectStyle.bg}, transparent 80%)`,
            borderBottom: `2px solid ${subjectStyle.border}33`,
          }}
        >
          <span className="font-pixel-body font-semibold text-sm" style={{ color: `${subjectStyle.text}88` }}>
            {name}
          </span>
          <span
            className="font-pixel text-[9px] uppercase tracking-wider px-3 py-1"
            style={{
              color: subjectStyle.text,
              border: `2px solid ${subjectStyle.border}44`,
              background: `${subjectStyle.bg}aa`,
              boxShadow: subjectStyle.glow,
            }}
          >
            {subject}
          </span>
        </div>

        {/* Question area */}
        {question && (
          <div className="px-4 py-3 text-center">
            <div
              className={`font-pixel text-white leading-relaxed ${
                question.length > 50 ? 'text-sm' : question.length > 30 ? 'text-base' : 'text-xl'
              }`}
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
            >
              {question}{subject === 'math' ? ' = ?' : ''}
            </div>
          </div>
        )}

        {/* Result feedback bar */}
        {showResult && (
          <div
            className="flex items-center justify-center gap-2 py-2 mx-3"
            style={{
              background: wasCorrect ? 'rgba(34,197,94,0.15)' : myChoiceIndex !== null ? 'rgba(239,68,68,0.15)' : 'rgba(100,100,100,0.15)',
              border: `2px solid ${wasCorrect ? '#22c55e' : myChoiceIndex !== null ? '#ef4444' : '#6b7280'}44`,
              animation: 'result-slide-in 0.3s ease-out',
            }}
          >
            <PixelImg
              src={wasCorrect ? UI_ASSETS.checkmark : UI_ASSETS.xMark}
              alt=""
              size={24}
            />
            <span
              className="font-pixel text-sm"
              style={{ color: wasCorrect ? '#4ade80' : myChoiceIndex !== null ? '#f87171' : '#9ca3af' }}
            >
              {wasCorrect ? 'CORRECT!' : myChoiceIndex !== null ? 'WRONG!' : 'TIME UP'}
            </span>
          </div>
        )}
      </div>

      {/* ── Answer buttons — arcade cabinet style ── */}
      <div className={`flex-1 grid ${isLongText ? 'grid-cols-1' : 'grid-cols-2'} gap-2.5 p-3 relative z-20`}>
        {choices.map((choice, i) => {
          const colors = ANSWER_COLORS[i]
          const isCorrectChoice = correctIndex === i
          const isMyPick = myChoiceIndex === i

          // Determine visual state
          let btnBg = colors.bg
          let btnShadow = colors.shadow
          let btnHighlight = colors.highlight
          let btnOpacity = 1
          let borderColor = colors.highlight + '66'
          let extraShadow = ''
          let labelColor = colors.label

          if (showResult) {
            if (isCorrectChoice) {
              btnBg = '#16a34a'
              btnShadow = '#15803d'
              btnHighlight = '#4ade80'
              borderColor = '#4ade80'
              extraShadow = ', 0 0 20px rgba(74,222,128,0.4)'
              labelColor = '#bbf7d0'
            } else if (isMyPick) {
              btnBg = '#dc2626'
              btnShadow = '#991b1b'
              btnHighlight = '#f87171'
              borderColor = '#f87171'
              btnOpacity = 0.9
              labelColor = '#fecaca'
            } else {
              btnBg = '#1a1a2e'
              btnShadow = '#0f0f1e'
              btnHighlight = '#2a2a4e'
              btnOpacity = 0.3
              borderColor = '#2a2a4e'
              labelColor = '#4a4a6e'
            }
          } else if (lockedIn) {
            if (isMyPick) {
              borderColor = '#fff'
              extraShadow = ', 0 0 15px rgba(255,255,255,0.2)'
            } else {
              btnBg = '#1a1a2e'
              btnShadow = '#0f0f1e'
              btnHighlight = '#2a2a4e'
              btnOpacity = 0.25
              borderColor = '#2a2a4e'
              labelColor = '#4a4a6e'
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={lockedIn}
              className="relative flex flex-col items-center justify-center select-none overflow-hidden transition-opacity duration-200"
              style={{
                opacity: btnOpacity,
                background: `linear-gradient(180deg, ${btnHighlight}22 0%, ${btnBg} 30%, ${btnShadow} 100%)`,
                border: `3px solid ${borderColor}`,
                boxShadow: `
                  inset 0 1px 0 ${btnHighlight}44,
                  inset 0 -2px 0 ${btnShadow},
                  0 4px 0 ${btnShadow},
                  0 6px 12px rgba(0,0,0,0.3)
                  ${extraShadow}
                `,
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                transform: lockedIn && isMyPick && !showResult ? 'translateY(2px)' : undefined,
              }}
              onPointerDown={(e) => {
                if (!lockedIn) {
                  const el = e.currentTarget
                  el.style.transform = 'translateY(3px)'
                  el.style.boxShadow = `
                    inset 0 1px 0 ${btnHighlight}44,
                    inset 0 -2px 0 ${btnShadow},
                    0 1px 0 ${btnShadow},
                    0 2px 4px rgba(0,0,0,0.3)
                    ${extraShadow}
                  `
                }
              }}
              onPointerUp={(e) => {
                if (!lockedIn) {
                  const el = e.currentTarget
                  el.style.transform = ''
                  el.style.boxShadow = ''
                }
              }}
              onPointerLeave={(e) => {
                const el = e.currentTarget
                el.style.transform = ''
                el.style.boxShadow = ''
              }}
            >
              {/* Corner label (A/B/C/D) — arcade button style */}
              <span
                className="absolute top-1.5 left-2.5 font-pixel text-sm"
                style={{ color: labelColor, textShadow: `0 1px 0 ${btnShadow}` }}
              >
                {ANSWER_LABELS[i]}
              </span>

              {/* Answer text */}
              <span
                className={`font-pixel-body font-bold text-center px-3 text-white ${
                  isLongText
                    ? choice.length > 30 ? 'text-base' : 'text-lg'
                    : choice.length > 6 ? 'text-2xl' : 'text-4xl'
                }`}
                style={{ textShadow: '0 2px 0 rgba(0,0,0,0.4)' }}
              >
                {choice}
              </span>

              {/* Lock indicator with pixel art */}
              {lockedIn && isMyPick && !showResult && (
                <span
                  className="absolute bottom-1.5 font-pixel text-[8px] tracking-wider"
                  style={{ color: btnHighlight, animation: 'locked-pulse 1s ease-in-out infinite' }}
                >
                  LOCKED IN
                </span>
              )}

              {/* Correct/wrong pixel art icon */}
              {showResult && isCorrectChoice && (
                <div className="absolute top-1 right-1.5">
                  <PixelImg src={UI_ASSETS.checkmark} alt="Correct" size={20} />
                </div>
              )}
              {showResult && isMyPick && !isCorrectChoice && (
                <div className="absolute top-1 right-1.5">
                  <PixelImg src={UI_ASSETS.xMark} alt="Wrong" size={20} />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Locked-in status bar */}
      {lockedIn && correctIndex === null && (
        <div
          className="shrink-0 text-center py-2.5 relative z-20"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.1), transparent)',
            borderTop: '2px solid rgba(74,222,128,0.2)',
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <PixelImg src={UI_ASSETS.hourglass} alt="" size={18} />
            <p className="font-pixel text-[9px] text-green-400" style={{ animation: 'locked-pulse 1s ease-in-out infinite' }}>
              WAITING FOR OTHERS...
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes result-flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes result-slide-in {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes locked-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Stats View — extracted for clarity
// ═══════════════════════════════════════════════════════════════

function StatsView({
  personalStats,
  superlatives,
  onBack,
}: {
  personalStats: Record<string, unknown> | null
  superlatives: { award: string; value: string | number }[] | null
  onBack: () => void
}) {
  if (!personalStats) return null

  const stats = personalStats as {
    answersTotal: number
    answersCorrect: number
    responseTimes: number[]
    fullCorrectHistory: boolean[]
    behaviorTag: string | null
  }

  let bestStreak = 0
  let cur = 0
  for (const c of (stats.fullCorrectHistory ?? [])) {
    if (c) { cur++; bestStreak = Math.max(bestStreak, cur) } else cur = 0
  }

  return (
    <div className="w-full max-w-xs space-y-3">
      <button
        onClick={onBack}
        className="font-pixel text-[9px] text-white/40 hover:text-white/70 transition-colors"
      >
        {'<'} BACK
      </button>

      <h2 className="font-pixel text-sm text-center text-white" style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
        YOUR STATS
      </h2>

      {/* Stat cards */}
      <PixelFrame color="#22d3ee" className="p-3">
        <div className="font-pixel text-[8px] text-cyan-300/50 mb-1">ACCURACY</div>
        <div className="font-pixel-body font-bold text-2xl text-cyan-400">
          {stats.answersTotal > 0
            ? `${Math.round((stats.answersCorrect / stats.answersTotal) * 100)}%`
            : '—'}
        </div>
        <div className="font-pixel-body font-semibold text-sm text-white/30 mt-0.5">
          {stats.answersCorrect}/{stats.answersTotal} correct
        </div>
      </PixelFrame>

      <div className="grid grid-cols-2 gap-2.5">
        <PixelFrame color="#facc15" className="p-3">
          <div className="font-pixel text-[7px] text-yellow-300/50 mb-1">AVG SPEED</div>
          <div className="font-pixel-body font-bold text-xl text-yellow-400">
            {stats.responseTimes?.length > 0
              ? `${(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length / 1000).toFixed(1)}s`
              : '—'}
          </div>
        </PixelFrame>

        <PixelFrame color="#4ade80" className="p-3">
          <div className="font-pixel text-[7px] text-green-300/50 mb-1">BEST STREAK</div>
          <div className="font-pixel-body font-bold text-xl text-green-400">{bestStreak}</div>
        </PixelFrame>
      </div>

      {stats.behaviorTag && (
        <PixelFrame color="#c084fc" className="p-3">
          <div className="font-pixel text-[7px] text-purple-300/50 mb-1">PLAY STYLE</div>
          <div className="font-pixel-body font-bold text-lg text-purple-400">
            {stats.behaviorTag.replace('-', ' ').toUpperCase()}
          </div>
        </PixelFrame>
      )}

      {superlatives && superlatives.length > 0 && (
        <div className="space-y-2">
          <div className="font-pixel text-[8px] text-white/40 text-center">AWARDS</div>
          {superlatives.map((s) => (
            <PixelFrame key={s.award} color="#facc15" className="p-3 flex items-center gap-3">
              <PixelImg src={UI_ASSETS.trophy} alt="" size={28} />
              <div>
                <div className="font-pixel-body font-bold text-sm text-yellow-400">{s.award}</div>
                <div className="font-pixel-body font-semibold text-sm text-white/50">{s.value}</div>
              </div>
            </PixelFrame>
          ))}
        </div>
      )}
    </div>
  )
}
