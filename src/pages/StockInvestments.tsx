import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { StockHolding, StockTransaction, StockHoldingSummary } from '../types/stock';
import type { Currency } from '../types/mortgage';
import { formatCurrency, setGlobalCurrency } from '../utils/formatting';
import StockAddForm from '../components/StockInvestments/StockAddForm';
import StockHoldingsTable from '../components/StockInvestments/StockHoldingsTable';
import PageShell from '../layouts/PageShell';
import CurrencySelector from '../components/CurrencySelector';
import StockPortfolioSummaryCards from '../components/StockInvestments/StockPortfolioSummaryCards';
import StockTransactionsTable from '../components/StockInvestments/StockTransactionsTable';
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
  const [_isSavingHoldings, setIsSavingHoldings] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isInitialLoadRef = useRef(true);
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

  // Edit transaction form state
  const [editTransactionPrice, setEditTransactionPrice] = useState('');
  const [editTransactionQuantity, setEditTransactionQuantity] = useState('');
  const [editTransactionDate, setEditTransactionDate] = useState('');
  const [editTransactionType, setEditTransactionType] = useState<'buy' | 'sell'>('buy');

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
        return {
          ...p, ...(updates.type === 'buy' ? {
            purchaseDate: updates.date || p.purchaseDate,
            purchasePrice: updates.price !== undefined ? updates.price : p.purchasePrice,
            quantity: updates.quantity !== undefined ? updates.quantity : p.quantity
          } : {})
        };
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
    <PageShell
      title="Stock Investments"
      subtitle="Track holdings, monitor performance, and review transactions in one clean dashboard."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <CurrencySelector selectedCurrency={selectedCurrency} onCurrencyChange={setSelectedCurrency} />
          <button
            onClick={() => refreshAllPrices()}
            disabled={isRefreshingAllPrices}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-primary text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isRefreshingAllPrices ? 'Refreshing prices...' : 'Refresh prices'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <StockPortfolioSummaryCards
          portfolioTotals={portfolioTotals}
          selectedCurrency={selectedCurrency}
        />

        <StockAddForm
          showAddForm={showAddForm}
          onToggleShowForm={() => {
            setShowAddForm(!showAddForm);
            if (showAddForm) {
              setAddingTransactionToHoldingId(null);
              setNewTransactionType('buy');
            }
          }}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          addingTransactionToHoldingId={addingTransactionToHoldingId}
          newTransactionType={newTransactionType}
          setNewTransactionType={setNewTransactionType}
          newStockSymbol={newStockSymbol}
          setNewStockSymbol={setNewStockSymbol}
          newStockIsSME={newStockIsSME}
          setNewStockIsSME={setNewStockIsSME}
          newStockCurrentPrice={newStockCurrentPrice}
          setNewStockCurrentPrice={setNewStockCurrentPrice}
          manualPriceEntry={manualPriceEntry}
          setManualPriceEntry={setManualPriceEntry}
          onFetchPrice={() => {
            if (!newStockSymbol.trim()) {
              warning('Please enter stock symbol first');
              return;
            }
            fetchPrice(newStockSymbol.trim(), newStockIsSME);
          }}
          isFetchingPrice={isFetchingPrice}
          selectedCurrency={selectedCurrency}
          newTransactionPrice={newTransactionPrice}
          setNewTransactionPrice={setNewTransactionPrice}
          newTransactionQuantity={newTransactionQuantity}
          setNewTransactionQuantity={setNewTransactionQuantity}
          newTransactionDate={newTransactionDate}
          setNewTransactionDate={setNewTransactionDate}
          onAddTransaction={handleAddTransaction}
        />

        <StockHoldingsTable
          sortedHoldings={sortedHoldings}
          stocksSortColumn={stocksSortColumn}
          stocksSortDirection={stocksSortDirection}
          onSort={handleSort}
        />

        <StockTransactionsTable
          isTransactionsExpanded={isTransactionsExpanded}
          onToggleExpanded={() => setIsTransactionsExpanded(!isTransactionsExpanded)}
          filteredTransactions={filteredTransactions}
          transactionSearchQuery={transactionSearchQuery}
          setTransactionSearchQuery={setTransactionSearchQuery}
          editingTransactionId={editingTransactionId}
          setEditingTransactionId={setEditingTransactionId}
          editTransactionPrice={editTransactionPrice}
          setEditTransactionPrice={setEditTransactionPrice}
          editTransactionQuantity={editTransactionQuantity}
          setEditTransactionQuantity={setEditTransactionQuantity}
          editTransactionDate={editTransactionDate}
          setEditTransactionDate={setEditTransactionDate}
          editTransactionType={editTransactionType}
          setEditTransactionType={setEditTransactionType}
          onStartEditTransaction={handleStartEditTransaction}
          onUpdateTransaction={handleUpdateTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          onInvalidEdit={() => warning('Please enter valid price and quantity')}
        />
      </div>
    </PageShell>
  );
};

export default StockInvestments;
