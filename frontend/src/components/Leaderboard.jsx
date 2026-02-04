export default function Leaderboard({ entries }) {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Rank</th>
            <th className="text-left p-2">Username</th>
            <th className="text-left p-2">Wins</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={entry.username} className="border-b">
              <td className="p-2">{index + 1}</td>
              <td className="p-2">{entry.username}</td>
              <td className="p-2">{entry.wins}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
