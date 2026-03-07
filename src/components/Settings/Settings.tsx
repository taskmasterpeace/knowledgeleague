import { useSettings } from '../../hooks/useSettings'

interface Props {
  onClose: () => void
}

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gradient-to-b from-indigo-700 to-purple-900 rounded-2xl p-8 border-2 border-white/20 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-black text-white mb-6 text-center">SETTINGS</h2>

        <div className="flex flex-col gap-5">
          {/* Difficulty */}
          <div>
            <label className="text-white/70 text-sm font-bold uppercase tracking-wide">Difficulty</label>
            <div className="flex gap-2 mt-1">
              {DIFFICULTY_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => settings.update({ difficulty: d })}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                    settings.difficulty === d
                      ? 'bg-yellow-400 text-gray-900'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Time per question */}
          <div>
            <label className="text-white/70 text-sm font-bold uppercase tracking-wide">Time per Question</label>
            <div className="flex gap-2 mt-1">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => settings.update({ timePerQuestion: t.value })}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    settings.timePerQuestion === t.value
                      ? 'bg-yellow-400 text-gray-900'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Track length */}
          <div>
            <label className="text-white/70 text-sm font-bold uppercase tracking-wide">Track Length</label>
            <div className="flex gap-2 mt-1">
              {TRACK_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => settings.update({ trackLength: n })}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    settings.trackLength === n
                      ? 'bg-yellow-400 text-gray-900'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
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
            <div key={key} className="flex items-center justify-between">
              <span className="text-white/70 text-sm font-bold uppercase tracking-wide">{label}</span>
              <button
                onClick={() => settings.update({ [key]: !settings[key] })}
                className={`w-14 h-7 rounded-full transition-all relative ${
                  settings[key] ? 'bg-green-400' : 'bg-white/20'
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
          className="w-full mt-6 py-3 bg-white/20 hover:bg-white/30 text-white text-xl font-bold rounded-xl transition-all"
        >
          DONE
        </button>
      </div>
    </div>
  )
}
