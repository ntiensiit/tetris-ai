// fe/src/services/api.js
/**
 * API client for Tetris AI backend
 */

const API_BASE_URL = 'http://localhost:8000';

class TetrisAPI {
  /**
   * Get AI suggestion for current board state
   * @param {Object} gameState - Current game state
   * @returns {Promise<Object>} AI suggestions
   */
  async getSuggestion(gameState) {
    try {
      const response = await fetch(`${API_BASE_URL}/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board: gameState.board,
          current_piece: {
            type: gameState.currentPiece.type,
            rotation: gameState.currentPiece.rotation,
            x: gameState.currentPiece.x,
            y: gameState.currentPiece.y
          },
          next_piece_type: gameState.nextPiece,
          score: gameState.score,
          lines: gameState.lines,
          level: gameState.level
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get suggestion:', error);
      throw error;
    }
  }

  /**
   * Get best AI move (for auto-play mode)
   * @param {Object} gameState - Current game state
   * @returns {Promise<Object>} Best move
   */
  async getAIMove(gameState) {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board: gameState.board,
          current_piece: {
            type: gameState.currentPiece.type,
            rotation: gameState.currentPiece.rotation,
            x: gameState.currentPiece.x,
            y: gameState.currentPiece.y
          },
          next_piece_type: gameState.nextPiece,
          score: gameState.score,
          lines: gameState.lines,
          level: gameState.level
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get AI move:', error);
      throw error;
    }
  }

  /**
   * Start new game session
   * @returns {Promise<Object>} New game state
   */
  async newGame() {
    try {
      const response = await fetch(`${API_BASE_URL}/new-game`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to create new game:', error);
      throw error;
    }
  }

  /**
   * Train new AI weights
   * @param {number} generations - Number of training generations
   * @param {number} populationSize - Population size
   * @returns {Promise<Object>} Training results
   */
  async trainAI(generations = 30, populationSize = 40) {
    try {
      const response = await fetch(`${API_BASE_URL}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generations,
          population_size: populationSize
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to train AI:', error);
      throw error;
    }
  }

  /**
   * Check API health
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'unhealthy', error: error.message };
    }
  }
}

export default new TetrisAPI();