import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { Currency } from '../../types/mortgage';
import { formatCurrency } from '../../utils/formatting';
import { CURRENCY_DATA } from '../../utils/currency';
import { CARD_STYLE, CARD_SHADOW, INPUT_STYLE } from '../../constants/styles';

interface SipCalculationResult {
  totalInvested: number;
  estimatedReturns: number;
  futureValue: number;
}

interface SipCalculatorCardProps {
  sipCalculatorExpanded: boolean;
  onToggleExpand: () => void;
  sipType: 'sip' | 'lumpsum';
  onSipTypeChange: (value: 'sip' | 'lumpsum') => void;
  sipAmount: string;
  onSipAmountChange: (value: string) => void;
  sipReturns: string;
  onSipReturnsChange: (value: string) => void;
  sipYears: string;
  onSipYearsChange: (value: string) => void;
  sipCalculation: SipCalculationResult;
  selectedCurrency: Currency;
}

const SipCalculatorCard: React.FC<SipCalculatorCardProps> = ({
  sipCalculatorExpanded,
  onToggleExpand,
  sipType,
  onSipTypeChange,
  sipAmount,
  onSipAmountChange,
  sipReturns,
  onSipReturnsChange,
  sipYears,
  onSipYearsChange,
  sipCalculation,
  selectedCurrency
}) => {
  return (
    <div className={CARD_STYLE} style={CARD_SHADOW}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Mutual Fund Calculator
          </h2>
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
          >
            {sipCalculatorExpanded ? 'Hide' : 'Show'}
            <ChevronDown className={`w-4 h-4 transition-transform ${sipCalculatorExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {sipCalculatorExpanded && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => onSipTypeChange('sip')}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    sipType === 'sip'
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  SIP (Monthly)
                </button>
                <button
                  onClick={() => onSipTypeChange('lumpsum')}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    sipType === 'lumpsum'
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  One-Time (Lumpsum)
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {sipType === 'sip' ? 'Monthly Investment Amount' : 'Investment Amount'}
                </label>
                <input
                  type="text"
                  value={sipAmount}
                  onChange={(e) => onSipAmountChange(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder={CURRENCY_DATA[selectedCurrency].symbol + '10,000'}
                  className={INPUT_STYLE}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Expected Annual Returns (%)
                </label>
                <input
                  type="text"
                  value={sipReturns}
                  onChange={(e) => onSipReturnsChange(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="12%"
                  className={INPUT_STYLE}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Time Period (Years)
                </label>
                <input
                  type="text"
                  value={sipYears}
                  onChange={(e) => onSipYearsChange(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="10"
                  className={INPUT_STYLE}
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border-2 border-purple-200">
              <h3 className="text-md font-bold text-slate-800 mb-4">Investment Summary</h3>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <div className="text-sm text-slate-600 mb-1">
                    {sipType === 'sip' ? 'Total Investment' : 'Investment Amount'}
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(sipCalculation.totalInvested)}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <div className="text-sm text-slate-600 mb-1">Estimated Returns</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(sipCalculation.estimatedReturns)}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-lg p-4 text-white shadow-lg">
                  <div className="text-sm opacity-90 mb-1">Future Value</div>
                  <div className="text-3xl font-bold">
                    {formatCurrency(sipCalculation.futureValue)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SipCalculatorCard;
