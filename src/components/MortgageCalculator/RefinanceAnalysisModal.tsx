import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingDown, Clock, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';
import { DatePicker } from '../DatePicker';
import { formatCurrency } from '../../utils/formatting';

interface RefinanceData {
  remainingBalance: number;
  currentRate: number;
  currentPayoffDate: string;
  currentExtraPayment: number;
  newRate: number;
  closingCosts: number;
  newTerm: number;
  newExtraPayment: number;
  _actualRemainingInterest: number;
  _actualRemainingMonths: number;
  _actualMonthlyPaymentEquivalent: number;
}

interface RefinanceCalc {
  currentPayment: number;
  currentMonthlyTotal: number;
  currentTotalPayments: number;
  currentTotalInterest: number;
  remainingMonths: number;
  newPayment: number;
  newMonthlyTotal: number;
  newTotalPayments: number;
  newTotalInterest: number;
  actualNewMonths: number;
  monthlySavings: number;
  totalSavings: number;
  interestSavings: number;
  breakEvenMonths: number;
  breakEvenYears: number;
  timeDifference: number;
  worthIt: boolean;
}

interface RefinanceAnalysisModalProps {
  isOpen: boolean;
  isInline?: boolean;
  onClose: () => void;
  refinanceData: RefinanceData;
  setRefinanceData: React.Dispatch<React.SetStateAction<RefinanceData>>;
  editingCurrentRate: boolean;
  setEditingCurrentRate: React.Dispatch<React.SetStateAction<boolean>>;
  rawCurrentRate: string;
  setRawCurrentRate: React.Dispatch<React.SetStateAction<string>>;
  editingNewRate: boolean;
  setEditingNewRate: React.Dispatch<React.SetStateAction<boolean>>;
  rawNewRate: string;
  setRawNewRate: React.Dispatch<React.SetStateAction<string>>;
  refinanceCalc: RefinanceCalc;
  onApplyRefinance: () => void;
}

const LABEL = 'block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5';
const INPUT = 'w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-sm bg-white transition-colors';

