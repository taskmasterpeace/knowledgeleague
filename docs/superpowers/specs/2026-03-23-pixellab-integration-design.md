# PixelLab Pixel Art Integration — Design Spec

## Overview
Integrate PixelLab API-generated pixel art into Knowledge League Kids to transform the game from text/button-heavy screens into a visually rich retro pixel art experience.

## Style Guide
- **Art style:** Retro 16-bit (SNES/GBA aesthetic)
- **Sprite size:** 32px characters, 16x16 tile grids
- **Proportions:** Default (normal kid proportions, NOT chibi)
- **Outline:** Single-color (classic retro look)
- **Shading:** Basic shading
- **Detail:** Medium detail
- **View:** Side-scroll perspective for all game scenes

## API & Budget
- **API:** PixelLab REST v2 (https://api.pixellab.ai/v2)
- **Auth:** Bearer token
- **Budget:** 40 generations total
- **Approach:** Phase 1 test batch (5 gen), then Phase 2 full send (35 gen)

## Phase 1: Test Batch (5 generations)

Test one of each asset type to validate quality before committing.

| # | Asset | API Call | Params |
|---|-------|----------|--------|
| 1 | Kevin (character) | create_character | humanoid, 32px, default proportions, single-color outline, basic shading, "red-haired kid in red shirt and shorts, athletic and energetic" |
| 2 | Kevin run animation | animate_character | run cycle using Kevin's character_id |
| 3 | Dirt track tileset | create_sidescroller_tileset | lower: "brown dirt running track", transition: "grass turf edge", 16x16 |
| 4 | Paper airplane (menu object) | create_map_object | "small pixel art paper airplane", transparent bg, side view |
| 5 | Grass tileset | create_sidescroller_tileset | lower: "green grass ground", transition: "grass blades", 16x16 |

**Decision gate:** Review test results. If quality is good, proceed to Phase 2. If not, adjust params and re-test with buffer generations.

## Phase 2: Full Send (35 generations)

### Characters (8 gen)

All characters: humanoid, 32px, default proportions, single-color outline, basic shading.

| # | Asset | Description |
|---|-------|-------------|
| 6 | Sally | "purple-haired girl in purple outfit, calm and studious" |
| 7 | Sally animations | run, idle, celebrate |
| 8 | Benny | "green-capped boy in green shirt, shy and friendly" |
| 9 | Benny animations | run, idle, celebrate |
| 10 | Mia | "orange-haired girl in orange outfit, wild and unpredictable" |
| 11 | Mia animations | run, idle, celebrate |
| 12 | Default Player | "blue-shirted kid, generic friendly player character" |
| 13 | Default Player animations | run, idle, celebrate, pull (tug of war) |

### Math Marathon Track (6 gen)

Side-scrolling race track. Characters run left-to-right in lanes.

| # | Asset | API Call |
|---|-------|----------|
| 14 | Sky/mountains background | create_map_object — sunset sky with mountain silhouettes |
| 15 | Finish line gate | create_map_object — checkered flag finish arch |
| 16 | Start line | create_map_object — starting blocks with banner |
| 17 | Track decorations | create_map_object — trees, bushes, rocks bundle |
| 18 | Bleachers/crowd | create_map_object — small crowd section |
| 19 | Lane markers | create_map_object — cones/dividers for 4 lanes |

Note: Dirt track + grass tilesets come from Phase 1 tests.

### Tug of War — 3 Random Arenas (14 gen)

Each game randomly picks one of three arenas.

**Arena A: Mud Pit (4 gen)**
| # | Asset | Description |
|---|-------|-------------|
| 20 | Mud pit tileset | create_sidescroller_tileset — brown mud surface |
| 21 | Rope | create_map_object — thick braided rope |
| 22 | Mud splash effects | create_map_object — splatter effects |
| 23 | Field day decorations | create_map_object — flags, banners, pennants |

**Arena B: Indoor Stadium (5 gen)**
| # | Asset | Description |
|---|-------|-------------|
| 24 | Arena floor tileset | create_sidescroller_tileset — polished gym floor |
| 25 | Stadium stands | create_map_object — packed bleachers with crowd |
| 26 | Stadium lights | create_map_object — overhead floodlights |
| 27 | Scoreboard | create_map_object — digital scoreboard banner |
| 28 | Barrier + rope | create_map_object — barrier walls with center rope |

**Arena C: Schoolyard (5 gen)**
| # | Asset | Description |
|---|-------|-------------|
| 29 | School building | create_map_object — red brick school background |
| 30 | Playground markings | create_map_object — chalk lines on ground |
| 31 | Traffic cones | create_map_object — orange cones as markers |
| 32 | Trees | create_map_object — leafy trees (reusable) |
| 33 | Spectator kids | create_map_object — small group of watching kids |

### Main Menu Flying Objects (7 gen)

Random pixel art objects float across the starfield background. Different ones each load.

| # | Asset | Description |
|---|-------|-------------|
| 34 | Paper airplane | (from Phase 1 test if good, else redo) |
| 35 | Alien / UFO | create_map_object — small green alien in UFO |
| 36 | Drone | create_map_object — small quadcopter drone |
| 37 | Shooting star | create_map_object — bright star with trail |
| 38 | Rocket | create_map_object — small cartoon rocket |
| 39 | Balloon | create_map_object — colorful balloon floating up |
| 40 | Bird | create_map_object — small pixel bird flapping |

## Integration Architecture

### Asset Storage
- All downloaded assets go to `public/pixelart/` with subdirectories:
  - `characters/` — sprite sheets and animations
  - `tilesets/` — tileset PNGs
  - `objects/` — map objects (transparent PNGs)
  - `menu/` — flying objects for main menu

### Menu Enhancement
- Keep existing dark starfield background
- Add grass ground strip at bottom using grass tileset
- CPU characters idle on the grass strip (using their idle animations)
- Random flying objects drift across the sky with CSS animations
- Existing buttons/UI stay — just layered over the pixel art scene

### Marathon Track Renderer
- New `<MarathonScene>` component replaces progress bars
- Parallax layers: sky background → mountains → track → characters
- Characters in lanes run right using their run animations
- Position mapped from game state (0-20 spaces → x-position on track)
- Start/finish line objects at track endpoints
- Decorations and bleachers as background elements

### Tug of War Arena Renderer
- New `<TugArena>` component replaces abstract slider
- Random arena selection on game start (mud pit / stadium / schoolyard)
- Characters on left and right sides pulling rope
- Rope position tied to game state (±100 range)
- Arena-specific background and decorations
- Characters use pull animation during play, celebrate on win

### Asset Loading
- Preload critical assets (characters, active arena tileset) on game start
- Lazy-load menu flying objects
- Fallback to current CSS-based rendering if assets fail to load

## PixelLab API Integration

### Script: `scripts/pixellab-generate.ts`
- Node script to batch-generate assets via PixelLab REST API v2
- Takes a generation plan JSON as input
- Queues all jobs, polls for completion, downloads results
- Saves to `public/pixelart/` with proper naming
- Tracks generation count to stay within budget

### Environment
- `PIXELLAB_API_KEY` in `.env` (not committed)

## What's NOT In Scope
- Trophy/badge pixel art (not now)
- School campus hub world menu (maybe later)
- Items, power-ups, UI element pixel art
- Top-down view (everything is side-scroll)
- Desktop app download
