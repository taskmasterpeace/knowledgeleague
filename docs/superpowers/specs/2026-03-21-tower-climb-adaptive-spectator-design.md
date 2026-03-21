# Tower Climb, Adaptive Difficulty, Spectator Mode & Post-Game Stats

**Date:** 2026-03-21
**Status:** Approved

## Overview

Four interconnected features for BrainGames:
1. **Tower Climb** — new 3D voxel physics game mode (Three.js + Cannon.js)
2. **Adaptive Difficulty** — per-player difficulty adjustment based on rolling accuracy
3. **Spectator Mode** — phone-based live analytics dashboard with guessing detection
4. **Post-Game Stats** — detailed breakdown screen with superlatives

Additional: subject-specific leaderboards, background music (Suno-generated), standards tagging on questions, browser SpeechSynthesis for fast-paced modes.

---

## Section 1: Tower Climb Game Mode

### Core Loop
- Players answer questions simultaneously on phones (or keyboard locally)
- Correct answer = voxel block stacks on tower with physics
- Wrong answer = block crumbles on impact, tower wobbles. 3rd wrong in rolling window = top block shakes off
- Every correct answer = splash damage (all opponent towers wobble slightly)
- Streak of 3 = missile fires at random opponent, knocks a block off with explosion physics
- First to **10 blocks** wins
- Phone shows question + 4 answers only. Big screen shows all towers with pixel character portraits

### 3D Tech Stack
- `@react-three/fiber` — React renderer for Three.js
- `@react-three/cannon` — physics engine bindings
- Voxel-style cubes with pixel textures matching game art style
- Camera auto-frames all towers, slowly pans up as tallest grows
- Pixel character portraits as 2D sprites in the 3D scene (billboarded to always face camera)

### Tower Physics
- Blocks drop from above, physically land with satisfying settle
- Wobble state: tower sways with increasing amplitude
- Collapse: block ragdolls off with gravity, bounces on ground, fades out
- Missile: projectile arc from attacker tower → explosion particles on impact → top block ragdolls off
- Splash damage: all towers do quick micro-shake (no block loss)

### Wrong Answer Mechanic
- Wrong answer = block crumbles (no progress, no penalty)
- Tower instability accumulates: 3 wrong answers in rolling window → top block shakes off
- Directly punishes guessing — mashing buttons shakes your tower apart
- Instability resets after a block falls

### Sound Effects (Tower Climb Specific)
| Sound | When |
|---|---|
| `block-place.wav` | Block lands on tower |
| `block-crumble.wav` | Wrong answer, block shatters |
| `tower-creak.wav` | 2 wrong, tower wobbling |
| `tower-collapse.wav` | 3rd wrong, block falls off |
| `missile-launch.wav` | Streak 3, rocket fires |
| `missile-hit.wav` | Missile impacts opponent tower |
| `splash-hit.wav` | Splash damage wobble |
| `tower-complete.wav` | 10 blocks, tower shines |

### Screen Shakes
| Moment | Intensity | Duration |
|---|---|---|
| Streak missile launched | Big | 0.3s |
| Tower wobbling (2 wrong) | Gentle tremor | 0.2s |
| Block falls (3rd wrong) | Medium | 0.25s |
| Hit by splash damage | Light | 0.15s |
| Hit by missile | Heavy | 0.4s |

### Announcer Lines (Tower Climb Specific)
| Trigger | Lines | Priority |
|---|---|---|
| Block placed | *"Another brick!"* / *"{name}'s tower is rising!"* | low |
| Missile launched (streak 3) | *"THREE IN A ROW! {name} launched a MISSILE!"* | high |
| Tower wobbling (2 wrong) | *"Whoa, {name}'s tower is looking SHAKY!"* / *"Careful! That thing's about to crumble!"* | normal |
| Block falls (3rd wrong) | *"OH NO it crumbled! That's what happens when you guess!"* / *"Down goes a block! Slow down, {name}!"* | normal |
| Missile hit | *"DIRECT HIT on {name}!"* / *"BOOM! {name} just lost a block!"* | high |
| Takes tallest tower | *"New leader! {name}'s tower is the tallest!"* | normal |
| Neck and neck (both 7+) | *"It's a RACE to the top! Who's gonna finish first?!"* | high |
| Someone at 9 blocks | *"ONE MORE BLOCK! {name} is about to win this!"* | high |
| Victory | *"TOWER COMPLETE! {name} wins it! Ten blocks TALL!"* | high |

