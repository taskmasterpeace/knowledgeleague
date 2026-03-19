import { createContext, useContext } from 'react'
import type { RemotePlayer } from './usePeerHost'

export interface PeerHostContext {
  enabled: boolean
  roomId: string | null
  joinUrl: string | null
  remotePlayers: RemotePlayer[]
  broadcastProblem: (question: string, choices: string[], subject: string) => void
  broadcastResult: (correctIndex: number) => void
  broadcastLockIn: (playerId: number) => void
  setEnabled: (enabled: boolean) => void
}

export const PeerContext = createContext<PeerHostContext>({
  enabled: false,
  roomId: null,
  joinUrl: null,
  remotePlayers: [],
  broadcastProblem: () => {},
  broadcastResult: () => {},
  broadcastLockIn: () => {},
  setEnabled: () => {},
})

export function usePeerContext() {
  return useContext(PeerContext)
}
