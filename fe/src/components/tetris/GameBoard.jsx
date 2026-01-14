import React from 'react'
import HighScorePanel from './HighScorePanel'
import { BOARD_WIDTH, BOARD_HEIGHT, BLOCK_SIZE, TETROMINOS } from '../../utils/constants'
import { isValidPosition } from '../../utils/gameLogic'

const GameBoard = ({ board, currentPiece, aiSuggestion, showSuggestion, mode, gameOver, isPaused, onBackToMenu }) => {
  const getGhostPiece = () => {
    if (!currentPiece || mode === 'auto') return null

    let ghostY = currentPiece.y
    while (isValidPosition(board, currentPiece, currentPiece.x, ghostY + 1)) {
      ghostY++
    }

    return { ...currentPiece, y: ghostY }
  }

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row])
    const ghost = getGhostPiece()

    // Ghost piece
    if (ghost && mode !== 'auto') {
      for (let r = 0; r < ghost.shape.length; r++) {
        for (let c = 0; c < ghost.shape[0].length; c++) {
          if (ghost.shape[r][c]) {
            const y = ghost.y + r
            const x = ghost.x + c
            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH && !displayBoard[y][x]) {
              displayBoard[y][x] = 'ghost'
            }
          }
        }
      }
    }

    // AI suggestion
    if (mode === 'assisted' && aiSuggestion && showSuggestion && currentPiece && aiSuggestion.best_move) {
      const bestMove = aiSuggestion.best_move
      if (bestMove && bestMove.rotation !== undefined && bestMove.column !== undefined) {
        const shapes = TETROMINOS[currentPiece.type].shapes
        const suggestedShape = shapes[bestMove.rotation]

        if (suggestedShape) {
          for (let r = 0; r < suggestedShape.length; r++) {
            for (let c = 0; c < suggestedShape[0].length; c++) {
              if (suggestedShape[r][c]) {
                const y = bestMove.final_y + r
                const x = bestMove.column + c
                if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH && !displayBoard[y][x]) {
                  displayBoard[y][x] = 'suggestion'
                }
              }
            }
          }
        }
      }
    }

    // Current piece
    if (currentPiece) {
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[0].length; c++) {
          if (currentPiece.shape[r][c]) {
            const y = currentPiece.y + r
            const x = currentPiece.x + c
            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
              displayBoard[y][x] = currentPiece.color
            }
          }
        }
      }
    }

    return displayBoard
  }

  const displayBoard = renderBoard()

  return (
    <div className="relative">
      <div className="inline-block bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 p-3 rounded-2xl shadow-2xl border-2 border-blue-500/30">
        {displayBoard.map((row, y) => (
          <div key={y} className="flex">
            {row.map((cell, x) => (
              <div
                key={x}
                className={`border transition-all ${cell === 'ghost'
                    ? 'border-blue-400/40'
                    : cell === 'suggestion'
                      ? 'border-green-400/60'
                      : 'border-gray-800/50'
                  }`}
                style={{
                  width: BLOCK_SIZE,
                  height: BLOCK_SIZE,
                  backgroundColor:
                    cell === 'ghost'
                      ? 'rgba(100, 150, 255, 0.15)'
                      : cell === 'suggestion'
                        ? 'rgba(100, 255, 100, 0.25)'
                        : cell || '#0a0a0a',
                  boxShadow: cell && cell !== 'ghost' && cell !== 'suggestion'
                    ? `inset 0 0 8px rgba(255,255,255,0.2), 0 0 4px ${cell}40`
                    : cell === 'suggestion'
                      ? '0 0 10px rgba(100, 255, 100, 0.5)'
                      : 'none'
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {(gameOver || isPaused) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl">
          <div className="text-center p-6 bg-gray-900/90 rounded-xl border-2 border-red-500/50 max-w-4xl">
            {gameOver ? (
              <>
                <p className="text-2xl font-bold mb-4 text-white">🎮 GAME OVER 🎮</p>
                <HighScorePanel mode={mode === 'assisted' ? 'ai_assist' : mode === 'auto' ? 'ai_auto' : mode} />
                <button
                  onClick={onBackToMenu}
                  className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-bold transition-all transform hover:scale-105"
                >
                  Back to Menu
                </button>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold mb-4 text-white">⏸️ PAUSED</p>
                <button
                  onClick={onBackToMenu}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-bold transition-all transform hover:scale-105"
                >
                  Back to Menu
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default GameBoard