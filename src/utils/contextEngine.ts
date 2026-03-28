/**
 * Context Engine — makes the game self-aware.
 *
 * Provides real-time awareness of:
 * - Date, time of day, season, holidays
 * - Player identity & performance
 * - Session state (returning player, streak days, etc.)
 *
 * Used by the announcer and eventually theming.
 */

// ─── Date & Time Context ────────────────────────────────────

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'
export type Season = 'spring' | 'summer' | 'fall' | 'winter'

export interface Holiday {
  name: string
  greeting: string
  month: number
  day: number
  /** How many days before/after to still acknowledge it */
  window: number
}

const HOLIDAYS: Holiday[] = [
  { name: 'New Year', greeting: "Happy New Year! Let's start the year smart!", month: 1, day: 1, window: 1 },
  { name: 'MLK Day', greeting: "Happy Martin Luther King Jr. Day! Let's dream big today!", month: 1, day: 20, window: 0 },
  { name: 'Valentine\'s Day', greeting: "Happy Valentine's Day! We love learning!", month: 2, day: 14, window: 0 },
  { name: 'Presidents Day', greeting: "Happy Presidents Day! Did you know there have been 46 presidents?", month: 2, day: 17, window: 0 },
  { name: 'Pi Day', greeting: "Happy Pi Day! 3.14159... How many digits can you remember?", month: 3, day: 14, window: 0 },
  { name: 'St. Patrick\'s Day', greeting: "Happy St. Patrick's Day! Feeling lucky today?", month: 3, day: 17, window: 0 },
  { name: 'April Fools', greeting: "Happy April Fools! Don't trust any tricky answers today!", month: 4, day: 1, window: 0 },
  { name: 'Earth Day', greeting: "Happy Earth Day! Let's learn about our planet!", month: 4, day: 22, window: 0 },
  { name: 'Cinco de Mayo', greeting: "Happy Cinco de Mayo! Let's celebrate learning!", month: 5, day: 5, window: 0 },
  { name: 'Memorial Day', greeting: "Happy Memorial Day! We honor those who served.", month: 5, day: 26, window: 0 },
  { name: 'Juneteenth', greeting: "Happy Juneteenth! Freedom and knowledge go hand in hand!", month: 6, day: 19, window: 0 },
  { name: 'Independence Day', greeting: "Happy 4th of July! Time for some fireworks and brainpower!", month: 7, day: 4, window: 1 },
  { name: 'Back to School', greeting: "Welcome back to school! Let's sharpen those skills!", month: 8, day: 25, window: 7 },
  { name: 'Labor Day', greeting: "Happy Labor Day! Hard work pays off — in games too!", month: 9, day: 1, window: 0 },
  { name: 'Halloween', greeting: "Happy Halloween! Don't be scared of these questions!", month: 10, day: 31, window: 2 },
  { name: 'Veterans Day', greeting: "Happy Veterans Day! Thank you to all who served!", month: 11, day: 11, window: 0 },
  { name: 'Thanksgiving', greeting: "Happy Thanksgiving! We're thankful for big brains!", month: 11, day: 27, window: 1 },
  { name: 'Hanukkah', greeting: "Happy Hanukkah! Eight nights of learning!", month: 12, day: 15, window: 4 },
  { name: 'Christmas', greeting: "Merry Christmas! The best gift is knowledge!", month: 12, day: 25, window: 2 },
  { name: 'Kwanzaa', greeting: "Happy Kwanzaa! Let's celebrate unity and learning!", month: 12, day: 26, window: 6 },
  { name: 'New Year\'s Eve', greeting: "Happy New Year's Eve! One last brain workout this year!", month: 12, day: 31, window: 0 },
]

export function getTimeOfDay(now = new Date()): TimeOfDay {
  const hour = now.getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'night'
}

export function getSeason(now = new Date()): Season {
  const month = now.getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'fall'
  return 'winter'
}

export function getActiveHoliday(now = new Date()): Holiday | null {
  const month = now.getMonth() + 1
  const day = now.getDate()

  for (const h of HOLIDAYS) {
    const diff = Math.abs((month - h.month) * 30 + (day - h.day))
    if (diff <= h.window) return h
  }
  return null
}

export function isWeekend(now = new Date()): boolean {
  const day = now.getDay()
  return day === 0 || day === 6
}

export function getDayOfWeek(now = new Date()): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()]
}

// ─── Time-based Greetings ───────────────────────────────────

