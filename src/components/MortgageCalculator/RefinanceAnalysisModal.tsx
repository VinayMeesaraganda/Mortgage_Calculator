import React from 'react';
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

const RefinanceAnalysisModal: React.FC<RefinanceAnalysisModalProps> = ({
  isOpen,
  onClose,
  refinanceData,
  setRefinanceData,
  editingCurrentRate,
  setEditingCurrentRate,
  rawCurrentRate,
  setRawCurrentRate,
  editingNewRate,
  setEditingNewRate,
  rawNewRate,
  setRawNewRate,
  refinanceCalc,
  onApplyRefinance
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-3 sm:px-6 py-3 sm:py-4 rounded-t-lg sm:rounded-t-2xl flex items-center justify-between shadow-lg z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl">💡</span>
            <div>
              <h2 className="text-base sm:text-xl font-bold">Should You Refinance? Let's Find Out</h2>
              <p className="text-[10px] sm:text-xs text-orange-100 mt-0.5 hidden sm:block">Compare your current loan with new refinancing options — See savings & break-even point</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-orange-200 transition-colors text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 flex-shrink-0"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4 italic bg-orange-50 p-3 rounded-lg border border-orange-200">
            🎯 <strong>Considering refinancing?</strong> Enter your current loan details and new loan offer to see if you'll actually save money, and how long it'll take to break even on closing costs.
          </p>

          {/* Input Section */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Current Loan */}
            <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="text-xl">📄</span>
                Current Loan
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Remaining Balance</label>
                  <input
                    type="text"
                    value={refinanceData.remainingBalance.toLocaleString()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setRefinanceData({ ...refinanceData, remainingBalance: val === '' ? 0 : Number(val) });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
                    placeholder="$280,000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Current Interest Rate (%)</label>
                  <input
                    type="text"
                    value={editingCurrentRate ? rawCurrentRate : (refinanceData.currentRate === 0 ? '' : refinanceData.currentRate.toString())}
                    onChange={(e) => {
                      setEditingCurrentRate(true);
                      const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                      // Prevent multiple decimal points
                      const parts = cleaned.split('.');
                      const validValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
                      setRawCurrentRate(validValue);
                      if (validValue === '' || validValue === '.') {
                        setRefinanceData({ ...refinanceData, currentRate: 0 });
                      } else if (/^\d*\.?\d*$/.test(validValue)) {
                        const num = Number(validValue);
                        if (!isNaN(num) && num >= 0) {
                          setRefinanceData({ ...refinanceData, currentRate: num });
                        }
                      }
                    }}
                    onFocus={() => {
                      setEditingCurrentRate(true);
                      setRawCurrentRate(refinanceData.currentRate === 0 ? '' : refinanceData.currentRate.toString());
                    }}
                    onBlur={() => {
                      setEditingCurrentRate(false);
                      setRawCurrentRate('');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
                    placeholder="7.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Current Projected Payoff Date
                    <span className="text-orange-600 ml-1">*</span>
                  </label>
                  <DatePicker
                    value={refinanceData.currentPayoffDate}
                    onChange={(date) => setRefinanceData({ ...refinanceData, currentPayoffDate: date })}
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    📋 Check your mortgage statement - when will it be paid off?
                    {refinanceData.currentPayoffDate && (() => {
                      const dateParts = refinanceData.currentPayoffDate.split('-');
                      const year = parseInt(dateParts[0]);
                      const month = parseInt(dateParts[1]);
                      const day = dateParts.length > 2 ? parseInt(dateParts[2]) : 1;
                      const payoffDate = new Date(year, month - 1, day);
                      const today = new Date();
                      const months = Math.max(0, (payoffDate.getFullYear() - today.getFullYear()) * 12 +
                        (payoffDate.getMonth() - today.getMonth()));
                      const years = Math.floor(months / 12);
                      const remainingMonths = months % 12;
                      return (
                        <span className="block text-green-600 font-semibold mt-1">
                          {years > 0 && `${years} year${years > 1 ? 's' : ''}`}
                          {years > 0 && remainingMonths > 0 && ', '}
                          {remainingMonths > 0 && `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`}
                          {' remaining'}
                        </span>
                      );
                    })()}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Future Extra Payment (Optional)</label>
                  <input
                    type="text"
                    value={refinanceData.currentExtraPayment > 0 ? refinanceData.currentExtraPayment.toLocaleString() : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setRefinanceData({ ...refinanceData, currentExtraPayment: val === '' ? 0 : Number(val) });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
                    placeholder="$0 (if planning to add)"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Will you make ADDITIONAL extras going forward?
                  </p>
                </div>
              </div>
            </div>

            {/* New Refinance Loan */}
            <div className="bg-orange-50 rounded-xl p-4 border-2 border-orange-200">
              <h3 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
                <span className="text-xl">✨</span>
                New Refinance
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">New Interest Rate (%)</label>
                  <input
                    type="text"
                    value={editingNewRate ? rawNewRate : (refinanceData.newRate === 0 ? '' : refinanceData.newRate.toString())}
                    onChange={(e) => {
                      setEditingNewRate(true);
                      const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                      // Prevent multiple decimal points
                      const parts = cleaned.split('.');
                      const validValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
                      setRawNewRate(validValue);
                      if (validValue === '' || validValue === '.') {
                        setRefinanceData({ ...refinanceData, newRate: 0 });
                      } else if (/^\d*\.?\d*$/.test(validValue)) {
                        const num = Number(validValue);
                        if (!isNaN(num) && num >= 0) {
                          setRefinanceData({ ...refinanceData, newRate: num });
                        }
                      }
                    }}
                    onFocus={() => {
                      setEditingNewRate(true);
                      setRawNewRate(refinanceData.newRate === 0 ? '' : refinanceData.newRate.toString());
                    }}
                    onBlur={() => {
                      setEditingNewRate(false);
                      setRawNewRate('');
                    }}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
                    placeholder="6.0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Closing Costs</label>
                  <input
                    type="text"
                    value={refinanceData.closingCosts.toLocaleString()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setRefinanceData({ ...refinanceData, closingCosts: val === '' ? 0 : Number(val) });
                    }}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
                    placeholder="$3,500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">New Loan Term (years)</label>
                  <input
                    type="text"
                    value={refinanceData.newTerm}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setRefinanceData({ ...refinanceData, newTerm: val === '' ? 0 : Number(val) });
                    }}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Monthly Extra Payment (Optional)</label>
                  <input
                    type="text"
                    value={refinanceData.newExtraPayment > 0 ? refinanceData.newExtraPayment.toLocaleString() : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setRefinanceData({ ...refinanceData, newExtraPayment: val === '' ? 0 : Number(val) });
                    }}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
                    placeholder="$0 (if planning extras)"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Will you make extra payments on new loan?
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Results - Break-even Analysis */}
          <div className={`p-4 rounded-xl mb-4 border-2 ${refinanceCalc.worthIt
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
            : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
            }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                {refinanceCalc.worthIt ? (
                  <>
                    <span className="text-2xl">✅</span>
                    <span className="text-green-800">Refinancing Makes Sense!</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">⚠️</span>
                    <span className="text-red-800">Consider Carefully</span>
                  </>
                )}
              </h3>

              {/* Apply to Main Calculator - Visible Location */}
              <button
                onClick={onApplyRefinance}
                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors shadow-md cursor-pointer"
              >
                <span className="text-sm font-bold whitespace-nowrap">🚀 Apply to Calculator</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center p-3 bg-orange-50/30 rounded-lg border border-orange-200">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1 break-words">
                  {refinanceCalc.breakEvenYears.toFixed(1)}
                </div>
                <div className="text-xs text-slate-600 uppercase tracking-wide font-semibold">Years to Break Even</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  ({Math.ceil(refinanceCalc.breakEvenMonths)} months)
                </div>
              </div>
              <div className="text-center p-3 bg-green-50/30 rounded-lg border border-green-200">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1 break-words">
                  {formatCurrency(refinanceCalc.monthlySavings)}
                </div>
                <div className="text-xs text-slate-600 uppercase tracking-wide font-semibold">Monthly Savings</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Lower payment
                </div>
              </div>
              <div className="text-center p-3 bg-blue-50/30 rounded-lg border border-blue-200">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 break-words">
                  {formatCurrency(Math.abs(refinanceCalc.totalSavings))}
                </div>
                <div className="text-xs text-slate-600 uppercase tracking-wide font-semibold">
                  {refinanceCalc.totalSavings > 0 ? 'Total Savings' : 'Extra Cost'}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {refinanceCalc.totalSavings > 0 ? 'Over loan life' : 'Due to longer term'}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-orange-200">
                  <th className="text-left p-3 font-semibold text-slate-700 bg-slate-50">Metric</th>
                  <th className="p-3 font-semibold text-slate-700 bg-slate-100 border-l-2 border-slate-200">Current Loan</th>
                  <th className="p-3 font-semibold text-orange-700 bg-orange-50 border-l-2 border-orange-200">Refinanced Loan</th>
                  <th className="p-3 font-semibold text-blue-700 bg-blue-50 border-l-2 border-blue-200">Difference</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-3 text-slate-600 font-medium">
                    Monthly Payment
                    {(refinanceData.currentExtraPayment > 0 || refinanceData.newExtraPayment > 0) && (
                      <div className="text-[10px] text-slate-500">(Base + Extra)</div>
                    )}
                  </td>
                  <td className="p-3 text-center font-bold text-slate-800 bg-slate-50">
                    {formatCurrency(refinanceCalc.currentMonthlyTotal)}
                    {refinanceData.currentExtraPayment > 0 && (
                      <div className="text-[10px] font-normal text-slate-600">
                        {formatCurrency(refinanceCalc.currentPayment)} + {formatCurrency(refinanceData.currentExtraPayment)}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-center font-bold text-orange-700 bg-orange-50/30">
                    {formatCurrency(refinanceCalc.newMonthlyTotal)}
                    {refinanceData.newExtraPayment > 0 && (
                      <div className="text-[10px] font-normal text-slate-600">
                        {formatCurrency(refinanceCalc.newPayment)} + {formatCurrency(refinanceData.newExtraPayment)}
                      </div>
                    )}
                  </td>
                  <td className={`p-3 text-center font-bold ${refinanceCalc.currentMonthlyTotal > refinanceCalc.newMonthlyTotal ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                    {refinanceCalc.currentMonthlyTotal > refinanceCalc.newMonthlyTotal
                      ? `💚 Save ${formatCurrency(refinanceCalc.currentMonthlyTotal - refinanceCalc.newMonthlyTotal)}`
                      : `❌ Pay ${formatCurrency(refinanceCalc.newMonthlyTotal - refinanceCalc.currentMonthlyTotal)} more`
                    }
                  </td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-3 text-slate-600 font-medium">Total Interest Paid</td>
                  <td className="p-3 text-center font-bold text-slate-800 bg-slate-50">{formatCurrency(refinanceCalc.currentTotalInterest)}</td>
                  <td className="p-3 text-center font-bold text-orange-700 bg-orange-50/30">{formatCurrency(refinanceCalc.newTotalInterest)}</td>
                  <td className={`p-3 text-center font-bold ${refinanceCalc.interestSavings > 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                    {refinanceCalc.interestSavings > 0
                      ? `💚 Save ${formatCurrency(refinanceCalc.interestSavings)}`
                      : `❌ Pay ${formatCurrency(Math.abs(refinanceCalc.interestSavings))} more`
                    }
                  </td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-3 text-slate-600 font-medium">Total Amount Paid</td>
                  <td className="p-3 text-center font-bold text-slate-800 bg-slate-50">{formatCurrency(refinanceCalc.currentTotalPayments)}</td>
                  <td className="p-3 text-center font-bold text-orange-700 bg-orange-50/30">{formatCurrency(refinanceCalc.newTotalPayments)}</td>
                  <td className={`p-3 text-center font-bold ${refinanceCalc.totalSavings > 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                    {refinanceCalc.totalSavings > 0
                      ? `💚 Save ${formatCurrency(refinanceCalc.totalSavings)}`
                      : `❌ Pay ${formatCurrency(Math.abs(refinanceCalc.totalSavings))} more`
                    }
                  </td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-3 text-slate-600 font-medium">Time to Pay Off</td>
                  <td className="p-3 text-center font-bold text-slate-800 bg-slate-50">
                    {(refinanceCalc.remainingMonths / 12).toFixed(1)} years
                    {refinanceData.currentExtraPayment > 0 && (
                      <div className="text-[10px] font-normal text-green-600">with extras</div>
                    )}
                  </td>
                  <td className="p-3 text-center font-bold text-orange-700 bg-orange-50/30">
                    {(refinanceCalc.actualNewMonths / 12).toFixed(1)} years
                    {refinanceData.newExtraPayment > 0 && (
                      <div className="text-[10px] font-normal text-green-600">with extras</div>
                    )}
                  </td>
                  <td className={`p-3 text-center font-bold ${refinanceCalc.timeDifference < 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                    {refinanceCalc.timeDifference < 0
                      ? `💚 ${Math.abs(refinanceCalc.timeDifference).toFixed(1)} years faster`
                      : `❌ ${refinanceCalc.timeDifference.toFixed(1)} years longer`
                    }
                  </td>
                </tr>
                <tr className="bg-orange-100 border-t-2 border-orange-300">
                  <td className="p-3 text-orange-800 font-bold">Closing Costs</td>
                  <td className="p-3 text-center text-slate-500">—</td>
                  <td className="p-3 text-center font-bold text-orange-700">{formatCurrency(refinanceData.closingCosts)}</td>
                  <td className="p-3 text-center font-bold text-red-700">Cost</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Recommendations */}
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-bold text-blue-800 mb-2">💡 Recommendation</h4>
            <div className="text-xs text-slate-700 space-y-1">
              {refinanceCalc.worthIt ? (
                <>
                  <p>✅ <strong>Refinancing is recommended!</strong> You'll break even in {refinanceCalc.breakEvenYears.toFixed(1)} years.</p>
                  <p>• Save {formatCurrency(refinanceCalc.monthlySavings)} per month</p>
                  <p>• Total savings: {formatCurrency(refinanceCalc.totalSavings)} over the life of the loan</p>
                  {refinanceCalc.breakEvenMonths < 24 && <p>• Quick break-even point makes this a strong candidate!</p>}
                </>
              ) : (
                <>
                  <p>⚠️ <strong>Refinancing may not be worth it.</strong></p>
                  {refinanceCalc.breakEvenMonths > refinanceCalc.remainingMonths && (
                    <p>• You won't break even before the loan is paid off ({Math.ceil(refinanceCalc.breakEvenMonths)} months needed)</p>
                  )}
                  {refinanceCalc.totalSavings < 0 && (
                    <p>• You'll pay {formatCurrency(Math.abs(refinanceCalc.totalSavings))} more due to the longer term and closing costs</p>
                  )}
                  <p>• Consider staying with your current loan or negotiating lower closing costs</p>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RefinanceAnalysisModal;
