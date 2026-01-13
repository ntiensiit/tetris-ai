// src/components/tetris/TrainingPanel.jsx

import React from 'react';
import { Zap } from 'lucide-react';

const TrainingPanel = ({ isTraining, trainingProgress, onTrainAI }) => {
  return (
    <div className="mt-6 p-6 bg-gray-900/80 backdrop-blur-md rounded-2xl border-2 border-orange-500/30">
      <h3 className="text-xl font-bold text-orange-400 mb-4">🧬 Train AI Weights</h3>
      <p className="text-sm text-gray-300 mb-4">
        This will run genetic algorithm training on the backend server.
        <br />
        Default: 3 generations, 20 population size (fast demo)
      </p>
      
      {trainingProgress && (
        <div className="mb-4 p-3 bg-black/40 rounded-lg">
          <div className="text-green-400 font-mono text-sm mb-2">
            {trainingProgress.message}
          </div>
          {trainingProgress.progress > 0 && (
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${trainingProgress.progress}%` }}
              />
            </div>
          )}
        </div>
      )}
      
      <button
        onClick={onTrainAI}
        disabled={isTraining}
        className={`w-full ${
          isTraining 
            ? 'bg-gray-600 cursor-not-allowed' 
            : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
        } text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2`}
      >
        <Zap size={20} />
        {isTraining ? 'Training in progress...' : 'Start Training'}
      </button>
      
      <p className="text-xs text-gray-500 mt-3">
        ⚠️ Training can take several minutes. Backend must be running.
      </p>
    </div>
  );
};

export default TrainingPanel;