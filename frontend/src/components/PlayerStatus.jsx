export default function PlayerStatus({ 
  status, 
  canMakeMove, 
  isBotGame, 
  player1, 
  player2 
}) {
  if (status !== 'active') return null

  return (
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
  )
}