### Announcer Voice for Tower Climb
- Uses browser SpeechSynthesis (instant, zero latency) instead of Replicate TTS
- Speed matters more than quality in a fast-paced lightning round
- Fits the retro pixel art vibe
- Marathon and Tug of War keep Replicate TTS (slower paced, latency acceptable)

---

## Section 2: Adaptive Difficulty Engine

### Settings
- New setting: `adaptiveMode: 'off' | 'per-player'`
- When enabled, replaces the static difficulty dropdown in Settings UI
- Grade Level setting still matters — sets the starting tier

### Rolling Accuracy Window
- Per-player, per-category tracking of last 10 answers
- Difficulty adjusts independently per player

| Rolling Accuracy (last 10) | Action |
|---|---|
| 80%+ | Bump up one difficulty tier |
| 40-80% | Stay at current tier |
| Below 40% | Drop down one difficulty tier |

### Difficulty Tiers
| Tier | Math | Science/Reading |
|---|---|---|
| 1 (Easiest) | Single digit addition, subtraction | Grade-1 question bank |
| 2 (Medium) | Two digit multiplication, fractions | Grade-3 question bank |
| 3 (Hardest) | Order of operations, square roots | Adult question bank |

### Starting Tier
- `gradeLevel: 'grade-1'` → Tier 1
- `gradeLevel: 'grade-3'` → Tier 2
- `gradeLevel: 'adult'` → Tier 3

### Key Behaviors
- Adjustments happen silently — no UI tells the player their difficulty changed
- Each player's tier tracked independently in game state
- Spectator view and post-game stats CAN show tier (if behavior tags setting allows)
- Works across all three game modes

---

## Section 3: Spectator Mode + Guessing Detection

### How Spectators Join
- Same phone join flow — scan QR, enter name
- New toggle on join screen: "Play" or "Watch"
- Spectators appear in lobby with eye icon instead of player color
- No player ID, no questions received, don't count toward the game

### Live Dashboard (Spectator Phone)
Per-player row showing:
- Name + avatar
- Score / position
- Behavior tag with icon
- Rolling accuracy: last 5 answers as green/red dots
- Avg response time (e.g., "1.2s")
- Current streak
- Adaptive tier indicator (if adaptive mode on)

### Guessing Detection Algorithm

**Data tracked per player:**
- `last5Times: number[]` — response times in ms
- `last5Correct: boolean[]` — right or wrong
- `last5Choices: number[]` — which button index they picked
- `categoryAccuracy: Map<category, {correct, total}>`

**Rules (evaluated in order, first match wins):**

| # | Condition | Tag | Icon |
|---|---|---|---|
| 1 | avg(last5Times) < 1500ms AND correct >= 4/5 | **On Fire** | Flame |
| 2 | avg(last5Times) < 1500ms AND same choice 3+ of 5 | **Mashing** | Button spam |
| 3 | avg(last5Times) < 1500ms AND correct <= 1/5 | **Guessing** | Dice |
| 4 | avg(last5Times) >= 3000ms AND correct >= 4/5 | **Thinking** | Brain |
| 5 | avg(last5Times) >= 3000ms AND correct <= 1/5 | **Struggling** | Concern |
| 6 | last3Correct > previous3Correct | **Warming Up** | Rising arrow |
| 7 | default | **Playing** | (no tag) |

### Behavior Tags Visibility (Configurable in Settings)
- `'spectators-only'` — only spectator phones see tags (default)
- `'post-game'` — hidden during play, shown on post-game stats screen
- `'always'` — visible on big screen next to player names during gameplay

### Data Flow
- Host tracks all player answer data (time, choice index, correctness)
- `PlayerAnalytics` object maintained per player in game state
- Host broadcasts analytics snapshot to spectator connections every 3 seconds
- Spectators receive `'spectatorUpdate'` message type (distinct from `'problem'`)

---

## Section 4: Post-Game Stats Screen

### Flow
- New phase between `'victory'` and `'trophies'`: `'stats'`
- playing → victory (podium, 4 seconds) → stats → trophies
- "Continue" button advances to trophies, "Rematch" button restarts

### Big Screen Display

**Player Cards** (one per player, side by side):
- Pixel avatar + name + final position/score
- Accuracy: `14/18 (78%)`
- Avg response time: `2.3s`
- Best streak: `5`
- Behavior tag (if setting allows)
- Difficulty tier progression (if adaptive): "Tier 2 → Tier 3"

**Superlatives** (fun awards, only shown if applicable):
| Award | Criteria |
|---|---|
| **Speed Demon** | Fastest avg response time |
| **Sharpshooter** | Highest accuracy |
| **Hot Streak** | Longest streak in the game |
| **Comeback Kid** | Biggest position recovery |
| **Steady Eddie** | Most consistent response times (lowest std dev) |
| **Quick Learner** | Biggest accuracy improvement first half → second half |

