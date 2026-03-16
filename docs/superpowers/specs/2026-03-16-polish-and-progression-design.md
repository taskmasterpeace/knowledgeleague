# Brain Games: Polish & Progression

**Date:** 2026-03-16
**Status:** Approved

## Overview

Five features that turn Brain Games from a functional prototype into a game kids want to keep playing. Permanent character avatars, visual celebration effects, configurable problem categories, per-category performance tracking, and a mastery badge system.

## 1. Permanent CPU Avatars

### Problem
CPU character avatars (Kevin, Sally, Benny, Mia) require a Replicate API key, manual generation per character, and depend on localStorage. They frequently disappear.

### Solution
Ship pre-generated pixel art portraits and walking GIF animations as static files in `public/avatars/cpu/`. Reference them directly in `constants.ts`. No API call, no localStorage, always there.

### Files
```
public/avatars/cpu/
  kevin-portrait.png     (128x128, retro-diffusion portrait style)
  kevin-walk.gif         (48x48, four_angle_walking)
  sally-portrait.png
  sally-walk.gif
  benny-portrait.png
  benny-walk.gif
  mia-portrait.png
  mia-walk.gif
```

### Changes
- `src/utils/constants.ts` — Add `avatarUrl` and `animatedUrl` fields to each `CPU_CHARACTERS` entry pointing to `/avatars/cpu/<name>-portrait.png` and `/avatars/cpu/<name>-walk.gif`
- `src/components/CPUSelect/CPUSelect.tsx` — Remove "Generate Avatar" button and Replicate generation logic. Always show the static portrait.
- `src/utils/cpuAvatars.ts` — Remove or deprecate. No longer needed for CPU characters.
- `src/hooks/useGameState.ts` — `setCPUCharacter` reads `avatarUrl`/`animatedUrl` directly from the character definition.
- Keep Replicate API integration for player-created custom avatars (AvatarSelect).

### Missing Assets
Kevin and Sally portraits/animations exist from test run. Benny and Mia need generation during implementation using the same pipeline (retro-diffusion/rd-fast portrait + rd-animation four_angle_walking).

## 2. Celebration Juice (Visual Effects)

### Correct Answer
- Green particle burst from the correct answer card (8-12 small squares that fly outward and fade)
- Brief green flash overlay on the screen (100ms)
- Player avatar does a victory hop (new CSS keyframe `avatar-hop`: translateY(-12px) and back over 400ms, triggered by adding `.animate-hop` class for 400ms then removing it)

### Wrong Answer
- Screen shake effect (CSS transform, 200ms, 4px displacement)
- Red flash overlay (100ms)
- Wrong answer card briefly pulses red

### Streak Effects
- Streak 2: Small flame icon appears next to player name
- Streak 3+: Flame grows, color shifts from orange to blue
- Streak 5+: Flame becomes a trail effect on the avatar
- Flame disappears immediately when streak resets to 0 (on wrong answer or no answer)

### Victory
- Existing confetti enhanced with more pieces (40 instead of 20)
- Winner avatar scales up with a golden glow pulse
- Pixel art firework bursts (3-4 timed SVG explosions)
- Screen flash to white then fade in results

### Implementation
All effects are CSS animations and inline SVG. No external libraries. New file: `src/components/shared/Effects.tsx` with:
- `ParticleBurst` component (position, color, count)
- `ScreenShake` wrapper component (trigger prop)
- `StreakFlame` component (streak count — renders nothing when streak < 2)
- `Fireworks` component (for victory)

CSS additions to `src/index.css`:
- `@keyframes particle-burst` — outward expansion + fade
- `@keyframes screen-shake` — rapid x/y displacement
- `@keyframes flame-flicker` — scale + opacity oscillation
- `@keyframes avatar-hop` — quick bounce up and back
- `.screen-shake` class applied to game container on wrong answer
- `.animate-hop` class for avatar victory hop

## 3. Problem Categories in Settings

### Reusing Existing Type
The existing `ProblemType` from `src/types.ts` (`'addition' | 'subtraction' | 'missing' | 'comparison' | 'skip-counting'`) is used directly. No new type alias needed.

### New Setting: `enabledCategories`
```typescript
// Added to Settings interface
enabledCategories: ProblemType[]
```

