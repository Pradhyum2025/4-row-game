import { useEffect, useState } from 'react'
import GameBoard from '../components/GameBoard'

const COUNTDOWN_SECONDS = 10

export default function GamePage({ 
  gameState, 
  countdown, 
  username, 
  onMove, 
  onPlayAgain 
}) {
  const [localCountdown, setLocalCountdown] = useState(countdown)

  useEffect(() => {
    setLocalCountdown(countdown)
  }, [countdown])

  useEffect(() => {
    if (gameState?.status === 'waiting' && localCountdown !== null && localCountdown > 0) {
      const interval = setInterval(() => {
        setLocalCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return null
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [gameState?.status, localCountdown])

  if (!gameState) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow">
        <p className="text-gray-600">Waiting for game to start...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {localCountdown !== null && gameState.status === 'waiting' && (
        <div className="text-center mb-6">
          <div className="inline-block bg-white rounded-lg shadow-lg px-6 py-4">
            <p className="text-gray-600 mb-2">Waiting for opponent...</p>
            <div className="text-4xl font-bold text-blue-600">
              {localCountdown}s
            </div>
            <p className="text-sm text-gray-500 mt-2">Bot will join if no opponent found</p>
          </div>
        </div>
      )}

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
        onMove={onMove}
      />

      {gameState.status === 'finished' && (
        <div className="mt-6 text-center">
          <div className="bg-white rounded-lg shadow-xl p-8 inline-block">
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
              onClick={onPlayAgain}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
