import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowUpRight, Check, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';
import type { PaymentType } from '../../types/mortgage';

interface ScenarioInput {
  homeValue: number;
  downPayment: number;
  interestRate: number;
  tenure: number;
  paymentType: PaymentType;
}

interface ScenarioCalc {
  loanAmount: number;
  payment: number;
  totalPaid: number;
  totalInterest: number;
  tenure: number;
}

interface ScenarioComparisonModalProps {
  isOpen: boolean;
  isInline?: boolean;
  onClose: () => void;
  onApplyScenario: (scenario: ScenarioInput) => void;
  homeValue: number;
  downPayment: number;
  interestRate: number;
  tenure: number;
  paymentType: PaymentType;
  loanAmount: number;
  scenarioB: ScenarioInput;
  scenarioC: ScenarioInput;
  setScenarioB: React.Dispatch<React.SetStateAction<ScenarioInput>>;
  setScenarioC: React.Dispatch<React.SetStateAction<ScenarioInput>>;
  editingScenarioBPercent: boolean;
  setEditingScenarioBPercent: React.Dispatch<React.SetStateAction<boolean>>;
  rawScenarioBPercent: string;
  setRawScenarioBPercent: React.Dispatch<React.SetStateAction<string>>;
  editingScenarioCPercent: boolean;
  setEditingScenarioCPercent: React.Dispatch<React.SetStateAction<boolean>>;
  rawScenarioCPercent: string;
  setRawScenarioCPercent: React.Dispatch<React.SetStateAction<string>>;
  currentScenarioBase: ScenarioCalc;
  scenarioBCalc: ScenarioCalc;
  scenarioCCalc: ScenarioCalc;
}

const INPUT = 'w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-sm bg-white transition-colors';
const SELECT = `${INPUT} cursor-pointer`;

