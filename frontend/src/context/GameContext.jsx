import { createContext, useContext } from 'react'

const GameContext = createContext(null)

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within GameProvider')
  }
  return context
}

export default GameContext
