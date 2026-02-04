import React from 'react';
import { HelpTooltip } from '../HelpTooltip';
import { InvestmentDetails } from './InvestmentDetails';
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatting';
import { CARD_SHADOW, CARD_STYLE } from '../../constants/styles';
import type { NumberInputHook, PaymentType } from '../../types/mortgage';

interface InvestmentSummaryCardProps {
  monthlyRentInput: NumberInputHook;
  vacancyRate: number;
  setVacancyRate: (value: number) => void;
  propertyManagementPercent: number;
  setPropertyManagementPercent: (value: number) => void;
  maintenanceInput: NumberInputHook;
  utilitiesInput: NumberInputHook;
  propertyAppreciationRate: number;
  setPropertyAppreciationRate: (value: number) => void;
  futureMonthlyRent5Year: number;
  futureMonthlyRent10Year: number;
  futureMonthlyRent15Year: number;
  rentIncrease5Year: number;
  rentIncrease10Year: number;
  rentIncrease15Year: number;
  paymentAmount: number;
  paymentType: PaymentType;
  totalMonthlyCosts: number;
  trueMonthlyPayment: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  cashOnCashReturn: number;
  capRate: number;
  breakEvenOccupancy: number;
  loanAmount: number;
  totalPaid: number;
  totalInterest: number;
}

