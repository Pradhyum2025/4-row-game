import { useState } from 'react'
import Cell from './Cell'
import PlayerStatus from './PlayerStatus'

const COLS = 7
const ROWS = 6

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

  const handleColumnClick = (col) => {
    if (canMakeMove) {
      onMove(col)
    }
  }

  return (
    <div className="flex flex-col items-center p-4">
      <PlayerStatus 
        status={status}
        canMakeMove={canMakeMove}
        isBotGame={isBotGame}
        player1={player1}
        player2={player2}
      />

      <div className="bg-gradient-to-b from-blue-600 to-blue-700 p-4 rounded-xl shadow-2xl">
        <div className="grid grid-cols-7 gap-2 bg-blue-800 p-2 rounded-lg">
          {Array.from({ length: ROWS }).map((_, row) =>
            Array.from({ length: COLS }).map((_, col) => {
              const cellValue = board && board[col] && board[col][ROWS - 1 - row] !== undefined 
                ? board[col][ROWS - 1 - row] 
                : 0
              const isEmpty = cellValue === 0
              
              return (
                <Cell 
                  key={`${col}-${row}`}
                  value={cellValue}
                  isEmpty={isEmpty}
                />
              )
            })
          )}
        </div>

        <div className="grid grid-cols-7 gap-2 mt-3">
          {Array.from({ length: COLS }).map((_, col) => {
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
