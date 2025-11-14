import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowLeft, Plus, Edit2, Trash2, X, Check, RefreshCw, DollarSign, ShoppingCart, Filter, ChevronDown, ChevronUp, Search, ArrowUp, ArrowDown } from 'lucide-react';
import type { StockHolding, StockTransaction, StockHoldingSummary } from '../types/stock';
import type { Currency } from '../types/mortgage';
import { formatCurrency, setGlobalCurrency } from '../utils/formatting';
import { formatCurrencyValue } from '../utils/currency';
import { CURRENCY_DATA } from '../utils/currency';
import { CARD_STYLE, CARD_SHADOW, INPUT_STYLE } from '../constants/styles';
import { HelpTooltip } from '../components/HelpTooltip';
import { DatePicker } from '../components/DatePicker';
import CurrencySelector from '../components/CurrencySelector';
import { useToast } from '../components/Toast';
import { fetchStockPrice, fetchMultipleStockPrices } from '../services/yahooFinanceService';
import { useAuth } from '../contexts/AuthContext';
import { saveStockHoldings, loadStockHoldings, subscribeToStockHoldings } from '../services/stockService';
import { DEBOUNCE_DELAYS } from '../utils/constants';
import { logger } from '../utils/logger';

const StockInvestments: React.FC = () => {
  const { warning, success: successToast, error: errorToast } = useToast();
  const { currentUser } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('INR');
  const [holdings, setHoldings] = useState<StockHolding[]>([]);
  const [isLoadingHoldings, setIsLoadingHoldings] = useState(false);
  const [isSavingHoldings, setIsSavingHoldings] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isInitialLoadRef = useRef(true);
  const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'sold'>('active');
  const [transactionSearchQuery, setTransactionSearchQuery] = useState('');
  const [stocksSortColumn, setStocksSortColumn] = useState<'symbol' | 'shares' | 'avgPrice' | 'currentPrice' | 'gainLoss' | 'dailyPL'>('symbol');
  const [stocksSortDirection, setStocksSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isTransactionsExpanded, setIsTransactionsExpanded] = useState(false);
  
  // Form state for adding new stock or transaction
  const [newStockSymbol, setNewStockSymbol] = useState('');
  const [newStockIsSME, setNewStockIsSME] = useState(false);
  const [newStockCurrentPrice, setNewStockCurrentPrice] = useState('');
  const [fetchedPriceData, setFetchedPriceData] = useState<{ previousClose?: number; openingPrice?: number } | null>(null);
  const [newTransactionPrice, setNewTransactionPrice] = useState('');
  const [newTransactionQuantity, setNewTransactionQuantity] = useState('');
  const [newTransactionDate, setNewTransactionDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [newTransactionType, setNewTransactionType] = useState<'buy' | 'sell'>('buy');
  const [manualPriceEntry, setManualPriceEntry] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingTransactionToHoldingId, setAddingTransactionToHoldingId] = useState<string | null>(null);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [isRefreshingAllPrices, setIsRefreshingAllPrices] = useState(false);
  
  // Inline transaction form state (for adding transactions directly in grid)
  const [inlineAddHoldingId, setInlineAddHoldingId] = useState<string | null>(null);
  const [inlineTransactionType, setInlineTransactionType] = useState<'buy' | 'sell'>('buy');
  const [inlineTransactionPrice, setInlineTransactionPrice] = useState('');
  const [inlineTransactionQuantity, setInlineTransactionQuantity] = useState('');
  const [inlineTransactionDate, setInlineTransactionDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  
  // Edit transaction form state
  const [editTransactionPrice, setEditTransactionPrice] = useState('');
  const [editTransactionQuantity, setEditTransactionQuantity] = useState('');
  const [editTransactionDate, setEditTransactionDate] = useState('');
  const [editTransactionType, setEditTransactionType] = useState<'buy' | 'sell'>('buy');
  
  // Track which holding's transactions dropdown is open
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());

  // Update global currency when selected currency changes
  React.useEffect(() => {
    setGlobalCurrency(selectedCurrency);
  }, [selectedCurrency]);

  // Load holdings from Firestore on mount and when user changes
  useEffect(() => {
    if (!currentUser) {
      setHoldings([]);
      return;
    }

    const loadHoldings = async () => {
      try {
        setIsLoadingHoldings(true);
        isInitialLoadRef.current = true;
        const loadedHoldings = await loadStockHoldings(currentUser.uid);
        setHoldings(loadedHoldings);
        logger.info('Stock holdings loaded from Firestore', { count: loadedHoldings.length });
        if (loadedHoldings.length > 0) {
          successToast(`Loaded ${loadedHoldings.length} stock holding(s) from Firestore`);
        }
      } catch (error) {
        console.error('Error loading stock holdings:', error);
        logger.error('Error loading stock holdings', error);
        const err = error as Error;
        errorToast(err.message || 'Failed to load stock holdings. Please refresh the page.');
      } finally {
        setIsLoadingHoldings(false);
        isInitialLoadRef.current = false;
      }
    };

    loadHoldings();

    // Subscribe to real-time updates
    unsubscribeRef.current = subscribeToStockHoldings(currentUser.uid, (updatedHoldings) => {
      if (!isInitialLoadRef.current) {
        setHoldings(updatedHoldings);
        logger.info('Stock holdings updated from Firestore', { count: updatedHoldings.length });
      }
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [currentUser, errorToast]);

  // Function to save holdings immediately (bypasses debounce)
  const saveHoldingsImmediately = useCallback(async (holdingsToSave?: StockHolding[]) => {
    if (!currentUser || isLoadingHoldings || isInitialLoadRef.current) {
      return;
    }

    // Use provided holdings or current state
    const holdingsToUse = holdingsToSave || holdings;

    try {
      setIsSavingHoldings(true);
      await saveStockHoldings(currentUser.uid, holdingsToUse);
      console.log('Saved');
      logger.info('Stock holdings saved successfully to Firestore', { 
        userId: currentUser.uid, 
        count: holdingsToUse.length 
      });
    } catch (error) {
      const err = error as Error;
      console.error('Error saving stock holdings:', error);
      logger.error('Error saving stock holdings', error);
      errorToast(err.message || 'Failed to save stock holdings. Check console for details.');
    } finally {
      setIsSavingHoldings(false);
    }
  }, [holdings, currentUser, isLoadingHoldings, errorToast]);

  // Save holdings to Firestore when they change (debounced - for price updates, etc.)
  useEffect(() => {
    if (!currentUser || isLoadingHoldings || isInitialLoadRef.current) {
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    const saveTimer = setTimeout(async () => {
      try {
        setIsSavingHoldings(true);
        await saveStockHoldings(currentUser.uid, holdings);
        logger.info('Stock holdings saved successfully to Firestore', { 
          userId: currentUser.uid, 
          count: holdings.length 
        });
      } catch (error) {
        const err = error as Error;
        console.error('Error saving stock holdings:', error);
        logger.error('Error saving stock holdings', error);
        errorToast(err.message || 'Failed to save stock holdings. Check console for details.');
      } finally {
        setIsSavingHoldings(false);
      }
    }, DEBOUNCE_DELAYS.FIRESTORE_SAVE);

    saveTimerRef.current = saveTimer;

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [holdings, currentUser, isLoadingHoldings, errorToast]);

  // Refresh all stock prices
  const refreshAllPrices = useCallback(async (silent: boolean = false) => {
    if (!silent) setIsRefreshingAllPrices(true);
    
    const stocksToRefresh = holdings.filter(h => !h.manualPrice);
    if (stocksToRefresh.length === 0) {
      if (!silent) warning('No stocks with auto-fetch enabled');
      if (!silent) setIsRefreshingAllPrices(false);
      return;
    }

    try {
      const results = await fetchMultipleStockPrices(
        stocksToRefresh.map(h => ({ symbol: h.symbol, isSME: h.isSME }))
      );

      const updatedHoldings = holdings.map(holding => {
        if (holding.manualPrice) return holding;
        
        const result = results.find(r => r.symbol.includes(holding.symbol));
        if (result && result.success) {
          const now = new Date();
          return {
            ...holding,
            currentPrice: result.price,
            previousClose: result.previousClose, // This updates daily when API is called
            openingPrice: result.open,
            lastFetched: now.toISOString(),
            lastFetchedDate: now.toISOString().split('T')[0],
            exchange: result.exchange
          };
        }
        return holding;
      });

      setHoldings(updatedHoldings);
      if (!silent) successToast(`Refreshed prices for ${results.filter(r => r.success).length} stocks`);
    } catch (error) {
      if (!silent) errorToast('Error refreshing prices');
    } finally {
      if (!silent) setIsRefreshingAllPrices(false);
    }
  }, [holdings, successToast, errorToast, warning]);

  // Auto-refresh prices every 5 minutes for non-manual stocks
  useEffect(() => {
    const autoRefresh = setInterval(() => {
      refreshAllPrices(true); // Silent refresh
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(autoRefresh);
  }, [refreshAllPrices]);

  // Auto-refresh prices once per day at midnight to update previousClose
  // This ensures previousClose is updated to the previous trading day's closing price
  useEffect(() => {
    if (!currentUser || holdings.length === 0) return;

    const scheduleDailyRefresh = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // Midnight
      
      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      
      let dailyInterval: NodeJS.Timeout | null = null;
      
      const timeout = setTimeout(() => {
        // Refresh prices at midnight to get updated previousClose for new day
        refreshAllPrices(true);
        
        // Then set up daily interval to refresh at midnight every day
        dailyInterval = setInterval(() => {
          refreshAllPrices(true);
        }, 24 * 60 * 60 * 1000); // 24 hours
      }, msUntilMidnight);

      return () => {
        clearTimeout(timeout);
        if (dailyInterval) {
          clearInterval(dailyInterval);
        }
      };
    };

    const cleanup = scheduleDailyRefresh();
    return cleanup;
  }, [currentUser, holdings.length, refreshAllPrices]);

  // Fetch stock price from Yahoo Finance
  const fetchPrice = useCallback(async (symbol: string, isSME: boolean) => {
    setIsFetchingPrice(true);
    try {
      const result = await fetchStockPrice(symbol, isSME);
      if (result.success) {
        setNewStockCurrentPrice(result.price.toFixed(2));
        // Store previousClose and openingPrice for Daily P&L calculation
        setFetchedPriceData({
          previousClose: result.previousClose,
          openingPrice: result.open
        });
        successToast(`Fetched price for ${symbol}: ${formatCurrency(result.price)} (Open: ${formatCurrency(result.open)})`);
        return result;
      } else {
        errorToast(result.error || 'Failed to fetch stock price');
        setFetchedPriceData(null);
        return null;
      }
    } catch (error) {
      errorToast('Error fetching stock price. Please enter manually.');
      setFetchedPriceData(null);
      return null;
    } finally {
      setIsFetchingPrice(false);
    }
  }, [successToast, errorToast]);

  // Calculate summary for each holding
  const holdingsSummary = useMemo<StockHoldingSummary[]>(() => {
    return holdings.map(holding => {
      // Calculate total bought and sold quantities
      const totalBought = holding.transactions
        .filter(t => t.type === 'buy')
        .reduce((sum, t) => sum + t.quantity, 0);
      
      const totalSold = holding.transactions
        .filter(t => t.type === 'sell')
        .reduce((sum, t) => sum + t.quantity, 0);
      
      const totalQuantity = totalBought - totalSold;

      // Calculate average cost basis (FIFO method for simplicity)
      const buyTransactions = holding.transactions.filter(t => t.type === 'buy');
      const totalInvestedInBuys = buyTransactions.reduce((sum, t) => sum + (t.price * t.quantity), 0);
      const averageCostBasis = totalBought > 0 ? totalInvestedInBuys / totalBought : 0;

      // Calculate total invested in current holdings (proportional to remaining shares)
      const totalInvested = averageCostBasis * totalQuantity;

      // Current value
      const currentValue = holding.currentPrice * totalQuantity;

      // Unrealized gain/loss
      const gainLoss = currentValue - totalInvested;
      const gainLossPercent = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

      // Daily P&L (based on previous day's closing price vs today's current price)
      // The previousClose from Yahoo Finance API is always the previous trading day's closing price
      // If previousClose is not available, we can't calculate daily P&L accurately
      // For manual entries without previousClose, we'll show 0 (no daily change data available)
      const previousClose = holding.previousClose;
      let dailyChange = 0;
      let dailyPL = 0;
      let dailyPLPercent = 0;
      
      // Only calculate Daily P&L if we have previousClose (from API fetch)
      if (previousClose && previousClose > 0) {
        dailyChange = holding.currentPrice - previousClose;
        dailyPL = dailyChange * totalQuantity;
        dailyPLPercent = (dailyChange / previousClose) * 100;
      }

      // Realized gain/loss from sold shares
      const sellTransactions = holding.transactions.filter(t => t.type === 'sell');
      let realizedGainLoss = 0;
      sellTransactions.forEach(sell => {
        const sellValue = sell.price * sell.quantity;
        const costBasis = averageCostBasis * sell.quantity;
        realizedGainLoss += (sellValue - costBasis);
      });

      // Total gain/loss
      const totalGainLoss = realizedGainLoss + gainLoss;

      return {
        holding,
        totalQuantity,
        totalBought,
        totalSold,
        averageCostBasis,
        totalInvested,
        currentValue,
        gainLoss,
        gainLossPercent,
        dailyPL,
        dailyPLPercent,
        realizedGainLoss,
        totalGainLoss
      };
    });
  }, [holdings]);

  // Filter holdings based on status
  const filteredHoldings = useMemo(() => {
    return holdingsSummary.filter(summary => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'active') return summary.holding.status === 'active';
      if (filterStatus === 'sold') return summary.holding.status === 'sold';
      return true;
    });
  }, [holdingsSummary, filterStatus]);

  // Sort filtered holdings
  const sortedHoldings = useMemo(() => {
    const sorted = [...filteredHoldings].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (stocksSortColumn) {
        case 'symbol':
          aValue = a.holding.symbol;
          bValue = b.holding.symbol;
          break;
        case 'shares':
          aValue = a.totalQuantity;
          bValue = b.totalQuantity;
          break;
        case 'avgPrice':
          aValue = a.averageCostBasis;
          bValue = b.averageCostBasis;
          break;
        case 'currentPrice':
          aValue = a.holding.currentPrice;
          bValue = b.holding.currentPrice;
          break;
        case 'gainLoss':
          aValue = a.gainLoss;
          bValue = b.gainLoss;
          break;
        case 'dailyPL':
          aValue = a.dailyPL;
          bValue = b.dailyPL;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return stocksSortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return stocksSortDirection === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    return sorted;
  }, [filteredHoldings, stocksSortColumn, stocksSortDirection]);

  // Handle column header click for sorting
  const handleSort = useCallback((column: 'symbol' | 'shares' | 'avgPrice' | 'currentPrice' | 'gainLoss' | 'dailyPL') => {
    if (stocksSortColumn === column) {
      // Toggle direction if clicking the same column
      setStocksSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setStocksSortColumn(column);
      setStocksSortDirection('asc');
    }
  }, [stocksSortColumn]);

  // Get all transactions from all holdings for the transactions table
  const allTransactions = useMemo(() => {
    return holdings.flatMap(holding => 
      holding.transactions.map(transaction => ({
        ...transaction,
        stockSymbol: holding.symbol,
        stockId: holding.id
      }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [holdings]);

  // Filter transactions by search query
  const filteredTransactions = useMemo(() => {
    if (!transactionSearchQuery.trim()) return allTransactions;
    const query = transactionSearchQuery.trim().toUpperCase();
    return allTransactions.filter(t => t.stockSymbol.toUpperCase().includes(query));
  }, [allTransactions, transactionSearchQuery]);

  // Calculate portfolio totals (only active stocks)
  const portfolioTotals = useMemo(() => {
    const activeHoldings = holdingsSummary.filter(s => s.holding.status === 'active');
    
    const totalInvested = activeHoldings.reduce((sum, s) => sum + s.totalInvested, 0);
    const totalCurrentValue = activeHoldings.reduce((sum, s) => sum + s.currentValue, 0);
    const totalUnrealizedGainLoss = activeHoldings.reduce((sum, s) => sum + s.gainLoss, 0);
    const totalUnrealizedGainLossPercent = totalInvested > 0 ? (totalUnrealizedGainLoss / totalInvested) * 100 : 0;
    const totalDailyPL = activeHoldings.reduce((sum, s) => sum + s.dailyPL, 0);
    const totalDailyPLPercent = totalInvested > 0 ? (totalDailyPL / totalInvested) * 100 : 0;
    const totalRealizedGainLoss = holdingsSummary.reduce((sum, s) => sum + s.realizedGainLoss, 0);
    const totalGainLoss = totalUnrealizedGainLoss + totalRealizedGainLoss;
    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrentValue,
      totalUnrealizedGainLoss,
      totalUnrealizedGainLossPercent,
      totalRealizedGainLoss,
      totalGainLoss,
      totalGainLossPercent,
      totalDailyPL,
      totalDailyPLPercent
    };
  }, [holdingsSummary]);

  // Add new stock or transaction
  const handleAddTransaction = useCallback(async () => {
    const symbol = newStockSymbol.trim().toUpperCase();
    const currentPrice = parseFloat(newStockCurrentPrice.replace(/[^0-9.]/g, ''));
    const transactionPrice = parseFloat(newTransactionPrice.replace(/[^0-9.]/g, ''));
    const quantity = parseFloat(newTransactionQuantity.replace(/[^0-9.]/g, ''));

    if (!symbol || isNaN(currentPrice) || isNaN(transactionPrice) || isNaN(quantity) || quantity <= 0) {
      warning('Please fill in all fields with valid numbers');
      return;
    }

    // Check if stock already exists
    const existingHoldingIndex = holdings.findIndex(h => h.symbol === symbol);
    
    if (existingHoldingIndex >= 0) {
      // Add transaction to existing stock
      const newTransaction: StockTransaction = {
        id: `transaction-${Date.now()}-${Math.random()}`,
        date: newTransactionDate,
        type: newTransactionType,
        price: transactionPrice,
        quantity
      };

      const updatedHoldings = [...holdings];
      const existingHolding = updatedHoldings[existingHoldingIndex];
      
      // Update transactions
      const updatedTransactions = [...existingHolding.transactions, newTransaction];
      
      // Calculate new status
      const totalBought = updatedTransactions.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.quantity, 0);
      const totalSold = updatedTransactions.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.quantity, 0);
      const newStatus = totalBought <= totalSold ? 'sold' : 'active';

      updatedHoldings[existingHoldingIndex] = {
        ...existingHolding,
        currentPrice, // Update current price
        transactions: updatedTransactions,
        purchases: [...existingHolding.purchases, ...(newTransactionType === 'buy' ? [{
          id: newTransaction.id,
          purchaseDate: newTransactionDate,
          purchasePrice: transactionPrice,
          quantity
        }] : [])],
        status: newStatus,
        soldDate: newStatus === 'sold' ? newTransactionDate : undefined
      };
      
      setHoldings(updatedHoldings);
      successToast(`Added ${newTransactionType} transaction for ${symbol}`);
      // Save immediately after adding transaction
      saveHoldingsImmediately(updatedHoldings);
    } else {
      // Create new stock holding
      if (newTransactionType === 'sell') {
        warning('Cannot sell a stock that is not in your portfolio');
        return;
      }

      const newTransaction: StockTransaction = {
        id: `transaction-${Date.now()}-${Math.random()}`,
        date: newTransactionDate,
        type: 'buy',
        price: transactionPrice,
        quantity
      };

      const now = new Date();
      const newHolding: StockHolding = {
        id: `holding-${Date.now()}-${Math.random()}`,
        symbol,
        isSME: newStockIsSME,
        currentPrice,
        manualPrice: manualPriceEntry,
        lastFetched: manualPriceEntry ? undefined : now.toISOString(),
        lastFetchedDate: manualPriceEntry ? undefined : now.toISOString().split('T')[0],
        previousClose: manualPriceEntry ? undefined : (fetchedPriceData?.previousClose || undefined),
        openingPrice: manualPriceEntry ? undefined : (fetchedPriceData?.openingPrice || currentPrice),
        purchases: [{
          id: newTransaction.id,
          purchaseDate: newTransactionDate,
          purchasePrice: transactionPrice,
          quantity
        }],
        transactions: [newTransaction],
        status: 'active'
      };
      
      const updatedHoldings = [...holdings, newHolding];
      setHoldings(updatedHoldings);
      successToast(`Added ${symbol} to portfolio`);
      // Save immediately after adding new stock
      saveHoldingsImmediately(updatedHoldings);
    }

    // Reset form
    setNewStockSymbol('');
    setNewStockIsSME(false);
    setNewStockCurrentPrice('');
    setFetchedPriceData(null);
    setNewTransactionPrice('');
    setNewTransactionQuantity('');
    setManualPriceEntry(false);
    setAddingTransactionToHoldingId(null);
    setShowAddForm(false);
  }, [holdings, newStockSymbol, newStockIsSME, newStockCurrentPrice, fetchedPriceData, newTransactionPrice, newTransactionQuantity, newTransactionDate, newTransactionType, manualPriceEntry, warning, successToast]);

  // Delete a stock holding
  const handleDeleteHolding = useCallback((holdingId: string) => {
    if (window.confirm('Are you sure you want to delete this stock holding? This will remove all transactions.')) {
      const updatedHoldings = holdings.filter(h => h.id !== holdingId);
      setHoldings(updatedHoldings);
      successToast('Stock removed from portfolio');
      // Save immediately after deleting stock
      saveHoldingsImmediately(updatedHoldings);
    }
  }, [holdings, successToast, saveHoldingsImmediately]);

  // Delete a transaction
  const handleDeleteTransaction = useCallback((holdingId: string, transactionId: string) => {
    const holding = holdings.find(h => h.id === holdingId);
    if (!holding) return;

    if (holding.transactions.length === 1) {
      // If last transaction, delete entire holding
      handleDeleteHolding(holdingId);
    } else {
      // Remove transaction from holding
      const updatedTransactions = holding.transactions.filter(t => t.id !== transactionId);
      const updatedPurchases = holding.purchases.filter(p => p.id !== transactionId);
      
      // Recalculate status
      const totalBought = updatedTransactions.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.quantity, 0);
      const totalSold = updatedTransactions.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.quantity, 0);
      const newStatus: 'active' | 'sold' = totalBought <= totalSold ? 'sold' : 'active';

      const updatedHoldings = holdings.map(h => 
        h.id === holdingId 
          ? { 
              ...h, 
              transactions: updatedTransactions,
              purchases: updatedPurchases,
              status: newStatus 
            }
          : h
      );
      setHoldings(updatedHoldings);
      successToast('Transaction deleted');
      // Save immediately after deleting transaction
      saveHoldingsImmediately(updatedHoldings);
    }
  }, [holdings, handleDeleteHolding, successToast, saveHoldingsImmediately]);

  // Update holding current price
  const handleUpdateCurrentPrice = useCallback((holdingId: string, newPrice: number) => {
    setHoldings(holdings.map(h => 
      h.id === holdingId ? { ...h, currentPrice: newPrice, manualPrice: true } : h
    ));
    setEditingHoldingId(null);
    successToast('Price updated');
  }, [holdings, successToast]);

  // Toggle manual/auto price mode
  const handleTogglePriceMode = useCallback(async (holdingId: string) => {
    const holding = holdings.find(h => h.id === holdingId);
    if (!holding) return;

    if (holding.manualPrice) {
      // Switch to auto-fetch
      setIsFetchingPrice(true);
      const result = await fetchStockPrice(holding.symbol, holding.isSME);
      setIsFetchingPrice(false);

      if (result.success) {
        const now = new Date();
        setHoldings(holdings.map(h => 
          h.id === holdingId 
            ? { 
                ...h, 
                currentPrice: result.price,
                previousClose: result.previousClose,
                openingPrice: result.open,
                manualPrice: false, 
                lastFetched: now.toISOString(),
                lastFetchedDate: now.toISOString().split('T')[0],
                exchange: result.exchange
              } 
            : h
        ));
        successToast('Switched to auto-fetch mode');
      } else {
        errorToast(result.error || 'Failed to fetch price');
      }
    } else {
      // Switch to manual
      setHoldings(holdings.map(h => 
        h.id === holdingId ? { ...h, manualPrice: true } : h
      ));
      successToast('Switched to manual mode');
    }
  }, [holdings, successToast, errorToast]);

  // Update transaction
  const handleUpdateTransaction = useCallback((
    holdingId: string,
    transactionId: string,
    updates: Partial<StockTransaction>
  ) => {
    const holding = holdings.find(h => h.id === holdingId);
    if (!holding) return;

    const updatedTransactions = holding.transactions.map(t =>
      t.id === transactionId ? { ...t, ...updates } : t
    );

    // Update purchases if it's a buy transaction
    const updatedPurchases = holding.purchases.map(p => {
      if (p.id === transactionId) {
        return { ...p, ...(updates.type === 'buy' ? {
          purchaseDate: updates.date || p.purchaseDate,
          purchasePrice: updates.price !== undefined ? updates.price : p.purchasePrice,
          quantity: updates.quantity !== undefined ? updates.quantity : p.quantity
        } : {}) };
      }
      return p;
    }).filter(p => {
      // Remove purchase if transaction type changed to sell
      const transaction = updatedTransactions.find(t => t.id === p.id);
      return transaction?.type === 'buy';
    });

    // Add purchase if transaction type changed from sell to buy
    if (updates.type === 'buy') {
      const existingPurchase = updatedPurchases.find(p => p.id === transactionId);
      if (!existingPurchase && updates.price !== undefined && updates.quantity !== undefined) {
        updatedPurchases.push({
          id: transactionId,
          purchaseDate: updates.date || holding.transactions.find(t => t.id === transactionId)?.date || '',
          purchasePrice: updates.price,
          quantity: updates.quantity
        });
      }
    }

    // Recalculate status
    const totalBought = updatedTransactions.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.quantity, 0);
    const totalSold = updatedTransactions.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.quantity, 0);
    const newStatus: 'active' | 'sold' = totalBought <= totalSold ? 'sold' : 'active';

    const updatedHoldings = holdings.map(h =>
      h.id === holdingId
        ? {
            ...h,
            transactions: updatedTransactions,
            purchases: updatedPurchases,
            status: newStatus,
            soldDate: newStatus === 'sold' ? (updates.date || holding.soldDate) : undefined
          }
        : h
    );
    setHoldings(updatedHoldings);
    setEditingTransactionId(null);
    successToast('Transaction updated');
    // Save immediately after updating transaction
    saveHoldingsImmediately(updatedHoldings);
  }, [holdings, successToast, saveHoldingsImmediately]);

  // Add transaction inline (directly in transactions grid)
  const handleAddInlineTransaction = useCallback((holdingId: string) => {
    const price = parseFloat(inlineTransactionPrice.replace(/[^0-9.]/g, ''));
    const quantity = parseFloat(inlineTransactionQuantity.replace(/[^0-9.]/g, ''));

    if (isNaN(price) || isNaN(quantity) || quantity <= 0 || price <= 0) {
      warning('Please enter valid price and quantity');
      return;
    }

    const holding = holdings.find(h => h.id === holdingId);
    if (!holding) return;

    const newTransaction: StockTransaction = {
      id: `transaction-${Date.now()}-${Math.random()}`,
      date: inlineTransactionDate,
      type: inlineTransactionType,
      price,
      quantity
    };

    const updatedTransactions = [...holding.transactions, newTransaction];

    // Update purchases if it's a buy
    const updatedPurchases = inlineTransactionType === 'buy'
      ? [...holding.purchases, {
          id: newTransaction.id,
          purchaseDate: inlineTransactionDate,
          purchasePrice: price,
          quantity
        }]
      : holding.purchases;

    // Recalculate status
    const totalBought = updatedTransactions.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.quantity, 0);
    const totalSold = updatedTransactions.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.quantity, 0);
    const newStatus: 'active' | 'sold' = totalBought <= totalSold ? 'sold' : 'active';

    const updatedHoldings = holdings.map(h =>
      h.id === holdingId
        ? {
            ...h,
            transactions: updatedTransactions,
            purchases: updatedPurchases,
            status: newStatus,
            soldDate: newStatus === 'sold' ? inlineTransactionDate : undefined
          }
        : h
    );
    setHoldings(updatedHoldings);

    // Reset inline form
    setInlineAddHoldingId(null);
    setInlineTransactionPrice('');
    setInlineTransactionQuantity('');
    setInlineTransactionType('buy');
    setInlineTransactionDate(() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    });
    successToast(`${inlineTransactionType === 'buy' ? 'Buy' : 'Sell'} transaction added`);
    // Save immediately after adding inline transaction
    saveHoldingsImmediately(updatedHoldings);
  }, [holdings, inlineTransactionPrice, inlineTransactionQuantity, inlineTransactionDate, inlineTransactionType, warning, successToast, saveHoldingsImmediately]);

  // Start editing a transaction
  const handleStartEditTransaction = useCallback((holdingId: string, transactionId: string) => {
    const holding = holdings.find(h => h.id === holdingId);
    if (!holding) return;

    const transaction = holding.transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    setEditingTransactionId(transactionId);
    setEditTransactionPrice(transaction.price.toString());
    setEditTransactionQuantity(transaction.quantity.toString());
    setEditTransactionDate(transaction.date);
    setEditTransactionType(transaction.type);
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
                onClick={() => refreshAllPrices()}
                disabled={isRefreshingAllPrices}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                title="Refresh all stock prices"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshingAllPrices ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <CurrencySelector 
                selectedCurrency={selectedCurrency}
                onCurrencyChange={setSelectedCurrency}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className={CARD_STYLE} style={CARD_SHADOW}>
            <div className="pl-3 pr-2 py-3">
              <h3 className="text-xs font-semibold text-slate-600 mb-1.5">Total Invested</h3>
              <p className="text-lg font-bold text-slate-800 leading-tight">{formatCurrencyValue(Math.round(portfolioTotals.totalInvested), selectedCurrency, false)}</p>
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
              <p className={`text-lg font-bold leading-tight ${portfolioTotals.totalUnrealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrencyValue(Math.round(portfolioTotals.totalUnrealizedGainLoss), selectedCurrency, false)}
                <span className={`text-xs font-medium ml-1 ${portfolioTotals.totalUnrealizedGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ({portfolioTotals.totalUnrealizedGainLossPercent >= 0 ? '+' : ''}{portfolioTotals.totalUnrealizedGainLossPercent.toFixed(2)}%)
                </span>
              </p>
            </div>
          </div>
          <div className={CARD_STYLE} style={CARD_SHADOW}>
            <div className="pl-3 pr-2 py-3">
              <h3 className="text-xs font-semibold text-slate-600 mb-1.5">Realized P&L</h3>
              <p className={`text-lg font-bold leading-tight ${portfolioTotals.totalRealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrencyValue(Math.round(portfolioTotals.totalRealizedGainLoss), selectedCurrency, false)}
                {portfolioTotals.totalInvested > 0 && (
                  <span className={`text-xs font-medium ml-1 ${portfolioTotals.totalRealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({((portfolioTotals.totalRealizedGainLoss / portfolioTotals.totalInvested) * 100).toFixed(2)}%)
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className={CARD_STYLE} style={CARD_SHADOW}>
            <div className="pl-3 pr-2 py-3">
              <h3 className="text-xs font-semibold text-slate-600 mb-1.5">Total Gain/Loss</h3>
              <p className={`text-lg font-bold leading-tight ${portfolioTotals.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrencyValue(Math.round(portfolioTotals.totalGainLoss), selectedCurrency, false)}
                <span className={`text-xs font-medium ml-1 ${portfolioTotals.totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ({portfolioTotals.totalGainLossPercent >= 0 ? '+' : ''}{portfolioTotals.totalGainLossPercent.toFixed(2)}%)
                </span>
              </p>
            </div>
          </div>
          <div className={CARD_STYLE} style={CARD_SHADOW}>
            <div className="pl-3 pr-2 py-3">
              <h3 className="text-xs font-semibold text-slate-600 mb-1.5">Daily P&L</h3>
              <p className={`text-lg font-bold leading-tight ${portfolioTotals.totalDailyPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrencyValue(Math.round(portfolioTotals.totalDailyPL), selectedCurrency, false)}
                <span className={`text-xs font-medium ml-1 ${portfolioTotals.totalDailyPLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ({portfolioTotals.totalDailyPLPercent >= 0 ? '+' : ''}{portfolioTotals.totalDailyPLPercent.toFixed(2)}%)
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Filter and Add Form */}
        <div className={CARD_STYLE} style={CARD_SHADOW}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  {showAddForm ? (newTransactionType === 'buy' ? <ShoppingCart className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />) : <Filter className="w-5 h-5" />}
                  {showAddForm ? (addingTransactionToHoldingId ? `${newTransactionType === 'buy' ? 'Buy' : 'Sell'} ${newStockSymbol}` : 'Add Stock to Portfolio') : 'Portfolio Tracker'}
                </h2>
                {!showAddForm && (
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setFilterStatus('active')}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition-all ${filterStatus === 'active' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => setFilterStatus('sold')}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition-all ${filterStatus === 'sold' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                    >
                      Sold
                    </button>
                    <button
                      onClick={() => setFilterStatus('all')}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition-all ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                    >
                      All
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  if (showAddForm) {
                    setAddingTransactionToHoldingId(null);
                    setNewTransactionType('buy');
                  }
                }}
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
                
                {/* Transaction Type Selector (for existing stocks) */}
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
                          onClick={() => {
                            if (!newStockSymbol.trim()) {
                              warning('Please enter stock symbol first');
                              return;
                            }
                            fetchPrice(newStockSymbol.trim(), newStockIsSME);
                          }}
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
                    <DatePicker
                      value={newTransactionDate}
                      onChange={setNewTransactionDate}
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleAddTransaction}
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

        {/* Current Stocks Table */}
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
                        onClick={() => handleSort('symbol')}
                      >
                        <div className="flex items-center gap-2">
                          <span>Stock Name</span>
                          {stocksSortColumn === 'symbol' && (
                            stocksSortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-right p-3 text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                        onClick={() => handleSort('shares')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span>Shares</span>
                          {stocksSortColumn === 'shares' && (
                            stocksSortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-right p-3 text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                        onClick={() => handleSort('avgPrice')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span>Avg Price</span>
                          {stocksSortColumn === 'avgPrice' && (
                            stocksSortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-right p-3 text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                        onClick={() => handleSort('currentPrice')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span>Current Price</span>
                          {stocksSortColumn === 'currentPrice' && (
                            stocksSortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-right p-3 text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                        onClick={() => handleSort('gainLoss')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span>Gain/Loss</span>
                          {stocksSortColumn === 'gainLoss' && (
                            stocksSortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-right p-3 text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                        onClick={() => handleSort('dailyPL')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span>Daily P&L</span>
                          {stocksSortColumn === 'dailyPL' && (
                            stocksSortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          )}
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
                          <td className="p-3 text-right text-sm font-semibold text-slate-700">{formatCurrency(summary.averageCostBasis)}</td>
                          <td className="p-3 text-right text-sm font-semibold text-slate-700">{formatCurrency(holding.currentPrice)}</td>
                          <td className="p-3 text-right">
                            <div className="text-sm font-bold" style={{ color: summary.gainLoss >= 0 ? '#16a34a' : '#dc2626' }}>
                              {formatCurrency(summary.gainLoss)}
                            </div>
                            <div className="text-xs font-semibold" style={{ color: summary.gainLossPercent >= 0 ? '#16a34a' : '#dc2626' }}>
                              ({summary.gainLossPercent >= 0 ? '+' : ''}{summary.gainLossPercent.toFixed(2)}%)
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <div className="text-sm font-bold" style={{ color: summary.dailyPL >= 0 ? '#16a34a' : '#dc2626' }}>
                              {formatCurrency(summary.dailyPL)}
                            </div>
                            <div className="text-xs font-semibold" style={{ color: summary.dailyPLPercent >= 0 ? '#16a34a' : '#dc2626' }}>
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

        {/* All Transactions Table */}
        <div className={CARD_STYLE} style={CARD_SHADOW}>
          <div className="p-6">
            <button
              onClick={() => setIsTransactionsExpanded(!isTransactionsExpanded)}
              className="w-full flex items-center justify-between mb-4 hover:bg-slate-50 -m-2 p-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                {isTransactionsExpanded ? (
                  <ChevronUp className="w-5 h-5 text-slate-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-600" />
                )}
                <h2 className="text-xl font-bold text-slate-800">All Transactions</h2>
                <span className="text-sm text-slate-500 font-normal">({filteredTransactions.length})</span>
              </div>
              {isTransactionsExpanded && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={transactionSearchQuery}
                      onChange={(e) => setTransactionSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Search by stock name..."
                      className="pl-10 pr-4 py-2 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  {transactionSearchQuery && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTransactionSearchQuery('');
                      }}
                      className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </button>
            {isTransactionsExpanded && (
              <>
                {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">
                  {transactionSearchQuery ? 'No transactions found for this search' : 'No transactions yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-300">
                      <th className="text-left p-3 text-sm font-bold text-slate-700">Date</th>
                      <th className="text-left p-3 text-sm font-bold text-slate-700">Stock Name</th>
                      <th className="text-center p-3 text-sm font-bold text-slate-700">Type</th>
                      <th className="text-right p-3 text-sm font-bold text-slate-700">Price</th>
                      <th className="text-right p-3 text-sm font-bold text-slate-700">Quantity</th>
                      <th className="text-right p-3 text-sm font-bold text-slate-700">Value</th>
                      <th className="text-center p-3 text-sm font-bold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => {
                      const transValue = transaction.price * transaction.quantity;
                      const isEditing = editingTransactionId === transaction.id;
                      
                      return (
                        <tr key={transaction.id} className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${transaction.type === 'buy' ? 'bg-green-50/30' : 'bg-red-50/30'}`}>
                          <td className="p-3 text-sm font-semibold text-slate-700">{transaction.date}</td>
                          <td className="p-3">
                            <span className="font-bold text-slate-800">{transaction.stockSymbol}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              transaction.type === 'buy' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {transaction.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 text-right text-sm font-semibold text-slate-700">{formatCurrency(transaction.price)}</td>
                          <td className="p-3 text-right text-sm font-semibold text-slate-700">{transaction.quantity}</td>
                          <td className="p-3 text-right text-sm font-bold text-slate-800">{formatCurrency(transValue)}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      const price = parseFloat(editTransactionPrice.replace(/[^0-9.]/g, ''));
                                      const quantity = parseFloat(editTransactionQuantity.replace(/[^0-9.]/g, ''));
                                      if (!isNaN(price) && !isNaN(quantity) && quantity > 0 && price > 0) {
                                        handleUpdateTransaction(transaction.stockId, transaction.id, {
                                          type: editTransactionType,
                                          price,
                                          quantity,
                                          date: editTransactionDate
                                        });
                                      } else {
                                        warning('Please enter valid price and quantity');
                                      }
                                    }}
                                    className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                                    title="Save"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingTransactionId(null);
                                      setEditTransactionPrice('');
                                      setEditTransactionQuantity('');
                                      setEditTransactionDate('');
                                    }}
                                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleStartEditTransaction(transaction.stockId, transaction.id)}
                                    className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                    title="Edit transaction"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTransaction(transaction.stockId, transaction.id)}
                                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                    title="Delete transaction"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Old Holdings List - Removed */}
        {false && filteredHoldings.length === 0 ? (
          <div></div>
        ) : (
          <div style={{ display: 'none' }}>
            {filteredHoldings.map((summary) => {
              const { holding } = summary;
              const isEditingPrice = editingHoldingId === holding.id;

              return (
                <div key={holding.id} className={CARD_STYLE} style={CARD_SHADOW}>
                  <div className="p-6">
                    {/* Stock Header */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg ${holding.status === 'sold' ? 'bg-gradient-to-br from-slate-400 to-slate-500' : 'bg-gradient-to-br from-green-500 to-emerald-600'} flex items-center justify-center shadow-lg relative`}>
                          <span className="text-white font-bold text-xs">{holding.symbol.substring(0, 4)}</span>
                          {holding.isSME && (
                            <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-[8px] font-bold px-1 rounded">SME</div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-slate-800">{holding.symbol}</h3>
                            {holding.status === 'sold' && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">SOLD</span>
                            )}
                            {holding.exchange && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">{holding.exchange}</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">
                            {summary.totalQuantity} {summary.totalQuantity === 1 ? 'share' : 'shares'} • 
                            Avg Cost: {formatCurrency(summary.averageCostBasis)}
                            {holding.lastFetched && !holding.manualPrice && (
                              <span className="ml-2 text-xs text-slate-500">
                                (Updated: {new Date(holding.lastFetched).toLocaleTimeString()})
                              </span>
                            )}
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
                              className="w-32 px-2 py-1 border-2 border-green-300 rounded text-sm"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <>
                            <div className="text-right">
                              <p className="text-sm text-slate-600">Current Price</p>
                              <p className="text-lg font-bold text-slate-800">{formatCurrency(holding.currentPrice)}</p>
                              <label className="flex items-center gap-1 text-xs text-slate-600 mt-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={holding.manualPrice}
                                  onChange={() => handleTogglePriceMode(holding.id)}
                                  className="w-3 h-3"
                                />
                                Manual
                              </label>
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
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
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
                        <p className={`text-xs font-semibold ${summary.gainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {summary.gainLossPercent >= 0 ? '+' : ''}{summary.gainLossPercent.toFixed(2)}%
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-600 mb-1">Daily P&L</p>
                        <p className={`text-sm font-bold ${summary.dailyPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(summary.dailyPL)}
                        </p>
                        <p className={`text-xs font-semibold ${summary.dailyPLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {summary.dailyPLPercent >= 0 ? '+' : ''}{summary.dailyPLPercent.toFixed(2)}%
                        </p>
                      </div>
                      {summary.realizedGainLoss !== 0 && (
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-slate-600 mb-1">Realized P&L</p>
                          <p className={`text-sm font-bold ${summary.realizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(summary.realizedGainLoss)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Transactions List */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedTransactions);
                            if (newExpanded.has(holding.id)) {
                              newExpanded.delete(holding.id);
                            } else {
                              newExpanded.add(holding.id);
                            }
                            setExpandedTransactions(newExpanded);
                          }}
                          className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors"
                        >
                          {expandedTransactions.has(holding.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          <span>Transactions ({holding.transactions.length})</span>
                          <HelpTooltip content="All buy and sell transactions for this stock" />
                        </button>
                        {holding.status === 'active' && inlineAddHoldingId !== holding.id && expandedTransactions.has(holding.id) && (
                          <button
                            onClick={() => {
                              setInlineAddHoldingId(holding.id);
                              setInlineTransactionType('buy');
                              setInlineTransactionPrice('');
                              setInlineTransactionQuantity('');
                              setInlineTransactionDate(() => {
                                const now = new Date();
                                return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                              });
                            }}
                            className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add Transaction
                          </button>
                        )}
                      </div>
                      {expandedTransactions.has(holding.id) && (
                      <div className="space-y-2">
                        {/* Inline Add Transaction Form */}
                        {inlineAddHoldingId === holding.id && (
                          <div className="rounded-lg p-3 border-2 border-blue-300 bg-blue-50">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-xs font-bold text-slate-700">Add New Transaction</h5>
                              <button
                                onClick={() => {
                                  setInlineAddHoldingId(null);
                                  setInlineTransactionPrice('');
                                  setInlineTransactionQuantity('');
                                }}
                                className="p-1 text-slate-600 hover:bg-slate-200 rounded transition-colors"
                                title="Cancel"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                              <div>
                                <label className="block text-xs text-slate-600 mb-1">Type</label>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => setInlineTransactionType('buy')}
                                    className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition-all ${
                                      inlineTransactionType === 'buy'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    }`}
                                  >
                                    Buy
                                  </button>
                                  <button
                                    onClick={() => setInlineTransactionType('sell')}
                                    className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition-all ${
                                      inlineTransactionType === 'sell'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    }`}
                                  >
                                    Sell
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs text-slate-600 mb-1">Price</label>
                                <input
                                  type="text"
                                  value={inlineTransactionPrice}
                                  onChange={(e) => setInlineTransactionPrice(e.target.value)}
                                  placeholder="0.00"
                                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-600 mb-1">Quantity</label>
                                <input
                                  type="text"
                                  value={inlineTransactionQuantity}
                                  onChange={(e) => setInlineTransactionQuantity(e.target.value)}
                                  placeholder="0"
                                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-600 mb-1">Date</label>
                                <DatePicker
                                  value={inlineTransactionDate}
                                  onChange={setInlineTransactionDate}
                                />
                              </div>
                              <div className="flex items-end gap-1">
                                <button
                                  onClick={() => handleAddInlineTransaction(holding.id)}
                                  className={`flex-1 px-2 py-1 text-xs font-semibold rounded text-white transition-all ${
                                    inlineTransactionType === 'buy'
                                      ? 'bg-green-600 hover:bg-green-700'
                                      : 'bg-red-600 hover:bg-red-700'
                                  }`}
                                >
                                  <Check className="w-3 h-3 inline" />
                                </button>
                                <button
                                  onClick={() => {
                                    setInlineAddHoldingId(null);
                                    setInlineTransactionPrice('');
                                    setInlineTransactionQuantity('');
                                  }}
                                  className="px-2 py-1 text-xs font-semibold bg-slate-400 hover:bg-slate-500 text-white rounded transition-all"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {[...holding.transactions].sort((a, b) => {
                          // Sort by date descending (newest first)
                          const dateA = new Date(a.date).getTime();
                          const dateB = new Date(b.date).getTime();
                          return dateB - dateA;
                        }).map((transaction) => {
                          const transValue = transaction.price * transaction.quantity;
                          const isEditing = editingTransactionId === transaction.id;

                          return (
                            <div key={transaction.id} className={`rounded-lg p-3 border-2 ${transaction.type === 'buy' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                              {isEditing ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs font-bold text-slate-700">Edit Transaction</h5>
                                    <button
                                      onClick={() => {
                                        setEditingTransactionId(null);
                                        setEditTransactionPrice('');
                                        setEditTransactionQuantity('');
                                        setEditTransactionDate('');
                                      }}
                                      className="p-1 text-slate-600 hover:bg-slate-200 rounded transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                    <div>
                                      <label className="block text-xs text-slate-600 mb-1">Type</label>
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => setEditTransactionType('buy')}
                                          className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition-all ${
                                            editTransactionType === 'buy'
                                              ? 'bg-green-600 text-white'
                                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                          }`}
                                        >
                                          Buy
                                        </button>
                                        <button
                                          onClick={() => setEditTransactionType('sell')}
                                          className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition-all ${
                                            editTransactionType === 'sell'
                                              ? 'bg-red-600 text-white'
                                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                          }`}
                                        >
                                          Sell
                                        </button>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-xs text-slate-600 mb-1">Price</label>
                                      <input
                                        type="text"
                                        value={editTransactionPrice}
                                        onChange={(e) => setEditTransactionPrice(e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-slate-600 mb-1">Quantity</label>
                                      <input
                                        type="text"
                                        value={editTransactionQuantity}
                                        onChange={(e) => setEditTransactionQuantity(e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-slate-600 mb-1">Date</label>
                                      <DatePicker
                                        value={editTransactionDate}
                                        onChange={setEditTransactionDate}
                                      />
                                    </div>
                                    <div className="flex items-end gap-1">
                                      <button
                                        onClick={() => {
                                          const price = parseFloat(editTransactionPrice.replace(/[^0-9.]/g, ''));
                                          const quantity = parseFloat(editTransactionQuantity.replace(/[^0-9.]/g, ''));
                                          if (!isNaN(price) && !isNaN(quantity) && quantity > 0 && price > 0) {
                                            handleUpdateTransaction(holding.id, transaction.id, {
                                              type: editTransactionType,
                                              price,
                                              quantity,
                                              date: editTransactionDate
                                            });
                                          } else {
                                            warning('Please enter valid price and quantity');
                                          }
                                        }}
                                        className="flex-1 px-2 py-1 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded transition-all"
                                      >
                                        <Check className="w-3 h-3 inline" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingTransactionId(null);
                                          setEditTransactionPrice('');
                                          setEditTransactionQuantity('');
                                          setEditTransactionDate('');
                                        }}
                                        className="px-2 py-1 text-xs font-semibold bg-slate-400 hover:bg-slate-500 text-white rounded transition-all"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                                    <div>
                                      <span className="text-slate-600">Type: </span>
                                      <span className={`font-bold uppercase ${transaction.type === 'buy' ? 'text-green-700' : 'text-red-700'}`}>
                                        {transaction.type}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-600">Price: </span>
                                      <span className="font-semibold">{formatCurrency(transaction.price)}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-600">Qty: </span>
                                      <span className="font-semibold">{transaction.quantity}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-600">Date: </span>
                                      <span className="font-semibold">{transaction.date}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-600">Value: </span>
                                      <span className="font-semibold">{formatCurrency(transValue)}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 ml-2">
                                    <button
                                      onClick={() => handleStartEditTransaction(holding.id, transaction.id)}
                                      className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                      title="Edit transaction"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTransaction(holding.id, transaction.id)}
                                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                      title="Delete transaction"
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
        )}
      </main>
    </div>
  );
};

export default StockInvestments;

