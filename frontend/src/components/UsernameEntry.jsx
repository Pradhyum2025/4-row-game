import { useState } from 'react'

export default function UsernameEntry({ onJoin }) {
  const [username, setUsername] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (username.trim()) {
      onJoin(username.trim())
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            4 in a Row
          </h1>
          <p className="text-gray-600">Connect four discs to win!</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="border-2 border-gray-300 p-3 rounded-lg mb-4 w-full focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            autoFocus
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg w-full font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Join Game
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Wait 10 seconds for a bot opponent, or play with a friend!</p>
        </div>
      </div>
    </div>
  )
}
