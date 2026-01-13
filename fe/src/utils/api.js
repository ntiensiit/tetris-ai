// src/utils/api.js

import { API_BASE_URL } from './constants';
import { normalizeBoard } from './gameLogic';

export const tetrisAPI = {
  async getSuggestion(gameState) {
    try {
      const response = await fetch(`${API_BASE_URL}/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board: normalizeBoard(gameState.board),
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
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  },

  async getAIMove(gameState) {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board: normalizeBoard(gameState.board),
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
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  },

  async trainAI(generations = 3, populationSize = 20) {
    try {
      const response = await fetch(`${API_BASE_URL}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generations,
          population_size: populationSize
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Training Error:', error);
      return null;
    }
  }
};