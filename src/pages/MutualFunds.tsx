import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, ArrowLeft, Plus, Edit2, Trash2, X, Check, Search, Loader2, AlertCircle, Cloud, CloudOff, RefreshCw, ChevronDown, TrendingUp, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { MutualFundHolding, MutualFundPurchase, MutualFundHoldingSummary } from '../types/mutualFund';
import type { Currency } from '../types/mortgage';
import { formatCurrency, formatDate, setGlobalCurrency } from '../utils/formatting';
import { CURRENCY_DATA } from '../utils/currency';
import { CARD_STYLE, CARD_SHADOW, INPUT_STYLE } from '../constants/styles';
import { HelpTooltip } from '../components/HelpTooltip';
import { DatePicker } from '../components/DatePicker';
import CurrencySelector from '../components/CurrencySelector';
import LoginModal from '../components/LoginModal';
import { searchMutualFunds, getLatestNAV, getNAVForDate, getHistoricalNAV } from '../utils/mfapi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { 
  saveMutualFundHoldings, 
  loadMutualFundHoldings, 
  subscribeToMutualFundHoldings 
} from '../services/mutualFundService';

const MutualFunds: React.FC = () => {
  const { currentUser } = useAuth();
  const { error: showError, warning } = useToast();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('INR'); // Default to INR for Indian mutual funds
  const [holdings, setHoldings] = useState<MutualFundHolding[]>([]);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [expandedPurchases, setExpandedPurchases] = useState<Set<string>>(new Set());
  
  // SIP Calculator state
  const [sipType, setSipType] = useState<'sip' | 'lumpsum'>('sip');
  const [sipAmount, setSipAmount] = useState('10000');
  const [sipYears, setSipYears] = useState('10');
  const [sipReturns, setSipReturns] = useState('12');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [sipCalculatorExpanded, setSipCalculatorExpanded] = useState(false);
  const [historicalDataForScheme, setHistoricalDataForScheme] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);
  const [showHistoricalPerformance, setShowHistoricalPerformance] = useState(false);
  const [showSipWarningModal, setShowSipWarningModal] = useState(false);
  const [historicalPerformanceData, setHistoricalPerformanceData] = useState<{
    investmentAmount: number;
    purchaseDate: string;
    purchaseNAV: number;
    currentNAV: number;
    units: number;
    currentValue: number;
    gainLoss: number;
    gainLossPercent: number;
    cagr: number;
  } | null>(null);
  const [historicalStartDate, setHistoricalStartDate] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 5); // Default to 5 years ago
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
  
  // Firestore sync state
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isInitialLoadRef = useRef(true);
  const historicalPerformanceRef = useRef<HTMLDivElement | null>(null);
  
  // Form state for adding new mutual fund
  const [newSchemeCode, setNewSchemeCode] = useState('');
  const [newSchemeName, setNewSchemeName] = useState('');
  const [newInvestmentAmount, setNewInvestmentAmount] = useState('');
  const [newInvestmentType, setNewInvestmentType] = useState<'onetime' | 'sip'>('onetime');
  const [newPurchaseDate, setNewPurchaseDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [newSipEndDate, setNewSipEndDate] = useState(() => {
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
  const lastLocalChangeRef = useRef<number>(0); // Track when local changes were made

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
      // Also prevent overwriting if there were recent local changes (within last 12 seconds)
      // This gives time for local changes to be saved to Firestore
      if (!isInitialLoadRef.current) {
        const timeSinceLastChange = Date.now() - lastLocalChangeRef.current;
        // Only accept Firestore updates if no recent local changes (12 seconds buffer)
        if (timeSinceLastChange > 12000) {
          setHoldings(updatedHoldings);
          setIsSynced(true);
        }
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
    }, 10000); // Debounce saves by 10 seconds to reduce sync frequency

    return () => clearTimeout(saveTimer);
  }, [holdings, currentUser, isLoadingPortfolio]);

  // Calculate CAGR for a holding
  const calculateCAGR = useCallback((purchases: MutualFundPurchase[], currentValue: number, currentDate: Date = new Date()): number => {
    if (purchases.length === 0 || currentValue <= 0) return 0;
    
    // Find the earliest purchase date
    const earliestPurchase = purchases.reduce((earliest, purchase) => {
      const purchaseDate = new Date(purchase.purchaseDate);
      return purchaseDate < earliest ? purchaseDate : earliest;
    }, new Date(purchases[0].purchaseDate));
    
    const totalInvested = purchases.reduce((sum, p) => sum + p.investmentAmount, 0);
    if (totalInvested <= 0) return 0;
    
    const years = (currentDate.getTime() - earliestPurchase.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (years <= 0) return 0;
    
    return (Math.pow(currentValue / totalInvested, 1 / years) - 1) * 100;
  }, []);

  // Calculate XIRR using Newton-Raphson method
  const calculateXIRR = useCallback((purchases: MutualFundPurchase[], currentValue: number, currentDate: Date = new Date()): number => {
    if (purchases.length === 0 || currentValue <= 0) return 0;
    
    // Create cash flows: negative for investments, positive for current value
    const cashFlows: Array<{ date: Date; amount: number }> = purchases.map(p => ({
      date: new Date(p.purchaseDate),
      amount: -p.investmentAmount // Negative because it's an outflow
    }));
    
    // Add final cash flow (current value as positive)
    cashFlows.push({ date: currentDate, amount: currentValue });
    
    // Sort by date
    cashFlows.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Check if all dates are the same (edge case)
    const firstDate = cashFlows[0].date.getTime();
    const allSameDate = cashFlows.every(cf => cf.date.getTime() === firstDate);
    if (allSameDate) {
      // If all on same date, calculate simple return
      const totalInvested = purchases.reduce((sum, p) => sum + p.investmentAmount, 0);
      if (totalInvested <= 0) return 0;
      return ((currentValue / totalInvested - 1) * 100);
    }
    
    // Newton-Raphson method to find XIRR
    let rate = 0.1; // Initial guess (10%)
    const maxIterations = 100;
    const tolerance = 0.0001;
    
    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let npvDerivative = 0;
      
      const baseDate = cashFlows[0].date.getTime();
      
      cashFlows.forEach(cf => {
        const daysDiff = (cf.date.getTime() - baseDate) / (1000 * 60 * 60 * 24);
        const years = daysDiff / 365.25; // Use 365.25 for more accuracy
        
        if (Math.abs(years) < 0.0001) {
          npv += cf.amount;
        } else {
          const factor = Math.pow(1 + rate, years);
          npv += cf.amount / factor;
          npvDerivative -= (cf.amount * years) / (factor * (1 + rate));
        }
      });
      
      if (Math.abs(npv) < tolerance) {
        break;
      }
      
      if (Math.abs(npvDerivative) < tolerance) {
        break;
      }
      
      const newRate = rate - npv / npvDerivative;
      
      // Prevent negative rates or rates that are too high
      if (newRate < -0.99 || newRate > 10 || !isFinite(newRate)) {
        break;
      }
      
      rate = newRate;
    }
    
    // Clamp rate to reasonable bounds
    if (rate < -99 || rate > 1000 || !isFinite(rate)) {
      return 0;
    }
    
    return rate * 100; // Convert to percentage
  }, []);

  // Calculate average cost basis and summary for each holding
  const holdingsSummary = useMemo<MutualFundHoldingSummary[]>(() => {
    const today = new Date();
    return holdings.map(holding => {
      const totalUnits = holding.purchases.reduce((sum, p) => sum + p.quantity, 0);
      const totalInvested = holding.purchases.reduce((sum, p) => sum + p.investmentAmount, 0);
      const averagePurchasePrice = totalUnits > 0 ? totalInvested / totalUnits : 0;
      const currentValue = holding.currentNAV * totalUnits;
      const gainLoss = currentValue - totalInvested;
      const gainLossPercent = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;
      const cagr = calculateCAGR(holding.purchases, currentValue, today);
      const xirr = calculateXIRR(holding.purchases, currentValue, today);

      return {
        holding,
        totalUnits,
        averagePurchasePrice,
        totalInvested,
        currentValue,
        gainLoss,
        gainLossPercent,
        cagr,
        xirr
      };
    });
  }, [holdings, calculateCAGR, calculateXIRR]);

  // SIP/Lumpsum Calculator
  const sipCalculation = useMemo(() => {
    const amount = parseFloat(sipAmount) || 0;
    const years = parseFloat(sipYears) || 0;
    const returns = parseFloat(sipReturns) || 0;
    const monthlyRate = returns / 100 / 12;
    const months = years * 12;
    
    if (sipType === 'sip') {
      // SIP Calculation: FV = P × [(1 + r)^n - 1] / r × (1 + r)
      const futureValue = amount * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate * (1 + monthlyRate);
      const totalInvested = amount * months;
      const estimatedReturns = futureValue - totalInvested;
      
      return {
        totalInvested,
        estimatedReturns,
        futureValue
      };
    } else {
      // Lumpsum Calculation: FV = P × (1 + r)^n
      const futureValue = amount * Math.pow(1 + monthlyRate, months);
      const totalInvested = amount;
      const estimatedReturns = futureValue - totalInvested;
      
      return {
        totalInvested,
        estimatedReturns,
        futureValue
      };
    }
  }, [sipType, sipAmount, sipYears, sipReturns]);

  // Calculate portfolio totals
  const portfolioTotals = useMemo(() => {
    const totalInvested = holdingsSummary.reduce((sum, s) => sum + s.totalInvested, 0);
    const totalCurrentValue = holdingsSummary.reduce((sum, s) => sum + s.currentValue, 0);
    const totalGainLoss = totalCurrentValue - totalInvested;
    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    // Calculate portfolio-level CAGR
    const today = new Date();
    const allPurchases = holdings.flatMap(h => h.purchases);
    const portfolioCAGR = calculateCAGR(allPurchases, totalCurrentValue, today);
    
    // Calculate portfolio-level XIRR
    const portfolioXIRR = calculateXIRR(allPurchases, totalCurrentValue, today);

    return {
      totalInvested,
      totalCurrentValue,
      totalGainLoss,
      totalGainLossPercent,
      cagr: portfolioCAGR,
      xirr: portfolioXIRR
    };
  }, [holdingsSummary, holdings, calculateCAGR, calculateXIRR]);

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
        showError('Could not fetch NAV for this fund. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching NAV:', error);
      showError('Error fetching fund details. Please try again.');
    } finally {
      setIsLoadingNAV(false);
    }
  }, [holdings, newSchemeCode, newSchemeName, newInvestmentAmount, newPurchaseDate, useManualNAV, manualNAV]);

  // Add new mutual fund or purchase to existing fund
  const handleAddFund = useCallback(async () => {
    // Check if user is logged in
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }

    const schemeCode = newSchemeCode.trim();
    const schemeName = newSchemeName.trim();
    const investmentAmount = parseFloat(newInvestmentAmount.replace(/[^0-9.]/g, ''));

    if (!schemeCode || !schemeName || isNaN(investmentAmount) || investmentAmount <= 0) {
      warning('Please fill in all fields with valid numbers');
      return;
    }

    if (newInvestmentType === 'sip' && !newSipEndDate) {
      warning('Please select SIP end date');
      return;
    }

    // If manual NAV is enabled, validate it
    if (useManualNAV) {
      const manualNavValue = parseFloat(manualNAV.replace(/[^0-9.]/g, ''));
      if (isNaN(manualNavValue) || manualNavValue <= 0) {
        warning('Please enter a valid NAV value');
        return;
      }
    }

    setIsLoadingNAV(true);
    try {
      // Fetch current/latest NAV for display
      const currentNavData = await getLatestNAV(schemeCode);
      if (!currentNavData) {
        showError('Could not fetch current NAV. Please try again.');
        setIsLoadingNAV(false);
        return;
      }
      const currentNAV = currentNavData.nav;

      // Check if fund already exists
      const existingHoldingIndex = holdings.findIndex(h => h.schemeCode === schemeCode);
      
      if (newInvestmentType === 'sip') {
        // SIP: Create multiple purchase records for each month
        const startDate = new Date(newPurchaseDate);
        const endDate = new Date(newSipEndDate);
        const today = new Date();
        const actualEndDate = endDate > today ? today : endDate;
        
        const purchases: MutualFundPurchase[] = [];
        const purchaseDate = new Date(startDate);
        purchaseDate.setDate(1); // Set to first of month
        
        while (purchaseDate <= actualEndDate) {
          const monthDate = new Date(purchaseDate);
          const monthDateStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-${String(monthDate.getDate()).padStart(2, '0')}`;
          const monthStr = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, '0')}`;
          
          let monthNAV: number;
          if (useManualNAV) {
            monthNAV = parseFloat(manualNAV.replace(/[^0-9.]/g, ''));
          } else {
            const monthNAVData = await getNAVForDate(schemeCode, monthStr);
            if (!monthNAVData) {
              // Skip this month if NAV not available
              purchaseDate.setMonth(purchaseDate.getMonth() + 1);
              continue;
            }
            monthNAV = monthNAVData.nav;
          }
          
          const monthUnits = investmentAmount / monthNAV;
          
          purchases.push({
            id: `purchase-${Date.now()}-${Math.random()}-${purchaseDate.getTime()}`,
            purchaseDate: monthDateStr,
            purchasePrice: monthNAV,
            quantity: monthUnits,
            investmentAmount
          });
          
          purchaseDate.setMonth(purchaseDate.getMonth() + 1);
        }
        
        if (purchases.length === 0) {
          showError('Could not create any purchase records. Please check dates and NAV availability.');
          setIsLoadingNAV(false);
          return;
        }
        
        if (existingHoldingIndex >= 0) {
          // Add purchases to existing fund
          const updatedHoldings = [...holdings];
          updatedHoldings[existingHoldingIndex] = {
            ...updatedHoldings[existingHoldingIndex],
            currentNAV,
            purchases: [...updatedHoldings[existingHoldingIndex].purchases, ...purchases]
          };
          lastLocalChangeRef.current = Date.now();
          setHoldings(updatedHoldings);
        } else {
          // Create new fund holding with SIP purchases
          const newHolding: MutualFundHolding = {
            id: `holding-${Date.now()}-${Math.random()}`,
            schemeCode,
            schemeName,
            category: 'flexi-cap',
            currentNAV,
            purchases
          };
          lastLocalChangeRef.current = Date.now();
          setHoldings([...holdings, newHolding]);
        }
      } else {
        // One-time investment
      let purchaseNAV: number;

      if (useManualNAV) {
        purchaseNAV = parseFloat(manualNAV.replace(/[^0-9.]/g, ''));
      } else {
        const purchaseNavData = await getNAVForDate(schemeCode, newPurchaseDate);
        if (!purchaseNavData) {
            showError(`Could not fetch NAV for ${newPurchaseDate}. Please check the scheme code and date.`);
          setIsLoadingNAV(false);
          return;
        }
        purchaseNAV = purchaseNavData.nav;
      }

        const units = investmentAmount / purchaseNAV;
        const newPurchase: MutualFundPurchase = {
          id: `purchase-${Date.now()}-${Math.random()}`,
          purchaseDate: newPurchaseDate,
          purchasePrice: purchaseNAV,
          quantity: units,
          investmentAmount
        };

        if (existingHoldingIndex >= 0) {
          // Add purchase to existing fund
        const updatedHoldings = [...holdings];
        updatedHoldings[existingHoldingIndex] = {
          ...updatedHoldings[existingHoldingIndex],
            currentNAV,
          purchases: [...updatedHoldings[existingHoldingIndex].purchases, newPurchase]
        };
          lastLocalChangeRef.current = Date.now();
        setHoldings(updatedHoldings);
      } else {
        // Create new fund holding
        const newHolding: MutualFundHolding = {
          id: `holding-${Date.now()}-${Math.random()}`,
          schemeCode,
          schemeName,
            category: 'flexi-cap',
            currentNAV,
            purchases: [newPurchase]
        };
          lastLocalChangeRef.current = Date.now();
        setHoldings([...holdings, newHolding]);
        }
      }

      // Reset form
      setNewSchemeCode('');
      setNewSchemeName('');
      setNewInvestmentAmount('');
      setNewInvestmentType('onetime');
      setUseManualNAV(false);
      setManualNAV('');
      setAddingPurchaseToHoldingId(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding fund:', error);
      showError('Error adding fund. Please try again.');
    } finally {
      setIsLoadingNAV(false);
    }
  }, [holdings, newSchemeCode, newSchemeName, newInvestmentAmount, newPurchaseDate, newInvestmentType, newSipEndDate, useManualNAV, manualNAV, currentUser, warning, showError]);

  // Delete a fund holding
  const handleDeleteHolding = useCallback((holdingId: string) => {
    if (window.confirm('Are you sure you want to delete this mutual fund holding?')) {
      lastLocalChangeRef.current = Date.now(); // Track local change
      setHoldings(holdings.filter(h => h.id !== holdingId));
    }
  }, [holdings]);

  // Add purchase inline to existing holding
  const handleAddPurchaseInline = useCallback(async (holdingId: string) => {
    const holding = holdings.find(h => h.id === holdingId);
    if (!holding) return;

    const investmentAmount = parseFloat(inlineInvestmentAmount.replace(/[^0-9.]/g, ''));

    if (isNaN(investmentAmount) || investmentAmount <= 0) {
      warning('Please enter a valid investment amount');
      return;
    }

    // If manual NAV is enabled, validate it
    if (inlineUseManualNAV) {
      const manualNavValue = parseFloat(inlineManualNAV.replace(/[^0-9.]/g, ''));
      if (isNaN(manualNavValue) || manualNavValue <= 0) {
        warning('Please enter a valid NAV value');
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
          showError(`Could not fetch NAV for ${inlinePurchaseDate}. Please check the date or use manual NAV entry.`);
          setIsLoadingNAV(false);
          return;
        }

        // Fetch current/latest NAV for display
        const currentNavData = await getLatestNAV(holding.schemeCode);
        if (!currentNavData) {
          showError('Could not fetch current NAV. Please try again.');
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

      lastLocalChangeRef.current = Date.now(); // Track local change
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
      showError('Error adding purchase. Please try again.');
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
      lastLocalChangeRef.current = Date.now(); // Track local change
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
        lastLocalChangeRef.current = Date.now(); // Track local change
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
      lastLocalChangeRef.current = Date.now(); // Track local change
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

  // Auto-scroll to historical performance results when data is ready
  useEffect(() => {
    if (showHistoricalPerformance && historicalPerformanceData && historicalPerformanceRef.current) {
      setTimeout(() => {
        historicalPerformanceRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100); // Small delay to ensure DOM is updated
    }
  }, [showHistoricalPerformance, historicalPerformanceData]);

  // Update purchase details
  const handleUpdatePurchase = useCallback((
    holdingId: string, 
    purchaseId: string, 
    updates: Partial<MutualFundPurchase>
  ) => {
    lastLocalChangeRef.current = Date.now(); // Track local change
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

  // Calculate historical performance based on entered amount and date (One-time only)
  const handleCalculateHistoricalPerformance = useCallback(async () => {
    // Check if SIP is selected - show warning modal
    if (newInvestmentType === 'sip') {
      setShowSipWarningModal(true);
      return;
    }

    const schemeCode = newSchemeCode.trim();
    const investmentAmount = parseFloat(newInvestmentAmount.replace(/[^0-9.]/g, ''));
    
    if (!schemeCode) {
      warning('Please select a fund first');
      return;
    }
    
    if (isNaN(investmentAmount) || investmentAmount <= 0) {
      warning('Please enter a valid investment amount');
      return;
    }
    
    if (!newPurchaseDate) {
      warning('Please select a purchase date');
      return;
    }

    setIsLoadingHistorical(true);
    setShowHistoricalPerformance(true);
    
    try {
      // One-time investment calculation only
      const purchaseDateStr = newPurchaseDate.split('-').slice(0, 2).join('-'); // YYYY-MM format
      const purchaseNAVData = await getNAVForDate(schemeCode, purchaseDateStr);
      
      // Get current NAV
      const currentNAVData = await getLatestNAV(schemeCode);
      
      if (!purchaseNAVData || !currentNAVData) {
        showError('Could not fetch NAV data. Please try again.');
        setShowHistoricalPerformance(false);
        return;
      }
      
      const purchaseNAV = purchaseNAVData.nav;
      const currentNAV = currentNAVData.nav;
      const units = investmentAmount / purchaseNAV;
      const currentValue = units * currentNAV;
      const gainLoss = currentValue - investmentAmount;
      const gainLossPercent = (gainLoss / investmentAmount) * 100;
      
      // Calculate CAGR
      const purchaseDate = new Date(newPurchaseDate);
      const today = new Date();
      const years = (today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      const cagr = years > 0 ? (Math.pow(currentValue / investmentAmount, 1 / years) - 1) * 100 : 0;
      
      setHistoricalPerformanceData({
        investmentAmount,
        purchaseDate: newPurchaseDate,
        purchaseNAV,
        currentNAV,
        units,
        currentValue,
        gainLoss,
        gainLossPercent,
        cagr
      });
    } catch (error) {
      console.error('Error calculating historical performance:', error);
      showError('Failed to calculate performance. Please try again.');
      setShowHistoricalPerformance(false);
    } finally {
      setIsLoadingHistorical(false);
    }
  }, [newSchemeCode, newInvestmentAmount, newPurchaseDate, newInvestmentType, warning, showError]);

  // Load historical data for a fund (for chart view)
  const handleLoadHistoricalData = useCallback(async (schemeCode: string) => {
    if (historicalDataForScheme === schemeCode) {
      // Close if already open
      setHistoricalDataForScheme(null);
      setHistoricalData([]);
      return;
    }

    setIsLoadingHistorical(true);
    setHistoricalDataForScheme(schemeCode);
    
    try {
      const response = await getHistoricalNAV(schemeCode);
      if (response && response.data && response.data.length > 0) {
        // Process historical data - filter by start date and format for chart
        const startDate = new Date(historicalStartDate);
        const processedData = response.data
          .filter((item: any) => {
            const itemDate = new Date(item.date);
            return itemDate >= startDate;
          })
          .map((item: any, index: number) => ({
            date: item.date,
            nav: parseFloat(item.nav),
            index: index
          }))
          .reverse(); // Show oldest to newest
        
        setHistoricalData(processedData);
      } else {
        showError('No historical data available for this fund');
        setHistoricalDataForScheme(null);
      }
    } catch (error) {
      console.error('Error loading historical data:', error);
      showError('Failed to load historical data. Please try again.');
      setHistoricalDataForScheme(null);
    } finally {
      setIsLoadingHistorical(false);
    }
  }, [historicalStartDate, historicalDataForScheme, showError]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-violet-50/20">
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />

      {/* SIP Warning Modal for Historical Performance */}
      {showSipWarningModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Historical Performance - One-Time Only
                </h3>
                <button
                  onClick={() => setShowSipWarningModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              
              <p className="text-slate-700 mb-6">
                Historical Performance calculation is only available for <strong>One-Time</strong> investments. 
                For SIP investments, please use the "Add to Portfolio" feature which will create purchase records for each month.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setNewInvestmentType('onetime');
                    setShowSipWarningModal(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Switch to One-Time
                </button>
                <button
                  onClick={() => setShowSipWarningModal(false)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        {/* SIP/Lumpsum Calculator */}
        <div className={CARD_STYLE} style={CARD_SHADOW}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Mutual Fund Calculator
              </h2>
              <button
                onClick={() => setSipCalculatorExpanded(!sipCalculatorExpanded)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
              >
                {sipCalculatorExpanded ? 'Hide' : 'Show'}
                <ChevronDown className={`w-4 h-4 transition-transform ${sipCalculatorExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            {sipCalculatorExpanded && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <div className="space-y-4">
                {/* SIP/Lumpsum Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSipType('sip')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                      sipType === 'sip'
                        ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    SIP (Monthly)
                  </button>
                  <button
                    onClick={() => setSipType('lumpsum')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                      sipType === 'lumpsum'
                        ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    One-Time (Lumpsum)
                  </button>
                </div>
                
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {sipType === 'sip' ? 'Monthly Investment Amount' : 'Investment Amount'}
                  </label>
                  <input
                    type="text"
                    value={sipAmount}
                    onChange={(e) => setSipAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder={CURRENCY_DATA[selectedCurrency].symbol + '10,000'}
                    className={INPUT_STYLE}
                  />
                </div>
                
                {/* Expected Returns Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Expected Annual Returns (%)
                  </label>
                  <input
                    type="text"
                    value={sipReturns}
                    onChange={(e) => setSipReturns(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="12%"
                    className={INPUT_STYLE}
                  />
                </div>
                
                {/* Time Period Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Time Period (Years)
                  </label>
                  <input
                    type="text"
                    value={sipYears}
                    onChange={(e) => setSipYears(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="10"
                    className={INPUT_STYLE}
                  />
                </div>
              </div>
              
              {/* Results Section */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border-2 border-purple-200">
                <h3 className="text-md font-bold text-slate-800 mb-4">Investment Summary</h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <div className="text-sm text-slate-600 mb-1">
                      {sipType === 'sip' ? 'Total Investment' : 'Investment Amount'}
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(sipCalculation.totalInvested)}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <div className="text-sm text-slate-600 mb-1">Estimated Returns</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(sipCalculation.estimatedReturns)}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-lg p-4 text-white shadow-lg">
                    <div className="text-sm opacity-90 mb-1">Future Value</div>
                    <div className="text-3xl font-bold">
                      {formatCurrency(sipCalculation.futureValue)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>

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

        {/* Portfolio Summary Cards - Only show if user has holdings */}
        {!isLoadingPortfolio && currentUser && holdings.length > 0 && (
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
            <div className={`bg-gradient-to-br rounded-xl p-5 border-2 shadow-lg ${
              portfolioTotals.totalGainLoss >= 0 
                ? 'from-green-50 to-emerald-50 border-green-200' 
                : 'from-red-50 to-rose-50 border-red-200'
            }`}>
              <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                <span className={portfolioTotals.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {portfolioTotals.totalGainLoss >= 0 ? '📊' : '📉'}
                </span>
                Total Gain/Loss
              </h3>
              <p className={`text-3xl font-bold ${portfolioTotals.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(portfolioTotals.totalGainLoss)}
              </p>
              <p className={`text-sm font-semibold mt-1 ${portfolioTotals.totalGainLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                ({portfolioTotals.totalGainLoss >= 0 ? '+' : ''}{portfolioTotals.totalGainLossPercent.toFixed(2)}%)
                  </p>
                </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border-2 border-orange-200 shadow-lg">
              <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                <span className="text-orange-600">📊</span>
                CAGR
              </h3>
              <p className={`text-3xl font-bold ${portfolioTotals.cagr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioTotals.cagr >= 0 ? '+' : ''}{portfolioTotals.cagr.toFixed(2)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">Compound Annual Growth Rate</p>
              </div>
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 border-2 border-indigo-200 shadow-lg">
              <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                <span className="text-indigo-600">📈</span>
                XIRR
              </h3>
              <p className={`text-3xl font-bold ${portfolioTotals.xirr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioTotals.xirr >= 0 ? '+' : ''}{portfolioTotals.xirr.toFixed(2)}%
                  </p>
              <p className="text-xs text-slate-500 mt-1">Extended Internal Rate of Return</p>
                </div>
              </div>
        )}

        {/* Add Fund Form / Portfolio Tracker */}
        <div className={CARD_STYLE} style={CARD_SHADOW}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-600" />
                {showAddForm ? 'Add Mutual Fund to Portfolio' : currentUser ? 'Portfolio Tracker' : 'Explore Mutual Funds'}
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
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAddForm ? 'rotate-180' : ''}`} />
                    {currentUser ? 'Add Fund' : 'Explore Funds'}
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
                          <div
                            key={index}
                            className="flex items-center justify-between px-4 py-2 hover:bg-purple-50 border-b border-slate-100 last:border-b-0 transition-colors"
                          >
                            <button
                            onClick={() => handleSelectFund(result.schemeCode, result.schemeName)}
                              className="flex-1 text-left"
                          >
                            <div className="font-semibold text-slate-800">{result.schemeName}</div>
                            <div className="text-xs text-slate-500">Code: {result.schemeCode}</div>
                          </button>
                            <button
                              onClick={() => handleLoadHistoricalData(result.schemeCode)}
                              className="ml-2 px-3 py-1.5 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all flex items-center gap-1.5"
                              title="View Historical Performance"
                            >
                              <TrendingUp className="w-3 h-3" />
                              <span className="hidden sm:inline">History</span>
                            </button>
                          </div>
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
                      {newInvestmentType === 'sip' ? 'Monthly SIP Amount' : 'Investment Amount'} <span className="text-red-500">*</span>
                      <HelpTooltip content={newInvestmentType === 'sip' ? 'Monthly SIP amount. Multiple purchase records will be created for each month.' : 'Total amount invested. Units will be calculated based on current NAV.'} />
                    </label>
                    <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInvestmentAmount}
                      onChange={(e) => setNewInvestmentAmount(e.target.value)}
                      placeholder={`${CURRENCY_DATA[selectedCurrency].symbol}0.00`}
                        className={`${INPUT_STYLE} flex-1`}
                    />
                      <div className="flex gap-1 bg-white rounded-lg p-0.5 border border-slate-300">
                        <button
                          type="button"
                          onClick={() => setNewInvestmentType('onetime')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                            newInvestmentType === 'onetime'
                              ? 'bg-purple-600 text-white'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          One Time
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewInvestmentType('sip')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                            newInvestmentType === 'sip'
                              ? 'bg-purple-600 text-white'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          SIP
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      {newInvestmentType === 'sip' ? 'SIP Start Date' : 'Purchase Date'} <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      value={newPurchaseDate}
                      onChange={setNewPurchaseDate}
                    />
                  </div>
                  {newInvestmentType === 'sip' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        SIP End Date <span className="text-red-500">*</span>
                        <HelpTooltip content="Last date of SIP. Purchase records will be created for each month from start date to end date." />
                      </label>
                      <DatePicker
                        value={newSipEndDate}
                        onChange={setNewSipEndDate}
                      />
                    </div>
                  )}
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
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleCalculateHistoricalPerformance}
                    disabled={isLoadingHistorical || !newSchemeCode || !newInvestmentAmount || !newPurchaseDate || newInvestmentType === 'sip'}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={newInvestmentType === 'sip' ? 'Historical Performance is only available for One-Time investments' : ''}
                  >
                    {isLoadingHistorical ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-5 h-5" />
                        Historical Performance
                      </>
                    )}
                  </button>
                <button
                  onClick={handleAddFund}
                  disabled={isLoadingNAV}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
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
              </div>
            )}
          </div>
        </div>

        {/* Historical Performance Results */}
        {showHistoricalPerformance && historicalPerformanceData && (
          <div ref={historicalPerformanceRef} className={CARD_STYLE} style={CARD_SHADOW}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Historical Performance Analysis
                </h3>
                <button
                  onClick={() => {
                    setShowHistoricalPerformance(false);
                    setHistoricalPerformanceData(null);
                  }}
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
                    <span className="font-semibold text-slate-800 ml-2">{newSchemeName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Purchase Date:</span>
                    <span className="font-semibold text-slate-800 ml-2">{formatDate(historicalPerformanceData.purchaseDate)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                  <p className="text-xs text-slate-600 mb-1">Investment Amount</p>
                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(historicalPerformanceData.investmentAmount)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border-2 border-purple-200">
                  <p className="text-xs text-slate-600 mb-1">Current Value</p>
                  <p className="text-2xl font-bold text-purple-700">{formatCurrency(historicalPerformanceData.currentValue)}</p>
                </div>
                <div className={`bg-gradient-to-br rounded-xl p-4 border-2 ${
                  historicalPerformanceData.gainLoss >= 0 
                    ? 'from-green-50 to-emerald-50 border-green-200' 
                    : 'from-red-50 to-rose-50 border-red-200'
                }`}>
                  <p className="text-xs text-slate-600 mb-1">Gain/Loss</p>
                  <p className={`text-2xl font-bold ${historicalPerformanceData.gainLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(historicalPerformanceData.gainLoss)}
                  </p>
                  <p className={`text-sm font-semibold mt-1 ${historicalPerformanceData.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({historicalPerformanceData.gainLoss >= 0 ? '+' : ''}{historicalPerformanceData.gainLossPercent.toFixed(2)}%)
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border-2 border-orange-200">
                  <p className="text-xs text-slate-600 mb-1">CAGR</p>
                  <p className={`text-2xl font-bold ${historicalPerformanceData.cagr >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {historicalPerformanceData.cagr >= 0 ? '+' : ''}{historicalPerformanceData.cagr.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">NAV on Purchase Date</p>
                  <p className="text-lg font-bold text-slate-800">{formatCurrency(historicalPerformanceData.purchaseNAV)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Current NAV</p>
                  <p className="text-lg font-bold text-slate-800">{formatCurrency(historicalPerformanceData.currentNAV)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Units</p>
                  <p className="text-lg font-bold text-slate-800">{historicalPerformanceData.units.toFixed(4)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Standalone Historical Data Viewer (for funds not in portfolio) */}
        {historicalDataForScheme && !holdings.find(h => h.schemeCode === historicalDataForScheme) && (
          <div className={CARD_STYLE} style={CARD_SHADOW}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Historical Performance
                </h3>
                <button
                  onClick={() => {
                    setHistoricalDataForScheme(null);
                    setHistoricalData([]);
                  }}
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
                    setHistoricalStartDate(e.target.value);
                    // Reload data with new date
                    if (historicalDataForScheme) {
                      handleLoadHistoricalData(historicalDataForScheme);
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
                  {/* Performance Metrics */}
                  {historicalData.length >= 2 && (() => {
                    const firstNAV = historicalData[0].nav;
                    const lastNAV = historicalData[historicalData.length - 1].nav;
                    const totalReturn = ((lastNAV - firstNAV) / firstNAV) * 100;
                    const years = (new Date(historicalData[historicalData.length - 1].date).getTime() - new Date(historicalData[0].date).getTime()) / (1000 * 60 * 60 * 24 * 365);
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
                  
                  {/* Chart */}
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
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
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
        )}

        {/* Holdings List */}
        {holdings.length === 0 ? (
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
                          onClick={() => handleLoadHistoricalData(holding.schemeCode)}
                          disabled={isLoadingHistorical}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                            historicalDataForScheme === holding.schemeCode
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

                    {/* Fund Summary */}
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

                    {/* Historical Data Display */}
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
                                // Reload data with new date
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
                            {/* Performance Metrics */}
                            {historicalData.length >= 2 && (() => {
                              const firstNAV = historicalData[0].nav;
                              const lastNAV = historicalData[historicalData.length - 1].nav;
                              const totalReturn = ((lastNAV - firstNAV) / firstNAV) * 100;
                              const years = (new Date(historicalData[historicalData.length - 1].date).getTime() - new Date(historicalData[0].date).getTime()) / (1000 * 60 * 60 * 24 * 365);
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
                            
                            {/* Chart */}
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

                    {/* Purchases List */}
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
                              <ChevronDown className={`w-3 h-3 transition-transform ${expandedPurchases.has(holding.id) ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>
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
                      
                      {/* Inline Add Purchase Form - Above purchases list */}
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

export default MutualFunds;
