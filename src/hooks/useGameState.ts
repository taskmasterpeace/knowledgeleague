import { create } from 'zustand'
import type { GamePhase, GameEvent, Player, PlayerId, CPUCharacter, PowerUpType, PartyEventResult } from '../types'
import type { ControllerType } from './useGamepad'
import { PLAYER_COLORS, HINTS_PER_GAME, HINT_REMOVES_COUNT } from '../utils/constants'

const SITE_CODE_KEY = 'klk-site-code'

function getSiteCode(): string | null {
  try { return localStorage.getItem(SITE_CODE_KEY) || null } catch { return null }
}

interface PartyState {
  isPartyMode: boolean
  partyEvents: GameEvent[]       // the sequence of events to play
  partyCurrentIndex: number      // which event we're on (0-based)
  partyResults: PartyEventResult[]
  partyTotalScores: Record<PlayerId, number>
}

interface HintState {
  hintsRemaining: Record<PlayerId, number>   // hints left per player
  hintUsedThisQuestion: boolean              // true if hint was used on current question
  hiddenChoices: number[]                    // choice indices hidden by hint
}

interface PowerUpState {
  playerPowerUps: Record<PlayerId, PowerUpType[]>  // inventory per player
  activePowerUps: Record<PlayerId, PowerUpType[]>   // currently active effects
}

interface GameState extends PartyState, PowerUpState, HintState {
  phase: GamePhase
  event: GameEvent | null
  players: Player[]
  playerCount: number
  cpuCharacter: CPUCharacter | null
  winner: PlayerId | null
  controllerType: ControllerType
  siteCode: string | null

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
  setSiteCode: (code: string | null) => void
  resetGame: () => void
  rematch: () => void
  startSinglePlayer: () => void

  // Party mode actions
  startPartyMode: (eventCount: number) => void
  recordPartyEventResult: () => void
  advancePartyEvent: () => void
  endPartyMode: () => void

  // Hint actions
  useHint: (playerId: PlayerId, correctIndex: number, totalChoices: number) => void
  resetHintForQuestion: () => void

