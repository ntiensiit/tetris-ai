// src/components/tetris/AISuggestionPanel.jsx

import React from 'react';
import { Lightbulb } from 'lucide-react';

const AISuggestionPanel = ({ aiSuggestion, showSuggestion, onToggleSuggestion }) => {
  if (!aiSuggestion) return null;

  return (
    <div className="bg-gradient-to-br from-green-900/90 to-emerald-900/90 backdrop-blur-md p-4 rounded-2xl border-2 border-green-500/30">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-green-300 flex items-center gap-2">
          <Lightbulb size={18} />
          AI SUGGESTION
        </h4>
        <button
          onClick={onToggleSuggestion}
          className="text-xs px-2 py-1 bg-green-600/30 rounded hover:bg-green-600/50"
        >
          {showSuggestion ? 'Hide' : 'Show'}
        </button>
      </div>
      {showSuggestion && (
        <div className="text-xs text-green-200 space-y-1">
          <p>Confidence: <span className="font-bold text-green-400">{aiSuggestion.confidence}</span></p>
          <p>Rotation: {aiSuggestion.best_move.rotation}</p>
          <p>Column: {aiSuggestion.best_move.column}</p>
        </div>
      )}
    </div>
  );
};

export default AISuggestionPanel;