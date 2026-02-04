import { useState } from 'react'

export default function GameBoard({
  board,
  currentTurn,
  status,
  winner,
  isDraw,
  playerColor,
  player1,
  player2,
  isBotGame,
  onMove,
}) {
  const [hoveredColumn, setHoveredColumn] = useState(null)

  const canMakeMove = status === 'active' && currentTurn === playerColor

  const getCellColor = (cell) => {
    if (cell === 1) return 'bg-red-500'
    if (cell === 2) return 'bg-yellow-500'
    return 'bg-gray-200'
  }

  const handleColumnClick = (col) => {
    if (canMakeMove) {
      onMove(col)
    }
  }

  return (
    <div className="flex flex-col items-center p-4">
      {/* Turn indicator */}
      {status === 'active' && (
        <div className="mb-6 bg-white rounded-lg shadow-md px-6 py-3">
          <div className="flex items-center gap-3">
            {canMakeMove ? (
              <>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-lg font-semibold text-gray-700">Your turn</p>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <p className="text-lg font-semibold text-gray-700">
                  {isBotGame ? "Bot's turn" : "Opponent's turn"}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-b from-blue-600 to-blue-700 p-4 rounded-xl shadow-2xl">
        {/* Game board */}
        <div className="grid grid-cols-7 gap-2 bg-blue-800 p-2 rounded-lg">
          {Array.from({ length: 6 }).map((_, row) =>
            Array.from({ length: 7 }).map((_, col) => {
              // Board is stored as [column][row], so we access board[col][row]
              // Display from top (row 0) to bottom (row 5)
              const cellValue = board && board[col] && board[col][5 - row] !== undefined ? board[col][5 - row] : 0
              const isEmpty = cellValue === 0
              return (
                <div
                  key={`${col}-${row}`}
                  className={`w-14 h-14 rounded-full transition-all duration-200 ${
                    isEmpty 
                      ? 'bg-gray-200 border-2 border-gray-300' 
                      : `${getCellColor(cellValue)} border-4 border-white shadow-lg transform scale-105`
                  }`}
                />
              )
            })
          )}
        </div>

        {/* Column buttons */}
        <div className="grid grid-cols-7 gap-2 mt-3">
          {Array.from({ length: 7 }).map((_, col) => {
            const isHovered = hoveredColumn === col
            return (
              <button
                key={col}
                onClick={() => handleColumnClick(col)}
                onMouseEnter={() => setHoveredColumn(col)}
                onMouseLeave={() => setHoveredColumn(null)}
                disabled={!canMakeMove}
                className={`h-10 rounded-lg font-bold text-white transition-all duration-200 ${
                  canMakeMove && isHovered
                    ? 'bg-blue-400 transform scale-110 shadow-lg'
                    : canMakeMove
                    ? 'bg-blue-500 hover:bg-blue-400 shadow-md'
                    : 'bg-gray-400 opacity-50 cursor-not-allowed'
                }`}
              >
                {canMakeMove && isHovered ? '⬇' : '↓'}
              </button>
            )
          })}
        </div>
      </div>

      {/* Player color legend */}
      {status === 'active' && (
        <div className="mt-6 flex items-center justify-center gap-6 bg-white rounded-lg shadow-md px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow"></div>
            <span className="text-sm font-medium text-gray-700">You (Red)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-yellow-500 border-2 border-white shadow"></div>
            <span className="text-sm font-medium text-gray-700">
              {isBotGame ? 'Bot (Yellow)' : 'Opponent (Yellow)'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