  // Power-up actions
  awardPowerUp: (id: PlayerId, type: PowerUpType) => void
  activatePowerUp: (id: PlayerId, type: PowerUpType) => void
  clearActivePowerUp: (id: PlayerId, type: PowerUpType) => void
  clearAllPowerUps: () => void
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

const ALL_EVENTS: GameEvent[] = ['marathon', 'tug-of-war', 'hurdle-dash', 'long-jump', 'spelling-bee']

function pickRandomEvents(count: number): GameEvent[] {
  const shuffled = [...ALL_EVENTS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

const defaultPartyState: PartyState = {
  isPartyMode: false,
  partyEvents: [],
  partyCurrentIndex: 0,
  partyResults: [],
  partyTotalScores: {},
}

const defaultHintState: HintState = {
  hintsRemaining: {},
  hintUsedThisQuestion: false,
  hiddenChoices: [],
}

const defaultPowerUpState: PowerUpState = {
  playerPowerUps: {},
  activePowerUps: {},
}

export const useGameState = create<GameState>((set) => ({
  phase: 'menu',
  event: null,
  players: structuredClone(defaultPlayers),
  playerCount: 2,
  cpuCharacter: null,
  winner: null,
  controllerType: null,
  siteCode: getSiteCode(),
  ...defaultPartyState,
  ...defaultHintState,
  ...defaultPowerUpState,

  setPhase: (phase) => set({ phase }),
  setEvent: (event) => set({ event }),
  setPlayerCount: (count) => set({ playerCount: count, players: makePlayers(count) }),
  setCPUCharacter: (cpu) => set((s) => ({
    cpuCharacter: cpu,
    players: s.players.map((p, i) =>
      i === 1 ? { ...p, name: cpu.name, color: cpu.color, type: 'cpu' as const, avatarUrl: cpu.avatarUrl } : p
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
  setSiteCode: (code) => {
    try {
      if (code) localStorage.setItem(SITE_CODE_KEY, code)
      else localStorage.removeItem(SITE_CODE_KEY)
    } catch { /* noop */ }
    set({ siteCode: code })
  },
  resetGame: () => set({
    phase: 'menu',
    event: null,
    players: structuredClone(defaultPlayers),
    playerCount: 2,
    cpuCharacter: null,
    winner: null,
    ...defaultPartyState,
    ...defaultHintState,
    ...defaultPowerUpState,
  }),
  rematch: () => set((s) => ({
    phase: s.isPartyMode ? 'party-setup' : 'event-select',
    winner: null,
    players: s.players.map(p => ({ ...p, position: 0, streak: 0, lockedUntil: 0, score: 0 })),
    ...defaultPartyState,
    ...defaultHintState,
    ...defaultPowerUpState,
  })),
  startSinglePlayer: () => set((s) => ({
    playerCount: 2,
    players: s.players.length >= 2
      ? [s.players[0], { ...s.players[1], type: 'cpu' as const }]
      : [...s.players, { ...makePlayers(2)[1], type: 'cpu' as const }],
  })),

  // Party mode actions
  startPartyMode: (eventCount) => set((s) => {
    const events = pickRandomEvents(eventCount)
    const totalScores: Record<PlayerId, number> = {}
    for (const p of s.players) totalScores[p.id] = 0
    return {
      isPartyMode: true,
      partyEvents: events,
      partyCurrentIndex: 0,
      partyResults: [],
      partyTotalScores: totalScores,
      event: events[0],
      phase: 'party-transition' as GamePhase,
      winner: null,
      players: s.players.map(p => ({ ...p, position: 0, streak: 0, lockedUntil: 0, score: 0 })),
    }
  }),

  recordPartyEventResult: () => set((s) => {
    const ranked = [...s.players].sort((a, b) => b.position - a.position || b.score - a.score)
    const medalPoints: Record<PlayerId, number> = {}
    const rankings = ranked.map((p, i) => {
      const pts = i === 0 ? 3 : i === 1 ? 2 : i === 2 ? 1 : 0
      medalPoints[p.id] = pts
      return { playerId: p.id, position: p.position, score: p.score }
    })
    const result: PartyEventResult = {
      event: s.event!,
      rankings,
      medalPoints,
    }
    const newTotals = { ...s.partyTotalScores }
    for (const [id, pts] of Object.entries(medalPoints)) {
      newTotals[Number(id) as PlayerId] = (newTotals[Number(id) as PlayerId] || 0) + pts
    }
    return {
      partyResults: [...s.partyResults, result],
      partyTotalScores: newTotals,
    }
  }),

  advancePartyEvent: () => set((s) => {
    const nextIndex = s.partyCurrentIndex + 1
    if (nextIndex >= s.partyEvents.length) {
      // Party is over — go to final results
      return { phase: 'party-results' as GamePhase }
    }
    return {
      partyCurrentIndex: nextIndex,
      event: s.partyEvents[nextIndex],
      phase: 'party-transition' as GamePhase,
      winner: null,
      players: s.players.map(p => ({ ...p, position: 0, streak: 0, lockedUntil: 0, score: 0 })),
      ...defaultHintState,
      ...defaultPowerUpState,
    }
  }),

  endPartyMode: () => set({
    ...defaultPartyState,
    ...defaultPowerUpState,
    phase: 'menu' as GamePhase,
    event: null,
    players: structuredClone(defaultPlayers),
    playerCount: 2,
    cpuCharacter: null,
    winner: null,
  }),

  // Hint actions
  useHint: (playerId, correctIndex, totalChoices) => set((s) => {
    const remaining = s.hintsRemaining[playerId] ?? HINTS_PER_GAME
    if (remaining <= 0 || s.hintUsedThisQuestion) return {}

    // Pick HINT_REMOVES_COUNT wrong answers to hide
    const wrongIndices = Array.from({ length: totalChoices }, (_, i) => i)
      .filter(i => i !== correctIndex && !s.hiddenChoices.includes(i))
    const shuffled = wrongIndices.sort(() => Math.random() - 0.5)
    const toHide = shuffled.slice(0, HINT_REMOVES_COUNT)

    return {
      hintsRemaining: { ...s.hintsRemaining, [playerId]: remaining - 1 },
      hintUsedThisQuestion: true,
      hiddenChoices: [...s.hiddenChoices, ...toHide],
      // Break the player's streak when they use a hint
      players: s.players.map(p => p.id === playerId ? { ...p, streak: 0 } : p),
    }
  }),

  resetHintForQuestion: () => set({ hintUsedThisQuestion: false, hiddenChoices: [] }),

  // Power-up actions
  awardPowerUp: (id, type) => set((s) => ({
    playerPowerUps: {
      ...s.playerPowerUps,
      [id]: [...(s.playerPowerUps[id] || []), type],
    },
  })),

  activatePowerUp: (id, type) => set((s) => {
    const inventory = [...(s.playerPowerUps[id] || [])]
    const idx = inventory.indexOf(type)
    if (idx === -1) return {}
    inventory.splice(idx, 1)
    return {
      playerPowerUps: { ...s.playerPowerUps, [id]: inventory },
      activePowerUps: { ...s.activePowerUps, [id]: [...(s.activePowerUps[id] || []), type] },
    }
  }),

  clearActivePowerUp: (id, type) => set((s) => {
    const active = [...(s.activePowerUps[id] || [])]
    const idx = active.indexOf(type)
    if (idx === -1) return {}
    active.splice(idx, 1)
    return { activePowerUps: { ...s.activePowerUps, [id]: active } }
  }),

  clearAllPowerUps: () => set(defaultPowerUpState),
}))
