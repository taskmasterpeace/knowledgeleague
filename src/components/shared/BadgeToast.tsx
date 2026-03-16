import { useEffect, useState } from 'react'
import type { Badge } from '../../types'
import { BadgeIcon } from './BadgeIcon'

interface BadgeToastProps {
  badge: Badge | null
}

const CATEGORY_LABELS: Record<string, string> = {
  addition: 'Addition',
  subtraction: 'Subtraction',
  missing: 'Missing Number',
  comparison: 'Comparison',
  'skip-counting': 'Skip Counting',
}

const TIER_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  master: 'Master',
}

export function BadgeToast({ badge }: BadgeToastProps) {
  const [visible, setVisible] = useState(false)
  const [slidingOut, setSlidingOut] = useState(false)

  useEffect(() => {
    if (!badge) return

    setVisible(true)
    setSlidingOut(false)

    const slideOutTimer = setTimeout(() => {
      setSlidingOut(true)
    }, 3000)

    const hideTimer = setTimeout(() => {
      setVisible(false)
      setSlidingOut(false)
    }, 3300)

    return () => {
      clearTimeout(slideOutTimer)
      clearTimeout(hideTimer)
    }
  }, [badge])

  if (!visible || !badge) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        animation: slidingOut
          ? 'toast-slide-out 0.3s ease-in forwards'
          : 'toast-slide-in 0.3s ease-out forwards',
      }}
    >
      <div
        style={{
          background: 'rgba(15, 15, 30, 0.95)',
          border: '2px solid rgba(255,255,255,0.15)',
          borderRadius: '1rem',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          minWidth: '220px',
        }}
      >
        <BadgeIcon tier={badge.tier} size={40} earned />
        <div>
          <div
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Badge Earned!
          </div>
          <div
            style={{
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {CATEGORY_LABELS[badge.category] ?? badge.category}
          </div>
          <div
            style={{
              color: '#fbbf24',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            {TIER_LABELS[badge.tier] ?? badge.tier}
          </div>
        </div>
      </div>
    </div>
  )
}
