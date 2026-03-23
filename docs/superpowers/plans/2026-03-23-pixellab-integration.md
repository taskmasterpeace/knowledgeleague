# PixelLab Pixel Art Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate retro 16-bit pixel art via PixelLab API and integrate it into the game — animated characters, side-scrolling marathon track, 3 random tug-of-war arenas, and animated main menu.

**Architecture:** Node script calls PixelLab REST API v2 to generate assets, downloads them to `public/pixelart/`. React components render assets as layered scenes with CSS animations. Existing game logic unchanged — only the visual layer is new.

**Tech Stack:** TypeScript, React 19, Vite, PixelLab REST API v2, CSS animations, Zustand (existing state)

**Spec:** `docs/superpowers/specs/2026-03-23-pixellab-integration-design.md`

---

## File Structure

### New Files
- `scripts/pixellab-generate.ts` — Node script to call PixelLab API, queue jobs, poll, download assets
- `scripts/pixellab-plan.json` — Generation plan config (what to generate, params)
- `src/utils/pixelArt.ts` — Asset loader/manager, preloading, path helpers
- `src/components/shared/PixelScene.tsx` — Reusable parallax scene renderer (layers, scrolling)
- `src/components/MathMarathon/MarathonScene.tsx` — Side-scroll race track with character sprites
- `src/components/TugOfWar/TugArena.tsx` — Arena renderer with 3 random arena variants
- `src/components/Menu/MenuScene.tsx` — Animated menu background (grass strip, flying objects, idle characters)

### Modified Files
- `src/components/MathMarathon/MathMarathon.tsx` — Swap progress bars for `<MarathonScene>`
- `src/components/TugOfWar/TugOfWar.tsx` — Swap slider for `<TugArena>`
- `src/components/Menu/Menu.tsx` — Add `<MenuScene>` behind existing buttons
- `src/types.ts` — Add `TugArenaType` and `PixelArtAsset` types
- `.env` — Add `PIXELLAB_API_KEY`
- `.gitignore` — Add `.superpowers/`
- `package.json` — No new deps needed (fetch is built-in)

### Asset Directories (created by generation script)
- `public/pixelart/characters/` — Kevin, Sally, Benny, Mia, DefaultPlayer (sprites + animations)
- `public/pixelart/tilesets/` — dirt-track, grass, mud, arena-floor
- `public/pixelart/objects/` — finish-line, start-line, trees, bleachers, etc.
- `public/pixelart/menu/` — airplane, ufo, drone, star, rocket, balloon, bird

---

## Task 1: PixelLab Generation Script

**Files:**
- Create: `scripts/pixellab-generate.ts`
- Create: `scripts/pixellab-plan.json`

- [ ] **Step 1: Create the generation plan JSON**

```json
// scripts/pixellab-plan.json
{
  "phase1_test": [
    {
      "id": "kevin",
      "type": "create_character",
      "params": {
        "description": "red-haired boy in red t-shirt and dark shorts, athletic and energetic, kid character",
        "body_type": "humanoid",
        "size": 32,
        "proportions": "default",
        "outline": "single color",
        "shading": "basic shading",
        "detail": "medium detail",
        "view": "low top-down",
        "n_directions": 4,
        "name": "Kevin"
      },
      "output": "public/pixelart/characters/kevin"
    },
    {
      "id": "kevin_run",
      "type": "animate_character",
      "depends_on": "kevin",
      "params": {
        "action_description": "running fast to the right",
        "animation_name": "run"
      },
      "output": "public/pixelart/characters/kevin"
    },
    {
      "id": "dirt_track",
      "type": "create_sidescroller_tileset",
      "params": {
        "lower_description": "brown dirt running track surface",
        "transition_description": "grass turf edge growing on top",
        "transition_size": 0.25,
        "tile_size": { "width": 16, "height": 16 }
      },
      "output": "public/pixelart/tilesets/dirt-track"
    },
    {
      "id": "grass",
      "type": "create_sidescroller_tileset",
      "params": {
        "lower_description": "green grass ground",
        "transition_description": "tall grass blades on top",
        "transition_size": 0.25,
        "tile_size": { "width": 16, "height": 16 }
      },
      "output": "public/pixelart/tilesets/grass"
    },
    {
      "id": "airplane",
      "type": "create_map_object",
      "params": {
        "description": "small pixel art paper airplane, white with blue lines, flying through air",
        "width": 32,
        "height": 24,
        "view": "high top-down"
      },
      "output": "public/pixelart/menu/airplane"
    }
  ]
}
```

