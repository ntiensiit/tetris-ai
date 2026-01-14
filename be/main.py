# be/main.py
"""FastAPI server for Tetris AI"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
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

# Global training state
training_state = {
    "is_training": False,
    "progress": 0,
    "generation": 0,
    "best_score": 0,
    "message": "Idle"
}
listeners = []
listeners_lock = threading.Lock()
training_thread = None

@app.get("/")
def root():
    return {
        "message": "Tetris AI API",
        "version": "1.0.0",
        "endpoints": [
            "/ai-suggest - Get AI suggestions (WebSocket)",
            "/ai-move - Get best AI move (WebSocket)",
            "/health - Health check"
        ]
    }

@app.websocket("/ai-move")
async def ai_move(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive game state from client
            data = await websocket.receive_json()

            # Create a GameState object from the received data
            game = GameState()
            game.board = np.array(data['board'], dtype=int)

            piece_data = data['current_piece']
            game.current_piece = Piece(
                piece_data['type'],
                piece_data['rotation'],
                piece_data['x'],
                piece_data['y']
            )

            # Get the best move from the AI
            best_move = ai.get_best_move(game)

            if not best_move:
                await websocket.send_json({"error": "No valid moves"})
            else:
                await websocket.send_json({
                    "rotation": best_move["rotation"],
                    "column": best_move["column"],
                    "final_y": best_move["final_y"]
                })

    except WebSocketDisconnect:
        print("AI move stream client disconnected")
    except Exception as e:
        print(f"Error in AI move stream: {e}")
        await websocket.send_json({"error": str(e)})


@app.websocket("/ai-suggest")
async def ai_suggest(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive game state from client
            data = await websocket.receive_json()

            # Create a GameState object from the received data
            game = GameState()
            game.board = np.array(data['board'], dtype=int)
            game.score = data.get('score', 0)
            game.lines = data.get('lines', 0)
            game.level = data.get('level', 1)

            piece_data = data['current_piece']
            game.current_piece = Piece(
                piece_data['type'],
                piece_data['rotation'],
                piece_data['x'],
                piece_data['y']
            )

            # Get suggestions
            suggestions = ai.get_all_suggestions(game, top_k=3)

            if not suggestions:
                await websocket.send_json({"error": "No valid moves available"})
            else:
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

                await websocket.send_json({
                    "best_move": suggestions[0],
                    "alternatives": suggestions[1:],
                    "confidence": confidence
                })

    except WebSocketDisconnect:
        print("AI suggest stream client disconnected")
    except Exception as e:
        print(f"Error in AI suggest stream: {e}")
        await websocket.send_json({"error": str(e)})

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "ai_loaded": ai is not None,
        "weights": ai.weights.tolist() if ai else None
    }

def training_worker(generations, population_size):
    """The training logic in a thread."""
    global ai, training_state

    def callback(stats):
        # Preserve existing state and update with new stats
        current_stats = training_state.copy()
        current_stats.update(stats)
        training_state.update(current_stats)
        with listeners_lock:
            # Send the full, updated state to all listeners
            for q in list(listeners):
                q.put(current_stats)

    try:
        from trainer import train_genetic_algorithm
        new_weights, best_score = train_genetic_algorithm(
            generations=generations,
            population_size=population_size,
            callback=callback
        )

        np.save("best_weights.npy", new_weights)
        ai = TetrisAI(new_weights)

        final_stats = {"status": "complete", "best_score": best_score, "progress": 100}
        training_state.update(final_stats)
        with listeners_lock:
            for q in list(listeners):
                q.put(final_stats)
                q.put(None)  # Sentinel to close connection

    except Exception as e:
        error_stats = {"status": "error", "message": str(e)}
        training_state.update(error_stats)
        with listeners_lock:
            for q in list(listeners):
                q.put(error_stats)
                q.put(None)
    finally:
        training_state["is_training"] = False
        with listeners_lock:
            listeners.clear()

@app.get("/train")
async def train(generations: int = 30, population_size: int = 40):
    """Stream training progress using Server-Sent Events"""
    global training_thread

    # Start a new training session if none is active
    if not training_state.get("is_training") and (training_thread is None or not training_thread.is_alive()):
        training_state.clear()
        training_state.update({
            "is_training": True,
            "progress": 0,
            "generation": 0,
            "best_score": 0,
            "message": "Starting training..."
        })
        training_thread = threading.Thread(target=training_worker, args=(generations, population_size))
        training_thread.start()

    q = queue.Queue()
    with listeners_lock:
        listeners.append(q)

    def event_generator():
        try:
            # Immediately send the most recent state to the new client
            yield f"data: {json.dumps(training_state)}\n\n"

            while True:
                data = q.get()
                if data is None:
                    break
                yield f"data: {json.dumps(data)}\n\n"
        finally:
            # Clean up when the client disconnects
            with listeners_lock:
                if q in listeners:
                    listeners.remove(q)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