const InvestmentSummaryCard: React.FC<InvestmentSummaryCardProps> = ({
  monthlyRentInput,
  vacancyRate,
  setVacancyRate,
  propertyManagementPercent,
  setPropertyManagementPercent,
  maintenanceInput,
  utilitiesInput,
  propertyAppreciationRate,
  setPropertyAppreciationRate,
  futureMonthlyRent5Year,
  futureMonthlyRent10Year,
  futureMonthlyRent15Year,
  rentIncrease5Year,
  rentIncrease10Year,
  rentIncrease15Year,
  paymentAmount,
  paymentType,
  totalMonthlyCosts,
  trueMonthlyPayment,
  monthlyCashFlow,
  annualCashFlow,
  cashOnCashReturn,
  capRate,
  breakEvenOccupancy,
  loanAmount,
  totalPaid,
  totalInterest
}) => {
  return (
    <div className={`${CARD_STYLE} grid grid-cols-2 gap-3`} style={CARD_SHADOW}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-xl pointer-events-none"></div>

      <InvestmentDetails
        monthlyRentInput={monthlyRentInput}
        vacancyRate={vacancyRate}
        setVacancyRate={setVacancyRate}
        propertyManagementPercent={propertyManagementPercent}
        setPropertyManagementPercent={setPropertyManagementPercent}
        maintenanceInput={maintenanceInput}
        utilitiesInput={utilitiesInput}
        propertyAppreciationRate={propertyAppreciationRate}
        setPropertyAppreciationRate={setPropertyAppreciationRate}
        futureMonthlyRent5Year={futureMonthlyRent5Year}
        futureMonthlyRent10Year={futureMonthlyRent10Year}
        futureMonthlyRent15Year={futureMonthlyRent15Year}
        rentIncrease5Year={rentIncrease5Year}
        rentIncrease10Year={rentIncrease10Year}
        rentIncrease15Year={rentIncrease15Year}
      />

      {/* Right: Investment Analysis KPIs */}
      <div className="relative p-3">
        <h2 className="text-sm font-serif text-slate-800 mb-2 tracking-wide border-b-2 pb-1.5 font-bold relative flex items-center gap-1" style={{ borderImage: 'linear-gradient(to right, rgb(34, 197, 94), rgb(16, 185, 129)) 1' }}>
          <span className="text-base">💰</span>
          <span className="text-xs">Investment Analysis</span>
          <div className="absolute -bottom-0.5 left-0 w-10 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500"></div>
        </h2>

        {/* Payment Details - Top Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          <div className="p-2 rounded-lg border-2 bg-blue-50 border-blue-300">
            <div className="flex flex-col">
              <span className="text-[9px] font-semibold text-slate-700">Base Payment</span>
              <span className="text-sm font-bold text-blue-700 mt-0.5">
                {formatCurrency(paymentAmount)}
              </span>
              <span className="text-[8px] text-slate-600">{paymentType === 'monthly' ? 'Monthly' : 'Bi-weekly'}</span>
            </div>
          </div>

          {totalMonthlyCosts > 0 && (
            <div className="p-2 rounded-lg border-2 bg-purple-50 border-purple-300">
              <div className="flex flex-col">
                <span className="text-[9px] font-semibold text-slate-700">With Add'l Costs</span>
                <span className="text-sm font-bold text-purple-700 mt-0.5">
                  {formatCurrency(paymentType === 'monthly' ? trueMonthlyPayment : paymentAmount + totalMonthlyCosts / 2)}
                </span>
                <span className="text-[8px] text-slate-600">+{formatCurrency(totalMonthlyCosts)}/mo</span>
              </div>
            </div>
          )}
        </div>

        {/* Investment KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Cash Flow */}
          <div className={`p-2 rounded-lg border-2 ${monthlyCashFlow >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <div className="flex flex-col">
              <span className="text-[9px] font-semibold text-slate-700 flex items-center gap-0.5">
                Cash Flow <HelpTooltip content="Monthly profit after all expenses" />
              </span>
              <span className={`text-sm font-bold mt-0.5 ${monthlyCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(monthlyCashFlow)}
              </span>
              <span className="text-[8px] text-slate-600">Annual: {formatCurrencyCompact(annualCashFlow)}</span>
            </div>
          </div>

          {/* CoC Return */}
          <div className="p-2 rounded-lg border-2 bg-blue-50 border-blue-300">
            <div className="flex flex-col">
              <span className="text-[9px] font-semibold text-slate-700 flex items-center gap-0.5">
                CoC Return <HelpTooltip content="Annual return on down payment" />
              </span>
              <span className="text-sm font-bold text-blue-700 mt-0.5">
                {cashOnCashReturn.toFixed(1)}%
              </span>
              <span className="text-[8px] text-slate-600">
                {cashOnCashReturn >= 12 ? '💚 Excellent' : cashOnCashReturn >= 8 ? '✅ Good' : '⚠️ Fair'}
              </span>
            </div>
          </div>

          {/* Cap Rate */}
          <div className="p-2 rounded-lg border-2 bg-purple-50 border-purple-300">
            <div className="flex flex-col">
              <span className="text-[9px] font-semibold text-slate-700 flex items-center gap-0.5">
                Cap Rate <HelpTooltip content="Property earning potential" />
              </span>
              <span className="text-sm font-bold text-purple-700 mt-0.5">
                {capRate.toFixed(1)}%
              </span>
              <span className="text-[8px] text-slate-600">
                {capRate >= 8 ? '💚 Strong' : capRate >= 5 ? '✅ Average' : '⚠️ Low'}
              </span>
            </div>
          </div>

          {/* Break-Even */}
          <div className="p-2 rounded-lg border-2 bg-amber-50 border-amber-300">
            <div className="flex flex-col">
              <span className="text-[9px] font-semibold text-slate-700 flex items-center gap-0.5">
                Break-Even <HelpTooltip content="Min occupancy needed" />
              </span>
              <span className="text-sm font-bold text-amber-700 mt-0.5">
                {breakEvenOccupancy.toFixed(1)}%
              </span>
              <span className="text-[8px] text-slate-600">
                {breakEvenOccupancy < 75 ? '💚 Safe' : breakEvenOccupancy < 85 ? '⚠️ Moderate' : '❌ Risky'}
              </span>
            </div>
          </div>
        </div>

        {/* Cost Breakdown for Investment - Aligned with Rental Projections */}
        <div className="mt-3 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] font-semibold text-slate-700 flex items-center gap-1">
              <span aria-label="Money icon">💰</span> Loan Cost Breakdown
              <HelpTooltip content="Shows how your total payment is divided between principal and interest" />
            </p>
          </div>
          <div
            className="flex h-4 rounded-md overflow-hidden shadow-inner border border-slate-200 mb-1"
            role="img"
            aria-label={`Investment property loan cost breakdown: ${((loanAmount / totalPaid) * 100).toFixed(0)}% principal (${formatCurrency(loanAmount)}) and ${((totalInterest / totalPaid) * 100).toFixed(0)}% interest (${formatCurrency(totalInterest)}) of total payment ${formatCurrency(totalPaid)}`}
          >
            <div
              className="bg-gradient-to-r from-emerald-400 to-emerald-500 flex items-center justify-center text-[8px] font-bold text-white"
              style={{ width: `${((loanAmount / totalPaid) * 100).toFixed(1)}%` }}
              aria-label={`Principal: ${((loanAmount / totalPaid) * 100).toFixed(0)}%`}
            >
              {((loanAmount / totalPaid) * 100).toFixed(0)}%
            </div>
            <div
              className="bg-gradient-to-r from-red-400 to-red-500 flex items-center justify-center text-[8px] font-bold text-white"
              style={{ width: `${((totalInterest / totalPaid) * 100).toFixed(1)}%` }}
              aria-label={`Interest: ${((totalInterest / totalPaid) * 100).toFixed(0)}%`}
            >
              {((totalInterest / totalPaid) * 100).toFixed(0)}%
            </div>
          </div>
          <div className="flex justify-between text-[7px] text-slate-600">
            <span>Principal: {formatCurrencyCompact(loanAmount)}</span>
            <span>Interest: {formatCurrencyCompact(totalInterest)}</span>
          </div>
          <div className="mt-1 text-[7px] text-slate-500 text-center">
            Total: {formatCurrencyCompact(totalPaid)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentSummaryCard;
