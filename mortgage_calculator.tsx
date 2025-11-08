import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, LabelList } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

// Custom hook for number input handling - eliminates ~200 lines of duplication
const useNumberInput = (
  initialValue: number,
  defaultValue: number,
  fieldName: string,
  validate?: (value: number) => number
) => {
  const [value, setValue] = useState(initialValue);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [rawValue, setRawValue] = useState<string>('');

  const isEditing = editingField === fieldName;

  const displayValue = isEditing 
    ? (value === 0 ? '' : rawValue || value.toString())
    : (value === 0 ? '' : value.toLocaleString());

  const handleChange = (inputValue: string) => {
    setEditingField(fieldName);
    const cleaned = inputValue.replace(/,/g, '');
    setRawValue(cleaned);
    
    if (cleaned === '' || cleaned === '-') {
      setValue(0);
    } else if (/^\d*\.?\d*$/.test(cleaned)) {
      const num = Number(cleaned);
      if (!isNaN(num) && num >= 0) {
        setValue(validate ? validate(num) : num);
      }
    }
  };

  const handleFocus = () => {
    setEditingField(fieldName);
    setRawValue(value.toString());
  };

  const handleBlur = () => {
    setEditingField(null);
    if (value === 0 || rawValue === '') {
      setValue(defaultValue);
    }
    setRawValue('');
  };

  return {
    value,
    displayValue,
    setValue,
    handleChange,
    handleFocus,
    handleBlur,
    isEditing
  };
};

// ============================================================================
// SHARED CALCULATION UTILITIES
// ============================================================================

// Extract shared extra payment logic to eliminate duplication
const applyExtraPayments = (
  currentDate: Date,
  balance: number,
  principalPayment: number,
  extraPrincipal: number,
  extraPaymentEnabled: boolean,
  extraPaymentAmount: number,
  extraStartDate: Date | null,
  extraPaymentFrequency: string,
  extraPaymentMade: { value: boolean },
  oneTimePayments: Array<{id: string, date: string, amount: number}>,
  appliedOneTimePayments: Set<string>
): number => {
  let totalExtra = extraPrincipal;
  
  // Apply recurring extra payments
  if (extraPaymentEnabled && extraPaymentAmount > 0 && balance > 0.01) {
    const currentDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const extraStartDateStr = extraStartDate ? `${extraStartDate.getFullYear()}-${String(extraStartDate.getMonth() + 1).padStart(2, '0')}` : '';
    
    if (!extraStartDate || currentDateStr >= extraStartDateStr || currentDate >= extraStartDate) {
      if (extraPaymentFrequency === 'one-time' && !extraPaymentMade.value) {
        totalExtra = Math.min(extraPaymentAmount, balance - principalPayment);
        extraPaymentMade.value = true;
      } else if (extraPaymentFrequency === 'monthly' || extraPaymentFrequency === 'biweekly') {
        totalExtra = Math.min(extraPaymentAmount, balance - principalPayment);
      }
    }
  }
  
  // Apply multiple one-time payments
  const currentDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  oneTimePayments.forEach(payment => {
    if (payment.date === currentDateStr && !appliedOneTimePayments.has(payment.id) && balance > 0.01) {
      const additionalPayment = Math.min(payment.amount, balance - principalPayment - totalExtra);
      totalExtra += additionalPayment;
      appliedOneTimePayments.add(payment.id);
    }
  });
  
  // Ensure we don't overpay
  if (principalPayment + totalExtra > balance) {
    totalExtra = Math.max(0, balance - principalPayment);
  }
  
  return totalExtra;
};

// ============================================================================
// STYLING CONSTANTS
// ============================================================================

const CARD_STYLE = "bg-gradient-to-br from-white/90 via-white/85 to-slate-50/60 rounded-xl shadow-xl border-2 border-slate-200/50 backdrop-blur-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5 relative group";
const CARD_SHADOW = { boxShadow: '0 8px 32px rgba(100, 116, 139, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.5) inset' };
const INPUT_STYLE = "w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm bg-white shadow-sm hover:shadow-md hover:border-blue-300";
const BUTTON_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-sm font-bold shadow-md hover:shadow-xl uppercase tracking-wide hover:scale-105 relative overflow-hidden group/btn";

// ============================================================================
// COMPONENTS
// ============================================================================

