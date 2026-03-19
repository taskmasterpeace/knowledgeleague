import QRCode from 'react-qr-code'
import type { RemotePlayer } from '../../hooks/usePeerHost'

interface Props {
  joinUrl: string | null
  roomId: string | null
  remotePlayers: RemotePlayer[]
  onStartGame: () => void
  onBack: () => void
}

export function PhoneLobby({ joinUrl, roomId, remotePlayers, onStartGame, onBack }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 stars-bg screen-enter flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="font-pixel text-2xl text-white text-glow">PHONE CONTROLLERS</h1>

      {/* QR Code */}
      {joinUrl ? (
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-5 rounded-xl shadow-2xl pixel-card">
            <QRCode value={joinUrl} size={200} />
          </div>
          <p className="font-pixel text-[9px] text-white/60">Scan with your phone to join</p>
          <div className="pixel-card rounded-lg px-5 py-2.5 flex items-center gap-3">
            <span className="font-pixel text-[7px] text-white/40">Room:</span>
            <span className="font-pixel text-lg text-yellow-300 text-glow-gold tracking-widest">{roomId}</span>
          </div>
          <p className="font-pixel text-[7px] text-white/30 max-w-xs text-center">
            Make sure phones are on the same WiFi network
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-white/30 border-t-yellow-400 rounded-full animate-spin" />
          <p className="font-pixel text-[9px] text-white/50">Setting up room...</p>
        </div>
      )}

      {/* Connected players */}
      <div className="w-full max-w-md">
        <h2 className="font-pixel text-[8px] text-white/50 uppercase mb-2">
          Players ({remotePlayers.length})
        </h2>
        {remotePlayers.length === 0 ? (
          <div className="font-pixel text-[8px] text-white/30 text-center py-4 pixel-card rounded-lg">
            Waiting for players to scan...
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {remotePlayers.map(rp => (
              <div key={rp.connId} className="pixel-card rounded-lg flex items-center gap-3 px-4 py-2.5">
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
                <span className="font-pixel text-[10px] text-white">{rp.name}</span>
                <span className="font-pixel text-[7px] text-white/40 ml-auto">P{rp.playerId}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full max-w-sm">
        <button
          onClick={onBack}
          className="pixel-btn font-pixel flex-1 py-4 bg-white/10 hover:bg-white/20 text-white text-[9px] rounded-lg transition-colors"
        >
          BACK
        </button>
        <button
          onClick={onStartGame}
          disabled={remotePlayers.length === 0}
          className="pixel-btn font-pixel flex-1 py-4 bg-yellow-500 hover:bg-yellow-400 disabled:bg-white/10 disabled:text-white/30 text-gray-900 text-[9px] rounded-lg transition-colors"
        >
          START GAME
        </button>
      </div>
    </div>
  )
}
