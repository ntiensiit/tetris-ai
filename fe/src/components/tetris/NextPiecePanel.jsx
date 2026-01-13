// src/components/tetris/NextPiecePanel.jsx

import React from 'react';
import { TETROMINOS } from '../../utils/constants';

const NextPiecePanel = ({ nextPiece }) => {
  if (!nextPiece) return null;

  return (
    <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 backdrop-blur-md p-4 rounded-2xl border-2 border-purple-500/30 shadow-2xl">
      <h4 className="text-sm font-bold mb-3 text-purple-300">NEXT:</h4>
      <div className="flex justify-center">
        <div className="bg-black/40 p-3 rounded-lg">
          {TETROMINOS[nextPiece].shapes[0].map((row, y) => (
            <div key={y} className="flex">
              {row.map((cell, x) => (
                <div
                  key={x}
                  style={{
                    width: 22,
                    height: 22,
                    backgroundColor: cell ? TETROMINOS[nextPiece].color : '#0a0a0a',
                    boxShadow: cell ? `inset 0 0 6px rgba(255,255,255,0.3)` : 'none'
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NextPiecePanel;