- [ ] **Step 2: Write the generation script**

Create `scripts/pixellab-generate.ts`:

```typescript
// Node script — run with: npx tsx scripts/pixellab-generate.ts --phase phase1_test
// Reads pixellab-plan.json, calls PixelLab REST API v2, polls for completion, downloads assets.
//
// API base: https://api.pixellab.ai/v2
// Auth: Bearer token from PIXELLAB_API_KEY env var
//
// Workflow per item:
// 1. POST to /v2/{type} with params → get job_id
// 2. Poll GET /v2/{type}/{id} every 15s until status=completed
// 3. Download result images to output directory
// 4. For animate_character: wait for depends_on character to finish first
//
// Key endpoints:
// - POST /v2/create-character → { character_id }
// - POST /v2/animate-character → { animation_id }
// - POST /v2/create-sidescroller-tileset → { tileset_id }
// - POST /v2/create-map-object → { object_id }
// - GET /v2/get-character/{id} → { rotations, animations, zip_url }
// - GET /v2/get-sidescroller-tileset/{id} → { status, download_url }
// - GET /v2/get-map-object/{id} → { status, download_url }
```

The script should:
- Read plan JSON, filter by `--phase` arg
- Process items in order (respecting `depends_on`)
- Store character_ids so animations can reference them
- Save a `results.json` mapping asset IDs to local file paths
- Print progress: `[1/5] Creating Kevin... done (2m 34s)`
- Handle errors gracefully (log and continue to next item)

- [ ] **Step 3: Add PIXELLAB_API_KEY to .env**

```
PIXELLAB_API_KEY=your_key_here
```

- [ ] **Step 4: Test with dry-run mode**

Run: `npx tsx scripts/pixellab-generate.ts --phase phase1_test --dry-run`

Should print what it would do without making API calls.

- [ ] **Step 5: Commit**

```bash
git add scripts/pixellab-generate.ts scripts/pixellab-plan.json
git commit -m "feat: add PixelLab asset generation script with Phase 1 test plan"
```

---

## Task 2: Run Phase 1 Test Generations

**Files:**
- Modify: `scripts/pixellab-plan.json` (if param tweaks needed)
- Creates: `public/pixelart/characters/kevin/`, `public/pixelart/tilesets/`, `public/pixelart/menu/`

- [ ] **Step 1: Run Phase 1 generation**

Run: `npx tsx scripts/pixellab-generate.ts --phase phase1_test`

Wait for all 5 jobs to complete (2-5 min each). Script will download results.

- [ ] **Step 2: Verify assets downloaded**

```bash
ls -la public/pixelart/characters/kevin/
ls -la public/pixelart/tilesets/
ls -la public/pixelart/menu/
```

Expect: PNG files for Kevin sprite, Kevin run animation, dirt tileset, grass tileset, airplane.

- [ ] **Step 3: Visual review**

Open each PNG in browser to verify quality:
- Kevin should be a 32px kid with normal proportions, red outfit, retro 16-bit style
- Tilesets should be 16x16 tiles that look like dirt track and grass
- Airplane should be a small pixel art paper airplane with transparent background

**DECISION GATE:** If quality is good, proceed. If not, tweak params in plan JSON and re-run specific items.

- [ ] **Step 4: Commit test assets**

```bash
git add public/pixelart/
git commit -m "feat: add Phase 1 test pixel art assets from PixelLab"
```

---

## Task 3: Asset Loader Utility

