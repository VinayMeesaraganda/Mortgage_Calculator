// Custom Date Picker component (Day, Month, Year)

import React, { useState, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';

interface DatePickerProps {
  value: string; // Format: "YYYY-MM-DD"
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

const DatePickerComponent: React.FC<DatePickerProps> = ({
  value,
  onChange,
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(() => {
    const parts = value.split('-');
    return parts.length >= 1 ? parseInt(parts[0]) : new Date().getFullYear();
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const parts = value.split('-');
    return parts.length >= 2 ? parseInt(parts[1]) : new Date().getMonth() + 1;
  });
  const [selectedDay, setSelectedDay] = useState(() => {
    const parts = value.split('-');
    return parts.length >= 3 ? parseInt(parts[2]) : new Date().getDate();
  });
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  // Generate years from 50 years ago to 50 years in the future (100 years total)
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 50 + i);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Get number of days in a month
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate();
  };

  // Get days array for selected month
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

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
        const popupWidth = 260; // w-64 = 16rem = 256px
        const popupHeight = 400; // approximate height

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
    const parts = value.split('-');
    if (parts.length >= 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      if (!isNaN(year)) setSelectedYear(year);
      if (!isNaN(month) && month >= 1 && month <= 12) setSelectedMonth(month);
      if (!isNaN(day)) {
        const maxDays = getDaysInMonth(year, month);
        setSelectedDay(Math.min(day, maxDays));
      }
    }
  }, [value]);

  // Update day when month/year changes to ensure valid date
  useEffect(() => {
    const maxDays = getDaysInMonth(selectedYear, selectedMonth);
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
    }
  }, [selectedYear, selectedMonth, selectedDay]);

  const handleDayClick = (day: number) => {
    const newValue = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(newValue);
    setIsOpen(false);
  };

  const handleMonthClick = (monthIndex: number) => {
    setSelectedMonth(monthIndex + 1);
    // Adjust day if needed
    const maxDays = getDaysInMonth(selectedYear, monthIndex + 1);
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
    }
  };

  const displayValue = `${String(selectedDay).padStart(2, '0')} ${months[selectedMonth - 1]} ${selectedYear}`;

  return (
    <div className="relative" ref={pickerRef} style={{ overflow: 'visible' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
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
          className="w-72 bg-white border border-slate-200 rounded-xl shadow-2xl backdrop-blur-lg overflow-hidden font-sans"
          style={{
            position: 'fixed',
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
            zIndex: 999999,
            maxHeight: '450px'
          }}
        >
          {/* Header */}
          <div className="bg-blue-900 p-3 flex items-center justify-between text-white">
            <button
              type="button"
              onClick={() => {
                let newMonth = selectedMonth - 1;
                let newYear = selectedYear;
                if (newMonth < 1) {
                  newMonth = 12;
                  newYear -= 1;
                }
                setSelectedMonth(newMonth);
                setSelectedYear(newYear);
              }}
              className="p-1 hover:bg-blue-800 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center space-x-2">
              <div className="relative group">
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthClick(parseInt(e.target.value) - 1)}
                  className="appearance-none bg-transparent font-semibold text-sm cursor-pointer focus:outline-none pr-4 text-center"
                  style={{ textAlignLast: 'center' }}
                >
                  {months.map((m, i) => (
                    <option key={m} value={i + 1} className="text-slate-900">{m}</option>
                  ))}
                </select>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative group">
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    const newYear = Number(e.target.value);
                    setSelectedYear(newYear);
                    const maxDays = getDaysInMonth(newYear, selectedMonth);
                    if (selectedDay > maxDays) setSelectedDay(maxDays);
                  }}
                  className="appearance-none bg-transparent font-semibold text-sm cursor-pointer focus:outline-none pr-4"
                >
                  {years.map(y => (
                    <option key={y} value={y} className="text-slate-900">{y}</option>
                  ))}
                </select>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                let newMonth = selectedMonth + 1;
                let newYear = selectedYear;
                if (newMonth > 12) {
                  newMonth = 1;
                  newYear += 1;
                }
                setSelectedMonth(newMonth);
                setSelectedYear(newYear);
              }}
              className="p-1 hover:bg-blue-800 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Days of Week */}
          <div className="bg-blue-900 px-3 pb-2 grid grid-cols-7 gap-1 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-xs font-medium text-blue-200">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="p-3">
            <div className="grid grid-cols-7 gap-1">
              {/* Empty slots for days before the 1st of the month */}
              {Array.from({ length: new Date(selectedYear, selectedMonth - 1, 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {days.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={`w-8 h-8 flex items-center justify-center text-sm rounded-full transition-all ${day === selectedDay
                    ? 'bg-blue-600 text-white shadow-md font-semibold'
                    : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// Export memoized version to prevent unnecessary re-renders
export const DatePicker = memo(DatePickerComponent);

