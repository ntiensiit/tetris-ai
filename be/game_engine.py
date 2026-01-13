# be/game_engine.py
"""Core Tetris game engine - extracted from tetris_game.py"""

import numpy as np
import random
from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass, asdict

# Constants
BOARD_WIDTH = 10
BOARD_HEIGHT = 20

# Tetromino shapes
TETROMINOS = {
    'I': [[[1,1,1,1]], [[1],[1],[1],[1]]],
    'O': [[[1,1],[1,1]]],
    'T': [[[0,1,0],[1,1,1]], [[1,0],[1,1],[1,0]], [[1,1,1],[0,1,0]], [[0,1],[1,1],[0,1]]],
    'S': [[[0,1,1],[1,1,0]], [[1,0],[1,1],[0,1]]],
    'Z': [[[1,1,0],[0,1,1]], [[0,1],[1,1],[1,0]]],
    'J': [[[1,0,0],[1,1,1]], [[1,1],[1,0],[1,0]], [[1,1,1],[0,0,1]], [[0,1],[0,1],[1,1]]],
    'L': [[[0,0,1],[1,1,1]], [[1,0],[1,0],[1,1]], [[1,1,1],[1,0,0]], [[1,1],[0,1],[0,1]]]
}

COLORS = {
    'I': '#00f0f0', 'O': '#f0f000', 'T': '#a000f0',
    'S': '#00f000', 'Z': '#f00000', 'J': '#0000f0', 'L': '#f0a000'
}


@dataclass
class Piece:
    key: str
    rotation: int
    x: int
    y: int
    
    @property
    def shape(self):
        return TETROMINOS[self.key][self.rotation]
    
    @property
    def color(self):
        return COLORS[self.key]
    
    def rotate(self):
        max_rot = len(TETROMINOS[self.key])
        return Piece(self.key, (self.rotation + 1) % max_rot, self.x, self.y)
    
    def move(self, dx: int, dy: int):
        return Piece(self.key, self.rotation, self.x + dx, self.y + dy)
    
    def to_dict(self):
        return {
            **asdict(self),
            'shape': self.shape,
            'color': self.color
        }


class GameState:
    """Manages the game state"""
    
    def __init__(self, seed: Optional[int] = None):
        self.board = np.zeros((BOARD_HEIGHT, BOARD_WIDTH), dtype=int)
        self.score = 0
        self.lines = 0
        self.level = 1
        self.game_over = False
        self.rng = random.Random(seed)
        self.piece_types = list(TETROMINOS.keys())
        self.current_piece = self._spawn_piece()
        self.next_piece_type = self._random_piece_type()
    
    def _random_piece_type(self) -> str:
        return self.rng.choice(self.piece_types)
    
    def _spawn_piece(self) -> Piece:
        piece_type = self.next_piece_type if hasattr(self, 'next_piece_type') else self._random_piece_type()
        shape = TETROMINOS[piece_type][0]
        x = BOARD_WIDTH // 2 - len(shape[0]) // 2
        return Piece(piece_type, 0, x, 0)
    
    def is_valid_position(self, piece: Piece) -> bool:
        """Check if piece position is valid"""
        for r, row in enumerate(piece.shape):
            for c, cell in enumerate(row):
                if cell:
                    bx, by = piece.x + c, piece.y + r
                    if bx < 0 or bx >= BOARD_WIDTH or by < 0 or by >= BOARD_HEIGHT:
                        return False
                    if by >= 0 and self.board[by, bx]:
                        return False
        return True
    
    def lock_piece(self, piece: Piece):
        """Lock piece to board"""
        for r, row in enumerate(piece.shape):
            for c, cell in enumerate(row):
                if cell:
                    self.board[piece.y + r, piece.x + c] = 1
        
        # Clear lines
        lines_cleared = self._clear_lines()
        self.lines += lines_cleared
        self.score += [0, 100, 300, 500, 800][min(lines_cleared, 4)] * self.level
        self.level = self.lines // 10 + 1
        
        # Spawn new piece
        self.next_piece_type = self._random_piece_type()
        self.current_piece = self._spawn_piece()
        
        if not self.is_valid_position(self.current_piece):
            self.game_over = True
        
        return lines_cleared
    
    def _clear_lines(self) -> int:
        """Clear completed lines and return count"""
        new_board = []
        cleared = 0
        
        for row in self.board:
            if not all(row):
                new_board.append(row)
            else:
                cleared += 1
        
        while len(new_board) < BOARD_HEIGHT:
            new_board.insert(0, np.zeros(BOARD_WIDTH, dtype=int))
        
        self.board = np.array(new_board)
        return cleared
    
    def get_features(self, board: Optional[np.ndarray] = None) -> Dict[str, float]:
        """Calculate board features for AI"""
        b = board if board is not None else self.board
        
        # Column heights
        heights = np.zeros(BOARD_WIDTH, dtype=int)
        for c in range(BOARD_WIDTH):
            col = b[:, c]
            if col.any():
                heights[c] = BOARD_HEIGHT - np.argmax(col)
        
        # Holes (empty cells below filled cells)
        holes = 0
        for c in range(BOARD_WIDTH):
            col = b[:, c]
            seen = False
            for cell in col:
                if cell:
                    seen = True
                elif seen:
                    holes += 1
        
        # Bumpiness (height differences)
        bumpiness = int(np.sum(np.abs(np.diff(heights))))
        
        return {
            'aggregate_height': int(np.sum(heights)),
            'holes': holes,
            'bumpiness': bumpiness,
            'max_height': int(np.max(heights))
        }
    
    def to_dict(self) -> Dict:
        """Serialize to dict for API"""
        return {
            'board': self.board.tolist(),
            'current_piece': self.current_piece.to_dict(),
            'next_piece_type': self.next_piece_type,
            'score': self.score,
            'lines': self.lines,
            'level': self.level,
            'game_over': self.game_over
        }