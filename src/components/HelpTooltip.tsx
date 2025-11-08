// Help Tooltip component with classic styling

import React, { useState, useRef, useEffect } from 'react';

interface HelpTooltipProps {
  content: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={tooltipRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-blue-500 hover:text-blue-600 transition-colors"
        type="button"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="10" cy="6" r="1" />
          <line x1="10" y1="8.5" x2="10" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white text-xs rounded-lg p-3 shadow-2xl border border-slate-700 backdrop-blur-xl relative">
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
              <div className="border-8 border-transparent border-t-slate-800"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

