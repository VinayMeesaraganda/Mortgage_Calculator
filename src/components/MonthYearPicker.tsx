// Custom Month/Year Picker component

import React, { useState, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';

interface MonthYearPickerProps {
  value: string; // Format: "YYYY-MM"
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

const MonthYearPickerComponent: React.FC<MonthYearPickerProps> = ({ 
  value, 
  onChange, 
  className = '', 
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(parseInt(value.split('-')[0]));
  const [selectedMonth, setSelectedMonth] = useState(parseInt(value.split('-')[1]));
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear + i);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside both the button AND the popup
      if (
        pickerRef.current && !pickerRef.current.contains(event.target as Node) &&
        popupRef.current && !popupRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const popupWidth = 256; // w-64 = 16rem = 256px
        const popupHeight = 350; // approximate height
        
        // Calculate position using viewport coordinates
        let top = rect.bottom + 4;
        let left = rect.left;
        
        // Adjust if popup goes off right edge
        if (left + popupWidth > window.innerWidth) {
          left = window.innerWidth - popupWidth - 10;
        }
        
        // Adjust if popup goes off left edge
        if (left < 10) {
          left = 10;
        }
        
        // Adjust if popup goes off bottom edge (show above button instead)
        if (top + popupHeight > window.innerHeight) {
          top = rect.top - popupHeight - 4;
        }
        
        setPopupPosition({ top, left });
      }
    };

    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    setSelectedYear(parseInt(value.split('-')[0]));
    setSelectedMonth(parseInt(value.split('-')[1]));
  }, [value]);

  const handleMonthClick = (monthIndex: number) => {
    const newValue = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    onChange(newValue);
    setIsOpen(false);
  };

  const displayValue = `${months[selectedMonth - 1]} ${selectedYear}`;

  return (
    <div className="relative" ref={pickerRef} style={{ overflow: 'visible' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 text-sm bg-white shadow-sm hover:shadow-md hover:border-blue-300 flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        style={{ overflow: 'visible' }}
      >
        <span>{displayValue}</span>
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen && !disabled && createPortal(
        <div 
          ref={popupRef}
          className="w-64 bg-white border-2 border-blue-200 rounded-xl shadow-2xl p-4 backdrop-blur-lg"
          style={{ 
            position: 'fixed',
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
            zIndex: 999999,
            overflow: 'visible',
            maxHeight: '400px'
          }}
        >
          {/* Year Selector */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-2 py-1.5 border-2 border-blue-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-2">
            {months.map((month, idx) => (
              <button
                key={month}
                type="button"
                onClick={() => handleMonthClick(idx)}
                className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  idx + 1 === selectedMonth && selectedYear === parseInt(value.split('-')[0])
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-700'
                }`}
              >
                {month}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// Export memoized version to prevent unnecessary re-renders
export const MonthYearPicker = memo(MonthYearPickerComponent);

