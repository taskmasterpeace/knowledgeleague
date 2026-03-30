import { useState, useEffect, useRef } from 'react'
import { useGameState } from '../../hooks/useGameState'
import type { PowerUpType } from '../../types'
import { POWER_UP_DEFS } from '../../types'
import { POWERUP_MAX_INVENTORY } from '../../utils/constants'

/* ------------------------------------------------------------------ */
/*  PowerUpInventory — clickable power-up slots for a single player   */
/* ------------------------------------------------------------------ */

interface InventoryProps {
  playerId: number
  compact?: boolean
}

export function PowerUpInventory({ playerId, compact = false }: InventoryProps) {
  const playerPowerUps = useGameState((s) => s.playerPowerUps)
  const activatePowerUp = useGameState((s) => s.activatePowerUp)

  const inventory = playerPowerUps[playerId] ?? []
  const slots = Array.from({ length: POWERUP_MAX_INVENTORY }, (_, i) => inventory[i] ?? null)

  const size = compact ? 32 : 44
  const fontSize = compact ? 14 : 20
  const gap = compact ? 4 : 8

  return (
    <div
      style={{
        display: 'flex',
        gap,
        alignItems: 'center',
        background: 'rgba(0,0,0,0.45)',
        borderRadius: 999,
        padding: compact ? '3px 6px' : '5px 10px',
      }}
    >
      {slots.map((type, i) => {
        const def = type ? POWER_UP_DEFS[type] : null

        return (
          <button
            key={i}
            disabled={!type}
            onClick={() => type && activatePowerUp(playerId, type)}
            title={def ? `${def.label} — ${def.description}` : 'Empty slot'}
            style={{
              width: size,
              height: size,
              borderRadius: 999,
              border: type ? '2px solid rgba(255,255,255,0.6)' : '2px solid rgba(255,255,255,0.15)',
              background: type ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize,
              cursor: type ? 'pointer' : 'default',
              opacity: type ? 1 : 0.3,
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: type ? '0 0 8px rgba(255,255,255,0.25)' : 'none',
              animation: type ? 'powerup-idle 2s ease-in-out infinite' : undefined,
              padding: 0,
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              if (type) {
                e.currentTarget.style.transform = 'scale(1.15)'
                e.currentTarget.style.boxShadow = '0 0 14px rgba(255,255,255,0.5)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = type ? '0 0 8px rgba(255,255,255,0.25)' : 'none'
            }}
          >
            {def ? def.icon : ''}
          </button>
        )
      })}

      {/* idle pulse keyframes — injected once */}
      <style>{`
        @keyframes powerup-idle {
          0%, 100% { box-shadow: 0 0 8px rgba(255,255,255,0.25); }
          50%      { box-shadow: 0 0 14px rgba(255,255,255,0.45); }
        }
      `}</style>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  PowerUpToast — notification when a power-up is earned / activated */
/* ------------------------------------------------------------------ */

interface ToastProps {
  playerId: number
  playerName: string
  playerColor: string
}

interface ToastItem {
  id: number
  type: PowerUpType
  kind: 'earned' | 'activated'
}

let toastCounter = 0

export function PowerUpToast({ playerId, playerName, playerColor }: ToastProps) {
  const playerPowerUps = useGameState((s) => s.playerPowerUps)
  const activePowerUps = useGameState((s) => s.activePowerUps)

  const prevInventory = useRef<PowerUpType[]>([])
  const prevActive = useRef<PowerUpType[]>([])
  const [toasts, setToasts] = useState<ToastItem[]>([])

  // Detect newly earned power-ups
  useEffect(() => {
    const current = playerPowerUps[playerId] ?? []
    const prev = prevInventory.current

    if (current.length > prev.length) {
      // New item is the last element
      const newType = current[current.length - 1]
      const id = ++toastCounter
      setToasts((t) => [...t, { id, type: newType, kind: 'earned' }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500)
    }

    prevInventory.current = [...current]
  }, [playerPowerUps, playerId])

  // Detect newly activated power-ups
  useEffect(() => {
    const current = activePowerUps[playerId] ?? []
    const prev = prevActive.current

    // Find types in current that weren't in prev
    const newTypes = current.filter(
      (t) => current.filter((x) => x === t).length > prev.filter((x) => x === t).length,
    )

    for (const type of newTypes) {
      const id = ++toastCounter
      setToasts((t) => [...t, { id, type, kind: 'activated' }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500)
    }

    prevActive.current = [...current]
  }, [activePowerUps, playerId])

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        const def = POWER_UP_DEFS[toast.type]
        const isActivated = toast.kind === 'activated'

        return (
          <div
            key={toast.id}
            className="font-pixel"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(0,0,0,0.75)',
              border: `2px solid ${playerColor}`,
              borderRadius: 12,
              padding: '8px 14px',
              boxShadow: `0 0 18px ${playerColor}66`,
              animation: isActivated
                ? 'powerup-flash 0.4s ease-out, powerup-fadeout 0.5s 2s forwards'
                : 'powerup-slidein 0.3s ease-out, powerup-fadeout 0.5s 2s forwards',
              color: '#fff',
              fontSize: 12,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 22 }}>{def.icon}</span>
            <div>
              <div style={{ color: playerColor, fontWeight: 700, marginBottom: 2 }}>
                {isActivated ? `${playerName} used` : `${playerName} earned`}
              </div>
              <div>{def.label}</div>
            </div>
          </div>
        )
      })}

      <style>{`
        @keyframes powerup-slidein {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes powerup-flash {
          0%   { transform: scale(1.3); opacity: 0.6; }
          50%  { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes powerup-fadeout {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(40%); }
        }
      `}</style>
    </div>
  )
}
