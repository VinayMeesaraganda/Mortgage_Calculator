import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, TrendingUp } from 'lucide-react';
import type { Currency } from '../../types/mortgage';
import CurrencySelector from '../CurrencySelector';

interface StockInvestmentsHeaderProps {
  isLoadingHoldings: boolean;
  isSavingHoldings: boolean;
  isRefreshingAllPrices: boolean;
  onRefreshAllPrices: () => void;
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

const StockInvestmentsHeader: React.FC<StockInvestmentsHeaderProps> = ({
  isLoadingHoldings,
  isSavingHoldings,
  isRefreshingAllPrices,
  onRefreshAllPrices,
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
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            Stock Investments
          </h1>
          <div className="flex items-center gap-3">
            {(isLoadingHoldings || isSavingHoldings) && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                {isLoadingHoldings && (
                  <span className="flex items-center gap-1">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading...
                  </span>
                )}
                {isSavingHoldings && (
                  <span className="flex items-center gap-1">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                )}
              </div>
            )}
            <button
              onClick={onRefreshAllPrices}
              disabled={isRefreshingAllPrices}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
              title="Refresh all stock prices"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingAllPrices ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <CurrencySelector
              selectedCurrency={selectedCurrency}
              onCurrencyChange={onCurrencyChange}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default StockInvestmentsHeader;
