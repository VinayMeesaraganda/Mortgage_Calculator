import React from 'react';
import { Check, Edit2, Home, Trash2, X } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatting';
import type { SavedMortgage, ScheduleItem } from '../../types/mortgage';
import { calculateMonthlyAmortization, calculateBiweeklyAmortization } from '../../utils/calculations';
import { calculateMonthlyPayment } from '../../utils/calculations-helpers';

interface MortgageTrackerProps {
  savedMortgages: SavedMortgage[];
  selectedMortgageId: string | null;
  schedule: ScheduleItem[];
  totalInterest: number;
  endDate: string;
  saveError: string | null;
  isSavingMortgage: boolean;
  editingMortgageName: string | null;
  editingMortgageNameValue: string;
  setEditingMortgageName: (id: string | null) => void;
  setEditingMortgageNameValue: (value: string) => void;
  onLoadMortgage: (mortgage: SavedMortgage) => void;
  onDeleteMortgage: (mortgageId: string) => void;
  onUpdateMortgageName: (mortgageId: string, newName: string) => void;
}

const MortgageTracker: React.FC<MortgageTrackerProps> = ({
  savedMortgages,
  selectedMortgageId,
  schedule,
  totalInterest,
  endDate,
  saveError,
  isSavingMortgage,
  editingMortgageName,
  editingMortgageNameValue,
  setEditingMortgageName,
  setEditingMortgageNameValue,
  onLoadMortgage,
  onDeleteMortgage,
  onUpdateMortgageName
}) => {
  if (savedMortgages.length === 0) return null;

  return (
    <div id="mortgage-tracker" className="mt-6 mb-6">
      <div className="bg-white rounded-xl shadow-xl border-2 border-blue-100 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Home className="w-6 h-6 text-blue-600" />
          Mortgage Tracker
        </h2>

        <div className="space-y-4">
          {savedMortgages.map((mortgage) => {
            const loanAmount = mortgage.homeValue - mortgage.downPayment;
            const isCurrentMortgage = selectedMortgageId === mortgage.id;
            const baseMonthly = calculateMonthlyPayment(loanAmount, mortgage.interestRate, mortgage.tenure);
            const paymentAmount = mortgage.paymentType === 'biweekly' ? baseMonthly / 2 : baseMonthly;
            const paymentIntervalLabel = mortgage.paymentType === 'biweekly' ? '/bi-weekly' : '/mo';

            // Additional monthly costs
            const taxMonthly = mortgage.propertyTax
              ? (mortgage.propertyTaxPeriod === 'month' ? mortgage.propertyTax : mortgage.propertyTax / 12)
              : 0;
            const insuranceMonthly = mortgage.homeInsurance
              ? (mortgage.homeInsurancePeriod === 'month' ? mortgage.homeInsurance : mortgage.homeInsurance / 12)
              : 0;
            const pmiMonthly = mortgage.pmiAmount || 0;
            const hoaMonthly = mortgage.hoaFees || 0;
            const additionalMonthly = taxMonthly + insuranceMonthly + pmiMonthly + hoaMonthly;
            const additionalPerPayment = mortgage.paymentType === 'biweekly'
              ? (additionalMonthly * 12) / 26
              : additionalMonthly;
            const truePaymentAmount = paymentAmount + additionalPerPayment;

            // Paid vs remaining calculations
            let principalPaidFromPayments = 0;
            let interestPaid = 0;
            let principalRemaining = loanAmount;
            let interestRemaining = 0;
            let payoffDate = formatDate(endDate);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDateObj = new Date(mortgage.startDate);
            startDateObj.setHours(0, 0, 0, 0);

            if (isCurrentMortgage && schedule.length > 0) {
              schedule.forEach((item) => {
                const paymentDate = new Date(item.date);
                paymentDate.setHours(0, 0, 0, 0);
                if (paymentDate >= startDateObj && paymentDate <= today) {
                  principalPaidFromPayments += item.principal;
                  interestPaid += item.interest;
                }
              });
              principalRemaining = Math.max(0, loanAmount - principalPaidFromPayments);
              interestRemaining = Math.max(0, totalInterest - interestPaid);
            } else {
              const annualRate = mortgage.interestRate / 100;
              const effectiveExtraFrequency = mortgage.extraPaymentEnabled
                ? (mortgage.extraPaymentFrequency === 'biweekly' && mortgage.paymentType === 'biweekly' ? 'biweekly' : 'monthly')
                : 'monthly';
              const mortgageOneTimePayments = mortgage.oneTimePayments || [];

              const calculation = mortgage.paymentType === 'biweekly'
                ? calculateBiweeklyAmortization(
                    loanAmount, annualRate,
                    calculateMonthlyPayment(loanAmount, mortgage.interestRate, mortgage.tenure),
                    mortgage.startDate,
                    mortgage.extraPaymentEnabled && effectiveExtraFrequency === 'biweekly',
                    mortgage.extraPaymentStartDate, 'biweekly',
                    mortgage.extraPaymentAmount, mortgageOneTimePayments
                  )
                : calculateMonthlyAmortization(
                    loanAmount, annualRate, mortgage.tenure, mortgage.startDate,
                    mortgage.extraPaymentEnabled && effectiveExtraFrequency === 'monthly',
                    mortgage.extraPaymentStartDate, 'monthly',
                    mortgage.extraPaymentAmount, mortgageOneTimePayments
                  );

              payoffDate = formatDate(calculation.endDate);

              calculation.schedule.forEach((item) => {
                const paymentDate = new Date(item.date);
                paymentDate.setHours(0, 0, 0, 0);
                if (paymentDate >= startDateObj && paymentDate <= today) {
                  principalPaidFromPayments += item.principal;
                  interestPaid += item.interest;
                }
              });
              principalRemaining = Math.max(0, loanAmount - principalPaidFromPayments);
              interestRemaining = Math.max(0, calculation.totalInterest - interestPaid);
            }

            const percentPaid = loanAmount > 0
              ? Math.min(100, (principalPaidFromPayments / loanAmount) * 100)
              : 0;

            return (
              <div
                key={mortgage.id}
                className={`p-5 rounded-xl border-2 transition-colors ${
                  isCurrentMortgage ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 bg-white'
                }`}
              >
                {/* Header: name + actions */}
                <div className="flex items-center justify-between mb-4">
                  {editingMortgageName === mortgage.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingMortgageNameValue}
                        onChange={(e) => setEditingMortgageNameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') onUpdateMortgageName(mortgage.id, editingMortgageNameValue);
                          else if (e.key === 'Escape') { setEditingMortgageName(null); setEditingMortgageNameValue(''); }
                        }}
                        className="flex-1 px-3 py-1.5 text-base font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                      />
                      <button onClick={() => onUpdateMortgageName(mortgage.id, editingMortgageNameValue)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setEditingMortgageName(null); setEditingMortgageNameValue(''); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3 className="text-base font-bold text-slate-800">{mortgage.name}</h3>
                        <span className="text-xs text-slate-400 capitalize">{mortgage.paymentType} · started {formatDate(mortgage.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { onLoadMortgage(mortgage); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Load and edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteMortgage(mortgage.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Hero row: monthly payment + payoff */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {formatCurrency(paymentAmount, mortgage.currency)}<span className="text-sm font-normal text-slate-500">{paymentIntervalLabel}</span>
                    </div>
                    {additionalMonthly > 0 && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {formatCurrency(truePaymentAmount, mortgage.currency)}{paymentIntervalLabel} true cost · incl. tax, insurance &amp; fees
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Payoff</div>
                    <div className="text-base font-bold text-blue-600">{payoffDate}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{formatCurrency(principalPaidFromPayments, mortgage.currency)} paid</span>
                    <span className="font-semibold">{percentPaid.toFixed(0)}% done</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                      style={{ width: `${percentPaid}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{formatCurrency(0, mortgage.currency)}</span>
                    <span>{formatCurrency(loanAmount, mortgage.currency)} loan</span>
                  </div>
                </div>

                {/* Secondary stats */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-3 border-t border-slate-100 text-sm">
                  <div>
                    <div className="text-xs text-slate-400">Outstanding balance</div>
                    <div className="font-semibold text-red-500">
                      {formatCurrency(isNaN(principalRemaining) ? loanAmount : principalRemaining, mortgage.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Interest paid to date</div>
                    <div className="font-semibold text-slate-700">{formatCurrency(interestPaid, mortgage.currency)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Interest remaining</div>
                    <div className="font-semibold text-slate-700">
                      {formatCurrency(isNaN(interestRemaining) ? 0 : interestRemaining, mortgage.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Loan amount</div>
                    <div className="font-semibold text-slate-700">{formatCurrency(loanAmount, mortgage.currency)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {saveError && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{saveError}</div>
        )}
        {isSavingMortgage && (
          <div className="mt-4 text-sm text-blue-500">Saving…</div>
        )}
      </div>
    </div>
  );
};

export default MortgageTracker;
