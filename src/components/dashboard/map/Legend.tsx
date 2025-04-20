
import React from 'react';

export const Legend = () => {
  return (
    <div className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-md shadow-md">
      <h4 className="text-sm font-semibold mb-2">Composite Score</h4>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#f2fcE2]"></div>
        <span className="text-xs">Low</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#9b87f5]"></div>
        <span className="text-xs">Medium</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#8B5CF6]"></div>
        <span className="text-xs">High</span>
      </div>
    </div>
  );
};
