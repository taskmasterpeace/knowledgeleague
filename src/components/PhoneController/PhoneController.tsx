import { useState } from 'react'
import { usePeerClient } from '../../hooks/usePeerClient'

interface Props {
  roomId: string
}

const SUBJECT_COLORS: Record<string, string> = {
  math: '#22d3ee',
  science: '#4ade80',
  reading: '#c084fc',
}

const ANSWER_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444']

export function PhoneController({ roomId }: Props) {
  const [name, setName] = useState('')
  const [joined, setJoined] = useState(false)
  const { connected, playerId, question, choices, subject, lockedIn, correctIndex, sendAnswer, connect } = usePeerClient()

  const handleJoin = () => {
    if (!name.trim()) return
    connect(roomId, name.trim())
    setJoined(true)
  }

  // Name entry screen
  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 flex flex-col items-center justify-center gap-6 p-6">
        <h1 className="font-pixel text-3xl text-white text-glow">JOIN GAME</h1>
        <p className="font-pixel text-xs text-white/50">Room: {roomId}</p>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          placeholder="Your name"
          className="w-full max-w-xs text-center text-2xl font-bold py-4 px-6 rounded-xl bg-white/10 border-2 border-white/30 text-white placeholder-white/40 outline-none focus:border-yellow-400 font-pixel"
          autoFocus
          maxLength={12}
        />
        <button
          onClick={handleJoin}
          disabled={!name.trim()}
          className="pixel-btn font-pixel w-full max-w-xs py-5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-white/10 disabled:text-white/30 text-gray-900 text-lg rounded-xl transition-all"
        >
          JOIN
        </button>
      </div>
    )
  }

  // Connecting state
  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 flex flex-col items-center justify-center gap-6 p-6">
        <div className="w-10 h-10 border-3 border-white/30 border-t-yellow-400 rounded-full animate-spin" />
        <p className="font-pixel text-sm text-white">Connecting...</p>
      </div>
    )
  }

  // Waiting for game to start
  if (choices.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-5xl">🎮</div>
        <p className="font-pixel text-lg text-white text-glow">{name}</p>
        <p className="font-pixel text-xs text-white/50">Player {playerId}</p>
        <p className="font-pixel text-sm text-yellow-300 animate-pulse">Waiting for game...</p>
      </div>
    )
  }

  // Determine if answers are long text (science/reading) vs short (math)
  const maxChoiceLen = Math.max(...choices.map(c => c.length))
  const isLongText = maxChoiceLen > 8

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col p-3 gap-3">
      {/* Question display */}
      <div className="text-center py-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="font-pixel text-[7px] text-white/40">{name} · P{playerId}</span>
          <span
            className="font-pixel text-[6px] px-2 py-0.5 rounded-full uppercase"
            style={{ backgroundColor: `${SUBJECT_COLORS[subject] ?? '#22d3ee'}33`, color: SUBJECT_COLORS[subject] ?? '#22d3ee' }}
          >
            {subject}
          </span>
        </div>
        {question && (
          <div className={`font-pixel text-white leading-relaxed ${
            question.length > 40 ? 'text-sm' : question.length > 20 ? 'text-lg' : 'text-2xl'
          }`}>
            {question}{subject === 'math' ? ' = ?' : ''}
          </div>
        )}
      </div>

      {/* Answer grid */}
      <div className={`flex-1 grid ${isLongText ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
        {choices.map((choice, i) => {
          const isCorrectChoice = correctIndex === i
          const showResult = correctIndex !== null

          return (
            <button
              key={i}
              onClick={() => sendAnswer(i)}
              disabled={lockedIn}
              className={`rounded-xl text-white font-bold flex items-center justify-center transition-all active:scale-95 px-3 ${
                showResult
                  ? isCorrectChoice
                    ? 'bg-green-500 ring-2 ring-green-300'
                    : 'bg-white/10 opacity-40'
                  : lockedIn
                    ? 'bg-white/20 opacity-60'
                    : 'active:brightness-110'
              }`}
              style={{
                backgroundColor: showResult || lockedIn ? undefined : ANSWER_COLORS[i],
                fontSize: isLongText ? 'clamp(0.8rem, 4vw, 1.2rem)' : 'clamp(1.5rem, 8vw, 3rem)',
                minHeight: isLongText ? '60px' : undefined,
              }}
            >
              {choice}
            </button>
          )
        })}
      </div>

      {/* Status bar */}
      <div className="text-center py-2">
        {lockedIn && correctIndex === null && (
          <p className="font-pixel text-sm text-green-400 animate-pulse">LOCKED IN</p>
        )}
        {correctIndex !== null && (
          <p className="font-pixel text-sm text-yellow-300">
            Answer: {choices[correctIndex]}
          </p>
        )}
      </div>
    </div>
  )
}
