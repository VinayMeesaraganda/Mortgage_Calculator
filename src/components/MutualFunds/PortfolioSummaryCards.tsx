import React from 'react';
import { formatCurrency } from '../../utils/formatting';

interface PortfolioTotals {
  totalInvested: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  cagr: number;
  xirr: number;
}

interface PortfolioSummaryCardsProps {
  portfolioTotals: PortfolioTotals;
}

const PortfolioSummaryCards: React.FC<PortfolioSummaryCardsProps> = ({ portfolioTotals }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 mt-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200 shadow-lg">
        <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
          <span className="text-blue-600">💰</span>
          Total Invested
        </h3>
        <p className="text-3xl font-bold text-slate-800">{formatCurrency(portfolioTotals.totalInvested)}</p>
      </div>
      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-5 border-2 border-purple-200 shadow-lg">
        <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
          <span className="text-purple-600">📈</span>
          Current Value
        </h3>
        <p className="text-3xl font-bold text-slate-800">{formatCurrency(portfolioTotals.totalCurrentValue)}</p>
      </div>
      <div
        className={`bg-gradient-to-br rounded-xl p-5 border-2 shadow-lg ${
          portfolioTotals.totalGainLoss >= 0
            ? 'from-green-50 to-emerald-50 border-green-200'
            : 'from-red-50 to-rose-50 border-red-200'
        }`}
      >
        <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
          <span className={portfolioTotals.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
            {portfolioTotals.totalGainLoss >= 0 ? '📊' : '📉'}
          </span>
          Total Gain/Loss
        </h3>
        <p
          className={`text-3xl font-bold ${portfolioTotals.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}
        >
          {formatCurrency(portfolioTotals.totalGainLoss)}
        </p>
        <p
          className={`text-sm font-semibold mt-1 ${
            portfolioTotals.totalGainLoss >= 0 ? 'text-green-700' : 'text-red-700'
          }`}
        >
          ({portfolioTotals.totalGainLoss >= 0 ? '+' : ''}
          {portfolioTotals.totalGainLossPercent.toFixed(2)}%)
        </p>
      </div>
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border-2 border-orange-200 shadow-lg">
        <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
          <span className="text-orange-600">📊</span>
          CAGR
        </h3>
        <p
          className={`text-3xl font-bold ${portfolioTotals.cagr >= 0 ? 'text-green-600' : 'text-red-600'}`}
        >
          {portfolioTotals.cagr >= 0 ? '+' : ''}{portfolioTotals.cagr.toFixed(2)}%
        </p>
        <p className="text-xs text-slate-500 mt-1">Compound Annual Growth Rate</p>
      </div>
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 border-2 border-indigo-200 shadow-lg">
        <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
          <span className="text-indigo-600">📈</span>
          XIRR
        </h3>
        <p
          className={`text-3xl font-bold ${portfolioTotals.xirr >= 0 ? 'text-green-600' : 'text-red-600'}`}
        >
          {portfolioTotals.xirr >= 0 ? '+' : ''}{portfolioTotals.xirr.toFixed(2)}%
        </p>
        <p className="text-xs text-slate-500 mt-1">Extended Internal Rate of Return</p>
      </div>
    </div>
  );
};

export default PortfolioSummaryCards;
