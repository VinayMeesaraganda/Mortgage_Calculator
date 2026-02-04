import React from 'react';
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

const ScenarioComparisonModal: React.FC<ScenarioComparisonModalProps> = ({
  isOpen,
  onClose,
  onApplyScenario,
  homeValue,
  downPayment,
  interestRate,
  tenure,
  paymentType,
  loanAmount,
  scenarioB,
  scenarioC,
  setScenarioB,
  setScenarioC,
  editingScenarioBPercent,
  setEditingScenarioBPercent,
  rawScenarioBPercent,
  setRawScenarioBPercent,
  editingScenarioCPercent,
  setEditingScenarioCPercent,
  rawScenarioCPercent,
  setRawScenarioCPercent,
  currentScenarioBase,
  scenarioBCalc,
  scenarioCCalc
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between shadow-lg z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <h2 className="text-xl font-bold">Compare Loan Options Side-by-Side</h2>
              <p className="text-xs text-purple-100 mt-0.5">Find the best deal — Compare up to 3 different loan scenarios</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-purple-200 transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4 italic bg-purple-50 p-3 rounded-lg border border-purple-200">
            🛍️ <strong>Shopping for the best mortgage?</strong> Fill in up to 3 different loan scenarios and see which one saves you the most money. Your current loan is shown in the first column.
          </p>

          {/* Comparison Table */}
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <table className="w-full text-[10px] sm:text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b-2 border-purple-200">
                  <th className="text-left p-2 font-semibold text-slate-700 bg-slate-50 sticky left-0 z-20 min-w-[120px]">Metric</th>
                  <th className="p-2 font-semibold text-purple-700 bg-amber-50 border-l-2 border-amber-300 min-w-[150px]">
                    <div className="flex flex-col items-center">
                      <span>Current Loan</span>
                      <span className="text-[10px] text-amber-600 font-normal">⭐ Your Choice</span>
                    </div>
                  </th>
                  <th className="p-2 font-semibold text-purple-700 bg-purple-50 border-l-2 border-purple-200 min-w-[150px]">
                    <div className="flex flex-col items-center gap-2">
                      <span>Scenario 2</span>
                      <button
                        onClick={() => onApplyScenario(scenarioB)}
                        className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-colors shadow-sm text-xs cursor-pointer"
                      >
                        <span className="font-bold whitespace-nowrap">🚀 Apply</span>
                      </button>
                    </div>
                  </th>
                  <th className="p-2 font-semibold text-purple-700 bg-purple-50 border-l-2 border-purple-200 min-w-[150px]">
                    <div className="flex flex-col items-center gap-2">
                      <span>Scenario 3</span>
                      <button
                        onClick={() => onApplyScenario(scenarioC)}
                        className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-colors shadow-sm text-xs cursor-pointer"
                      >
                        <span className="font-bold whitespace-nowrap">🚀 Apply</span>
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Home Value */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-2 text-slate-600 bg-slate-50 sticky left-0 z-10 min-w-[120px]">Home Value</td>
                  <td className="p-2 text-center font-semibold text-slate-800 bg-amber-50/30 border-l-2 border-amber-200 min-w-[150px]">
                    {formatCurrency(homeValue)}
                  </td>
                  <td className="p-2 border-l-2 border-purple-100 min-w-[150px]">
                    <input
                      type="text"
                      value={scenarioB.homeValue.toLocaleString()}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setScenarioB({ ...scenarioB, homeValue: val === '' ? 0 : Number(val) });
                      }}
                      className="w-full px-2 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center"
                      placeholder="$"
                    />
                  </td>
                  <td className="p-2 border-l-2 border-purple-100 min-w-[150px]">
                    <input
                      type="text"
                      value={scenarioC.homeValue.toLocaleString()}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setScenarioC({ ...scenarioC, homeValue: val === '' ? 0 : Number(val) });
                      }}
                      className="w-full px-2 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center"
                      placeholder="$"
                    />
                  </td>
                </tr>

                {/* Down Payment */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-2 text-slate-600 bg-slate-50 sticky left-0 z-10 min-w-[120px]">Down Payment</td>
                  <td className="p-2 text-center font-semibold text-slate-800 bg-amber-50/30 border-l-2 border-amber-200 min-w-[150px]">
                    {formatCurrency(downPayment)}
                    <div className="text-[10px] text-slate-500">
                      {homeValue > 0 ? ((downPayment / homeValue) * 100).toFixed(1) : '0.0'}%
                    </div>
                  </td>
                  <td className="p-2 border-l-2 border-purple-100 min-w-[150px]">
                    <div className="flex items-center gap-1 justify-center">
                      <input
                        type="text"
                        value={scenarioB.downPayment.toLocaleString()}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setScenarioB({ ...scenarioB, downPayment: val === '' ? 0 : Number(val) });
                        }}
                        className="flex-1 px-2 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center text-xs"
                        placeholder="$"
                      />
                      <span className="text-purple-400 text-sm">|</span>
                      <input
                        type="text"
                        value={editingScenarioBPercent
                          ? rawScenarioBPercent
                          : (scenarioB.homeValue > 0 ? ((scenarioB.downPayment / scenarioB.homeValue) * 100).toFixed(1) : '0.0')}
                        onChange={(e) => {
                          setEditingScenarioBPercent(true);
                          const cleaned = e.target.value.replace(/,/g, '');
                          setRawScenarioBPercent(cleaned);
                          if (cleaned && /^\d*\.?\d*$/.test(cleaned)) {
                            const percent = Number(cleaned);
                            if (!isNaN(percent) && percent >= 0 && percent <= 100) {
                              setScenarioB({ ...scenarioB, downPayment: (scenarioB.homeValue * percent) / 100 });
                            }
                          }
                        }}
                        onFocus={() => {
                          setEditingScenarioBPercent(true);
                          setRawScenarioBPercent(scenarioB.homeValue > 0 ? ((scenarioB.downPayment / scenarioB.homeValue) * 100).toFixed(1) : '0.0');
                        }}
                        onBlur={() => {
                          setEditingScenarioBPercent(false);
                          setRawScenarioBPercent('');
                        }}
                        className="w-16 px-1 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center text-xs"
                        placeholder="%"
                      />
                    </div>
                  </td>
                  <td className="p-2 border-l-2 border-purple-100 min-w-[150px]">
                    <div className="flex items-center gap-1 justify-center">
                      <input
                        type="text"
                        value={scenarioC.downPayment.toLocaleString()}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setScenarioC({ ...scenarioC, downPayment: val === '' ? 0 : Number(val) });
                        }}
                        className="flex-1 px-2 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center text-xs"
                        placeholder="$"
                      />
                      <span className="text-purple-400 text-sm">|</span>
                      <input
                        type="text"
                        value={editingScenarioCPercent
                          ? rawScenarioCPercent
                          : (scenarioC.homeValue > 0 ? ((scenarioC.downPayment / scenarioC.homeValue) * 100).toFixed(1) : '0.0')}
                        onChange={(e) => {
                          setEditingScenarioCPercent(true);
                          const cleaned = e.target.value.replace(/,/g, '');
                          setRawScenarioCPercent(cleaned);
                          if (cleaned && /^\d*\.?\d*$/.test(cleaned)) {
                            const percent = Number(cleaned);
                            if (!isNaN(percent) && percent >= 0 && percent <= 100) {
                              setScenarioC({ ...scenarioC, downPayment: (scenarioC.homeValue * percent) / 100 });
                            }
                          }
                        }}
                        onFocus={() => {
                          setEditingScenarioCPercent(true);
                          setRawScenarioCPercent(scenarioC.homeValue > 0 ? ((scenarioC.downPayment / scenarioC.homeValue) * 100).toFixed(1) : '0.0');
                        }}
                        onBlur={() => {
                          setEditingScenarioCPercent(false);
                          setRawScenarioCPercent('');
                        }}
                        className="w-16 px-1 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center text-xs"
                        placeholder="%"
                      />
                    </div>
                  </td>
                </tr>

                {/* Loan Amount (Calculated) */}
                <tr className="border-b-2 border-purple-200 bg-purple-50/30">
                  <td className="p-2 text-slate-700 font-semibold bg-slate-50 sticky left-0 z-10 min-w-[120px]">💰 Loan Amount</td>
                  <td className="p-2 text-center font-bold text-amber-700 bg-amber-50/50 border-l-2 border-amber-200 min-w-[150px]">
                    {formatCurrency(loanAmount)}
                  </td>
                  <td className="p-2 text-center font-bold text-purple-700 border-l-2 border-purple-100 min-w-[150px]">
                    {formatCurrency(scenarioBCalc.loanAmount)}
                  </td>
                  <td className="p-2 text-center font-bold text-purple-700 border-l-2 border-purple-100 min-w-[150px]">
                    {formatCurrency(scenarioCCalc.loanAmount)}
                  </td>
                </tr>

                {/* Interest Rate */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-2 text-slate-600 bg-slate-50 sticky left-0 z-10 min-w-[120px]">Interest Rate</td>
                  <td className="p-2 text-center font-semibold text-slate-800 bg-amber-50/30 border-l-2 border-amber-200 min-w-[150px]">
                    {interestRate}%
                  </td>
                  <td className="p-2 border-l-2 border-purple-100 min-w-[150px]">
                    <input
                      type="text"
                      value={scenarioB.interestRate}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        setScenarioB({ ...scenarioB, interestRate: val === '' ? 0 : Number(val) });
                      }}
                      className="w-full px-2 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center"
                      placeholder="%"
                    />
                  </td>
                  <td className="p-2 border-l-2 border-purple-100 min-w-[150px]">
                    <input
                      type="text"
                      value={scenarioC.interestRate}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        setScenarioC({ ...scenarioC, interestRate: val === '' ? 0 : Number(val) });
                      }}
                      className="w-full px-2 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center"
                      placeholder="%"
                    />
                  </td>
                </tr>

                {/* Loan Term */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-2 text-slate-600 bg-slate-50 sticky left-0 z-10 min-w-[120px]">Loan Term</td>
                  <td className="p-2 text-center font-semibold text-slate-800 bg-amber-50/30 border-l-2 border-amber-200 min-w-[150px]">
                    {tenure} years
                  </td>
                  <td className="p-2 border-l-2 border-purple-100 min-w-[150px]">
                    <input
                      type="text"
                      value={scenarioB.tenure}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setScenarioB({ ...scenarioB, tenure: val === '' ? 0 : Number(val) });
                      }}
                      className="w-full px-2 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center"
                      placeholder="years"
                    />
                  </td>
                  <td className="p-2 border-l-2 border-purple-100 min-w-[150px]">
                    <input
                      type="text"
                      value={scenarioC.tenure}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setScenarioC({ ...scenarioC, tenure: val === '' ? 0 : Number(val) });
                      }}
                      className="w-full px-2 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center"
                      placeholder="years"
                    />
                  </td>
                </tr>

                {/* Payment Type */}
                <tr className="border-b-2 border-purple-200 hover:bg-slate-50/50 transition-colors">
                  <td className="p-2 text-slate-600 bg-slate-50 sticky left-0 z-10 min-w-[120px]">Payment Type</td>
                  <td className="p-2 text-center font-semibold text-slate-800 bg-amber-50/30 border-l-2 border-amber-200 min-w-[150px]">
                    {paymentType === 'monthly' ? 'Monthly' : 'Bi-weekly'}
                  </td>
                  <td className="p-2 border-l-2 border-purple-100 min-w-[150px]">
                    <select
                      value={scenarioB.paymentType}
                      onChange={(e) => setScenarioB({ ...scenarioB, paymentType: e.target.value as PaymentType })}
                      className="w-full px-2 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center text-xs"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="biweekly">Bi-weekly</option>
                    </select>
                  </td>
                  <td className="p-2 border-l-2 border-purple-100 min-w-[150px]">
                    <select
                      value={scenarioC.paymentType}
                      onChange={(e) => setScenarioC({ ...scenarioC, paymentType: e.target.value as PaymentType })}
                      className="w-full px-2 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center text-xs"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="biweekly">Bi-weekly</option>
                    </select>
                  </td>
                </tr>

                {/* Results Header */}
                <tr className="bg-purple-100">
                  <td colSpan={4} className="p-2 text-center font-bold text-purple-800 uppercase tracking-wider">
                    💰 Comparison Results
                  </td>
                </tr>

                {/* Monthly Payment */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-2 text-slate-600 bg-slate-50 sticky left-0 z-10 min-w-[120px]">Monthly Payment</td>
                  <td className="p-2 text-center font-bold text-slate-800 bg-amber-50/30 border-l-2 border-amber-200 min-w-[150px]">
                    {formatCurrency(currentScenarioBase.payment)}
                  </td>
                  <td className={`p-2 text-center font-bold border-l-2 border-purple-100 min-w-[150px] ${scenarioBCalc.payment < currentScenarioBase.payment ? 'text-green-700 bg-green-50' :
                    scenarioBCalc.payment > currentScenarioBase.payment ? 'text-red-700 bg-red-50' : 'text-slate-800'
                    }`}>
                    {formatCurrency(scenarioBCalc.payment)}
                    {scenarioBCalc.payment < currentScenarioBase.payment && <span className="ml-1">✓</span>}
                  </td>
                  <td className={`p-2 text-center font-bold border-l-2 border-purple-100 min-w-[150px] ${scenarioCCalc.payment < currentScenarioBase.payment ? 'text-green-700 bg-green-50' :
                    scenarioCCalc.payment > currentScenarioBase.payment ? 'text-red-700 bg-red-50' : 'text-slate-800'
                    }`}>
                    {formatCurrency(scenarioCCalc.payment)}
                    {scenarioCCalc.payment < currentScenarioBase.payment && <span className="ml-1">✓</span>}
                  </td>
                </tr>

                {/* Total Interest */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-2 text-slate-600 bg-slate-50 sticky left-0 z-10 min-w-[120px]">Total Interest Paid</td>
                  <td className="p-2 text-center font-bold text-slate-800 bg-amber-50/30 border-l-2 border-amber-200 min-w-[150px]">
                    {formatCurrency(currentScenarioBase.totalInterest)}
                  </td>
                  <td className={`p-2 text-center font-bold border-l-2 border-purple-100 min-w-[150px] ${scenarioBCalc.totalInterest < currentScenarioBase.totalInterest ? 'text-green-700 bg-green-50' :
                    scenarioBCalc.totalInterest > currentScenarioBase.totalInterest ? 'text-red-700 bg-red-50' : 'text-slate-800'
                    }`}>
                    {formatCurrency(scenarioBCalc.totalInterest)}
                    {scenarioBCalc.totalInterest < currentScenarioBase.totalInterest && <span className="ml-1">💚</span>}
                  </td>
                  <td className={`p-2 text-center font-bold border-l-2 border-purple-100 min-w-[150px] ${scenarioCCalc.totalInterest < currentScenarioBase.totalInterest ? 'text-green-700 bg-green-50' :
                    scenarioCCalc.totalInterest > currentScenarioBase.totalInterest ? 'text-red-700 bg-red-50' : 'text-slate-800'
                    }`}>
                    {formatCurrency(scenarioCCalc.totalInterest)}
                    {scenarioCCalc.totalInterest < currentScenarioBase.totalInterest && <span className="ml-1">💚</span>}
                  </td>
                </tr>

                {/* Total Amount Paid */}
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-2 text-slate-600 bg-slate-50 sticky left-0 z-10 min-w-[120px]">Total Amount Paid</td>
                  <td className="p-2 text-center font-bold text-slate-800 bg-amber-50/30 border-l-2 border-amber-200 min-w-[150px]">
                    {formatCurrency(currentScenarioBase.totalPaid)}
                  </td>
                  <td className={`p-2 text-center font-bold border-l-2 border-purple-100 min-w-[150px] ${scenarioBCalc.totalPaid < currentScenarioBase.totalPaid ? 'text-green-700 bg-green-50' :
                    scenarioBCalc.totalPaid > currentScenarioBase.totalPaid ? 'text-red-700 bg-red-50' : 'text-slate-800'
                    }`}>
                    {formatCurrency(scenarioBCalc.totalPaid)}
                  </td>
                  <td className={`p-2 text-center font-bold border-l-2 border-purple-100 min-w-[150px] ${scenarioCCalc.totalPaid < currentScenarioBase.totalPaid ? 'text-green-700 bg-green-50' :
                    scenarioCCalc.totalPaid > currentScenarioBase.totalPaid ? 'text-red-700 bg-red-50' : 'text-slate-800'
                    }`}>
                    {formatCurrency(scenarioCCalc.totalPaid)}
                  </td>
                </tr>

                {/* Payoff Time */}
                <tr className="border-b-2 border-purple-200 hover:bg-slate-50/50 transition-colors">
                  <td className="p-2 text-slate-600 bg-slate-50 sticky left-0 z-10 min-w-[120px]">Time to Pay Off</td>
                  <td className="p-2 text-center font-bold text-slate-800 bg-amber-50/30 border-l-2 border-amber-200 min-w-[150px]">
                    {currentScenarioBase.tenure} years
                  </td>
                  <td className={`p-2 text-center font-bold border-l-2 border-purple-100 min-w-[150px] ${scenarioBCalc.tenure < currentScenarioBase.tenure ? 'text-green-700 bg-green-50' :
                    scenarioBCalc.tenure > currentScenarioBase.tenure ? 'text-red-700 bg-red-50' : 'text-slate-800'
                    }`}>
                    {scenarioBCalc.tenure} years
                    {scenarioBCalc.tenure < currentScenarioBase.tenure && <span className="ml-1">⚡</span>}
                  </td>
                  <td className={`p-2 text-center font-bold border-l-2 border-purple-100 min-w-[150px] ${scenarioCCalc.tenure < currentScenarioBase.tenure ? 'text-green-700 bg-green-50' :
                    scenarioCCalc.tenure > currentScenarioBase.tenure ? 'text-red-700 bg-red-50' : 'text-slate-800'
                    }`}>
                    {scenarioCCalc.tenure} years
                    {scenarioCCalc.tenure < currentScenarioBase.tenure && <span className="ml-1">⚡</span>}
                  </td>
                </tr>

                {/* Savings vs Current */}
                <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 font-bold">
                  <td className="p-3 text-purple-800 bg-slate-50 sticky left-0 z-10 min-w-[120px]">💰 Savings vs Current</td>
                  <td className="p-3 text-center text-amber-700 bg-amber-100 border-l-2 border-amber-300 min-w-[150px]">
                    Current Choice
                  </td>
                  <td className={`p-3 text-center border-l-2 border-purple-200 min-w-[150px] ${scenarioBCalc.totalInterest < currentScenarioBase.totalInterest
                    ? 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-800'
                    : 'bg-gradient-to-br from-red-100 to-rose-100 text-red-800'
                    }`}>
                    {scenarioBCalc.totalInterest < currentScenarioBase.totalInterest
                      ? `💚 Save ${formatCurrency(currentScenarioBase.totalInterest - scenarioBCalc.totalInterest)}`
                      : `❌ Pay ${formatCurrency(scenarioBCalc.totalInterest - currentScenarioBase.totalInterest)} more`
                    }
                  </td>
                  <td className={`p-3 text-center border-l-2 border-purple-200 min-w-[150px] ${scenarioCCalc.totalInterest < currentScenarioBase.totalInterest
                    ? 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-800'
                    : 'bg-gradient-to-br from-red-100 to-rose-100 text-red-800'
                    }`}>
                    {scenarioCCalc.totalInterest < currentScenarioBase.totalInterest
                      ? `💚 Save ${formatCurrency(currentScenarioBase.totalInterest - scenarioCCalc.totalInterest)}`
                      : `❌ Pay ${formatCurrency(scenarioCCalc.totalInterest - currentScenarioBase.totalInterest)} more`
                    }
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
            <p className="text-xs text-slate-600 text-center">
              💡 <strong>Tip:</strong> Green = Better than current | Red = Worse than current |
              Lower interest rates and shorter terms typically save money but increase monthly payments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioComparisonModal;
