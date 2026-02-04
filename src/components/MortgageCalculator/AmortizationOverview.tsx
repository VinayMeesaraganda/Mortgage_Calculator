import React from 'react';
import { BarChart3, Table2 } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { AmortizationTable } from '../AmortizationTable';
import { formatCurrency, formatCurrencyCompact, formatDate } from '../../utils/formatting';
import { CURRENCY_DATA } from '../../utils/currency';
import type { ScheduleItem } from '../../types/mortgage';

interface ChartDatum {
  date: string;
  balance: number;
  principal: number;
  interest: number;
}

interface AmortizationOverviewProps {
  amortizationView: 'chart' | 'table';
  onViewChange: (view: 'chart' | 'table') => void;
  chartData: ChartDatum[];
  schedule: ScheduleItem[];
  loanAmount: number;
  totalInterest: number;
  startDate: string;
  endDate: string;
  yearsToPayoff: number;
  selectedCurrency: keyof typeof CURRENCY_DATA;
}

const AmortizationOverview: React.FC<AmortizationOverviewProps> = ({
  amortizationView,
  onViewChange,
  chartData,
  schedule,
  loanAmount,
  totalInterest,
  startDate,
  endDate,
  yearsToPayoff,
  selectedCurrency
}) => {
  return (
    <div className="mt-4 bg-gradient-to-br from-white/90 via-white/85 to-blue-50/40 rounded-xl shadow-xl border-2 border-blue-100/50 p-4 backdrop-blur-md hover:shadow-2xl transition-all duration-300 relative group" style={{ boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5) inset' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-xl pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-transparent rounded-bl-full"></div>

      <div className="flex items-center justify-between mb-3 relative">
        <h2 className="text-base font-serif font-bold text-slate-800 tracking-tight">
          Amortization Overview
          <div className="absolute -bottom-0.5 left-0 w-16 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        </h2>

        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => onViewChange('chart')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-md transition-all duration-200 ${amortizationView === 'chart'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
          >
            <BarChart3 size={14} />
            Graph
          </button>
          <button
            onClick={() => onViewChange('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-md transition-all duration-200 ${amortizationView === 'table'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
          >
            <Table2 size={14} />
            Table
          </button>
        </div>
      </div>

      {amortizationView === 'chart' ? (
        <>
          <div className="sr-only">
            <h3>Amortization Overview Chart</h3>
            <p>Area chart showing mortgage amortization over time with three data series: Remaining Balance (decreasing from {formatCurrency(loanAmount)} to {CURRENCY_DATA[selectedCurrency].symbol}0), Principal Paid (increasing from {CURRENCY_DATA[selectedCurrency].symbol}0 to {formatCurrency(loanAmount)}), and Cumulative Interest (increasing to {formatCurrency(totalInterest)}). The chart spans from {formatDate(startDate)} to {formatDate(endDate)}.</p>
          </div>
          <ResponsiveContainer width="100%" height={250} aria-label={`Amortization chart showing remaining balance decreasing from ${formatCurrency(loanAmount)} to zero, principal paid increasing to ${formatCurrency(loanAmount)}, and cumulative interest reaching ${formatCurrency(totalInterest)} over ${yearsToPayoff.toFixed(1)} years`}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }} aria-label="Mortgage amortization area chart">
              <defs>
                <linearGradient id="balanceGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="principalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="interestGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                </linearGradient>
                <filter id="lineShadow2">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => {
                  const [year, month] = (date as string).split('-');
                  return `${month}/${year.slice(2)}`;
                }}
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                stroke="#94a3b8"
              />
              <YAxis
                tickFormatter={(value) => formatCurrencyCompact(value as number)}
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                stroke="#94a3b8"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '11px'
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                iconType="line"
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#balanceGradient2)"
                fillOpacity={1}
                name="Remaining Balance"
                activeDot={{ r: 5, strokeWidth: 2, fill: '#3b82f6', stroke: '#fff' }}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
              <Area
                type="monotone"
                dataKey="principal"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#principalGradient)"
                fillOpacity={1}
                name="Principal Paid"
                activeDot={{ r: 5, strokeWidth: 2, fill: '#10b981', stroke: '#fff' }}
                animationDuration={1500}
                animationEasing="ease-in-out"
                animationBegin={200}
              />
              <Area
                type="monotone"
                dataKey="interest"
                stroke="#ef4444"
                strokeWidth={2.5}
                fill="url(#interestGradient2)"
                fillOpacity={1}
                name="Cumulative Interest"
                activeDot={{ r: 5, strokeWidth: 2, fill: '#ef4444', stroke: '#fff' }}
                animationDuration={1500}
                animationEasing="ease-in-out"
                animationBegin={400}
              />
            </AreaChart>
          </ResponsiveContainer>
        </>
      ) : (
        <div className="mt-2 -mx-4 sm:mx-0">
          <AmortizationTable schedule={schedule} />
        </div>
      )}
    </div>
  );
};

export default AmortizationOverview;
