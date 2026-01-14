
import React from 'react';

interface ScoreCardProps {
  label: string;
  score: number;
  color: string;
  icon: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ label, score, color, icon }) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">{label}</span>
        <i className={`${icon} ${color}`}></i>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold text-gray-800">{score}</span>
        <span className="text-gray-400 text-sm mb-1">/ 100</span>
      </div>
      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-1">
        <div 
          className={`h-full ${color.replace('text', 'bg')} transition-all duration-1000`} 
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};
