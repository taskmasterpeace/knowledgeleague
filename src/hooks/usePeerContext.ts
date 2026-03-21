import { createContext, useContext } from 'react'
import type { RemotePlayer } from './usePeerHost'

export interface PeerHostContext {
  enabled: boolean
  roomId: string | null
  joinUrl: string | null
  remotePlayers: RemotePlayer[]
  spectators: { name: string; connId: string }[]
  broadcastProblem: (question: string, choices: string[], subject: string) => void
  broadcastResult: (correctIndex: number) => void
  broadcastLockIn: (playerId: number) => void
  broadcastGameOver: (winnerName: string, rankings: { name: string; score: number; position: number }[]) => void
  broadcastSpectatorUpdate: (data: Record<string, unknown>) => void
  broadcastStats: (stats: Record<string, unknown>) => void
  setEnabled: (enabled: boolean) => void
}

export const PeerContext = createContext<PeerHostContext>({
  enabled: false,
  roomId: null,
  joinUrl: null,
  remotePlayers: [],
  spectators: [],
  broadcastProblem: () => {},
  broadcastResult: () => {},
  broadcastLockIn: () => {},
  broadcastGameOver: () => {},
  broadcastSpectatorUpdate: () => {},
  broadcastStats: () => {},
  setEnabled: () => {},
})

export function usePeerContext() {
  return useContext(PeerContext)
}
