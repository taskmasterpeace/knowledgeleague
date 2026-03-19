# Multi-Subject Engine, AI Announcer & Real Sound Effects

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this spec.

## Goal

Transform BrainGames from a math-only game into a multi-subject educational party game with Math, Science, and Reading questions across three grade levels (Grade 1, Grade 3, Adult). Add an AI announcer via Replicate TTS for live commentary. Replace Web Audio synth sounds with real sound effect files.

## Sub-Projects

This spec covers three independent sub-projects executed in order:

1. **Multi-Subject Question Engine + Grade Levels** (core gameplay expansion)
2. **Real Sound Effects** (replace Web Audio synth with bundled audio files)
3. **AI Announcer** (Replicate TTS live commentary)

---

## Sub-Project 1: Multi-Subject Question Engine + Grade Levels

### Overview

Add Science and Reading as full subjects alongside Math. Add a grade level system (Grade 1, Grade 3, Adult) that controls question content across all subjects. Users customize subjects, grade level, and categories through Settings.

### New Types

```typescript
type Subject = 'math' | 'science' | 'reading'
type GradeLevel = 'grade-1' | 'grade-3' | 'adult'

// Generic question (replaces MathProblem for non-math)
interface GameQuestion {
  question: string
  choices: string[]        // always 4 choices, can be text or numeric strings
  correctIndex: number     // index into choices array
  subject: Subject
  category: string         // e.g. 'addition', 'animals', 'rhyming'
  difficulty: Difficulty
}
```

The existing `MathProblem` interface is kept internally by the math generator but converted to `GameQuestion` before reaching game components.

### Math Expansion by Grade

**Grade 1** (current): addition, subtraction, missing number, comparison, skip-counting. Numbers 0-20.

**Grade 3** (new):
- All Grade 1 categories
- Multiplication: facts up to 10x10
- Division: basic facts (e.g., 24 / 6 = ?)
- Fractions: "What is half of 12?", "Which is larger: 1/3 or 1/4?"
- Rounding: round to nearest 10 or 100

**Adult** (new):
- All Grade 3 categories
- Percentages: "What is 15% of 200?"
- Order of operations: "8 + 2 x 3 = ?"
- Square roots: "Square root of 144?"
- Estimation: "Which is closest to 17 x 6?"
- Decimal/fraction conversion: "0.75 as a fraction?"

All math questions remain procedurally generated. The existing `generateProblem()` function is extended with a `gradeLevel` parameter that unlocks additional categories and adjusts number ranges.

### Science Question Bank

Science questions are curated in a JSON bank. Questions are factual multiple-choice with 4 options.

**Grade 1 Topics** (~200 questions total):
- Animals & their needs (food, water, shelter, baby animals)
- Plants & how they grow (seeds, sunlight, water, roots)
- Body parts & senses (5 senses, external body parts)
- Weather & seasons (rain, snow, temperature, seasons)
- Sun, moon & stars (day vs night, sky patterns)
- Materials & properties (solid vs liquid, hard vs soft)

**Grade 3 Topics** (~200 questions total):
- Water cycle & weather patterns
- Gravity, forces & motion
- Food chains & ecosystems
- Fossils & past environments
- Inherited vs learned traits
- Magnets & magnetic materials
- States of matter

**Adult Topics** (~200 questions total):
- Chemistry (element symbols, compounds, reactions)
- Biology (human body, cells, genetics)
- Physics (forces, energy, waves)
- Astronomy (planets, stars, space)
- Earth science (geology, atmosphere, climate)
- General science trivia

**Fun distractor rule**: For Grade 1, include one obviously silly wrong answer per question (e.g., "What do plants need to grow?" choices include "Pizza"). This makes wrong answers fun rather than discouraging.

### Reading Question Bank

Reading questions use a hybrid approach: some are fully curated, others generated from word lists.

**Grade 1 Topics** (~200 questions total):
- Rhyming words: "Which word rhymes with cat?" (generated from word-family lists)
- Opposites: "What is the opposite of big?" (generated from antonym pairs)
- Beginning sounds: "Which word starts with the same sound as sun?"
- Fill-in-the-blank: "The frog can ___ very high." (curated)
- Word meaning: "What does happy mean?" (curated)
- Sight words: "Which is a real word?" (generated from sight word lists)

