import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, Check, ChevronDown, Edit2, Loader2, PieChart, Plus, RefreshCw, Trash2, TrendingUp, X } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { MutualFundHolding, MutualFundHoldingSummary, MutualFundPurchase } from '../../types/mutualFund';
import { formatCurrency } from '../../utils/formatting';
import { CARD_STYLE, CARD_SHADOW } from '../../constants/styles';
import { HelpTooltip } from '../HelpTooltip';
import { DatePicker } from '../DatePicker';

interface HistoricalDataPoint {
  date: string;
  nav: number;
}

interface MutualFundsHoldingsListProps {
  holdings: MutualFundHolding[];
  holdingsSummary: MutualFundHoldingSummary[];
  currentUser: User | null;
  setShowAddForm: (value: boolean) => void;
  expandedPurchases: Set<string>;
  setExpandedPurchases: React.Dispatch<React.SetStateAction<Set<string>>>;
  inlineAddPurchaseHoldingId: string | null;
  setInlineAddPurchaseHoldingId: (value: string | null) => void;
  inlineInvestmentAmount: string;
  setInlineInvestmentAmount: (value: string) => void;
  inlinePurchaseDate: string;
  setInlinePurchaseDate: (value: string) => void;
  inlineUseManualNAV: boolean;
  setInlineUseManualNAV: (value: boolean) => void;
  inlineManualNAV: string;
  setInlineManualNAV: (value: string) => void;
  editingPurchaseId: string | null;
  setEditingPurchaseId: (value: string | null) => void;
  refreshingHoldingIds: Set<string>;
  isLoadingHistorical: boolean;
  isLoadingNAV: boolean;
  historicalDataForScheme: string | null;
  historicalData: HistoricalDataPoint[];
  historicalStartDate: string;
  setHistoricalStartDate: (value: string) => void;
  handleLoadHistoricalData: (schemeCode: string) => void;
  handleUpdateCurrentNAV: (holdingId: string) => void;
  handleDeleteHolding: (holdingId: string) => void;
  handleDeletePurchase: (holdingId: string, purchaseId: string) => void;
  handleUpdatePurchase: (holdingId: string, purchaseId: string, updates: Partial<MutualFundPurchase>) => void;
  handleAddPurchaseInline: (holdingId: string) => void;
}

