# Math Muscle v2 — Phase 1 & Phase 2 Design

**Date:** 2026-03-07
**Author:** Machine King Labs

---

## Phase 1: Polish the Local Game

### 1.1 Fix Key Mapping

**Problem:** P2 currently uses `7-8-9-0` which is confusing. Both players should press the number matching the answer choice (1, 2, 3, or 4). P1 uses the number row, P2 uses the numpad.

**Change:**
- Answers are labeled 1-4 on screen (not arbitrary key mappings)
- P1: number row keys `1`, `2`, `3`, `4` (KeyboardEvent.code: `Digit1`-`Digit4`)
- P2: numpad keys `1`, `2`, `3`, `4` (KeyboardEvent.code: `Numpad1`-`Numpad4`)
- Both see the same labels: `[1] [2] [3] [4]`
- Distinguish P1 vs P2 by checking `e.code` (Digit vs Numpad), not `e.key`

**Files:** `src/utils/constants.ts`, `src/hooks/useKeyboardInput.ts`, `src/components/shared/MathProblem.tsx`

### 1.2 New Scoring System (Marathon)

**Problem:** Currently only the first player to answer advances. Second player gets nothing. This isn't fun for kids who are slower.

**New rules — everyone gets a chance per question:**
- Timer runs (10 seconds per question)
- Both players can answer independently during the timer
- **First correct answer:** 3 spaces
- **Second correct answer (not first):** 2 spaces
- **Wrong answer:** 1 space (you still move, just less — encourages trying)
- **No answer (timer expires):** 0 spaces
- After both answer (or timer expires), show a **results screen** for 2 seconds showing who got what, then next question

**"Spaces" model:**
- Track is 20 spaces long (not percentage-based anymore)
- First to reach space 20 wins
- Display as a visual track with character positions

**Scalability:** This system works for 2, 3, or 4 players. First correct = 3, second = 2, third = 1.5 (round down to 1), wrong = 1, skip = 0.

**Files:** `src/utils/constants.ts`, `src/components/MathMarathon/MathMarathon.tsx`, `src/components/shared/ScoreBar.tsx`

### 1.3 Pacing Fix — Results Screen Between Questions

**Problem:** Next question appears too fast after someone answers.

**Solution:** Add a 2-second "results interstitial" between questions:
- Shows the question + correct answer highlighted in green
- Shows each player's answer (right/wrong) with their avatar
- Shows spaces earned this round
- Animated track movement during this pause
- Then auto-advances to next question

**Files:** New `src/components/shared/RoundResult.tsx`, modifications to both game modes

### 1.4 Settings Menu

**Accessible from:** Menu screen (gear icon button) and in-game (pause with Escape/Start button)

**Settings:**
| Setting | Options | Default |
|---------|---------|---------|
| Difficulty | Easy / Medium / Hard / Adaptive | Adaptive |
| Time per question | 10s / 15s / 20s / 30s | 10s |
| Track length | 10 / 15 / 20 / 30 spaces | 20 |
| Sound effects | On / Off | On |
| Music | On / Off | On |
| Controller vibration | On / Off | On |

**Storage:** localStorage under key `mathMuscle:settings`

**Files:** New `src/components/Settings/Settings.tsx`, new `src/hooks/useSettings.ts`

### 1.5 PlayStation Controller Fix

**Current state:** Gamepad API hook exists with PS detection. Need to verify it works with actual DualSense/DualShock.

**Improvements:**
- Add `054c:0ce6` (DualSense) and `054c:09cc` (DualShock 4) vendor/product IDs
- Map Start button (index 9) to pause/settings
- Map Options/Share to nothing (prevent accidental)
- Test face button mapping matches PS standard layout
- Add haptic feedback on correct/wrong answer (if Vibration API available)

**Files:** `src/hooks/useGamepad.ts`

### 1.6 Generate CPU Character Avatars

**Action:** At app startup (or first time), generate animated pixel sprites for Kevin, Sally, Benny, and Mia using the Replicate API (`retro-diffusion/rd-animation`).

**Prompts:**
- Kevin: "A boy with red spiky hair, competitive, wearing a red jersey, pixel art character"
- Sally: "A girl with purple braids, calm and focused, wearing a purple dress, pixel art character"
- Benny: "A younger boy with messy green hair, friendly smile, wearing a green t-shirt, pixel art character"
- Mia: "A girl with wild orange curly hair, mischievous grin, wearing an orange hoodie, pixel art character"

