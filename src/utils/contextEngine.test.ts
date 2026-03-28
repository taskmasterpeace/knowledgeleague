import { describe, it, expect } from 'vitest'
import {
  getTimeOfDay, getSeason, getActiveHoliday, isWeekend, getDayOfWeek,
  getGameContext, getContextualGreeting, getContextTags,
} from './contextEngine'

describe('getTimeOfDay', () => {
  it('returns morning for 8am', () => {
    expect(getTimeOfDay(new Date('2026-03-27T08:00:00'))).toBe('morning')
  })
  it('returns afternoon for 2pm', () => {
    expect(getTimeOfDay(new Date('2026-03-27T14:00:00'))).toBe('afternoon')
  })
  it('returns evening for 7pm', () => {
    expect(getTimeOfDay(new Date('2026-03-27T19:00:00'))).toBe('evening')
  })
  it('returns night for 11pm', () => {
    expect(getTimeOfDay(new Date('2026-03-27T23:00:00'))).toBe('night')
  })
})

describe('getSeason', () => {
  it('returns spring for April', () => {
    expect(getSeason(new Date('2026-04-15'))).toBe('spring')
  })
  it('returns summer for July', () => {
    expect(getSeason(new Date('2026-07-04'))).toBe('summer')
  })
  it('returns fall for October', () => {
    expect(getSeason(new Date('2026-10-15'))).toBe('fall')
  })
  it('returns winter for January', () => {
    expect(getSeason(new Date('2026-01-15'))).toBe('winter')
  })
})

describe('getActiveHoliday', () => {
  it('detects Christmas', () => {
    const h = getActiveHoliday(new Date('2026-12-25T12:00:00'))
    expect(h).not.toBeNull()
    expect(h!.name).toBe('Christmas')
  })
  it('detects Halloween within window', () => {
    const h = getActiveHoliday(new Date('2026-10-30T12:00:00'))
    expect(h).not.toBeNull()
    expect(h!.name).toBe('Halloween')
  })
  it('returns null for a random Tuesday in February', () => {
    const h = getActiveHoliday(new Date('2026-02-10T12:00:00'))
    expect(h).toBeNull()
  })
  it('detects Pi Day', () => {
    const h = getActiveHoliday(new Date('2026-03-14T12:00:00'))
    expect(h).not.toBeNull()
    expect(h!.name).toBe('Pi Day')
  })
  it('detects 4th of July within window', () => {
    const h = getActiveHoliday(new Date('2026-07-03T12:00:00'))
    expect(h).not.toBeNull()
    expect(h!.name).toBe('Independence Day')
  })
})

describe('isWeekend', () => {
  it('Saturday is weekend', () => {
    expect(isWeekend(new Date('2026-03-28T12:00:00'))).toBe(true) // Saturday
  })
  it('Wednesday is not weekend', () => {
    expect(isWeekend(new Date('2026-03-25T12:00:00'))).toBe(false) // Wednesday
  })
})

describe('getDayOfWeek', () => {
  it('returns correct day name', () => {
    expect(getDayOfWeek(new Date('2026-03-27T12:00:00'))).toBe('Friday')
  })
})

describe('getGameContext', () => {
  it('returns full context object', () => {
    const ctx = getGameContext(new Date('2026-12-25T10:00:00'))
    expect(ctx.timeOfDay).toBe('morning')
    expect(ctx.season).toBe('winter')
    expect(ctx.holiday).not.toBeNull()
    expect(ctx.holiday!.name).toBe('Christmas')
    expect(ctx.player).toBeNull()
  })
})

describe('getContextualGreeting', () => {
  it('returns holiday greeting on Christmas', () => {
    const ctx = getGameContext(new Date('2026-12-25T10:00:00'))
    const greeting = getContextualGreeting(ctx)
    expect(greeting).toContain('Christmas')
  })

  it('returns time-based greeting on a regular day', () => {
    const ctx = getGameContext(new Date('2026-02-10T08:00:00'))
    const greeting = getContextualGreeting(ctx)
    expect(greeting.length).toBeGreaterThan(10)
  })

  it('uses player name when player context is set', () => {
    const ctx = getGameContext(new Date('2026-02-10T14:00:00'))
    ctx.player = {
      name: 'TestKid',
      isReturning: true,
      daysSinceLastPlay: 1,
      totalGamesPlayed: 10,
      winRate: 0.6,
      bestSubject: 'math',
      worstSubject: 'spelling',
      currentStreak: 1,
      adaptiveTier: 2,
    }
    const greeting = getContextualGreeting(ctx)
    expect(greeting).toContain('TestKid')
  })

  it('recognizes streak milestones', () => {
    const ctx = getGameContext(new Date('2026-02-10T14:00:00'))
    ctx.player = {
      name: 'Champ',
      isReturning: true,
      daysSinceLastPlay: 1,
      totalGamesPlayed: 30,
      winRate: 0.7,
      bestSubject: 'math',
      worstSubject: null,
      currentStreak: 7,
      adaptiveTier: 2,
    }
    const greeting = getContextualGreeting(ctx)
    expect(greeting).toContain('week')
  })
})

describe('getContextTags', () => {
  it('includes season and time of day', () => {
    const ctx = getGameContext(new Date('2026-07-04T15:00:00'))
    const tags = getContextTags(ctx)
    expect(tags).toContain('summer')
    expect(tags).toContain('afternoon')
    expect(tags).toContain('holiday')
  })

  it('includes weekend tag on Saturday', () => {
    const ctx = getGameContext(new Date('2026-03-28T10:00:00'))
    const tags = getContextTags(ctx)
    expect(tags).toContain('weekend')
  })

  it('includes player performance tags', () => {
    const ctx = getGameContext()
    ctx.player = {
      name: 'Pro',
      isReturning: true,
      daysSinceLastPlay: 0,
      totalGamesPlayed: 50,
      winRate: 0.9,
      bestSubject: 'math',
      worstSubject: null,
      currentStreak: 5,
      adaptiveTier: 3,
    }
    const tags = getContextTags(ctx)
    expect(tags).toContain('high-performer')
    expect(tags).toContain('on-streak')
    expect(tags).toContain('returning')
  })
})
