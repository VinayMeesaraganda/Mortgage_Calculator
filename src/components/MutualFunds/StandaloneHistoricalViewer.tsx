import React from 'react';
import { AlertCircle, BarChart3, Loader2, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { MutualFundHolding } from '../../types/mutualFund';
import { formatCurrency } from '../../utils/formatting';
import { CARD_STYLE, CARD_SHADOW } from '../../constants/styles';

interface HistoricalDataPoint {
  date: string;
  nav: number;
}

interface StandaloneHistoricalViewerProps {
  historicalDataForScheme: string | null;
  holdings: MutualFundHolding[];
  historicalStartDate: string;
  onHistoricalStartDateChange: (value: string) => void;
  onReloadHistoricalData: (schemeCode: string) => void;
  onClose: () => void;
  isLoadingHistorical: boolean;
  historicalData: HistoricalDataPoint[];
}

const StandaloneHistoricalViewer: React.FC<StandaloneHistoricalViewerProps> = ({
  historicalDataForScheme,
  holdings,
  historicalStartDate,
  onHistoricalStartDateChange,
  onReloadHistoricalData,
  onClose,
  isLoadingHistorical,
  historicalData
}) => {
  if (!historicalDataForScheme) {
    return null;
  }

  if (holdings.find((holding) => holding.schemeCode === historicalDataForScheme)) {
    return null;
  }

  return (
    <div className={CARD_STYLE} style={CARD_SHADOW}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Historical Performance
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <label className="text-sm text-slate-700 font-semibold">From Date:</label>
          <input
            type="date"
            value={historicalStartDate}
            onChange={(e) => {
              onHistoricalStartDateChange(e.target.value);
              if (historicalDataForScheme) {
                onReloadHistoricalData(historicalDataForScheme);
              }
            }}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {isLoadingHistorical ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600 mr-2" />
            <span className="text-slate-600">Loading historical data...</span>
          </div>
        ) : historicalData.length > 0 ? (
          <div className="space-y-4">
            {historicalData.length >= 2 && (() => {
              const firstNAV = historicalData[0].nav;
              const lastNAV = historicalData[historicalData.length - 1].nav;
              const totalReturn = ((lastNAV - firstNAV) / firstNAV) * 100;
              const years =
                (new Date(historicalData[historicalData.length - 1].date).getTime() -
                  new Date(historicalData[0].date).getTime()) /
                (1000 * 60 * 60 * 24 * 365);
              const cagr = years > 0 ? (Math.pow(lastNAV / firstNAV, 1 / years) - 1) * 100 : 0;

              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-xs text-slate-600 mb-1">Starting NAV</p>
                    <p className="text-lg font-bold text-slate-800">{formatCurrency(firstNAV)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-200">
                    <p className="text-xs text-slate-600 mb-1">Current NAV</p>
                    <p className="text-lg font-bold text-slate-800">{formatCurrency(lastNAV)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                    <p className="text-xs text-slate-600 mb-1">Total Return</p>
                    <p className={`text-lg font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                    <p className="text-xs text-slate-600 mb-1">CAGR</p>
                    <p className={`text-lg font-bold ${cagr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {cagr >= 0 ? '+' : ''}{cagr.toFixed(2)}%
                    </p>
                  </div>
                </div>
              );
            })()}

            <div className="bg-white rounded-lg p-4 border-2 border-purple-200 shadow-sm">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: '#475569', fontWeight: 'bold' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="nav"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    name="NAV"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p>No historical data available for the selected period.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandaloneHistoricalViewer;
