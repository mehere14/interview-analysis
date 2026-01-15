
import React from 'react';
import { Button } from './Button';

interface ModuleCardProps {
  title: string;
  description: string;
  historyText: string;
  bgColor: string;
  onClick: () => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ 
  title, 
  description, 
  historyText, 
  bgColor, 
  onClick 
}) => {
  return (
    <div className={`${bgColor} cruit-card p-6 flex flex-col h-full min-h-[180px]`}>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-xs text-gray-500 mb-4 flex-grow">{description}</p>
      
      <div className="pt-4 border-t border-gray-200/50">
        <p className="text-[10px] text-gray-400 mb-3">{historyText}</p>
        <div className="flex gap-2">
          <Button variant="pill-outline" onClick={onClick}>
            + new chat
          </Button>
          <Button variant="pill-outline">
            history
          </Button>
        </div>
      </div>
    </div>
  );
};
