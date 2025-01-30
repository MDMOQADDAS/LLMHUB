import React from 'react';
import { Brain } from 'lucide-react';

interface KidModeToggleProps {
  isKidMode: boolean;
  onToggle: (value: boolean) => void;
}

const KidModeToggle: React.FC<KidModeToggleProps> = ({ isKidMode, onToggle }) => {
  return (
    <div className="w-full p-2 mb-2 hover:bg-gray-100 rounded-lg transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          <span className="text-sm">Kid</span>
        </div>
        <input
          type="checkbox"
          checked={isKidMode}
          onChange={(e) => onToggle(e.target.checked)}
          className="rounded border-gray-300 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default KidModeToggle;