**Files:**
- Create: `src/utils/pixelArt.ts`
- Modify: `src/types.ts`

- [ ] **Step 1: Add types**

In `src/types.ts`, add:

```typescript
export type TugArenaType = 'mud-pit' | 'stadium' | 'schoolyard'

export interface PixelArtManifest {
  characters: Record<string, {
    idle: string      // path to idle sprite/animation
    run: string       // path to run animation
    celebrate: string // path to celebrate animation
    pull?: string     // path to pull animation (tug of war)
    portrait: string  // path to static portrait
  }>
  tilesets: Record<string, string>  // name → path
  objects: Record<string, string>   // name → path
  menuObjects: string[]             // array of paths to flying objects
}
```

- [ ] **Step 2: Create asset loader**

Create `src/utils/pixelArt.ts`:

```typescript
// Provides:
// - PIXEL_ART_MANIFEST: static manifest of all available pixel art assets
// - preloadImages(paths: string[]): Promise<void> — preloads images into browser cache
// - getCharacterAsset(name: string, animation: string): string — returns path
// - getRandomMenuObject(): string — returns random flying object path
// - getRandomArena(): TugArenaType — returns random arena type
// - getArenaAssets(type: TugArenaType): object — returns arena-specific asset paths
//
// All paths are relative to /pixelart/ directory.
// Falls back gracefully if assets don't exist (returns empty string).
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/pixelArt.ts src/types.ts
git commit -m "feat: add pixel art asset loader and manifest types"
```

---

## Task 4: Parallax Scene Component

**Files:**
- Create: `src/components/shared/PixelScene.tsx`

- [ ] **Step 1: Build the parallax renderer**

Create `src/components/shared/PixelScene.tsx`:

```typescript
// Reusable side-scrolling parallax scene component.
//
// Props:
// - layers: Array<{ src: string, speed: number, y: number }>
//   speed=0 is static, speed=1 scrolls with camera, speed=0.5 is parallax
// - cameraX: number — horizontal camera position (0-100)
// - children: ReactNode — characters/objects rendered on top
// - height: number — scene height in px
// - groundY: number — y position of the ground line (for placing characters)
//
// Renders:
// - Each layer as a div with background-image, repeating horizontally
// - transform: translateX based on cameraX * speed
// - Children positioned absolutely above groundY
//
// CSS: image-rendering: pixelated for crisp pixel art scaling
// Tiles repeat via background-repeat: repeat-x
// Scale up with nearest-neighbor (no blur)
```

- [ ] **Step 2: Commit**

```bash
git add src/components/shared/PixelScene.tsx
git commit -m "feat: add reusable parallax pixel scene component"
```

---

## Task 5: Marathon Scene — Replace Progress Bars

**Files:**
- Create: `src/components/MathMarathon/MarathonScene.tsx`
- Modify: `src/components/MathMarathon/MathMarathon.tsx`

- [ ] **Step 1: Create MarathonScene component**

Create `src/components/MathMarathon/MarathonScene.tsx`:

```typescript
// Side-scrolling race track visualization.
//
// Props:
// - players: Player[] — array of players with position (0-20)
// - totalSpaces: number — track length (default 20)
//
// Renders using <PixelScene>:
// - Layer 0 (speed 0): Sky/mountains background
// - Layer 1 (speed 0.3): Track decorations, bleachers (parallax)
// - Layer 2 (speed 0.5): Trees, bushes (mid-ground parallax)
// - Layer 3 (speed 1): Dirt track surface (tileset, repeating)
// - Layer 4 (speed 1): Lane markers, start line, finish line
// - Characters: Positioned in lanes based on player.position / totalSpaces
//   - Each character uses their run animation sprite
//   - Flip sprite direction based on movement
//
// Camera follows the leading player.
// 4 lanes stacked vertically, one per player.
//
// Falls back to existing progress bar UI if pixel assets not loaded.
```

- [ ] **Step 2: Integrate into MathMarathon**

In `src/components/MathMarathon/MathMarathon.tsx`:

