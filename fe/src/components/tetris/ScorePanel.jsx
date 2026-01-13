// src/components/tetris/ScorePanel.jsx

import React from 'react';

const ScorePanel = ({ mode, level, score, lines }) => {
  return (
    <div className="bg-gradient-to-br from-gray-900/90 to-blue-900/90 backdrop-blur-md p-6 rounded-2xl border-2 border-blue-500/30 shadow-2xl min-w-[240px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-cyan-400">
          {mode === 'auto' ? '🤖 AI Auto' : mode === 'assisted' ? '💡 AI Assist' : '👤 Manual'}
        </h3>
        <div className="text-yellow-400 font-bold">Lv.{level}</div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
          <span className="text-gray-300">Score:</span>
          <span className="text-2xl font-bold text-yellow-400">{score}</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
          <span className="text-gray-300">Lines:</span>
          <span className="text-2xl font-bold text-green-400">{lines}</span>
        </div>
      </div>
    </div>
  );
};

export default ScorePanel;