const TIME_GREETINGS: Record<TimeOfDay, string[]> = {
  morning: [
    'Good morning! Rise and shine, brain time!',
    'Morning champion! Ready to learn?',
    'Top of the morning! Let\'s get those neurons firing!',
  ],
  afternoon: [
    'Good afternoon! Perfect time for a brain workout!',
    'Afternoon brain boost! Let\'s go!',
    'Hey there! Afternoon knowledge time!',
  ],
  evening: [
    'Good evening! Winding down with some brain games?',
    'Evening scholar! One more round?',
    'Good evening! Late night learning is the best!',
  ],
  night: [
    'Burning the midnight oil! Respect!',
    'Night owl mode activated! Let\'s do this!',
    'Up late learning? That\'s dedication!',
  ],
}

const SEASON_FACTS: Record<Season, string[]> = {
  spring: [
    'Spring is here! Did you know plants grow faster in spring because of more sunlight?',
    'Fun spring fact: baby animals are born in spring because there\'s more food!',
  ],
  summer: [
    'Summer vibes! Did you know the longest day of the year is in June?',
    'Summer fun fact: ice cream was invented in China around 200 BC!',
  ],
  fall: [
    'Fall is here! Did you know leaves change color because they stop making chlorophyll?',
    'Autumn fact: squirrels bury thousands of acorns but forget where most of them are!',
  ],
  winter: [
    'Winter wonderland! Did you know no two snowflakes are exactly alike?',
    'Winter fact: the coldest temperature ever recorded was minus 128.6 degrees in Antarctica!',
  ],
}

const WEEKEND_LINES = [
  'Weekend gaming! No homework, just fun!',
  'It\'s the weekend! Extra brain power mode!',
  'Weekend warrior! Let\'s rack up some points!',
]

// ─── Player Context ─────────────────────────────────────────

export interface PlayerContext {
  name: string
  isReturning: boolean
  daysSinceLastPlay: number
  totalGamesPlayed: number
  winRate: number        // 0-1
  bestSubject: string | null
  worstSubject: string | null
  currentStreak: number  // consecutive days played
  adaptiveTier: number
}

const RETURNING_LINES = [
  'Welcome back, {name}! Missed you!',
  '{name} is back! Let\'s pick up where we left off!',
  'Look who\'s here! {name}! Ready for another round?',
]

const FIRST_TIME_LINES = [
  'Welcome to Knowledge League Kids, {name}! Let\'s have some fun!',
  'Hey {name}! First time here? You\'re gonna love this!',
  'New challenger {name} has entered the game!',
]

const STREAK_LINES: Record<string, string[]> = {
  '3': ['{name} is on a 3-day streak! Keep it going!'],
  '5': ['{name} has played 5 days in a row! Unstoppable!'],
  '7': ['One whole week! {name} is on fire!'],
  '10': ['10 days straight! {name} is a learning machine!'],
  '30': ['30-day streak! {name} is legendary!'],
}

const PERFORMANCE_LINES = {
  improving: [
    '{name} is getting better every game!',
    'Look at that improvement, {name}! Keep climbing!',
  ],
  struggling: [
    'Keep at it, {name}! Every mistake is a lesson!',
    'Don\'t give up, {name}! You\'re learning every round!',
  ],
  dominating: [
    '{name} is on fire! Watch out!',
    'Nobody can stop {name} right now!',
  ],
}

// ─── Build Player Context from Profile ──────────────────────

import type { PlayerProfile } from './playerProfile'

export function buildPlayerContext(profile: PlayerProfile): PlayerContext {
  const now = new Date()
  const lastPlayed = profile.lastPlayedAt ? new Date(profile.lastPlayedAt) : null
  const daysSinceLastPlay = lastPlayed
    ? Math.floor((now.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60 * 24))
    : 999

  // Calculate overall win rate from category stats
  let totalAttempts = 0
  let totalCorrect = 0
  let bestSubject: string | null = null
  let worstSubject: string | null = null
  let bestRate = -1
  let worstRate = 2

  for (const [category, stats] of Object.entries(profile.stats)) {
    totalAttempts += stats.attempts
    totalCorrect += stats.correct
    if (stats.attempts >= 5) {
      const rate = stats.correct / stats.attempts
      if (rate > bestRate) { bestRate = rate; bestSubject = category }
      if (rate < worstRate) { worstRate = rate; worstSubject = category }
    }
  }

  // Estimate play streak (consecutive days) from lastPlayedAt
  // Simple heuristic: if last played within 36 hours, assume continuing streak
  const playStreak = daysSinceLastPlay <= 1 ? Math.min(profile.gamesPlayed, 30) : 0

  return {
    name: profile.name,
    isReturning: profile.gamesPlayed > 0,
    daysSinceLastPlay,
    totalGamesPlayed: profile.gamesPlayed,
    winRate: totalAttempts > 0 ? totalCorrect / totalAttempts : 0.5,
    bestSubject,
    worstSubject,
    currentStreak: playStreak,
    adaptiveTier: 1,
  }
}

