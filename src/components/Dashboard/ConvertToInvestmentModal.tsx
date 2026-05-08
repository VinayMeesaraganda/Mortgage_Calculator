import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Home, Building2, ChevronRight, ChevronLeft, Check, AlertTriangle, Lightbulb } from 'lucide-react';
import type { SavedMortgage } from '../../types/mortgage';
import { calculateMonthlyPayment } from '../../utils/calculations-helpers';
import { formatCurrency } from '../../utils/formatting';
import { HelpTooltip } from '../HelpTooltip';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RentalSetup {
  monthlyRent: number;
  vacancyRate: number;
  managementFee: number;
  maintenance: number;
  utilities: number;
  growthRate: number;
}

interface ConvertToInvestmentModalProps {
  isOpen: boolean;
  mortgage: SavedMortgage | null;
  onClose: () => void;
  onConvert: (mortgageId: string, rentalSetup: RentalSetup) => void;
}

// ─── Investment metrics preview ───────────────────────────────────────────────
function computePreview(mortgage: SavedMortgage, r: RentalSetup) {
  const loanAmount = mortgage.homeValue - mortgage.downPayment;
  // Base P&I (monthly equivalent regardless of payment type)
  const basePandI = calculateMonthlyPayment(loanAmount, mortgage.interestRate, mortgage.tenure);
  // For bi-weekly: effective monthly cost is 26 half-payments / 12
  const monthlyPandI = mortgage.paymentType === 'biweekly' ? (basePandI / 2) * 26 / 12 : basePandI;
  const pmi = mortgage.pmiAmount || 0;
  const monthlyDebtService = monthlyPandI + pmi;

  const effectiveRent = r.monthlyRent * (1 - r.vacancyRate / 100);
  const mgmtFee = r.monthlyRent * (r.managementFee / 100);
  const taxMonthly = mortgage.propertyTax
    ? (mortgage.propertyTaxPeriod === 'month' ? mortgage.propertyTax : mortgage.propertyTax / 12) : 0;
  const insMonthly = mortgage.homeInsurance
    ? (mortgage.homeInsurancePeriod === 'month' ? mortgage.homeInsurance : mortgage.homeInsurance / 12) : 0;
  // Operating expenses exclude PMI (finance-independent for NOI/Cap Rate accuracy)
  const totalOpex = mgmtFee + r.maintenance + r.utilities + taxMonthly + insMonthly + (mortgage.hoaFees || 0);
  const cashFlow = effectiveRent - monthlyDebtService - totalOpex;
  // NOI excludes debt service — finance-independent for Cap Rate accuracy
  const annualNOI = (effectiveRent - totalOpex) * 12;
  const capRate = mortgage.homeValue > 0 ? (annualNOI / mortgage.homeValue) * 100 : 0;
  const cocReturn = mortgage.downPayment > 0 ? (cashFlow * 12 / mortgage.downPayment) * 100 : 0;
  const dscr = (monthlyDebtService * 12) > 0 ? annualNOI / (monthlyDebtService * 12) : 0;
  const breakEven = r.monthlyRent > 0 ? ((monthlyDebtService + totalOpex) / r.monthlyRent) * 100 : 0;
  const score = (() => {
    let s = 0;
    s += capRate >= 8 ? 25 : capRate >= 5 ? 15 : capRate >= 3 ? 5 : 0;
    s += cocReturn >= 12 ? 25 : cocReturn >= 8 ? 15 : cocReturn >= 4 ? 5 : 0;
    s += dscr >= 1.5 ? 25 : dscr >= 1.25 ? 15 : dscr >= 1.0 ? 5 : 0;
    s += breakEven <= 70 ? 25 : breakEven <= 80 ? 15 : breakEven <= 90 ? 5 : 0;
    return s;
  })();
  const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F';
  return { monthlyDebtService, monthlyPandI, pmi, effectiveRent, totalOpex, mgmtFee, taxMonthly, insMonthly, cashFlow, annualNOI, capRate, cocReturn, dscr, breakEven, score, grade };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const gradeColor: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-300' },
  B: { bg: 'bg-blue-500',    text: 'text-white', border: 'border-blue-300' },
  C: { bg: 'bg-amber-400',   text: 'text-white', border: 'border-amber-300' },
  D: { bg: 'bg-orange-500',  text: 'text-white', border: 'border-orange-300' },
  F: { bg: 'bg-red-500',     text: 'text-white', border: 'border-red-300' },
};
const gradeLabel: Record<string, string> = {
  A: 'Excellent deal', B: 'Good deal', C: 'Fair deal', D: 'Weak deal', F: 'Avoid',
};

const INPUT = 'w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-sm bg-white transition-colors';

