import { useEffect, useRef, useState, useCallback } from 'react'
import Peer from 'peerjs'
import type { DataConnection } from 'peerjs'

export interface GameOverData {
  winnerName: string
  rankings: { name: string; score: number; position: number }[]
}

interface HostMessage {
  type: 'problem' | 'result' | 'assigned' | 'lockedIn' | 'gameOver' | 'spectatorInit' | 'spectatorUpdate' | 'statsUpdate' | 'lobbyFull'
  question?: string
  choices?: string[]
  subject?: string
  correctIndex?: number
  playerId?: number
  name?: string
  winnerName?: string
  rankings?: { name: string; score: number; position: number }[]
  players?: { name: string; playerId: number }[]
}

export function usePeerClient() {
  const [connected, setConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [playerId, setPlayerId] = useState<number | null>(null)
  const [role, setRole] = useState<'player' | 'spectator'>('player')
  const [question, setQuestion] = useState<string | null>(null)
  const [choices, setChoices] = useState<string[]>([])
  const [subject, setSubject] = useState<string>('math')
  const [lockedIn, setLockedIn] = useState(false)
  const [correctIndex, setCorrectIndex] = useState<number | null>(null)
  const [myChoiceIndex, setMyChoiceIndex] = useState<number | null>(null)
  const [gameOver, setGameOver] = useState<GameOverData | null>(null)
  const [spectatorData, setSpectatorData] = useState<Record<string, unknown> | null>(null)
  const [personalStats, setPersonalStats] = useState<Record<string, unknown> | null>(null)
  const [superlatives, setSuperlatives] = useState<Record<string, unknown>[] | null>(null)
  const connRef = useRef<DataConnection | null>(null)
  const peerRef = useRef<Peer | null>(null)

  const sendAnswer = useCallback((choiceIndex: number) => {
    if (connRef.current && !lockedIn) {
      connRef.current.send({ type: 'answer', choiceIndex })
      setLockedIn(true)
      setMyChoiceIndex(choiceIndex)
    }
  }, [lockedIn])

  const connect = useCallback((roomId: string, name: string, connectRole: 'player' | 'spectator' = 'player') => {
    setRole(connectRole)
    setConnectionError(null)
    const peer = new Peer()
    peerRef.current = peer

    peer.on('error', (err) => {
      console.error('PeerJS error:', err)
      setConnectionError(`Connection failed: ${err.type}`)
    })

    // Timeout if connection doesn't establish within 10 seconds
    const timeout = setTimeout(() => {
      if (!connRef.current || connRef.current.open !== true) {
        setConnectionError('Connection timed out — make sure the game is running on the TV/computer')
      }
    }, 10000)

    peer.on('open', () => {
      const conn = peer.connect(`klkids-${roomId}`)
      connRef.current = conn

      conn.on('open', () => {
        clearTimeout(timeout)
        setConnected(true)
        conn.send({ type: 'join', name, role: connectRole })
      })

      conn.on('error', (err) => {
        clearTimeout(timeout)
        console.error('Connection error:', err)
        setConnectionError('Could not connect to game room')
      })

      conn.on('data', (raw) => {
        const data = raw as HostMessage
        if (data.type === 'assigned' && data.playerId) {
          setPlayerId(data.playerId)
        } else if (data.type === 'problem' && data.choices) {
          setQuestion(data.question ?? null)
          setChoices(data.choices)
          setSubject(data.subject ?? 'math')
          setLockedIn(false)
          setCorrectIndex(null)
          setMyChoiceIndex(null)
        } else if (data.type === 'result' && data.correctIndex !== undefined) {
          setCorrectIndex(data.correctIndex)
        } else if (data.type === 'gameOver') {
          setGameOver({
            winnerName: data.winnerName ?? 'Unknown',
            rankings: data.rankings ?? [],
          })
        } else if (data.type === 'spectatorInit') {
          setSpectatorData({ players: data.players ?? [] })
        } else if (data.type === 'spectatorUpdate') {
          setSpectatorData((prev) => ({ ...(prev ?? {}), ...data }))
        } else if (data.type === 'statsUpdate') {
          const { type: _type, ...stats } = data as Record<string, unknown> // eslint-disable-line @typescript-eslint/no-unused-vars
          if (stats.superlatives !== undefined) {
            setSuperlatives(stats.superlatives as Record<string, unknown>[])
          }
          setPersonalStats((prev) => ({ ...(prev ?? {}), ...stats }))
        } else if (data.type === 'lobbyFull') {
          setConnected(false)
          conn.close()
        }
      })

      conn.on('close', () => {
        setConnected(false)
      })
    })
  }, [])

  useEffect(() => {
    return () => {
      connRef.current?.close()
      peerRef.current?.destroy()
    }
  }, [])

  return {
    connected, connectionError, playerId, role, question, choices, subject,
    lockedIn, correctIndex, myChoiceIndex, gameOver,
    spectatorData, personalStats, superlatives,
    sendAnswer, connect,
  }
}
