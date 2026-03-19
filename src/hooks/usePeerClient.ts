import { useEffect, useRef, useState, useCallback } from 'react'
import Peer from 'peerjs'
import type { DataConnection } from 'peerjs'

interface HostMessage {
  type: 'problem' | 'result' | 'assigned' | 'lockedIn'
  question?: string
  choices?: string[]
  subject?: string
  correctIndex?: number
  playerId?: number
  name?: string
}

export function usePeerClient() {
  const [connected, setConnected] = useState(false)
  const [playerId, setPlayerId] = useState<number | null>(null)
  const [question, setQuestion] = useState<string | null>(null)
  const [choices, setChoices] = useState<string[]>([])
  const [subject, setSubject] = useState<string>('math')
  const [lockedIn, setLockedIn] = useState(false)
  const [correctIndex, setCorrectIndex] = useState<number | null>(null)
  const connRef = useRef<DataConnection | null>(null)
  const peerRef = useRef<Peer | null>(null)

  const sendAnswer = useCallback((choiceIndex: number) => {
    if (connRef.current && !lockedIn) {
      connRef.current.send({ type: 'answer', choiceIndex })
      setLockedIn(true)
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
        } else if (data.type === 'result' && data.correctIndex !== undefined) {
          setCorrectIndex(data.correctIndex)
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

  return { connected, playerId, question, choices, subject, lockedIn, correctIndex, sendAnswer, connect }
}
