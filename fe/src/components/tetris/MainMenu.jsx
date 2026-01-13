// src/components/tetris/MainMenu.jsx

import React from 'react';
import { Play, Brain, Lightbulb, Trophy, Settings } from 'lucide-react';
import TrainingPanel from './TrainingPanel';

const MainMenu = ({ 
  highScore, 
  onStartGame, 
  showTraining, 
  setShowTraining,
  isTraining,
  trainingProgress,
  onTrainAI
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <div className="mb-8 animate-pulse">
          <h1 className="text-8xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-transparent bg-clip-text mb-4 tracking-wider drop-shadow-2xl">
            TETRIS AI
          </h1>
          <p className="text-2xl text-blue-300 font-light tracking-wide">
            ⚡ Genetic Algorithm Powered ⚡
          </p>
        </div>
        
        {highScore > 0 && (
          <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl backdrop-blur-sm">
            <div className="flex items-center justify-center gap-3 text-yellow-400">
              <Trophy size={28} />
              <span className="text-2xl font-bold">High Score: {highScore}</span>
            </div>
          </div>
        )}
        
        <div className="space-y-4 mb-6">
          <button
            onClick={() => onStartGame('manual')}
            className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white font-bold py-5 px-10 rounded-2xl shadow-2xl transform transition-all hover:scale-105 flex items-center justify-center gap-4 text-xl"
          >
            <Play size={28} />
            <div className="text-left">
              <div>Manual Play</div>
              <div className="text-sm opacity-80">Full player control</div>
            </div>
          </button>
          
          <button
            onClick={() => onStartGame('assisted')}
            className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-600 hover:from-purple-600 hover:via-pink-600 hover:to-rose-700 text-white font-bold py-5 px-10 rounded-2xl shadow-2xl transform transition-all hover:scale-105 flex items-center justify-center gap-4 text-xl"
          >
            <Lightbulb size={28} />
            <div className="text-left">
              <div>AI Assisted</div>
              <div className="text-sm opacity-80">AI suggests best moves</div>
            </div>
          </button>
          
          <button
            onClick={() => onStartGame('auto')}
            className="w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-sky-600 hover:from-blue-600 hover:via-cyan-600 hover:to-sky-700 text-white font-bold py-5 px-10 rounded-2xl shadow-2xl transform transition-all hover:scale-105 flex items-center justify-center gap-4 text-xl"
          >
            <Brain size={28} />
            <div className="text-left">
              <div>AI Auto Play</div>
              <div className="text-sm opacity-80">Watch AI play completely</div>
            </div>
          </button>
        </div>
        
        <button
          onClick={() => setShowTraining(!showTraining)}
          className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-4 px-8 rounded-xl shadow-xl transform transition-all hover:scale-105 flex items-center justify-center gap-3"
        >
          <Settings size={24} />
          <span>{showTraining ? 'Hide' : 'Show'} AI Training</span>
        </button>
        
        {showTraining && (
          <TrainingPanel
            isTraining={isTraining}
            trainingProgress={trainingProgress}
            onTrainAI={onTrainAI}
          />
        )}
        
        <div className="mt-8 text-blue-300/70 text-sm space-y-2">
          <p>🎮 Backend: FastAPI + Python</p>
          <p>🤖 AI: Genetic Algorithm Optimization</p>
          <p>⚡ Real-time API Communication</p>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;