const RefinanceAnalysisModal: React.FC<RefinanceAnalysisModalProps> = ({
  isOpen, isInline = false, onClose, refinanceData, setRefinanceData,
  editingCurrentRate, setEditingCurrentRate, rawCurrentRate, setRawCurrentRate,
  editingNewRate, setEditingNewRate, rawNewRate, setRawNewRate,
  refinanceCalc, onApplyRefinance,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const remainingYears = refinanceData.currentPayoffDate
    ? (() => {
        const ms = new Date(refinanceData.currentPayoffDate).getTime() - Date.now();
        const months = Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24 * 30.44)));
        return { years: Math.floor(months / 12), months: months % 12 };
      })()
    : null;

  const panelContent = (
      <div
        className={isInline
          ? "flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden"
          : "relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
        }
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white flex-shrink-0">
          <div>
            <h2 className="text-lg font-display font-bold text-slate-900">Refinance Analysis</h2>
            <p className="text-sm text-slate-500 mt-0.5">Compare your current loan against a new refinance offer</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-6 space-y-6">

            {/* ── Input section ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 min-w-0">

              {/* Current loan */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-800 px-4 py-3">
                  <p className="text-white font-semibold text-sm">Current Loan</p>
                  <p className="text-slate-400 text-xs mt-0.5">Your existing mortgage details</p>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className={LABEL}>Remaining Balance</label>
                    <input type="text" className={INPUT}
                      value={refinanceData.remainingBalance.toLocaleString()}
                      onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setRefinanceData(p => ({ ...p, remainingBalance: v === '' ? 0 : Number(v) })); }}
                      placeholder="$280,000" />
                  </div>
                  <div>
                    <label className={LABEL}>Current Interest Rate</label>
                    <div className="relative">
                      <input type="text" className={INPUT}
                        value={editingCurrentRate ? rawCurrentRate : (refinanceData.currentRate === 0 ? '' : refinanceData.currentRate.toString())}
                        onChange={e => {
                          setEditingCurrentRate(true);
                          const c = e.target.value.replace(/[^0-9.]/g, '').replace(/^(\d*\.?\d*).*/, '$1');
                          setRawCurrentRate(c);
                          const n = Number(c);
                          if (!isNaN(n) && n >= 0) setRefinanceData(p => ({ ...p, currentRate: n }));
                        }}
                        onFocus={() => { setEditingCurrentRate(true); setRawCurrentRate(refinanceData.currentRate === 0 ? '' : refinanceData.currentRate.toString()); }}
                        onBlur={() => { setEditingCurrentRate(false); setRawCurrentRate(''); }}
                        placeholder="7.5" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                    </div>
                  </div>
                  <div>
                    <label className={LABEL}>
                      Projected Payoff Date
                      {remainingYears && (
                        <span className="ml-2 normal-case text-emerald-600 font-medium">
                          — {remainingYears.years > 0 ? `${remainingYears.years}y ` : ''}{remainingYears.months > 0 ? `${remainingYears.months}m ` : ''}remaining
                        </span>
                      )}
                    </label>
                    <DatePicker
                      value={refinanceData.currentPayoffDate}
                      onChange={date => setRefinanceData(p => ({ ...p, currentPayoffDate: date }))}
                    />
                    <p className="text-xs text-slate-400 mt-1">Find this on your mortgage statement</p>
                  </div>
                  <div>
                    <label className={LABEL}>Extra Payment / month (optional)</label>
                    <input type="text" className={INPUT}
                      value={refinanceData.currentExtraPayment > 0 ? refinanceData.currentExtraPayment.toLocaleString() : ''}
                      onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setRefinanceData(p => ({ ...p, currentExtraPayment: v === '' ? 0 : Number(v) })); }}
                      placeholder="$0" />
                  </div>
                </div>
              </div>

              {/* New refinance loan */}
              <div className="rounded-2xl border border-brand-primary/30 overflow-hidden">
                <div className="bg-brand-primary px-4 py-3">
                  <p className="text-white font-semibold text-sm">New Refinance Offer</p>
                  <p className="text-blue-100 text-xs mt-0.5">Enter your lender's new terms</p>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className={LABEL}>New Interest Rate</label>
                    <div className="relative">
                      <input type="text" className={INPUT}
                        value={editingNewRate ? rawNewRate : (refinanceData.newRate === 0 ? '' : refinanceData.newRate.toString())}
                        onChange={e => {
                          setEditingNewRate(true);
                          const c = e.target.value.replace(/[^0-9.]/g, '').replace(/^(\d*\.?\d*).*/, '$1');
                          setRawNewRate(c);
                          const n = Number(c);
                          if (!isNaN(n) && n >= 0) setRefinanceData(p => ({ ...p, newRate: n }));
                        }}
                        onFocus={() => { setEditingNewRate(true); setRawNewRate(refinanceData.newRate === 0 ? '' : refinanceData.newRate.toString()); }}
                        onBlur={() => { setEditingNewRate(false); setRawNewRate(''); }}
                        placeholder="6.0" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                    </div>
                  </div>
                  <div>
                    <label className={LABEL}>Closing Costs</label>
                    <input type="text" className={INPUT}
                      value={refinanceData.closingCosts.toLocaleString()}
                      onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setRefinanceData(p => ({ ...p, closingCosts: v === '' ? 0 : Number(v) })); }}
                      placeholder="$3,500" />
                    <p className="text-xs text-slate-400 mt-1">Typical range: $2,000 – $6,000</p>
                  </div>
                  <div>
                    <label className={LABEL}>New Loan Term</label>
                    <div className="relative">
                      <input type="text" className={INPUT}
                        value={refinanceData.newTerm}
                        onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setRefinanceData(p => ({ ...p, newTerm: v === '' ? 0 : Number(v) })); }}
                        placeholder="30" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">yrs</span>
                    </div>
                  </div>
                  <div>
                    <label className={LABEL}>Extra Payment / month (optional)</label>
                    <input type="text" className={INPUT}
                      value={refinanceData.newExtraPayment > 0 ? refinanceData.newExtraPayment.toLocaleString() : ''}
                      onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setRefinanceData(p => ({ ...p, newExtraPayment: v === '' ? 0 : Number(v) })); }}
                      placeholder="$0" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Verdict ───────────────────────────────────────────────────── */}
            <div className={`rounded-2xl border-2 p-5 ${refinanceCalc.worthIt ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  {refinanceCalc.worthIt
                    ? <CheckCircle className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                    : <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0" />}
                  <div>
                    <h3 className={`text-lg font-bold ${refinanceCalc.worthIt ? 'text-emerald-800' : 'text-amber-800'}`}>
                      {refinanceCalc.worthIt ? 'Refinancing looks beneficial' : 'Consider carefully'}
                    </h3>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {refinanceCalc.worthIt
                        ? `Break-even in ${refinanceCalc.breakEvenYears.toFixed(1)} years — you stay ahead after that.`
                        : `Break-even takes ${refinanceCalc.breakEvenYears.toFixed(1)} years — weigh against your plans.`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onApplyRefinance}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-blue-700 text-white text-sm font-semibold shadow-soft hover:shadow-hover transition-all flex-shrink-0"
                >
                  Apply to Calculator
                </button>
              </div>

              {/* 3 KPI tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: <Clock className="w-5 h-5 text-slate-600" />,
                    value: `${refinanceCalc.breakEvenYears.toFixed(1)} yrs`,
                    sub: `${Math.ceil(refinanceCalc.breakEvenMonths)} months`,
                    label: 'Break-even point',
                    bg: 'bg-white',
                  },
                  {
                    icon: <TrendingDown className="w-5 h-5 text-emerald-600" />,
                    value: formatCurrency(refinanceCalc.monthlySavings),
                    sub: 'per month',
                    label: 'Monthly savings',
                    bg: 'bg-white',
                  },
                  {
                    icon: <DollarSign className="w-5 h-5 text-blue-600" />,
                    value: formatCurrency(Math.abs(refinanceCalc.totalSavings)),
                    sub: refinanceCalc.totalSavings > 0 ? 'over loan life' : 'extra cost',
                    label: refinanceCalc.totalSavings > 0 ? 'Total savings' : 'Total extra cost',
                    bg: 'bg-white',
                  },
                ].map((tile, i) => (
                  <div key={i} className={`${tile.bg} rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3`}>
                    <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">{tile.icon}</div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 leading-none mb-1">{tile.label}</p>
                      <p className="text-xl font-bold font-mono tabular-nums text-slate-900 leading-tight">{tile.value}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{tile.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Comparison table ──────────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 overflow-x-auto">
              <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-200 min-w-[560px]">
                {['Metric', 'Current Loan', 'Refinanced Loan', 'Difference'].map((h, i) => (
                  <div key={i} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 ${i > 0 ? 'border-l border-slate-200 text-center' : ''}`}>{h}</div>
                ))}
              </div>
              {[
                {
                  label: 'Monthly Payment',
                  current: formatCurrency(refinanceCalc.currentMonthlyTotal),
                  new: formatCurrency(refinanceCalc.newMonthlyTotal),
                  diff: refinanceCalc.currentMonthlyTotal - refinanceCalc.newMonthlyTotal,
                },
                {
                  label: 'Total Interest',
                  current: formatCurrency(refinanceCalc.currentTotalInterest),
                  new: formatCurrency(refinanceCalc.newTotalInterest),
                  diff: refinanceCalc.currentTotalInterest - refinanceCalc.newTotalInterest,
                },
                {
                  label: 'Total Paid',
                  current: formatCurrency(refinanceCalc.currentTotalPayments),
                  new: formatCurrency(refinanceCalc.newTotalPayments),
                  diff: refinanceCalc.currentTotalPayments - refinanceCalc.newTotalPayments,
                },
                {
                  label: 'Payoff Time',
                  current: `${(refinanceCalc.remainingMonths / 12).toFixed(1)} yrs`,
                  new: `${(refinanceCalc.actualNewMonths / 12).toFixed(1)} yrs`,
                  diff: refinanceCalc.remainingMonths - refinanceCalc.actualNewMonths,
                  unitLabel: 'months',
                },
                {
                  label: 'Closing Costs',
                  current: '—',
                  new: formatCurrency(refinanceData.closingCosts),
                  diff: -refinanceData.closingCosts,
                  isCost: true,
                },
              ].map((row, i) => (
                <div key={i} className={`grid grid-cols-4 border-b border-slate-100 last:border-0 min-w-[560px] ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                  <div className="px-4 py-3 text-sm font-medium text-slate-700">{row.label}</div>
                  <div className="px-4 py-3 text-sm font-semibold text-slate-800 text-center border-l border-slate-100 tabular-nums">{row.current}</div>
                  <div className="px-4 py-3 text-sm font-semibold text-brand-primary text-center border-l border-slate-100 tabular-nums">{row.new}</div>
                  <div className={`px-4 py-3 text-sm font-semibold text-center border-l border-slate-100 tabular-nums ${row.isCost ? 'text-red-500' : row.diff > 0 ? 'text-emerald-600' : row.diff < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                    {row.isCost
                      ? `−${formatCurrency(refinanceData.closingCosts)}`
                      : row.diff === 0 ? 'No change'
                      : row.diff > 0
                        ? `+${row.unitLabel ? `${Math.abs(row.diff / 30.44 / 12).toFixed(1)} yrs` : formatCurrency(row.diff)}`
                        : `−${row.unitLabel ? `${Math.abs(row.diff / 30.44 / 12).toFixed(1)} yrs` : formatCurrency(Math.abs(row.diff))}`}
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendation */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-700 mb-2">Recommendation</p>
              <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
                {refinanceCalc.worthIt ? (
                  <>
                    <p>Refinancing is recommended. You will break even in <strong>{refinanceCalc.breakEvenYears.toFixed(1)} years</strong> and save <strong>{formatCurrency(refinanceCalc.monthlySavings)}/month</strong> from that point forward.</p>
                    {refinanceCalc.breakEvenMonths < 24 && <p className="text-emerald-700 font-medium">The short break-even period makes this a strong candidate.</p>}
                  </>
                ) : (
                  <>
                    <p>Refinancing may not be worth it in your situation.</p>
                    {refinanceCalc.breakEvenMonths > refinanceCalc.remainingMonths && (
                      <p>You would not break even before the current loan pays off ({Math.ceil(refinanceCalc.breakEvenMonths)} months needed vs. {refinanceCalc.remainingMonths} remaining).</p>
                    )}
                    <p>Consider negotiating lower closing costs or waiting for a larger rate drop.</p>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
  );

  if (isInline) return panelContent;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 lg:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Refinance analysis"
    >
      {panelContent}
    </div>,
    document.body
  );
};

export default RefinanceAnalysisModal;
