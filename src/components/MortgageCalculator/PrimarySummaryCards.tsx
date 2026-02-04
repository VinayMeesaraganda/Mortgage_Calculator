import React from 'react';
import { HelpTooltip } from '../HelpTooltip';
import { formatCurrency, formatDate, formatYearsMonths } from '../../utils/formatting';
import { CARD_SHADOW, CARD_STYLE } from '../../constants/styles';

interface PrimarySummaryCardsProps {
  loanAmount: number;
  paymentAmount: number;
  totalMonthlyCosts: number;
  trueMonthlyPayment: number;
  totalPaid: number;
  yearsToPayoff: number;
  endDate: string;
  totalInterest: number;
}

const PrimarySummaryCards: React.FC<PrimarySummaryCardsProps> = ({
  loanAmount,
  paymentAmount,
  totalMonthlyCosts,
  trueMonthlyPayment,
  totalPaid,
  yearsToPayoff,
  endDate,
  totalInterest
}) => {
  return (
    <>
      {/* Primary Home - Payment Summary - Compact */}
      <div className={CARD_STYLE} style={CARD_SHADOW}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-xl pointer-events-none"></div>
        <div className="relative p-2">
          <h2 className="text-sm font-serif text-slate-800 mb-1.5 tracking-wide border-b-2 pb-1 font-bold relative" style={{ borderImage: 'linear-gradient(to right, rgb(148, 163, 184), rgb(203, 213, 225)) 1' }}>
            Payment Summary
            <div className="absolute -bottom-0.5 left-0 w-10 h-0.5 bg-gradient-to-r from-slate-500 to-gray-500"></div>
          </h2>
          <table className="w-full text-[11px]">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-1 px-1 text-slate-700">Loan Amount</td>
                <td className="py-1 px-1 text-right font-semibold text-slate-900">{formatCurrency(loanAmount)}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 px-1 text-slate-700">Payment</td>
                <td className="py-1 px-1 text-right font-semibold text-slate-900">{formatCurrency(paymentAmount)}</td>
              </tr>
              {totalMonthlyCosts > 0 && (
                <tr className="border-b-2 border-blue-300 bg-blue-50">
                  <td className="py-1 px-1 text-slate-800 font-bold text-[10px]">Total Monthly</td>
                  <td className="py-1 px-1 text-right font-bold text-blue-700">{formatCurrency(trueMonthlyPayment)}</td>
                </tr>
              )}
              <tr className="border-b border-slate-100">
                <td className="py-1 px-1 text-slate-700 text-[10px]">Total Paid</td>
                <td className="py-1 px-1 text-right font-semibold text-slate-900 text-[10px]">{formatCurrency(totalPaid)}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 px-1 text-slate-700 text-[10px]">Term</td>
                <td className="py-1 px-1 text-right font-semibold text-slate-900 text-[10px]">{formatYearsMonths(yearsToPayoff)}</td>
              </tr>
              <tr>
                <td className="py-1 px-1 text-slate-700 text-[10px]">Payment End Date</td>
                <td className="py-1 px-1 text-right font-semibold text-slate-900 text-[10px]">{formatDate(endDate)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Primary Home - Cost Breakdown - Compact */}
      <div className={CARD_STYLE} style={CARD_SHADOW}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-xl pointer-events-none"></div>
        <div className="relative p-2">
          <h2 className="text-sm font-serif text-slate-800 mb-1.5 tracking-wide border-b-2 pb-1 font-bold relative flex items-center" style={{ borderImage: 'linear-gradient(to right, rgb(148, 163, 184), rgb(203, 213, 225)) 1' }}>
            Cost Breakdown
            <HelpTooltip content="Shows how your total payment is divided between the actual loan amount (principal) and the cost of borrowing (interest)." />
            <div className="absolute -bottom-0.5 left-0 w-10 h-0.5 bg-gradient-to-r from-slate-500 to-gray-500"></div>
          </h2>
          <div className="flex flex-row gap-2 mb-2">
            <div className="flex-1 bg-gradient-to-br from-emerald-50/80 to-green-100/80 rounded-lg p-2 border-2 border-emerald-300/60 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 hover:border-emerald-400 backdrop-blur-sm relative overflow-hidden group/card">
              <div className="relative text-center">
                <div className="text-base font-serif font-bold text-emerald-700 mb-0.5">
                  {((loanAmount / totalPaid) * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] text-emerald-600 uppercase tracking-wide font-medium">
                  Principal
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                  {formatCurrency(loanAmount)}
                </div>
              </div>
            </div>
            <div className="flex-1 bg-gradient-to-br from-red-50/80 to-rose-100/80 rounded-lg p-2 border-2 border-red-300/60 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 hover:border-red-400 backdrop-blur-sm relative overflow-hidden group/card">
              <div className="relative text-center">
                <div className="text-base font-serif font-bold text-red-700 mb-0.5">
                  {((totalInterest / totalPaid) * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] text-red-600 uppercase tracking-wide font-medium">
                  Interest
                </div>
                <div className="text-[10px] text-red-700 font-semibold mt-0.5">
                  {formatCurrency(totalInterest)}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Breakdown Bar - Compact */}
          <div className="mt-1.5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-slate-600">Total Payment</span>
              <span className="text-xs font-bold text-slate-800">{formatCurrency(totalPaid)}</span>
            </div>
            <div
              className="flex h-6 rounded-lg overflow-hidden shadow-inner border-2 border-slate-200"
              role="img"
              aria-label={`Mortgage cost breakdown: ${((loanAmount / totalPaid) * 100).toFixed(0)}% principal (${formatCurrency(loanAmount)}) and ${((totalInterest / totalPaid) * 100).toFixed(0)}% interest (${formatCurrency(totalInterest)}) of total payment ${formatCurrency(totalPaid)}`}
            >
              <div
                className="bg-gradient-to-r from-emerald-400 to-emerald-500 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
                style={{ width: `${((loanAmount / totalPaid) * 100).toFixed(1)}%` }}
                aria-label={`Principal: ${((loanAmount / totalPaid) * 100).toFixed(0)}% or ${formatCurrency(loanAmount)}`}
              >
                {((loanAmount / totalPaid) * 100).toFixed(0)}%
              </div>
              <div
                className="bg-gradient-to-r from-red-400 to-red-500 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
                style={{ width: `${((totalInterest / totalPaid) * 100).toFixed(1)}%` }}
                aria-label={`Interest: ${((totalInterest / totalPaid) * 100).toFixed(0)}% or ${formatCurrency(totalInterest)}`}
              >
                {((totalInterest / totalPaid) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrimarySummaryCards;