// Help Tooltip Component - Subtle and elegant
const HelpTooltip = ({ text }: { text: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div className="relative inline-block ml-2">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-blue-400 hover:text-blue-600 transition-all duration-200 cursor-help opacity-60 hover:opacity-100"
        style={{ fontSize: '9px', fontWeight: '600', fontStyle: 'italic' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </button>
      {isVisible && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2.5 py-1.5 bg-gradient-to-br from-slate-800 to-slate-900 text-white text-xs rounded-md shadow-xl border border-slate-700 animate-fadeIn backdrop-blur-sm"
          style={{ 
            minWidth: '180px', 
            maxWidth: '260px', 
            whiteSpace: 'normal',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
            fontSize: '11px',
            lineHeight: '1.4'
          }}
        >
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
        </div>
      )}
    </div>
  );
};

// Month/Year Picker Component
interface MonthYearPickerProps {
  value: string; // Format: "YYYY-MM"
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

const MonthYearPicker = ({ value, onChange, className = '', disabled = false }: MonthYearPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(() => {
    const [year] = value.split('-');
    return year ? parseInt(year) : new Date().getFullYear();
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const [, month] = value.split('-');
    return month ? parseInt(month) - 1 : new Date().getMonth();
  });
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - 25 + i);

  useEffect(() => {
    if (value) {
      const [year, month] = value.split('-');
      if (year) setSelectedYear(parseInt(year));
      if (month) setSelectedMonth(parseInt(month) - 1);
    }
  }, [value]);

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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const popupWidth = 256; // w-64 = 16rem = 256px
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

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    const newValue = `${selectedYear}-${String(month + 1).padStart(2, '0')}`;
    onChange(newValue);
    setIsOpen(false);
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    const newValue = `${year}-${String(selectedMonth + 1).padStart(2, '0')}`;
    onChange(newValue);
  };

  const displayValue = value ? `${months[selectedMonth]} ${selectedYear}` : 'Select date';

  return (
    <div className={`relative ${className}`} ref={pickerRef} style={{ overflow: 'visible' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm text-left flex items-center justify-between bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:border-blue-300"
        style={{ overflow: 'visible' }}
      >
        <span className="font-medium text-slate-800">{displayValue}</span>
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
      
      {isOpen && createPortal(
        <div 
          ref={popupRef}
          className="bg-white border-2 border-blue-200 rounded-lg shadow-xl p-4 w-64" 
          style={{ 
            position: 'fixed',
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
            zIndex: 999999,
            overflow: 'visible', 
            boxShadow: '0 10px 40px rgba(59, 130, 246, 0.15)',
            maxHeight: '450px'
          }}
        >
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => handleYearSelect(parseInt(e.target.value))}
              className="w-full px-2 py-1.5 border-2 border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 font-medium"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Month</label>
            <div className="grid grid-cols-3 gap-2">
              {months.map((month, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleMonthSelect(index)}
                  className={`px-3 py-2 text-xs rounded-lg transition-all font-semibold shadow-sm hover:shadow-md ${
                    selectedMonth === index
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : 'bg-white text-slate-700 hover:bg-blue-50 border-2 border-blue-200'
                  }`}
                >
                  {month}
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

interface ScheduleItem {
  paymentNum: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterest: number;
}

interface GroupedScheduleItem extends ScheduleItem {
  displayDate?: string;
  count?: number;
  startPayment?: number;
  endPayment?: number;
}

interface AmortizationTableProps {
  schedule: ScheduleItem[];
  formatCurrency: (value: number) => string;
  formatDate: (dateStr: string) => string;
}

const AmortizationTable = ({ schedule, formatCurrency, formatDate }: AmortizationTableProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [groupBy, setGroupBy] = useState('year');
  
  const exportToCSV = () => {
    // Create CSV header
    const headers = ['Payment #', 'Date', 'Payment', 'Principal', 'Interest', 'Balance', 'Total Interest'];
    
    // Create CSV rows
    const rows = schedule.map(item => [
      item.paymentNum.toString(),
      formatDate(item.date),
      item.payment.toFixed(2),
      item.principal.toFixed(2),
      item.interest.toFixed(2),
      item.balance.toFixed(2),
      item.totalInterest.toFixed(2)
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `amortization_schedule_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const groupedSchedule = useMemo((): (ScheduleItem | GroupedScheduleItem)[] => {
    if (groupBy === 'none') return schedule;
    
    const grouped: Record<string, GroupedScheduleItem> = {};
    schedule.forEach(row => {
      const [year, month] = row.date.split('-');
      const key = groupBy === 'year' ? year : `${year}-${month}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          paymentNum: row.paymentNum,
          date: row.date,
          displayDate: groupBy === 'year' ? year : `${new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
          payment: 0,
          principal: 0,
          interest: 0,
          balance: row.balance,
          totalInterest: row.totalInterest,
          count: 0,
          startPayment: row.paymentNum,
          endPayment: row.paymentNum
        };
      }
      
      grouped[key].payment += row.payment;
      grouped[key].principal += row.principal;
      grouped[key].interest += row.interest;
      grouped[key].balance = row.balance;
      grouped[key].totalInterest = row.totalInterest;
      if (grouped[key].count !== undefined) grouped[key].count!++;
      grouped[key].endPayment = row.paymentNum;
    });
    
    return Object.values(grouped);
  }, [schedule, groupBy]);
  
  return (
    <div className="mt-8 bg-gradient-to-br from-white/90 via-white/85 to-slate-50/60 rounded-xl shadow-xl border-2 border-slate-200/50 p-6 backdrop-blur-md hover:shadow-2xl transition-all duration-300 relative group" style={{ boxShadow: '0 12px 40px rgba(100, 116, 139, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5) inset' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-xl pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/10 to-transparent rounded-bl-full pointer-events-none"></div>
      
      <div className="flex justify-between items-center mb-6 relative">
        <h2 className="text-xl font-serif font-bold text-slate-800 tracking-tight">
          Amortization Schedule
          <div className="absolute -bottom-1 left-0 w-16 h-0.5 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-sm font-bold shadow-md hover:shadow-xl uppercase tracking-wide hover:scale-105 relative overflow-hidden group/btn"
            title="Export to CSV"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
            <svg className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="relative z-10">Export CSV</span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 whitespace-nowrap px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-lg hover:from-slate-800 hover:to-slate-900 transition-all duration-300 text-sm font-bold shadow-md hover:shadow-xl hover:scale-105 relative overflow-hidden group/btn"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
            {isExpanded ? (
              <>
                <ChevronUp size={20} className="relative z-10 transition-transform duration-300 group-hover/btn:scale-110 flex-shrink-0" />
                <span className="relative z-10">Hide Schedule</span>
              </>
            ) : (
              <>
                <ChevronDown size={20} className="relative z-10 transition-transform duration-300 group-hover/btn:scale-110 flex-shrink-0" />
                <span className="relative z-10">Show Schedule</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div>
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setGroupBy('year')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md ${
                groupBy === 'year' 
                  ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white' 
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-300'
              }`}
            >
              By Year
            </button>
            <button
              onClick={() => setGroupBy('month')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md ${
                groupBy === 'month' 
                  ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white' 
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-300'
              }`}
            >
              By Month
            </button>
            <button
              onClick={() => setGroupBy('none')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md ${
                groupBy === 'none' 
                  ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white' 
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-300'
              }`}
            >
              All Payments
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-slate-50 sticky top-0 border-b-2 border-blue-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {groupBy === 'none' ? 'Payment #' : 'Period'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Date
                    </th>
                    {groupBy !== 'none' && (
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                        # Payments
                      </th>
                    )}
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Total Payment
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Principal
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Interest
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedSchedule.map((row, idx) => {
                    const groupedRow = groupBy !== 'none' ? row as GroupedScheduleItem : null;
                    return (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {groupBy === 'none' ? row.paymentNum : (groupBy === 'year' ? `Year ${idx + 1}` : groupedRow?.displayDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {groupBy === 'none' ? formatDate(row.date) : (groupBy === 'year' ? groupedRow?.displayDate : '')}
                      </td>
                      {groupBy !== 'none' && (
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                          {groupedRow?.count}
                        </td>
                      )}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(row.payment)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right font-light">
                        {formatCurrency(row.principal)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right font-light">
                        {formatCurrency(row.interest)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-light">
                        {formatCurrency(row.balance)}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MortgageCalculator = () => {
  // Use custom hooks for number inputs - eliminates ~150 lines of repetitive code
  const homeValueInput = useNumberInput(400000, 400000, 'homeValue');
  const downPaymentInput = useNumberInput(80000, 80000, 'downPayment', (val) => Math.min(val, homeValueInput.value));
  const interestRateInput = useNumberInput(6.5, 6.5, 'interestRate');
  const tenureInput = useNumberInput(30, 30, 'tenure', (val) => Math.floor(val));
  const extraPaymentAmountInput = useNumberInput(0, 0, 'extraPaymentAmount');
  
  const [startDate, setStartDate] = useState('2025-01');
  const [paymentType, setPaymentType] = useState('monthly');
  const [extraPaymentEnabled, setExtraPaymentEnabled] = useState(false);
  const [extraPaymentStartDate, setExtraPaymentStartDate] = useState('2025-01');
  const [extraPaymentFrequency, setExtraPaymentFrequency] = useState('monthly');
  
  // Multiple one-time payments
  const [oneTimePayments, setOneTimePayments] = useState<Array<{id: string, date: string, amount: number}>>([]);
  
  // For down payment percentage input (special case - bidirectional sync)
  const [editingDownPaymentPercent, setEditingDownPaymentPercent] = useState(false);
  const [rawDownPaymentPercent, setRawDownPaymentPercent] = useState('');
  
  // Convenience aliases for backward compatibility
  const homeValue = homeValueInput.value;
  const downPayment = downPaymentInput.value;
  const interestRate = interestRateInput.value;
  const tenure = tenureInput.value;
  const extraPaymentAmount = extraPaymentAmountInput.value;

  // Auto-update extra payment frequency when payment type changes
  useEffect(() => {
    if (paymentType === 'biweekly' && extraPaymentFrequency === 'monthly' && extraPaymentEnabled) {
      setExtraPaymentFrequency('biweekly');
    }
  }, [paymentType, extraPaymentEnabled]);

  const calculateMonthlyAmortization = (
    principal: number, 
    annualRate: number, 
    years: number, 
    start: string,
    extraPaymentEnabled: boolean = false,
    extraPaymentStartDate: string = '',
    extraPaymentFrequency: string = 'monthly',
    extraPaymentAmount: number = 0,
    oneTimePayments: Array<{id: string, date: string, amount: number}> = []
  ) => {
    const monthlyRate = annualRate / 12;
    const totalPayments = years * 12;
    
    // Calculate monthly payment
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                          (Math.pow(1 + monthlyRate, totalPayments) - 1);
    
    let balance = principal;
    const schedule: ScheduleItem[] = [];
    let totalInterestPaid = 0;
    let totalPaid = 0;
    // Parse date in local timezone to avoid timezone issues
    const [startYear, startMonth] = start.split('-').map(Number);
    let currentDate = new Date(startYear, startMonth - 1, 1);
    const extraStartDate = extraPaymentEnabled && extraPaymentStartDate ? (() => {
      const [year, month] = extraPaymentStartDate.split('-').map(Number);
      return new Date(year, month - 1, 1);
    })() : null;
    let extraPaymentMade = false; // For one-time payments
    const appliedOneTimePayments = new Set<string>(); // Track which one-time payments have been applied
    
    for (let i = 1; i <= totalPayments && balance > 0.01; i++) {
      const interestPayment = balance * monthlyRate;
      let principalPayment = monthlyPayment - interestPayment;
      
      // Apply extra payments using shared logic
      const extraPaymentMadeRef: { value: boolean } = { value: extraPaymentMade };
      const extraPrincipal = applyExtraPayments(
        currentDate,
        balance,
        principalPayment,
        0,
        extraPaymentEnabled,
        extraPaymentAmount,
        extraStartDate,
        extraPaymentFrequency,
        extraPaymentMadeRef,
        oneTimePayments,
        appliedOneTimePayments
      );
      extraPaymentMade = extraPaymentMadeRef.value;
      
      principalPayment += extraPrincipal;
      
      // Final check: if this would pay off the loan, adjust to exact balance
      if (balance - principalPayment < 0.01) {
        principalPayment = balance;
        balance = 0;
      } else {
        balance -= principalPayment;
      }
      
      totalInterestPaid += interestPayment;
      // Total payment is the actual amount paid (regular payment + extra, but not more than needed)
      const totalPayment = interestPayment + principalPayment;
      totalPaid += totalPayment;
      
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      
      schedule.push({
        paymentNum: i,
        date: `${year}-${month}`,
        payment: totalPayment, // Actual payment made (interest + principal)
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
        totalInterest: totalInterestPaid
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
      
      if (balance < 0.01) break;
    }
    
    const endDate = schedule.length > 0 ? schedule[schedule.length - 1].date : start;
    const yearsToPayoff = schedule.length / 12;
    
    return {
      loanAmount: principal,
      paymentAmount: monthlyPayment,
      totalPayments: schedule.length,
      totalPaid: totalPaid,
      totalInterest: totalInterestPaid,
      endDate: endDate,
      schedule,
      yearsToPayoff: yearsToPayoff
    };
  };

  const calculateBiweeklyAmortization = (
    principal: number, 
    annualRate: number, 
    monthlyPayment: number, 
    start: string,
    extraPaymentEnabled: boolean = false,
    extraPaymentStartDate: string = '',
    extraPaymentFrequency: string = 'biweekly',
    extraPaymentAmount: number = 0,
    oneTimePayments: Array<{id: string, date: string, amount: number}> = []
  ) => {
    // Biweekly payment is half of monthly payment (standard approach)
    const biweeklyPayment = monthlyPayment / 2;
    
    // Interest is compounded monthly, but for bi-weekly payments,
    // we calculate interest for each 14-day period using daily rate
    const dailyRate = annualRate / 365;
    
    let balance = principal;
    const schedule: ScheduleItem[] = [];
    let totalInterestPaid = 0;
    let totalPaid = 0;
    // Parse date in local timezone to avoid timezone issues
    const [startYear, startMonth] = start.split('-').map(Number);
    let currentDate = new Date(startYear, startMonth - 1, 1);
    const extraStartDate = extraPaymentEnabled && extraPaymentStartDate ? (() => {
      const [year, month] = extraPaymentStartDate.split('-').map(Number);
      return new Date(year, month - 1, 1);
    })() : null;
    let extraPaymentMade = false; // For one-time payments
    const appliedOneTimePayments = new Set<string>(); // Track which one-time payments have been applied
    let paymentNum = 1;
    
    // Continue until loan is paid off
    while (balance > 0.01 && paymentNum <= 2000) {
      // Calculate interest for 14-day period: Balance × Daily Rate × 14
      const interestPayment = balance * dailyRate * 14;
      
      // Calculate principal payment: biweekly payment minus interest
      let principalPayment = biweeklyPayment - interestPayment;
      
      // Apply extra payments using shared logic
      const extraPaymentMadeRef: { value: boolean } = { value: extraPaymentMade };
      const extraPrincipal = applyExtraPayments(
        currentDate,
        balance,
        principalPayment,
        0,
        extraPaymentEnabled,
        extraPaymentAmount,
        extraStartDate,
        extraPaymentFrequency,
        extraPaymentMadeRef,
        oneTimePayments,
        appliedOneTimePayments
      );
      extraPaymentMade = extraPaymentMadeRef.value;
      
      principalPayment += extraPrincipal;
      
      // Final check: if this would pay off the loan, adjust to exact balance
      if (balance - principalPayment < 0.01) {
        principalPayment = balance;
        balance = 0;
      } else {
        balance -= principalPayment;
      }
      
      // Ensure we don't go negative on principal payment
      if (principalPayment < 0) {
        break;
      }
      
      totalInterestPaid += interestPayment;
      // Total payment is the actual amount paid (interest + principal)
      const actualPayment = interestPayment + principalPayment;
      totalPaid += actualPayment;
      
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      
      schedule.push({
        paymentNum: paymentNum,
        date: `${year}-${month}`,
        payment: actualPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
        totalInterest: totalInterestPaid
      });
      
      // Advance by 14 days
      currentDate.setDate(currentDate.getDate() + 14);
      paymentNum++;
      
      if (balance < 0.01) break;
    }
    
    const yearsToPayoff = schedule.length / 26;
    const endDate = schedule.length > 0 ? schedule[schedule.length - 1].date : start;
    
    return {
      loanAmount: principal,
      paymentAmount: biweeklyPayment,
      totalPayments: schedule.length,
      totalPaid: totalPaid,
      totalInterest: totalInterestPaid,
      endDate: endDate,
      schedule,
      yearsToPayoff: yearsToPayoff
    };
  };

  const calculations = useMemo(() => {
    const principal = homeValue - downPayment;
    const annualRate = interestRate / 100;
    
    // Check if any extra payments are configured
    const hasExtraPayments = (extraPaymentEnabled && extraPaymentAmount > 0) || oneTimePayments.length > 0;
    
    // Determine extra payment frequency based on payment type
    const effectiveExtraFrequency = extraPaymentEnabled 
      ? (extraPaymentFrequency === 'biweekly' && paymentType === 'biweekly' ? 'biweekly' : 'monthly')
      : 'monthly';
    
    // Calculate baseline monthly (no extra payments)
    const monthlyCalcBase = calculateMonthlyAmortization(
      principal, 
      annualRate, 
      tenure, 
      startDate,
      false,
      extraPaymentStartDate,
      'monthly',
      0,
      []
    );
    
    // Calculate baseline biweekly (no extra payments)
    const biweeklyCalcBase = calculateBiweeklyAmortization(
      principal, 
      annualRate, 
      monthlyCalcBase.paymentAmount, 
      startDate,
      false,
      extraPaymentStartDate,
      'biweekly',
      0,
      []
    );
    
    if (hasExtraPayments) {
      // If extra payments are enabled, compare selected payment type WITH vs WITHOUT extra payments
      if (paymentType === 'monthly') {
        const monthlyWithExtra = calculateMonthlyAmortization(
          principal, 
          annualRate, 
          tenure, 
          startDate,
          extraPaymentEnabled && effectiveExtraFrequency === 'monthly',
          extraPaymentStartDate,
          'monthly',
          extraPaymentAmount,
          oneTimePayments
        );
        return {
          ...monthlyWithExtra,
          comparison: monthlyCalcBase,
          comparisonMode: 'extra-payments'
        };
      } else {
        const biweeklyWithExtra = calculateBiweeklyAmortization(
          principal, 
          annualRate, 
          monthlyCalcBase.paymentAmount, 
          startDate,
          extraPaymentEnabled && effectiveExtraFrequency === 'biweekly',
          extraPaymentStartDate,
          'biweekly',
          extraPaymentAmount,
          oneTimePayments
        );
        return {
          ...biweeklyWithExtra,
          comparison: biweeklyCalcBase,
          comparisonMode: 'extra-payments'
        };
      }
    } else {
      // Default: compare monthly vs biweekly
      if (paymentType === 'monthly') {
        return {
          ...monthlyCalcBase,
          comparison: biweeklyCalcBase,
          comparisonMode: 'payment-types'
        };
      } else {
        return {
          ...biweeklyCalcBase,
          comparison: monthlyCalcBase,
          comparisonMode: 'payment-types'
        };
      }
    }
  }, [homeValue, downPayment, interestRate, tenure, startDate, paymentType, extraPaymentEnabled, extraPaymentStartDate, extraPaymentFrequency, extraPaymentAmount, oneTimePayments]);

  const chartData = useMemo(() => {
    const sampleRate = Math.max(1, Math.floor(calculations.schedule.length / 200));
    return calculations.schedule.filter((_, i) => i % sampleRate === 0 || i === calculations.schedule.length - 1);
  }, [calculations.schedule]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatCurrencyCompact = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(0)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  };

  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    return `${new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'short' })} ${year}`;
  };

  const formatYearsMonths = (years: number) => {
    const wholeYears = Math.floor(years);
    const months = Math.round((years - wholeYears) * 12);
    if (months === 0) return `${wholeYears} years`;
    return `${wholeYears} years ${months} ${months === 1 ? 'month' : 'months'}`;
  };

  const downPaymentPercent = (downPayment / homeValue) * 100;

  // Calculate savings based on comparison mode
  const isExtraPaymentComparison = calculations.comparisonMode === 'extra-payments';
  const primaryCalc = calculations;
  const comparisonCalc = calculations.comparison;
  
  // For extra payments: comparison (without) - primary (with) = positive savings
  // For payment types: always monthly - biweekly = positive savings (biweekly is better)
  let interestSaved, timeSaved, totalSaved;
  
  if (isExtraPaymentComparison) {
    // Comparing with vs without extra payments
    // comparisonCalc = without extra, primaryCalc = with extra
    interestSaved = comparisonCalc.totalInterest - primaryCalc.totalInterest;
    timeSaved = comparisonCalc.yearsToPayoff - primaryCalc.yearsToPayoff;
    totalSaved = comparisonCalc.totalPaid - primaryCalc.totalPaid;
  } else {
    // Comparing monthly vs biweekly
    // Always show savings as: monthly - biweekly (biweekly saves money)
    const monthlyCalc = paymentType === 'monthly' ? primaryCalc : comparisonCalc;
    const biweeklyCalc = paymentType === 'biweekly' ? primaryCalc : comparisonCalc;
    interestSaved = monthlyCalc.totalInterest - biweeklyCalc.totalInterest;
    timeSaved = monthlyCalc.yearsToPayoff - biweeklyCalc.yearsToPayoff;
    totalSaved = monthlyCalc.totalPaid - biweeklyCalc.totalPaid;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-50 p-2 md:p-4 relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(100, 116, 139, 0.08) 0%, transparent 50%), radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.05) 0%, transparent 60%)' }}>
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-slate-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-3">
          <h1 className="text-2xl font-serif text-slate-800 mb-1 tracking-wide font-bold animate-fadeIn">Mortgage Calculator</h1>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto opacity-60 animate-slideIn"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 bg-gradient-to-br from-white/90 via-white/85 to-blue-50/40 rounded-xl shadow-xl border-2 border-blue-100/50 p-3 space-y-3 backdrop-blur-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative group" style={{ overflowX: 'visible', overflowY: 'visible', minWidth: '320px', boxShadow: '0 10px 40px rgba(59, 130, 246, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5) inset' }}>
            {/* Decorative corner accents */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-transparent rounded-bl-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-indigo-400/20 to-transparent rounded-tr-full pointer-events-none"></div>
            
            <h2 className="text-base font-serif text-slate-800 mb-2 tracking-wide border-b-2 border-gradient-to-r from-blue-400 to-slate-300 pb-1.5 font-bold relative" style={{ borderImage: 'linear-gradient(to right, rgb(96, 165, 250), rgb(203, 213, 225)) 1' }}>
              Loan Details
              <div className="absolute -bottom-0.5 left-0 w-12 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse"></div>
            </h2>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider" style={{ color: '#334155' }}>
                Home Value
              </label>
              <input
                type="text"
                value={homeValueInput.displayValue}
                onChange={(e) => homeValueInput.handleChange(e.target.value)}
                onFocus={homeValueInput.handleFocus}
                onBlur={homeValueInput.handleBlur}
                className={INPUT_STYLE}
                style={{ overflow: 'visible' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider" style={{ color: '#334155' }}>
                Down Payment
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={downPaymentInput.displayValue}
                    onChange={(e) => downPaymentInput.handleChange(e.target.value)}
                    onFocus={downPaymentInput.handleFocus}
                    onBlur={downPaymentInput.handleBlur}
                    className={INPUT_STYLE}
                    style={{ overflow: 'visible' }}
                    placeholder="Amount"
                  />
                </div>
                <div className="text-blue-400 text-lg font-light">|</div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={editingDownPaymentPercent 
                      ? rawDownPaymentPercent
                      : ((downPayment / homeValue) * 100).toFixed(1)}
                    onChange={(e) => {
                      setEditingDownPaymentPercent(true);
                      const cleaned = e.target.value.replace(/,/g, '');
                      setRawDownPaymentPercent(cleaned);
                      if (cleaned && /^\d*\.?\d*$/.test(cleaned)) {
                        const percent = Number(cleaned);
                        if (!isNaN(percent) && percent >= 0 && percent <= 100) {
                          downPaymentInput.setValue((homeValue * percent) / 100);
                        }
                      }
                    }}
                    onFocus={() => {
                      setEditingDownPaymentPercent(true);
                      setRawDownPaymentPercent(((downPayment / homeValue) * 100).toFixed(1));
                    }}
                    onBlur={() => {
                      setEditingDownPaymentPercent(false);
                      setRawDownPaymentPercent('');
                    }}
                    className={INPUT_STYLE}
                    style={{ overflow: 'visible' }}
                    placeholder="%"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider" style={{ color: '#334155' }}>
                Interest Rate (%)
              </label>
              <input
                type="text"
                value={interestRateInput.displayValue}
                onChange={(e) => interestRateInput.handleChange(e.target.value)}
                onFocus={interestRateInput.handleFocus}
                onBlur={interestRateInput.handleBlur}
                className={INPUT_STYLE}
                style={{ overflow: 'visible' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider" style={{ color: '#334155' }}>
                Loan Tenure (Years)
              </label>
              <input
                type="text"
                value={tenureInput.displayValue}
                onChange={(e) => tenureInput.handleChange(e.target.value)}
                onFocus={tenureInput.handleFocus}
                onBlur={tenureInput.handleBlur}
                className={INPUT_STYLE}
                style={{ overflow: 'visible' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider" style={{ color: '#334155' }}>
                  Payment Frequency
                  <HelpTooltip text="Bi-weekly = 26 payments/year, resulting in one extra payment annually. This saves significant interest vs. monthly payments." />
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 text-sm bg-white shadow-sm hover:shadow-md hover:border-blue-300 focus:scale-[1.02] focus:bg-blue-50/30"
                style={{ overflow: 'visible' }}
                >
                  <option value="monthly">Monthly</option>
                  <option value="biweekly">Bi-weekly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider" style={{ color: '#334155' }}>
                  Start Date
                </label>
                <MonthYearPicker
                  value={startDate}
                  onChange={setStartDate}
                  className="w-full"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="extraPaymentEnabled"
                  checked={extraPaymentEnabled}
                  onChange={(e) => setExtraPaymentEnabled(e.target.checked)}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <label htmlFor="extraPaymentEnabled" className="ml-2 flex items-center text-xs font-medium text-gray-700">
                  Recurring Extra Payments
                  <HelpTooltip text="Pay extra regularly to reduce loan term and total interest. Even small amounts make a big difference over time." />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-2 pl-4 border-l border-gray-300 mb-0">
                <div className="min-w-[110px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Start Date
                  </label>
                  <MonthYearPicker
                    value={extraPaymentStartDate}
                    onChange={setExtraPaymentStartDate}
                    className="w-full"
                    disabled={!extraPaymentEnabled}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Frequency
                  </label>
                  <select
                    value={extraPaymentFrequency}
                    onChange={(e) => setExtraPaymentFrequency(e.target.value)}
                    disabled={!extraPaymentEnabled}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors text-xs disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    style={{ overflow: 'visible' }}
                  >
                    <option value="monthly">Monthly</option>
                    {paymentType === 'biweekly' && (
                      <option value="biweekly">Bi-weekly</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Amount
                  </label>
                  <input
                    type="text"
                    value={extraPaymentAmountInput.displayValue}
                    onChange={(e) => extraPaymentAmountInput.handleChange(e.target.value)}
                    onFocus={extraPaymentAmountInput.handleFocus}
                    onBlur={extraPaymentAmountInput.handleBlur}
                    disabled={!extraPaymentEnabled}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors text-xs disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t-2 border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                  One-Time Extra Payments
                  <HelpTooltip text="Apply lump sum payments (bonus, tax refund) at specific dates to reduce principal faster." />
                </label>
                <button
                  onClick={() => {
                    setOneTimePayments([...oneTimePayments, {
                      id: Date.now().toString(),
                      date: startDate,
                      amount: 0
                    }]);
                  }}
                  className="text-xs bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all font-bold uppercase tracking-wide"
                >
                  + Add Payment
                </button>
              </div>

              {oneTimePayments.length > 0 && (
                <div className="space-y-2 pl-4 border-l border-gray-300">
                  {oneTimePayments.map((payment, index) => (
                    <div key={payment.id} className="grid grid-cols-3 gap-2 items-end">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Date
                        </label>
                        <MonthYearPicker
                          value={payment.date}
                          onChange={(value) => {
                            const updated = [...oneTimePayments];
                            updated[index].date = value;
                            setOneTimePayments(updated);
                          }}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Amount
                        </label>
                        <input
                          type="text"
                          value={payment.amount === 0 ? '' : payment.amount.toLocaleString()}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/,/g, '');
                            if (cleaned === '' || cleaned === '-') {
                              const updated = [...oneTimePayments];
                              updated[index].amount = 0;
                              setOneTimePayments(updated);
                            } else if (/^\d*\.?\d*$/.test(cleaned)) {
                              const num = Number(cleaned);
                              if (!isNaN(num) && num >= 0) {
                                const updated = [...oneTimePayments];
                                updated[index].amount = num;
                                setOneTimePayments(updated);
                              }
                            }
                          }}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors text-xs"
                          placeholder="$0"
                        />
                      </div>
                      <div>
                        <button
                          onClick={() => {
                            setOneTimePayments(oneTimePayments.filter(p => p.id !== payment.id));
                          }}
                          className="w-full text-xs bg-gradient-to-r from-rose-100 to-red-100 text-rose-700 px-3 py-1.5 rounded-lg hover:from-rose-200 hover:to-red-200 shadow-md hover:shadow-lg transition-all font-bold border-2 border-rose-300"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-2.5">
            <div className="bg-gradient-to-br from-white/90 via-white/85 to-slate-50/60 rounded-xl shadow-xl border-2 border-slate-200/50 p-2.5 backdrop-blur-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5 relative group" style={{ boxShadow: '0 8px 32px rgba(100, 116, 139, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.5) inset' }}>
              {/* Glass effect shine */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-xl pointer-events-none"></div>
              
              <h2 className="text-xs font-serif text-slate-800 mb-1.5 tracking-wide border-b-2 pb-1 font-bold relative" style={{ borderImage: 'linear-gradient(to right, rgb(148, 163, 184), rgb(203, 213, 225)) 1' }}>
                Payment Summary
                <div className="absolute -bottom-0.5 left-0 w-8 h-0.5 bg-gradient-to-r from-slate-500 to-blue-500 animate-pulse"></div>
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-slate-50">
                      <th className="text-center py-2 px-3 text-xs font-bold text-slate-700 uppercase tracking-wider">Loan Amount</th>
                      <th className="text-center py-2 px-3 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {paymentType === 'monthly' ? 'Monthly' : 'Bi-weekly'} Payment
                      </th>
                      <th className="text-center py-2 px-3 text-xs font-bold text-slate-700 uppercase tracking-wider">Payments & Duration</th>
                      <th className="text-center py-2 px-3 text-xs font-bold text-slate-700 uppercase tracking-wider">Total Paid</th>
                      <th className="text-center py-2 px-3 text-xs font-bold text-slate-700 uppercase tracking-wider">Total Interest</th>
                      <th className="text-center py-2 px-3 text-xs font-bold text-slate-700 uppercase tracking-wider">Loan End Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-2 px-3 text-center text-sm font-serif text-slate-800 border-b border-slate-100 font-medium">
                        {formatCurrency(calculations.loanAmount)}
                      </td>
                      <td className="py-2 px-3 text-center text-sm font-serif text-slate-800 border-b border-slate-100 font-medium">
                        {formatCurrency(calculations.paymentAmount)}
                      </td>
                      <td className="py-2 px-3 text-center text-sm font-serif text-slate-800 border-b border-slate-100 font-medium">
                        {calculations.totalPayments} payments · {formatYearsMonths(calculations.yearsToPayoff)}
                      </td>
                      <td className="py-2 px-3 text-center text-sm font-serif text-slate-800 border-b border-slate-100 font-medium">
                        {formatCurrency(calculations.totalPaid)}
                      </td>
                      <td className="py-2 px-3 text-center text-sm font-serif text-slate-800 border-b border-slate-100 font-medium">
                        {formatCurrency(calculations.totalInterest)}
                      </td>
                      <td className="py-2 px-3 text-center text-sm font-serif text-slate-800 border-b border-slate-100 font-medium">
                        {formatDate(calculations.endDate)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/90 via-white/85 to-slate-50/60 rounded-xl shadow-xl border-2 border-slate-200/50 p-2.5 backdrop-blur-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5 relative group" style={{ boxShadow: '0 8px 32px rgba(100, 116, 139, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.5) inset' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-xl pointer-events-none"></div>
              
              <h3 className="text-xs font-serif text-slate-800 mb-1.5 tracking-wide border-b-2 pb-1 font-bold relative flex items-center" style={{ borderImage: 'linear-gradient(to right, rgb(148, 163, 184), rgb(203, 213, 225)) 1' }}>
                Cost Breakdown
                <HelpTooltip text="Percentage of total paid that goes to principal (your equity) vs. interest (lender's profit)." />
                <div className="absolute -bottom-0.5 left-0 w-8 h-0.5 bg-gradient-to-r from-slate-500 to-emerald-500 animate-pulse"></div>
              </h3>
              <div className="flex flex-row gap-2 mb-2">
                 <div className="flex-1 text-center p-2.5 rounded-lg bg-gradient-to-br from-emerald-50/80 to-green-100/80 border-2 border-emerald-300/60 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-emerald-400 backdrop-blur-sm relative overflow-hidden group/card">
                   <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                   <div className="text-lg font-serif text-emerald-900 mb-0.5 font-bold relative z-10">
                     {((calculations.loanAmount / calculations.totalPaid) * 100).toFixed(1)}%
                   </div>
                   <div className="text-xs text-emerald-700 uppercase tracking-wider font-bold relative z-10">Principal</div>
                   <div className="text-xs text-emerald-700 font-semibold mt-0.5 relative z-10">{formatCurrency(calculations.loanAmount)}</div>
                 </div>
                 <div className="flex-1 text-center p-2.5 rounded-lg bg-gradient-to-br from-rose-50/80 to-red-100/80 border-2 border-rose-300/60 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-rose-400 backdrop-blur-sm relative overflow-hidden group/card">
                   <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                   <div className="text-lg font-serif text-rose-900 mb-0.5 font-bold relative z-10">
                     {((calculations.totalInterest / calculations.totalPaid) * 100).toFixed(1)}%
                   </div>
                   <div className="text-xs text-rose-700 uppercase tracking-wider font-bold relative z-10">Interest</div>
                   <div className="text-xs text-rose-700 font-semibold mt-0.5 relative z-10">{formatCurrency(calculations.totalInterest)}</div>
                 </div>
              </div>
              
              {/* Visual Breakdown Bar */}
              <div className="mt-1.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-semibold text-slate-600">Total Payment</span>
                  <span className="text-[10px] font-bold text-slate-800">{formatCurrency(calculations.totalPaid)}</span>
                </div>
                <div className="flex h-5 rounded-lg overflow-hidden shadow-inner border-2 border-slate-200">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 flex items-center justify-center text-[9px] font-bold text-white transition-all duration-500"
                    style={{ width: `${((calculations.loanAmount / calculations.totalPaid) * 100).toFixed(1)}%` }}
                  >
                    {((calculations.loanAmount / calculations.totalPaid) * 100).toFixed(0)}%
                  </div>
                  <div 
                    className="bg-gradient-to-r from-red-400 to-red-500 flex items-center justify-center text-[9px] font-bold text-white transition-all duration-500"
                    style={{ width: `${((calculations.totalInterest / calculations.totalPaid) * 100).toFixed(1)}%` }}
                  >
                    {((calculations.totalInterest / calculations.totalPaid) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly vs Bi-weekly Comparison */}
            <div className="bg-gradient-to-br from-white/90 via-white/85 to-slate-50/60 rounded-xl shadow-xl border-2 border-slate-200/50 p-2.5 backdrop-blur-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5 relative group" style={{ boxShadow: '0 8px 32px rgba(100, 116, 139, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.5) inset' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-xl pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-400/10 to-transparent rounded-bl-full pointer-events-none"></div>
              
              <div className="mb-1.5 border-b-2 pb-1.5 relative" style={{ borderImage: 'linear-gradient(to right, rgb(148, 163, 184), rgb(203, 213, 225)) 1' }}>
                <h2 className="text-xs font-serif text-slate-800 tracking-wide mb-0.5 font-bold">
                  Payment Plan Comparison
                  <div className="absolute -bottom-0.5 left-0 w-8 h-0.5 bg-gradient-to-r from-slate-500 to-green-500 animate-pulse"></div>
                </h2>
                <p className="text-xs font-semibold text-blue-600 italic">
                  {isExtraPaymentComparison 
                    ? 'Regular vs Extra Payments' 
                    : 'Monthly vs Bi-weekly'}
                </p>
              </div>
              <p className="text-xs text-slate-600 leading-tight mb-1.5 italic font-medium">
                {isExtraPaymentComparison 
                  ? 'Extra payments reduce interest and loan term. See savings below.'
                  : 'Bi-weekly payments save thousands in interest and years off your loan.'}
              </p>
              
              <div className="mb-1.5">
                <h3 className="text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Savings
                </h3>
                <div className="flex flex-row gap-2">
                   <div className="flex-1 text-center p-2 rounded-lg bg-gradient-to-br from-emerald-50/80 to-green-100/80 border-2 border-emerald-300/60 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm relative overflow-hidden group/savings">
                     <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-emerald-100/30 opacity-0 group-hover/savings:opacity-100 transition-opacity duration-300"></div>
                     <div className="absolute inset-0 bg-gradient-to-t from-emerald-200/20 to-transparent opacity-0 group-hover/savings:opacity-100 transition-opacity duration-300"></div>
                     <div className="text-base font-serif text-emerald-900 mb-0.5 font-bold relative z-10">
                       {formatCurrency(interestSaved)}
                     </div>
                     <div className="text-xs text-emerald-700 uppercase tracking-wider font-bold relative z-10">Interest Saved</div>
                   </div>
                   <div className="flex-1 text-center p-2 rounded-lg bg-gradient-to-br from-emerald-50/80 to-green-100/80 border-2 border-emerald-300/60 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm relative overflow-hidden group/savings">
                     <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-emerald-100/30 opacity-0 group-hover/savings:opacity-100 transition-opacity duration-300"></div>
                     <div className="absolute inset-0 bg-gradient-to-t from-emerald-200/20 to-transparent opacity-0 group-hover/savings:opacity-100 transition-opacity duration-300"></div>
                     <div className="text-base font-serif text-emerald-900 mb-0.5 font-bold relative z-10">
                       {formatYearsMonths(timeSaved)}
                     </div>
                     <div className="text-xs text-emerald-700 uppercase tracking-wider font-bold relative z-10">Time Saved</div>
                   </div>
                </div>
              </div>

              {/* Bar Chart - Interest Paid Comparison with Clear Labels */}
              <div className="mt-0.5">
                <h3 className="text-xs font-bold text-slate-800 mb-0.5">
                  {isExtraPaymentComparison 
                    ? 'Impact of Extra Payments on Total Interest' 
                    : 'Total Interest Paid by Payment Plan'}
                </h3>
                <div className="flex justify-end gap-4 mb-1 text-xs pr-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gradient-to-br from-red-400 to-red-600 shadow-sm"></div>
                    <span className="text-slate-700 font-semibold">
                      {isExtraPaymentComparison ? 'Without Extra Payments' : 'Monthly Plan'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gradient-to-br from-green-400 to-green-600 shadow-sm"></div>
                    <span className="text-slate-700 font-semibold">
                      {isExtraPaymentComparison ? 'With Extra Payments' : 'Bi-weekly Plan'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-center">
                <ResponsiveContainer width="75%" height={200}>
                <BarChart
                  data={[
                    {
                      label: isExtraPaymentComparison 
                        ? `Without Extra Payments`
                        : 'Monthly Payments',
                      endDate: formatDate(isExtraPaymentComparison ? comparisonCalc.endDate : (paymentType === 'monthly' ? primaryCalc.endDate : comparisonCalc.endDate)),
                      interest: isExtraPaymentComparison ? comparisonCalc.totalInterest : (paymentType === 'monthly' ? primaryCalc.totalInterest : comparisonCalc.totalInterest),
                      type: 'comparison',
                    },
                    {
                      label: isExtraPaymentComparison 
                        ? `With Extra Payments`
                        : 'Bi-weekly Payments',
                      endDate: formatDate(isExtraPaymentComparison ? primaryCalc.endDate : (paymentType === 'monthly' ? comparisonCalc.endDate : primaryCalc.endDate)),
                      interest: isExtraPaymentComparison ? primaryCalc.totalInterest : (paymentType === 'monthly' ? comparisonCalc.totalInterest : primaryCalc.totalInterest),
                      type: 'primary',
                    }
                  ]}
                  margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="redBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="greenBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={1}/>
                    </linearGradient>
                    <filter id="barShadow">
                      <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.3"/>
                    </filter>
                    <filter id="barGlow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                    textAnchor="middle"
                    height={30}
                    stroke="#cbd5e1"
                  />
                  <YAxis 
                    domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]}
                    tickFormatter={(value) => formatCurrencyCompact(value)}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                    stroke="#cbd5e1"
                    label={{ value: 'Total Interest Paid', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#475569', fontSize: 11, fontWeight: 600 } }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border-2 border-slate-200 rounded-xl p-3 shadow-xl">
                            <p className="text-sm font-bold text-slate-800 mb-2">{data.label}</p>
                            <p className="text-lg font-bold text-blue-600">{formatCurrency(data.interest)}</p>
                            <p className="text-xs text-slate-600 mt-1">Total Interest</p>
                            <div className="border-t border-slate-200 mt-2 pt-2">
                              <p className="text-xs text-slate-600">Paid off by: <span className="font-semibold text-slate-800">{data.endDate}</span></p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  />
                  <Bar 
                    dataKey="interest"
                    radius={[8, 8, 0, 0]}
                    animationDuration={800}
                    animationEasing="ease-out"
                    shape={(props: any) => {
                      const { payload, x, y, width, height } = props;
                      const isComparison = payload.type === 'comparison';
                      const fillUrl = isComparison ? 'url(#redBarGradient)' : 'url(#greenBarGradient)';
                      
                      return (
                        <g filter="url(#barShadow)">
                          <rect 
                            x={x} 
                            y={y} 
                            width={width} 
                            height={height} 
                            fill={fillUrl} 
                            rx={8}
                            style={{
                              transition: 'all 0.3s ease',
                            }}
                          />
                          {/* Shine effect overlay */}
                          <rect 
                            x={x} 
                            y={y} 
                            width={width} 
                            height={height * 0.3} 
                            fill="url(#barShine)" 
                            rx={8}
                            opacity={0.3}
                          />
                        </g>
                      );
                    }}
                  >
                    <LabelList 
                      dataKey="interest" 
                      position="top" 
                      formatter={(value: number) => formatCurrency(value)}
                      style={{ 
                        fill: '#1e293b', 
                        fontSize: '11px', 
                        fontWeight: 700,
                        textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)'
                      }}
                    />
                  </Bar>
                </BarChart>
                </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 bg-gradient-to-br from-white via-white to-blue-50/20 rounded-xl shadow-xl border-2 border-slate-200 p-3 backdrop-blur-sm" style={{ boxShadow: '0 12px 40px rgba(100, 116, 139, 0.1)' }}>
          <div className="flex items-center justify-between mb-2 border-b-2 pb-2" style={{ borderImage: 'linear-gradient(to right, rgb(148, 163, 184), rgb(203, 213, 225)) 1' }}>
            <h2 className="text-base font-serif text-slate-800 tracking-wide font-bold">
              Amortization Overview
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-blue-600 italic font-semibold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span>Scroll for details</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="balanceGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#6366f1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="principalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#34d399" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="interestGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#f87171" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#fca5a5" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#fbbf24" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#fcd34d" stopOpacity={0.05}/>
                </linearGradient>
                <filter id="lineShadow2">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => {
                  const [year, month] = value.split('-');
                  return `${month}/${year.slice(2)}`;
                }}
                interval="preserveStartEnd"
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
              />
              <YAxis 
                yAxisId="left"
                tickFormatter={(value) => formatCurrencyCompact(value)}
                stroke="#4f46e5"
                tick={{ fontSize: 11, fill: '#4f46e5', fontWeight: 600 }}
                label={{ 
                  value: 'Balance', 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { fill: '#4f46e5', fontSize: 11, fontWeight: 700 } 
                }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => formatCurrencyCompact(value)}
                stroke="#10b981"
                tick={{ fontSize: 11, fill: '#10b981', fontWeight: 600 }}
                label={{ 
                  value: 'Payments', 
                  angle: 90, 
                  position: 'insideRight', 
                  style: { fill: '#10b981', fontSize: 11, fontWeight: 700 } 
                }}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(Array.isArray(value) ? value[0] as number : value as number)}
                labelFormatter={(label) => formatDate(label as string)}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                  backdropFilter: 'blur(10px)',
                  padding: '12px'
                }}
                cursor={{ stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '5 5' }}
              />
              <Legend 
                wrapperStyle={{
                  paddingTop: '20px',
                  fontWeight: 600
                }}
                iconType="line"
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="balance" 
                stroke="#4f46e5" 
                strokeWidth={3}
                dot={false}
                name="Remaining Balance"
                fill="url(#balanceGradient2)"
                fillOpacity={1}
                activeDot={{ 
                  r: 8, 
                  strokeWidth: 3, 
                  fill: '#4f46e5',
                  stroke: '#fff'
                }}
                animationDuration={1500}
                animationEasing="ease-in-out"
                filter="url(#lineShadow2)"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="principal" 
                stroke="#10b981" 
                strokeWidth={2.5}
                dot={false}
                name="Principal Payment"
                fill="url(#principalGradient)"
                fillOpacity={0.8}
                activeDot={{ 
                  r: 7, 
                  strokeWidth: 2, 
                  fill: '#10b981',
                  stroke: '#fff'
                }}
                animationDuration={1500}
                animationEasing="ease-in-out"
                animationBegin={100}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="interest" 
                stroke="#ef4444" 
                strokeWidth={2.5}
                dot={false}
                name="Interest Payment"
                fill="url(#interestGradient2)"
                fillOpacity={0.8}
                activeDot={{ 
                  r: 7, 
                  strokeWidth: 2, 
                  fill: '#ef4444',
                  stroke: '#fff'
                }}
                animationDuration={1500}
                animationEasing="ease-in-out"
                animationBegin={200}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="totalInterest" 
                stroke="#f59e0b" 
                strokeWidth={2.5}
                dot={false}
                strokeDasharray="5 5"
                name="Cumulative Interest"
                fill="url(#cumulativeGradient)"
                fillOpacity={0.6}
                activeDot={{ 
                  r: 7, 
                  strokeWidth: 2, 
                  fill: '#f59e0b',
                  stroke: '#fff'
                }}
                animationDuration={1500}
                animationEasing="ease-in-out"
                animationBegin={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <AmortizationTable 
          schedule={calculations.schedule}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      </div>
    </div>
  );
};

export default MortgageCalculator;