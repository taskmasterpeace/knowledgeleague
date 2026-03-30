import React, { useEffect, useRef, useMemo } from 'react'

// ===== PARTICLE BURST =====

interface ParticleBurstProps {
  active: boolean
  color?: string
  count?: number
}

export function ParticleBurst({ active, color = '#facc15', count = 10 }: ParticleBurstProps) {
  if (!active) return null

  /* eslint-disable react-hooks/purity */
  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 360
    const dist = 30 + Math.random() * 50
    const rad = (angle * Math.PI) / 180
    const tx = Math.cos(rad) * dist
    const ty = Math.sin(rad) * dist
    const delay = Math.random() * 100

    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          width: 6,
          height: 6,
          backgroundColor: color,
          borderRadius: 1,
          top: '50%',
          left: '50%',
          marginTop: -3,
          marginLeft: -3,
          animation: `particle-burst 0.6s ease-out forwards`,
          animationDelay: `${delay}ms`,
          transform: `translate(${tx}px, ${ty}px)`,
          transformOrigin: 'center',
        }}
      />
    )
  })
  /* eslint-enable react-hooks/purity */

  return (
    <div style={{ position: 'relative', display: 'inline-block', pointerEvents: 'none' }}>
      {particles}
    </div>
  )
}

// ===== SCREEN SHAKE =====

interface ScreenShakeProps {
  trigger: boolean
  children: React.ReactNode
}

export function ScreenShake({ trigger, children }: ScreenShakeProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const prevTrigger = useRef(false)

  useEffect(() => {
    if (trigger && !prevTrigger.current && divRef.current) {
      divRef.current.classList.add('screen-shake')
      const timer = setTimeout(() => {
        divRef.current?.classList.remove('screen-shake')
      }, 200)
      return () => clearTimeout(timer)
    }
    prevTrigger.current = trigger
  }, [trigger])

  return <div ref={divRef}>{children}</div>
}

// ===== STREAK FLAME =====

interface StreakFlameProps {
  streak: number
}

export function StreakFlame({ streak }: StreakFlameProps) {
  if (streak < 2) return null

  const size = streak >= 5 ? 28 : streak >= 3 ? 20 : 16
  const color = streak >= 5 ? '#3b82f6' : streak >= 3 ? '#ea580c' : '#f97316'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      style={{
        display: 'inline-block',
        animation: 'flame-flicker 0.6s ease-in-out infinite',
        transformOrigin: 'bottom center',
        verticalAlign: 'middle',
      }}
      aria-label={`${streak} streak`}
    >
      <path d="M12 2C12 2 7 8 7 13a5 5 0 0010 0c0-3-2-6-2-6s-1 2-2 2c-1 0-1-2-1-7z" />
      <path
        d="M12 14c0 1.1-.9 2-2 2s-2-.9-2-2c0-1.5 2-4 2-4s2 2.5 2 4z"
        fill={streak >= 5 ? '#93c5fd' : '#fed7aa'}
        opacity={0.8}
      />
    </svg>
  )
}

// ===== FLASH OVERLAY =====

interface FlashOverlayProps {
  type: 'correct' | 'wrong' | null
}

export function FlashOverlay({ type }: FlashOverlayProps) {
  if (!type) return null

  const isCorrect = type === 'correct'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: isCorrect ? '#4ade80' : '#ef4444',
        pointerEvents: 'none',
        zIndex: 9999,
        animation: isCorrect
          ? 'flash-green 0.4s ease-out forwards'
          : 'flash-red 0.4s ease-out forwards',
      }}
    />
  )
}

// ===== STREAK CELEBRATION =====
// Big celebratory burst when a player hits a milestone streak (3, 5, 7, 10)

interface StreakCelebrationProps {
  streak: number
  playerColor: string
  playerName: string
}

export function StreakCelebration({ streak, playerColor, playerName }: StreakCelebrationProps) {
  const milestones = [3, 5, 7, 10]
  if (!milestones.includes(streak)) return null

  const messages: Record<number, string> = {
    3: 'ON FIRE!',
    5: 'UNSTOPPABLE!',
    7: 'LEGENDARY!',
    10: 'G.O.A.T.!',
  }

  const sizes: Record<number, number> = { 3: 1, 5: 1.2, 7: 1.4, 10: 1.6 }
  const scale = sizes[streak] ?? 1

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 9997,
        animation: 'streak-celebrate 1.5s ease-out forwards',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          transform: `scale(${scale})`,
        }}
      >
        <span
          className="font-pixel text-2xl"
          style={{
            color: playerColor,
            textShadow: `0 0 20px ${playerColor}, 0 0 40px ${playerColor}, 2px 2px 0 #000`,
            animation: 'bounce 0.3s ease-in-out',
          }}
        >
          {messages[streak]}
        </span>
        <span className="font-pixel-body font-bold text-sm text-white/80">
          {playerName} — {streak} in a row!
        </span>
        {/* Ring of emojis */}
        {Array.from({ length: streak >= 7 ? 12 : streak >= 5 ? 8 : 6 }, (_, i) => {
          const angle = (i / (streak >= 7 ? 12 : streak >= 5 ? 8 : 6)) * 360
          const rad = (angle * Math.PI) / 180
          const dist = 60 + streak * 5
          return (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${Math.cos(rad) * dist}px, ${Math.sin(rad) * dist}px)`,
                fontSize: streak >= 7 ? 24 : 18,
                animation: `particle-burst 1s ease-out ${i * 50}ms forwards`,
                opacity: 0.8,
              }}
            >
              {streak >= 10 ? '🌟' : streak >= 7 ? '💥' : streak >= 5 ? '🔥' : '⚡'}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ===== FIREWORKS =====

interface FireworksProps {
  active: boolean
}

const FIREWORK_COLORS = ['#facc15', '#f97316', '#a855f7', '#3b82f6', '#10b981', '#ec4899']

export function Fireworks({ active }: FireworksProps) {
  /* eslint-disable react-hooks/purity */
  const bursts = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => ({
      id: i,
      top: `${15 + Math.random() * 60}%`,
      left: `${10 + Math.random() * 80}%`,
      color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
      size: 40 + Math.floor(Math.random() * 40),
      delay: i * 300,
    }))
  }, [])
  /* eslint-enable react-hooks/purity */

  if (!active) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    >
      {bursts.map((burst) => (
        <svg
          key={burst.id}
          width={burst.size}
          height={burst.size}
          viewBox="0 0 40 40"
          style={{
            position: 'absolute',
            top: burst.top,
            left: burst.left,
            transform: 'translate(-50%, -50%)',
            animation: 'firework-burst 0.8s ease-out forwards',
            animationDelay: `${burst.delay}ms`,
            opacity: 0,
          }}
        >
          <circle cx="20" cy="20" r="18" fill={burst.color} />
        </svg>
      ))}
    </div>
  )
}
