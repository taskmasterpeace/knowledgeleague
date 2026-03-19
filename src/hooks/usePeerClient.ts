import { useEffect, useRef, useState, useCallback } from 'react'
import Peer from 'peerjs'
import type { DataConnection } from 'peerjs'

export interface GameOverData {
  winnerName: string
  rankings: { name: string; score: number; position: number }[]
}

interface HostMessage {
  type: 'problem' | 'result' | 'assigned' | 'lockedIn' | 'gameOver'
  question?: string
  choices?: string[]
  subject?: string
  correctIndex?: number
  playerId?: number
  name?: string
  winnerName?: string
  rankings?: { name: string; score: number; position: number }[]
}

export function usePeerClient() {
  const [connected, setConnected] = useState(false)
  const [playerId, setPlayerId] = useState<number | null>(null)
  const [question, setQuestion] = useState<string | null>(null)
  const [choices, setChoices] = useState<string[]>([])
  const [subject, setSubject] = useState<string>('math')
  const [lockedIn, setLockedIn] = useState(false)
  const [correctIndex, setCorrectIndex] = useState<number | null>(null)
  const [myChoiceIndex, setMyChoiceIndex] = useState<number | null>(null)
  const [gameOver, setGameOver] = useState<GameOverData | null>(null)
  const connRef = useRef<DataConnection | null>(null)
  const peerRef = useRef<Peer | null>(null)

  const sendAnswer = useCallback((choiceIndex: number) => {
    if (connRef.current && !lockedIn) {
      connRef.current.send({ type: 'answer', choiceIndex })
      setLockedIn(true)
      setMyChoiceIndex(choiceIndex)
    }
  }, [lockedIn])

  const connect = useCallback((roomId: string, name: string) => {
    const peer = new Peer()
    peerRef.current = peer

    peer.on('open', () => {
      const conn = peer.connect(`braingames-${roomId}`)
      connRef.current = conn

      conn.on('open', () => {
        setConnected(true)
        conn.send({ type: 'join', name })
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
    connected, playerId, question, choices, subject,
    lockedIn, correctIndex, myChoiceIndex, gameOver,
    sendAnswer, connect,
  }
}