**Grade 3 Topics** (~200 questions total):
- Vocabulary in context
- Grammar (verb tense, subject-verb agreement)
- Similes & idioms ("quiet as a ___")
- Parts of speech identification
- Sentence correction
- Synonyms & antonyms (harder words)

**Adult Topics** (~250 questions total):
- Advanced vocabulary (ubiquitous, ephemeral, etc.)
- Grammar gotchas (affect/effect, who/whom, lay/lie)
- Etymology (word origins)
- Analogies (hot:cold :: day:___)
- Spelling traps
- Idiom meanings

### Question Bank File Structure

```
src/data/
  science/
    grade-1.json     // ~200 questions
    grade-3.json     // ~200 questions
    adult.json       // ~200 questions
  reading/
    grade-1.json     // ~200 questions
    grade-3.json     // ~200 questions
    adult.json       // ~250 questions
  reading-wordlists/
    rhymes.json      // word families for procedural rhyming questions
    antonyms.json    // antonym pairs for procedural opposite questions
    sight-words.json // grade-appropriate sight word lists
```

Each JSON file is an array of question objects:

```json
[
  {
    "question": "What do plants need to grow?",
    "choices": ["Rocks", "Sunlight", "Darkness", "Pizza"],
    "correctIndex": 1,
    "category": "plants",
    "difficulty": "easy"
  }
]
```

### Question Selection Engine

New file: `src/utils/questionEngine.ts`

Responsibilities:
1. Accept `subject`, `gradeLevel`, `difficulty`, and `enabledCategories`
2. For math: delegate to extended `mathProblems.ts` generator
3. For science/reading: load from JSON bank, filter by grade + category + difficulty
4. Track recently shown questions (last 20) to avoid repeats within a session
5. Return a `GameQuestion` object

When multiple subjects are enabled, the engine rotates between them each round (math -> science -> reading -> math -> ...).

### Settings Changes

Add to the Settings interface:

```typescript
interface Settings {
  // ... existing fields ...
  gradeLevel: GradeLevel           // default: 'grade-1'
  enabledSubjects: Subject[]       // default: ['math'] (at least one required)
}
```

**Settings UI updates:**
- Add "Grade Level" selector above Difficulty: Grade 1 / Grade 3 / Adult
- Add "Subjects" toggle section: Math / Science / Reading (checkboxes, min 1)
- When grade level changes, reset enabled categories to defaults for that grade
- The existing "Problem Types" (math categories) section only shows when Math is enabled
- Add Science and Reading category sections that show when those subjects are enabled

### Component Changes

**`MathProblem.tsx` -> `QuestionCard.tsx`**:
- Rename component to `QuestionCard`
- Accept `GameQuestion` instead of `MathProblem`
- Render text choices instead of only numbers
- Choice buttons display full text, font size adjusts based on answer length
- Question text area adapts: short math questions centered large, longer reading/science questions smaller with more space

**Game mode components** (`MathMarathon.tsx`, `TugOfWar.tsx`):
- Replace `useMathEngine` with new `useQuestionEngine` hook
- Pass `GameQuestion` to `QuestionCard`
- Scoring logic unchanged (correct/wrong still binary)
- Profile tracking uses `question.category` (which now includes science/reading categories)

### Profile & Badge Updates

The `ProblemType` union expands to include all categories:

```typescript
type QuestionCategory =
  // Math
  | 'addition' | 'subtraction' | 'missing' | 'comparison' | 'skip-counting'
  | 'multiplication' | 'division' | 'fractions' | 'rounding'
  | 'percentages' | 'order-of-operations' | 'square-roots' | 'estimation'
  // Science
  | 'animals' | 'plants' | 'body-senses' | 'weather' | 'space'
  | 'materials' | 'water-cycle' | 'forces' | 'food-chains' | 'fossils'
  | 'traits' | 'magnets' | 'matter' | 'chemistry' | 'biology'
  | 'physics' | 'astronomy' | 'earth-science'
  // Reading
  | 'rhyming' | 'opposites' | 'beginning-sounds' | 'fill-in-blank'
  | 'word-meaning' | 'sight-words' | 'vocabulary' | 'grammar'
  | 'figurative-language' | 'parts-of-speech' | 'sentence-correction'
  | 'etymology' | 'analogies' | 'spelling'
```

Badges still use the same 4-tier system (bronze=10, silver=25, gold=50, master=100) but now apply per category. The Trophy Shelf groups badges by subject.

---

## Sub-Project 2: Real Sound Effects

### Overview

