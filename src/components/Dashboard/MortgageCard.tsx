import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Home, ArrowRight, Trash2, TrendingDown, Calendar, Layers, RefreshCw } from 'lucide-react';
import type { SavedMortgage } from '../../types/mortgage';
import { computeMortgageMetrics } from '../../utils/mortgageMetrics';
import { formatCurrency, formatDate } from '../../utils/formatting';
import ProgressRing from './ProgressRing';

interface MortgageCardProps {
  mortgage: SavedMortgage;
  onDelete: (id: string) => void;
  onConvertToInvestment?: (mortgage: SavedMortgage) => void;
}

function ringColor(pct: number): string {
  if (pct >= 66) return '#10B981'; // emerald
  if (pct >= 33) return '#2563EB'; // blue
  return '#F59E0B';                // amber
}

function statusLabel(pct: number): { text: string; bg: string; text2: string } {
  if (pct >= 75) return { text: 'Almost done', bg: 'bg-emerald-50', text2: 'text-emerald-700' };
  if (pct >= 50) return { text: 'Well underway', bg: 'bg-blue-50', text2: 'text-blue-700' };
  if (pct >= 25) return { text: 'In progress', bg: 'bg-indigo-50', text2: 'text-indigo-700' };
  return { text: 'Early stage', bg: 'bg-amber-50', text2: 'text-amber-700' };
}

const MortgageCard: React.FC<MortgageCardProps> = ({ mortgage, onDelete, onConvertToInvestment }) => {
  const m = useMemo(() => computeMortgageMetrics(mortgage), [mortgage]);
  const isInvestment = mortgage.propertyType === 'investment';
  const color = ringColor(m.percentPaid);
  const status = statusLabel(m.percentPaid);
  const accentColor = isInvestment ? '#10B981' : '#2563EB';

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200 shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: accentColor }}
      />

      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-5 pb-4 pl-8">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${accentColor}18` }}
          >
            {isInvestment
              ? <Building2 className="w-4.5 h-4.5" style={{ color: accentColor }} />
              : <Home className="w-4.5 h-4.5" style={{ color: accentColor }} />
            }
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm leading-tight">{mortgage.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5 capitalize">
              {mortgage.paymentType} · {mortgage.currency} · {mortgage.tenure}yr
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDelete(mortgage.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 pb-4 pl-8">
        <div className="flex items-center gap-6">
          {/* Ring */}
          <ProgressRing
            percent={m.percentPaid}
            size={88}
            stroke={7}
            color={color}
            label="paid"
          />

          {/* Primary metrics */}
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 leading-none">
                  {formatCurrency(m.baseMonthly, mortgage.currency)}
                </span>
                <span className="text-xs text-slate-400">/mo</span>
              </div>
              {m.additionalMonthly > 0 && (
                <p className="text-xs text-blue-600 font-medium mt-0.5">
                  {formatCurrency(m.trueMonthly, mortgage.currency)}/mo true cost
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 leading-none mb-1">Outstanding</p>
                <p className="text-sm font-semibold tabular-nums text-slate-800">
                  {formatCurrency(m.principalRemaining, mortgage.currency)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 leading-none mb-1">Payoff</p>
                <p className="text-sm font-semibold text-slate-800">{formatDate(m.payoffDate)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 leading-none mb-1">Interest left</p>
                <p className="text-sm font-semibold tabular-nums text-red-500">
                  {formatCurrency(m.interestRemaining, mortgage.currency)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 leading-none mb-1">Paid in</p>
                <p className="text-sm font-semibold tabular-nums text-emerald-600">
                  {formatCurrency(m.principalPaid, mortgage.currency)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar timeline */}
        <div className="mt-4">
          <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatDate(mortgage.startDate)}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.bg} ${status.text2}`}>
              {status.text}
            </span>
            <span className="flex items-center gap-1">
              {formatDate(m.payoffDate)} <Calendar className="w-3 h-3" />
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${m.percentPaid}%`,
                background: `linear-gradient(90deg, ${color}99, ${color})`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-3 pl-8 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-1 min-w-0 flex-wrap">
          {mortgage.extraPaymentEnabled && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-semibold border border-emerald-100">
              <TrendingDown className="w-2.5 h-2.5" /> Extra payments
            </span>
          )}
          {(mortgage.propertyTax || mortgage.homeInsurance || mortgage.hoaFees) ? (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold border border-blue-100">
              <Layers className="w-2.5 h-2.5" /> Costs tracked
            </span>
          ) : null}
          {!isInvestment && onConvertToInvestment && (
            <button
              onClick={() => onConvertToInvestment(mortgage)}
              className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-semibold border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <RefreshCw className="w-2.5 h-2.5" /> Convert to rental
            </button>
          )}
        </div>
        <Link
          to={`/mortgage?load=${mortgage.id}`}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:text-blue-700 transition-colors flex-shrink-0"
        >
          Open calculator <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default MortgageCard;
