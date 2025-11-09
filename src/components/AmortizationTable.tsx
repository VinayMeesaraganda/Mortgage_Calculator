// Amortization Schedule Table Component

import React, { useState, useMemo, memo, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ScheduleItem, GroupedScheduleItem, GroupByOption } from '../types/mortgage';
import { formatCurrency, formatDate } from '../utils/formatting';
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '../constants/styles';

interface AmortizationTableProps {
  schedule: ScheduleItem[];
}

const AmortizationTableComponent: React.FC<AmortizationTableProps> = ({ schedule }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupByOption>('year');
  
  // Memoize CSV export function to prevent recreation on every render
  const exportToCSV = useCallback(() => {
    const headers = ['Payment #', 'Date', 'Payment', 'Principal', 'Interest', 'Balance', 'Total Interest'];
    
    const rows = schedule.map(item => [
      item.paymentNum.toString(),
      formatDate(item.date),
      item.payment.toFixed(2),
      item.principal.toFixed(2),
      item.interest.toFixed(2),
      item.balance.toFixed(2),
      item.totalInterest.toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `amortization_schedule_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [schedule]);
  
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
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-2 mb-6 relative">
        <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-800 tracking-tight">
          Amortization Schedule
          <div className="absolute -bottom-1 left-0 w-16 h-0.5 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={exportToCSV}
            className={`${BUTTON_PRIMARY} w-full sm:w-auto justify-center`}
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
            className={`${BUTTON_SECONDARY} flex items-center justify-center gap-2 w-full sm:w-auto`}
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
          
          {/* Desktop Table View - hidden on mobile */}
          <div className="hidden sm:block overflow-x-auto">
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

          {/* Mobile Card View - visible only on mobile */}
          <div className="sm:hidden max-h-96 overflow-y-auto space-y-3">
            {groupedSchedule.map((row, idx) => {
              const groupedRow = groupBy !== 'none' ? row as GroupedScheduleItem : null;
              return (
                <div key={idx} className="bg-white rounded-lg border-2 border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3 border-b border-slate-200 pb-2">
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase">
                        {groupBy === 'none' ? 'Payment' : 'Period'}
                      </div>
                      <div className="text-lg font-bold text-slate-800">
                        {groupBy === 'none' ? `#${row.paymentNum}` : (groupBy === 'year' ? `Year ${idx + 1}` : groupedRow?.displayDate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-500 uppercase">Date</div>
                      <div className="text-sm font-semibold text-slate-700">
                        {groupBy === 'none' ? formatDate(row.date) : groupedRow?.displayDate}
                      </div>
                    </div>
                  </div>
                  
                  {groupBy !== 'none' && groupedRow?.count && (
                    <div className="mb-2 pb-2 border-b border-slate-100">
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold">{groupedRow.count}</span> payments
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs font-semibold text-slate-500">Payment</div>
                      <div className="text-base font-bold text-slate-800">{formatCurrency(row.payment)}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500">Balance</div>
                      <div className="text-base font-bold text-blue-600">{formatCurrency(row.balance)}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500">Principal</div>
                      <div className="text-sm font-medium text-green-600">{formatCurrency(row.principal)}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500">Interest</div>
                      <div className="text-sm font-medium text-red-600">{formatCurrency(row.interest)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Export memoized version to prevent unnecessary re-renders
export const AmortizationTable = memo(AmortizationTableComponent);

