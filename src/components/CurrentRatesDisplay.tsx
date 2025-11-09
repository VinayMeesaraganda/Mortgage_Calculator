import React from 'react';
import { Currency } from '../types/mortgage';
import { CURRENT_MORTGAGE_RATES } from '../utils/mortgageRates';
import { TrendingDown, Info } from 'lucide-react';

interface CurrentRatesDisplayProps {
  currency: Currency;
  onApplyRate: (rate: number) => void;
}

export const CurrentRatesDisplay: React.FC<CurrentRatesDisplayProps> = ({
  currency,
  onApplyRate
}) => {
  const rateData = CURRENT_MORTGAGE_RATES[currency];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <TrendingDown size={16} className="text-blue-600" />
            Current Mortgage Rates - {rateData.country}
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Updated: {new Date(rateData.lastUpdated).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <Info size={14} />
          <span>Click to apply</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onApplyRate(rateData.rates.year15)}
          className="bg-white hover:bg-blue-50 border-2 border-blue-300 hover:border-blue-500 rounded-lg p-3 transition-all group"
        >
          <div className="text-xs font-semibold text-slate-600 mb-1">15-Year Fixed</div>
          <div className="text-lg font-bold text-blue-600">{rateData.rates.year15.toFixed(2)}%</div>
        </button>

        <button
          onClick={() => onApplyRate(rateData.rates.year30)}
          className="bg-white hover:bg-blue-50 border-2 border-blue-300 hover:border-blue-500 rounded-lg p-3 transition-all group"
        >
          <div className="text-xs font-semibold text-slate-600 mb-1">30-Year Fixed</div>
          <div className="text-lg font-bold text-blue-600">{rateData.rates.year30.toFixed(2)}%</div>
        </button>

        <button
          onClick={() => onApplyRate(rateData.rates.arm5)}
          className="bg-white hover:bg-green-50 border-2 border-green-300 hover:border-green-500 rounded-lg p-3 transition-all group"
        >
          <div className="text-xs font-semibold text-slate-600 mb-1">5/1 ARM</div>
          <div className="text-lg font-bold text-green-600">{rateData.rates.arm5.toFixed(2)}%</div>
        </button>

        <button
          onClick={() => onApplyRate(rateData.rates.arm7)}
          className="bg-white hover:bg-green-50 border-2 border-green-300 hover:border-green-500 rounded-lg p-3 transition-all group"
        >
          <div className="text-xs font-semibold text-slate-600 mb-1">7/1 ARM</div>
          <div className="text-lg font-bold text-green-600">{rateData.rates.arm7.toFixed(2)}%</div>
        </button>
      </div>

      <div className="mt-3 text-xs text-slate-600 bg-white/50 rounded p-2">
        <strong>Note:</strong> Rates are indicative and may vary by lender, credit score, and down payment. 
        Always check with your lender for current rates.
      </div>
    </div>
  );
};

export default React.memo(CurrentRatesDisplay);

