// src/utils/api.js

import { API_BASE_URL } from './constants'
import { normalizeBoard } from './gameLogic'

const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws')

let aiMoveWs = null
let aiMovePromiseResolver = null
let aiSuggestWs = null
let aiSuggestPromiseResolver = null
let aiSuggestRequestQueue = []

const setupAiSuggestWebSocket = () => {
  if (aiSuggestWs && aiSuggestWs.readyState === WebSocket.OPEN) {
    return aiSuggestWs
  }

  aiSuggestWs = new WebSocket(`${WS_BASE_URL}/ai-suggest`)

  aiSuggestWs.onopen = () => {
    console.log('AI Suggestion WebSocket connected')
    // Send any queued requests
    while (aiSuggestRequestQueue.length > 0) {
      const { data, resolve } = aiSuggestRequestQueue.shift()
      try {
        aiSuggestWs.send(JSON.stringify(data))
        aiSuggestPromiseResolver = resolve
      } catch (e) {
        console.error('Error sending queued AI suggestion request:', e)
        resolve(null)
      }
    }
  }

  aiSuggestWs.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (aiSuggestPromiseResolver) {
        aiSuggestPromiseResolver(data)
        aiSuggestPromiseResolver = null
      }
    } catch (e) {
      console.error('Error parsing AI suggestion response:', e)
      if (aiSuggestPromiseResolver) {
        aiSuggestPromiseResolver(null)
        aiSuggestPromiseResolver = null
      }
    }
  }

  aiSuggestWs.onerror = (error) => {
    console.error('AI Suggestion WebSocket error:', error)
    if (aiSuggestPromiseResolver) {
      aiSuggestPromiseResolver(null)
      aiSuggestPromiseResolver = null
    }
    // Clear queue on error
    aiSuggestRequestQueue.forEach(({ resolve }) => resolve(null))
    aiSuggestRequestQueue = []
  }

  aiSuggestWs.onclose = () => {
    console.log('AI Suggestion WebSocket closed')
    aiSuggestWs = null
    if (aiSuggestPromiseResolver) {
      aiSuggestPromiseResolver(null)
      aiSuggestPromiseResolver = null
    }
    // Clear queue on close
    aiSuggestRequestQueue.forEach(({ resolve }) => resolve(null))
    aiSuggestRequestQueue = []
  }

  return aiSuggestWs
}

export const tetrisAPI = {
  async getSuggestion (gameState) {
    return new Promise((resolve) => {
      const data = {
        board: normalizeBoard(gameState.board),
        current_piece: {
          type: gameState.currentPiece.type,
          rotation: gameState.currentPiece.rotation,
          x: gameState.currentPiece.x,
          y: gameState.currentPiece.y
        },
        score: gameState.score,
        lines: gameState.lines,
        level: gameState.level
      }

      const ws = setupAiSuggestWebSocket()

      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(data))
          aiSuggestPromiseResolver = resolve
        } catch (e) {
          console.error('Error sending AI suggestion request:', e)
          resolve(null)
        }
      } else if (ws.readyState === WebSocket.CONNECTING) {
        // Queue the request if WebSocket is still connecting
        aiSuggestRequestQueue.push({ data, resolve })
      } else {
        // WebSocket is closed or in error state, setup new connection
        setupAiSuggestWebSocket()
        aiSuggestRequestQueue.push({ data, resolve })
      }

      // Add timeout to prevent hanging
      setTimeout(() => {
        if (aiSuggestPromiseResolver === resolve) {
          console.warn('AI suggestion request timed out')
          aiSuggestPromiseResolver = null
          resolve(null)
        }
      }, 5000) // 5 second timeout
    })
  },

  async getAIMove (gameState) {
    if (!aiMoveWs || aiMoveWs.readyState !== WebSocket.OPEN) {
      aiMoveWs = new WebSocket(`${WS_BASE_URL}/ai-move`)

      aiMoveWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (aiMovePromiseResolver) {
            aiMovePromiseResolver(data)
            aiMovePromiseResolver = null
          }
        } catch (e) {
          console.error('Error parsing AI move response:', e)
          if (aiMovePromiseResolver) {
            aiMovePromiseResolver(null)
            aiMovePromiseResolver = null
          }
        }
      }

      aiMoveWs.onerror = (error) => {
        console.error('AI Move WebSocket error:', error)
        if (aiMovePromiseResolver) {
          aiMovePromiseResolver(null)
          aiMovePromiseResolver = null
        }
      }

      aiMoveWs.onclose = () => {
        aiMoveWs = null
        if (aiMovePromiseResolver) {
          aiMovePromiseResolver(null)
          aiMovePromiseResolver = null
        }
      }
    }

    return new Promise((resolve) => {
      aiMovePromiseResolver = resolve
      const data = {
        board: normalizeBoard(gameState.board),
        current_piece: {
          type: gameState.currentPiece.type,
          rotation: gameState.currentPiece.rotation,
          x: gameState.currentPiece.x,
          y: gameState.currentPiece.y
        }
      }
      if (aiMoveWs.readyState === WebSocket.OPEN) {
        aiMoveWs.send(JSON.stringify(data))
      } else {
        // If not open yet, wait for open
        aiMoveWs.onopen = () => {
          aiMoveWs.send(JSON.stringify(data))
        }
      }
    })
  },

  closeAIMove () {
    if (aiMoveWs) {
      aiMoveWs.close()
      aiMoveWs = null
      aiMovePromiseResolver = null
    }
  },

  closeAISuggest () {
    if (aiSuggestWs) {
      aiSuggestWs.close()
      aiSuggestWs = null
      aiSuggestPromiseResolver = null
    }
    // Clear any queued requests
    aiSuggestRequestQueue.forEach(({ resolve }) => resolve(null))
    aiSuggestRequestQueue = []
  },

  getTrainingUrl (generations = 3, populationSize = 20) {
    return `${API_BASE_URL}/train?generations=${generations}&population_size=${populationSize}`
  }
}
