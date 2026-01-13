// src/components/tetris/ControlButtons.jsx

import React from 'react';
import { Pause, RotateCcw } from 'lucide-react';

const ControlButtons = ({ isPaused, onTogglePause, onBackToMenu }) => {
  return (
    <div className="space-y-2">
      <button
        onClick={onTogglePause}
        className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-3"
      >
        <Pause size={20} />
        {isPaused ? 'Resume' : 'Pause'}
      </button>
      
      <button
        onClick={onBackToMenu}
        className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-3"
      >
        <RotateCcw size={20} />
        Menu
      </button>
    </div>
  );
};

export default ControlButtons;