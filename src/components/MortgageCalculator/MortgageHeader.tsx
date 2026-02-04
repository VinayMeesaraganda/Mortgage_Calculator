import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CurrencySelector from '../CurrencySelector';
import type { Currency } from '../../types/mortgage';

interface MortgageHeaderProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
  propertyType: 'primary' | 'investment';
  onPropertyTypeChange: (value: 'primary' | 'investment') => void;
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

const MortgageHeader: React.FC<MortgageHeaderProps> = ({
  isAuthenticated,
  onLoginClick,
  propertyType,
  onPropertyTypeChange,
  selectedCurrency,
  onCurrencyChange
}) => {
  return (
    <div className="mb-3 sm:mb-4 animate-slideDown">
      {/* Back to Home Link and Auth Buttons */}
      <div className="flex justify-between items-center mb-3 px-2">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Back to Home</span>
          <span className="sm:hidden">Home</span>
        </Link>

        {!isAuthenticated && (
          <div className="flex gap-2">
            <button
              onClick={onLoginClick}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all flex items-center gap-1 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg"
            >
              <span className="hidden sm:inline">Login</span>
              <span className="sm:hidden">Login</span>
            </button>
            <button
              onClick={onLoginClick}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1 text-xs sm:text-sm font-semibold"
            >
              <span className="hidden sm:inline">Sign Up</span>
              <span className="sm:hidden">Sign Up</span>
            </button>
          </div>
        )}
      </div>

      {/* Centered Heading */}
      <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif font-bold text-slate-800 tracking-tight animate-fadeIn text-center px-2 mb-3 leading-tight">
        Free Mortgage Calculator: Investment Property, Bi-Weekly & Loan Comparison
      </h1>

      {/* Toggle and Currency Selector */}
      <div className="mb-3">
        {/* Toggle and Currency - Responsive Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
          {/* Toggle - Centered on mobile, left on desktop */}
          <div className="flex justify-center sm:justify-start flex-1 w-full sm:w-auto">
            <div className="bg-white rounded-lg shadow-md p-0.5 flex gap-0.5 border border-slate-200 w-full sm:w-auto">
              <button
                onClick={() => onPropertyTypeChange('primary')}
                className={`
                  flex items-center justify-center gap-1 px-2 sm:px-3 py-2 sm:py-1.5 rounded-md font-semibold text-xs sm:text-sm transition-all duration-300 flex-1 sm:flex-none
                  ${propertyType === 'primary'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }
                `}
              >
                <span className="text-sm sm:text-base" aria-label="Home icon">🏠</span>
                <span>Primary</span>
              </button>
              <button
                onClick={() => onPropertyTypeChange('investment')}
                className={`
                  flex items-center justify-center gap-1 px-2 sm:px-3 py-2 sm:py-1.5 rounded-md font-semibold text-xs sm:text-sm transition-all duration-300 flex-1 sm:flex-none
                  ${propertyType === 'investment'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }
                `}
              >
                <span className="text-sm sm:text-base" aria-label="Building icon">🏢</span>
                <span>Investment</span>
              </button>
            </div>
          </div>

          {/* Currency Selector - Below toggle on mobile, right side on desktop */}
          <div className="flex justify-center sm:justify-end w-full sm:w-auto">
            <CurrencySelector
              selectedCurrency={selectedCurrency}
              onCurrencyChange={onCurrencyChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MortgageHeader;
