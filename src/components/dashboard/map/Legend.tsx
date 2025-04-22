
import React from 'react';

export const Legend = () => {
  return (
    <div className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-md shadow-md">
      <h4 className="text-sm font-semibold mb-2">Composite Score</h4>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#FF4C4C]"></div>
        <span className="text-xs">Low (1-7)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#FFD93D]"></div>
        <span className="text-xs">Medium (8-14)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#4CAF50]"></div>
        <span className="text-xs">High (15-20)</span>
      </div>
    </div>
  );
};
