import React from 'react';
import { ArrowDown, ArrowUp, TrendingUp } from 'lucide-react';
import type { StockHoldingSummary } from '../../types/stock';
import { formatCurrency } from '../../utils/formatting';
import { CARD_STYLE, CARD_SHADOW } from '../../constants/styles';

interface StockHoldingsTableProps {
  sortedHoldings: StockHoldingSummary[];
  stocksSortColumn: 'symbol' | 'shares' | 'avgPrice' | 'currentPrice' | 'gainLoss' | 'dailyPL';
  stocksSortDirection: 'asc' | 'desc';
  onSort: (column: 'symbol' | 'shares' | 'avgPrice' | 'currentPrice' | 'gainLoss' | 'dailyPL') => void;
}

const StockHoldingsTable: React.FC<StockHoldingsTableProps> = ({
  sortedHoldings,
  stocksSortColumn,
  stocksSortDirection,
  onSort
}) => {
  return (
    <div className={CARD_STYLE} style={{ ...CARD_SHADOW, marginBottom: '2rem' }}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Current Stocks</h2>
        {sortedHoldings.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No stocks in portfolio</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-300">
                  <th
                    className="text-left p-3 text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                    onClick={() => onSort('symbol')}
                  >
                    <div className="flex items-center gap-2">
                      <span>Stock Name</span>
                      {stocksSortColumn === 'symbol' &&
                        (stocksSortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        ))}
                    </div>
                  </th>
                  <th
                    className="text-right p-3 text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                    onClick={() => onSort('shares')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span>Shares</span>
                      {stocksSortColumn === 'shares' &&
                        (stocksSortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        ))}
                    </div>
                  </th>
                  <th
                    className="text-right p-3 text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                    onClick={() => onSort('avgPrice')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span>Avg Price</span>
                      {stocksSortColumn === 'avgPrice' &&
                        (stocksSortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        ))}
                    </div>
                  </th>
                  <th
                    className="text-right p-3 text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                    onClick={() => onSort('currentPrice')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span>Current Price</span>
                      {stocksSortColumn === 'currentPrice' &&
                        (stocksSortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        ))}
                    </div>
                  </th>
                  <th
                    className="text-right p-3 text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                    onClick={() => onSort('gainLoss')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span>Gain/Loss</span>
                      {stocksSortColumn === 'gainLoss' &&
                        (stocksSortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        ))}
                    </div>
                  </th>
                  <th
                    className="text-right p-3 text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                    onClick={() => onSort('dailyPL')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span>Daily P&L</span>
                      {stocksSortColumn === 'dailyPL' &&
                        (stocksSortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        ))}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedHoldings.map((summary) => {
                  const { holding } = summary;
                  return (
                    <tr key={holding.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{holding.symbol}</span>
                          {holding.isSME && (
                            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded">SME</span>
                          )}
                          {holding.status === 'sold' && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">SOLD</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right text-sm font-semibold text-slate-700">{summary.totalQuantity}</td>
                      <td className="p-3 text-right text-sm font-semibold text-slate-700">
                        {formatCurrency(summary.averageCostBasis)}
                      </td>
                      <td className="p-3 text-right text-sm font-semibold text-slate-700">
                        {formatCurrency(holding.currentPrice)}
                      </td>
                      <td className="p-3 text-right">
                        <div className="text-sm font-bold" style={{ color: summary.gainLoss >= 0 ? '#16a34a' : '#dc2626' }}>
                          {formatCurrency(summary.gainLoss)}
                        </div>
                        <div
                          className="text-xs font-semibold"
                          style={{ color: summary.gainLossPercent >= 0 ? '#16a34a' : '#dc2626' }}
                        >
                          ({summary.gainLossPercent >= 0 ? '+' : ''}{summary.gainLossPercent.toFixed(2)}%)
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="text-sm font-bold" style={{ color: summary.dailyPL >= 0 ? '#16a34a' : '#dc2626' }}>
                          {formatCurrency(summary.dailyPL)}
                        </div>
                        <div
                          className="text-xs font-semibold"
                          style={{ color: summary.dailyPLPercent >= 0 ? '#16a34a' : '#dc2626' }}
                        >
                          ({summary.dailyPLPercent >= 0 ? '+' : ''}{summary.dailyPLPercent.toFixed(2)}%)
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockHoldingsTable;