Replace the Web Audio oscillator-based sounds with real audio files. Bundle small MP3 files as static assets in `public/sounds/`.

### Sound File List

```
public/sounds/
  correct.mp3        // bright ding/chime (~0.5s)
  wrong.mp3          // buzzer/error sound (~0.5s)
  select.mp3         // button click/pop (~0.2s)
  navigate.mp3       // menu tick (~0.1s)
  timer-warn.mp3     // warning beep (~0.3s)
  timer-final.mp3    // urgent beep (~0.3s)
  streak.mp3         // fire whoosh / power-up (~0.8s)
  badge.mp3          // unlock chime / jingle (~1s)
  victory.mp3        // triumphant fanfare (~2s)
  game-start.mp3     // countdown beep sequence (~1.5s)
```

### Source

Use free-licensed sound effects from:
- Mixkit.co (free, no attribution required)
- Freesound.org (CC0 licensed clips)
- Generate via Replicate's Stable Audio if good free options aren't found

### Implementation

Update `src/utils/sounds.ts`:
- Replace oscillator functions with `Audio` object playback
- Preload all sound files on first user interaction (same lazy-init pattern)
- Keep the same API surface: `sounds.correct()`, `sounds.wrong()`, etc.
- Volume control via gain: respect `soundEnabled` setting

```typescript
const audioCache = new Map<string, HTMLAudioElement>()

function playSound(file: string, volume = 0.5) {
  if (!soundEnabled) return
  let audio = audioCache.get(file)
  if (!audio) {
    audio = new Audio(`/sounds/${file}`)
    audioCache.set(file, audio)
  }
  audio.volume = volume
  audio.currentTime = 0
  audio.play().catch(() => {})
}

export const sounds = {
  correct: () => playSound('correct.mp3', 0.6),
  wrong: () => playSound('wrong.mp3', 0.5),
  select: () => playSound('select.mp3', 0.4),
  // ... etc
}
```

---

## Sub-Project 3: AI Announcer

### Overview

Add a live AI announcer that commentates on the game using Replicate's Inworld TTS 1.5 Mini model. The announcer reacts to game events, calls out player names, and provides entertaining commentary.

### Model

- **Model**: `inworld/tts-1.5-mini` on Replicate
- **Latency**: ~120ms median
- **Cost**: $5 per million characters (~$0.0001 per short line)
- **Voices**: Alex (energetic male, default), Ashley, Dennis, Darlene
- **Emotion tags**: `[happy]`, `[sad]`, `[angry]`, `[surprised]`, `[fearful]`
- **Non-verbal**: `[laugh]`, `[sigh]`

### Pre-Generated Lines

Store ~50 common announcer lines as static MP3s in `public/sounds/announcer/`. Generated once at build/dev time via a script.

Categories:
- **Game start**: "Let's go!", "Game on!", "May the best brain win!"
- **Correct answer**: "Nice one!", "That's right!", "Brilliant!"
- **Wrong answer**: "Ooh, not quite!", "Wrong answer!", "Better luck next time!"
- **Streak**: "Three in a row!", "Five streak! Unstoppable!", "On fire!"
- **Close race**: "It's neck and neck!", "This is anyone's game!"
- **Victory**: "And the winner is...", "Champion!", "Game over!"

### Dynamic Lines

Generated at runtime via Replicate API for personalized commentary:

```typescript
interface AnnouncerLine {
  text: string           // The text to speak, with emotion tags
  priority: 'high' | 'normal' | 'low'
  category: 'praise' | 'tease' | 'hype' | 'info'
}
```

**Trigger conditions and example lines:**

| Game Event | Example Line | Priority |
|---|---|---|
| Player answers correctly (3+ streak) | `[happy] ${name} is on fire! That's ${streak} in a row!` | high |
| Player answers wrong after streak | `[surprised] Ooh, ${name} breaks the streak!` | normal |
| Race is close (within 2 spaces) | `[excited] It's neck and neck!` | high |
| Player takes the lead | `[happy] ${name} takes the lead!` | normal |
| Subject switches | `[happy] Time for some science!` | low |
| Player struggling (3+ wrong in a row) | `[sad] Hang in there, ${name}!` | low |
| Win declared | `[happy] And the winner is ${name}! What a game!` | high |

### Announcer Engine

New file: `src/utils/announcer.ts`