function Delta({ val, base, unit = '$' }: { val: number; base: number; unit?: string }) {
  if (val === base) return <span className="flex items-center gap-1 text-slate-400 text-xs"><Minus className="w-3 h-3" /> Same</span>;
  const better = val < base;
  const diff = Math.abs(val - base);
  const Icon = better ? TrendingDown : TrendingUp;
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${better ? 'text-emerald-600' : 'text-red-500'}`}>
      <Icon className="w-3 h-3" />
      {unit === '$' ? formatCurrency(diff) : `${diff} yrs`} {better ? 'less' : 'more'}
    </span>
  );
}

const ScenarioComparisonModal: React.FC<ScenarioComparisonModalProps> = ({
  isOpen, isInline = false, onClose, onApplyScenario,
  homeValue, downPayment, interestRate, tenure, paymentType,
  scenarioB, scenarioC, setScenarioB, setScenarioC,
  editingScenarioBPercent, setEditingScenarioBPercent, rawScenarioBPercent, setRawScenarioBPercent,
  editingScenarioCPercent, setEditingScenarioCPercent, rawScenarioCPercent, setRawScenarioCPercent,
  currentScenarioBase, scenarioBCalc, scenarioCCalc,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const scenarios = [
    {
      label: 'Current Loan',
      sublabel: 'Your baseline',
      accent: 'border-slate-300',
      headerBg: 'bg-slate-800',
      calc: currentScenarioBase,
      isBase: true,
      inputs: null,
    },
    {
      label: 'Scenario B',
      sublabel: 'Alternative option',
      accent: 'border-brand-primary',
      headerBg: 'bg-brand-primary',
      calc: scenarioBCalc,
      isBase: false,
      scenario: scenarioB,
      setScenario: setScenarioB,
      editingPercent: editingScenarioBPercent,
      setEditingPercent: setEditingScenarioBPercent,
      rawPercent: rawScenarioBPercent,
      setRawPercent: setRawScenarioBPercent,
    },
    {
      label: 'Scenario C',
      sublabel: 'Another option',
      accent: 'border-violet-400',
      headerBg: 'bg-violet-600',
      calc: scenarioCCalc,
      isBase: false,
      scenario: scenarioC,
      setScenario: setScenarioC,
      editingPercent: editingScenarioCPercent,
      setEditingPercent: setEditingScenarioCPercent,
      rawPercent: rawScenarioCPercent,
      setRawPercent: setRawScenarioCPercent,
    },
  ] as const;

  // Determine winner on total interest
  const allInterest = [currentScenarioBase.totalInterest, scenarioBCalc.totalInterest, scenarioCCalc.totalInterest];
  const minInterest = Math.min(...allInterest);

  const panelContent = (
      <div
        className={isInline
          ? "flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden min-h-[560px]"
          : "absolute inset-4 lg:inset-6 flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
        }
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white flex-shrink-0">
          <div>
            <h2 className="text-lg font-display font-bold text-slate-900">Compare Loan Scenarios</h2>
            <p className="text-sm text-slate-500 mt-0.5">Adjust Scenario B and C inputs — results update instantly</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-6">
            {/* 3-column scenario grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 min-w-0">
              {scenarios.map((s, idx) => (
                <div key={idx} className={`rounded-2xl border-2 ${s.accent} overflow-hidden flex flex-col min-w-0`}>
                  {/* Column header */}
                  <div className={`${s.headerBg} px-4 py-3 flex items-center justify-between`}>
                    <div>
                      <p className="text-white font-semibold text-sm">{s.label}</p>
                      <p className="text-white/70 text-xs">{s.sublabel}</p>
                    </div>
                    {!s.isBase && (
                      <button
                        onClick={() => onApplyScenario((s as typeof scenarios[1]).scenario!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors"
                      >
                        Apply <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {s.isBase && s.calc.totalInterest === minInterest && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-emerald-400/30 text-emerald-100 rounded-lg text-xs font-semibold">
                        <Check className="w-3 h-3" /> Best
                      </span>
                    )}
                  </div>

                  {/* Inputs */}
                  <div className="p-4 space-y-3 flex-1">
                    {/* Home Value */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Home Value</label>
                      {s.isBase
                        ? <p className="px-3 py-2 bg-slate-50 rounded-lg text-sm font-semibold text-slate-800 border border-slate-200">{formatCurrency(homeValue)}</p>
                        : <input type="text" className={INPUT}
                            value={(s as typeof scenarios[1]).scenario!.homeValue.toLocaleString()}
                            onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); (s as typeof scenarios[1]).setScenario!(prev => ({ ...prev, homeValue: v === '' ? 0 : Number(v) })); }}
                            placeholder="$" />
                      }
                    </div>

                    {/* Down Payment */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Down Payment</label>
                      {s.isBase
                        ? <p className="px-3 py-2 bg-slate-50 rounded-lg text-sm font-semibold text-slate-800 border border-slate-200">
                            {formatCurrency(downPayment)} <span className="text-slate-400 text-xs">({homeValue > 0 ? ((downPayment / homeValue) * 100).toFixed(1) : 0}%)</span>
                          </p>
                        : <div className="flex gap-2">
                            <input type="text" className={INPUT}
                              value={(s as typeof scenarios[1]).scenario!.downPayment.toLocaleString()}
                              onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); (s as typeof scenarios[1]).setScenario!(prev => ({ ...prev, downPayment: v === '' ? 0 : Number(v) })); }}
                              placeholder="Amount" />
                            <input type="text" className="w-16 px-2 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-sm text-center bg-white"
                              value={(s as typeof scenarios[1]).editingPercent
                                ? (s as typeof scenarios[1]).rawPercent
                                : ((s as typeof scenarios[1]).scenario!.homeValue > 0 ? (((s as typeof scenarios[1]).scenario!.downPayment / (s as typeof scenarios[1]).scenario!.homeValue) * 100).toFixed(1) : '0.0')}
                              onChange={e => {
                                (s as typeof scenarios[1]).setEditingPercent!(true);
                                const c = e.target.value.replace(/,/g, '');
                                (s as typeof scenarios[1]).setRawPercent!(c);
                                if (/^\d*\.?\d*$/.test(c)) {
                                  const pct = Number(c);
                                  if (!isNaN(pct) && pct >= 0 && pct <= 100)
                                    (s as typeof scenarios[1]).setScenario!(prev => ({ ...prev, downPayment: (prev.homeValue * pct) / 100 }));
                                }
                              }}
                              onFocus={() => { (s as typeof scenarios[1]).setEditingPercent!(true); (s as typeof scenarios[1]).setRawPercent!(((s as typeof scenarios[1]).scenario!.homeValue > 0 ? (((s as typeof scenarios[1]).scenario!.downPayment / (s as typeof scenarios[1]).scenario!.homeValue) * 100).toFixed(1) : '0.0')); }}
                              onBlur={() => { (s as typeof scenarios[1]).setEditingPercent!(false); (s as typeof scenarios[1]).setRawPercent!(''); }}
                              placeholder="%" />
                          </div>
                      }
                    </div>

                    {/* Interest Rate */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Interest Rate</label>
                      {s.isBase
                        ? <p className="px-3 py-2 bg-slate-50 rounded-lg text-sm font-semibold text-slate-800 border border-slate-200">{interestRate}%</p>
                        : <input type="text" className={INPUT}
                            value={(s as typeof scenarios[1]).scenario!.interestRate}
                            onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ''); (s as typeof scenarios[1]).setScenario!(prev => ({ ...prev, interestRate: v === '' ? 0 : Number(v) })); }}
                            placeholder="%" />
                      }
                    </div>

                    {/* Term */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Loan Term (years)</label>
                      {s.isBase
                        ? <p className="px-3 py-2 bg-slate-50 rounded-lg text-sm font-semibold text-slate-800 border border-slate-200">{tenure} years</p>
                        : <input type="text" className={INPUT}
                            value={(s as typeof scenarios[1]).scenario!.tenure}
                            onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); (s as typeof scenarios[1]).setScenario!(prev => ({ ...prev, tenure: v === '' ? 0 : Number(v) })); }}
                            placeholder="years" />
                      }
                    </div>

                    {/* Payment Type */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Payment Frequency</label>
                      {s.isBase
                        ? <p className="px-3 py-2 bg-slate-50 rounded-lg text-sm font-semibold text-slate-800 border border-slate-200 capitalize">{paymentType}</p>
                        : <select className={SELECT}
                            value={(s as typeof scenarios[1]).scenario!.paymentType}
                            onChange={e => (s as typeof scenarios[1]).setScenario!(prev => ({ ...prev, paymentType: e.target.value as PaymentType }))}>
                            <option value="monthly">Monthly</option>
                            <option value="biweekly">Bi-weekly</option>
                          </select>
                      }
                    </div>
                  </div>

                  {/* Results */}
                  <div className={`p-4 border-t ${s.calc.totalInterest === minInterest ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Results</p>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Loan amount</span>
                        <span className="text-sm font-semibold text-slate-800 tabular-nums">{formatCurrency(s.calc.loanAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Monthly payment</span>
                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(s.calc.payment)}</span>
                          {!s.isBase && <div className="mt-0.5"><Delta val={s.calc.payment} base={currentScenarioBase.payment} /></div>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Total interest</span>
                        <div className="text-right">
                          <span className={`text-sm font-bold tabular-nums ${s.calc.totalInterest === minInterest ? 'text-emerald-600' : 'text-red-500'}`}>
                            {formatCurrency(s.calc.totalInterest)}
                          </span>
                          {!s.isBase && <div className="mt-0.5"><Delta val={s.calc.totalInterest} base={currentScenarioBase.totalInterest} /></div>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Total paid</span>
                        <span className="text-sm font-semibold text-slate-800 tabular-nums">{formatCurrency(s.calc.totalPaid)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Term</span>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-slate-800">{s.calc.tenure} yrs</span>
                          {!s.isBase && <div className="mt-0.5"><Delta val={s.calc.tenure} base={currentScenarioBase.tenure} unit="yr" /></div>}
                        </div>
                      </div>
                    </div>

                    {/* Best badge */}
                    {s.calc.totalInterest === minInterest && (
                      <div className="mt-3 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-100 rounded-lg border border-emerald-200">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-700">Lowest interest cost</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary callout */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500 font-medium">
                <span className="font-semibold text-slate-700">How to use: </span>
                Edit the Scenario B or C columns above. The option with the lowest total interest is highlighted in green.
                Click <strong>Apply</strong> on any scenario to load it into the main calculator.
              </p>
            </div>
          </div>
        </div>
      </div>
  );

  if (isInline) return panelContent;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Compare loan scenarios"
    >
      {panelContent}
    </div>,
    document.body
  );
};

export default ScenarioComparisonModal;
