import { create } from 'zustand'
import type { GamePhase, GameEvent, Player, CPUCharacter } from '../types'

interface GameState {
  phase: GamePhase
  event: GameEvent | null
  players: [Player, Player]
  cpuCharacter: CPUCharacter | null
  winner: 1 | 2 | null

  setPhase: (phase: GamePhase) => void
  setEvent: (event: GameEvent) => void
  setCPUCharacter: (cpu: CPUCharacter) => void
  setPlayerName: (id: 1 | 2, name: string) => void
  setPlayerColor: (id: 1 | 2, color: string) => void
  updatePosition: (id: 1 | 2, delta: number) => void
  setPosition: (id: 1 | 2, position: number) => void
  incrementStreak: (id: 1 | 2) => void
  resetStreak: (id: 1 | 2) => void
  lockPlayer: (id: 1 | 2, until: number) => void
  incrementScore: (id: 1 | 2) => void
  setWinner: (id: 1 | 2) => void
  resetGame: () => void
  startSinglePlayer: () => void
}

const defaultPlayers: [Player, Player] = [
  { id: 1, name: 'Player 1', color: '#3b82f6', type: 'human', position: 0, streak: 0, lockedUntil: 0, score: 0 },
  { id: 2, name: 'Player 2', color: '#ef4444', type: 'human', position: 0, streak: 0, lockedUntil: 0, score: 0 },
]

export const useGameState = create<GameState>((set) => ({
  phase: 'menu',
  event: null,
  players: structuredClone(defaultPlayers),
  cpuCharacter: null,
  winner: null,

  setPhase: (phase) => set({ phase }),
  setEvent: (event) => set({ event }),
  setCPUCharacter: (cpu) => set((s) => ({
    cpuCharacter: cpu,
    players: [s.players[0], { ...s.players[1], name: cpu.name, color: cpu.color, type: 'cpu' }] as [Player, Player],
  })),
  setPlayerName: (id, name) => set((s) => ({
    players: s.players.map(p => p.id === id ? { ...p, name } : p) as [Player, Player],
  })),
  setPlayerColor: (id, color) => set((s) => ({
    players: s.players.map(p => p.id === id ? { ...p, color } : p) as [Player, Player],
  })),
  updatePosition: (id, delta) => set((s) => ({
    players: s.players.map(p => p.id === id ? { ...p, position: p.position + delta } : p) as [Player, Player],
  })),
  setPosition: (id, position) => set((s) => ({
    players: s.players.map(p => p.id === id ? { ...p, position } : p) as [Player, Player],
  })),
  incrementStreak: (id) => set((s) => ({
    players: s.players.map(p => p.id === id ? { ...p, streak: p.streak + 1 } : p) as [Player, Player],
  })),
  resetStreak: (id) => set((s) => ({
    players: s.players.map(p => p.id === id ? { ...p, streak: 0 } : p) as [Player, Player],
  })),
  lockPlayer: (id, until) => set((s) => ({
    players: s.players.map(p => p.id === id ? { ...p, lockedUntil: until } : p) as [Player, Player],
  })),
  incrementScore: (id) => set((s) => ({
    players: s.players.map(p => p.id === id ? { ...p, score: p.score + 1 } : p) as [Player, Player],
  })),
  setWinner: (id) => set({ winner: id, phase: 'victory' }),
  resetGame: () => set({
    phase: 'menu',
    event: null,
    players: structuredClone(defaultPlayers),
    cpuCharacter: null,
    winner: null,
  }),
  startSinglePlayer: () => set((s) => ({
    players: [s.players[0], { ...s.players[1], type: 'cpu' }] as [Player, Player],
  })),
}))
