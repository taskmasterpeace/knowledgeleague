# Knowledge League Kids

Educational multiplayer game — kids answer questions to race or tug-of-war. Retro pixel art aesthetic.

## Quick Commands

```bash
npm run dev          # Vite dev server (localhost:5175)
npm run build        # tsc + vite build
npm run lint         # ESLint
npm test             # vitest unit tests
npm run test:browser # Playwright E2E (requires dev server running)
```

## Architecture

**React 19 + Vite + TypeScript + Tailwind CSS v4 + Zustand**

### Game Flow
```
Menu → CPU Select → Avatar Select → Event Select → Playing → Victory → Stats
                                   ↓ (Party Mode)
                              Party Setup → Transition → Event 1 → Victory → ... → Party Results
```

### Key Systems

- **State**: Zustand store in `src/hooks/useGameState.ts` — single source of truth for game phase, players, scores, positions, party mode, power-ups
- **Questions**: `src/utils/questionEngine.ts` — rotates subjects (math/science/reading), loads JSON question banks lazily, prevents repeat questions (last 100)
- **Math Generator**: `src/utils/mathProblems.ts` — procedural math problems by grade level and difficulty
- **Adaptive Difficulty**: `src/utils/adaptiveDifficulty.ts` — tiers 1-3, adjusts based on rolling accuracy of last 10 answers (80%+ → up, <40% → down)
- **Player Analytics**: `src/utils/playerAnalytics.ts` — behavior tags (on-fire, mashing, guessing, struggling), superlatives, rolling windows
- **Player Profiles**: `src/utils/playerProfile.ts` — localStorage persistence, badge progression per category
- **Multiplayer**: PeerJS WebRTC — host (`usePeerHost`) broadcasts problems/results, phone clients (`usePeerClient`) send answers. Join via QR code at `/join/:roomId`
- **Custom Characters**: `src/utils/customCharacters.ts` — PixelLab-generated pixel art stored as base64 in localStorage
- **Pixel Art**: `src/utils/pixelArt.ts` — maps static sprite files, `AnimatedSprite` component cycles frame arrays
- **Party Mode**: `src/components/PartyMode/` — tournament system, play 3-5 random events, cumulative medal scoring, overall champion
- **Power-ups**: State in `useGameState` — earned on streaks, types: time-freeze, double-points, fifty-fifty, streak-shield
- **Quick Play**: One-tap random game from menu — picks random CPU + random event

### Game Modes
- **Math Marathon** (`src/components/MathMarathon/`) — race to finish line, correct answers advance
- **Tug of War** (`src/components/TugOfWar/`) — team pull with 3 arena types (mud-pit, stadium, schoolyard)
- **Hurdle Dash** (`src/components/HurdleDash/`) — jump hurdles with correct answers
- **Long Jump** (`src/components/LongJump/`) — build momentum and leap
- **Spelling Bee** (`src/components/SpellingBee/`) — last speller standing
- **Party Mode** (`src/components/PartyMode/`) — play 3-5 events in sequence, medal points (3/2/1), overall champion

### Component Pattern
- Game scenes: `MarathonScene.tsx`, `TugArena.tsx`, `MenuScene.tsx` — pixel art rendering with CSS gradient fallbacks
- Shared: `AnimatedSprite`, `MathProblem`, `PlayerAvatar`, `Effects`, `Timer`
- All scenes use `image-rendering: pixelated` and "Press Start 2P" font

## Data

- Question banks: `src/data/{science,reading}/{grade-1,grade-2,grade-3,adult}.json`
- Static pixel art: `public/pixelart/characters/`, `public/pixelart/tilesets/`, `public/pixelart/menu/`
- Generated characters stored in localStorage (base64 data URLs)

## Conventions

- Conventional commits: `feat:`, `fix:`, `test:`, `docs:`
- No Co-Authored-By lines in commits
- Components: PascalCase files, one component per file
- Hooks: `use*.ts` in `src/hooks/`
- Utils: flat files in `src/utils/`
- CSS: Tailwind utility classes + inline styles for dynamic pixel art
- Fallbacks: every pixel art reference has a CSS gradient fallback
- Subjects: math (procedural), science/reading (static JSON banks)
- Grades: grade-1, grade-2, grade-3, adult

## PixelLab API

- Endpoint: `https://api.pixellab.ai/v2`
- API key stored in localStorage (set via Avatar Select screen)
- Generation script: `scripts/pixellab-generate.ts` with `scripts/pixellab-plan.json`
- Results tracking: `scripts/pixellab-results.json` (skip logic for resume)
- Characters: `/create-character-with-4-directions` → flat JSON with `character_id`, `background_job_id`
- Animations: `/characters/animations` → returns `background_job_ids` (array), frames in `last_response.storage_urls.frames`
- Tilesets: `/create-tileset-sidescroller` → 16 tile PNGs
- Map objects: async via `background_job_id`, image in `last_response.image` (base64)
- API returns FLAT JSON (NOT wrapped in `{success, data, error}`)

## Known Gotchas

- Vite dev server does NOT type-check — run `tsc --noEmit` separately
- PeerJS connections can drop on mobile browsers — reconnect logic is in `usePeerClient`
- Sound/music files must be user-interaction-gated (browser autoplay policy)
- Tower Climb game mode was removed on current branch
- PixelLab API credits are limited — script has skip logic to resume from where it left off
