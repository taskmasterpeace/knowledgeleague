import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameState } from './hooks/useGameState'
import { usePeerHost } from './hooks/usePeerHost'
import { PeerContext } from './hooks/usePeerContext'
import type { RemotePlayer } from './hooks/usePeerHost'
import type { PlayerId } from './types'
import { Menu } from './components/Menu/Menu'
import { CPUSelect } from './components/CPUSelect/CPUSelect'
import { AvatarSelect } from './components/AvatarSelect/AvatarSelect'
import { EventSelect } from './components/EventSelect/EventSelect'
import { MathMarathon } from './components/MathMarathon/MathMarathon'
import { TugOfWar } from './components/TugOfWar/TugOfWar'
import { HurdleDash } from './components/HurdleDash/HurdleDash'
import { LongJump } from './components/LongJump/LongJump'
import { SpellingBee } from './components/SpellingBee/SpellingBee'
import { Victory } from './components/Victory/Victory'
import { PostGameStats } from './components/PostGameStats/PostGameStats'
import { TrophyShelf } from './components/TrophyShelf/TrophyShelf'
import { Leaderboards } from './components/Leaderboards/Leaderboards'
import { DailyChallenge } from './components/DailyChallenge/DailyChallenge'
import { PhoneController } from './components/PhoneController/PhoneController'
import { PhoneLobby } from './components/PhoneLobby/PhoneLobby'
import { PartySetup } from './components/PartyMode/PartySetup'
import { PartyTransition } from './components/PartyMode/PartyTransition'
import { PartyResults } from './components/PartyMode/PartyResults'
import { PLAYER_COLORS } from './utils/constants'
import { useSettings } from './hooks/useSettings'
import { speak, playerJoinLine, gameStartLine } from './utils/announcer'

function App() {
  const { phase, event } = useGameState()
  const [route, setRoute] = useState(window.location.pathname)
  const [peerEnabled, setPeerEnabled] = useState(false)

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Phone controller route: /join/:roomId
  const joinMatch = route.match(/^\/join\/([a-z0-9_-]+)$/i)
  if (joinMatch) {
    return <PhoneController roomId={joinMatch[1]} />
  }

  return <HostApp peerEnabled={peerEnabled} setPeerEnabled={setPeerEnabled} phase={phase} event={event} />
}

function PhoneLobbyWrapper({ joinUrl, roomId, remotePlayers }: {
  joinUrl: string | null
  roomId: string | null
  remotePlayers: RemotePlayer[]
}) {
  const { setPhase, setPlayerCount, setPlayerName, setPlayerColor } = useGameState()
  const { announcerEnabled, announcerVoice, announcerFrequency } = useSettings()
  const prevCountRef = useRef(0)

  const announcerConfig = { enabled: announcerEnabled, voice: announcerVoice, frequency: announcerFrequency }

  // Announce when a new player joins
  useEffect(() => {
    if (remotePlayers.length > prevCountRef.current) {
      const newest = remotePlayers[remotePlayers.length - 1]
      if (newest) {
        speak(playerJoinLine(newest.name), announcerConfig)
      }
    }
    prevCountRef.current = remotePlayers.length
  }, [remotePlayers.length])

  const handleStartGame = () => {
    // Set up players: P1 is the host (keyboard), remote players get assigned slots
    const totalPlayers = 1 + remotePlayers.length
    setPlayerCount(totalPlayers)

    // Set remote player names/colors
    for (const rp of remotePlayers) {
      setPlayerName(rp.playerId as PlayerId, rp.name)
      setPlayerColor(rp.playerId as PlayerId, PLAYER_COLORS[(rp.playerId - 1) % PLAYER_COLORS.length])
    }

    // Announce game start
    speak(gameStartLine(totalPlayers), announcerConfig)

    setPhase('event-select')
  }

  const handleBack = () => {
    setPhase('menu')
  }

  return (
    <PhoneLobby
      joinUrl={joinUrl}
      roomId={roomId}
      remotePlayers={remotePlayers}
      onStartGame={handleStartGame}
      onBack={handleBack}
    />
  )
}

function HostApp({ peerEnabled, setPeerEnabled, phase, event }: {
  peerEnabled: boolean
  setPeerEnabled: (v: boolean) => void
  phase: string
  event: string | null
}) {
  const handleRemoteAnswer = useCallback((playerId: number, choiceIndex: number) => {
    window.__remoteAnswerHandler?.(playerId, choiceIndex)
  }, [])

  const peer = usePeerHost({
    enabled: peerEnabled,
    onRemoteAnswer: handleRemoteAnswer,
  })

  const ctx = {
    enabled: peerEnabled,
    roomId: peer.roomId,
    joinUrl: peer.joinUrl,
    remotePlayers: peer.remotePlayers,
    spectators: peer.spectators,
    broadcastProblem: peer.broadcastProblem,
    broadcastResult: peer.broadcastResult,
    broadcastLockIn: peer.broadcastLockIn,
    broadcastGameOver: peer.broadcastGameOver,
    broadcastSpectatorUpdate: peer.broadcastSpectatorUpdate,
    broadcastStats: peer.broadcastStats,
    setEnabled: setPeerEnabled,
  }

  return (
    <PeerContext.Provider value={ctx}>
      {phase === 'menu' && <Menu />}
      {phase === 'cpu-select' && <CPUSelect />}
      {phase === 'avatar-select' && <AvatarSelect />}
      {phase === 'event-select' && <EventSelect />}
      {phase === 'phone-lobby' && (
        <PhoneLobbyWrapper
          joinUrl={peer.joinUrl}
          roomId={peer.roomId}
          remotePlayers={peer.remotePlayers}
        />
      )}
      {phase === 'playing' && event === 'marathon' && <MathMarathon />}
      {phase === 'playing' && event === 'tug-of-war' && <TugOfWar />}
      {phase === 'playing' && event === 'hurdle-dash' && <HurdleDash />}
      {phase === 'playing' && event === 'long-jump' && <LongJump />}
      {phase === 'playing' && event === 'spelling-bee' && <SpellingBee />}
      {phase === 'stats' && <PostGameStats />}
      {phase === 'victory' && <Victory />}
      {phase === 'trophies' && <TrophyShelf />}
      {phase === 'leaderboards' && <Leaderboards />}
      {phase === 'daily-challenge' && <DailyChallenge />}
      {phase === 'party-setup' && <PartySetup />}
      {phase === 'party-transition' && <PartyTransition />}
      {phase === 'party-results' && <PartyResults />}
    </PeerContext.Provider>
  )
}

export default App