const MutualFundsHoldingsList: React.FC<MutualFundsHoldingsListProps> = ({
  holdings,
  holdingsSummary,
  currentUser,
  setShowAddForm,
  expandedPurchases,
  setExpandedPurchases,
  inlineAddPurchaseHoldingId,
  setInlineAddPurchaseHoldingId,
  inlineInvestmentAmount,
  setInlineInvestmentAmount,
  inlinePurchaseDate,
  setInlinePurchaseDate,
  inlineUseManualNAV,
  setInlineUseManualNAV,
  inlineManualNAV,
  setInlineManualNAV,
  editingPurchaseId,
  setEditingPurchaseId,
  refreshingHoldingIds,
  isLoadingHistorical,
  isLoadingNAV,
  historicalDataForScheme,
  historicalData,
  historicalStartDate,
  setHistoricalStartDate,
  handleLoadHistoricalData,
  handleUpdateCurrentNAV,
  handleDeleteHolding,
  handleDeletePurchase,
  handleUpdatePurchase,
  handleAddPurchaseInline
}) => {
  if (holdings.length === 0) {
    return (
      <div className={CARD_STYLE} style={CARD_SHADOW}>
        <div className="p-12 text-center">
          <PieChart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-600 mb-2">
            {currentUser ? 'No Mutual Funds in Portfolio' : 'Explore Mutual Funds'}
          </h3>
          <p className="text-slate-500 mb-4">
            {currentUser
              ? 'Add your first mutual fund to start tracking your investments'
              : 'Search for funds, check historical performance, or add to your portfolio'}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 inline-flex items-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            {currentUser ? 'Add Your First Fund' : 'Explore & Check Performance'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-6">
      {holdingsSummary.map((summary) => {
        const { holding } = summary;

        return (
          <div key={holding.id} className={CARD_STYLE} style={CARD_SHADOW}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                    <PieChart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{holding.schemeName}</h3>
                    <p className="text-sm text-slate-600">
                      {summary.totalUnits.toFixed(4)} units • Avg NAV: {formatCurrency(summary.averagePurchasePrice)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Current NAV</p>
                    <p className="text-lg font-bold text-slate-800">{formatCurrency(holding.currentNAV)}</p>
                  </div>
                  <button
                    onClick={() => handleLoadHistoricalData(holding.schemeCode)}
                    disabled={isLoadingHistorical}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${historicalDataForScheme === holding.schemeCode
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                      }`}
                    title="View Historical Performance"
                  >
                    {isLoadingHistorical && historicalDataForScheme === holding.schemeCode ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <TrendingUp className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">Historical</span>
                  </button>
                  <button
                    onClick={() => handleUpdateCurrentNAV(holding.id)}
                    disabled={refreshingHoldingIds.has(holding.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Update NAV"
                  >
                    {refreshingHoldingIds.has(holding.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteHolding(holding.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete fund"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1">Total Invested</p>
                  <p className="text-sm font-bold text-slate-800">{formatCurrency(summary.totalInvested)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1">Current Value</p>
                  <p className="text-sm font-bold text-slate-800">{formatCurrency(summary.currentValue)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1">Gain/Loss</p>
                  <p className={`text-sm font-bold ${summary.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.gainLoss)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1">Return %</p>
                  <p className={`text-sm font-bold ${summary.gainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.gainLossPercent >= 0 ? '+' : ''}{summary.gainLossPercent.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-200">
                  <p className="text-xs text-slate-600 mb-1">CAGR</p>
                  <p className={`text-sm font-bold ${summary.cagr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.cagr >= 0 ? '+' : ''}{summary.cagr.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-3 border border-indigo-200">
                  <p className="text-xs text-slate-600 mb-1">XIRR</p>
                  <p className={`text-sm font-bold ${summary.xirr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.xirr >= 0 ? '+' : ''}{summary.xirr.toFixed(2)}%
                  </p>
                </div>
              </div>

              {historicalDataForScheme === holding.schemeCode && (
                <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      Historical Performance
                    </h4>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-600">From:</label>
                      <input
                        type="date"
                        value={historicalStartDate}
                        onChange={(e) => {
                          setHistoricalStartDate(e.target.value);
                          handleLoadHistoricalData(holding.schemeCode);
                        }}
                        className="px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {isLoadingHistorical ? (
                    <div className="flex items-center justify-center py-8">
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
                            <div className="bg-white rounded-lg p-3 border border-purple-100">
                              <p className="text-xs text-slate-600 mb-1">Starting NAV</p>
                              <p className="text-sm font-bold text-slate-800">{formatCurrency(firstNAV)}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-purple-100">
                              <p className="text-xs text-slate-600 mb-1">Current NAV</p>
                              <p className="text-sm font-bold text-slate-800">{formatCurrency(lastNAV)}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-purple-100">
                              <p className="text-xs text-slate-600 mb-1">Total Return</p>
                              <p className={`text-sm font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                              </p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-purple-100">
                              <p className="text-xs text-slate-600 mb-1">CAGR</p>
                              <p className={`text-sm font-bold ${cagr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {cagr >= 0 ? '+' : ''}{cagr.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="bg-white rounded-lg p-4 border border-purple-100">
                        <ResponsiveContainer width="100%" height={300}>
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
                              contentStyle={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                              formatter={(value: number) => formatCurrency(value)}
                              labelStyle={{ color: '#475569', fontWeight: 'bold' }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="nav"
                              stroke="#8b5cf6"
                              strokeWidth={2}
                              dot={{ r: 2 }}
                              name="NAV"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No historical data available for the selected period.
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      Purchases ({holding.purchases.length})
                      <HelpTooltip content="Multiple purchases (SIP) of the same fund are automatically combined to calculate your average NAV and total units." />
                    </h4>
                    {holding.purchases.length > 0 && (
                      <button
                        onClick={() => {
                          const newExpanded = new Set(expandedPurchases);
                          if (newExpanded.has(holding.id)) {
                            newExpanded.delete(holding.id);
                          } else {
                            newExpanded.add(holding.id);
                          }
                          setExpandedPurchases(newExpanded);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                      >
                        {expandedPurchases.has(holding.id) ? 'Hide' : 'Show'}
                        <ChevronDown
                          className={`w-3 h-3 transition-transform ${expandedPurchases.has(holding.id) ? 'rotate-180' : ''}`}
                        />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (inlineAddPurchaseHoldingId === holding.id) {
                        setInlineAddPurchaseHoldingId(null);
                        setInlineInvestmentAmount('');
                        setInlineUseManualNAV(false);
                        setInlineManualNAV('');
                      } else {
                        setInlineAddPurchaseHoldingId(holding.id);
                        setInlineInvestmentAmount('');
                        setInlinePurchaseDate(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`);
                        setInlineUseManualNAV(false);
                        setInlineManualNAV('');
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {inlineAddPurchaseHoldingId === holding.id ? 'Cancel' : 'Add Purchase'}
                  </button>
                </div>

                {inlineAddPurchaseHoldingId === holding.id && (
                  <div className="bg-purple-50 rounded-lg p-3 border-2 border-purple-300 mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                      <div>
                        <label className="text-xs text-slate-700 font-semibold mb-1 block">
                          Investment Amount <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={inlineInvestmentAmount}
                          onChange={(e) => setInlineInvestmentAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-700 font-semibold mb-1 block">
                          Purchase Date <span className="text-red-500">*</span>
                        </label>
                        <DatePicker value={inlinePurchaseDate} onChange={setInlinePurchaseDate} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-700 font-semibold mb-1 block">
                          NAV at Purchase <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={inlineUseManualNAV}
                              onChange={(e) => {
                                setInlineUseManualNAV(e.target.checked);
                                if (!e.target.checked) setInlineManualNAV('');
                              }}
                              className="w-3 h-3 text-purple-600 border-slate-300 rounded"
                            />
                            <span className="text-xs text-slate-600">Manual NAV</span>
                          </label>
                          {inlineUseManualNAV && (
                            <input
                              type="text"
                              value={inlineManualNAV}
                              onChange={(e) => setInlineManualNAV(e.target.value)}
                              placeholder="Enter NAV"
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          )}
                          {!inlineUseManualNAV && (
                            <p className="text-xs text-slate-500">Auto-fetch from MFAPI</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setInlineAddPurchaseHoldingId(null);
                          setInlineInvestmentAmount('');
                          setInlineUseManualNAV(false);
                          setInlineManualNAV('');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-400 hover:bg-slate-500 text-white rounded-lg transition-colors flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAddPurchaseInline(holding.id)}
                        disabled={isLoadingNAV}
                        className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-1 disabled:opacity-50"
                      >
                        {isLoadingNAV ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            Add Purchase
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {expandedPurchases.has(holding.id) && (
                  <div className="space-y-2">
                    {holding.purchases.map((purchase) => {
                      const isEditingPurchase = editingPurchaseId === purchase.id;
                      const purchaseValue = purchase.investmentAmount;
                      const currentValue = holding.currentNAV * purchase.quantity;
                      const purchaseGainLoss = currentValue - purchaseValue;

                      return (
                        <div key={purchase.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          {isEditingPurchase ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div>
                                <label className="text-xs text-slate-600">Amount</label>
                                <input
                                  type="text"
                                  defaultValue={purchase.investmentAmount}
                                  onBlur={(e) => {
                                    const amount = parseFloat(e.target.value.replace(/[^0-9.]/g, ''));
                                    if (!isNaN(amount) && amount > 0) {
                                      const units = amount / purchase.purchasePrice;
                                      handleUpdatePurchase(holding.id, purchase.id, {
                                        investmentAmount: amount,
                                        quantity: units
                                      });
                                    }
                                  }}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-600">Units</label>
                                <input
                                  type="text"
                                  defaultValue={purchase.quantity.toFixed(4)}
                                  onBlur={(e) => {
                                    const qty = parseFloat(e.target.value.replace(/[^0-9.]/g, ''));
                                    if (!isNaN(qty) && qty > 0) {
                                      handleUpdatePurchase(holding.id, purchase.id, { quantity: qty });
                                    }
                                  }}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-600">Date</label>
                                <DatePicker
                                  value={purchase.purchaseDate}
                                  onChange={(date) => handleUpdatePurchase(holding.id, purchase.id, { purchaseDate: date })}
                                />
                              </div>
                              <div className="flex items-end gap-1">
                                <button
                                  onClick={() => setEditingPurchaseId(null)}
                                  className="px-2 py-1 bg-purple-600 text-white rounded text-xs"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setEditingPurchaseId(null)}
                                  className="px-2 py-1 bg-slate-400 text-white rounded text-xs"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <div>
                                  <span className="text-slate-600">Amount: </span>
                                  <span className="font-semibold">{formatCurrency(purchase.investmentAmount)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-600">Units: </span>
                                  <span className="font-semibold">{purchase.quantity.toFixed(4)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-600">NAV: </span>
                                  <span className="font-semibold">{formatCurrency(purchase.purchasePrice)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-600">Value: </span>
                                  <span
                                    className={`font-semibold ${purchaseGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                  >
                                    {formatCurrency(currentValue)} ({purchaseGainLoss >= 0 ? '+' : ''}
                                    {((purchaseGainLoss / purchaseValue) * 100).toFixed(1)}%)
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <button
                                  onClick={() => setEditingPurchaseId(purchase.id)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit purchase"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeletePurchase(holding.id, purchase.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete purchase"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MutualFundsHoldingsList;