// ─── Full Context Snapshot ──────────────────────────────────

export interface GameContext {
  // Time
  timeOfDay: TimeOfDay
  season: Season
  holiday: Holiday | null
  isWeekend: boolean
  dayOfWeek: string
  date: Date

  // Player (optional — set after player info is available)
  player: PlayerContext | null
}

export function getGameContext(now = new Date()): GameContext {
  return {
    timeOfDay: getTimeOfDay(now),
    season: getSeason(now),
    holiday: getActiveHoliday(now),
    isWeekend: isWeekend(now),
    dayOfWeek: getDayOfWeek(now),
    date: now,
    player: null, // populated later from game state
  }
}

/**
 * Get full context with player data from a profile.
 */
export function getFullContext(playerName?: string, now = new Date()): GameContext {
  const ctx = getGameContext(now)
  if (playerName) {
    try {
      // Lazy import to avoid circular deps — profile functions use localStorage
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getOrCreateProfile } = require('./playerProfile')
      const profile = getOrCreateProfile(playerName)
      ctx.player = buildPlayerContext(profile)
    } catch {
      // SSR or test environment — no localStorage
    }
  }
  return ctx
}

// ─── Line Picker ────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function fillName(line: string, name: string): string {
  return line.replace(/\{name\}/g, name)
}

/**
 * Get a contextual greeting line for the current moment.
 * Priority: holiday > returning player > time of day > weekend > season
 */
export function getContextualGreeting(ctx: GameContext): string {
  // Holiday takes priority
  if (ctx.holiday) {
    return ctx.holiday.greeting
  }

  // Returning player greeting
  if (ctx.player) {
    const { name, isReturning, currentStreak } = ctx.player

    // Streak milestones
    for (const [threshold, lines] of Object.entries(STREAK_LINES)) {
      if (currentStreak === Number(threshold)) {
        return fillName(pick(lines), name)
      }
    }

    if (isReturning) {
      return fillName(pick(RETURNING_LINES), name)
    } else {
      return fillName(pick(FIRST_TIME_LINES), name)
    }
  }

  // Weekend
  if (ctx.isWeekend) {
    return pick(WEEKEND_LINES)
  }

  // Time of day
  return pick(TIME_GREETINGS[ctx.timeOfDay])
}

/**
 * Get a contextual fact or flavor line (for idle moments, between rounds, etc.)
 */
export function getContextualFact(ctx: GameContext): string {
  // Season facts
  if (Math.random() < 0.5) {
    return pick(SEASON_FACTS[ctx.season])
  }

  // Player performance commentary
  if (ctx.player) {
    const { name, winRate } = ctx.player
    if (winRate > 0.75) return fillName(pick(PERFORMANCE_LINES.dominating), name)
    if (winRate < 0.35) return fillName(pick(PERFORMANCE_LINES.struggling), name)
    return fillName(pick(PERFORMANCE_LINES.improving), name)
  }

  return pick(SEASON_FACTS[ctx.season])
}

/**
 * Get all relevant context tags for the current moment.
 * Useful for theming decisions later.
 */
export function getContextTags(ctx: GameContext): string[] {
  const tags: string[] = [ctx.timeOfDay, ctx.season, ctx.dayOfWeek.toLowerCase()]
  if (ctx.isWeekend) tags.push('weekend')
  if (ctx.holiday) tags.push('holiday', ctx.holiday.name.toLowerCase().replace(/[^a-z]/g, '-'))
  if (ctx.player) {
    if (ctx.player.winRate > 0.75) tags.push('high-performer')
    if (ctx.player.winRate < 0.35) tags.push('needs-encouragement')
    if (ctx.player.currentStreak >= 3) tags.push('on-streak')
    if (ctx.player.isReturning) tags.push('returning')
    else tags.push('first-time')
  }
  return tags
}