Default: all five enabled. At least one must remain enabled (UI prevents deselecting the last one).

### Settings UI
New section in Settings modal between "Difficulty" and "Time per Question":

```
PROBLEM TYPES
[x] Addition       [x] Subtraction
[x] Missing Number [x] Comparison
[x] Skip Counting
```

Chip/toggle style matching existing settings buttons. Each is independently toggleable. If only one remains, it's visually locked (can't deselect).

### Math Engine Changes
- `src/utils/mathProblems.ts` — `generateProblem(difficulty, enabledCategories)` accepts a filter. Instead of generating then re-rolling, the function first intersects enabled categories with the categories available at the current difficulty level. If the intersection is non-empty, it picks randomly from that set. If empty, it searches adjacent difficulty levels (down first, then up) until it finds one with matching categories.
- `src/hooks/useMathEngine.ts` — Reads `enabledCategories` from settings store and passes to `generateProblem`.

### Category-Difficulty Matrix (current code behavior)
| Category | Easy | Medium | Hard |
|---|---|---|---|
| Addition | Yes | Yes | No |
| Subtraction | No | Yes | No |
| Missing Number | No | No | Yes |
| Comparison | No | No | Yes |
| Skip Counting | No | No | Yes |

**Fallback logic:** When enabled categories have no overlap with the current difficulty level, search adjacent difficulties. Check lower difficulty first (so kids get easier problems rather than harder ones), then higher. Example: if only "addition" is enabled and difficulty is Hard, fall back to Medium addition. If only "missing number" is enabled and difficulty is Easy, bump up to Hard.

## 4. Performance Tracking

### Data Structure
```typescript
interface CategoryStats {
  attempts: number
  correct: number
  bestStreak: number
  currentStreak: number
  totalResponseTimeMs: number  // sum of ALL response times (correct and wrong)
  lastPlayed: string           // ISO date
}

interface PlayerProfile {
  id: string                   // UUID, generated on first creation
  name: string
  stats: Record<ProblemType, CategoryStats>
  gamesPlayed: number
  totalCorrect: number
  badges: Badge[]
  createdAt: string
  lastPlayedAt: string
}
```

### Storage
- Key: `brainGames:profile:<uuid>` in localStorage
- Index key: `brainGames:profiles` — maps player names to UUIDs for lookup
- Name collisions: If two kids both type "Max", the game looks up the existing profile for "Max" by UUID. A name change creates a new profile (old one remains accessible from Trophy Shelf).
- New file: `src/utils/playerProfile.ts`
  - `getOrCreateProfile(name: string): PlayerProfile`
  - `recordAnswer(profileId: string, category: ProblemType, correct: boolean, responseTimeMs: number): Badge | null` — returns a newly earned Badge if a threshold was crossed, null otherwise
  - `recordGameComplete(profileId: string): void`
  - `getAllProfiles(): PlayerProfile[]` — for Trophy Shelf player picker

### Relationship to `playerStorage.ts`
`playerStorage.ts` handles avatar/name persistence per PlayerId slot (1-4). `playerProfile.ts` handles stats/badges per named player. These are independent systems. `playerStorage` persists session-to-session slot preferences; `playerProfile` persists cumulative learning data. No migration needed.

### Integration Points
- `MathMarathon.tsx` and `TugOfWar.tsx` — After each round resolves, call `recordAnswer()` for each human player with the problem's `type` field, correctness, and response time. If `recordAnswer` returns a Badge, show the BadgeToast.
- Profile is loaded by player name (from useGameState) via `getOrCreateProfile`. CPU players don't get profiles.

### Smart Adaptive Mode
When difficulty is set to "adaptive", the weighting logic applies across all currently enabled categories (regardless of how many are enabled):
- Track accuracy per category over the last 20 attempts
- Categories below 60% accuracy get 2x weight in random selection
- Categories above 90% accuracy get 0.5x weight
- This naturally serves more of what the kid struggles with

## 5. Mastery Badges

### Badge Tiers
Per problem category, earned by cumulative correct answers:

| Tier | Correct Required | Badge Color |
|---|---|---|
| Bronze | 10 | #CD7F32 |
| Silver | 25 | #C0C0C0 |
| Gold | 50 | #FFD700 |
| Master | 100 | #E5E4E2 with rainbow shimmer |

