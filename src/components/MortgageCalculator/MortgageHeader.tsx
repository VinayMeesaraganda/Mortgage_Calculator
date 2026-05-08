import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CurrencySelector from '../CurrencySelector';
import type { Currency } from '../../types/mortgage';

interface MortgageHeaderProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

const MortgageHeader: React.FC<MortgageHeaderProps> = ({
  isAuthenticated,
  onLoginClick,
  selectedCurrency,
  onCurrencyChange,
}) => {
  return (
    <div className="flex items-center justify-between mb-4 px-1">
      <Link
        to="/"
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        <span className="hidden sm:inline">Home</span>
      </Link>

      <div className="flex items-center gap-3">
        <CurrencySelector
          selectedCurrency={selectedCurrency}
          onCurrencyChange={onCurrencyChange}
        />
        {!isAuthenticated && (
          <button
            onClick={onLoginClick}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Sign in
          </button>
        )}
      </div>
    </div>
  );
};

export default MortgageHeader;
