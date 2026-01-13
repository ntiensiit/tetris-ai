# be/main.py
"""FastAPI server for Tetris AI"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import numpy as np
import threading
import queue
import json
from game_engine import GameState, Piece, TETROMINOS
from ai_engine import TetrisAI
import os

app = FastAPI(title="Tetris AI API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load or initialize AI
try:
    weights = np.load("best_weights.npy", allow_pickle=True).flatten()
    ai = TetrisAI(weights)
    print(f"✅ Loaded trained weights: {weights}")
except:
    ai = TetrisAI()  # Use default weights
    print("⚠️ Using default AI weights")

# Request/Response models
class BoardState(BaseModel):
    board: List[List[int]]
    current_piece: Dict
    next_piece_type: str
    score: int
    lines: int
    level: int

class SuggestionResponse(BaseModel):
    best_move: Dict
    alternatives: List[Dict]
    confidence: str

# Global training state
training_state = {
    "is_training": False,
    "progress": 0,
    "generation": 0,
    "best_score": 0,
    "message": "Idle"
}

@app.get("/")
def root():
    return {
        "message": "Tetris AI API",
        "version": "1.0.0",
        "endpoints": [
            "/suggest - Get AI suggestions",
            "/ai-move - Get best AI move",
            "/health - Health check"
        ]
    }


@app.post("/suggest")
def suggest_move(state: BoardState) -> SuggestionResponse:
    """Get AI suggestions for current board state"""
    try:
        # Recreate game state from frontend data
        game = GameState()
        game.board = np.array(state.board, dtype=int)
        game.score = state.score
        game.lines = state.lines
        game.level = state.level

        # Recreate current piece
        piece_data = state.current_piece
        game.current_piece = Piece(
            piece_data['type'],
            piece_data['rotation'],
            piece_data['x'],
            piece_data['y']
        )

        # Get suggestions
        suggestions = ai.get_all_suggestions(game, top_k=3)

        if not suggestions:
            raise HTTPException(status_code=400, detail="No valid moves available")

        # Determine confidence based on score distribution
        if len(suggestions) > 1:
            score_diff = suggestions[0]['score'] - suggestions[1]['score']
            if score_diff > 50:
                confidence = "high"
            elif score_diff > 20:
                confidence = "medium"
            else:
                confidence = "low"
        else:
            confidence = "high"

        return SuggestionResponse(
            best_move=suggestions[0],
            alternatives=suggestions[1:],
            confidence=confidence
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ai-move")
def get_ai_move(state: BoardState):
    try:
        game = GameState()
        game.board = np.array(state.board, dtype=int)

        piece_data = state.current_piece
        game.current_piece = Piece(
            piece_data['type'],
            piece_data['rotation'],
            piece_data['x'],
            piece_data['y']
        )

        best_move = ai.get_best_move(game)

        if not best_move:
            raise HTTPException(status_code=400, detail="No valid moves")

        return {
            "rotation": best_move["rotation"],
            "column": best_move["column"],
            "final_y": best_move["final_y"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "ai_loaded": ai is not None,
        "weights": ai.weights.tolist() if ai else None
    }

@app.get("/train-stream")
async def train_stream(generations: int = 30, population_size: int = 40):
    """Stream training progress using Server-Sent Events"""

    if training_state["is_training"]:
        raise HTTPException(status_code=400, detail="Training already in progress")

    q = queue.Queue()

    def worker():
        global ai, training_state
        training_state["is_training"] = True

        def callback(stats):
            training_state.update(stats)
            q.put(stats)

        try:
            from trainer import train_genetic_algorithm
            new_weights, best_score = train_genetic_algorithm(
                generations=generations,
                population_size=population_size,
                callback=callback
            )

            np.save("best_weights.npy", new_weights)
            ai = TetrisAI(new_weights)

            q.put({"status": "complete", "best_score": best_score, "progress": 100})

        except Exception as e:
            q.put({"status": "error", "message": str(e)})
        finally:
            training_state["is_training"] = False
            q.put(None)

    thread = threading.Thread(target=worker)
    thread.start()

    def event_generator():
        while True:
            data = q.get()
            if data is None:
                break
            yield f"data: {json.dumps(data)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)