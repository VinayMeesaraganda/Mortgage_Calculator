import React from 'react';
import { Check, DollarSign, Filter, Plus, RefreshCw, ShoppingCart, X } from 'lucide-react';
import type { Currency } from '../../types/mortgage';
import { CURRENCY_DATA } from '../../utils/currency';
import { CARD_STYLE, CARD_SHADOW, INPUT_STYLE } from '../../constants/styles';
import { DatePicker } from '../DatePicker';

interface StockAddFormProps {
  showAddForm: boolean;
  onToggleShowForm: () => void;
  filterStatus: 'all' | 'active' | 'sold';
  onFilterStatusChange: (value: 'all' | 'active' | 'sold') => void;
  addingTransactionToHoldingId: string | null;
  newTransactionType: 'buy' | 'sell';
  setNewTransactionType: (value: 'buy' | 'sell') => void;
  newStockSymbol: string;
  setNewStockSymbol: (value: string) => void;
  newStockIsSME: boolean;
  setNewStockIsSME: (value: boolean) => void;
  newStockCurrentPrice: string;
  setNewStockCurrentPrice: (value: string) => void;
  manualPriceEntry: boolean;
  setManualPriceEntry: (value: boolean) => void;
  onFetchPrice: () => void;
  isFetchingPrice: boolean;
  selectedCurrency: Currency;
  newTransactionPrice: string;
  setNewTransactionPrice: (value: string) => void;
  newTransactionQuantity: string;
  setNewTransactionQuantity: (value: string) => void;
  newTransactionDate: string;
  setNewTransactionDate: (value: string) => void;
  onAddTransaction: () => void;
}

const StockAddForm: React.FC<StockAddFormProps> = ({
  showAddForm,
  onToggleShowForm,
  filterStatus,
  onFilterStatusChange,
  addingTransactionToHoldingId,
  newTransactionType,
  setNewTransactionType,
  newStockSymbol,
  setNewStockSymbol,
  newStockIsSME,
  setNewStockIsSME,
  newStockCurrentPrice,
  setNewStockCurrentPrice,
  manualPriceEntry,
  setManualPriceEntry,
  onFetchPrice,
  isFetchingPrice,
  selectedCurrency,
  newTransactionPrice,
  setNewTransactionPrice,
  newTransactionQuantity,
  setNewTransactionQuantity,
  newTransactionDate,
  setNewTransactionDate,
  onAddTransaction
}) => {
  return (
    <div className={CARD_STYLE} style={CARD_SHADOW}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {showAddForm ? (
                newTransactionType === 'buy' ? (
                  <ShoppingCart className="w-5 h-5" />
                ) : (
                  <DollarSign className="w-5 h-5" />
                )
              ) : (
                <Filter className="w-5 h-5" />
              )}
              {showAddForm
                ? addingTransactionToHoldingId
                  ? `${newTransactionType === 'buy' ? 'Buy' : 'Sell'} ${newStockSymbol}`
                  : 'Add Stock to Portfolio'
                : 'Portfolio Tracker'}
            </h2>
            {!showAddForm && (
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onFilterStatusChange('active')}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition-all ${
                    filterStatus === 'active'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => onFilterStatusChange('sold')}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition-all ${
                    filterStatus === 'sold'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Sold
                </button>
                <button
                  onClick={() => onFilterStatusChange('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition-all ${
                    filterStatus === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  All
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onToggleShowForm}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
          >
            {showAddForm ? (
              <>
                <X className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Stock
              </>
            )}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-slate-50 rounded-lg p-3 border-2 border-green-200">
            {addingTransactionToHoldingId && (
              <div className="mb-3 p-2 bg-green-100 rounded border border-green-300">
                <p className="text-xs font-semibold text-green-800">
                  {newTransactionType === 'buy' ? 'Buying' : 'Selling'}: <span className="font-bold">{newStockSymbol}</span>
                </p>
              </div>
            )}

            {addingTransactionToHoldingId && (
              <div className="mb-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewTransactionType('buy')}
                    className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${
                      newTransactionType === 'buy'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Buy
                  </button>
                  <button
                    onClick={() => setNewTransactionType('sell')}
                    className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${
                      newTransactionType === 'sell'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    Sell
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Symbol <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newStockSymbol}
                    onChange={(e) => setNewStockSymbol(e.target.value.toUpperCase())}
                    placeholder="RELIANCE"
                    disabled={!!addingTransactionToHoldingId}
                    className={`${INPUT_STYLE} flex-1 text-sm ${addingTransactionToHoldingId ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                    maxLength={50}
                  />
                  {!addingTransactionToHoldingId && (
                    <label className="flex items-center gap-1 px-2 py-1.5 bg-white border border-slate-300 rounded text-xs cursor-pointer hover:border-green-500 transition-colors">
                      <input
                        type="checkbox"
                        checked={newStockIsSME}
                        onChange={(e) => setNewStockIsSME(e.target.checked)}
                        className="w-3 h-3 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="text-xs font-medium text-slate-700">SME</span>
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Price <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newStockCurrentPrice}
                    onChange={(e) => setNewStockCurrentPrice(e.target.value)}
                    placeholder={`${CURRENCY_DATA[selectedCurrency].symbol}0.00`}
                    disabled={!manualPriceEntry && !!newStockSymbol.trim()}
                    className={`${INPUT_STYLE} flex-1 text-sm`}
                  />
                  {!addingTransactionToHoldingId && (
                    <button
                      onClick={onFetchPrice}
                      disabled={isFetchingPrice || manualPriceEntry}
                      className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Fetch price"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isFetchingPrice ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>
                {!addingTransactionToHoldingId && (
                  <label className="flex items-center gap-1 mt-1">
                    <input
                      type="checkbox"
                      checked={manualPriceEntry}
                      onChange={(e) => setManualPriceEntry(e.target.checked)}
                      className="w-3 h-3 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="text-xs text-slate-600">Manual</span>
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {newTransactionType === 'buy' ? 'Buy' : 'Sell'} Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTransactionPrice}
                  onChange={(e) => setNewTransactionPrice(e.target.value)}
                  placeholder={`${CURRENCY_DATA[selectedCurrency].symbol}0.00`}
                  className={`${INPUT_STYLE} text-sm`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTransactionQuantity}
                  onChange={(e) => setNewTransactionQuantity(e.target.value)}
                  placeholder="0"
                  className={`${INPUT_STYLE} text-sm`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <DatePicker value={newTransactionDate} onChange={setNewTransactionDate} />
              </div>
            </div>

            <button
              onClick={onAddTransaction}
              className={`w-full px-4 py-2 text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                newTransactionType === 'buy'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
              } text-white`}
            >
              <Check className="w-4 h-4" />
              {newTransactionType === 'buy' ? 'Buy Stock' : 'Sell Stock'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAddForm;
