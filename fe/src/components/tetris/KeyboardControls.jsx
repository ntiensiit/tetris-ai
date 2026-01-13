// src/components/tetris/KeyboardControls.jsx

import React from 'react';

const KeyboardControls = ({ mode }) => {
  if (mode !== 'manual' && mode !== 'assisted') return null;

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm p-4 rounded-xl border border-gray-700/50 text-xs text-gray-300 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-blue-400">←→</span>
        <span>Move</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-blue-400">↑</span>
        <span>Rotate</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-blue-400">Space</span>
        <span>Hard Drop</span>
      </div>
      {mode === 'assisted' && (
        <div className="flex items-center gap-2">
          <span className="text-blue-400">H</span>
          <span>Toggle Hint</span>
        </div>
      )}
    </div>
  );
};

export default KeyboardControls;