### Phone Players See
- Personal stats card (their data only)
- Behavior breakdown: "On Fire for 6 questions, Thinking for 4"
- Category accuracy: "Addition: 5/5, Fractions: 2/6"
- Adaptive progression: "Started Tier 1, climbed to Tier 2"

### Tower Climb Specific Additions
- Blocks placed / blocks lost
- Missiles launched / missiles taken
- "Your tower was attacked 4 times and survived 3"

### Data Source
- All data from PlayerAnalytics (same data guessing detection uses)
- Superlatives computed at game end
- No new tracking needed — new UI surfaces existing data

---

## Section 5: Sound & Announcer Architecture

### Universal Sound Kit (all modes)
Already exists: correct, wrong, streak, timer-warn, timer-final, select, navigate, game-start, victory, badge

### Mode-Specific Sounds
- **Marathon:** step.wav, finish-line.wav
- **Tug of War:** rope-pull.wav, super-pull.wav, rope-snap.wav
- **Tower Climb:** block-place.wav, block-crumble.wav, tower-creak.wav, tower-collapse.wav, missile-launch.wav, missile-hit.wav, splash-hit.wav, tower-complete.wav

### Announcer Architecture
```
announcer.ts (universal lines + speak engine)
├── marathonAnnouncer.ts (marathon-specific lines)
├── tugOfWarAnnouncer.ts (tug-specific lines)
└── towerClimbAnnouncer.ts (tower-specific lines)
```

Each game mode imports universal `speak()` + `correctLine()` / `wrongLine()`, then adds mode-specific lines. New modes get the universal kit for free.

### Voice Engine by Mode
- Marathon, Tug of War: Replicate TTS (higher quality, latency acceptable)
- Tower Climb: Browser SpeechSynthesis (instant, zero latency needed for fast pace)

### Background Music
- Suno-generated tracks per mode + menu + victory
- Single loop per mode, no intensity layers
- Lo-fi chiptune + hip hop + marching band vibe
- Files: menu.mp3, marathon.mp3, tug-of-war.mp3, tower-climb.mp3, victory-music.mp3
- Controlled by existing `musicEnabled` setting

---

## Section 6: Standards Tagging

### Implementation
- Every question gets an optional `standard` field (e.g., "2.OA.B.2")
- Math problems: tag generated alongside the problem based on category + difficulty
- Science/Reading banks: standard added to JSON entries
- Not shown to players — internal metadata only
- Surfaces in: spectator dashboard, post-game stats, future teacher dashboard
- Common Core Math Standards mapping:

| Category | Standard Example |
|---|---|
| addition (grade-1) | 1.OA.C.6 |
| subtraction (grade-1) | 1.OA.C.6 |
| multiplication (grade-3) | 3.OA.C.7 |
| fractions (grade-3) | 3.NF.A.1 |
| order-of-operations (adult) | 5.OA.A.1 |

---

## Section 7: Subject-Specific Leaderboards

### Implementation
- New phase accessible from menu: `'leaderboards'`
- Pulls from existing `playerProfile` data in localStorage
- Three tabs: Math, Science, Reading
- Each tab shows top players ranked by:
  - Total correct answers in that subject
  - Accuracy percentage
  - Best streak
- Per-category breakdown within each subject
- Same pixel art UI style as Trophy Shelf

---

## Section 8: Type System & Interface Changes

### New Types
```typescript
// Add to GamePhase union
type GamePhase = '...' | 'stats' | 'leaderboards'

// Add to GameEvent union
type GameEvent = 'marathon' | 'tug-of-war' | 'tower-climb'

// Add optional standard field to GameQuestion
interface GameQuestion {
  // ...existing fields...
  standard?: string  // e.g., "2.OA.B.2"
}

// New: per-player analytics (maintained during gameplay)
interface PlayerAnalytics {
  answersTotal: number
  answersCorrect: number
  last5Times: number[]        // response times in ms
  last5Correct: boolean[]     // right or wrong
  last5Choices: number[]      // which button index picked
  categoryAccuracy: Record<string, { correct: number; total: number }>
  responseTimes: number[]     // ALL response times (for std dev calc)
  behaviorTag: BehaviorTag
  adaptiveTier: 1 | 2 | 3
  adaptiveHistory: number[]   // tier at each question for progression display
  // Tower Climb specific
  blocksPlaced: number
  blocksLost: number
  missilesLaunched: number
  missilesTaken: number
  splashHitsTaken: number
}

type BehaviorTag = 'on-fire' | 'mashing' | 'guessing' | 'thinking' | 'struggling' | 'warming-up' | 'playing'

// Spectator connection type
interface SpectatorConnection {
  name: string
  connId: string
  conn: DataConnection
}
```

