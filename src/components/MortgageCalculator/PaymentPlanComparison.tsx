import React from 'react';
import { BarChart3, FileText } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { formatCurrency, formatCurrencyCompact, formatYearsMonths } from '../../utils/formatting';
import { CARD_SHADOW, CARD_STYLE } from '../../constants/styles';
import type { PaymentType } from '../../types/mortgage';

interface ComparisonBarDatum {
  name: string;
  interest: number;
  type: string;
  label: string;
  endDate: string;
}

interface PaymentPlanComparisonProps {
  paymentPlanViewMode: 'text' | 'chart';
  onPaymentPlanViewModeChange: (mode: 'text' | 'chart') => void;
  onReset: () => void;
  interestSaved: number;
  timeSaved: number;
  isExtraPaymentComparison: boolean;
  extraPaymentAmount: number;
  extraPaymentFrequency: string;
  forwardProjections: { outstandingBalance: number };
  paymentType: PaymentType;
  graphRemainingInterest: number;
  graphRemainingInterestComparison: number;
  comparisonBarData: ComparisonBarDatum[];
  chartRenderKey: number;
  isFullWidth?: boolean;
  className?: string;
}

const PaymentPlanComparison: React.FC<PaymentPlanComparisonProps> = ({
  paymentPlanViewMode,
  onPaymentPlanViewModeChange,
  onReset,
  interestSaved,
  timeSaved,
  isExtraPaymentComparison,
  extraPaymentAmount,
  extraPaymentFrequency,
  forwardProjections,
  paymentType,
  graphRemainingInterest,
  graphRemainingInterestComparison,
  comparisonBarData,
  chartRenderKey,
  isFullWidth = false,
  className = '',
}) => {
  return (
    <div className={`${CARD_STYLE} ${className}`} style={CARD_SHADOW}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-xl pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-400/10 to-transparent rounded-bl-full"></div>
      <div className="relative p-2">
        <div className="mb-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-serif text-slate-800 tracking-wide font-bold relative">
                Payment Plan Comparison
                <div className="absolute -bottom-0.5 left-0 w-10 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500"></div>
              </h2>
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => onPaymentPlanViewModeChange('text')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-md transition-all duration-200 ${paymentPlanViewMode === 'text'
                    ? 'bg-white text-emerald-600 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                >
                  <FileText size={14} />
                  Text
                </button>
                <button
                  onClick={() => onPaymentPlanViewModeChange('chart')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-md transition-all duration-200 ${paymentPlanViewMode === 'chart'
                    ? 'bg-white text-emerald-600 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                >
                  <BarChart3 size={14} />
                  Graph
                </button>
              </div>
            </div>
            <button
              onClick={onReset}
              className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors self-start sm:self-auto"
              title="Reset to default values"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
          </div>

          {/* Savings Information - Always Visible */}
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="flex-1 bg-gradient-to-br from-emerald-50/80 to-green-100/80 rounded-lg p-2 border-2 border-emerald-300/60 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 hover:border-emerald-400 backdrop-blur-sm relative overflow-hidden group/card">
              <div className="relative text-center">
                <div className="text-sm font-serif font-bold text-emerald-700 mb-0.5">
                  {formatCurrency(Math.abs(interestSaved))}
                </div>
                <div className="text-[9px] text-emerald-600 uppercase tracking-wide font-medium">
                  Interest Saved
                </div>
              </div>
            </div>
            <div className="flex-1 bg-gradient-to-br from-emerald-50/80 to-green-100/80 rounded-lg p-2 border-2 border-emerald-300/60 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 hover:border-emerald-400 backdrop-blur-sm relative overflow-hidden group/card">
              <div className="relative text-center">
                <div className="text-sm font-serif font-bold text-emerald-700 mb-0.5">
                  {formatYearsMonths(Math.abs(timeSaved))}
                </div>
                <div className="text-[9px] text-emerald-600 uppercase tracking-wide font-medium">
                  Time Saved
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Content: Text Description OR Chart */}
          {paymentPlanViewMode === 'text' ? (
            <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-4 mb-3 shadow-sm animate-fade-in">
              <p className="text-sm text-slate-700 leading-relaxed">
                {isExtraPaymentComparison
                  ? <span>By making extra payments of <span className="font-bold text-blue-700">{formatCurrency(extraPaymentAmount)}</span> {extraPaymentFrequency === 'monthly' ? 'per month' : 'every two weeks'}, you'll save <span className="font-bold text-emerald-600">{formatCurrency(Math.abs(interestSaved))}</span> in remaining interest and pay off your loan <span className="font-bold text-emerald-600">{formatYearsMonths(Math.abs(timeSaved))}</span> faster.</span>
                  : <span>With your current outstanding balance of <span className="font-bold text-slate-800">{formatCurrency(forwardProjections.outstandingBalance)}</span>, switching to bi-weekly payments from today would save you <span className="font-bold text-emerald-600">{formatCurrency(Math.abs(interestSaved))}</span> in interest and pay off your loan <span className="font-bold text-emerald-600">{formatYearsMonths(Math.abs(timeSaved))}</span> sooner. Bi-weekly payments accelerate payoff because you make 26 payments per year (effectively one extra monthly payment).</span>}
              </p>
            </div>
          ) : (
            <div className="flex justify-center animate-fade-in">
              <div className={isFullWidth ? 'w-full' : 'w-full sm:w-3/4 md:w-1/2'}>
                <div className="sr-only">
                  <h3>Payment Plan Comparison Chart</h3>
                  <p>
                    {isExtraPaymentComparison
                      ? `Bar chart comparing Regular ${paymentType === 'monthly' ? 'Monthly' : 'Bi-weekly'} Payments (${formatCurrency(graphRemainingInterestComparison)} remaining interest from today) vs With Extra Payments (${formatCurrency(graphRemainingInterest)} remaining interest from today). Extra payments save ${formatCurrency(Math.abs(interestSaved))} in remaining interest.`
                      : `Bar chart comparing Monthly Payments (${formatCurrency(paymentType === 'monthly' ? graphRemainingInterest : graphRemainingInterestComparison)} remaining interest from today) vs Bi-weekly Payments (${formatCurrency(paymentType === 'biweekly' ? graphRemainingInterest : graphRemainingInterestComparison)} remaining interest from today). Bi-weekly saves ${formatCurrency(Math.abs(interestSaved))} in remaining interest.`}
                  </p>
                </div>
                <ResponsiveContainer key={`comparison-chart-${chartRenderKey}`} width="100%" height={isFullWidth ? 340 : 275} aria-label={isExtraPaymentComparison ? `Comparison chart showing Regular ${paymentType === 'monthly' ? 'Monthly' : 'Bi-weekly'} Payments with ${formatCurrency(graphRemainingInterestComparison)} remaining interest versus Extra Payments with ${formatCurrency(graphRemainingInterest)} remaining interest, saving ${formatCurrency(Math.abs(interestSaved))} from today forward` : `Comparison chart showing Monthly Payments with ${formatCurrency(paymentType === 'monthly' ? graphRemainingInterest : graphRemainingInterestComparison)} remaining interest versus Bi-weekly Payments with ${formatCurrency(paymentType === 'biweekly' ? graphRemainingInterest : graphRemainingInterestComparison)} remaining interest, saving ${formatCurrency(Math.abs(interestSaved))} from today forward`}>
                  <BarChart data={comparisonBarData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} aria-label="Payment plan comparison bar chart">
                    <defs>
                      <linearGradient id="redBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7} />
                      </linearGradient>
                      <linearGradient id="greenBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                      </linearGradient>
                      <filter id="barShadow">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.2" />
                      </filter>
                      <filter id="barGlow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                      stroke="#94a3b8"
                      angle={0}
                      textAnchor="middle"
                      height={60}
                    />
                    <YAxis
                      tickFormatter={(value) => formatCurrencyCompact(value)}
                      tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                      stroke="#94a3b8"
                      label={{ value: 'Remaining Interest', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#475569', fontWeight: 700 } }}
                      domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.3)]}
                      width={60}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as ComparisonBarDatum;
                          return (
                            <div className="bg-white border-2 border-slate-200 rounded-xl p-3 shadow-xl">
                              <p className="text-sm font-bold text-slate-800 mb-2">{data.label}</p>
                              <p className="text-lg font-bold text-blue-600">{formatCurrency(data.interest)}</p>
                              <p className="text-xs text-slate-600 mt-1">Remaining Interest (from today)</p>
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
                      shape={(props: { x?: number; y?: number; width?: number; height?: number; payload?: ComparisonBarDatum }) => {
                        const { x = 0, y = 0, width = 0, height = 0, payload } = props;
                        const fillColor = isExtraPaymentComparison
                          ? (payload?.type === 'comparison' ? 'url(#redBarGradient)' : 'url(#greenBarGradient)')
                          : (payload?.type === 'monthly' ? 'url(#redBarGradient)' : 'url(#greenBarGradient)');

                        return (
                          <g>
                            <rect
                              x={x}
                              y={y}
                              width={width}
                              height={height}
                              fill={fillColor}
                              filter="url(#barShadow)"
                              rx={8}
                              ry={8}
                            />
                            <rect
                              x={x}
                              y={y}
                              width={width}
                              height={height / 3}
                              fill="rgba(255, 255, 255, 0.2)"
                              rx={8}
                              ry={8}
                            />
                          </g>
                        );
                      }}
                    >
                      <LabelList
                        dataKey="interest"
                        position="top"
                        formatter={(value: number) => formatCurrencyCompact(value)}
                        style={{ fontSize: '9px', fontWeight: 700, fill: '#334155', textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
                        offset={5}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Legend - Show only in Chart mode */}
          {paymentPlanViewMode === 'chart' && (
            <div className="flex justify-end gap-4 mt-0 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(to bottom, #ef4444, #dc2626)' }}></div>
                <span className="text-slate-600 font-medium">{isExtraPaymentComparison ? 'Regular Payments' : 'Monthly'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(to bottom, #10b981, #059669)' }}></div>
                <span className="text-slate-600 font-medium">{isExtraPaymentComparison ? 'With Extra Payments' : 'Bi-weekly'}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PaymentPlanComparison;
