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
    <div className="min-h-screen bg-[#0a0818] screen-enter flex flex-col items-center justify-center gap-6 p-6 relative overflow-hidden">
      {/* CRT scanline overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-50"
        style={{
          background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)`,
          mixBlendMode: 'multiply',
        }}
      />

      {/* Top decorative line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />

      {/* Floating sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-300/30"
            style={{
              left: `${15 + (i * 14)}%`,
              top: `${10 + ((i * 23) % 80)}%`,
              animation: `sparkle-lobby ${2.5 + (i * 0.3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <h1
        className="font-pixel text-lg text-yellow-300 relative z-10"
        style={{ textShadow: '0 0 15px rgba(250,204,21,0.4), 0 2px 0 rgba(0,0,0,0.8)' }}
      >
        PHONE CONTROLLERS
      </h1>

      {/* QR Code */}
      {joinUrl ? (
        <div className="flex flex-col items-center gap-4 relative z-10">
          {/* QR in a pixel frame */}
          <div
            className="relative p-1"
            style={{
              border: '3px solid #facc15',
              boxShadow: '0 0 20px rgba(250,204,21,0.15), inset 0 0 0 1px rgba(0,0,0,0.3)',
              background: '#fff',
            }}
          >
            {/* Corner dots */}
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-400" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-400" />
            <QRCode value={joinUrl} size={180} />
          </div>

          <p className="font-pixel-body font-semibold text-base text-white/40">Scan with your phone to join</p>

          {/* Room code display */}
          <div
            className="px-5 py-2.5 flex items-center gap-3"
            style={{
              border: '3px solid rgba(34,211,238,0.3)',
              background: 'linear-gradient(180deg, rgba(20,16,40,0.95), rgba(12,10,30,0.98))',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <span className="font-pixel-body font-semibold text-sm text-white/30">Room:</span>
            <span
              className="font-pixel text-lg text-cyan-300 tracking-widest"
              style={{ textShadow: '0 0 10px rgba(34,211,238,0.4)' }}
            >
              {roomId}
            </span>
          </div>

          {joinUrl?.includes('localhost') ? (
            <p className="font-pixel-body font-semibold text-sm text-red-400 max-w-xs text-center">
              You're on localhost — phones can't connect! Open the game using your network IP (shown in terminal) instead
            </p>
          ) : (
            <p className="font-pixel-body font-semibold text-sm text-white/20 max-w-xs text-center">
              Make sure phones are on the same WiFi network
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 relative z-10">
          <img
            src="/pixelart/ui/gamepad.png"
            alt=""
            width={80}
            height={80}
            style={{ imageRendering: 'pixelated', animation: 'spin-pad 2s linear infinite' }}
          />
          <p className="font-pixel-body font-semibold text-base text-white/40">Setting up room...</p>
        </div>
      )}

      {/* Connected players */}
      <div className="w-full max-w-md relative z-10">
        <h2 className="font-pixel text-[9px] text-white/40 uppercase mb-2 tracking-wider">
          Players ({remotePlayers.length})
        </h2>
        {remotePlayers.length === 0 ? (
          <div
            className="font-pixel-body font-semibold text-base text-white/20 text-center py-4"
            style={{
              border: '3px solid rgba(100,100,180,0.2)',
              background: 'linear-gradient(180deg, rgba(20,16,40,0.6), rgba(12,10,30,0.8))',
            }}
          >
            Waiting for players to scan...
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {remotePlayers.map(rp => (
              <div
                key={rp.connId}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  border: '3px solid rgba(74,222,128,0.3)',
                  background: 'linear-gradient(180deg, rgba(20,16,40,0.95), rgba(12,10,30,0.98))',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 0 12px rgba(74,222,128,0.1)',
                }}
              >
                <div
                  className="w-3 h-3 bg-green-400"
                  style={{
                    boxShadow: '0 0 8px rgba(74,222,128,0.6)',
                    animation: 'player-blink 2s ease-in-out infinite',
                  }}
                />
                <span className="font-pixel-body font-bold text-lg text-white">{rp.name}</span>
                <span className="font-pixel text-[8px] text-cyan-300/40 ml-auto">P{rp.playerId}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full max-w-sm relative z-10">
        <button
          onClick={onBack}
          className="font-pixel flex-1 py-4 text-sm text-white transition-all active:translate-y-1"
          style={{
            background: 'linear-gradient(180deg, rgba(40,36,60,0.9), rgba(25,22,45,0.95))',
            border: '3px solid rgba(100,100,180,0.4)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 3px 0 rgba(0,0,0,0.4)',
          }}
        >
          BACK
        </button>
        <button
          onClick={onStartGame}
          disabled={remotePlayers.length === 0}
          className="font-pixel flex-1 py-4 text-sm transition-all active:translate-y-1 disabled:opacity-30 disabled:translate-y-0"
          style={{
            background: remotePlayers.length > 0
              ? 'linear-gradient(180deg, #facc15, #eab308)'
              : 'rgba(40,36,60,0.5)',
            color: remotePlayers.length > 0 ? '#1a1a2e' : 'rgba(255,255,255,0.3)',
            border: `3px solid ${remotePlayers.length > 0 ? '#fde68a' : 'rgba(100,100,180,0.2)'}`,
            boxShadow: remotePlayers.length > 0
              ? 'inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 0 #a16207, 0 6px 12px rgba(0,0,0,0.3)'
              : 'none',
          }}
        >
          START GAME
        </button>
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />

      <style>{`
        @keyframes sparkle-lobby {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
          50% { transform: translateY(-10px) scale(1.5); opacity: 0.7; }
        }
        @keyframes spin-pad {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes player-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