### Player Interface Additions
No changes to `Player` interface — analytics are tracked separately in a `Map<PlayerId, PlayerAnalytics>` managed by the game mode component, not in the Zustand store. This keeps the existing store clean and avoids serialization overhead.

---

## Section 9: Edge Cases & Protocol Details

### Tower Climb Edge Cases

**Missile target has 0 blocks:**
Missile fizzles with a "poof" particle effect. Announcer: *"Missile wasted! Nothing to hit!"* No retarget.

**Simultaneous win (two players reach 10 on same round):**
First answer received by the host wins. PeerJS messages arrive sequentially — the host processes them in order. Tie is resolved by arrival time.

**Single player with CPU:**
CPU has a visible tower in the 3D scene. CPU "answers" via the existing CPU timing logic (speed + accuracy from CPU character stats). CPU tower uses same physics. CPU can be hit by missiles and can launch missiles at the human player.

**Instability rolling window:**
Window size = 5 questions. Resets to 0 after a block falls off. This means you need 3 wrong out of 5 consecutive answers to lose a block, then the count starts fresh.

### Spectator Protocol

**Join flow:**
1. Phone connects via PeerJS same as player
2. Phone sends `{ type: 'join', name: 'Name', role: 'spectator' }` (new `role` field, defaults to `'player'` for backward compat)
3. Host stores connection in separate `spectatorsRef` Map (not `connsRef`)
4. Host does NOT assign a playerId to spectators
5. Host sends `{ type: 'spectatorInit', players: [...], analytics: {...} }` on connect

**Ongoing updates:**
- Host broadcasts `{ type: 'spectatorUpdate', analytics: Map<PlayerId, PlayerAnalytics> }` every 3 seconds
- Spectator connections are separate from player connections — no questions sent

**Max spectators:** Cap at 10. Beyond that, connection is rejected with `{ type: 'lobbyFull', reason: 'spectator' }`.

**Mid-game join:**
Spectator receives `spectatorInit` with full current state on connect. No need to replay history.

### Adaptive Difficulty Edge Cases

**Question bank exhausted at tier:**
Fall back to nearest available tier. If Tier 3 has no questions for a category, use Tier 2. If Tier 2 is also empty, use Tier 1. Never skip a question.

**Rematch behavior:**
Adaptive tier resets to starting tier (based on gradeLevel setting) on rematch. Analytics reset completely. Fresh start each game.

**Window sizes:**
Intentionally different — adaptive difficulty uses last 10 (slower adjustment, more stable) while behavior detection uses last 5 (faster reaction, more responsive tags). These serve different purposes.

### Stats Phase Protocol

**Phone message:**
After victory broadcast, host sends `{ type: 'statsUpdate', personalStats: PlayerAnalytics, superlatives: Superlative[] }` to each player with their personal data.

Phone controller adds a stats view state between gameOver and idle.

### SpeechSynthesis Fallback

**If `window.speechSynthesis` is unavailable:**
Fall back to Replicate TTS (accept the latency). If Replicate is also unavailable (no API token), announcer is silently disabled for that session.

**Voice selection:**
Use `speechSynthesis.getVoices()`, prefer voices with `lang === 'en-US'`. Pick the first available male voice for consistency. Cache the selected voice on first use.

### Bundle Size Strategy

**Three.js lazy loading:**
Tower Climb component is lazy-loaded via `React.lazy()`. Three.js + Cannon.js (~1MB) only loads when Tower Climb is selected from EventSelect. Marathon and Tug of War are unaffected.

```typescript
const TowerClimb = React.lazy(() => import('./components/TowerClimb/TowerClimb'))
```

### Physics & Frame Rate

Physics simulation is purely visual on the big screen. Game state (block count, who's winning) is tracked in JavaScript independent of the physics engine. Physics is eye candy — if a machine runs at 30fps vs 60fps, the towers look slightly different but gameplay is identical. Tower state (blocks placed, blocks lost) is authoritative; the physics engine just renders it prettily.

---

## Future Batches (Not In This Build)
- Visual Novel game mode
- CSV custom question pack import
- Teacher/classroom dashboard
- Mixed-age group play (per-player difficulty within same lobby — distinct from adaptive which adjusts over time; mixed-age means players START at different tiers based on their individual grade input)
