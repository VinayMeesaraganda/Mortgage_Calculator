import React from 'react';
import { TrendingUp, X } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { CARD_STYLE, CARD_SHADOW } from '../../constants/styles';

interface HistoricalPerformanceData {
  investmentAmount: number;
  purchaseDate: string;
  purchaseNAV: number;
  currentNAV: number;
  units: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  cagr: number;
}

interface HistoricalPerformanceCardProps {
  data: HistoricalPerformanceData | null;
  schemeName: string;
  onClose: () => void;
  performanceRef: React.RefObject<HTMLDivElement>;
}

const HistoricalPerformanceCard: React.FC<HistoricalPerformanceCardProps> = ({
  data,
  schemeName,
  onClose,
  performanceRef
}) => {
  if (!data) {
    return null;
  }

  return (
    <div ref={performanceRef} className={CARD_STYLE} style={CARD_SHADOW}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Historical Performance Analysis
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-slate-600">Fund:</span>
              <span className="font-semibold text-slate-800 ml-2">{schemeName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-600">Purchase Date:</span>
              <span className="font-semibold text-slate-800 ml-2">{formatDate(data.purchaseDate)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
            <p className="text-xs text-slate-600 mb-1">Investment Amount</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(data.investmentAmount)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border-2 border-purple-200">
            <p className="text-xs text-slate-600 mb-1">Current Value</p>
            <p className="text-2xl font-bold text-purple-700">{formatCurrency(data.currentValue)}</p>
          </div>
          <div
            className={`bg-gradient-to-br rounded-xl p-4 border-2 ${
              data.gainLoss >= 0
                ? 'from-green-50 to-emerald-50 border-green-200'
                : 'from-red-50 to-rose-50 border-red-200'
            }`}
          >
            <p className="text-xs text-slate-600 mb-1">Gain/Loss</p>
            <p className={`text-2xl font-bold ${data.gainLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatCurrency(data.gainLoss)}
            </p>
            <p className={`text-sm font-semibold mt-1 ${data.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({data.gainLoss >= 0 ? '+' : ''}{data.gainLossPercent.toFixed(2)}%)
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border-2 border-orange-200">
            <p className="text-xs text-slate-600 mb-1">CAGR</p>
            <p className={`text-2xl font-bold ${data.cagr >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {data.cagr >= 0 ? '+' : ''}{data.cagr.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <p className="text-xs text-slate-600 mb-1">NAV on Purchase Date</p>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(data.purchaseNAV)}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <p className="text-xs text-slate-600 mb-1">Current NAV</p>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(data.currentNAV)}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <p className="text-xs text-slate-600 mb-1">Units</p>
            <p className="text-lg font-bold text-slate-800">{data.units.toFixed(4)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalPerformanceCard;
