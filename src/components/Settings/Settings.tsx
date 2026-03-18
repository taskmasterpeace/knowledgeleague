import { useSettings } from '../../hooks/useSettings'
import type { ProblemType } from '../../types'

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="pixel-card rounded-lg p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-pixel text-lg text-white text-glow mb-6 text-center">SETTINGS</h2>

        <div className="flex flex-col gap-5">
          {/* Difficulty */}
          <div>
            <label className="font-pixel text-[8px] text-white/50 uppercase tracking-wide block mb-2">Difficulty</label>
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

          {/* Problem Types */}
          <div>
            <label className="font-pixel text-[8px] text-white/50 uppercase tracking-wide block mb-2">Problem Types</label>
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
                    className={`py-2 px-1 rounded-lg font-pixel text-[6px] transition-all pixel-btn ${
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
            <label className="font-pixel text-[8px] text-white/50 uppercase tracking-wide block mb-2">Time per Question</label>
            <div className="flex gap-2">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => settings.update({ timePerQuestion: t.value })}
                  className={`flex-1 py-2 rounded-lg font-pixel text-[8px] transition-all pixel-btn ${
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
            <label className="font-pixel text-[8px] text-white/50 uppercase tracking-wide block mb-2">Track Length</label>
            <div className="flex gap-2">
              {TRACK_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => settings.update({ trackLength: n })}
                  className={`flex-1 py-2 rounded-lg font-pixel text-[8px] transition-all pixel-btn ${
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
              <span className="font-pixel text-[8px] text-white/60 uppercase">{label}</span>
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
        </div>

        <button
          onClick={onClose}
          className="pixel-btn font-pixel w-full mt-6 py-3 bg-indigo-700 hover:bg-indigo-600 text-white text-[10px] rounded-lg transition-colors"
        >
          DONE
        </button>
      </div>
    </div>
  )
}