**Caching:** Store generated URLs in localStorage under `mathMuscle:cpuAvatars`. Only regenerate if cache is empty or user requests it.

**Files:** `src/utils/replicate.ts`, `src/utils/constants.ts`, new `src/utils/cpuAvatars.ts`

### 1.7 Character Persistence (localStorage)

**Problem:** Players have to recreate their character every time they play.

**Solution:**
- After avatar select, save player profile to localStorage: `mathMuscle:player1`, `mathMuscle:player2`
- Profile includes: name, color, avatarUrl, description
- On avatar select screen, if saved profile exists, pre-populate fields and show "Welcome back, [Name]!" with their avatar
- "Clear" button to start fresh

**Files:** `src/components/AvatarSelect/AvatarSelect.tsx`, new `src/utils/playerStorage.ts`

### 1.8 Scale to 4 Players Locally

**Changes needed:**
- `Player` type: `id: 1 | 2 | 3 | 4` (expand union)
- `players` array: up to 4 entries
- Menu screen: 1 Player / 2 Players / 3 Players / 4 Players buttons
- Key mapping for P3 and P4: P3 uses `Q-W-E-R`, P4 uses `U-I-O-P` (or additional controllers)
- Avatar select: show cards for all human players
- Marathon track: 4 lanes
- Tug-of-War: becomes 2v2 teams (or free-for-all with rope pulled 4 ways — simpler to do 2v2)
- Scoring scales: 1st correct = 3, 2nd = 2, 3rd = 1, wrong = 1, skip = 0

**Files:** `src/types.ts`, `src/hooks/useGameState.ts`, `src/utils/constants.ts`, all game mode components, `src/components/Menu/Menu.tsx`

---

## Phase 2: QR Code Phone-as-Controller

### 2.1 Architecture

**Tech:** PeerJS (WebRTC peer-to-peer). No server needed.

**Flow:**
1. Host screen (TV/laptop) creates a PeerJS connection and generates a unique room ID
2. QR code encodes URL: `http://<host-ip>:5555/join/<roomId>`
3. Players scan QR with their phone
4. Phone opens a controller page showing the 4 answer buttons (big, tappable)
5. When player taps an answer, it's sent via WebRTC data channel to the host
6. Host processes the answer just like keyboard/gamepad input

**Why PeerJS over Socket.io:**
- No server to run — pure peer-to-peer
- Works on local network (same WiFi)
- Low latency
- `npm install peerjs` — simple

### 2.2 Host Screen Changes

- New "Phone Controllers" option on menu screen
- When selected, shows QR code + room code for manual entry
- Lobby screen shows connected players with their phone nicknames
- Host can start game when at least 1 player is connected

### 2.3 Phone Controller Page

- Route: `/join/:roomId`
- Minimal UI: nickname input → waiting room → answer buttons during gameplay
- Answer buttons are large (full-width, tall), color-coded, showing the answer text
- Shows feedback: correct/wrong after answering
- Shows current score between questions

### 2.4 npm Dependencies

```bash
npm install peerjs react-qr-code
```

### 2.5 Files

- New `src/hooks/usePeerHost.ts` — host-side PeerJS connection manager
- New `src/components/PhoneLobby/PhoneLobby.tsx` — QR code + lobby
- New `src/pages/PhoneController.tsx` — the phone UI (separate route)
- New `src/hooks/usePeerClient.ts` — phone-side PeerJS connection
- Modify `src/App.tsx` — add route for `/join/:roomId`

---

## Phase 3: Visual Novel / Reading Mode (Future — Separate Project)

> Parked for now. Research agent is investigating existing AI-native visual novel engines we can leverage instead of building from scratch. Will produce a separate findings document.

---

## Implementation Order

**Phase 1 (this session):**
1. Fix key mapping (quick)
2. Pacing fix — results interstitial (medium)
3. New scoring system (medium)
4. Settings menu + localStorage (medium)
5. PlayStation controller polish (small)
6. Generate CPU character avatars (medium)
7. Character persistence (small)
8. Scale to 4 players (large)

**Phase 2 (next session):**
1. PeerJS phone controller infrastructure
2. QR code lobby
3. Phone controller UI
4. Integration with existing game modes

**Phase 3 (separate project):**
- Visual novel reading comprehension mode
- Choose Your Own Adventure engine
- AI-generated stories and assets
