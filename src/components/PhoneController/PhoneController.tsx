import { useState } from 'react'
import { usePeerClient } from '../../hooks/usePeerClient'
import { SpectatorDashboard } from '../SpectatorDashboard/SpectatorDashboard'

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
  const [selectedRole, setSelectedRole] = useState<'player' | 'spectator'>('player')
  const [showStats, setShowStats] = useState(false)
  const {
    connected, playerId, role, question, choices, subject,
    lockedIn, correctIndex, myChoiceIndex, gameOver,
    spectatorData, personalStats, superlatives,
    sendAnswer, connect,
  } = usePeerClient()

  const handleJoin = () => {
    if (!name.trim()) return
    connect(roomId, name.trim(), selectedRole)
    setJoined(true)
  }

  // Name entry screen
  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 flex flex-col items-center justify-center gap-6 p-6">
        <h1 className="font-pixel text-3xl text-white text-glow">JOIN GAME</h1>
        <p className="font-pixel text-xs text-white/50">Room: {roomId}</p>

        {/* Play / Watch toggle */}
        <div className="flex gap-2 p-1 rounded-full bg-white/10 border border-white/20">
          <button
            onClick={() => setSelectedRole('player')}
            className={`font-pixel text-sm px-5 py-2 rounded-full transition-all ${
              selectedRole === 'player'
                ? 'bg-yellow-500 text-gray-900'
                : 'text-white/60 hover:text-white'
            }`}
          >
            🎮 Play
          </button>
          <button
            onClick={() => setSelectedRole('spectator')}
            className={`font-pixel text-sm px-5 py-2 rounded-full transition-all ${
              selectedRole === 'spectator'
                ? 'bg-purple-500 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            👁️ Watch
          </button>
        </div>

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
          className={`pixel-btn font-pixel w-full max-w-xs py-5 disabled:bg-white/10 disabled:text-white/30 text-gray-900 text-lg rounded-xl transition-all ${
            selectedRole === 'spectator'
              ? 'bg-purple-500 hover:bg-purple-400 text-white'
              : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'
          }`}
        >
          {selectedRole === 'spectator' ? 'WATCH' : 'JOIN'}
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

  // Spectator view
  if (role === 'spectator') {
    const analyticsData = spectatorData?.analytics ?? null
    const playerInfoList = spectatorData?.players?.map((p: { name: string; color?: string }, i: number) => ({
      name: p.name,
      color: p.color ?? ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#c084fc', '#22d3ee'][i % 6],
    }))
    return (
      <SpectatorDashboard
        analyticsData={analyticsData}
        playerInfo={playerInfoList}
      />
    )
  }

  // Game Over screen
  if (gameOver) {
    const myRank = gameOver.rankings.findIndex(r => r.name === name) + 1
    const isWinner = gameOver.winnerName === name
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 flex flex-col items-center justify-center gap-5 p-6">
        {!showStats ? (
          <>
            {isWinner ? (
              <>
                <div className="text-6xl">🏆</div>
                <h1 className="font-pixel text-2xl text-yellow-300 text-glow animate-bounce">YOU WIN!</h1>
              </>
            ) : (
              <>
                <div className="text-5xl">{myRank <= 3 ? '🎉' : '👏'}</div>
                <h1 className="font-pixel text-xl text-white text-glow">GAME OVER</h1>
                <p className="font-pixel text-sm text-yellow-300">{gameOver.winnerName} wins!</p>
              </>
            )}

            {/* Leaderboard */}
            <div className="w-full max-w-xs flex flex-col gap-2 mt-2">
              {gameOver.rankings.map((r, i) => {
                const isMe = r.name === name
                const placeLabels = ['1ST', '2ND', '3RD']
                const placeLabel = i < 3 ? placeLabels[i] : `${i + 1}TH`
                const placeColors = ['text-yellow-300', 'text-gray-300', 'text-amber-500', 'text-white/40']
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${
                      isMe ? 'bg-yellow-500/20 border border-yellow-400/40' : 'bg-white/5'
                    }`}
                  >
                    <span className={`font-pixel text-[9px] font-bold w-8 ${placeColors[i] ?? 'text-white/40'}`}>
                      {placeLabel}
                    </span>
                    <span className={`font-pixel text-xs flex-1 ${isMe ? 'text-yellow-300' : 'text-white/80'}`}>
                      {r.name}{isMe ? ' (you)' : ''}
                    </span>
                    <span className="font-pixel text-[8px] text-white/50">{r.score} pts</span>
                  </div>
                )
              })}
            </div>

            {personalStats && (
              <button
                onClick={() => setShowStats(true)}
                className="font-pixel text-sm px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all mt-2"
              >
                VIEW MY STATS
              </button>
            )}

            <p className="font-pixel text-[8px] text-white/30 mt-2">Waiting for host...</p>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowStats(false)}
              className="self-start font-pixel text-[9px] text-white/50 hover:text-white transition-colors mb-2"
            >
              ← BACK
            </button>

            {personalStats && (
              <div className="w-full max-w-xs p-4 space-y-4">
                <h2 className="font-pixel text-sm text-white text-center">YOUR STATS</h2>

                {/* Accuracy */}
                <div className="pixel-card rounded-lg p-4">
                  <div className="font-pixel text-[9px] text-white/50 mb-1">ACCURACY</div>
                  <div className="font-pixel text-lg text-cyan-400">
                    {personalStats.answersTotal > 0
                      ? `${Math.round((personalStats.answersCorrect / personalStats.answersTotal) * 100)}%`
                      : '—'}
                  </div>
                  <div className="font-pixel text-[8px] text-white/40">
                    {personalStats.answersCorrect}/{personalStats.answersTotal} correct
                  </div>
                </div>

                {/* Avg Response Time */}
                <div className="pixel-card rounded-lg p-4">
                  <div className="font-pixel text-[9px] text-white/50 mb-1">AVG RESPONSE</div>
                  <div className="font-pixel text-lg text-yellow-400">
                    {personalStats.responseTimes && personalStats.responseTimes.length > 0
                      ? `${(personalStats.responseTimes.reduce((a: number, b: number) => a + b, 0) / personalStats.responseTimes.length / 1000).toFixed(1)}s`
                      : '—'}
                  </div>
                </div>

                {/* Best Streak */}
                <div className="pixel-card rounded-lg p-4">
                  <div className="font-pixel text-[9px] text-white/50 mb-1">BEST STREAK</div>
                  <div className="font-pixel text-lg text-green-400">
                    {(() => {
                      let max = 0, cur = 0
                      for (const c of (personalStats.fullCorrectHistory ?? [])) {
                        if (c) { cur++; max = Math.max(max, cur) } else cur = 0
                      }
                      return max
                    })()}
                  </div>
                </div>

                {/* Behavior Tag */}
                {personalStats.behaviorTag && (
                  <div className="pixel-card rounded-lg p-4">
                    <div className="font-pixel text-[9px] text-white/50 mb-1">PLAY STYLE</div>
                    <div className="font-pixel text-sm text-purple-400">
                      {personalStats.behaviorTag.replace('-', ' ').toUpperCase()}
                    </div>
                  </div>
                )}

                {/* Superlatives the player earned */}
                {superlatives && superlatives.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-pixel text-[9px] text-white/50 text-center">AWARDS</div>
                    {superlatives.map((s: { award: string; value: string | number }) => (
                      <div key={s.award} className="pixel-card rounded-lg p-3 flex items-center gap-3">
                        <span className="text-xl">🏆</span>
                        <div>
                          <div className="font-pixel text-[9px] text-yellow-400">{s.award}</div>
                          <div className="font-pixel text-[8px] text-white/60">{s.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
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
  const showResult = correctIndex !== null
  const wasCorrect = myChoiceIndex !== null && correctIndex === myChoiceIndex

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

      {/* Answer feedback banner */}
      {showResult && (
        <div className={`text-center py-2 rounded-lg font-pixel text-sm ${
          wasCorrect
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : myChoiceIndex !== null
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
        }`}>
          {wasCorrect ? 'CORRECT!' : myChoiceIndex !== null ? 'WRONG!' : 'TIME UP!'}
        </div>
      )}

      {/* Answer grid */}
      <div className={`flex-1 grid ${isLongText ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
        {choices.map((choice, i) => {
          const isCorrectChoice = correctIndex === i
          const isMyPick = myChoiceIndex === i

          return (
            <button
              key={i}
              onClick={() => sendAnswer(i)}
              disabled={lockedIn}
              className={`rounded-xl text-white font-bold flex items-center justify-center transition-all active:scale-95 px-3 relative ${
                showResult
                  ? isCorrectChoice
                    ? 'bg-green-500 ring-2 ring-green-300'
                    : isMyPick
                    ? 'bg-red-500/60 ring-2 ring-red-400'
                    : 'bg-white/10 opacity-40'
                  : lockedIn
                    ? isMyPick
                      ? 'ring-2 ring-white/60 opacity-80'
                      : 'bg-white/20 opacity-40'
                    : 'active:brightness-110'
              }`}
              style={{
                backgroundColor: showResult || (lockedIn && !isMyPick) ? undefined : ANSWER_COLORS[i],
                fontSize: isLongText ? 'clamp(0.8rem, 4vw, 1.2rem)' : 'clamp(1.5rem, 8vw, 3rem)',
                minHeight: isLongText ? '60px' : undefined,
              }}
            >
              {choice}
              {/* Lock-in indicator */}
              {lockedIn && isMyPick && !showResult && (
                <span className="absolute top-1 right-2 font-pixel text-[7px] text-white/70">LOCKED</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Status bar */}
      <div className="text-center py-2">
        {lockedIn && correctIndex === null && (
          <p className="font-pixel text-sm text-green-400 animate-pulse">LOCKED IN</p>
        )}
      </div>
    </div>
  )
}
