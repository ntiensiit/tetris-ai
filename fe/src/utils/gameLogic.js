// src/utils/gameLogic.js

import { BOARD_WIDTH, BOARD_HEIGHT, TETROMINOS, PIECE_TYPES } from './constants';

export const normalizeBoard = (board) =>
  board.map(row => row.map(cell => (cell ? 1 : 0)));

export const createBoard = () => 
  Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));

export const createPiece = (type) => {
  const tetromino = TETROMINOS[type];
  return {
    type,
    shape: tetromino.shapes[0],
    rotation: 0,
    x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shapes[0][0].length / 2),
    y: 0,
    color: tetromino.color
  };
};

export const isValidPosition = (board, piece, x, y) => {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[0].length; c++) {
      if (piece.shape[r][c]) {
        const newX = x + c;
        const newY = y + r;
        if (newX < 0 || newX >= BOARD_WIDTH || newY < 0 || newY >= BOARD_HEIGHT) {
          return false;
        }
        if (board[newY][newX]) {
          return false;
        }
      }
    }
  }
  return true;
};

export const lockPiece = (board, piece) => {
  const newBoard = board.map(row => [...row]);
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[0].length; c++) {
      if (piece.shape[r][c]) {
        newBoard[piece.y + r][piece.x + c] = piece.color;
      }
    }
  }
  return newBoard;
};

export const clearLines = (board) => {
  let linesCleared = 0;
  const newBoard = [];
  
  for (let r = BOARD_HEIGHT - 1; r >= 0; r--) {
    if (board[r].every(cell => cell !== 0)) {
      linesCleared++;
    } else {
      newBoard.unshift(board[r]);
    }
  }
  
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(0));
  }
  
  return { board: newBoard, linesCleared };
};

export const rotatePiece = (piece) => {
  const shapes = TETROMINOS[piece.type].shapes;
  const nextRotation = (piece.rotation + 1) % shapes.length;
  return {
    ...piece,
    shape: shapes[nextRotation],
    rotation: nextRotation
  };
};

export const getRandomPieceType = () => 
  PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];