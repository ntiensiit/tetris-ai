"""Training system for Tetris AI using Genetic Algorithm"""

import numpy as np
import random
from game_engine import GameState, Piece
from ai_engine import TetrisAI


def evaluate_weights(weights: np.ndarray, episodes: int = 3, max_moves: int = 800) -> float:
    """Evaluate weights by playing multiple games"""
    total_lines = 0

    for _ in range(episodes):
        game = GameState(seed=random.randint(0, 1000000))
        ai = TetrisAI(weights)
        moves = 0

        while not game.game_over and moves < max_moves:
            best_move = ai.get_best_move(game)

            if not best_move:
                break

            # Create piece with best move rotation and column
            rotation = best_move['rotation']
            column = best_move['column']

            # Create new piece at target position
            piece = Piece(game.current_piece.key, rotation, column, 0)

            # Drop piece to final position
            while game.is_valid_position(piece.move(0, 1)):
                piece = piece.move(0, 1)

            if not game.is_valid_position(piece):
                break

            # Lock piece
            game.lock_piece(piece)
            moves += 1

        total_lines += game.lines

    return total_lines / episodes


def random_weights() -> np.ndarray:
    """Generate random weights"""
    return np.random.uniform(-1, 1, size=4)


def mutate(weights: np.ndarray, rate: float = 0.25, scale: float = 0.3) -> np.ndarray:
    """Mutate weights"""
    mutated = weights.copy()
    for i in range(len(mutated)):
        if random.random() < rate:
            mutated[i] += np.random.normal(0, scale)
    return mutated


def crossover(parent1: np.ndarray, parent2: np.ndarray) -> np.ndarray:
    """Crossover two parent weights"""
    child = np.zeros_like(parent1)
    for i in range(len(child)):
        child[i] = parent1[i] if random.random() < 0.5 else parent2[i]
    return child


def train_genetic_algorithm(
    generations: int = 30,
    population_size: int = 40,
    callback=None
) -> tuple:
    """Train AI using genetic algorithm"""

    print(f"🧬 Starting Genetic Algorithm Training")
    print(f"📊 Generations: {generations}, Population: {population_size}")
    print("=" * 60)

    # Initialize population
    population = [random_weights() for _ in range(population_size)]
    best_weights = None
    best_score = 0

    for gen in range(generations):
        # Evaluate population
        scores = []
        current_gen_best = 0

        for idx, weights in enumerate(population):
            score = evaluate_weights(weights)
            scores.append((score, weights))

            if score > current_gen_best:
                current_gen_best = score

            # Calculate progress per individual
            total_steps = generations * population_size
            current_step = (gen * population_size) + (idx + 1)
            progress = (current_step / total_steps) * 100

            print(f"Gen {gen+1}/{generations} - Individual {idx+1}/{population_size}: {score:.2f} lines", end='\r')

            if callback:
                callback({
                    'generation': gen + 1,
                    'individual': idx + 1,
                    'population_size': population_size,
                    'best_score': current_gen_best,
                    'overall_best': max(best_score, current_gen_best),
                    'progress': progress
                })

        scores.sort(key=lambda x: x[0], reverse=True)

        # Update best
        if scores[0][0] > best_score:
            best_score = scores[0][0]
            best_weights = scores[0][1].copy()

        print(f"\nGen {gen+1}/{generations}: Best={scores[0][0]:.2f}, Overall Best={best_score:.2f}")

        # Select top performers
        elite_size = population_size // 5
        elite = [w for _, w in scores[:elite_size]]

        # Create new population
        new_population = [elite[0]]  # Keep best

        while len(new_population) < population_size:
            if random.random() < 0.7 and len(elite) >= 2:
                # Crossover
                parent1 = random.choice(elite)
                parent2 = random.choice(elite)
                child = crossover(parent1, parent2)
                new_population.append(mutate(child, 0.2, 0.2))
            else:
                # Mutation only
                parent = random.choice(elite)
                new_population.append(mutate(parent))

        population = new_population

    print("\n" + "=" * 60)
    print(f"✅ Training Complete!")
    print(f"🏆 Best Score: {best_score:.2f} lines/game")
    print(f"🎯 Best Weights: {best_weights}")

    return best_weights, best_score


if __name__ == "__main__":
    print("Starting training...")
    weights, score = train_genetic_algorithm(generations=3, population_size=20)
    print(f"\n✅ Training complete!")
    print(f"Best score: {score:.2f} lines/game")
    print(f"Weights: {weights}")
    np.save("best_weights.npy", weights)
    print("Saved to best_weights.npy")