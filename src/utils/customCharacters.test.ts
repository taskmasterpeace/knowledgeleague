import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getCustomCharacter,
  getCustomCharacterFrames,
  getCustomCharacterPortrait,
  saveCustomCharacter,
  deleteCustomCharacter,
  getAllCustomCharacters,
} from './customCharacters'

// Mock localStorage
const store: Record<string, string> = {}
beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k])
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
  })
})

const mockChar = {
  name: 'TestPlayer',
  description: 'a blue robot',
  idle: 'data:image/png;base64,idle123',
  runFrames: ['data:image/png;base64,f1', 'data:image/png;base64,f2'],
  south: 'data:image/png;base64,south123',
  createdAt: '2026-01-01T00:00:00Z',
}

describe('saveCustomCharacter + getCustomCharacter', () => {
  it('saves and retrieves by name (case-insensitive)', () => {
    saveCustomCharacter(mockChar)
    const result = getCustomCharacter('testplayer')
    expect(result).not.toBeNull()
    expect(result!.description).toBe('a blue robot')
    expect(result!.runFrames).toHaveLength(2)
  })

  it('retrieves by mixed case name', () => {
    saveCustomCharacter(mockChar)
    expect(getCustomCharacter('TestPlayer')).not.toBeNull()
    expect(getCustomCharacter('TESTPLAYER')).not.toBeNull()
  })

  it('returns null for unknown name', () => {
    expect(getCustomCharacter('nobody')).toBeNull()
  })
})

describe('getCustomCharacterFrames', () => {
  it('returns run frames when available', () => {
    saveCustomCharacter(mockChar)
    expect(getCustomCharacterFrames('TestPlayer')).toEqual(mockChar.runFrames)
  })

  it('falls back to idle when no run frames', () => {
    saveCustomCharacter({ ...mockChar, runFrames: [] })
    expect(getCustomCharacterFrames('TestPlayer')).toEqual([mockChar.idle])
  })

  it('returns empty array for unknown player', () => {
    expect(getCustomCharacterFrames('nobody')).toEqual([])
  })
})

describe('getCustomCharacterPortrait', () => {
  it('returns south-facing sprite', () => {
    saveCustomCharacter(mockChar)
    expect(getCustomCharacterPortrait('TestPlayer')).toBe(mockChar.south)
  })

  it('falls back to idle when no south', () => {
    saveCustomCharacter({ ...mockChar, south: '' })
    expect(getCustomCharacterPortrait('TestPlayer')).toBe(mockChar.idle)
  })
})

describe('deleteCustomCharacter', () => {
  it('removes the character', () => {
    saveCustomCharacter(mockChar)
    expect(getCustomCharacter('TestPlayer')).not.toBeNull()
    deleteCustomCharacter('TestPlayer')
    expect(getCustomCharacter('TestPlayer')).toBeNull()
  })
})

describe('getAllCustomCharacters', () => {
  it('returns all saved characters', () => {
    saveCustomCharacter(mockChar)
    saveCustomCharacter({ ...mockChar, name: 'Player2', description: 'a cat' })
    const all = getAllCustomCharacters()
    expect(all).toHaveLength(2)
  })
})
