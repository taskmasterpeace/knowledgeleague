import { useSettings } from '../../hooks/useSettings'
import type { ProblemType, Subject } from '../../types'
import { sounds } from '../../utils/sounds'
import { AVAILABLE_VOICES, speakTTS } from '../../utils/ttsCache'

interface Props {
  onClose: () => void
}

const CATEGORY_OPTIONS: { key: ProblemType; label: string }[] = [
  { key: 'addition', label: 'Addition' },
  { key: 'subtraction', label: 'Subtraction' },
  { key: 'missing', label: 'Missing #' },
  { key: 'comparison', label: 'Compare' },
  { key: 'skip-counting', label: 'Skip Count' },
]

const TIME_OPTIONS = [
  { label: '10s', value: 10_000 },
  { label: '15s', value: 15_000 },
  { label: '20s', value: 20_000 },
  { label: '30s', value: 30_000 },
]

const TRACK_OPTIONS = [10, 15, 20, 30]

const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard', 'adaptive'] as const

export function Settings({ onClose }: Props) {
  const settings = useSettings()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 stars-bg screen-enter flex flex-col items-center p-6 overflow-y-auto">
      {/* Header with back button */}
      <div className="w-full max-w-lg flex items-center gap-4 mb-6">
        <button
          onClick={() => { sounds.navigate(); onClose() }}
          className="pixel-btn font-pixel-body font-bold py-2 px-4 bg-indigo-700 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors shrink-0"
        >
          BACK
        </button>
        <h2 className="font-pixel text-lg text-white text-glow text-center flex-1">SETTINGS</h2>
        <div className="w-16" /> {/* spacer for centering */}
      </div>

      <div className="w-full max-w-lg flex flex-col gap-5">
        {/* Grade Level */}
        <div>
          <label className="font-pixel-body font-bold text-sm text-white/50 uppercase tracking-wide block mb-2">Grade Level</label>
          <div className="flex gap-2">
            {([['grade-1', 'Grade 1'], ['grade-2', 'Grade 2'], ['grade-3', 'Grade 3'], ['adult', 'Adult']] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => settings.update({ gradeLevel: value })}
                className={`flex-1 py-2 rounded-lg font-pixel-body font-bold text-xs transition-all pixel-btn ${
                  settings.gradeLevel === value
                    ? 'bg-yellow-500 text-gray-900'
                    : 'bg-white/10 text-white/50 hover:bg-white/20'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Subjects */}
        <div>
          <label className="font-pixel-body font-bold text-sm text-white/50 uppercase tracking-wide block mb-2">Subjects</label>
          <div className="flex gap-2">
            {([['math', 'Math'], ['science', 'Science'], ['reading', 'Reading'], ['spelling', 'Spelling'], ['images', 'Images']] as [Subject, string][]).map(([key, label]) => {
              const enabled = settings.enabledSubjects.includes(key)
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (enabled && settings.enabledSubjects.length === 1) return
                    const next = enabled
                      ? settings.enabledSubjects.filter(s => s !== key)
                      : [...settings.enabledSubjects, key]
                    settings.update({ enabledSubjects: next })
                  }}
                  className={`flex-1 py-2 rounded-lg font-pixel-body font-bold text-xs transition-all pixel-btn ${
                    enabled
                      ? 'bg-cyan-500 text-gray-900'
                      : 'bg-white/10 text-white/50 hover:bg-white/20'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="font-pixel-body font-bold text-sm text-white/50 uppercase tracking-wide block mb-2">Difficulty</label>
          <div className="flex gap-2">
            {DIFFICULTY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => settings.update({ difficulty: d })}
                className={`flex-1 py-2 rounded-lg font-pixel text-[7px] capitalize transition-all pixel-btn ${
                  settings.difficulty === d
                    ? 'bg-yellow-500 text-gray-900'
                    : 'bg-white/10 text-white/50 hover:bg-white/20'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Adaptive Mode Toggle */}
        <div className="pixel-card rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="font-pixel-body font-bold text-sm text-white/60 uppercase">Adaptive (per player)</span>
          <button
            onClick={() => settings.update({ adaptiveMode: settings.adaptiveMode === 'per-player' ? 'off' : 'per-player' })}
            className={`w-14 h-7 rounded-full transition-all relative ${
              settings.adaptiveMode === 'per-player' ? 'bg-green-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${
                settings.adaptiveMode === 'per-player' ? 'left-7' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Behavior Tags */}
        <div>
          <label className="font-pixel-body font-bold text-sm text-white/50 uppercase tracking-wide block mb-2">Behavior Tags</label>
          <div className="flex gap-2">
            {([
              ['spectators-only', 'Spectators Only'],
              ['post-game', 'Post-Game'],
              ['always', 'Always Visible'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => settings.update({ behaviorTags: value })}
                className={`flex-1 py-2 rounded-lg font-pixel-body font-bold text-xs transition-all pixel-btn ${
                  settings.behaviorTags === value
                    ? 'bg-cyan-500 text-gray-900'
                    : 'bg-white/10 text-white/50 hover:bg-white/20'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Problem Types */}
        <div>
          <label className="font-pixel-body font-bold text-sm text-white/50 uppercase tracking-wide block mb-2">Problem Types</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORY_OPTIONS.map(({ key, label }) => {
              const enabled = settings.enabledCategories.includes(key)
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (enabled && settings.enabledCategories.length === 1) return
                    const next = enabled
                      ? settings.enabledCategories.filter((c) => c !== key)
                      : [...settings.enabledCategories, key]
                    settings.update({ enabledCategories: next })
                  }}
                  className={`py-2 px-1 rounded-lg font-pixel-body font-bold text-xs transition-all pixel-btn ${
                    enabled
                      ? 'bg-yellow-500 text-gray-900'
                      : 'bg-white/10 text-white/50 hover:bg-white/20'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Time per question */}
        <div>
          <label className="font-pixel-body font-bold text-sm text-white/50 uppercase tracking-wide block mb-2">Time per Question</label>
          <div className="flex gap-2">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => settings.update({ timePerQuestion: t.value })}
                className={`flex-1 py-2 rounded-lg font-pixel-body font-bold text-sm transition-all pixel-btn ${
                  settings.timePerQuestion === t.value
                    ? 'bg-yellow-500 text-gray-900'
                    : 'bg-white/10 text-white/50 hover:bg-white/20'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Track length */}
        <div>
          <label className="font-pixel-body font-bold text-sm text-white/50 uppercase tracking-wide block mb-2">Track Length</label>
          <div className="flex gap-2">
            {TRACK_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => settings.update({ trackLength: n })}
                className={`flex-1 py-2 rounded-lg font-pixel-body font-bold text-sm transition-all pixel-btn ${
                  settings.trackLength === n
                    ? 'bg-yellow-500 text-gray-900'
                    : 'bg-white/10 text-white/50 hover:bg-white/20'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        {[
          { key: 'soundEnabled' as const, label: 'Sound Effects' },
          { key: 'musicEnabled' as const, label: 'Music' },
          { key: 'vibrationEnabled' as const, label: 'Controller Vibration' },
        ].map(({ key, label }) => (
          <div key={key} className="pixel-card rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="font-pixel-body font-bold text-sm text-white/60 uppercase">{label}</span>
            <button
              onClick={() => settings.update({ [key]: !settings[key] })}
              className={`w-14 h-7 rounded-full transition-all relative ${
                settings[key] ? 'bg-green-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${
                  settings[key] ? 'left-7' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        ))}

        {/* AI Announcer */}
        <div>
          <label className="font-pixel-body font-bold text-sm text-white/50 uppercase tracking-wide block mb-2">AI Announcer</label>
          <div className="pixel-card rounded-lg px-4 py-3 flex items-center justify-between mb-2">
            <span className="font-pixel-body font-bold text-sm text-white/60 uppercase">Announcer</span>
            <button
              onClick={() => settings.update({ announcerEnabled: !settings.announcerEnabled })}
              className={`w-14 h-7 rounded-full transition-all relative ${
                settings.announcerEnabled ? 'bg-green-500' : 'bg-white/20'
              }`}
            >
              <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${
                settings.announcerEnabled ? 'left-7' : 'left-0.5'
              }`} />
            </button>
          </div>
          {settings.announcerEnabled && (
            <>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {AVAILABLE_VOICES.map(voice => (
                  <button
                    key={voice.id}
                    onClick={() => {
                      settings.update({ announcerVoice: voice.id })
                      // Play a preview line with the selected voice
                      speakTTS(`Hi! I'm ${voice.label}!`, voice.id)
                    }}
                    className={`py-2 rounded-lg font-pixel-body font-bold text-xs transition-all pixel-btn flex flex-col items-center gap-0.5 ${
                      settings.announcerVoice === voice.id
                        ? 'bg-yellow-500 text-gray-900'
                        : 'bg-white/10 text-white/50 hover:bg-white/20'
                    }`}
                  >
                    <span>{voice.label}</span>
                    <span className={`text-[8px] font-normal ${settings.announcerVoice === voice.id ? 'text-gray-700' : 'text-white/30'}`}>
                      {voice.description}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {(['chatty', 'normal', 'quiet'] as const).map(freq => (
                  <button
                    key={freq}
                    onClick={() => settings.update({ announcerFrequency: freq })}
                    className={`flex-1 py-1.5 rounded-lg font-pixel text-[6px] capitalize transition-all pixel-btn ${
                      settings.announcerFrequency === freq
                        ? 'bg-yellow-500 text-gray-900'
                        : 'bg-white/10 text-white/50 hover:bg-white/20'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bottom back button */}
        <button
          onClick={() => { sounds.navigate(); onClose() }}
          className="pixel-btn font-pixel w-full mt-2 mb-8 py-3 bg-indigo-700 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors"
        >
          BACK TO MENU
        </button>
      </div>
    </div>
  )
}