5 categories x 4 tiers = 20 total badges to earn.

### Badge Data
```typescript
interface Badge {
  category: ProblemType
  tier: 'bronze' | 'silver' | 'gold' | 'master'
  earnedAt: string  // ISO date
}
```

Stored in `PlayerProfile.badges`. Checked inside `recordAnswer()` — if the new correct count crosses a threshold and that badge isn't already earned, the badge is added to the profile and returned from the function. The caller (game component) receives the badge and shows the toast.

### Badge Notification Flow
1. Game calls `recordAnswer()` after each round
2. `recordAnswer()` checks if `stats[category].correct` crossed a badge threshold
3. If yes, appends the Badge to `profile.badges`, saves, and returns it
4. Game component receives `Badge | null` and conditionally renders `<BadgeToast badge={badge} />`
5. `BadgeToast` auto-dismisses after 3 seconds via internal `useEffect` + `setTimeout`

### Mid-Game Toast
When a badge is earned during gameplay:
- A toast slides in from the top: pixel-card styled with the badge icon, category name, tier name
- Stays for 3 seconds, then slides out
- Does NOT pause gameplay — it's an overlay

New component: `src/components/shared/BadgeToast.tsx`
- Props: `badge: Badge | null` — renders nothing when null
- Manages its own show/hide lifecycle internally

### Trophy Shelf Screen
New game phase: `'trophies'` accessible from the menu via a "TROPHIES" button.

**Player selection:** Shows Player 1's profile by default. If multiple profiles exist (from `getAllProfiles()`), a dropdown at the top lets you switch between them.

Layout:
- Player name + total stats header
- 5 rows (one per category)
- Each row shows: category name, 4 badge slots (bronze/silver/gold/master)
- Earned badges are full color with a glow. Unearned are dark silhouettes.
- Below the grid: total stats (games played, total correct, favorite category, avg response time)
- "BACK" button returns to menu

New file: `src/components/TrophyShelf/TrophyShelf.tsx`

### Badge Visuals
Pixel art SVG badges — simple shield/star shapes with the tier color. Small enough to render inline (24x24). Defined in a new `src/components/shared/BadgeIcon.tsx`.

## Architecture Summary

### New Files
- `src/utils/playerProfile.ts` — Profile CRUD, answer recording, badge checking
- `src/components/shared/Effects.tsx` — ParticleBurst, ScreenShake, StreakFlame, Fireworks
- `src/components/shared/BadgeToast.tsx` — Mid-game badge notification
- `src/components/shared/BadgeIcon.tsx` — Pixel art badge SVG components
- `src/components/TrophyShelf/TrophyShelf.tsx` — Badge display screen
- `public/avatars/cpu/*.png, *.gif` — Static CPU character assets

### Modified Files
- `src/types.ts` — Add `Badge` interface, add `'trophies'` to `GamePhase` union type
- `src/utils/constants.ts` — Add avatar URLs to CPU_CHARACTERS
- `src/utils/mathProblems.ts` — Accept category filter in generateProblem, implement filter-first then fallback logic
- `src/hooks/useMathEngine.ts` — Pass enabledCategories to problem generator
- `src/hooks/useSettings.ts` — Add `enabledCategories: ProblemType[]` to Settings interface
- `src/hooks/useGameState.ts` — Handle 'trophies' phase, simplify CPU avatar flow
- `src/components/Settings/Settings.tsx` — Add problem type toggles
- `src/components/Menu/Menu.tsx` — Add TROPHIES button
- `src/components/CPUSelect/CPUSelect.tsx` — Remove generation UI, use static avatars
- `src/components/MathMarathon/MathMarathon.tsx` — Add effects, badge toasts, recordAnswer calls
- `src/components/TugOfWar/TugOfWar.tsx` — Add effects, badge toasts, recordAnswer calls
- `src/components/Victory/Victory.tsx` — Enhanced fireworks (40 confetti pieces)
- `src/App.tsx` — Render `<TrophyShelf />` when `phase === 'trophies'`
- `src/index.css` — New animation keyframes for effects

### Removed/Deprecated
- `src/utils/cpuAvatars.ts` — No longer needed (CPU avatars are static files)
