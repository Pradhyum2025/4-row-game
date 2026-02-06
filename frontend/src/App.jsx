import { useEffect, useState } from 'react'
import GameBoard from './components/GameBoard'
import Leaderboard from './components/Leaderboard'
import UsernameEntry from './components/UsernameEntry'
import { useWebSocket } from './hooks/useWebSocket'

// Backend URL from .env (Vite loads .env / .env.local)
// Vite environment variables are embedded at build/dev server startup time
const BACKEND_URL = 'http://3.108.10.182:5000' || import.meta.env.VITE_BACKEND_URL || 'http://3.108.10.182:5000'

// Debug: Log the environment variable (remove in production if needed)
if (import.meta.env.DEV) {
  console.log('🔧 Environment Config:', {
    VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
    BACKEND_URL: BACKEND_URL
  })
}

// Convert HTTP/HTTPS URL to WebSocket URL
const getWebSocketURL = (url) => {
  if (!url) return 'ws://3.108.10.182:5000/ws'
  if (url.startsWith('https://')) return url.replace('https://', 'wss://') + '/ws'
  if (url.startsWith('http://')) return url.replace('http://', 'ws://') + '/ws'
  return url + '/ws'
}

// Use explicit env vars if provided, otherwise derive from BACKEND_URL
const WS_URL = 'ws://3.108.10.182:5000/ws' || import.meta.env.VITE_WS_URL || getWebSocketURL(BACKEND_URL)
const API_URL = 'http://3.108.10.182:5000' || import.meta.env.VITE_API_URL || BACKEND_URL

// Debug: Log final URLs (remove in production if needed)
if (import.meta.env.DEV) {
  console.log('🌐 Connection URLs:', {
    BACKEND_URL,
    WS_URL,
    API_URL
  })
}

