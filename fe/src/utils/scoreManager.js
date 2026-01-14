const HIGH_SCORES_KEY = 'tetrisHighScores'

const getHighScores = () => {
  try {
    const scoresJSON = localStorage.getItem(HIGH_SCORES_KEY)
    if (!scoresJSON) {
      return {
        manual: [],
        ai_assist: [],
        ai_auto: [],
      }
    }
    return JSON.parse(scoresJSON)
  } catch (error) {
    console.error('Error reading high scores from localStorage', error)
    return {
      manual: [],
      ai_assist: [],
      ai_auto: [],
    }
  }
}

const saveScore = (score, mode) => {
  if (!['manual', 'ai_assist', 'ai_auto'].includes(mode)) {
    console.error('Invalid game mode for saving score:', mode)
    return
  }

  try {
    const scores = getHighScores()
    const modeScores = scores[mode] || []

    modeScores.push({ score, date: new Date().toISOString() })

    // Sort scores in descending order
    modeScores.sort((a, b) => b.score - a.score)

    // Keep only the top 5
    scores[mode] = modeScores.slice(0, 5)

    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores))
    window.dispatchEvent(new Event('highScoresUpdated'))
  } catch (error) {
    console.error('Error saving high score to localStorage', error)
  }
}

export { getHighScores, saveScore }