Responsibilities:
1. Maintain a queue of lines to speak
2. Deduplicate (don't repeat similar lines within 30 seconds)
3. Rate-limit: max 1 line every 5 seconds (configurable by frequency setting)
4. Priority system: high-priority lines interrupt the queue
5. Play pre-generated MP3 when available, fall back to dynamic TTS

New hook: `src/hooks/useAnnouncer.ts`

The hook watches game state changes and feeds the announcer engine:
- Subscribes to score changes, streak changes, position changes, round results
- Generates appropriate `AnnouncerLine` objects
- Passes them to the announcer engine for playback

### Settings

Add to Settings interface:

```typescript
interface Settings {
  // ... existing fields ...
  announcerEnabled: boolean        // default: true
  announcerVoice: 'alex' | 'ashley' | 'dennis' | 'darlene'  // default: 'alex'
  announcerFrequency: 'chatty' | 'normal' | 'quiet'          // default: 'normal'
}
```

**Frequency controls rate-limiting:**
- Chatty: 1 line every 3 seconds
- Normal: 1 line every 5 seconds
- Quiet: 1 line every 10 seconds, only high-priority

### Pre-Generation Script

`scripts/generate-announcer-lines.ts`:
- Reads a list of line templates from a JSON file
- Calls Replicate TTS for each line in each available voice
- Saves MP3s to `public/sounds/announcer/{voice}/{line-id}.mp3`
- Total cost: ~$0.01 for all lines across all voices

### API Integration

Uses the existing Replicate proxy at `/api/replicate/v1/predictions`:

```typescript
async function generateSpeech(text: string, voice: string): Promise<string> {
  const response = await fetch('/api/replicate/v1/predictions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: '<inworld-tts-1.5-mini-version-hash>',
      input: {
        text,
        speaker: voice,
        output_format: 'mp3',
      }
    })
  })
  // Poll for result (same pattern as avatar generation)
  // Return audio URL
}
```

---

## Architecture Summary

### New Files

| File | Purpose |
|---|---|
| `src/data/science/grade-1.json` | Grade 1 science question bank |
| `src/data/science/grade-3.json` | Grade 3 science question bank |
| `src/data/science/adult.json` | Adult science question bank |
| `src/data/reading/grade-1.json` | Grade 1 reading question bank |
| `src/data/reading/grade-3.json` | Grade 3 reading question bank |
| `src/data/reading/adult.json` | Adult reading question bank |
| `src/data/reading-wordlists/rhymes.json` | Rhyme word families |
| `src/data/reading-wordlists/antonyms.json` | Antonym pairs |
| `src/utils/questionEngine.ts` | Unified question selection engine |
| `src/hooks/useQuestionEngine.ts` | React hook wrapping questionEngine |
| `src/utils/announcer.ts` | Announcer queue/playback engine |
| `src/hooks/useAnnouncer.ts` | React hook watching game state for announcer |
| `scripts/generate-announcer-lines.ts` | Pre-generate TTS lines |
| `public/sounds/*.mp3` | Real sound effect files (~10 files) |
| `public/sounds/announcer/**/*.mp3` | Pre-generated announcer lines |

### Modified Files

| File | Changes |
|---|---|
| `src/types.ts` | Add `Subject`, `GradeLevel`, `GameQuestion`, `QuestionCategory` types |
| `src/utils/mathProblems.ts` | Extend with Grade 3 and Adult math categories |
| `src/utils/sounds.ts` | Replace Web Audio with real audio file playback |
| `src/hooks/useSettings.ts` | Add `gradeLevel`, `enabledSubjects`, announcer settings |
| `src/components/Settings/Settings.tsx` | Add grade level, subject toggles, announcer controls |
| `src/components/shared/MathProblem.tsx` | Rename to `QuestionCard.tsx`, handle text choices |
| `src/components/MathMarathon/MathMarathon.tsx` | Use `useQuestionEngine`, pass `GameQuestion` |
| `src/components/TugOfWar/TugOfWar.tsx` | Use `useQuestionEngine`, pass `GameQuestion` |
| `src/utils/playerProfile.ts` | Expand `ProblemType` to `QuestionCategory` |
| `src/components/TrophyShelf/TrophyShelf.tsx` | Group badges by subject |

### Execution Order

1. **Sub-Project 1**: Multi-Subject Engine + Grade Levels (biggest, most impactful)
2. **Sub-Project 2**: Real Sound Effects (quick, improves feel immediately)
3. **Sub-Project 3**: AI Announcer (builds on both, needs subject context)
