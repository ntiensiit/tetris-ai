"""AI engine for Tetris - heuristic-based decision making"""

import numpy as np
from typing import List, Tuple, Dict
from game_engine import GameState, Piece, TETROMINOS, BOARD_WIDTH, BOARD_HEIGHT
import copy


class TetrisAI:
    """Heuristic-based Tetris AI"""
    
    def __init__(self, weights: np.ndarray = None):
        if weights is None:
            # Default trained weights
            self.weights = np.array([-0.510066, -0.76663, -0.384483, 1.860666])
        else:
            self.weights = np.array(weights, dtype=float)
    
    def get_legal_actions(self, game: GameState) -> List[Tuple[int, int]]:
        """Get all legal (rotation, column) actions"""
        actions = []
        piece = game.current_piece
        shapes = TETROMINOS[piece.key]
        
        for rot_idx in range(len(shapes)):
            shape = shapes[rot_idx]
            width = len(shape[0])
            
            for col in range(BOARD_WIDTH - width + 1):
                test_piece = Piece(piece.key, rot_idx, col, 0)
                if game.is_valid_position(test_piece):
                    actions.append((rot_idx, col))
        
        return actions
    
    def evaluate_action(self, game: GameState, action: Tuple[int, int]) -> float:
        """Evaluate an action by simulating placement"""
        rotation, col = action
        
        # Create test piece
        piece = Piece(game.current_piece.key, rotation, col, 0)
        
        # Drop to final position
        while game.is_valid_position(piece.move(0, 1)):
            piece = piece.move(0, 1)
        
        if not game.is_valid_position(piece):
            return -9999
        
        # Simulate placement
        temp_board = game.board.copy()
        for r, row in enumerate(piece.shape):
            for c, cell in enumerate(row):
                if cell:
                    temp_board[piece.y + r, piece.x + c] = 1
        
        # Count cleared lines
        cleared = sum(1 for row in temp_board if all(row))
        
        # Remove cleared lines
        new_board = [row for row in temp_board if not all(row)]
        while len(new_board) < len(temp_board):
            new_board.insert(0, np.zeros(len(temp_board[0]), dtype=int))
        temp_board = np.array(new_board)
        
        # Calculate features
        game_copy = copy.deepcopy(game)
        game_copy.board = temp_board
        features = game_copy.get_features()
        
        # Calculate score
        feature_vector = np.array([
            features['aggregate_height'],
            features['holes'],
            features['bumpiness'],
            cleared
        ], dtype=float)
        
        score = np.dot(self.weights, feature_vector)
        return score
    
    def get_best_move(self, game: GameState) -> Dict:
        """Find best move for current game state"""
        legal_actions = self.get_legal_actions(game)
        
        if not legal_actions:
            return None
        
        best_score = -float('inf')
        best_action = None
        
        for action in legal_actions:
            score = self.evaluate_action(game, action)
            if score > best_score:
                best_score = score
                best_action = action
        
        if best_action is None:
            return None
        
        rotation, col = best_action
        
        # Calculate final position
        piece = Piece(game.current_piece.key, rotation, col, 0)
        while game.is_valid_position(piece.move(0, 1)):
            piece = piece.move(0, 1)
        
        return {
            'rotation': rotation,
            'column': col,
            'final_y': piece.y,
            'score': float(best_score),
            'piece': piece.to_dict()
        }
    
    def get_all_suggestions(self, game: GameState, top_k: int = 3) -> List[Dict]:
        """Get top-k best moves with scores"""
        legal_actions = self.get_legal_actions(game)
        
        if not legal_actions:
            return []
        
        scored_actions = []
        for action in legal_actions:
            score = self.evaluate_action(game, action)
            rotation, col = action
            
            piece = Piece(game.current_piece.key, rotation, col, 0)
            while game.is_valid_position(piece.move(0, 1)):
                piece = piece.move(0, 1)
            
            scored_actions.append({
                'rotation': rotation,
                'column': col,
                'final_y': piece.y,
                'score': float(score),
                'piece': piece.to_dict()
            })
        
        scored_actions.sort(key=lambda x: x['score'], reverse=True)
        return scored_actions[:top_k]