- Import `MarathonScene`
- Add `MarathonScene` component rendering above or replacing the existing track/progress bar section
- Keep existing score bars as a small overlay or HUD
- The question UI stays unchanged — only the track visual changes

- [ ] **Step 3: Test in browser**

Run: `npm run dev`

Navigate to a Math Marathon game. Verify:
- Side-scrolling track renders with pixel art layers
- Characters appear in lanes
- Movement is smooth as positions change
- Falls back to progress bars if assets missing

- [ ] **Step 4: Commit**

```bash
git add src/components/MathMarathon/MarathonScene.tsx src/components/MathMarathon/MathMarathon.tsx
git commit -m "feat: add side-scrolling pixel art marathon track scene"
```

---

## Task 6: Tug of War Arena — Replace Slider

**Files:**
- Create: `src/components/TugOfWar/TugArena.tsx`
- Modify: `src/components/TugOfWar/TugOfWar.tsx`

- [ ] **Step 1: Create TugArena component**

Create `src/components/TugOfWar/TugArena.tsx`:

```typescript
// Tug of War arena with 3 random variants.
//
// Props:
// - arenaType: TugArenaType — 'mud-pit' | 'stadium' | 'schoolyard'
// - ropePosition: number — -100 (left wins) to +100 (right wins)
// - leftTeam: Player[]
// - rightTeam: Player[]
//
// Each arena variant has:
// - Unique background (sky/building + ground tileset)
// - Unique decorations (mud splashes / lights / cones)
// - Shared: rope stretching across, center marker, team characters
//
// Arena selection: Random on component mount, stored in state.
//
// Rope position maps to visual position:
// - Characters on left side at x = 20% - (ropePosition * 0.15)
// - Characters on right side at x = 80% - (ropePosition * 0.15)
// - Rope center marker shifts with ropePosition
//
// Character animations:
// - During play: pull animation (leaning, tugging)
// - On win: celebrate animation
// - On loss: falling/stumble (or just idle)
//
// Falls back to existing slider if assets missing.
```

- [ ] **Step 2: Integrate into TugOfWar**

In `src/components/TugOfWar/TugOfWar.tsx`:

- Import `TugArena` and `getRandomArena`
- Select random arena on game start: `const [arena] = useState(getRandomArena())`
- Render `<TugArena>` with current rope position and team players
- Keep question UI unchanged

- [ ] **Step 3: Test in browser**

Run: `npm run dev`

Play a Tug of War game. Verify:
- One of 3 arena backgrounds appears
- Teams on left/right with rope between them
- Rope and characters shift as answers happen
- Refresh to see different arenas

- [ ] **Step 4: Commit**

```bash
git add src/components/TugOfWar/TugArena.tsx src/components/TugOfWar/TugOfWar.tsx
git commit -m "feat: add pixel art tug of war arena with 3 random variants"
```

---

## Task 7: Animated Main Menu

**Files:**
- Create: `src/components/Menu/MenuScene.tsx`
- Modify: `src/components/Menu/Menu.tsx`

- [ ] **Step 1: Create MenuScene component**

Create `src/components/Menu/MenuScene.tsx`:

```typescript
// Animated pixel art menu background.
//
// Renders behind the existing menu buttons:
// 1. Keep existing starfield (CSS background)
// 2. Add grass ground strip at bottom using grass tileset
// 3. CPU characters idle on the grass (Kevin, Sally, Benny, Mia)
//    - Use idle animations
//    - Small bobbing motion
//    - Spaced evenly across the ground strip
// 4. Random flying objects drift across the sky
//    - Pick 1-3 random objects from the 7 available
//    - CSS animation: float from right to left at different speeds
//    - Different y-positions (vertical variety)
//    - Loop: when object exits left, respawn on right with new random object
//
// Implementation:
// - Use absolutely-positioned divs layered under the menu content
// - Flying objects: CSS @keyframes translateX animation
// - Character idle: simple CSS bobbing (translateY oscillation)
// - Grass strip: tileset repeated as background-image at bottom
// - z-index layering: scene behind, menu content on top
```

