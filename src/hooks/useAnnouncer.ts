import { useEffect, useRef } from 'react'
import { useSettings } from './useSettings'
import { useGameState } from './useGameState'
import {
  speak, correctLine, wrongLine, leadChangeLine,
  closeRaceLine, victoryLine, stopAnnouncer,
} from '../utils/announcer'

export function useAnnouncer() {
  const { announcerEnabled, announcerVoice, announcerFrequency } = useSettings()
  const { players, winner, phase } = useGameState()
  const prevPositionsRef = useRef<Record<number, number>>({})

  const config = {
    enabled: announcerEnabled,
    voice: announcerVoice,
    frequency: announcerFrequency,
  }

  // React to winner
  useEffect(() => {
    if (winner && phase === 'victory') {
      const winnerPlayer = players.find(p => p.id === winner)
      if (winnerPlayer) {
        speak(victoryLine(winnerPlayer.name), config)
      }
    }
  }, [winner, phase])

  // Check for close race and lead changes
  useEffect(() => {
    if (phase !== 'playing') return
    if (players.length < 2) return

    const sorted = [...players].sort((a, b) => b.position - a.position)
    const leader = sorted[0]
    const second = sorted[1]

    if (leader && second) {
      const gap = leader.position - second.position
      if (gap <= 2 && gap >= 0 && leader.position > 3) {
        speak(closeRaceLine(), config)
      }

      // Lead change detection
      const prevPositions = prevPositionsRef.current
      const prevEntries = Object.entries(prevPositions)
      if (prevEntries.length > 0) {
        const prevLeaderId = prevEntries.sort(([, a], [, b]) => b - a)[0]?.[0]
        if (prevLeaderId && String(leader.id) !== prevLeaderId && leader.position > 3) {
          speak(leadChangeLine(leader.name), config)
        }
      }
    }

    // Update previous positions
    const newPositions: Record<number, number> = {}
    for (const p of players) newPositions[p.id] = p.position
    prevPositionsRef.current = newPositions
  }, [players.map(p => p.position).join(',')])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAnnouncer()
  }, [])

  return {
    announceCorrect: (playerName: string, streak: number) => {
      speak(correctLine(playerName, streak), config)
    },
    announceWrong: (playerName: string, hadStreak: boolean) => {
      speak(wrongLine(playerName, hadStreak), config)
    },
  }
}
