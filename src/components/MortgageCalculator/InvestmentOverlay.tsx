import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { HelpTooltip } from '../HelpTooltip';
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatting';

interface InvestmentOverlayProps {
  // Cash flow
  monthlyCashFlow: number;
  annualCashFlow: number;
  effectiveMonthlyRent: number;
  grossMonthlyRent: number;
  vacancyLoss: number;
  totalOperatingExpenses: number;
  mortgagePayment: number; // P&I monthly equivalent + PMI
  pmiAmount?: number;
  // Return metrics
  cashOnCashReturn: number;
  capRate: number;
  netOperatingIncome: number;
  grm: number;
  dscr: number;
  operatingExpenseRatio: number;
  breakEvenOccupancy: number;
  // Deal quality
  dealScore: number;
  dealGrade: string;
  // Wealth projections
  propertyValue: number;
  futurePropertyValue5: number;
  futurePropertyValue10: number;
  futurePropertyValue15: number;
  equity5: number;
  equity10: number;
  equity15: number;
  cumulativeCashFlow5: number;
  cumulativeCashFlow10: number;
  cumulativeCashFlow15: number;
  totalWealth5: number;
  totalWealth10: number;
  totalWealth15: number;
  annualisedRoi5: number;
  annualisedRoi10: number;
  annualisedRoi15: number;
  className?: string;
}

// ─── Grade colour map ─────────────────────────────────────────────────────────
const gradeStyle: Record<string, { bg: string; text: string; ring: string }> = {
  A: { bg: 'bg-emerald-500', text: 'text-white', ring: 'ring-emerald-300' },
  B: { bg: 'bg-blue-500',    text: 'text-white', ring: 'ring-blue-300' },
  C: { bg: 'bg-amber-400',   text: 'text-white', ring: 'ring-amber-300' },
  D: { bg: 'bg-orange-500',  text: 'text-white', ring: 'ring-orange-300' },
  F: { bg: 'bg-red-500',     text: 'text-white', ring: 'ring-red-300' },
};

// ─── Reusable KPI cell ────────────────────────────────────────────────────────
interface KpiCellProps {
  label: string;
  value: string;
  tooltip: string;
  status?: 'good' | 'ok' | 'warn' | 'bad' | 'neutral';
  sub?: string;
}
const statusColor = { good: 'text-emerald-600', ok: 'text-blue-600', warn: 'text-amber-600', bad: 'text-red-500', neutral: 'text-slate-800' };
const statusDot   = { good: 'bg-emerald-500',   ok: 'bg-blue-500',   warn: 'bg-amber-400',   bad: 'bg-red-500',   neutral: 'bg-slate-300' };

