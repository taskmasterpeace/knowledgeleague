import { useEffect, useState, useRef } from 'react'
import { sounds } from '../../utils/sounds'
import { speak } from '../../utils/announcer'
import { useSettings } from '../../hooks/useSettings'

interface CountdownProps {
  playerNames: string[]
  eventName: string
  onComplete: () => void
}

const HYPE_INTROS = [
  (names: string[], event: string) =>
    `${names.join(' versus ')}! ${event} is about to begin! Get ready!`,
  (names: string[], event: string) =>
    `It's ${names.join(' and ')}! Time for ${event}! Let's go!`,
  (names: string[], event: string) =>
    `Welcome to ${event}! ${names.join(' versus ')}! This is gonna be epic!`,
  (names: string[], event: string) =>
    `${names.join(', ')}! The ${event} starts now! Show me what you've got!`,
]

type Phase = 3 | 2 | 1 | 'go' | 'done'

export default function Countdown({ playerNames, eventName, onComplete }: CountdownProps) {
  const { announcerEnabled, announcerVoice, announcerFrequency } = useSettings()
  const announcerConfig = { enabled: announcerEnabled, voice: announcerVoice, frequency: announcerFrequency }
  const [phase, setPhase] = useState<Phase>(3)
  const [sparks] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      angle: i * 30,
      delay: Math.random() * 0.15,
      dist: 100 + Math.random() * 80,
    }))
  )
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    // Announcer hype line on mount
    const intro = HYPE_INTROS[Math.floor(Math.random() * HYPE_INTROS.length)]
    speak(
      { text: intro(playerNames, eventName), priority: 'high' },
      announcerConfig,
    )

    const timers: ReturnType<typeof setTimeout>[] = []

    // 3 -> 2 at 1s
    timers.push(setTimeout(() => setPhase(2), 1000))
    // 2 -> 1 at 2s
    timers.push(setTimeout(() => setPhase(1), 2000))
    // 1 -> GO at 3s
    timers.push(setTimeout(() => {
      setPhase('go')
      sounds.gameStart()
    }, 3000))
    // GO -> done at 3.5s
    timers.push(setTimeout(() => {
      setPhase('done')
      onCompleteRef.current()
    }, 3500))

    return () => timers.forEach(clearTimeout)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'done') return null

  const isGo = phase === 'go'
  const display = isGo ? 'GO!' : String(phase)

  return (
    <div style={styles.overlay}>
      <style>{keyframes}</style>
      <div
        key={display}
        style={{
          ...styles.text,
          ...(isGo ? styles.goText : styles.numberText),
          animation: isGo
            ? 'cd-burst 0.5s ease-out forwards'
            : 'cd-pop 0.85s ease-out forwards',
        }}
      >
        {display}
      </div>
      {isGo && (
        <>
          {sparks.map((s, i) => (
            <div
              key={i}
              style={{
                ...styles.spark,
                '--angle': `${s.angle}deg`,
                '--delay': `${s.delay}s`,
                '--dist': `${s.dist}px`,
                animation: 'cd-spark 0.5s ease-out forwards',
                animationDelay: `var(--delay)`,
              } as React.CSSProperties}
            />
          ))}
        </>
      )}
      <div style={styles.eventLabel}>{eventName}</div>
    </div>
  )
}

const keyframes = `
@keyframes cd-pop {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  50% {
    transform: scale(1.15);
    opacity: 1;
  }
  75% {
    transform: scale(0.95);
    opacity: 1;
  }
  85% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}

@keyframes cd-burst {
  0% {
    transform: scale(0.4);
    opacity: 0;
  }
  30% {
    transform: scale(1.4);
    opacity: 1;
  }
  60% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1.2);
    opacity: 1;
  }
}

@keyframes cd-spark {
  0% {
    transform: rotate(var(--angle)) translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: rotate(var(--angle)) translateY(var(--dist)) scale(0);
    opacity: 0;
  }
}

@keyframes cd-pulse-bg {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 0.92; }
}
`

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    background: 'radial-gradient(ellipse at center, rgba(10,5,30,0.97) 0%, rgba(0,0,0,1) 100%)',
    animation: 'cd-pulse-bg 1s ease-in-out infinite',
    imageRendering: 'pixelated',
  },
  text: {
    fontFamily: '"Press Start 2P", monospace',
    textAlign: 'center',
    userSelect: 'none',
    willChange: 'transform, opacity',
    lineHeight: 1,
  },
  numberText: {
    fontSize: 'clamp(6rem, 20vw, 14rem)',
    color: '#fff',
    textShadow:
      '0 0 40px rgba(100,140,255,0.8), 0 0 80px rgba(80,100,255,0.5), 0 4px 0 #1a1a4a, 0 8px 0 #0d0d2a',
    WebkitTextStroke: '2px rgba(120,160,255,0.3)',
  },
  goText: {
    fontSize: 'clamp(5rem, 18vw, 12rem)',
    color: '#00ff6a',
    textShadow:
      '0 0 40px rgba(0,255,100,0.9), 0 0 80px rgba(0,255,100,0.5), 0 0 120px rgba(0,200,80,0.3), 0 4px 0 #005a20, 0 8px 0 #003310',
    WebkitTextStroke: '2px rgba(0,255,100,0.3)',
  },
  spark: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#00ff6a',
    boxShadow: '0 0 8px #00ff6a, 0 0 16px rgba(0,255,100,0.5)',
    top: '50%',
    left: '50%',
    marginTop: -4,
    marginLeft: -4,
    pointerEvents: 'none',
  },
  eventLabel: {
    position: 'absolute',
    bottom: '12%',
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 'clamp(0.7rem, 2vw, 1.1rem)',
    color: 'rgba(180,200,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    textShadow: '0 0 10px rgba(100,140,255,0.4)',
  },
}
