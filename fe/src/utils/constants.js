// src/utils/constants.js

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const BLOCK_SIZE = 28;
export const API_BASE_URL = 'http://localhost:8000';

export const TETROMINOS = {
  I: { shapes: [[[1,1,1,1]], [[1],[1],[1],[1]]], color: '#00f0f0' },
  O: { shapes: [[[1,1],[1,1]]], color: '#f0f000' },
  T: { shapes: [[[0,1,0],[1,1,1]], [[1,0],[1,1],[1,0]], [[1,1,1],[0,1,0]], [[0,1],[1,1],[0,1]]], color: '#a000f0' },
  S: { shapes: [[[0,1,1],[1,1,0]], [[1,0],[1,1],[0,1]]], color: '#00f000' },
  Z: { shapes: [[[1,1,0],[0,1,1]], [[0,1],[1,1],[1,0]]], color: '#f00000' },
  J: { shapes: [[[1,0,0],[1,1,1]], [[1,1],[1,0],[1,0]], [[1,1,1],[0,0,1]], [[0,1],[0,1],[1,1]]], color: '#0000f0' },
  L: { shapes: [[[0,0,1],[1,1,1]], [[1,0],[1,0],[1,1]], [[1,1,1],[1,0,0]], [[1,1],[0,1],[0,1]]], color: '#f0a000' }
};

export const PIECE_TYPES = Object.keys(TETROMINOS);