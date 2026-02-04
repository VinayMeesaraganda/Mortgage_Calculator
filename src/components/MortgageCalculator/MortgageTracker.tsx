import React from 'react';
import { Check, Edit2, Home, Trash2, X } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatting';
import type { SavedMortgage, ScheduleItem } from '../../types/mortgage';

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

        {savedMortgages.map((mortgage) => {
          // Calculate current mortgage metrics
          const mortgageLoanAmount = mortgage.homeValue - mortgage.downPayment;
          const isCurrentMortgage = selectedMortgageId === mortgage.id;

          // Calculate paid and remaining amounts from start date to today
          let principalPaidFromPayments = 0; // Principal paid from loan payments (excluding down payment)
          let principalPaid = mortgage.downPayment; // Total principal paid (including down payment)
          let interestPaid = 0;
          let principalRemaining = mortgageLoanAmount;
          let interestRemaining = 0;

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const startDateObj = new Date(mortgage.startDate);
          startDateObj.setHours(0, 0, 0, 0);

          if (isCurrentMortgage && schedule.length > 0) {
            // Use current schedule if this is the selected mortgage
            // Only count payments from start date to today
            schedule.forEach((item) => {
              const paymentDate = new Date(item.date);
              paymentDate.setHours(0, 0, 0, 0);

              if (paymentDate >= startDateObj && paymentDate <= today) {
                principalPaidFromPayments += item.principal;
                principalPaid += item.principal;
                interestPaid += item.interest;
              }
            });

            // Outstanding loan = loan amount - principal paid from payments
            principalRemaining = Math.max(0, mortgageLoanAmount - principalPaidFromPayments);

            // Calculate remaining interest (total interest - interest paid)
            interestRemaining = Math.max(0, totalInterest - interestPaid);
          } else {
            // For other mortgages, recalculate schedule to get accurate numbers
            const monthsElapsed = Math.max(0, Math.floor((today.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
            const totalMonths = mortgage.tenure * 12;

            if (monthsElapsed > 0 && monthsElapsed < totalMonths) {
              // Recalculate schedule for this mortgage
              const mortgageLoan = mortgage.homeValue - mortgage.downPayment;
              const monthlyRate = mortgage.interestRate / 100 / 12;

              let paymentAmount;
              let numPayments;
              let totalInterestForMortgage;

              if (mortgage.paymentType === 'biweekly') {
                // Biweekly payment calculation
                numPayments = mortgage.tenure * 26; // 26 biweekly periods per year
                // Calculate monthly payment first, then divide by 2 for biweekly
                const monthlyPayment = (mortgageLoan * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
                  (Math.pow(1 + monthlyRate, totalMonths) - 1);
                paymentAmount = monthlyPayment / 2;

                // For biweekly, simulate the full schedule to get accurate total interest
                const dailyRate = mortgage.interestRate / 100 / 365;
                let simBalance = mortgageLoan;
                let simTotalInterest = 0;
                let paymentsProcessed = 0;

                while (simBalance > 0.01 && paymentsProcessed < numPayments) {
                  const interest = simBalance * dailyRate * 14; // 14 days interest
                  const principal = Math.min(paymentAmount - interest, simBalance);
                  simBalance -= principal;
                  simTotalInterest += interest;
                  paymentsProcessed++;
                }
                totalInterestForMortgage = simTotalInterest;
              } else {
                // Monthly payment calculation (correct)
                numPayments = mortgage.tenure * 12;
                paymentAmount = (mortgageLoan * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
                  (Math.pow(1 + monthlyRate, numPayments) - 1);
                totalInterestForMortgage = (paymentAmount * numPayments) - mortgageLoan;
              }

              if (isNaN(paymentAmount) || !isFinite(paymentAmount)) {
                // Fallback calculation if payment amount calculation fails
                principalRemaining = mortgageLoanAmount;
                interestRemaining = (mortgageLoanAmount * mortgage.interestRate / 100 * mortgage.tenure);
              } else {
                let balance = mortgageLoan;

                if (mortgage.paymentType === 'biweekly') {
                  // Calculate biweekly payments up to today
                  const dailyRate = mortgage.interestRate / 100 / 365;
                  const biweeklyPeriodsElapsed = Math.floor(monthsElapsed * 2.17); // ~26 periods per year / 12 months

                  for (let i = 0; i < biweeklyPeriodsElapsed && balance > 0.01; i++) {
                    const interest = balance * dailyRate * 14; // 14 days interest
                    const principal = Math.min(paymentAmount - interest, balance);
                    balance -= principal;
                    principalPaidFromPayments += principal;
                    principalPaid += principal;
                    interestPaid += interest;
                  }
                } else {
                  // Calculate monthly payments up to today
                  for (let i = 0; i < monthsElapsed && i < totalMonths; i++) {
                    const interest = balance * monthlyRate;
                    const principal = Math.min(paymentAmount - interest, balance);
                    balance -= principal;
                    principalPaidFromPayments += principal;
                    principalPaid += principal;
                    interestPaid += interest;
                  }
                }

                // Outstanding loan = loan amount - principal paid from payments
                principalRemaining = Math.max(0, mortgageLoanAmount - principalPaidFromPayments);

                // Calculate remaining interest
                interestRemaining = Math.max(0, totalInterestForMortgage - interestPaid);
              }
            } else if (monthsElapsed >= totalMonths) {
              // Loan is fully paid
              principalPaidFromPayments = mortgageLoanAmount;
              principalPaid = mortgage.downPayment + mortgageLoanAmount;
              principalRemaining = 0;
              const totalInterestForMortgage = (mortgageLoanAmount * mortgage.interestRate / 100 * mortgage.tenure);
              interestPaid = totalInterestForMortgage;
              interestRemaining = 0;
            } else {
              // Loan hasn't started yet
              principalRemaining = mortgageLoanAmount;
              const totalInterestForMortgage = (mortgageLoanAmount * mortgage.interestRate / 100 * mortgage.tenure);
              interestRemaining = totalInterestForMortgage;
            }
          }

          return (
            <div
              key={mortgage.id}
              className={`mb-4 p-4 rounded-lg border-2 ${isCurrentMortgage
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-slate-50'
                }`}
            >
              {/* Mortgage Name */}
              <div className="flex items-center justify-between mb-4">
                {editingMortgageName === mortgage.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingMortgageNameValue}
                      onChange={(e) => setEditingMortgageNameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdateMortgageName(mortgage.id, editingMortgageNameValue);
                        } else if (e.key === 'Escape') {
                          setEditingMortgageName(null);
                          setEditingMortgageNameValue('');
                        }
                      }}
                      className="flex-1 px-3 py-2 text-base font-semibold border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => onUpdateMortgageName(mortgage.id, editingMortgageNameValue)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingMortgageName(null);
                        setEditingMortgageNameValue('');
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-slate-800">{mortgage.name}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onLoadMortgage(mortgage);
                          // Scroll to top of calculator to see the loaded values
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Load and edit mortgage"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteMortgage(mortgage.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Loan Amount Taken */}
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-600 mb-1">Loan Amount Taken</div>
                  <div className="text-lg font-bold text-slate-800">
                    {formatCurrency(mortgageLoanAmount, mortgage.currency)}
                  </div>
                </div>

                {/* Outstanding Loan */}
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-600 mb-1">Outstanding Loan</div>
                  <div className="text-lg font-bold text-red-600">
                    {formatCurrency(isNaN(principalRemaining) || !isFinite(principalRemaining) ? mortgageLoanAmount : Math.max(0, principalRemaining), mortgage.currency)}
                  </div>
                </div>

                {/* Payment Type */}
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-600 mb-1">Payment Type</div>
                  <div className="text-lg font-bold text-slate-800 capitalize">
                    {mortgage.paymentType}
                  </div>
                  <div className="text-xs text-slate-400 my-1">----</div>
                  <div className="text-xs text-slate-600 mt-2">Start Date</div>
                  <div className="text-sm font-semibold text-slate-700">
                    {formatDate(mortgage.startDate)}
                  </div>
                </div>

                {/* Principal/Interest Paid */}
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-600 mb-1">Paid Till Now</div>
                  <div className="text-sm font-semibold text-green-600 mb-1">
                    Principal: {formatCurrency(principalPaidFromPayments, mortgage.currency)}
                  </div>
                  <div className="text-xs text-slate-400 my-1">---</div>
                  <div className="text-sm font-semibold text-green-600">
                    Interest: {formatCurrency(interestPaid, mortgage.currency)}
                  </div>
                </div>

                {/* Principal/Interest To Be Paid */}
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-600 mb-1">To Be Paid</div>
                  <div className="text-sm font-semibold text-orange-600 mb-1">
                    Principal: {formatCurrency(isNaN(principalRemaining) || !isFinite(principalRemaining) ? 0 : Math.max(0, principalRemaining), mortgage.currency)}
                  </div>
                  <div className="text-xs text-slate-400 my-1">---</div>
                  <div className="text-sm font-semibold text-orange-600">
                    Interest: {formatCurrency(isNaN(interestRemaining) || !isFinite(interestRemaining) ? 0 : Math.max(0, interestRemaining), mortgage.currency)}
                  </div>
                </div>

                {/* End Date */}
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-600 mb-1">End Date</div>
                  <div className="text-lg font-bold text-slate-800">
                    {isCurrentMortgage ? formatDate(endDate) : (() => {
                      const start = new Date(mortgage.startDate);
                      const end = new Date(start);
                      end.setFullYear(end.getFullYear() + mortgage.tenure);
                      return formatDate(end.toISOString().split('T')[0]);
                    })()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {saveError && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded">
            {saveError}
          </div>
        )}
        {isSavingMortgage && (
          <div className="mt-4 text-sm text-blue-600">
            Saving...
          </div>
        )}
      </div>
    </div>
  );
};

export default MortgageTracker;