const KpiCell: React.FC<KpiCellProps> = ({ label, value, tooltip, status = 'neutral', sub }) => (
  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
    <div className="flex items-center gap-1 mb-1">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot[status]}`} />
      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-medium leading-none">{label}</span>
      <HelpTooltip content={tooltip} />
    </div>
    <div className={`text-lg font-bold tabular-nums leading-tight ${statusColor[status]}`}>{value}</div>
    {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
  </div>
);

// ─── P&L waterfall bar ────────────────────────────────────────────────────────
interface WaterfallRowProps { label: string; amount: number; isPositive?: boolean; isTotal?: boolean }
const WaterfallRow: React.FC<WaterfallRowProps> = ({ label, amount, isPositive, isTotal }) => (
  <div className={`flex items-center justify-between py-1.5 ${isTotal ? 'border-t border-slate-200 mt-1 pt-2.5 font-bold' : ''}`}>
    <span className={`text-xs ${isTotal ? 'text-slate-800 font-semibold' : 'text-slate-500'}`}>{label}</span>
    <span className={`text-sm tabular-nums font-semibold ${
      isTotal
        ? amount >= 0 ? 'text-emerald-600' : 'text-red-500'
        : isPositive ? 'text-slate-700' : 'text-red-400'
    }`}>
      {isPositive ? '+' : '−'}{formatCurrency(Math.abs(amount))}
    </span>
  </div>
);

// ─── Projection table row ─────────────────────────────────────────────────────
interface ProjRowProps { label: string; v5: string; v10: string; v15: string; highlight?: boolean; sub5?: string; sub10?: string; sub15?: string }
const ProjRow: React.FC<ProjRowProps> = ({ label, v5, v10, v15, highlight, sub5, sub10, sub15 }) => (
  <div className={`grid grid-cols-4 gap-1 py-2 ${highlight ? 'bg-brand-primary/5 rounded-lg px-2 -mx-2' : 'border-b border-slate-100 last:border-0'}`}>
    <div className="text-xs text-slate-500 font-medium flex items-center">{label}</div>
    {[{ v: v5, s: sub5 }, { v: v10, s: sub10 }, { v: v15, s: sub15 }].map(({ v, s }, i) => (
      <div key={i} className="text-center">
        <div className={`text-xs font-bold tabular-nums ${highlight ? 'text-brand-primary' : 'text-slate-800'}`}>{v}</div>
        {s && <div className="text-[9px] text-slate-400">{s}</div>}
      </div>
    ))}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const InvestmentOverlay: React.FC<InvestmentOverlayProps> = (p) => {
  const grade = gradeStyle[p.dealGrade] ?? gradeStyle['F'];
  const cashPositive = p.monthlyCashFlow >= 0;

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${p.className ?? ''}`}>

      {/* ── Header + Deal Score ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Investment Analysis</h3>
          <p className="text-xs text-slate-400 mt-0.5">Real-time return &amp; risk metrics</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Score bar */}
          <div className="hidden sm:block">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[9px] uppercase tracking-widest text-slate-400">Deal Score</span>
              <HelpTooltip content="Composite score based on Cap Rate, Cash-on-Cash Return, DSCR and Break-even Occupancy. A = excellent deal, F = avoid." />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all bg-gradient-to-r from-red-400 via-amber-400 to-emerald-500"
                  style={{ width: `${p.dealScore}%` }} />
              </div>
              <span className="text-[10px] font-semibold text-slate-500">{p.dealScore}/100</span>
            </div>
          </div>
          {/* Letter grade */}
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold ring-2 ${grade.bg} ${grade.text} ${grade.ring}`}>
            {p.dealGrade}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* ── P&L Waterfall ────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Monthly P&amp;L</span>
            {cashPositive
              ? <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"><TrendingUp className="w-3 h-3" /> Cash-flowing</span>
              : <span className="flex items-center gap-0.5 text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-200"><TrendingDown className="w-3 h-3" /> Negative cash flow</span>}
          </div>
          <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
            <WaterfallRow label="Gross rent"          amount={p.grossMonthlyRent}      isPositive />
            <WaterfallRow label="Vacancy loss"        amount={p.vacancyLoss}           isPositive={false} />
            <WaterfallRow label="Operating expenses"  amount={p.totalOperatingExpenses} isPositive={false} />
            <WaterfallRow
              label={p.pmiAmount && p.pmiAmount > 0 ? `Debt service (P&I + PMI)` : 'Mortgage (P&I)'}
              amount={p.mortgagePayment}
              isPositive={false}
            />
            <WaterfallRow label="Net cash flow"       amount={p.monthlyCashFlow}        isPositive={cashPositive} isTotal />
          </div>
        </div>

        {/* ── Return metrics ───────────────────────────────────────────────────── */}
        <div>
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">Returns &amp; Risk</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <KpiCell
              label="Cash-on-Cash"
              value={`${p.cashOnCashReturn.toFixed(1)}%`}
              sub="annual on down payment"
              tooltip="Annual cash flow ÷ total cash invested (down payment). Target ≥ 8%."
              status={p.cashOnCashReturn >= 12 ? 'good' : p.cashOnCashReturn >= 8 ? 'ok' : p.cashOnCashReturn >= 4 ? 'warn' : 'bad'}
            />
            <KpiCell
              label="Cap Rate"
              value={`${p.capRate.toFixed(1)}%`}
              sub="finance-independent yield"
              tooltip="NOI ÷ Property Value. Independent of financing. Target ≥ 5–8% for most markets."
              status={p.capRate >= 8 ? 'good' : p.capRate >= 5 ? 'ok' : p.capRate >= 3 ? 'warn' : 'bad'}
            />
            <KpiCell
              label="DSCR"
              value={p.dscr.toFixed(2)}
              sub={p.dscr >= 1.25 ? 'lender-qualifying' : 'below lender req.'}
              tooltip="Debt Service Coverage Ratio = NOI ÷ annual debt service. Lenders require ≥ 1.25."
              status={p.dscr >= 1.5 ? 'good' : p.dscr >= 1.25 ? 'ok' : p.dscr >= 1.0 ? 'warn' : 'bad'}
            />
            <KpiCell
              label="GRM"
              value={`${p.grm.toFixed(1)}×`}
              sub="gross rent multiplier"
              tooltip="Property Price ÷ Annual Gross Rent. Lower = better value. Typical range: 10–20×."
              status={p.grm <= 12 ? 'good' : p.grm <= 16 ? 'ok' : p.grm <= 20 ? 'warn' : 'bad'}
            />
            <KpiCell
              label="Break-even"
              value={`${Math.min(p.breakEvenOccupancy, 999).toFixed(0)}%`}
              sub="min occupancy to cover"
              tooltip="Minimum occupancy needed to cover all costs including mortgage. Target < 75%."
              status={p.breakEvenOccupancy <= 70 ? 'good' : p.breakEvenOccupancy <= 80 ? 'ok' : p.breakEvenOccupancy <= 90 ? 'warn' : 'bad'}
            />
            <KpiCell
              label="Exp. Ratio"
              value={`${p.operatingExpenseRatio.toFixed(0)}%`}
              sub="operating expenses / gross"
              tooltip="Operating Expense Ratio = annual operating costs ÷ gross annual rent. Typical: 30–50%."
              status={p.operatingExpenseRatio <= 35 ? 'good' : p.operatingExpenseRatio <= 50 ? 'ok' : p.operatingExpenseRatio <= 65 ? 'warn' : 'bad'}
            />
          </div>
        </div>

        {/* ── Wealth projection table ──────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Wealth Projection</span>
            <HelpTooltip content="Combines equity built, property appreciation, and cumulative cash flow. Does not account for taxes or inflation." />
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
            {/* Header */}
            <div className="grid grid-cols-4 gap-1 pb-2 border-b border-slate-200 mb-1">
              <div />
              {['5 yr', '10 yr', '15 yr'].map(h => (
                <div key={h} className="text-center text-[10px] uppercase tracking-widest font-bold text-slate-500">{h}</div>
              ))}
            </div>
            <ProjRow
              label="Property value"
              v5={formatCurrencyCompact(p.futurePropertyValue5)}
              v10={formatCurrencyCompact(p.futurePropertyValue10)}
              v15={formatCurrencyCompact(p.futurePropertyValue15)}
            />
            <ProjRow
              label="Equity built"
              v5={formatCurrencyCompact(p.equity5)}
              v10={formatCurrencyCompact(p.equity10)}
              v15={formatCurrencyCompact(p.equity15)}
            />
            <ProjRow
              label="Cash flow total"
              v5={`${p.cumulativeCashFlow5 >= 0 ? '+' : ''}${formatCurrencyCompact(p.cumulativeCashFlow5)}`}
              v10={`${p.cumulativeCashFlow10 >= 0 ? '+' : ''}${formatCurrencyCompact(p.cumulativeCashFlow10)}`}
              v15={`${p.cumulativeCashFlow15 >= 0 ? '+' : ''}${formatCurrencyCompact(p.cumulativeCashFlow15)}`}
            />
            <ProjRow
              label="Total wealth"
              v5={formatCurrencyCompact(p.totalWealth5)}
              v10={formatCurrencyCompact(p.totalWealth10)}
              v15={formatCurrencyCompact(p.totalWealth15)}
              highlight
              sub5={`${p.annualisedRoi5.toFixed(1)}%/yr`}
              sub10={`${p.annualisedRoi10.toFixed(1)}%/yr`}
              sub15={`${p.annualisedRoi15.toFixed(1)}%/yr`}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
            Equity + appreciation gain + cumulative cash flow. Assumes constant rent, expenses, and {' '}
            appreciation rate. Pre-tax, nominal dollars.
          </p>
        </div>

      </div>
    </div>
  );
};

export default InvestmentOverlay;
