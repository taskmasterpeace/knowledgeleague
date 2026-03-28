import { useState, useCallback, useEffect, useRef } from 'react'
import { sounds } from '../utils/sounds'
import { speak, lockInLine } from '../utils/announcer'
import { useSettings } from './useSettings'
import type { PlayerId } from '../types'

export function useLockIn(players: { id: number; name: string }[]) {
  const [lockedIn, setLockedIn] = useState<Set<PlayerId>>(new Set())
  const { soundEnabled, announcerEnabled, announcerVoice, announcerFrequency } = useSettings()
  const announcerConfig = useRef({ enabled: announcerEnabled, voice: announcerVoice, frequency: announcerFrequency })

  useEffect(() => {
    announcerConfig.current = { enabled: announcerEnabled, voice: announcerVoice, frequency: announcerFrequency }
  }, [announcerEnabled, announcerVoice, announcerFrequency])

  const onLockIn = useCallback((playerId: PlayerId) => {
    setLockedIn(prev => {
      const next = new Set(prev)
      next.add(playerId)

      if (soundEnabled) sounds.lockIn()

      const player = players.find(p => p.id === playerId)
      if (player) {
        speak(
          lockInLine(player.name, next.size, players.length),
          announcerConfig.current,
        )
      }

      return next
    })
  }, [players, soundEnabled])

  const resetLockIn = useCallback(() => {
    setLockedIn(new Set())
  }, [])

  return { lockedIn, onLockIn, resetLockIn }
}
