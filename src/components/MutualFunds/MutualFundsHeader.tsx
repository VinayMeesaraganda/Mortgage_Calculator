import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, PieChart } from 'lucide-react';
import type { Currency } from '../../types/mortgage';
import CurrencySelector from '../CurrencySelector';

interface MutualFundsHeaderProps {
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

const MutualFundsHeader: React.FC<MutualFundsHeaderProps> = ({
  selectedCurrency,
  onCurrencyChange
}) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
              <PieChart className="w-6 h-6 text-white" />
            </div>
            Mutual Funds
          </h1>
          <CurrencySelector
            selectedCurrency={selectedCurrency}
            onCurrencyChange={onCurrencyChange}
          />
        </div>
      </div>
    </header>
  );
};

export default MutualFundsHeader;
