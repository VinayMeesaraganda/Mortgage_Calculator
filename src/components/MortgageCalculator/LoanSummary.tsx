import React from 'react';
import { formatCurrency, formatCurrencyCompact, formatDate, formatYearsMonths } from '../../utils/formatting';
import type { PaymentType } from '../../types/mortgage';

interface LoanSummaryProps {
  loanAmount: number;
  paymentAmount: number;
  totalMonthlyCosts: number;
  truePaymentAmount: number;
  totalPaid: number;
  yearsToPayoff: number;
  endDate: string;
  totalInterest: number;
  paymentType: PaymentType;
}

const LoanSummary: React.FC<LoanSummaryProps> = ({
  loanAmount,
  paymentAmount,
  totalMonthlyCosts,
  truePaymentAmount,
  totalPaid,
  yearsToPayoff,
  endDate,
  totalInterest,
  paymentType,
}) => {
  const principalPct = totalPaid > 0 ? (loanAmount / totalPaid) * 100 : 50;
  const interestPct = 100 - principalPct;
  const paymentIntervalLabel = paymentType === 'biweekly' ? '/bi-weekly' : '/mo';
  const paymentFrequencyLabel = paymentType === 'biweekly' ? 'Bi-weekly' : 'Monthly';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      {/* Hero row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">{formatCurrency(paymentAmount)}</span>
            <span className="text-sm text-slate-400">{paymentIntervalLabel}</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{paymentFrequencyLabel} Principal + Interest</div>
          {totalMonthlyCosts > 0 && (
            <div className="mt-1 text-sm font-semibold text-blue-600">
              {formatCurrency(truePaymentAmount)}{paymentIntervalLabel} true cost
              <span className="text-xs text-slate-400 font-normal ml-1">incl. tax, insurance &amp; fees</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Payoff</div>
          <div className="text-base font-bold text-blue-700">{formatDate(endDate)}</div>
          <div className="text-xs text-slate-400">{formatYearsMonths(yearsToPayoff)}</div>
        </div>
      </div>

      {/* Cost breakdown bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Principal <span className="font-semibold text-emerald-600">{principalPct.toFixed(0)}%</span></span>
          <span>Interest <span className="font-semibold text-red-500">{interestPct.toFixed(0)}%</span></span>
        </div>
        <div className="flex h-5 rounded-lg overflow-hidden border border-slate-200">
          <div
            className="bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold"
            style={{ width: `${principalPct}%` }}
          >
            {formatCurrencyCompact(loanAmount)}
          </div>
          <div
            className="bg-red-400 flex items-center justify-center text-white text-[10px] font-bold"
            style={{ width: `${interestPct}%` }}
          >
            {formatCurrencyCompact(totalInterest)}
          </div>
        </div>
        <div className="text-center text-xs text-slate-400 mt-1">
          Total paid over loan life: <span className="font-semibold text-slate-600">{formatCurrency(totalPaid)}</span>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
        <div>
          <div className="text-xs text-slate-400">Loan amount</div>
          <div className="text-sm font-semibold text-slate-800">{formatCurrency(loanAmount)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Total interest</div>
          <div className="text-sm font-semibold text-red-500">{formatCurrency(totalInterest)}</div>
        </div>
      </div>
    </div>
  );
};

export default LoanSummary;
