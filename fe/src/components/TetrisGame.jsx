// src/components/TetrisGame.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react'
import GameBoard from './tetris/GameBoard'
import ScorePanel from './tetris/ScorePanel'
import AISuggestionPanel from './tetris/AISuggestionPanel'
import NextPiecePanel from './tetris/NextPiecePanel'
import ControlButtons from './tetris/ControlButtons'
import KeyboardControls from './tetris/KeyboardControls'
import MainMenu from './tetris/MainMenu'
import { TETROMINOS } from '../utils/constants'
import {
  createBoard,
  createPiece,
  isValidPosition,
  lockPiece,
  clearLines,
  rotatePiece,
  getRandomPieceType
} from '../utils/gameLogic'
import { tetrisAPI } from '../utils/api'
import { saveScore } from '../utils/scoreManager'

const TetrisGame = () => {
  const [mode, setMode] = useState('menu')
  const [difficulty, setDifficulty] = useState(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [board, setBoard] = useState(createBoard())
  const [currentPiece, setCurrentPiece] = useState(null)
  const [nextPiece, setNextPiece] = useState(null)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [highScore, setHighScore] = useState(0)

  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [showSuggestion, setShowSuggestion] = useState(true)
  const [suggestionLoading, setSuggestionLoading] = useState(false)

  const [showTraining, setShowTraining] = useState(false)
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(null)

  const gameLoopRef = useRef(null)
  const lastMoveTimeRef = useRef(Date.now())
  const dropSpeedRef = useRef(500)

  const dropSpeeds = {
    easy: 700,
    medium: 400,
    hard: 200,
  }

  const spawnPiece = useCallback(() => {
    const type = nextPiece || getRandomPieceType()
    const piece = createPiece(type)
    const newNextPiece = getRandomPieceType()

    if (!isValidPosition(board, piece, piece.x, piece.y)) {
      setGameOver(true)
      return
    }

    setCurrentPiece(piece)
    setNextPiece(newNextPiece)
    setAiSuggestion(null)
  }, [board, nextPiece])

  const lockPieceDirectly = useCallback((pieceToLock) => {
    const newBoard = lockPiece(board, pieceToLock)
    const result = clearLines(newBoard)

    setBoard(result.board)
    setLines(prev => prev + result.linesCleared)

    const points = [0, 100, 300, 500, 800]
    setScore(prev => prev + points[result.linesCleared] * level)

    setTimeout(() => spawnPiece(), 0)
  }, [board, level, spawnPiece])

  useEffect(() => {
    if (!difficulty) return
    const baseSpeed = dropSpeeds[difficulty]
    dropSpeedRef.current = Math.max(100, baseSpeed - (level - 1) * 50)
  }, [level, difficulty])

  useEffect(() => {
    const newLevel = Math.floor(lines / 10) + 1
    setLevel(newLevel)
  }, [lines])

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
    }
  }, [score, highScore])

  // Save high score on game over
  useEffect(() => {
    if (gameOver && score > 0) {
      const scoreMode = mode === 'assisted' ? 'ai_assist' : mode === 'auto' ? 'ai_auto' : 'manual'
      saveScore(score, scoreMode)
    }
  }, [gameOver, score, mode])

  const startGame = (gameMode, difficulty = null) => {
    const newBoard = createBoard()

    setMode(gameMode)
    setBoard(newBoard)
    setScore(0)
    setLines(0)
    setLevel(1)
    setGameOver(false)
    setIsPaused(false)
    setAiSuggestion(null)
    setCurrentPiece(null)

    const selectedDifficulty = gameMode === 'auto' ? 'hard' : difficulty

    if (selectedDifficulty) {
      setDifficulty(selectedDifficulty)
      setGameStarted(true)

      const type = getRandomPieceType()
      const piece = createPiece(type)
      const nextPiece = getRandomPieceType()

      if (!isValidPosition(newBoard, piece, piece.x, piece.y)) {
        setGameOver(true)
        return
      }

      setCurrentPiece(piece)
      setNextPiece(nextPiece)
    } else {
      setGameStarted(false)
      setDifficulty(null)
      setNextPiece(getRandomPieceType())
    }
  }

  const lockCurrentPiece = useCallback(() => {
    if (!currentPiece) return

    const newBoard = lockPiece(board, currentPiece)
    const result = clearLines(newBoard)

    setBoard(result.board)
    setLines(prev => prev + result.linesCleared)

    const points = [0, 100, 300, 500, 800]
    setScore(prev => prev + points[result.linesCleared] * level)

    setTimeout(() => spawnPiece(), 0)
  }, [board, currentPiece, spawnPiece, level])

  const movePiece = useCallback((dx, dy) => {
    if (!currentPiece || gameOver || isPaused || !gameStarted) return false

    const newX = currentPiece.x + dx
    const newY = currentPiece.y + dy

    if (isValidPosition(board, currentPiece, newX, newY)) {
      setCurrentPiece(prev => ({ ...prev, x: newX, y: newY }))
      return true
    }

    if (dy > 0) {
      lockCurrentPiece()
    }

    return false
  }, [currentPiece, board, gameOver, isPaused, lockCurrentPiece, gameStarted])

  const rotate = useCallback(() => {
    if (!currentPiece || gameOver || isPaused || !gameStarted) return

    const rotated = rotatePiece(currentPiece)
    if (isValidPosition(board, rotated, rotated.x, rotated.y)) {
      setCurrentPiece(rotated)
    } else {
      const kicks = [[1, 0], [-1, 0], [0, -1]]
      for (const [dx, dy] of kicks) {
        if (isValidPosition(board, rotated, rotated.x + dx, rotated.y + dy)) {
          setCurrentPiece({ ...rotated, x: rotated.x + dx, y: rotated.y + dy })
          return
        }
      }
    }
  }, [currentPiece, board, gameOver, isPaused, gameStarted])

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused || !gameStarted) return

    let newY = currentPiece.y
    while (isValidPosition(board, currentPiece, currentPiece.x, newY + 1)) {
      newY++
    }

    setCurrentPiece(prev => ({ ...prev, y: newY }))
    setTimeout(() => lockCurrentPiece(), 50)
  }, [currentPiece, board, gameOver, isPaused, lockCurrentPiece, gameStarted])

  // AI Suggestion Effect
  useEffect(() => {
    if (mode === 'assisted' && currentPiece && !gameOver && !isPaused && showSuggestion && gameStarted) {
      setSuggestionLoading(true)

      const gameState = { board, currentPiece, nextPiece, score, lines, level }

      tetrisAPI.getSuggestion(gameState)
        .then(data => {
          if (data && data.best_move) {
            setAiSuggestion(data)
          }
          setSuggestionLoading(false)
        })
        .catch((error) => {
          console.error('Suggestion error:', error)
          setSuggestionLoading(false)
        })
    }
  }, [mode, currentPiece?.type, currentPiece?.rotation, board, gameOver, isPaused, showSuggestion, nextPiece, score, lines, level, gameStarted])

  // Manage AI WebSocket Connections
  useEffect(() => {
    const shouldConnect = gameStarted && !gameOver && !isPaused

    if (mode === 'auto' && shouldConnect) {
      // Auto mode: only AI move connection
      return () => {
        tetrisAPI.closeAIMove()
        tetrisAPI.closeAISuggest()
      }
    } else if (mode === 'assisted' && shouldConnect) {
      // Assisted mode: only AI suggestion connection
      return () => {
        tetrisAPI.closeAIMove()
        tetrisAPI.closeAISuggest()
      }
    } else {
      // Close all WebSocket connections when not active, game over, or paused
      tetrisAPI.closeAIMove()
      tetrisAPI.closeAISuggest()
    }
  }, [mode, gameStarted, gameOver, isPaused])

  // AI Auto Play Effect
  useEffect(() => {
    if (mode !== 'auto' || !currentPiece || gameOver || isPaused || !gameStarted) return

    const timer = setTimeout(async () => {
      const gameState = { board, currentPiece, nextPiece, score, lines, level }
      const aiMove = await tetrisAPI.getAIMove(gameState)
      if (!aiMove) return

      const shapes = TETROMINOS[currentPiece.type].shapes
      let piece = {
        ...currentPiece,
        rotation: aiMove.rotation,
        shape: shapes[aiMove.rotation],
        x: aiMove.column
      }

      if (!isValidPosition(board, piece, piece.x, piece.y)) {
        lockPieceDirectly(currentPiece)
        return
      }

      let y = piece.y
      while (isValidPosition(board, piece, piece.x, y + 1)) y++
      piece.y = y

      setCurrentPiece(piece)

      setTimeout(() => {
        lockPieceDirectly(piece)
      }, 0)

    }, 120)

    return () => clearTimeout(timer)
  }, [mode, currentPiece, board, gameOver, isPaused, nextPiece, score, lines, level, lockPieceDirectly, gameStarted])

  // Keyboard Controls Effect
  useEffect(() => {
    if ((mode !== 'manual' && mode !== 'assisted') || !gameStarted) return

    const handleKeyDown = (e) => {
      if (gameOver) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          movePiece(-1, 0)
          break
        case 'ArrowRight':
          e.preventDefault()
          movePiece(1, 0)
          break
        case 'ArrowDown':
          e.preventDefault()
          movePiece(0, 1)
          break
        case 'ArrowUp':
          e.preventDefault()
          rotate()
          break
        case ' ':
          e.preventDefault()
          hardDrop()
          break
        case 'p':
        case 'P':
          e.preventDefault()
          setIsPaused(prev => !prev)
          break
        case 'h':
        case 'H':
          if (mode === 'assisted') {
            e.preventDefault()
            setShowSuggestion(prev => !prev)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, gameOver, movePiece, rotate, hardDrop, gameStarted])

  // Game Loop Effect
  useEffect(() => {
    if ((mode === 'manual' || mode === 'assisted') && !gameOver && !isPaused && gameStarted) {
      gameLoopRef.current = setInterval(() => {
        const now = Date.now()
        if (now - lastMoveTimeRef.current > dropSpeedRef.current) {
          movePiece(0, 1)
          lastMoveTimeRef.current = now
        }
      }, 50)

      return () => clearInterval(gameLoopRef.current)
    }
  }, [mode, gameOver, isPaused, movePiece, gameStarted])

  const handleTrainAI = () => {
    if (isTraining) return

    setIsTraining(true)
    setTrainingProgress({ generation: 0, progress: 0, message: 'Starting training...' })

    const url = tetrisAPI.getTrainingUrl(3, 20)
    const eventSource = new EventSource(url)

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.status === 'complete') {
        setTrainingProgress({
          generation: data.generation || 3,
          progress: 100,
          message: `Training complete! Best score: ${data.best_score.toFixed(2)}`
        })
        eventSource.close()
        setIsTraining(false)
      } else if (data.status === 'error') {
        setTrainingProgress(prev => ({ ...prev, message: `Error: ${data.message}` }))
        eventSource.close()
        setIsTraining(false)
      } else {
        // Update progress with percentage
        let msg = `Gen ${data.generation}`
        if (data.individual && data.population_size) {
          msg += ` (${data.individual}/${data.population_size})`
        }
        msg += ` - Best: ${data.overall_best?.toFixed(2) || 0} (${Math.round(data.progress)}%)`

        setTrainingProgress({
          generation: data.generation,
          progress: data.progress,
          message: msg
        })
      }
    }

    eventSource.onerror = (err) => {
      console.error('EventSource failed:', err)
      eventSource.close()
      setIsTraining(false)
      setTrainingProgress(prev => ({ ...prev, message: 'Connection lost.' }))
    }
  }

  if (mode === 'menu') {
    return (
      <MainMenu
        highScore={highScore}
        onStartGame={startGame}
        showTraining={showTraining}
        setShowTraining={setShowTraining}
        isTraining={isTraining}
        trainingProgress={trainingProgress}
        onTrainAI={handleTrainAI}
      />
    )
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
      <div className="flex gap-6 items-start flex-wrap justify-center">
        <GameBoard
          board={board}
          currentPiece={currentPiece}
          aiSuggestion={aiSuggestion}
          showSuggestion={showSuggestion}
          mode={mode}
          gameOver={gameOver}
          isPaused={isPaused}
          gameStarted={gameStarted}
          onSelectDifficulty={(difficulty) => startGame(mode, difficulty)}
          onBackToMenu={() => { setMode('menu'); setGameOver(false); setIsPaused(false) }}
        />

        <div className="space-y-4">
          <ScorePanel mode={mode} level={level} score={score} lines={lines} />

          {mode === 'assisted' && (
            <AISuggestionPanel
              aiSuggestion={aiSuggestion}
              showSuggestion={showSuggestion}
              onToggleSuggestion={() => setShowSuggestion(!showSuggestion)}
            />
          )}

          <NextPiecePanel nextPiece={nextPiece} />

          <ControlButtons
            isPaused={isPaused}
            onTogglePause={() => setIsPaused(prev => !prev)}
            onBackToMenu={() => { setMode('menu'); setGameOver(false); setIsPaused(false) }}
          />

          <KeyboardControls mode={mode} />
        </div>
      </div>
    </div>
  )
}

export default TetrisGame
