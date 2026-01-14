import React, { useState, useEffect } from 'react'
import { getHighScores } from '../../utils/scoreManager'

const HighScorePanel = ({ mode }) => {
  const [highScores, setHighScores] = useState([])

  useEffect(() => {
    const scores = getHighScores()
    setHighScores(scores[mode] || [])
  }, [mode])

  useEffect(() => {
    const handleUpdate = () => {
      const scores = getHighScores()
      setHighScores(scores[mode] || [])
    }
    window.addEventListener('highScoresUpdated', handleUpdate)
    return () => window.removeEventListener('highScoresUpdated', handleUpdate)
  }, [mode])

  const getRankDisplay = (index) => {
    const rank = index + 1
    if (rank === 1) return '1st'
    if (rank === 2) return '2nd'
    if (rank === 3) return '3rd'
    if (rank > 3) return `${rank}th`
    return rank
  }

  if (highScores.length === 0) return null

  return (
    <div className="w-full max-w-3xl mt-6">
      <div className="bg-black border border-gray-600 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4 text-white text-center">High Scores</h2>
        {highScores.map((entry, index) => (
          <div key={index} className={`flex justify-between items-center text-white py-2 px-3 rounded mb-2 ${index % 2 === 0 ? 'bg-gray-700/50' : 'bg-gray-600/50'} hover:bg-gray-500/50 transition-colors`}>
            <span className="font-semibold">{getRankDisplay(index)}</span>
            <span className="font-mono">{entry.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HighScorePanel
