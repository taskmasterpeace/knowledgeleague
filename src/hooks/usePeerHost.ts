import { useEffect, useRef, useState, useCallback } from 'react'
import Peer from 'peerjs'
import type { DataConnection } from 'peerjs'

export interface RemotePlayer {
  connId: string
  name: string
  playerId: number
}

interface PeerMessage {
  type: 'join' | 'answer'
  name?: string
  choiceIndex?: number
}

interface UsePeerHostProps {
  enabled: boolean
  onRemoteAnswer: (playerId: number, choiceIndex: number) => void
}

export function usePeerHost({ enabled, onRemoteAnswer }: UsePeerHostProps) {
  const [roomId, setRoomId] = useState<string | null>(null)
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayer[]>([])
  const [joinUrl, setJoinUrl] = useState<string | null>(null)
  const peerRef = useRef<Peer | null>(null)
  const connsRef = useRef<Map<string, DataConnection>>(new Map())
  const onRemoteAnswerRef = useRef(onRemoteAnswer)
  const remotePlayersRef = useRef<RemotePlayer[]>([])
  onRemoteAnswerRef.current = onRemoteAnswer
  remotePlayersRef.current = remotePlayers

  const currentChoicesRef = useRef<string[]>([])
  const currentQuestionRef = useRef<string>('')
  const currentSubjectRef = useRef<string>('')

  const broadcastProblem = useCallback((question: string, choices: string[], subject: string) => {
    currentChoicesRef.current = choices
    currentQuestionRef.current = question
    currentSubjectRef.current = subject
    for (const conn of connsRef.current.values()) {
      conn.send({ type: 'problem', question, choices, subject })
    }
  }, [])

  const broadcastResult = useCallback((correctIndex: number) => {
    for (const conn of connsRef.current.values()) {
      conn.send({ type: 'result', correctIndex })
    }
  }, [])

  const broadcastLockIn = useCallback((playerId: number) => {
    for (const conn of connsRef.current.values()) {
      conn.send({ type: 'lockedIn', playerId })
    }
  }, [])

  const broadcastGameOver = useCallback((winnerName: string, rankings: { name: string; score: number; position: number }[]) => {
    for (const conn of connsRef.current.values()) {
      conn.send({ type: 'gameOver', winnerName, rankings })
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    if (peerRef.current) return

    const id = Math.random().toString(36).substring(2, 8)
    const peer = new Peer(`braingames-${id}`)
    peerRef.current = peer

    peer.on('open', () => {
      setRoomId(id)
      const host = window.location.hostname || 'localhost'
      const port = window.location.port || '5173'
      setJoinUrl(`http://${host}:${port}/join/${id}`)
    })

    peer.on('connection', (conn) => {
      conn.on('open', () => {
        connsRef.current.set(conn.connectionId, conn)
        if (currentChoicesRef.current.length > 0) {
          conn.send({
            type: 'problem',
            question: currentQuestionRef.current,
            choices: currentChoicesRef.current,
            subject: currentSubjectRef.current,
          })
        }
      })

      conn.on('data', (raw) => {
        const data = raw as PeerMessage
        if (data.type === 'join' && data.name) {
          setRemotePlayers(prev => {
            if (prev.find(p => p.connId === conn.connectionId)) return prev
            const usedIds = new Set(prev.map(p => p.playerId))
            let playerId = 2
            while (usedIds.has(playerId)) playerId++

            const rp: RemotePlayer = { connId: conn.connectionId, name: data.name!, playerId }
            conn.send({ type: 'assigned', playerId, name: data.name })
            return [...prev, rp]
          })
        } else if (data.type === 'answer' && data.choiceIndex !== undefined) {
          const rp = remotePlayersRef.current.find(p => p.connId === conn.connectionId)
          if (rp) {
            onRemoteAnswerRef.current(rp.playerId, data.choiceIndex)
          }
        }
      })

      conn.on('close', () => {
        connsRef.current.delete(conn.connectionId)
        setRemotePlayers(prev => prev.filter(p => p.connId !== conn.connectionId))
      })
    })

    return () => {
      for (const conn of connsRef.current.values()) conn.close()
      connsRef.current.clear()
      peer.destroy()
      peerRef.current = null
      setRoomId(null)
      setJoinUrl(null)
      setRemotePlayers([])
    }
  }, [enabled])

  return { roomId, joinUrl, remotePlayers, broadcastProblem, broadcastResult, broadcastLockIn, broadcastGameOver }
}