export default function App() {
  const [view, setView] = useState('username')
  const [username, setUsername] = useState('')
  const [gameState, setGameState] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [countdown, setCountdown] = useState(null) // Countdown timer for bot game

  const { lastMessage, sendMessage, readyState } = useWebSocket(WS_URL)

  useEffect(() => {
    if (lastMessage) {
      handleMessage(lastMessage)
    }
  }, [lastMessage, username])

  // Cleanup countdown on unmount
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
      case 'GAME_STARTED':
        const payload = typeof message.payload === 'string' ? JSON.parse(message.payload) : message.payload
        console.log('GAME_STARTED received:', payload)
        setCountdown(null) // Clear countdown when game starts
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
          playerColor: payload.player1 === username ? 1 : 2,
        })
        setView('game')
        break

      case 'GAME_STATE_UPDATE':
        const statePayload = typeof message.payload === 'string' ? JSON.parse(message.payload) : message.payload
        if (statePayload) {
          setCountdown(null) // Clear countdown when game state updates
          if (window.countdownInterval) {
            clearInterval(window.countdownInterval)
            window.countdownInterval = null
          }
          setGameState((prev) => ({
            ...prev,
            board: statePayload.board || prev?.board || [],
            currentTurn: statePayload.current_turn || prev?.currentTurn || 1,
            status: statePayload.status || prev?.status || 'active',
            winner: statePayload.winner || prev?.winner || '',
            isDraw: statePayload.is_draw || prev?.isDraw || false,
          }))
        }
        break

      case 'WAITING_FOR_OPPONENT':
        console.log('WAITING_FOR_OPPONENT received')
        // Initialize empty game state for waiting
        setGameState({
          gameId: '',
          board: Array(7).fill(null).map(() => Array(6).fill(0)),
          currentTurn: 1,
          status: 'waiting',
          winner: '',
          isDraw: false,
          player1: username,
          player2: '',
          isBotGame: true, // Will be bot game after 10 seconds
          playerColor: 1,
        })
        // Start 10-second countdown
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
        // Store interval ID for cleanup
        window.countdownInterval = countdownInterval
        setView('game')
        break

      case 'ERROR':
        alert(message.payload?.message || 'An error occurred')
        break
    }
  }

  const handleJoin = (user) => {
    console.log('handleJoin called with:', user)
    console.log('WebSocket readyState:', readyState, 'OPEN=', WebSocket.OPEN)
    setUsername(user)
    
    if (readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not open! ReadyState:', readyState)
      alert('WebSocket is not connected. Please wait a moment and try again.')
      return
    }
    
    const message = {
      type: 'JOIN_GAME',
      payload: { username: user },
    }
    console.log('Sending JOIN_GAME message:', message)
    sendMessage(message)
  }

  const handleMove = (column) => {
    sendMessage({
      type: 'MOVE',
      payload: { column },
    })
  }

  const loadLeaderboard = async () => {
    try {
      const res = await fetch(`${API_URL}/leaderboard`)
      const data = await res.json()
      setLeaderboard(data)
    } catch (err) {
      console.error('Failed to load leaderboard:', err)
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

  // Leaderboard view removed per user request
  // if (view === 'leaderboard') {
  //   return (
  //     <div>
  //       <button
  //         onClick={() => setView('game')}
  //         className="m-4 px-4 py-2 bg-gray-500 text-white rounded"
  //       >
  //         Back to Game
  //       </button>
  //       <Leaderboard entries={leaderboard} />
  //     </div>
  //   )
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with player info and connection status */}
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
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        gameState.isBotGame ? 'bg-yellow-500' : 'bg-yellow-500'
                      }`}>
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

      {/* Main game area */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Countdown timer */}
        {countdown !== null && gameState?.status === 'waiting' && (
          <div className="text-center mb-6">
            <div className="inline-block bg-white rounded-lg shadow-lg px-6 py-4">
              <p className="text-gray-600 mb-2">Waiting for opponent...</p>
              <div className="text-4xl font-bold text-blue-600">
                {countdown}s
              </div>
              <p className="text-sm text-gray-500 mt-2">Bot will join if no opponent found</p>
            </div>
          </div>
        )}

        {/* Game board */}
        {gameState ? (
          <GameBoard
            board={gameState.board || []}
            currentTurn={gameState.currentTurn}
            status={gameState.status}
            winner={gameState.winner}
            isDraw={gameState.isDraw}
            playerColor={gameState.playerColor}
            player1={gameState.player1}
            player2={gameState.player2}
            isBotGame={gameState.isBotGame}
            onMove={handleMove}
          />
        ) : (
          <div className="text-center p-8 bg-white rounded-lg shadow">
            <p className="text-gray-600">Waiting for game to start...</p>
          </div>
        )}

        {/* Game result overlay */}
        {gameState?.status === 'finished' && (
          <div className="mt-6 text-center">
            <div className="bg-white rounded-lg shadow-xl p-8 inline-block animate-fade-in">
              <div className="text-4xl mb-3">
                {gameState.isDraw ? (
                  <span className="text-gray-600">🤝</span>
                ) : gameState.winner === username ? (
                  <span className="text-green-600">🎉</span>
                ) : (
                  <span className="text-red-600">😔</span>
                )}
              </div>
              <div className="text-3xl font-bold mb-2">
                {gameState.isDraw ? (
                  <span className="text-gray-600">Draw!</span>
                ) : gameState.winner === username ? (
                  <span className="text-green-600">You Win!</span>
                ) : (
                  <span className="text-red-600">You Lost</span>
                )}
              </div>
              {!gameState.isDraw && gameState.winner && (
                <p className="text-gray-600 mb-6">
                  {gameState.winner === username ? (
                    <span>Congratulations! You won the game!</span>
                  ) : (
                    <span>Winner: <span className="font-semibold">{gameState.winner}</span></span>
                  )}
                </p>
              )}
              <button
                onClick={() => {
                  setView('username')
                  setGameState(null)
                  setCountdown(null)
                  if (window.countdownInterval) {
                    clearInterval(window.countdownInterval)
                    window.countdownInterval = null
                  }
                }}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
