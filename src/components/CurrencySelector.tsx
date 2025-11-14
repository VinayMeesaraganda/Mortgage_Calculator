import React from 'react';
import { Currency } from '../types/mortgage';
import { CURRENCY_DATA } from '../utils/currency';
import { Globe } from 'lucide-react';

interface CurrencySelectorProps {
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onCurrencyChange
}) => {
  return (
    <div className="flex items-center gap-2">
      <Globe size={18} className="text-slate-600" />
      <select
        id="currency-select"
        value={selectedCurrency}
        onChange={(e) => onCurrencyChange(e.target.value as Currency)}
        className="px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-semibold bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer"
        title="Select currency"
      >
        {Object.entries(CURRENCY_DATA).map(([code, info]) => (
          <option key={code} value={code}>
            {info.symbol} {info.code} - {info.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default React.memo(CurrencySelector);