interface MetricPillProps { label: string; value: string; status: 'good' | 'ok' | 'warn' | 'bad'; tooltip?: string }
const statusColors = { good: 'text-emerald-600 bg-emerald-50 border-emerald-200', ok: 'text-blue-600 bg-blue-50 border-blue-200', warn: 'text-amber-600 bg-amber-50 border-amber-200', bad: 'text-red-500 bg-red-50 border-red-200' };
const MetricPill: React.FC<MetricPillProps> = ({ label, value, status, tooltip }) => (
  <div className={`flex flex-col items-center px-3 py-2 rounded-xl border text-center ${statusColors[status]}`}>
    <span className="text-[9px] uppercase tracking-widest font-semibold opacity-70 leading-none mb-1 flex items-center gap-0.5">
      {label}{tooltip && <HelpTooltip content={tooltip} />}
    </span>
    <span className="text-base font-bold tabular-nums leading-none">{value}</span>
  </div>
);

// ─── Steps progress ───────────────────────────────────────────────────────────
const STEPS = ['Confirm', 'Rental Setup', 'Analysis'];

// ─── Main modal ───────────────────────────────────────────────────────────────
const ConvertToInvestmentModal: React.FC<ConvertToInvestmentModalProps> = ({
  isOpen, mortgage, onClose, onConvert,
}) => {
  const [step, setStep] = useState(0);
  const [rental, setRental] = useState<RentalSetup>({
    monthlyRent: 0,
    vacancyRate: 8,
    managementFee: 10,
    maintenance: 0,
    utilities: 0,
    growthRate: 3.5,
  });

  // Smart defaults whenever a new mortgage opens
  useEffect(() => {
    if (!mortgage || !isOpen) return;
    setStep(0);
    setRental({
      monthlyRent: Math.round(mortgage.homeValue * 0.008),          // 0.8% rule suggestion
      vacancyRate: 8,
      managementFee: 10,
      maintenance: Math.round(mortgage.homeValue * 0.01 / 12),      // 1% annual rule
      utilities: 0,
      growthRate: 3.5,
    });
  }, [mortgage, isOpen]);

  const preview = useMemo(
    () => mortgage ? computePreview(mortgage, rental) : null,
    [mortgage, rental]
  );

  if (!isOpen || !mortgage || !preview) return null;

  const loanAmount = mortgage.homeValue - mortgage.downPayment;
  const gc = gradeColor[preview.grade] ?? gradeColor['F'];
  const cashPositive = preview.cashFlow >= 0;

  const set = (k: keyof RentalSetup) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRental(p => ({ ...p, [k]: Number(e.target.value) }));

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 lg:p-8"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Convert to Investment Property</h2>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[220px]">{mortgage.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Step indicator ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-0 px-6 py-3 border-b border-slate-100 flex-shrink-0">
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {i < step ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${i === step ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-emerald-300' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Step 0: Confirm ─────────────────────────────────────────── */}
          {step === 0 && (
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Home className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{mortgage.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Primary Home · {mortgage.currency}</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3 text-xs">
                    <div><span className="text-slate-400">Property value</span><div className="font-semibold text-slate-800">{formatCurrency(mortgage.homeValue)}</div></div>
                    <div><span className="text-slate-400">Loan amount</span><div className="font-semibold text-slate-800">{formatCurrency(loanAmount)}</div></div>
                    <div><span className="text-slate-400">Monthly payment</span><div className="font-semibold text-slate-800">{formatCurrency(preview.monthlyDebtService)}/mo</div></div>
                    <div><span className="text-slate-400">Rate · Term</span><div className="font-semibold text-slate-800">{mortgage.interestRate}% · {mortgage.tenure}yr</div></div>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">What will change</p>
                {[
                  { icon: <Check className="w-3.5 h-3.5 text-emerald-500" />, text: 'Property classified as Investment — unlocks rental income tracking' },
                  { icon: <Check className="w-3.5 h-3.5 text-emerald-500" />, text: 'Cap Rate, DSCR, Cash-on-Cash Return and Deal Score enabled' },
                  { icon: <Check className="w-3.5 h-3.5 text-emerald-500" />, text: '5 / 10 / 15-year wealth projection added to your dashboard card' },
                  { icon: <Check className="w-3.5 h-3.5 text-emerald-500" />, text: 'All existing loan data, payments and history preserved intact' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">{item.icon}</div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  You can switch back to Primary Home at any time. This is non-destructive.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 1: Rental Setup ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Expected Monthly Rent
                </label>
                <input type="number" className={INPUT} value={rental.monthlyRent || ''}
                  onChange={e => setRental(p => ({ ...p, monthlyRent: Number(e.target.value) }))}
                  placeholder="e.g. 2500" />
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" />
                  0.8% rule suggests ~{formatCurrency(Math.round(mortgage.homeValue * 0.008))}/mo for this property value
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Vacancy Rate <HelpTooltip content="Time the unit sits empty. National avg: 5–10%." />
                  </label>
                  <div className="relative">
                    <input type="number" className={INPUT} value={rental.vacancyRate} onChange={set('vacancyRate')} min={0} max={50} step={0.5} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">%</span>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Mgmt Fee <HelpTooltip content="Property management fee as % of gross rent. Typical 8–12%." />
                  </label>
                  <div className="relative">
                    <input type="number" className={INPUT} value={rental.managementFee} onChange={set('managementFee')} min={0} max={25} step={0.5} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Maintenance /mo <HelpTooltip content="1% of property value per year is the standard rule. Pre-filled accordingly." />
                  </label>
                  <input type="number" className={INPUT} value={rental.maintenance || ''} onChange={set('maintenance')} placeholder="$500" />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Utilities /mo <HelpTooltip content="Only if landlord covers utilities (uncommon in residential)." />
                  </label>
                  <input type="number" className={INPUT} value={rental.utilities || ''} onChange={set('utilities')} placeholder="$0" />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Annual Growth Rate <HelpTooltip content="Applied to rent and property value for projections. Long-run avg: 2–4%." />
                </label>
                <div className="relative">
                  <input type="number" className={INPUT} value={rental.growthRate} onChange={set('growthRate')} min={0} max={15} step={0.1} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">%/yr</span>
                </div>
              </div>

              {/* Live P&L hint */}
              {rental.monthlyRent > 0 && (
                <div className={`p-3 rounded-xl border-2 ${cashPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Estimated cash flow</span>
                    <span className={`text-sm font-bold tabular-nums ${cashPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                      {cashPositive ? '+' : ''}{formatCurrency(preview.cashFlow)}/mo
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">See full analysis on the next step →</p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Analysis Preview ─────────────────────────────────── */}
          {step === 2 && (
            <div className="p-6 space-y-5">
              {/* Deal Grade + Score */}
              <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${gc.border} ${cashPositive ? 'bg-emerald-50' : preview.grade === 'C' ? 'bg-amber-50' : 'bg-red-50'}`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold ring-4 ${gc.bg} ${gc.text} ring-white shadow-lg flex-shrink-0`}>
                  {preview.grade}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">{gradeLabel[preview.grade]}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Deal Score: {preview.score}/100</p>
                  <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden w-full">
                    <div className="h-full rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-500 transition-all"
                      style={{ width: `${preview.score}%` }} />
                  </div>
                  {!cashPositive && (
                    <p className="text-[10px] text-red-600 font-medium mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Negative cash flow — consider raising rent or reducing costs
                    </p>
                  )}
                </div>
              </div>

              {/* P&L breakdown */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 space-y-2">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Monthly P&amp;L</p>
                {[
                  { label: 'Gross rent', value: `+${formatCurrency(rental.monthlyRent)}`, positive: true },
                  { label: `Vacancy (${rental.vacancyRate}%)`, value: `−${formatCurrency(rental.monthlyRent - preview.effectiveRent)}`, positive: false },
                  { label: 'Operating expenses', value: `−${formatCurrency(preview.totalOpex)}`, positive: false },
                  { label: preview.pmi > 0 ? 'Debt service (P&I + PMI)' : 'Mortgage (P&I)', value: `−${formatCurrency(preview.monthlyDebtService)}`, positive: false },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">{row.label}</span>
                    <span className={`font-semibold tabular-nums ${row.positive ? 'text-slate-700' : 'text-red-400'}`}>{row.value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Net cash flow</span>
                  <span className={`text-sm font-bold tabular-nums ${cashPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {cashPositive ? '+' : ''}{formatCurrency(preview.cashFlow)}/mo
                  </span>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-2">
                <MetricPill label="Cash-on-Cash" value={`${preview.cocReturn.toFixed(1)}%`}
                  status={preview.cocReturn >= 12 ? 'good' : preview.cocReturn >= 8 ? 'ok' : preview.cocReturn >= 4 ? 'warn' : 'bad'}
                  tooltip="Annual return on your down payment. Target ≥ 8%." />
                <MetricPill label="Cap Rate" value={`${preview.capRate.toFixed(1)}%`}
                  status={preview.capRate >= 8 ? 'good' : preview.capRate >= 5 ? 'ok' : preview.capRate >= 3 ? 'warn' : 'bad'}
                  tooltip="NOI ÷ Property Value. Finance-independent yield." />
                <MetricPill label="DSCR" value={preview.dscr.toFixed(2)}
                  status={preview.dscr >= 1.5 ? 'good' : preview.dscr >= 1.25 ? 'ok' : preview.dscr >= 1.0 ? 'warn' : 'bad'}
                  tooltip="Debt Service Coverage Ratio. Lenders require ≥ 1.25." />
                <MetricPill label="Break-even" value={`${Math.min(preview.breakEven, 999).toFixed(0)}%`}
                  status={preview.breakEven <= 70 ? 'good' : preview.breakEven <= 80 ? 'ok' : preview.breakEven <= 90 ? 'warn' : 'bad'}
                  tooltip="Minimum occupancy needed to cover all costs." />
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                You can refine rental details any time in the calculator's Rental Income step.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white flex-shrink-0">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <button onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-sm font-semibold transition-colors">
              Cancel
            </button>
          )}

          {step < 2 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && rental.monthlyRent <= 0}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-soft disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === 0 ? 'Set up rental income' : 'Preview analysis'}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onConvert(mortgage.id, rental)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-soft"
            >
              <Building2 className="w-4 h-4" />
              Convert &amp; Save
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConvertToInvestmentModal;
