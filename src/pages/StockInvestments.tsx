import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowLeft, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import type { StockHolding, StockPurchase, StockHoldingSummary } from '../types/stock';
import type { Currency } from '../types/mortgage';
import { formatCurrency, setGlobalCurrency } from '../utils/formatting';
import { CURRENCY_DATA } from '../utils/currency';
import { CARD_STYLE, CARD_SHADOW, INPUT_STYLE } from '../constants/styles';
import { HelpTooltip } from '../components/HelpTooltip';
import { DatePicker } from '../components/DatePicker';
import CurrencySelector from '../components/CurrencySelector';

const StockInvestments: React.FC = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const [holdings, setHoldings] = useState<StockHolding[]>([]);
  const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  
  // Form state for adding new stock
  const [newStockSymbol, setNewStockSymbol] = useState('');
  const [newStockCurrentPrice, setNewStockCurrentPrice] = useState('');
  const [newPurchasePrice, setNewPurchasePrice] = useState('');
  const [newPurchaseQuantity, setNewPurchaseQuantity] = useState('');
  const [newPurchaseDate, setNewPurchaseDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // Update global currency when selected currency changes
  React.useEffect(() => {
    setGlobalCurrency(selectedCurrency);
  }, [selectedCurrency]);

  // Calculate average cost basis and summary for each holding
  const holdingsSummary = useMemo<StockHoldingSummary[]>(() => {
    return holdings.map(holding => {
      const totalQuantity = holding.purchases.reduce((sum, p) => sum + p.quantity, 0);
      const totalInvested = holding.purchases.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);
      const averageCostBasis = totalQuantity > 0 ? totalInvested / totalQuantity : 0;
      const currentValue = holding.currentPrice * totalQuantity;
      const gainLoss = currentValue - totalInvested;
      const gainLossPercent = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

      return {
        holding,
        totalQuantity,
        averageCostBasis,
        totalInvested,
        currentValue,
        gainLoss,
        gainLossPercent
      };
    });
  }, [holdings]);

  // Calculate portfolio totals
  const portfolioTotals = useMemo(() => {
    const totalInvested = holdingsSummary.reduce((sum, s) => sum + s.totalInvested, 0);
    const totalCurrentValue = holdingsSummary.reduce((sum, s) => sum + s.currentValue, 0);
    const totalGainLoss = totalCurrentValue - totalInvested;
    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrentValue,
      totalGainLoss,
      totalGainLossPercent
    };
  }, [holdingsSummary]);

  // Add new stock or purchase to existing stock
  const handleAddStock = useCallback(() => {
    const symbol = newStockSymbol.trim().toUpperCase();
    const currentPrice = parseFloat(newStockCurrentPrice.replace(/[^0-9.]/g, ''));
    const purchasePrice = parseFloat(newPurchasePrice.replace(/[^0-9.]/g, ''));
    const quantity = parseFloat(newPurchaseQuantity.replace(/[^0-9.]/g, ''));

    if (!symbol || isNaN(currentPrice) || isNaN(purchasePrice) || isNaN(quantity) || quantity <= 0) {
      alert('Please fill in all fields with valid numbers');
      return;
    }

    // Check if stock already exists
    const existingHoldingIndex = holdings.findIndex(h => h.symbol === symbol);
    
    if (existingHoldingIndex >= 0) {
      // Add purchase to existing stock
      const newPurchase: StockPurchase = {
        id: `purchase-${Date.now()}-${Math.random()}`,
        purchaseDate: newPurchaseDate,
        purchasePrice,
        quantity
      };

      const updatedHoldings = [...holdings];
      updatedHoldings[existingHoldingIndex] = {
        ...updatedHoldings[existingHoldingIndex],
        currentPrice, // Update current price
        purchases: [...updatedHoldings[existingHoldingIndex].purchases, newPurchase]
      };
      setHoldings(updatedHoldings);
    } else {
      // Create new stock holding
      const newHolding: StockHolding = {
        id: `holding-${Date.now()}-${Math.random()}`,
        symbol,
        currentPrice,
        purchases: [{
          id: `purchase-${Date.now()}-${Math.random()}`,
          purchaseDate: newPurchaseDate,
          purchasePrice,
          quantity
        }]
      };
      setHoldings([...holdings, newHolding]);
    }

    // Reset form
    setNewStockSymbol('');
    setNewStockCurrentPrice('');
    setNewPurchasePrice('');
    setNewPurchaseQuantity('');
    setShowAddForm(false);
  }, [holdings, newStockSymbol, newStockCurrentPrice, newPurchasePrice, newPurchaseQuantity, newPurchaseDate]);

  // Delete a stock holding
  const handleDeleteHolding = useCallback((holdingId: string) => {
    if (window.confirm('Are you sure you want to delete this stock holding?')) {
      setHoldings(holdings.filter(h => h.id !== holdingId));
    }
  }, [holdings]);

  // Delete a purchase from a stock
  const handleDeletePurchase = useCallback((holdingId: string, purchaseId: string) => {
    const holding = holdings.find(h => h.id === holdingId);
    if (!holding) return;

    if (holding.purchases.length === 1) {
      // If last purchase, delete entire holding
      handleDeleteHolding(holdingId);
    } else {
      // Remove purchase from holding
      setHoldings(holdings.map(h => 
        h.id === holdingId 
          ? { ...h, purchases: h.purchases.filter(p => p.id !== purchaseId) }
          : h
      ));
    }
  }, [holdings, handleDeleteHolding]);

  // Update holding current price
  const handleUpdateCurrentPrice = useCallback((holdingId: string, newPrice: number) => {
    setHoldings(holdings.map(h => 
      h.id === holdingId ? { ...h, currentPrice: newPrice } : h
    ));
    setEditingHoldingId(null);
  }, [holdings]);

  // Update purchase details
  const handleUpdatePurchase = useCallback((
    holdingId: string, 
    purchaseId: string, 
    updates: Partial<StockPurchase>
  ) => {
    setHoldings(holdings.map(h => 
      h.id === holdingId 
        ? {
            ...h,
            purchases: h.purchases.map(p => 
              p.id === purchaseId ? { ...p, ...updates } : p
            )
          }
        : h
    ));
    setEditingPurchaseId(null);
  }, [holdings]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20">
      {/* Header */}
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
            <CurrencySelector 
              selectedCurrency={selectedCurrency}
              onCurrencyChange={setSelectedCurrency}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={CARD_STYLE} style={CARD_SHADOW}>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-1">Total Invested</h3>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(portfolioTotals.totalInvested)}</p>
            </div>
          </div>
          <div className={CARD_STYLE} style={CARD_SHADOW}>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-1">Current Value</h3>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(portfolioTotals.totalCurrentValue)}</p>
            </div>
          </div>
          <div className={CARD_STYLE} style={CARD_SHADOW}>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-1">Total Gain/Loss</h3>
              <p className={`text-2xl font-bold ${portfolioTotals.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(portfolioTotals.totalGainLoss)} ({portfolioTotals.totalGainLossPercent >= 0 ? '+' : ''}{portfolioTotals.totalGainLossPercent.toFixed(2)}%)
              </p>
            </div>
          </div>
        </div>

        {/* Add Stock Form */}
        <div className={CARD_STYLE} style={CARD_SHADOW}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {showAddForm ? 'Add Stock to Portfolio' : 'Portfolio Tracker'}
              </h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
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
              <div className="bg-slate-50 rounded-lg p-4 border-2 border-green-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Stock Symbol <span className="text-red-500">*</span>
                      <HelpTooltip content="Enter the stock ticker symbol (e.g., AAPL, GOOGL, MSFT). If the stock already exists in your portfolio, this will add a new purchase to it." />
                    </label>
                    <input
                      type="text"
                      value={newStockSymbol}
                      onChange={(e) => setNewStockSymbol(e.target.value.toUpperCase())}
                      placeholder="e.g., AAPL"
                      className={INPUT_STYLE}
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Current Price <span className="text-red-500">*</span>
                      <HelpTooltip content="The current market price per share of this stock." />
                    </label>
                    <input
                      type="text"
                      value={newStockCurrentPrice}
                      onChange={(e) => setNewStockCurrentPrice(e.target.value)}
                      placeholder={`${CURRENCY_DATA[selectedCurrency].symbol}0.00`}
                      className={INPUT_STYLE}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Purchase Price <span className="text-red-500">*</span>
                      <HelpTooltip content="The price per share when you purchased this stock." />
                    </label>
                    <input
                      type="text"
                      value={newPurchasePrice}
                      onChange={(e) => setNewPurchasePrice(e.target.value)}
                      placeholder={`${CURRENCY_DATA[selectedCurrency].symbol}0.00`}
                      className={INPUT_STYLE}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Quantity <span className="text-red-500">*</span>
                      <HelpTooltip content="Number of shares purchased." />
                    </label>
                    <input
                      type="text"
                      value={newPurchaseQuantity}
                      onChange={(e) => setNewPurchaseQuantity(e.target.value)}
                      placeholder="0"
                      className={INPUT_STYLE}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Purchase Date <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      value={newPurchaseDate}
                      onChange={setNewPurchaseDate}
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddStock}
                  className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Add to Portfolio
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Holdings List */}
        {holdings.length === 0 ? (
          <div className={CARD_STYLE} style={CARD_SHADOW}>
            <div className="p-12 text-center">
              <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-600 mb-2">No Stocks in Portfolio</h3>
              <p className="text-slate-500 mb-4">Add your first stock to start tracking your investments</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Your First Stock
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {holdingsSummary.map((summary) => {
              const { holding } = summary;
              const isEditingPrice = editingHoldingId === holding.id;

              return (
                <div key={holding.id} className={CARD_STYLE} style={CARD_SHADOW}>
                  <div className="p-6">
                    {/* Stock Header */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">{holding.symbol}</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-800">{holding.symbol}</h3>
                          <p className="text-sm text-slate-600">
                            {summary.totalQuantity} {summary.totalQuantity === 1 ? 'share' : 'shares'} • 
                            Avg Cost: {formatCurrency(summary.averageCostBasis)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditingPrice ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              defaultValue={holding.currentPrice}
                              onBlur={(e) => {
                                const price = parseFloat(e.target.value.replace(/[^0-9.]/g, ''));
                                if (!isNaN(price) && price > 0) {
                                  handleUpdateCurrentPrice(holding.id, price);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const price = parseFloat((e.target as HTMLInputElement).value.replace(/[^0-9.]/g, ''));
                                  if (!isNaN(price) && price > 0) {
                                    handleUpdateCurrentPrice(holding.id, price);
                                  }
                                } else if (e.key === 'Escape') {
                                  setEditingHoldingId(null);
                                }
                              }}
                              className="w-24 px-2 py-1 border-2 border-green-300 rounded text-sm"
                              autoFocus
                            />
                            <span className="text-sm text-slate-600">per share</span>
                          </div>
                        ) : (
                          <>
                            <div className="text-right">
                              <p className="text-sm text-slate-600">Current Price</p>
                              <p className="text-lg font-bold text-slate-800">{formatCurrency(holding.currentPrice)}</p>
                            </div>
                            <button
                              onClick={() => setEditingHoldingId(holding.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit current price"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteHolding(holding.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete stock"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stock Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
                    </div>

                    {/* Purchases List */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                        Purchases ({holding.purchases.length})
                        <HelpTooltip content="Multiple purchases of the same stock are automatically combined to calculate your average cost basis." />
                      </h4>
                      <div className="space-y-2">
                        {holding.purchases.map((purchase) => {
                          const isEditingPurchase = editingPurchaseId === purchase.id;
                          const purchaseValue = purchase.purchasePrice * purchase.quantity;
                          const currentValue = holding.currentPrice * purchase.quantity;
                          const purchaseGainLoss = currentValue - purchaseValue;

                          return (
                            <div key={purchase.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                              {isEditingPurchase ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  <div>
                                    <label className="text-xs text-slate-600">Price</label>
                                    <input
                                      type="text"
                                      defaultValue={purchase.purchasePrice}
                                      onBlur={(e) => {
                                        const price = parseFloat(e.target.value.replace(/[^0-9.]/g, ''));
                                        if (!isNaN(price) && price > 0) {
                                          handleUpdatePurchase(holding.id, purchase.id, { purchasePrice: price });
                                        }
                                      }}
                                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-slate-600">Quantity</label>
                                    <input
                                      type="text"
                                      defaultValue={purchase.quantity}
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
                                      className="px-2 py-1 bg-green-600 text-white rounded text-xs"
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
                                      <span className="text-slate-600">Price: </span>
                                      <span className="font-semibold">{formatCurrency(purchase.purchasePrice)}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-600">Qty: </span>
                                      <span className="font-semibold">{purchase.quantity}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-600">Date: </span>
                                      <span className="font-semibold">{purchase.purchaseDate}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-600">Value: </span>
                                      <span className={`font-semibold ${purchaseGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(currentValue)} ({purchaseGainLoss >= 0 ? '+' : ''}{((purchaseGainLoss / purchaseValue) * 100).toFixed(1)}%)
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default StockInvestments;
