export default function Cell({ value, isEmpty }) {
  const getColor = () => {
    if (value === 1) return 'bg-red-500'
    if (value === 2) return 'bg-yellow-500'
    return 'bg-gray-200'
  }

  return (
    <div
      className={`w-14 h-14 rounded-full transition-all duration-200 ${
        isEmpty 
          ? 'bg-gray-200 border-2 border-gray-300' 
          : `${getColor()} border-4 border-white shadow-lg`
      }`}
    />
  )
}