- [ ] **Step 2: Integrate into Menu**

In `src/components/Menu/Menu.tsx`:

- Import `MenuScene`
- Render `<MenuScene />` as the first child (behind everything)
- Existing menu content stays on top with higher z-index
- No other changes to menu layout or functionality

- [ ] **Step 3: Test in browser**

Run: `npm run dev`

Load main menu. Verify:
- Grass strip at bottom with idle characters
- Flying objects drifting across the sky
- Different objects each time you refresh
- Menu buttons still work normally on top

- [ ] **Step 4: Commit**

```bash
git add src/components/Menu/MenuScene.tsx src/components/Menu/Menu.tsx
git commit -m "feat: add animated pixel art menu scene with flying objects"
```

---

## Task 8: Run Phase 2 Full Generation

**Files:**
- Modify: `scripts/pixellab-plan.json` — add all Phase 2 items
- Creates: All remaining pixel art assets

- [ ] **Step 1: Add Phase 2 items to plan JSON**

Add `phase2_characters`, `phase2_marathon`, `phase2_tug_mud`, `phase2_tug_stadium`, `phase2_tug_school`, `phase2_menu` sections to `scripts/pixellab-plan.json`.

Follow the same structure as Phase 1 but with all 35 remaining items from the design spec.

- [ ] **Step 2: Run Phase 2 generation in batches**

```bash
npx tsx scripts/pixellab-generate.ts --phase phase2_characters
npx tsx scripts/pixellab-generate.ts --phase phase2_marathon
npx tsx scripts/pixellab-generate.ts --phase phase2_tug_mud
npx tsx scripts/pixellab-generate.ts --phase phase2_tug_stadium
npx tsx scripts/pixellab-generate.ts --phase phase2_tug_school
npx tsx scripts/pixellab-generate.ts --phase phase2_menu
```

- [ ] **Step 3: Verify all assets**

Check all directories have PNG files. Visually verify quality.

- [ ] **Step 4: Update manifest**

Update `src/utils/pixelArt.ts` manifest with all new asset paths.

- [ ] **Step 5: Commit**

```bash
git add public/pixelart/ src/utils/pixelArt.ts scripts/pixellab-plan.json
git commit -m "feat: add all Phase 2 pixel art assets (35 generations)"
```

---

## Task 9: Polish and Fallbacks

**Files:**
- Modify: `src/components/MathMarathon/MarathonScene.tsx`
- Modify: `src/components/TugOfWar/TugArena.tsx`
- Modify: `src/components/Menu/MenuScene.tsx`

- [ ] **Step 1: Add graceful fallbacks**

In all scene components, check if pixel art assets exist before rendering:
- If assets loaded → render pixel art scene
- If assets missing → render existing CSS-based visuals (current behavior)

Use an `assetsLoaded` state that's set after `preloadImages()` resolves.

- [ ] **Step 2: Add loading transitions**

Fade in the pixel art scene once assets are loaded (0.3s opacity transition).

- [ ] **Step 3: Test with and without assets**

Temporarily rename `public/pixelart/` to verify fallback works. Rename back.

- [ ] **Step 4: Commit**

```bash
git add -u src/components/
git commit -m "feat: add graceful fallbacks and loading transitions for pixel art scenes"
```

---

## Task 10: Final Integration Test

- [ ] **Step 1: Full playthrough**

Run: `npm run dev`

Test:
1. Main menu — flying objects + idle characters on grass
2. Start 2-player Math Marathon — side-scroll track renders, characters run
3. Complete marathon — characters celebrate at finish
4. Start Tug of War — random arena appears
5. Play tug of war — rope shifts, teams move
6. Complete tug of war — winning team celebrates
7. Refresh Tug of War multiple times — verify all 3 arenas appear

- [ ] **Step 2: Build check**

Run: `npm run build`

Verify no TypeScript errors and build succeeds.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: final polish for pixel art integration"
```
