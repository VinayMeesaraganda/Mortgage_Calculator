import React from 'react';
import type { Currency } from '../../types/mortgage';
import { formatCurrencyValue } from '../../utils/currency';
import { CARD_STYLE, CARD_SHADOW } from '../../constants/styles';

interface StockPortfolioTotals {
  totalInvested: number;
  totalCurrentValue: number;
  totalUnrealizedGainLoss: number;
  totalUnrealizedGainLossPercent: number;
  totalRealizedGainLoss: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  totalDailyPL: number;
  totalDailyPLPercent: number;
}

interface StockPortfolioSummaryCardsProps {
  portfolioTotals: StockPortfolioTotals;
  selectedCurrency: Currency;
}

const StockPortfolioSummaryCards: React.FC<StockPortfolioSummaryCardsProps> = ({
  portfolioTotals,
  selectedCurrency
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <div className={CARD_STYLE} style={CARD_SHADOW}>
        <div className="pl-3 pr-2 py-3">
          <h3 className="text-xs font-semibold text-slate-600 mb-1.5">Total Invested</h3>
          <p className="text-lg font-bold text-slate-800 leading-tight">
            {formatCurrencyValue(Math.round(portfolioTotals.totalInvested), selectedCurrency, false)}
          </p>
        </div>
      </div>
      <div className={CARD_STYLE} style={CARD_SHADOW}>
        <div className="pl-3 pr-2 py-3">
          <h3 className="text-xs font-semibold text-slate-600 mb-1.5">Current Value</h3>
          <p className="text-lg font-bold text-slate-800 leading-tight">
            {formatCurrencyValue(Math.round(portfolioTotals.totalCurrentValue), selectedCurrency, false)}
          </p>
        </div>
      </div>
      <div className={CARD_STYLE} style={CARD_SHADOW}>
        <div className="pl-3 pr-2 py-3">
          <h3 className="text-xs font-semibold text-slate-600 mb-1.5">Unrealized P&L</h3>
          <p
            className={`text-lg font-bold leading-tight ${
              portfolioTotals.totalUnrealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatCurrencyValue(Math.round(portfolioTotals.totalUnrealizedGainLoss), selectedCurrency, false)}
            <span
              className={`text-xs font-medium ml-1 ${
                portfolioTotals.totalUnrealizedGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              ({portfolioTotals.totalUnrealizedGainLossPercent >= 0 ? '+' : ''}
              {portfolioTotals.totalUnrealizedGainLossPercent.toFixed(2)}%)
            </span>
          </p>
        </div>
      </div>
      <div className={CARD_STYLE} style={CARD_SHADOW}>
        <div className="pl-3 pr-2 py-3">
          <h3 className="text-xs font-semibold text-slate-600 mb-1.5">Realized P&L</h3>
          <p
            className={`text-lg font-bold leading-tight ${
              portfolioTotals.totalRealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatCurrencyValue(Math.round(portfolioTotals.totalRealizedGainLoss), selectedCurrency, false)}
            {portfolioTotals.totalInvested > 0 && (
              <span
                className={`text-xs font-medium ml-1 ${
                  portfolioTotals.totalRealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                ({((portfolioTotals.totalRealizedGainLoss / portfolioTotals.totalInvested) * 100).toFixed(2)}%)
              </span>
            )}
          </p>
        </div>
      </div>
      <div className={CARD_STYLE} style={CARD_SHADOW}>
        <div className="pl-3 pr-2 py-3">
          <h3 className="text-xs font-semibold text-slate-600 mb-1.5">Total Gain/Loss</h3>
          <p
            className={`text-lg font-bold leading-tight ${
              portfolioTotals.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatCurrencyValue(Math.round(portfolioTotals.totalGainLoss), selectedCurrency, false)}
            <span
              className={`text-xs font-medium ml-1 ${
                portfolioTotals.totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              ({portfolioTotals.totalGainLossPercent >= 0 ? '+' : ''}
              {portfolioTotals.totalGainLossPercent.toFixed(2)}%)
            </span>
          </p>
        </div>
      </div>
      <div className={CARD_STYLE} style={CARD_SHADOW}>
        <div className="pl-3 pr-2 py-3">
          <h3 className="text-xs font-semibold text-slate-600 mb-1.5">Daily P&L</h3>
          <p
            className={`text-lg font-bold leading-tight ${
              portfolioTotals.totalDailyPL >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatCurrencyValue(Math.round(portfolioTotals.totalDailyPL), selectedCurrency, false)}
            <span
              className={`text-xs font-medium ml-1 ${
                portfolioTotals.totalDailyPLPercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              ({portfolioTotals.totalDailyPLPercent >= 0 ? '+' : ''}
              {portfolioTotals.totalDailyPLPercent.toFixed(2)}%)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StockPortfolioSummaryCards;
