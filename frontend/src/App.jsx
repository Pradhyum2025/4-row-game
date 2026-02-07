import { useEffect, useRef, useState } from 'react'
import UsernameEntry from './components/UsernameEntry'
import GamePage from './pages/GamePage'
import { useWebSocket } from './hooks/useWebSocket'

const BACKEND_URL = "http://13.201.170.248:5000" || import.meta.env.VITE_BACKEND_URL || 'http://13.201.170.248:5000'

function getWebSocketURL(url) {
  if (!url) return 'ws://13.201.170.248:5000/ws'
  if (url.startsWith('https://')) return url.replace('https://', 'wss://') + '/ws'
  if (url.startsWith('http://')) return url.replace('http://', 'ws://') + '/ws'
  return url + '/ws'
}

const WS_URL = "ws://13.201.170.248:5000/ws" || import.meta.env.VITE_WS_URL || getWebSocketURL(BACKEND_URL)

export default function App() {
  const [view, setView] = useState('username')
  const [username, setUsername] = useState('')
  const [gameState, setGameState] = useState(null)
  const [countdown, setCountdown] = useState(null)

  const handleMessageRef = useRef(null)
  const { sendMessage, readyState } = useWebSocket(WS_URL, (msg) => handleMessageRef.current?.(msg))

  useEffect(() => {
    return () => {
      if (window.countdownInterval) {
        clearInterval(window.countdownInterval)
        window.countdownInterval = null
      }
    }
  }, [])

  const handleMessage = (message) => {
    switch (message.type) {
      case 'GAME_STARTED': {
        const payload = typeof message.payload === 'string' 
          ? JSON.parse(message.payload) 
          : message.payload
        
        // Clear waiting countdown immediately
        if (window.countdownInterval) {
          clearInterval(window.countdownInterval)
          window.countdownInterval = null
        }
        setCountdown(null)
        
        const playerColor = payload.player_symbol !== undefined
          ? payload.player_symbol
          : (payload.player1 === username ? 1 : 2)
        
        setGameState({
          gameId: payload.game_id,
          board: payload.board || [],
          currentTurn: payload.current_turn || 1,
          status: payload.status || 'active',
          winner: '',
          isDraw: false,
          player1: payload.player1,
          player2: payload.player2,
          isBotGame: payload.is_bot_game || false,
          playerColor,
        })
        setView('game')
        break
      }

      case 'GAME_STATE_UPDATE': {
        const statePayload = typeof message.payload === 'string' 
          ? JSON.parse(message.payload) 
          : message.payload
        
        if (statePayload) {
          setCountdown(null)
          if (window.countdownInterval) {
            clearInterval(window.countdownInterval)
            window.countdownInterval = null
          }

          // Merge full state from server - never compute turn locally
          const nextPlayerColor = statePayload.player1 && username
            ? (statePayload.player1 === username ? 1 : 2)
            : undefined
          setGameState((prev) => ({
            ...prev,
            gameId: statePayload.game_id || prev?.gameId,
            board: statePayload.board || prev?.board || [],
            currentTurn: statePayload.current_turn !== undefined
              ? statePayload.current_turn
              : prev?.currentTurn || 1,
            status: statePayload.status || prev?.status || 'active',
            winner: statePayload.winner !== undefined
              ? statePayload.winner
              : prev?.winner || '',
            isDraw: statePayload.is_draw !== undefined
              ? statePayload.is_draw
              : prev?.isDraw || false,
            player1: statePayload.player1 ?? prev?.player1,
            player2: statePayload.player2 ?? prev?.player2,
            isBotGame: statePayload.is_bot_game ?? prev?.isBotGame,
            playerColor: nextPlayerColor ?? prev?.playerColor ?? 1,
          }))
        }
        break
      }

      case 'WAITING_FOR_OPPONENT': {
        setGameState({
          gameId: '',
          board: Array(7).fill(null).map(() => Array(6).fill(0)),
          currentTurn: 1,
          status: 'waiting',
          winner: '',
          isDraw: false,
          player1: username,
          player2: '',
          isBotGame: true,
          playerColor: 1,
        })
        
        let timeLeft = 10
        setCountdown(timeLeft)
        const countdownInterval = setInterval(() => {
          timeLeft--
          if (timeLeft > 0) {
            setCountdown(timeLeft)
          } else {
            clearInterval(countdownInterval)
            setCountdown(null)
          }
        }, 1000)
        window.countdownInterval = countdownInterval
        setView('game')
        break
      }

      case 'ERROR':
        alert(message.payload?.message || 'An error occurred')
        break
    }
  }
  handleMessageRef.current = handleMessage

  const handleJoin = (user) => {
    setUsername(user)
    
    if (readyState !== WebSocket.OPEN) {
      alert('WebSocket is not connected. Please wait a moment and try again.')
      return
    }
    
    sendMessage({
      type: 'JOIN_GAME',
      payload: { username: user },
    })
  }

  const handleMove = (column) => {
    sendMessage({
      type: 'MOVE',
      payload: { column },
    })
  }

  const handlePlayAgain = () => {
    setView('username')
    setGameState(null)
    setCountdown(null)
    if (window.countdownInterval) {
      clearInterval(window.countdownInterval)
      window.countdownInterval = null
    }
  }

  if (view === 'username') {
    return (
      <div>
        <UsernameEntry onJoin={handleJoin} />
        <div className="fixed bottom-4 right-4 text-sm">
          <div className={`px-3 py-2 rounded shadow ${
            readyState === WebSocket.OPEN ? 'bg-green-100 text-green-800' : 
            readyState === WebSocket.CONNECTING ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'
          }`}>
            {readyState === WebSocket.OPEN ? '✅ Connected' : 
             readyState === WebSocket.CONNECTING ? '🔄 Connecting...' : 
             '❌ Disconnected'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {gameState && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm">
                    {gameState.player1 ? gameState.player1.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="font-semibold text-gray-700">{gameState.player1 || 'You'}</span>
                </div>
                {gameState.player2 && (
                  <>
                    <span className="text-gray-400">vs</span>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-sm">
                        {gameState.isBotGame ? '🤖' : gameState.player2.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-700">{gameState.player2}</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            readyState === WebSocket.OPEN ? 'bg-green-100 text-green-700' : 
            readyState === WebSocket.CONNECTING ? 'bg-yellow-100 text-yellow-700' : 
            'bg-red-100 text-red-700'
          }`}>
            {readyState === WebSocket.OPEN ? '🟢 Connected' : 
             readyState === WebSocket.CONNECTING ? '🟡 Connecting...' : 
             '🔴 Disconnected'}
          </div>
        </div>
      </div>

      <GamePage
        gameState={gameState}
        countdown={countdown}
        username={username}
        onMove={handleMove}
        onPlayAgain={handlePlayAgain}
      />
    </div>
  )
}
