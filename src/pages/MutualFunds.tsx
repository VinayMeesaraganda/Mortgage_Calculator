import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import type { MutualFundHolding, MutualFundPurchase, MutualFundHoldingSummary } from '../types/mutualFund';
import type { Currency } from '../types/mortgage';
import { setGlobalCurrency } from '../utils/formatting';
import LoginModal from '../components/LoginModal';
import AddMutualFundForm from '../components/MutualFunds/AddMutualFundForm';
import HistoricalPerformanceCard from '../components/MutualFunds/HistoricalPerformanceCard';
import MutualFundsHeader from '../components/MutualFunds/MutualFundsHeader';
import MutualFundsHoldingsList from '../components/MutualFunds/MutualFundsHoldingsList';
import PortfolioSummaryCards from '../components/MutualFunds/PortfolioSummaryCards';
import PortfolioSyncStatus from '../components/MutualFunds/PortfolioSyncStatus';
import SipCalculatorCard from '../components/MutualFunds/SipCalculatorCard';
import SipWarningModal from '../components/MutualFunds/SipWarningModal';
import StandaloneHistoricalViewer from '../components/MutualFunds/StandaloneHistoricalViewer';
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
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      <SipWarningModal
        isOpen={showSipWarningModal}
        onClose={() => setShowSipWarningModal(false)}
        onSwitchToOneTime={() => {
          setNewInvestmentType('onetime');
          setShowSipWarningModal(false);
        }}
      />

      <MutualFundsHeader
        selectedCurrency={selectedCurrency}
        onCurrencyChange={setSelectedCurrency}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SipCalculatorCard
          sipCalculatorExpanded={sipCalculatorExpanded}
          onToggleExpand={() => setSipCalculatorExpanded(!sipCalculatorExpanded)}
          sipType={sipType}
          onSipTypeChange={setSipType}
          sipAmount={sipAmount}
          onSipAmountChange={setSipAmount}
          sipReturns={sipReturns}
          onSipReturnsChange={setSipReturns}
          sipYears={sipYears}
          onSipYearsChange={setSipYears}
          sipCalculation={sipCalculation}
          selectedCurrency={selectedCurrency}
        />

        {isLoadingPortfolio && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
            <p className="text-slate-600">Loading your portfolio...</p>
          </div>
        )}

        <PortfolioSyncStatus
          isLoadingPortfolio={isLoadingPortfolio}
          currentUser={currentUser}
          isSaving={isSaving}
          isSynced={isSynced}
          isRefreshingNAVs={isRefreshingNAVs}
          lastRefreshTime={lastRefreshTime}
          holdingsCount={holdings.length}
          saveError={saveError}
          onRefreshAllNAVs={() => refreshAllNAVs(true)}
        />

        {!isLoadingPortfolio && currentUser && holdings.length > 0 && (
          <PortfolioSummaryCards portfolioTotals={portfolioTotals} />
        )}

        <AddMutualFundForm
          showAddForm={showAddForm}
          onToggleShowForm={() => setShowAddForm(!showAddForm)}
          currentUser={currentUser}
          addingPurchaseToHoldingId={addingPurchaseToHoldingId}
          newSchemeCode={newSchemeCode}
          setNewSchemeCode={setNewSchemeCode}
          newSchemeName={newSchemeName}
          setNewSchemeName={setNewSchemeName}
          newInvestmentAmount={newInvestmentAmount}
          setNewInvestmentAmount={setNewInvestmentAmount}
          newInvestmentType={newInvestmentType}
          setNewInvestmentType={setNewInvestmentType}
          newPurchaseDate={newPurchaseDate}
          setNewPurchaseDate={setNewPurchaseDate}
          newSipEndDate={newSipEndDate}
          setNewSipEndDate={setNewSipEndDate}
          useManualNAV={useManualNAV}
          setUseManualNAV={setUseManualNAV}
          manualNAV={manualNAV}
          setManualNAV={setManualNAV}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          isSearching={isSearching}
          onSearch={handleSearch}
          onSelectFund={handleSelectFund}
          onLoadHistoricalData={handleLoadHistoricalData}
          isLoadingHistorical={isLoadingHistorical}
          onCalculateHistoricalPerformance={handleCalculateHistoricalPerformance}
          isLoadingNAV={isLoadingNAV}
          onAddFund={handleAddFund}
          selectedCurrency={selectedCurrency}
        />

        {showHistoricalPerformance && (
          <HistoricalPerformanceCard
            data={historicalPerformanceData}
            schemeName={newSchemeName}
            onClose={() => {
              setShowHistoricalPerformance(false);
              setHistoricalPerformanceData(null);
            }}
            performanceRef={historicalPerformanceRef}
          />
        )}

        <StandaloneHistoricalViewer
          historicalDataForScheme={historicalDataForScheme}
          holdings={holdings}
          historicalStartDate={historicalStartDate}
          onHistoricalStartDateChange={setHistoricalStartDate}
          onReloadHistoricalData={handleLoadHistoricalData}
          onClose={() => {
            setHistoricalDataForScheme(null);
            setHistoricalData([]);
          }}
          isLoadingHistorical={isLoadingHistorical}
          historicalData={historicalData}
        />

        <MutualFundsHoldingsList
          holdings={holdings}
          holdingsSummary={holdingsSummary}
          currentUser={currentUser}
          setShowAddForm={setShowAddForm}
          expandedPurchases={expandedPurchases}
          setExpandedPurchases={setExpandedPurchases}
          inlineAddPurchaseHoldingId={inlineAddPurchaseHoldingId}
          setInlineAddPurchaseHoldingId={setInlineAddPurchaseHoldingId}
          inlineInvestmentAmount={inlineInvestmentAmount}
          setInlineInvestmentAmount={setInlineInvestmentAmount}
          inlinePurchaseDate={inlinePurchaseDate}
          setInlinePurchaseDate={setInlinePurchaseDate}
          inlineUseManualNAV={inlineUseManualNAV}
          setInlineUseManualNAV={setInlineUseManualNAV}
          inlineManualNAV={inlineManualNAV}
          setInlineManualNAV={setInlineManualNAV}
          editingPurchaseId={editingPurchaseId}
          setEditingPurchaseId={setEditingPurchaseId}
          refreshingHoldingIds={refreshingHoldingIds}
          isLoadingHistorical={isLoadingHistorical}
          isLoadingNAV={isLoadingNAV}
          historicalDataForScheme={historicalDataForScheme}
          historicalData={historicalData}
          historicalStartDate={historicalStartDate}
          setHistoricalStartDate={setHistoricalStartDate}
          handleLoadHistoricalData={handleLoadHistoricalData}
          handleUpdateCurrentNAV={handleUpdateCurrentNAV}
          handleDeleteHolding={handleDeleteHolding}
          handleDeletePurchase={handleDeletePurchase}
          handleUpdatePurchase={handleUpdatePurchase}
          handleAddPurchaseInline={handleAddPurchaseInline}
        />
      </main>
    </div>

  );
};

export default MutualFunds;
