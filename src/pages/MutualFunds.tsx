import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, ArrowLeft, Plus, Edit2, Trash2, X, Check, Search, Loader2, AlertCircle, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import type { MutualFundHolding, MutualFundPurchase, MutualFundHoldingSummary } from '../types/mutualFund';
import type { Currency } from '../types/mortgage';
import { formatCurrency, setGlobalCurrency } from '../utils/formatting';
import { CURRENCY_DATA } from '../utils/currency';
import { CARD_STYLE, CARD_SHADOW, INPUT_STYLE } from '../constants/styles';
import { HelpTooltip } from '../components/HelpTooltip';
import { DatePicker } from '../components/DatePicker';
import CurrencySelector from '../components/CurrencySelector';
import { searchMutualFunds, getLatestNAV, getNAVForDate } from '../utils/mfapi';
import { useAuth } from '../contexts/AuthContext';
import { 
  saveMutualFundHoldings, 
  loadMutualFundHoldings, 
  subscribeToMutualFundHoldings 
} from '../services/mutualFundService';

const MutualFunds: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('INR'); // Default to INR for Indian mutual funds
  const [holdings, setHoldings] = useState<MutualFundHolding[]>([]);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  
  // Firestore sync state
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isInitialLoadRef = useRef(true);
  
  // Form state for adding new mutual fund
  const [newSchemeCode, setNewSchemeCode] = useState('');
  const [newSchemeName, setNewSchemeName] = useState('');
  const [newInvestmentAmount, setNewInvestmentAmount] = useState('');
  const [newPurchaseDate, setNewPurchaseDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [useManualNAV, setUseManualNAV] = useState(false);
  const [manualNAV, setManualNAV] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingPurchaseToHoldingId, setAddingPurchaseToHoldingId] = useState<string | null>(null);
  // Inline form state for adding purchase to existing holding
  const [inlineAddPurchaseHoldingId, setInlineAddPurchaseHoldingId] = useState<string | null>(null);
  const [inlineInvestmentAmount, setInlineInvestmentAmount] = useState('');
  const [inlinePurchaseDate, setInlinePurchaseDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [inlineUseManualNAV, setInlineUseManualNAV] = useState(false);
  const [inlineManualNAV, setInlineManualNAV] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingNAV, setIsLoadingNAV] = useState(false);
  const [isRefreshingNAVs, setIsRefreshingNAVs] = useState(false);
  const [refreshingHoldingIds, setRefreshingHoldingIds] = useState<Set<string>>(new Set());
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const navRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRefreshedOnLoadRef = useRef(false);

  // Update global currency when selected currency changes
  useEffect(() => {
    setGlobalCurrency(selectedCurrency);
  }, [selectedCurrency]);

  // Load portfolio from Firestore on mount
  useEffect(() => {
    if (!currentUser) {
      setIsLoadingPortfolio(false);
      return;
    }

    const loadPortfolio = async () => {
      try {
        setIsLoadingPortfolio(true);
        const loadedHoldings = await loadMutualFundHoldings(currentUser.uid);
        setHoldings(loadedHoldings);
        setIsSynced(true);
        return loadedHoldings;
      } catch (error) {
        console.error('Error loading portfolio:', error);
        setSaveError('Failed to load portfolio. Changes will be saved locally.');
        return [];
      } finally {
        setIsLoadingPortfolio(false);
      }
    };

    loadPortfolio().then(() => {
      // After initial load, enable real-time updates
      isInitialLoadRef.current = false;
      // Reset refresh flag when user changes (new login)
      hasRefreshedOnLoadRef.current = false;
    });

    // Subscribe to real-time updates
    const unsubscribe = subscribeToMutualFundHoldings(currentUser.uid, (updatedHoldings) => {
      // Only update if this is not the initial load (to avoid overwriting local changes)
      // Also check if holdings have actually changed to avoid unnecessary updates
      if (!isInitialLoadRef.current) {
        setHoldings(updatedHoldings);
        setIsSynced(true);
      }
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [currentUser]);

  // Save holdings to Firestore whenever they change (debounced)
  useEffect(() => {
    if (!currentUser || isLoadingPortfolio || isInitialLoadRef.current) {
      return;
    }

    const saveTimer = setTimeout(async () => {
      try {
        setIsSaving(true);
        setSaveError(null);
        
        // Validate user is authenticated
        if (!currentUser || !currentUser.uid) {
          throw new Error('User not authenticated');
        }

        // Only save if we have holdings or if holdings array is empty (to clear portfolio)
        await saveMutualFundHoldings(currentUser.uid, holdings);
        setIsSynced(true);
        setSaveError(null); // Clear any previous errors
      } catch (error: any) {
        console.error('Error saving portfolio:', error);
        // Use the error message from the service, which provides more details
        const errorMessage = error?.message || 'Failed to save portfolio. Please try again.';
        setSaveError(errorMessage);
        setIsSynced(false);
      } finally {
        setIsSaving(false);
      }
    }, 1000); // Debounce saves by 1 second

    return () => clearTimeout(saveTimer);
  }, [holdings, currentUser, isLoadingPortfolio]);

  // Calculate average cost basis and summary for each holding
  const holdingsSummary = useMemo<MutualFundHoldingSummary[]>(() => {
    return holdings.map(holding => {
      const totalUnits = holding.purchases.reduce((sum, p) => sum + p.quantity, 0);
      const totalInvested = holding.purchases.reduce((sum, p) => sum + p.investmentAmount, 0);
      const averagePurchasePrice = totalUnits > 0 ? totalInvested / totalUnits : 0;
      const currentValue = holding.currentNAV * totalUnits;
      const gainLoss = currentValue - totalInvested;
      const gainLossPercent = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

      return {
        holding,
        totalUnits,
        averagePurchasePrice,
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

  // Search for mutual funds
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchMutualFunds(searchQuery);
      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Error searching mutual funds:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Handle selecting a fund from search results
  const handleSelectFund = useCallback(async (schemeCode: string, schemeName: string) => {
    setIsLoadingNAV(true);
    try {
      const navData = await getLatestNAV(schemeCode);
      if (navData) {
        setNewSchemeCode(schemeCode);
        setNewSchemeName(schemeName);
        setSearchResults([]);
        setSearchQuery('');
      } else {
        alert('Could not fetch NAV for this fund. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching NAV:', error);
      alert('Error fetching fund details. Please try again.');
    } finally {
      setIsLoadingNAV(false);
    }
  }, [holdings, newSchemeCode, newSchemeName, newInvestmentAmount, newPurchaseDate, useManualNAV, manualNAV]);

  // Add new mutual fund or purchase to existing fund
  const handleAddFund = useCallback(async () => {
    const schemeCode = newSchemeCode.trim();
    const schemeName = newSchemeName.trim();
    const investmentAmount = parseFloat(newInvestmentAmount.replace(/[^0-9.]/g, ''));

    if (!schemeCode || !schemeName || isNaN(investmentAmount) || investmentAmount <= 0) {
      alert('Please fill in all fields with valid numbers');
      return;
    }

    // If manual NAV is enabled, validate it
    if (useManualNAV) {
      const manualNavValue = parseFloat(manualNAV.replace(/[^0-9.]/g, ''));
      if (isNaN(manualNavValue) || manualNavValue <= 0) {
        alert('Please enter a valid NAV value');
        return;
      }
    }

    setIsLoadingNAV(true);
    try {
      let purchaseNAV: number;
      let currentNAV: number;

      if (useManualNAV) {
        // Use manually entered NAV
        purchaseNAV = parseFloat(manualNAV.replace(/[^0-9.]/g, ''));
        
        // Still fetch current NAV for display (optional - can use manual NAV if fetch fails)
        const currentNavData = await getLatestNAV(schemeCode);
        currentNAV = currentNavData?.nav || purchaseNAV; // Fallback to purchase NAV if fetch fails
      } else {
        // Fetch NAV for the purchase date (historical NAV)
        const purchaseNavData = await getNAVForDate(schemeCode, newPurchaseDate);
        if (!purchaseNavData) {
          alert(`Could not fetch NAV for ${newPurchaseDate}. Please check the scheme code and date.`);
          setIsLoadingNAV(false);
          return;
        }

        // Fetch current/latest NAV for display
        const currentNavData = await getLatestNAV(schemeCode);
        if (!currentNavData) {
          alert('Could not fetch current NAV. Please try again.');
          setIsLoadingNAV(false);
          return;
        }

        purchaseNAV = purchaseNavData.nav;
        currentNAV = currentNavData.nav;
      }

      const units = investmentAmount / purchaseNAV; // Calculate units based on purchase date NAV

      // Check if fund already exists
      const existingHoldingIndex = holdings.findIndex(h => h.schemeCode === schemeCode);
      
      if (existingHoldingIndex >= 0) {
        // Add purchase to existing fund
        const newPurchase: MutualFundPurchase = {
          id: `purchase-${Date.now()}-${Math.random()}`,
          purchaseDate: newPurchaseDate,
          purchasePrice: purchaseNAV, // Store the NAV from purchase date
          quantity: units,
          investmentAmount
        };

        const updatedHoldings = [...holdings];
        updatedHoldings[existingHoldingIndex] = {
          ...updatedHoldings[existingHoldingIndex],
          currentNAV, // Update to latest NAV
          purchases: [...updatedHoldings[existingHoldingIndex].purchases, newPurchase]
        };
        setHoldings(updatedHoldings);
      } else {
        // Create new fund holding
        const newHolding: MutualFundHolding = {
          id: `holding-${Date.now()}-${Math.random()}`,
          schemeCode,
          schemeName,
          category: 'flexi-cap', // Default category (not used for filtering anymore)
          currentNAV, // Latest NAV for current value calculation
          purchases: [{
            id: `purchase-${Date.now()}-${Math.random()}`,
            purchaseDate: newPurchaseDate,
            purchasePrice: purchaseNAV, // NAV from purchase date
            quantity: units,
            investmentAmount
          }]
        };
        setHoldings([...holdings, newHolding]);
      }

      // Reset form
      setNewSchemeCode('');
      setNewSchemeName('');
      setNewInvestmentAmount('');
      setUseManualNAV(false);
      setManualNAV('');
      setAddingPurchaseToHoldingId(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding fund:', error);
      alert('Error adding fund. Please try again.');
    } finally {
      setIsLoadingNAV(false);
    }
  }, [holdings, newSchemeCode, newSchemeName, newInvestmentAmount, newPurchaseDate]);

  // Delete a fund holding
  const handleDeleteHolding = useCallback((holdingId: string) => {
    if (window.confirm('Are you sure you want to delete this mutual fund holding?')) {
      setHoldings(holdings.filter(h => h.id !== holdingId));
    }
  }, [holdings]);

  // Add purchase inline to existing holding
  const handleAddPurchaseInline = useCallback(async (holdingId: string) => {
    const holding = holdings.find(h => h.id === holdingId);
    if (!holding) return;

    const investmentAmount = parseFloat(inlineInvestmentAmount.replace(/[^0-9.]/g, ''));

    if (isNaN(investmentAmount) || investmentAmount <= 0) {
      alert('Please enter a valid investment amount');
      return;
    }

    // If manual NAV is enabled, validate it
    if (inlineUseManualNAV) {
      const manualNavValue = parseFloat(inlineManualNAV.replace(/[^0-9.]/g, ''));
      if (isNaN(manualNavValue) || manualNavValue <= 0) {
        alert('Please enter a valid NAV value');
        return;
      }
    }

    setIsLoadingNAV(true);
    try {
      let purchaseNAV: number;
      let currentNAV: number;

      if (inlineUseManualNAV) {
        // Use manually entered NAV
        purchaseNAV = parseFloat(inlineManualNAV.replace(/[^0-9.]/g, ''));
        
        // Still fetch current NAV for display
        const currentNavData = await getLatestNAV(holding.schemeCode);
        currentNAV = currentNavData?.nav || purchaseNAV;
      } else {
        // Fetch NAV for the purchase date (historical NAV)
        const purchaseNavData = await getNAVForDate(holding.schemeCode, inlinePurchaseDate);
        if (!purchaseNavData) {
          alert(`Could not fetch NAV for ${inlinePurchaseDate}. Please check the date or use manual NAV entry.`);
          setIsLoadingNAV(false);
          return;
        }

        // Fetch current/latest NAV for display
        const currentNavData = await getLatestNAV(holding.schemeCode);
        if (!currentNavData) {
          alert('Could not fetch current NAV. Please try again.');
          setIsLoadingNAV(false);
          return;
        }

        purchaseNAV = purchaseNavData.nav;
        currentNAV = currentNavData.nav;
      }

      const units = investmentAmount / purchaseNAV;

      const newPurchase: MutualFundPurchase = {
        id: `purchase-${Date.now()}-${Math.random()}`,
        purchaseDate: inlinePurchaseDate,
        purchasePrice: purchaseNAV,
        quantity: units,
        investmentAmount
      };

      setHoldings(holdings.map(h => 
        h.id === holdingId 
          ? { ...h, currentNAV, purchases: [...h.purchases, newPurchase] }
          : h
      ));

      // Reset inline form
      setInlineAddPurchaseHoldingId(null);
      setInlineInvestmentAmount('');
      setInlinePurchaseDate(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      });
      setInlineUseManualNAV(false);
      setInlineManualNAV('');
    } catch (error) {
      console.error('Error adding purchase:', error);
      alert('Error adding purchase. Please try again.');
    } finally {
      setIsLoadingNAV(false);
    }
  }, [holdings, inlineInvestmentAmount, inlinePurchaseDate, inlineUseManualNAV, inlineManualNAV]);

  // Delete a purchase from a fund
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

  // Update holding current NAV (single holding)
  const handleUpdateCurrentNAV = useCallback(async (holdingId: string) => {
    const holding = holdings.find(h => h.id === holdingId);
    if (!holding) return;

    setRefreshingHoldingIds(prev => new Set(prev).add(holdingId));
    try {
      const navData = await getLatestNAV(holding.schemeCode);
      if (navData) {
        setHoldings(prevHoldings => prevHoldings.map(h => 
          h.id === holdingId ? { ...h, currentNAV: navData.nav } : h
        ));
      }
    } catch (error) {
      console.error('Error updating NAV:', error);
      // Don't show alert for automatic refreshes, only for manual updates
    } finally {
      setRefreshingHoldingIds(prev => {
        const next = new Set(prev);
        next.delete(holdingId);
        return next;
      });
    }
  }, [holdings]);

  // Refresh all NAVs for all holdings
  const refreshAllNAVs = useCallback(async (showLoading = true) => {
    if (holdings.length === 0) return;

    if (showLoading) {
      setIsRefreshingNAVs(true);
    }

    try {
      // Refresh NAVs for all holdings in parallel (with delay to avoid rate limits)
      const refreshPromises = holdings.map(async (holding, index) => {
        // Add small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, index * 200));
        
        try {
          const navData = await getLatestNAV(holding.schemeCode);
          if (navData) {
            return { holdingId: holding.id, nav: navData.nav };
          }
        } catch (error) {
          console.error(`Error refreshing NAV for ${holding.schemeName}:`, error);
          return null;
        }
        return null;
      });

      const results = await Promise.all(refreshPromises);
      
      // Update holdings with new NAVs
      setHoldings(prevHoldings => prevHoldings.map(holding => {
        const result = results.find(r => r?.holdingId === holding.id);
        if (result) {
          return { ...holding, currentNAV: result.nav };
        }
        return holding;
      }));

      setLastRefreshTime(new Date());
      console.log('All NAVs refreshed successfully');
    } catch (error) {
      console.error('Error refreshing NAVs:', error);
    } finally {
      if (showLoading) {
        setIsRefreshingNAVs(false);
      }
    }
  }, [holdings]);

  // Refresh NAVs when portfolio finishes loading and has holdings (one-time on load)
  useEffect(() => {
    if (!isLoadingPortfolio && holdings.length > 0 && currentUser && !hasRefreshedOnLoadRef.current) {
      hasRefreshedOnLoadRef.current = true;
      // Refresh NAVs after portfolio loads (with a delay to avoid blocking UI)
      const timeoutId = setTimeout(() => {
        refreshAllNAVs(false); // Don't show loading spinner for initial refresh
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoadingPortfolio, holdings.length, currentUser, refreshAllNAVs]);

  // Set up periodic NAV refresh (every 5 minutes)
  useEffect(() => {
    if (!currentUser || holdings.length === 0) {
      return;
    }

    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Refresh NAVs every 5 minutes (300000 ms)
    refreshIntervalRef.current = setInterval(() => {
      refreshAllNAVs(true);
    }, 5 * 60 * 1000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [currentUser, holdings.length, refreshAllNAVs]);

  // Refresh NAVs when page becomes visible (user comes back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentUser && holdings.length > 0) {
        // Check if last refresh was more than 1 minute ago
        const now = new Date();
        if (!lastRefreshTime || (now.getTime() - lastRefreshTime.getTime()) > 60000) {
          refreshAllNAVs(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUser, holdings.length, lastRefreshTime, refreshAllNAVs]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (navRefreshTimeoutRef.current) {
        clearTimeout(navRefreshTimeoutRef.current);
      }
    };
  }, []);

  // Update purchase details
  const handleUpdatePurchase = useCallback((
    holdingId: string, 
    purchaseId: string, 
    updates: Partial<MutualFundPurchase>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-violet-50/20">
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
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                <PieChart className="w-6 h-6 text-white" />
              </div>
              Mutual Funds
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
        {/* Loading State */}
        {isLoadingPortfolio && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
            <p className="text-slate-600">Loading your portfolio...</p>
          </div>
        )}

        {/* Sync Status Indicator */}
        {!isLoadingPortfolio && currentUser && (
          <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-slate-600">Saving...</span>
                  </>
                ) : isSynced ? (
                  <>
                    <Cloud className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Synced</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-4 h-4 text-yellow-600" />
                    <span className="text-yellow-600">Not synced</span>
                  </>
                )}
              </div>
              
              {/* NAV Refresh Status */}
              {holdings.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  {isRefreshingNAVs ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      <span className="text-slate-600">Updating NAVs...</span>
                    </>
                  ) : lastRefreshTime ? (
                    <>
                      <RefreshCw className="w-4 h-4 text-purple-600" />
                      <span className="text-slate-600">
                        NAVs updated {lastRefreshTime.toLocaleTimeString()}
                      </span>
                    </>
                  ) : null}
                  <button
                    onClick={() => refreshAllNAVs(true)}
                    disabled={isRefreshingNAVs}
                    className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                    title="Refresh all NAVs"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshingNAVs ? 'animate-spin' : ''}`} />
                    Refresh NAVs
                  </button>
                </div>
              )}
            </div>
            {saveError && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold mb-1">Error Saving Portfolio</p>
                  <p className="text-xs">{saveError}</p>
                  {saveError.includes('security rules') && (
                    <p className="text-xs mt-2 text-red-700">
                      Please update your Firestore security rules to allow writes to the mutualFunds collection. 
                      See FIREBASE_QUICK_START.md for instructions.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Portfolio Summary Cards */}
        {!isLoadingPortfolio && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-6">
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
                    {formatCurrency(portfolioTotals.totalGainLoss)} ({portfolioTotals.totalGainLoss >= 0 ? '+' : ''}{portfolioTotals.totalGainLossPercent.toFixed(2)}%)
                  </p>
                </div>
              </div>
            </div>

        {/* Add Fund Form */}
        <div className={CARD_STYLE} style={CARD_SHADOW}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {showAddForm ? 'Add Mutual Fund to Portfolio' : 'Portfolio Tracker'}
              </h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                {showAddForm ? (
                  <>
                    <X className="w-4 h-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Fund
                  </>
                )}
              </button>
            </div>

            {showAddForm && (
              <div className="bg-slate-50 rounded-lg p-4 border-2 border-purple-200">
                {addingPurchaseToHoldingId ? (
                  <div className="mb-4 p-3 bg-purple-100 rounded-lg border border-purple-300">
                    <p className="text-sm font-semibold text-purple-800">
                      Adding another purchase to: <span className="font-bold">{newSchemeName}</span>
                    </p>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Search Mutual Funds
                      <HelpTooltip content="Search for mutual funds by name. Results are fetched from MFapi.in (India's free mutual fund API)." />
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="e.g., HDFC Large Cap Fund"
                        className={`${INPUT_STYLE} flex-1`}
                      />
                      <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Search
                      </button>
                    </div>
                    
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="mt-2 bg-white border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                        {searchResults.map((result, index) => (
                          <button
                            key={index}
                            onClick={() => handleSelectFund(result.schemeCode, result.schemeName)}
                            className="w-full text-left px-4 py-2 hover:bg-purple-50 border-b border-slate-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-semibold text-slate-800">{result.schemeName}</div>
                            <div className="text-xs text-slate-500">Code: {result.schemeCode}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Scheme Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newSchemeCode}
                      onChange={(e) => setNewSchemeCode(e.target.value)}
                      placeholder="e.g., 101206"
                      disabled={!!addingPurchaseToHoldingId}
                      className={`${INPUT_STYLE} ${addingPurchaseToHoldingId ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Scheme Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newSchemeName}
                      onChange={(e) => setNewSchemeName(e.target.value)}
                      placeholder="e.g., HDFC Large Cap Fund"
                      disabled={!!addingPurchaseToHoldingId}
                      className={`${INPUT_STYLE} ${addingPurchaseToHoldingId ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Investment Amount <span className="text-red-500">*</span>
                      <HelpTooltip content="Total amount invested. Units will be calculated based on current NAV." />
                    </label>
                    <input
                      type="text"
                      value={newInvestmentAmount}
                      onChange={(e) => setNewInvestmentAmount(e.target.value)}
                      placeholder={`${CURRENCY_DATA[selectedCurrency].symbol}0.00`}
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
                
                {/* Manual NAV Entry Option */}
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useManualNAV}
                      onChange={(e) => {
                        setUseManualNAV(e.target.checked);
                        if (!e.target.checked) {
                          setManualNAV(''); // Clear manual NAV when unchecked
                        }
                      }}
                      className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <span className="text-sm font-semibold text-slate-700">
                      Enter NAV manually (allotment price or custom NAV)
                    </span>
                  </label>
                  
                  {useManualNAV && (
                    <div className="mt-3">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        NAV at Purchase Date <span className="text-red-500">*</span>
                        <HelpTooltip content="Enter the NAV (Net Asset Value) at the time of purchase. This is typically the allotment price for new investments." />
                      </label>
                      <input
                        type="text"
                        value={manualNAV}
                        onChange={(e) => setManualNAV(e.target.value)}
                        placeholder="e.g., 45.25"
                        className={INPUT_STYLE}
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Units will be calculated as: Investment Amount ÷ NAV
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleAddFund}
                  disabled={isLoadingNAV}
                  className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoadingNAV ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Fetching NAV...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      {addingPurchaseToHoldingId ? 'Add Purchase' : 'Add to Portfolio'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Holdings List */}
        {holdings.length === 0 ? (
          <div className={CARD_STYLE} style={CARD_SHADOW}>
            <div className="p-12 text-center">
              <PieChart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-600 mb-2">No Mutual Funds in Portfolio</h3>
              <p className="text-slate-500 mb-4">Add your first mutual fund to start tracking your investments</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Your First Fund
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {holdingsSummary.map((summary) => {
              const { holding } = summary;

              return (
                <div key={holding.id} className={CARD_STYLE} style={CARD_SHADOW}>
                  <div className="p-6">
                    {/* Fund Header */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                          <PieChart className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-800">{holding.schemeName}</h3>
                          <p className="text-sm text-slate-600">
                            {summary.totalUnits.toFixed(4)} units • 
                            Avg NAV: {formatCurrency(summary.averagePurchasePrice)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm text-slate-600">Current NAV</p>
                          <p className="text-lg font-bold text-slate-800">{formatCurrency(holding.currentNAV)}</p>
                        </div>
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

                    {/* Fund Summary */}
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
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          Purchases ({holding.purchases.length})
                          <HelpTooltip content="Multiple purchases (SIP) of the same fund are automatically combined to calculate your average NAV and total units." />
                        </h4>
                        <button
                          onClick={() => {
                            if (inlineAddPurchaseHoldingId === holding.id) {
                              // Close if already open
                              setInlineAddPurchaseHoldingId(null);
                              setInlineInvestmentAmount('');
                              setInlineUseManualNAV(false);
                              setInlineManualNAV('');
                            } else {
                              // Open inline form
                              setInlineAddPurchaseHoldingId(holding.id);
                              setInlineInvestmentAmount('');
                              setInlinePurchaseDate(() => {
                                const now = new Date();
                                return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                              });
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
                        
                        {/* Inline Add Purchase Form */}
                        {inlineAddPurchaseHoldingId === holding.id && (
                          <div className="bg-purple-50 rounded-lg p-3 border-2 border-purple-300 mt-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                              <div>
                                <label className="text-xs text-slate-700 font-semibold mb-1 block">
                                  Investment Amount <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={inlineInvestmentAmount}
                                  onChange={(e) => setInlineInvestmentAmount(e.target.value)}
                                  placeholder={`${CURRENCY_DATA[selectedCurrency].symbol}0.00`}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-700 font-semibold mb-1 block">
                                  Purchase Date <span className="text-red-500">*</span>
                                </label>
                                <DatePicker
                                  value={inlinePurchaseDate}
                                  onChange={setInlinePurchaseDate}
                                />
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
                                        if (!e.target.checked) {
                                          setInlineManualNAV('');
                                        }
                                      }}
                                      className="w-3 h-3 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                                    />
                                    <span className="text-xs text-slate-600">Enter manually</span>
                                  </label>
                                  {inlineUseManualNAV ? (
                                    <input
                                      type="text"
                                      value={inlineManualNAV}
                                      onChange={(e) => setInlineManualNAV(e.target.value)}
                                      placeholder="e.g., 45.25"
                                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                  ) : (
                                    <div className="px-2 py-1.5 bg-slate-100 rounded text-xs text-slate-500">
                                      Will fetch from API
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2">
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
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </>
        )}
      </main>
    </div>
  );
};

export default MutualFunds;
