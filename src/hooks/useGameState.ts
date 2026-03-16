import { create } from 'zustand'
import type { GamePhase, GameEvent, Player, PlayerId, CPUCharacter } from '../types'
import type { ControllerType } from './useGamepad'
import { PLAYER_COLORS } from '../utils/constants'

interface GameState {
  phase: GamePhase
  event: GameEvent | null
  players: Player[]
  playerCount: number
  cpuCharacter: CPUCharacter | null
  winner: PlayerId | null
  controllerType: ControllerType

  setPhase: (phase: GamePhase) => void
  setEvent: (event: GameEvent) => void
  setPlayerCount: (count: number) => void
  setCPUCharacter: (cpu: CPUCharacter) => void
  setPlayerName: (id: PlayerId, name: string) => void
  setPlayerColor: (id: PlayerId, color: string) => void
  setPlayerAvatar: (id: PlayerId, url: string) => void
  updatePosition: (id: PlayerId, delta: number) => void
  setPosition: (id: PlayerId, position: number) => void
  incrementStreak: (id: PlayerId) => void
  resetStreak: (id: PlayerId) => void
  lockPlayer: (id: PlayerId, until: number) => void
  incrementScore: (id: PlayerId) => void
  setWinner: (id: PlayerId) => void
  setControllerType: (type: ControllerType) => void
  resetGame: () => void
  rematch: () => void
  startSinglePlayer: () => void
}

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: (i + 1) as PlayerId,
    name: `Player ${i + 1}`,
    color: PLAYER_COLORS[i] || PLAYER_COLORS[0],
    type: 'human' as const,
    position: 0,
    streak: 0,
    lockedUntil: 0,
    score: 0,
    avatarUrl: null,
  }))
}

const defaultPlayers = makePlayers(2)

export const useGameState = create<GameState>((set) => ({
  phase: 'menu',
  event: null,
  players: structuredClone(defaultPlayers),
  playerCount: 2,
  cpuCharacter: null,
  winner: null,
  controllerType: null,

  setPhase: (phase) => set({ phase }),
  setEvent: (event) => set({ event }),
  setPlayerCount: (count) => set({ playerCount: count, players: makePlayers(count) }),
  setCPUCharacter: (cpu) => set((s) => ({
    cpuCharacter: cpu,
    players: s.players.map((p, i) =>
      i === 1 ? { ...p, name: cpu.name, color: cpu.color, type: 'cpu' as const, avatarUrl: cpu.animatedUrl } : p
    ),
  })),
  setPlayerName: (id, name) => set((s) => ({
    players: s.players.map(p => p.id === id ? { ...p, name } : p),
  })),
  setPlayerColor: (id, color) => set((s) => ({
    players: s.players.map(p => p.id === id ? { ...p, color } : p),
  })),
  setPlayerAvatar: (id, url) => set((s) => ({
    players: s.players.map(p => p.id === id ? { ...p, avatarUrl: url } : p),
  })),
  updatePosition: (id, delta) => set((s) => ({
    players: s.players.map(p => p.id === id ? { ...p, position: p.position + delta } : p),
  })),
  setPosition: (id, position) => set((s) => ({
    players: s.players.map(p => p.id === id ? { ...p, position } : p),
  })),
  incrementStreak: (id) => set((s) => ({
    players: s.players.map(p => p.id === id ? { ...p, streak: p.streak + 1 } : p),
  })),
  resetStreak: (id) => set((s) => ({
    players: s.players.map(p => p.id === id ? { ...p, streak: 0 } : p),
  })),
  lockPlayer: (id, until) => set((s) => ({
    players: s.players.map(p => p.id === id ? { ...p, lockedUntil: until } : p),
  })),
  incrementScore: (id) => set((s) => ({
    players: s.players.map(p => p.id === id ? { ...p, score: p.score + 1 } : p),
  })),
  setWinner: (id) => set({ winner: id, phase: 'victory' }),
  setControllerType: (controllerType) => set({ controllerType }),
  resetGame: () => set({
    phase: 'menu',
    event: null,
    players: structuredClone(defaultPlayers),
    playerCount: 2,
    cpuCharacter: null,
    winner: null,
  }),
  rematch: () => set((s) => ({
    phase: 'event-select',
    winner: null,
    players: s.players.map(p => ({ ...p, position: 0, streak: 0, lockedUntil: 0, score: 0 })),
  })),
  startSinglePlayer: () => set((s) => ({
    playerCount: 2,
    players: s.players.length >= 2
      ? [s.players[0], { ...s.players[1], type: 'cpu' as const }]
      : [...s.players, { ...makePlayers(2)[1], type: 'cpu' as const }],
  })),
}))
