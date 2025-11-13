// Main Mortgage Calculator Component - Modularized Version
// This file demonstrates the clean architecture using separated modules

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ArrowLeft, Trash2, Edit2, X, Check, Home } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList
} from 'recharts';

// Import types
import type { OneTimePayment, PaymentType, Currency, SavedMortgage } from './types/mortgage';

// Import utilities
import { formatCurrency, formatCurrencyCompact, formatDate, formatYearsMonths, setGlobalCurrency } from './utils/formatting';
import { calculateMonthlyPayment, simulateMonthlyAmortization, simulateBiweeklyAmortization } from './utils/calculations-helpers';
import { applyScenarioToCalculator } from './helpers/applyScenario';
import { exportToExcel } from './utils/excelExport';
import { exportToPDF } from './utils/pdfExport';
import { CURRENCY_DATA } from './utils/currency';

// Import hooks
import { useNumberInput } from './hooks/useNumberInput';
import { useMortgageCalculations } from './hooks/useMortgageCalculations';

// Import components
import { HelpTooltip } from './components/HelpTooltip';
import { DatePicker } from './components/DatePicker';
import { AmortizationTable } from './components/AmortizationTable';
import SEOContent from './components/SEOContent';
import EmailCaptureModal from './components/EmailCaptureModal';
import ViralShareResults from './components/ViralShareResults';
import LoginModal from './components/LoginModal';
// import Testimonials from './components/Testimonials';
// import SocialProofBanner from './components/SocialProofBanner';
import CurrencySelector from './components/CurrencySelector';
import CurrentRatesDisplay from './components/CurrentRatesDisplay';
import ExportDropdown from './components/ExportDropdown';

// Import constants
import { INPUT_STYLE, CARD_STYLE, CARD_SHADOW } from './constants/styles';
import { ERROR_MESSAGES, DEBOUNCE_DELAYS, FIRESTORE_SYNC } from './utils/constants';

// Import auth and services
import { useAuth } from './contexts/AuthContext';
import { useToast } from './components/Toast';
import { logger } from './utils/logger';
import { 
  saveMortgages, 
  loadMortgages, 
  subscribeToMortgages 
} from './services/mortgageService';

const MortgageCalculator: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, error: showError, warning } = useToast();
  
  // Mortgage tracking state
  const [savedMortgages, setSavedMortgages] = useState<SavedMortgage[]>([]);
  const [selectedMortgageId, setSelectedMortgageId] = useState<string | null>(null);
  const [isLoadingMortgages, setIsLoadingMortgages] = useState(false);
  const [isSavingMortgage, setIsSavingMortgage] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSaveMortgageModal, setShowSaveMortgageModal] = useState(false);
  const [newMortgageName, setNewMortgageName] = useState('');
  const [editingMortgageName, setEditingMortgageName] = useState<string | null>(null);
  const [editingMortgageNameValue, setEditingMortgageNameValue] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [trackerExpanded, setTrackerExpanded] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isInitialLoadRef = useRef(true);
  const lastLocalChangeRef = useRef<number>(0);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use custom hooks for number inputs - eliminates ~150 lines of repetitive code
  const homeValueInput = useNumberInput(400000, 400000, 'homeValue');
  const downPaymentInput = useNumberInput(80000, 80000, 'downPayment', (val) => Math.min(val, homeValueInput.value));
  const interestRateInput = useNumberInput(6.5, 6.5, 'interestRate');
  const tenureInput = useNumberInput(30, 30, 'tenure', (val) => Math.floor(val));
  const extraPaymentAmountInput = useNumberInput(0, 0, 'extraPaymentAmount');
  
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [paymentType, setPaymentType] = useState<PaymentType>('monthly');
  const [extraPaymentEnabled, setExtraPaymentEnabled] = useState(false);
  const [extraPaymentStartDate, setExtraPaymentStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [extraPaymentFrequency, setExtraPaymentFrequency] = useState('monthly');
  
  // Multiple one-time payments
  const [oneTimePayments, setOneTimePayments] = useState<OneTimePayment[]>([]);
  
  // Loan Scenario Comparison
  const [showScenarioComparison, setShowScenarioComparison] = useState(false);
  const [scenarioB, setScenarioB] = useState({ 
    homeValue: 400000, 
    downPayment: 80000, 
    interestRate: 6.0, 
    tenure: 20, 
    paymentType: 'monthly' as PaymentType 
  });
  const [scenarioC, setScenarioC] = useState({ 
    homeValue: 400000, 
    downPayment: 120000, 
    interestRate: 5.75, 
    tenure: 15, 
    paymentType: 'monthly' as PaymentType 
  });
  
  // Refinance Analysis
  const [showRefinanceAnalysis, setShowRefinanceAnalysis] = useState(false);
  const [refinanceData, setRefinanceData] = useState({
    remainingBalance: 280000,
    currentRate: 7.5,
    currentPayoffDate: '', // Projected payoff date from mortgage statement (YYYY-MM-DD format)
    currentExtraPayment: 0, // Additional extra payment going forward
    newRate: 6.0,
    closingCosts: 3500,
    newTerm: 30,
    newExtraPayment: 0 // Extra payment on new loan
  });
  
  // Track raw input values for interest rate fields to allow proper decimal entry
  const [editingCurrentRate, setEditingCurrentRate] = useState(false);
  const [rawCurrentRate, setRawCurrentRate] = useState('');
  const [editingNewRate, setEditingNewRate] = useState(false);
  const [rawNewRate, setRawNewRate] = useState('');
  
  // Track raw input values for down payment percentage in compare loans modal
  const [editingScenarioBPercent, setEditingScenarioBPercent] = useState(false);
  const [rawScenarioBPercent, setRawScenarioBPercent] = useState('');
  const [editingScenarioCPercent, setEditingScenarioCPercent] = useState(false);
  const [rawScenarioCPercent, setRawScenarioCPercent] = useState('');
  
  // Property Type (Primary Home vs Investment)
  const [propertyType, setPropertyType] = useState<'primary' | 'investment'>('primary');
  
  // Investment Property - Rental Income
  const monthlyRentInput = useNumberInput(2500, 2500, 'monthlyRent');
  const [vacancyRate, setVacancyRate] = useState(8); // percentage
  // const [annualRentIncrease, setAnnualRentIncrease] = useState(3); // percentage - Reserved for future feature
  
  // Investment Property - Operating Expenses
  const [propertyManagementPercent, setPropertyManagementPercent] = useState(10); // % of rent
  const maintenanceInput = useNumberInput(500, 0, 'maintenance'); // monthly - allows 0 value
  const utilitiesInput = useNumberInput(0, 0, 'utilities'); // monthly (if landlord pays)
  const [propertyAppreciationRate, setPropertyAppreciationRate] = useState(3.5); // annual %
  
  // Additional Costs
  const [showAdditionalCosts, setShowAdditionalCosts] = useState(false);
  const [propertyTax, setPropertyTax] = useState(0);
  const [propertyTaxPeriod, setPropertyTaxPeriod] = useState<'year' | 'month'>('year');
  const [homeInsurance, setHomeInsurance] = useState(0);
  const [homeInsurancePeriod, setHomeInsurancePeriod] = useState<'year' | 'month'>('year');
  const [pmiAmount, setPmiAmount] = useState(0);
  const [hoaFees, setHoaFees] = useState(0);
  
  // For down payment percentage input (special case - bidirectional sync)
  const [editingDownPaymentPercent, setEditingDownPaymentPercent] = useState(false);
  const [rawDownPaymentPercent, setRawDownPaymentPercent] = useState('');
  
  // Conversion optimization - Email capture and viral sharing
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  
  // Phase 3 Features
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const [showCurrentRates, setShowCurrentRates] = useState(false); // Toggle for showing/hiding current rates display

  // Update global currency when selection changes and force re-render
  const [currencyRenderKey, setCurrencyRenderKey] = useState(0);
  useEffect(() => {
    setGlobalCurrency(selectedCurrency);
    // Force re-render of all components using currency
    setCurrencyRenderKey(prev => prev + 1);
  }, [selectedCurrency]);

  // Force chart re-render when one-time payments change
  const [chartRenderKey, setChartRenderKey] = useState(0);
  useEffect(() => {
    setChartRenderKey(prev => prev + 1);
  }, [oneTimePayments]);
  
  // Convenience aliases for backward compatibility
  const homeValue = homeValueInput.value;
  const downPayment = downPaymentInput.value;
  const interestRate = interestRateInput.value;
  const tenure = tenureInput.value;
  const extraPaymentAmount = extraPaymentAmountInput.value;

  // Auto-update extra payment frequency when payment type changes
  useEffect(() => {
    if (paymentType === 'biweekly' && extraPaymentFrequency === 'monthly' && extraPaymentEnabled) {
      setExtraPaymentFrequency('biweekly');
    }
  }, [paymentType, extraPaymentEnabled, extraPaymentFrequency]);

  // Use calculation hook
  const calculations = useMortgageCalculations({
    homeValue,
    downPayment,
    interestRate,
    tenure,
    startDate,
    paymentType,
    extraPaymentEnabled,
    extraPaymentStartDate,
    extraPaymentFrequency,
    extraPaymentAmount,
    oneTimePayments
  });

  // Extract calculation values
  const loanAmount = calculations.loanAmount;
  const paymentAmount = calculations.paymentAmount;
  const totalInterest = calculations.totalInterest;
  const totalPaid = calculations.totalPaid;
  const endDate = calculations.endDate;
  const schedule = calculations.schedule;
  const yearsToPayoff = calculations.yearsToPayoff;
  
  // Trigger email capture after calculation (conversion optimization)
  useEffect(() => {
    if (!hasCalculated && schedule.length > 0) {
      setHasCalculated(true);
      // Show email capture modal after user sees results
      const timer = setTimeout(() => {
        setShowEmailCapture(true);
      }, DEBOUNCE_DELAYS.EMAIL_CAPTURE);
      return () => clearTimeout(timer);
    }
  }, [hasCalculated, schedule.length]);

  // Load mortgages from Firestore on mount
  useEffect(() => {
    if (!currentUser) {
      setSavedMortgages([]);
      return;
    }

    const loadMortgagesData = async () => {
      setIsLoadingMortgages(true);
      try {
        const mortgages = await loadMortgages(currentUser.uid);
        setSavedMortgages(mortgages);
        isInitialLoadRef.current = false;
      } catch (error) {
        const err = error as Error;
        logger.error('Error loading mortgages', error);
        // Show the specific error message from the service, or fallback to generic
        showError(err.message || ERROR_MESSAGES.LOAD_MORTGAGE_FAILED);
      } finally {
        setIsLoadingMortgages(false);
      }
    };

    loadMortgagesData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToMortgages(currentUser.uid, (updatedMortgages) => {
      if (!isInitialLoadRef.current) {
        const timeSinceLastChange = Date.now() - lastLocalChangeRef.current;
        // Only accept Firestore updates if no recent local changes
        if (timeSinceLastChange > FIRESTORE_SYNC.LOCAL_CHANGE_BUFFER_MS) {
          setSavedMortgages(updatedMortgages);
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

  // Save mortgages to Firestore when they change (debounced)
  useEffect(() => {
    if (!currentUser || isLoadingMortgages || isInitialLoadRef.current) {
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    const saveTimer = setTimeout(async () => {
      try {
        setIsSavingMortgage(true);
        setSaveError(null);
        await saveMortgages(currentUser.uid, savedMortgages);
        logger.info('Mortgages saved successfully to Firestore');
      } catch (error) {
        const err = error as Error;
        logger.error('Error saving mortgages', error);
        // Show the specific error message from the service
        const errorMessage = err.message || ERROR_MESSAGES.SAVE_MORTGAGE_FAILED;
        setSaveError(errorMessage);
        showError(errorMessage);
      } finally {
        setIsSavingMortgage(false);
      }
    }, DEBOUNCE_DELAYS.FIRESTORE_SAVE);

    saveTimerRef.current = saveTimer;

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [savedMortgages, currentUser, isLoadingMortgages]);

  // Save or update current mortgage
  const handleSaveCurrentMortgage = useCallback(() => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }

    if (!newMortgageName.trim()) {
      warning(ERROR_MESSAGES.INVALID_MORTGAGE_NAME);
      return;
    }

    const trimmedName = newMortgageName.trim();

    // Check for duplicate name (excluding the current mortgage if updating)
    const existingMortgageWithSameName = savedMortgages.find(
      m => m.name.toLowerCase() === trimmedName.toLowerCase() && m.id !== selectedMortgageId
    );

    if (existingMortgageWithSameName) {
      warning(ERROR_MESSAGES.DUPLICATE_MORTGAGE_NAME);
      return;
    }

    if (selectedMortgageId) {
      // Update existing mortgage
      lastLocalChangeRef.current = Date.now();
      setSavedMortgages(prev => prev.map(m => 
        m.id === selectedMortgageId ? {
          ...m,
          name: trimmedName,
          homeValue: homeValueInput.value,
          downPayment: downPaymentInput.value,
          interestRate: interestRateInput.value,
          tenure: tenureInput.value,
          startDate,
          paymentType,
          extraPaymentEnabled,
          extraPaymentAmount: extraPaymentAmountInput.value,
          extraPaymentStartDate,
          extraPaymentFrequency: extraPaymentFrequency as 'monthly' | 'biweekly',
          oneTimePayments: [...oneTimePayments],
          currency: selectedCurrency,
          updatedAt: new Date().toISOString()
        } : m
      ));
    } else {
      // Create new mortgage
      const newMortgage: SavedMortgage = {
        id: `mortgage-${Date.now()}-${Math.random()}`,
        name: trimmedName,
        homeValue: homeValueInput.value,
        downPayment: downPaymentInput.value,
        interestRate: interestRateInput.value,
        tenure: tenureInput.value,
        startDate,
        paymentType,
        extraPaymentEnabled,
        extraPaymentAmount: extraPaymentAmountInput.value,
        extraPaymentStartDate,
        extraPaymentFrequency: extraPaymentFrequency as 'monthly' | 'biweekly',
        oneTimePayments: [...oneTimePayments],
        currency: selectedCurrency,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      lastLocalChangeRef.current = Date.now();
      setSavedMortgages(prev => [...prev, newMortgage]);
      setSelectedMortgageId(newMortgage.id);
    }

    setNewMortgageName('');
    setShowSaveMortgageModal(false);
    
    // Scroll to mortgage tracker after a short delay
    setTimeout(() => {
      const trackerElement = document.getElementById('mortgage-tracker');
      if (trackerElement) {
        trackerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  }, [currentUser, newMortgageName, savedMortgages, selectedMortgageId, homeValueInput.value, downPaymentInput.value, interestRateInput.value, tenureInput.value, startDate, paymentType, extraPaymentEnabled, extraPaymentAmountInput.value, extraPaymentStartDate, extraPaymentFrequency, oneTimePayments, selectedCurrency]);

  // Load a saved mortgage
  const handleLoadMortgage = useCallback((mortgage: SavedMortgage) => {
    homeValueInput.setValue(mortgage.homeValue);
    downPaymentInput.setValue(mortgage.downPayment);
    interestRateInput.setValue(mortgage.interestRate);
    tenureInput.setValue(mortgage.tenure);
    setStartDate(mortgage.startDate);
    setPaymentType(mortgage.paymentType);
    setExtraPaymentEnabled(mortgage.extraPaymentEnabled);
    extraPaymentAmountInput.setValue(mortgage.extraPaymentAmount);
    setExtraPaymentStartDate(mortgage.extraPaymentStartDate);
    setExtraPaymentFrequency(mortgage.extraPaymentFrequency);
    setOneTimePayments([...mortgage.oneTimePayments]);
    setSelectedCurrency(mortgage.currency);
    setSelectedMortgageId(mortgage.id);
    setNewMortgageName(mortgage.name); // Pre-fill the name for updating
  }, [
    homeValueInput,
    downPaymentInput,
    interestRateInput,
    tenureInput,
    extraPaymentAmountInput,
    setStartDate,
    setPaymentType,
    setExtraPaymentEnabled,
    setExtraPaymentStartDate,
    setExtraPaymentFrequency,
    setOneTimePayments,
    setSelectedCurrency,
    setSelectedMortgageId,
    setNewMortgageName
  ]);

  // Delete a mortgage
  const handleDeleteMortgage = useCallback((mortgageId: string) => {
    if (window.confirm('Are you sure you want to delete this mortgage?')) {
      lastLocalChangeRef.current = Date.now();
      setSavedMortgages(prev => prev.filter(m => m.id !== mortgageId));
      if (selectedMortgageId === mortgageId) {
        setSelectedMortgageId(null);
      }
    }
  }, [selectedMortgageId, setSavedMortgages, setSelectedMortgageId]);

  // Update mortgage name
  const handleUpdateMortgageName = useCallback((mortgageId: string, newName: string) => {
    if (!newName.trim()) {
      warning(ERROR_MESSAGES.EMPTY_MORTGAGE_NAME);
      return;
    }
    lastLocalChangeRef.current = Date.now();
    setSavedMortgages(prev => prev.map(m => 
      m.id === mortgageId ? { ...m, name: newName.trim(), updatedAt: new Date().toISOString() } : m
    ));
    setEditingMortgageName(null);
    setEditingMortgageNameValue('');
  }, [warning, setSavedMortgages, setEditingMortgageName, setEditingMortgageNameValue]);

  // Update current mortgage data
  const handleUpdateCurrentMortgage = useCallback(() => {
    if (!selectedMortgageId || !currentUser) return;

    lastLocalChangeRef.current = Date.now();
    setSavedMortgages(prev => prev.map(m => 
      m.id === selectedMortgageId ? {
        ...m,
        homeValue: homeValueInput.value,
        downPayment: downPaymentInput.value,
        interestRate: interestRateInput.value,
        tenure: tenureInput.value,
        startDate,
        paymentType,
        extraPaymentEnabled,
        extraPaymentAmount: extraPaymentAmountInput.value,
        extraPaymentStartDate,
        extraPaymentFrequency: extraPaymentFrequency as 'monthly' | 'biweekly',
        oneTimePayments: [...oneTimePayments],
        currency: selectedCurrency,
        updatedAt: new Date().toISOString()
      } : m
    ));
  }, [selectedMortgageId, currentUser, homeValueInput.value, downPaymentInput.value, interestRateInput.value, tenureInput.value, startDate, paymentType, extraPaymentEnabled, extraPaymentAmountInput.value, extraPaymentStartDate, extraPaymentFrequency, oneTimePayments, selectedCurrency]);

  // Auto-update selected mortgage when form values change (debounced)
  useEffect(() => {
    if (selectedMortgageId && currentUser) {
      const updateTimer = setTimeout(() => {
        handleUpdateCurrentMortgage();
      }, DEBOUNCE_DELAYS.MORTGAGE_UPDATE);
      
      return () => clearTimeout(updateTimer);
    }
  }, [selectedMortgageId, currentUser, homeValueInput.value, downPaymentInput.value, interestRateInput.value, tenureInput.value, startDate, paymentType, extraPaymentEnabled, extraPaymentAmountInput.value, extraPaymentStartDate, extraPaymentFrequency, oneTimePayments.length, selectedCurrency, handleUpdateCurrentMortgage]);
  
  // Calculate monthly additional costs (moved here after loanAmount is available)
  const monthlyPropertyTax = propertyTaxPeriod === 'year' ? propertyTax / 12 : propertyTax;
  const monthlyInsurance = homeInsurancePeriod === 'year' ? homeInsurance / 12 : homeInsurance;
  const totalMonthlyCosts = monthlyPropertyTax + monthlyInsurance + pmiAmount + hoaFees;
  const trueMonthlyPayment = paymentAmount + totalMonthlyCosts;
  
  // Auto-calculate PMI if down payment < 20%
  useEffect(() => {
    const downPaymentPercent = (downPayment / homeValue) * 100;
    if (downPaymentPercent < 20 && pmiAmount === 0) {
      // Typical PMI is 0.5% to 1% of loan amount annually, we'll use 0.75%
      const estimatedPMI = (loanAmount * 0.0075) / 12;
      setPmiAmount(Number(estimatedPMI.toFixed(2)));
    } else if (downPaymentPercent >= 20 && pmiAmount > 0) {
      setPmiAmount(0);
    }
  }, [downPayment, homeValue, loanAmount, pmiAmount]);
  
  const comparisonCalc = calculations.comparison;
  const comparisonMode = calculations.comparisonMode;
  
  // Investment Property Calculations
  const effectiveMonthlyRent = monthlyRentInput.value * (1 - vacancyRate / 100);
  const propertyManagementFee = monthlyRentInput.value * (propertyManagementPercent / 100);
  const totalOperatingExpenses = propertyManagementFee + maintenanceInput.value + utilitiesInput.value + (monthlyPropertyTax + monthlyInsurance + hoaFees);
  const monthlyCashFlow = effectiveMonthlyRent - paymentAmount - totalOperatingExpenses;
  const annualCashFlow = monthlyCashFlow * 12;
  
  // Investment KPIs
  const cashOnCashReturn = downPaymentInput.value > 0 ? (annualCashFlow / downPaymentInput.value) * 100 : 0;
  const annualRent = monthlyRentInput.value * 12 * (1 - vacancyRate / 100);
  const annualOperatingExpenses = totalOperatingExpenses * 12;
  const netOperatingIncome = annualRent - annualOperatingExpenses;
  const capRate = homeValueInput.value > 0 ? (netOperatingIncome / homeValueInput.value) * 100 : 0;
  const breakEvenOccupancy = monthlyRentInput.value > 0 ? ((paymentAmount + totalOperatingExpenses) / monthlyRentInput.value) * 100 : 0;
  
  // Rental Income Projections (based on appreciation rate for rental income growth)
  const futureMonthlyRent5Year = monthlyRentInput.value * Math.pow(1 + propertyAppreciationRate / 100, 5);
  const futureMonthlyRent10Year = monthlyRentInput.value * Math.pow(1 + propertyAppreciationRate / 100, 10);
  const futureMonthlyRent15Year = monthlyRentInput.value * Math.pow(1 + propertyAppreciationRate / 100, 15);
  const rentIncrease5Year = futureMonthlyRent5Year - monthlyRentInput.value;
  const rentIncrease10Year = futureMonthlyRent10Year - monthlyRentInput.value;
  const rentIncrease15Year = futureMonthlyRent15Year - monthlyRentInput.value;
  // const totalReturn5Year = (annualCashFlow * 5) + (futureValue5Year - homeValueInput.value);
  // const totalReturn10Year = (annualCashFlow * 10) + (futureValue10Year - homeValueInput.value);
  
  // Calculate scenario comparisons - Using helper functions to eliminate duplication
  // Memoized with useCallback to prevent unnecessary recalculations
  const calculateScenario = useCallback((scenario: { homeValue: number; downPayment: number; interestRate: number; tenure: number; paymentType: PaymentType }) => {
    const loanAmount = scenario.homeValue - scenario.downPayment;
    
    if (scenario.paymentType === 'monthly') {
      // Standard monthly calculation using helper
      const payment = calculateMonthlyPayment(loanAmount, scenario.interestRate, scenario.tenure);
      const numMonthlyPayments = scenario.tenure * 12;
      const totalPaid = payment * numMonthlyPayments;
      const totalInterest = totalPaid - loanAmount;
      return { loanAmount, payment, totalPaid, totalInterest, numPayments: numMonthlyPayments, tenure: scenario.tenure };
    } else {
      // Bi-weekly calculation using helpers
      const monthlyPayment = calculateMonthlyPayment(loanAmount, scenario.interestRate, scenario.tenure);
      const biweeklyPayment = monthlyPayment / 2;
      const maxPayments = scenario.tenure * 26;
      
      // Simulate bi-weekly amortization using helper
      const { paymentsCount, totalInterest } = simulateBiweeklyAmortization(
        loanAmount,
        biweeklyPayment,
        scenario.interestRate,
        maxPayments
      );
      
      const totalPaid = loanAmount + totalInterest;
      const actualYears = paymentsCount / 26;
      
      return { 
        loanAmount,
        payment: biweeklyPayment, 
        totalPaid, 
        totalInterest, 
        numPayments: paymentsCount, 
        tenure: Number(actualYears.toFixed(1))
      };
    }
  }, []);

  // Memoize scenario calculations to avoid recalculating on every render
  const scenarioBCalc = useMemo(() => calculateScenario(scenarioB), [calculateScenario, scenarioB]);
  const scenarioCCalc = useMemo(() => calculateScenario(scenarioC), [calculateScenario, scenarioC]);
  
  // Calculate current scenario WITHOUT extra payments for fair comparison
  // Memoized to avoid recalculation on every render
  const currentScenarioBase = useMemo(() => calculateScenario({
    homeValue: homeValueInput.value,
    downPayment: downPaymentInput.value,
    interestRate: interestRate,
    tenure: tenure,
    paymentType: paymentType
  }), [calculateScenario, homeValueInput.value, downPaymentInput.value, interestRate, tenure, paymentType]);
  
  // Calculate refinance analysis - Using helper functions to eliminate duplication
  // Memoized with useCallback to prevent unnecessary recalculations
  const calculateRefinance = useCallback(() => {
    const monthlyRate = refinanceData.currentRate / 100 / 12;
    
    // Calculate remaining months from payoff date
    let actualRemainingMonths = 360; // Default
    let currentPayment = paymentAmount; // Default to calculated
    
    if (refinanceData.currentPayoffDate) {
      const dateParts = refinanceData.currentPayoffDate.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]);
      const day = dateParts.length > 2 ? parseInt(dateParts[2]) : 1;
      const payoffDate = new Date(year, month - 1, day);
      const today = new Date();
      const monthsDiff = (payoffDate.getFullYear() - today.getFullYear()) * 12 + 
                        (payoffDate.getMonth() - today.getMonth());
      actualRemainingMonths = Math.max(1, monthsDiff);
      
      // Calculate the actual monthly payment using helper
      if (actualRemainingMonths > 0 && refinanceData.remainingBalance > 0) {
        currentPayment = calculateMonthlyPayment(
          refinanceData.remainingBalance, 
          refinanceData.currentRate, 
          actualRemainingMonths / 12
        );
      }
    }
    
    // Simulate current loan amortization using helper
    const maxMonths = actualRemainingMonths + 120; // Safety limit
    const currentResult = simulateMonthlyAmortization(
      refinanceData.remainingBalance,
      currentPayment,
      monthlyRate,
      refinanceData.currentExtraPayment,
      maxMonths
    );
    
    const currentTotalPayments = (currentPayment * currentResult.monthsPaid) + currentResult.totalExtraPaid;
    const finalRemainingMonths = refinanceData.currentExtraPayment > 0 ? currentResult.monthsPaid : actualRemainingMonths;
    
    // New refinanced loan - Calculate payment using helper
    const newMonthlyRate = refinanceData.newRate / 100 / 12;
    const newPayment = calculateMonthlyPayment(
      refinanceData.remainingBalance,
      refinanceData.newRate,
      refinanceData.newTerm
    );
    
    // Simulate new loan with extra payments using helper
    const newResult = simulateMonthlyAmortization(
      refinanceData.remainingBalance,
      newPayment,
      newMonthlyRate,
      refinanceData.newExtraPayment,
      maxMonths
    );
    
    const newTotalPayments = (newPayment * newResult.monthsPaid) + newResult.totalExtraPaid + refinanceData.closingCosts;
    const actualNewMonths = newResult.monthsPaid;
    
    // Savings calculations
    const monthlySavings = currentPayment - newPayment;
    const totalSavings = currentTotalPayments - newTotalPayments;
    const interestSavings = currentResult.totalInterest - newResult.totalInterest - refinanceData.closingCosts;
    const breakEvenMonths = monthlySavings > 0 ? refinanceData.closingCosts / monthlySavings : Infinity;
    const breakEvenYears = breakEvenMonths / 12;
    
    // Time comparison
    const currentYearsRemaining = finalRemainingMonths / 12;
    const newYears = actualNewMonths / 12;
    const timeDifference = newYears - currentYearsRemaining;
    
    // Payment comparison (including extra payments)
    const currentMonthlyTotal = currentPayment + refinanceData.currentExtraPayment;
    const newMonthlyTotal = newPayment + refinanceData.newExtraPayment;
    
    return {
      currentPayment,
      currentMonthlyTotal,
      currentTotalPayments,
      currentTotalInterest: currentResult.totalInterest,
      remainingMonths: finalRemainingMonths,
      newPayment,
      newMonthlyTotal,
      newTotalPayments,
      newTotalInterest: newResult.totalInterest,
      actualNewMonths,
      monthlySavings,
      totalSavings,
      interestSavings,
      breakEvenMonths,
      breakEvenYears,
      timeDifference,
      worthIt: totalSavings > 0 && breakEvenMonths < finalRemainingMonths
    };
  }, [refinanceData, paymentAmount]);
  
  // Memoize refinance calculation result
  const refinanceCalc = useMemo(() => calculateRefinance(), [calculateRefinance]);
  
  // Calculate outstanding balance as of today
  const getCurrentOutstandingBalance = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDateObj = new Date(startDate);
    startDateObj.setHours(0, 0, 0, 0);
    
    // If mortgage hasn't started yet, return original loan amount
    if (today < startDateObj) {
      return loanAmount;
    }
    
    // Find the outstanding balance as of today from the schedule
    let currentBalance = loanAmount;
    for (const payment of schedule) {
      const paymentDate = new Date(payment.date);
      paymentDate.setHours(0, 0, 0, 0);
      
      if (paymentDate <= today) {
        currentBalance = payment.balance;
      } else {
        break;
      }
    }
    
    return currentBalance;
  }, [schedule, loanAmount, startDate]);

  // Calculate how long it takes to pay off remaining balance with fixed payment
  const calculatePayoffWithFixedPayment = useCallback((
    principal: number,
    annualRate: number,
    fixedMonthlyPayment: number,
    startDateStr: string,
    isMonthly: boolean
  ) => {
    const monthlyRate = annualRate / 12;
    const dailyRate = annualRate / 365;
    
    let balance = principal;
    const schedule: any[] = [];
    let totalInterestPaid = 0;
    let totalPaid = 0;
    
    const [startYear, startMonth] = startDateStr.split('-').map(Number);
    let currentDate = new Date(startYear, startMonth - 1, 1);
    let paymentNum = 1;
    const maxPayments = isMonthly ? 600 : 1300; // Safety limit
    
    if (isMonthly) {
      // Monthly payments
      while (balance > 0.01 && paymentNum <= maxPayments) {
        const interestPayment = balance * monthlyRate;
        let principalPayment = fixedMonthlyPayment - interestPayment;
        
        if (balance - principalPayment < 0.01) {
          principalPayment = balance;
          balance = 0;
        } else {
          balance -= principalPayment;
        }
        
        totalInterestPaid += interestPayment;
        const totalPayment = interestPayment + principalPayment;
        totalPaid += totalPayment;
        
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        
        schedule.push({
          paymentNum,
          date: `${year}-${month}`,
          payment: totalPayment,
          principal: principalPayment,
          interest: interestPayment,
          balance: Math.max(0, balance),
          totalInterest: totalInterestPaid
        });
        
        currentDate.setMonth(currentDate.getMonth() + 1);
        paymentNum++;
        
        if (balance < 0.01) break;
      }
      
      const yearsToPayoff = schedule.length / 12;
      const endDate = schedule.length > 0 ? schedule[schedule.length - 1].date : startDateStr;
      
      return {
        loanAmount: principal,
        paymentAmount: fixedMonthlyPayment,
        totalPayments: schedule.length,
        totalPaid,
        totalInterest: totalInterestPaid,
        endDate,
        schedule,
        yearsToPayoff
      };
    } else {
      // Biweekly payments (half of monthly payment every 2 weeks)
      const biweeklyPayment = fixedMonthlyPayment / 2;
      
      while (balance > 0.01 && paymentNum <= maxPayments) {
        const interestPayment = balance * dailyRate * 14;
        let principalPayment = biweeklyPayment - interestPayment;
        
        if (balance - principalPayment < 0.01) {
          principalPayment = balance;
          balance = 0;
        } else {
          balance -= principalPayment;
        }
        
        totalInterestPaid += interestPayment;
        const actualPayment = interestPayment + principalPayment;
        totalPaid += actualPayment;
        
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        
        schedule.push({
          paymentNum,
          date: `${year}-${month}`,
          payment: actualPayment,
          principal: principalPayment,
          interest: interestPayment,
          balance: Math.max(0, balance),
          totalInterest: totalInterestPaid
        });
        
        currentDate.setDate(currentDate.getDate() + 14);
        paymentNum++;
        
        if (balance < 0.01) break;
      }
      
      const yearsToPayoff = schedule.length / 26;
      const endDate = schedule.length > 0 ? schedule[schedule.length - 1].date : startDateStr;
      
      return {
        loanAmount: principal,
        paymentAmount: biweeklyPayment,
        totalPayments: schedule.length,
        totalPaid,
        totalInterest: totalInterestPaid,
        endDate,
        schedule,
        yearsToPayoff
      };
    }
  }, []);

  // Calculate projections from today forward with remaining balance
  const calculateForwardProjections = useCallback(() => {
    const outstandingBalance = getCurrentOutstandingBalance();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    // Use CURRENT monthly payment amount (not recalculating)
    const currentMonthlyPayment = paymentAmount;
    
    // Calculate monthly projection: pay off remaining balance with current monthly payment
    const monthlyProjection = calculatePayoffWithFixedPayment(
      outstandingBalance,
      interestRate / 100,
      currentMonthlyPayment,
      todayStr,
      true
    );
    
    // Calculate biweekly projection: pay off remaining balance with half payments every 2 weeks
    const biweeklyProjection = calculatePayoffWithFixedPayment(
      outstandingBalance,
      interestRate / 100,
      currentMonthlyPayment,
      todayStr,
      false
    );
    
    return { monthlyProjection, biweeklyProjection, outstandingBalance };
  }, [getCurrentOutstandingBalance, interestRate, paymentAmount, calculatePayoffWithFixedPayment]);
  
  // Get forward projections (used for display text about switching payment types)
  const forwardProjections = useMemo(() => calculateForwardProjections(), [calculateForwardProjections]);
  
  // Calculate savings based on comparison mode
  let interestSaved, timeSaved;
  // Variables for graph display - use correct values based on mode
  let graphRemainingInterest, graphRemainingInterestComparison;
  
  if (comparisonMode === 'extra-payments') {
    // For extra payments, compare the actual schedules (current implementation is correct)
    // Calculate remaining from actual schedules
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let interestPaidSoFar = 0;
    let interestPaidSoFarComparison = 0;
    let paymentsPassed = 0;
    let paymentsPassedComparison = 0;
    
    for (const payment of schedule) {
      const paymentDate = new Date(payment.date);
      paymentDate.setHours(0, 0, 0, 0);
      if (paymentDate <= today) {
        interestPaidSoFar = payment.totalInterest;
        paymentsPassed++;
      } else break;
    }
    
    for (const payment of comparisonCalc.schedule) {
      const paymentDate = new Date(payment.date);
      paymentDate.setHours(0, 0, 0, 0);
      if (paymentDate <= today) {
        interestPaidSoFarComparison = payment.totalInterest;
        paymentsPassedComparison++;
      } else break;
    }
    
    const totalInterestCurrent = schedule[schedule.length - 1]?.totalInterest || 0;
    const totalInterestComp = comparisonCalc.schedule[comparisonCalc.schedule.length - 1]?.totalInterest || 0;
    
    const remainingInterestCurrent = Math.max(0, totalInterestCurrent - interestPaidSoFar);
    const remainingInterestComp = Math.max(0, totalInterestComp - interestPaidSoFarComparison);
    
    const paymentsRemainingCurrent = Math.max(0, schedule.length - paymentsPassed);
    const paymentsRemainingComp = Math.max(0, comparisonCalc.schedule.length - paymentsPassedComparison);
    
    const remainingYearsCurrent = paymentsRemainingCurrent / (schedule.length / yearsToPayoff);
    const remainingYearsComp = paymentsRemainingComp / (comparisonCalc.schedule.length / comparisonCalc.yearsToPayoff);
    
    interestSaved = remainingInterestComp - remainingInterestCurrent;
    timeSaved = remainingYearsComp - remainingYearsCurrent;
    
    // Use the correctly calculated values for graphs
    graphRemainingInterest = remainingInterestCurrent;
    graphRemainingInterestComparison = remainingInterestComp;
  } else {
    // Comparing monthly vs biweekly - use ACTUAL calculation totals, not forward projections
    // This ensures graphs match the actual calculated values
    interestSaved = comparisonCalc.totalInterest - totalInterest;
    timeSaved = comparisonCalc.yearsToPayoff - yearsToPayoff;
    
    // Use actual total interest for graphs (not forward projections)
    graphRemainingInterest = totalInterest;
    graphRemainingInterestComparison = comparisonCalc.totalInterest;
  }

  const isExtraPaymentComparison = comparisonMode === 'extra-payments';

  // Chart data for balance over time
  // Memoized to avoid recalculating on every render
  const chartData = useMemo(() => schedule
    .filter((_, i) => i % Math.ceil(schedule.length / 100) === 0 || i === schedule.length - 1)
    .map(item => ({
      date: item.date,
      balance: item.balance,
      principal: loanAmount - item.balance,
      interest: item.totalInterest,
      cumulative: item.totalInterest + (loanAmount - item.balance)
    })), [schedule, loanAmount, oneTimePayments]);

  // Excel Export Handler
  // Memoized with useCallback to prevent recreation on every render
  const handleExportToExcel = useCallback(async () => {
    try {
      // Prepare primary mortgage data
      const primaryData = {
        homeValue,
        downPayment,
        loanAmount,
        interestRate,
        tenure,
        paymentAmount,
        totalInterest,
        totalPaid,
        endDate,
        schedule,
        chartData: chartData,
        paymentType,
        extraPaymentEnabled,
        extraPaymentAmount,
      };

      // Prepare investment property data (if applicable)
      let investmentData = undefined;
      if (propertyType === 'investment') {
        investmentData = {
          monthlyRent: monthlyRentInput.value,
          vacancyRate,
          effectiveMonthlyRent,
          propertyManagementPercent,
          maintenance: maintenanceInput.value,
          utilities: utilitiesInput.value,
          propertyAppreciationRate,
          monthlyCashFlow,
          annualCashFlow,
          cashOnCashReturn,
          capRate,
          breakEvenOccupancy,
          netOperatingIncome,
          totalOperatingExpenses,
          futureMonthlyRent5Year,
          futureMonthlyRent10Year,
          futureMonthlyRent15Year,
          primaryData,
        };
      }

      // Prepare compare loans data (if available)
      let compareLoansData = undefined;
      if (showScenarioComparison) {
        compareLoansData = {
          currentScenario: {
            homeValue,
            downPayment,
            interestRate,
            tenure,
            paymentType,
            loanAmount: currentScenarioBase.loanAmount,
            payment: currentScenarioBase.payment,
            totalInterest: currentScenarioBase.totalInterest,
            totalPaid: currentScenarioBase.totalPaid,
            tenureYears: currentScenarioBase.tenure,
          },
          scenarioB: {
            homeValue: scenarioB.homeValue,
            downPayment: scenarioB.downPayment,
            interestRate: scenarioB.interestRate,
            tenure: scenarioB.tenure,
            paymentType: scenarioB.paymentType,
            loanAmount: scenarioBCalc.loanAmount,
            payment: scenarioBCalc.payment,
            totalInterest: scenarioBCalc.totalInterest,
            totalPaid: scenarioBCalc.totalPaid,
            tenureYears: scenarioBCalc.tenure,
          },
          scenarioC: {
            homeValue: scenarioC.homeValue,
            downPayment: scenarioC.downPayment,
            interestRate: scenarioC.interestRate,
            tenure: scenarioC.tenure,
            paymentType: scenarioC.paymentType,
            loanAmount: scenarioCCalc.loanAmount,
            payment: scenarioCCalc.payment,
            totalInterest: scenarioCCalc.totalInterest,
            totalPaid: scenarioCCalc.totalPaid,
            tenureYears: scenarioCCalc.tenure,
          },
          comparisonBarData,
        };
      }

      // Prepare refinance data (if available)
      let refinanceDataExport = undefined;
      if (showRefinanceAnalysis) {
        const refinanceCalc = calculateRefinance();
        refinanceDataExport = {
          currentLoan: {
            remainingBalance: refinanceData.remainingBalance,
            currentRate: refinanceData.currentRate,
            currentPayment: refinanceCalc.currentPayment,
            currentMonthlyTotal: refinanceCalc.currentMonthlyTotal,
            currentTotalPayments: refinanceCalc.currentTotalPayments,
            currentTotalInterest: refinanceCalc.currentTotalInterest,
            remainingMonths: refinanceCalc.remainingMonths,
          },
          newLoan: {
            newRate: refinanceData.newRate,
            newPayment: refinanceCalc.newPayment,
            newMonthlyTotal: refinanceCalc.newMonthlyTotal,
            newTotalPayments: refinanceCalc.newTotalPayments,
            newTotalInterest: refinanceCalc.newTotalInterest,
            actualNewMonths: refinanceCalc.actualNewMonths,
            closingCosts: refinanceData.closingCosts,
            newTerm: refinanceData.newTerm,
          },
          savings: {
            monthlySavings: refinanceCalc.monthlySavings,
            totalSavings: refinanceCalc.totalSavings,
            interestSavings: refinanceCalc.interestSavings,
            breakEvenMonths: refinanceCalc.breakEvenMonths,
            breakEvenYears: refinanceCalc.breakEvenYears,
            timeDifference: refinanceCalc.timeDifference,
            worthIt: refinanceCalc.worthIt,
          },
        };
      }

      await exportToExcel(primaryData, investmentData, compareLoansData, refinanceDataExport);
      success('Excel export completed successfully!');
    } catch (error) {
      logger.error('Error exporting to Excel', error);
      showError(ERROR_MESSAGES.EXPORT_EXCEL_FAILED);
    }
  }, [
    homeValue, downPayment, loanAmount, interestRate, tenure, paymentAmount,
    totalInterest, totalPaid, endDate, schedule, chartData, paymentType,
    extraPaymentEnabled, extraPaymentAmount, propertyType, monthlyRentInput.value,
    vacancyRate, effectiveMonthlyRent, propertyManagementPercent, maintenanceInput.value,
    utilitiesInput.value, propertyAppreciationRate, monthlyCashFlow, annualCashFlow,
    cashOnCashReturn, capRate, breakEvenOccupancy, netOperatingIncome,
    totalOperatingExpenses, futureMonthlyRent5Year, futureMonthlyRent10Year,
    futureMonthlyRent15Year, showScenarioComparison, currentScenarioBase,
    scenarioBCalc, scenarioCCalc, scenarioB, scenarioC, showRefinanceAnalysis,
    refinanceCalc, refinanceData
  ]);

  // Export to PDF
  const handleExportToPDF = useCallback(() => {
    try {
      const currencySymbol = CURRENCY_DATA[selectedCurrency].symbol;
      exportToPDF({
        homeValue,
        downPayment,
        loanAmount,
        interestRate,
        tenure,
        paymentAmount,
        totalInterest,
        totalPaid,
        endDate,
        schedule,
        currency: currencySymbol,
        propertyTax: propertyTax > 0 ? propertyTax : undefined,
        insurance: homeInsurance > 0 ? homeInsurance : undefined,
      });
      success('PDF export completed successfully!');
    } catch (error) {
      logger.error('Error exporting to PDF', error);
      showError(ERROR_MESSAGES.EXPORT_PDF_FAILED);
    }
  }, [homeValue, downPayment, loanAmount, interestRate, tenure, paymentAmount, totalInterest, totalPaid, endDate, schedule, selectedCurrency, propertyTax, homeInsurance]);

  // Export to CSV (amortization schedule only)
  const handleExportToCSV = useCallback(() => {
    try {
      const headers = ['Payment #', 'Date', 'Payment', 'Principal', 'Interest', 'Balance', 'Total Interest'];
      const rows = schedule.map(item => [
        item.paymentNum.toString(),
        item.date,
        item.payment.toFixed(2),
        item.principal.toFixed(2),
        item.interest.toFixed(2),
        item.balance.toFixed(2),
        item.totalInterest.toFixed(2)
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `amortization-schedule-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      success('CSV export completed successfully!');
    } catch (error) {
      logger.error('Error exporting to CSV', error);
      showError(ERROR_MESSAGES.EXPORT_CSV_FAILED);
    }
  }, [schedule]);

  // Comparison bar chart data - showing REMAINING interest from today forward
  // Memoized to avoid recalculation on every render
  const comparisonBarData = useMemo(() => isExtraPaymentComparison
    ? [
        { 
          name: `Regular ${paymentType === 'monthly' ? 'Monthly' : 'Bi-weekly'}`, 
          interest: graphRemainingInterestComparison,
          type: 'comparison',
          label: `Regular ${paymentType === 'monthly' ? 'Monthly' : 'Bi-weekly'} Payments`,
          endDate: formatDate(comparisonCalc.endDate)
        },
        { 
          name: `With Extra Payments`, 
          interest: graphRemainingInterest,
          type: 'primary',
          label: 'With Extra Payments',
          endDate: formatDate(endDate)
        }
      ]
    : [
        { 
          name: 'Monthly Payments',
          interest: paymentType === 'monthly' ? graphRemainingInterest : graphRemainingInterestComparison,
          type: 'monthly',
          label: 'Monthly Payments',
          endDate: formatDate(paymentType === 'monthly' ? endDate : comparisonCalc.endDate)
        },
        {
          name: 'Bi-weekly Payments',
          interest: paymentType === 'biweekly' ? graphRemainingInterest : graphRemainingInterestComparison,
          type: 'biweekly',
          label: 'Bi-weekly Payments',
          endDate: formatDate(paymentType === 'biweekly' ? endDate : comparisonCalc.endDate)
        }
      ], [isExtraPaymentComparison, paymentType, graphRemainingInterest, graphRemainingInterestComparison, comparisonCalc.endDate, endDate, oneTimePayments]);

  return (
    <div key={`currency-${currencyRenderKey}`} className="min-h-screen bg-gray-50 p-1 sm:p-2 md:p-4 relative overflow-hidden">
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />

      {/* Social Proof Banner */}
      {/* <SocialProofBanner /> */}
      
      {/* Email Capture Modal */}
      <EmailCaptureModal
        isOpen={showEmailCapture}
        onClose={() => setShowEmailCapture(false)}
        calculationSummary={{
          loanAmount,
          monthlyPayment: paymentAmount,
          totalInterest,
          totalPaid,
          yearsToPayoff,
          paymentType: paymentType
        }}
      />
      
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-transparent via-slate-400 to-transparent mx-auto mb-2 sm:mb-3 animate-slideIn"></div>
        
        {/* Property Type Toggle and Heading */}
        <div className="mb-3 sm:mb-4 animate-slideDown">
          {/* Back to Home Link and Auth Buttons */}
          <div className="flex justify-between items-center mb-3 px-2">
            <Link 
              to="/" 
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Home</span>
            </Link>
            
            {!currentUser && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all flex items-center gap-1 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg"
                >
                  <span className="hidden sm:inline">Login</span>
                  <span className="sm:hidden">Login</span>
                </button>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1 text-xs sm:text-sm font-semibold"
                >
                  <span className="hidden sm:inline">Sign Up</span>
                  <span className="sm:hidden">Sign Up</span>
                </button>
              </div>
            )}
          </div>

          {/* Save/Update Mortgage Confirmation Modal */}
          {showSaveMortgageModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {selectedMortgageId ? 'Update Mortgage Tracker?' : 'Save & Track This Mortgage?'}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  {selectedMortgageId 
                    ? 'Update the selected mortgage with the current values. Changes will be reflected in the tracker below.'
                    : 'Save this mortgage to track it over time. You can view all your saved mortgages in the tracker below.'}
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mortgage Name
                  </label>
                  <input
                    type="text"
                    value={newMortgageName}
                    onChange={(e) => setNewMortgageName(e.target.value)}
                    placeholder="e.g., Primary Home, Investment Property"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newMortgageName.trim()) {
                        handleSaveCurrentMortgage();
                      } else if (e.key === 'Escape') {
                        setShowSaveMortgageModal(false);
                        if (!selectedMortgageId) {
                          setNewMortgageName('');
                        }
                      }
                    }}
                    autoFocus
                  />
                  {selectedMortgageId && (
                    <p className="text-xs text-slate-500 mt-1">
                      Note: A mortgage with the same name cannot exist. The selected mortgage will be updated with the current values.
                    </p>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowSaveMortgageModal(false);
                      if (!selectedMortgageId) {
                        setNewMortgageName('');
                      }
                    }}
                    className="px-4 py-2 text-sm font-semibold bg-slate-400 hover:bg-slate-500 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCurrentMortgage}
                    disabled={!newMortgageName.trim()}
                    className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedMortgageId ? 'Confirm & Update' : 'Confirm & Save'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Centered Heading */}
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif font-bold text-slate-800 tracking-tight animate-fadeIn text-center px-2 mb-3">
            Free Mortgage Calculator: Investment Property, Bi-Weekly & Loan Comparison
          </h1>
          
          {/* Toggle and Currency Selector */}
          <div className="mb-3">
            {/* Toggle and Currency - Responsive Layout */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
              {/* Toggle - Centered on mobile, left on desktop */}
              <div className="flex justify-center sm:justify-start flex-1">
            <div className="bg-white rounded-lg shadow-md p-0.5 flex gap-0.5 border border-slate-200">
              <button
                onClick={() => setPropertyType('primary')}
                className={`
                  flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md font-semibold text-xs sm:text-sm transition-all duration-300
                  ${propertyType === 'primary' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }
                `}
              >
                <span className="text-sm sm:text-base" aria-label="Home icon">🏠</span>
                <span>Primary</span>
              </button>
              <button
                onClick={() => setPropertyType('investment')}
                className={`
                  flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md font-semibold text-xs sm:text-sm transition-all duration-300
                  ${propertyType === 'investment' 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }
                `}
              >
                <span className="text-sm sm:text-base" aria-label="Building icon">🏢</span>
                <span>Investment</span>
              </button>
              </div>
            </div>
            
              {/* Currency Selector - Below toggle on mobile, right side on desktop */}
              <div className="flex justify-center sm:justify-end">
              <CurrencySelector 
                selectedCurrency={selectedCurrency}
                onCurrencyChange={setSelectedCurrency}
              />
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 sm:gap-3">
          {/* Loan Details - Takes 2 columns (40% width) on desktop, full width on mobile */}
          <div className="lg:col-span-2">
            <div className={CARD_STYLE} style={{ ...CARD_SHADOW }}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-transparent rounded-bl-full"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-indigo-400/20 to-transparent rounded-tr-full"></div>
              
              <div className="relative p-3 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-serif text-slate-800 tracking-wide border-b-2 border-gradient-to-r from-blue-400 to-slate-300 pb-1.5 font-bold relative" style={{ borderImage: 'linear-gradient(to right, rgb(96, 165, 250), rgb(203, 213, 225)) 1' }}>
                    Loan Details
                    <div className="absolute -bottom-0.5 left-0 w-12 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse"></div>
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowScenarioComparison(!showScenarioComparison)}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs transition-all duration-200 whitespace-nowrap border-2 shadow-sm
                        ${showScenarioComparison
                          ? 'bg-purple-600 text-white border-purple-700 shadow-md'
                          : 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100 hover:border-purple-400'
                        }
                      `}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Compare Loans</span>
                    </button>
                    <button
                      onClick={() => setShowRefinanceAnalysis(!showRefinanceAnalysis)}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs transition-all duration-200 whitespace-nowrap border-2 shadow-sm
                        ${showRefinanceAnalysis
                          ? 'bg-orange-600 text-white border-orange-700 shadow-md'
                          : 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100 hover:border-orange-400'
                        }
                      `}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Refi Calculator</span>
                    </button>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider" style={{ color: '#334155' }}>
                    Home Value
                  </label>
                    {/* Saved Mortgages Dropdown */}
                    {currentUser && savedMortgages.length > 0 && (
                      <select
                        value={selectedMortgageId || ''}
                        onChange={(e) => {
                          const mortgageId = e.target.value;
                          if (mortgageId) {
                            const mortgage = savedMortgages.find(m => m.id === mortgageId);
                            if (mortgage) {
                              handleLoadMortgage(mortgage);
                            }
                          } else {
                            setSelectedMortgageId(null);
                            setNewMortgageName(''); // Clear name when selecting "New Mortgage"
                          }
                        }}
                        className="px-2 py-1 text-xs font-semibold bg-white border-2 border-blue-300 rounded-md text-blue-700 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="">New Mortgage</option>
                        {savedMortgages.map((mortgage) => (
                          <option key={mortgage.id} value={mortgage.id}>
                            {mortgage.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={homeValueInput.displayValue}
                    onChange={(e) => homeValueInput.handleChange(e.target.value)}
                    onFocus={homeValueInput.handleFocus}
                    onBlur={homeValueInput.handleBlur}
                    className={INPUT_STYLE}
                    style={{ overflow: 'visible' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider" style={{ color: '#334155' }}>
                    Down Payment
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={downPaymentInput.displayValue}
                        onChange={(e) => downPaymentInput.handleChange(e.target.value)}
                        onFocus={downPaymentInput.handleFocus}
                        onBlur={downPaymentInput.handleBlur}
                        className={INPUT_STYLE}
                        style={{ overflow: 'visible' }}
                        placeholder="Amount"
                      />
                    </div>
                    <div className="text-blue-400 text-lg font-light">|</div>
                    <div className="flex-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editingDownPaymentPercent 
                          ? rawDownPaymentPercent
                          : ((downPayment / homeValue) * 100).toFixed(1)}
                        onChange={(e) => {
                          setEditingDownPaymentPercent(true);
                          const cleaned = e.target.value.replace(/,/g, '');
                          setRawDownPaymentPercent(cleaned);
                          if (cleaned && /^\d*\.?\d*$/.test(cleaned)) {
                            const percent = Number(cleaned);
                            if (!isNaN(percent) && percent >= 0 && percent <= 100) {
                              downPaymentInput.setValue((homeValue * percent) / 100);
                            }
                          }
                        }}
                        onFocus={() => {
                          setEditingDownPaymentPercent(true);
                          setRawDownPaymentPercent(((downPayment / homeValue) * 100).toFixed(1));
                        }}
                        onBlur={() => {
                          setEditingDownPaymentPercent(false);
                          setRawDownPaymentPercent('');
                        }}
                        className={INPUT_STYLE}
                        style={{ overflow: 'visible' }}
                        placeholder="%"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider" style={{ color: '#334155' }}>
                    <span>Interest Rate (%)</span>
                    <button
                      type="button"
                      onClick={() => setShowCurrentRates(!showCurrentRates)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 normal-case tracking-normal flex items-center gap-1 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      {showCurrentRates ? 'Hide' : 'Show'} Current Rates
                    </button>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={interestRateInput.displayValue}
                    onChange={(e) => interestRateInput.handleChange(e.target.value)}
                    onFocus={interestRateInput.handleFocus}
                    onBlur={interestRateInput.handleBlur}
                    className={INPUT_STYLE}
                    style={{ overflow: 'visible' }}
                  />
                  
                  {/* Current Mortgage Rates - Collapsible */}
                  {showCurrentRates && (
                    <div className="mt-2 animate-slideDown">
                      <CurrentRatesDisplay 
                        currency={selectedCurrency}
                        onApplyRate={(rate) => {
                          interestRateInput.setValue(rate);
                          setShowCurrentRates(false); // Auto-close after selection
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider" style={{ color: '#334155' }}>
                    Loan Tenure (Years)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tenureInput.displayValue}
                    onChange={(e) => tenureInput.handleChange(e.target.value)}
                    onFocus={tenureInput.handleFocus}
                    onBlur={tenureInput.handleBlur}
                    className={INPUT_STYLE}
                    style={{ overflow: 'visible' }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="flex items-center text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider" style={{ color: '#334155' }}>
                      Payment Frequency
                      <HelpTooltip content="Choose between monthly (12 payments/year) or bi-weekly (26 payments/year) schedules. Bi-weekly results in one extra monthly payment per year, helping pay off your mortgage faster." />
                    </label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                      className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm bg-white shadow-sm hover:shadow-md hover:border-blue-300"
                      style={{ overflow: 'visible' }}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="biweekly">Bi-weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider" style={{ color: '#334155' }}>
                      Start Date
                    </label>
                    <DatePicker
                      value={startDate}
                      onChange={setStartDate}
                      className={INPUT_STYLE}
                    />
                  </div>
                </div>

                {/* Recurring Extra Payments */}
                <div className="pt-2 border-t-2 border-slate-200 bg-gradient-to-br from-emerald-50/40 to-green-50/30 rounded-lg p-3 border-l-4 border-l-emerald-400">
                  <div className="mb-2">
                    <label className="flex items-center text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer" style={{ color: '#334155' }}>
                      <input
                        type="checkbox"
                        checked={extraPaymentEnabled}
                        onChange={(e) => setExtraPaymentEnabled(e.target.checked)}
                        className="mr-2 w-4 h-4 text-emerald-600 border-emerald-300 rounded focus:ring-emerald-500"
                      />
                      Recurring Extra Payments
                      <HelpTooltip content="Make additional payments on a regular schedule to pay off your mortgage faster and save on interest." />
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 pl-4 border-l border-emerald-200 mb-0">
                    <div className="min-w-[110px]">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Start Date
                      </label>
                      <DatePicker
                        value={extraPaymentStartDate}
                        onChange={setExtraPaymentStartDate}
                        disabled={!extraPaymentEnabled}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors text-xs disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Frequency
                      </label>
                      <select
                        value={extraPaymentFrequency}
                        onChange={(e) => setExtraPaymentFrequency(e.target.value)}
                        disabled={!extraPaymentEnabled}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors text-xs disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="biweekly">Bi-weekly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Amount
                      </label>
                      <input
                        type="text"
                        value={extraPaymentAmountInput.displayValue}
                        onChange={(e) => extraPaymentAmountInput.handleChange(e.target.value)}
                        onFocus={extraPaymentAmountInput.handleFocus}
                        onBlur={extraPaymentAmountInput.handleBlur}
                        disabled={!extraPaymentEnabled}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors text-xs disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* One-Time Extra Payments */}
                <div className="pt-2 border-t-2 border-slate-200 bg-gradient-to-br from-emerald-50/40 to-green-50/30 rounded-lg p-3 border-l-4 border-l-emerald-400">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center text-xs font-semibold text-slate-700 uppercase tracking-wider" style={{ color: '#334155' }}>
                      One-Time Extra Payments
                      <HelpTooltip content="Add one-time payments at specific dates (e.g., bonus, tax refund) to reduce your principal and save on interest." />
                    </label>
                    <button
                      onClick={() => {
                        // Convert startDate from YYYY-MM-DD to YYYY-MM for calculations
                        const [year, month] = startDate.split('-');
                        const dateYYYYMM = `${year}-${month}`;
                        setOneTimePayments([...oneTimePayments, { id: Date.now().toString(), date: dateYYYYMM, amount: 0 }]);
                      }}
                      className="text-xs bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 px-3 py-1 rounded-lg hover:from-emerald-200 hover:to-green-200 shadow-md hover:shadow-lg transition-all font-bold border-2 border-emerald-300"
                    >
                      + Add Payment
                    </button>
                  </div>

                  {oneTimePayments.length > 0 && (
                    <div className="space-y-2 pl-4 border-l border-emerald-200">
                      {oneTimePayments.map((payment, index) => (
                        <div key={payment.id} className="grid grid-cols-3 gap-2">
                          <div className="min-w-[110px]">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Date
                            </label>
                            <DatePicker
                              value={payment.date.length === 7 ? `${payment.date}-01` : payment.date}
                              onChange={(newDate) => {
                                const updated = [...oneTimePayments];
                                // Convert YYYY-MM-DD to YYYY-MM for calculations
                                const [year, month] = newDate.split('-');
                                updated[index].date = `${year}-${month}`;
                                setOneTimePayments(updated);
                              }}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Amount
                            </label>
                            <input
                              type="text"
                              value={payment.amount === 0 ? '' : payment.amount.toLocaleString()}
                              onChange={(e) => {
                                const cleaned = e.target.value.replace(/,/g, '');
                                if (cleaned === '' || cleaned === '-') {
                                  const updated = [...oneTimePayments];
                                  updated[index].amount = 0;
                                  setOneTimePayments(updated);
                                } else if (/^\d*\.?\d*$/.test(cleaned)) {
                                  const num = Number(cleaned);
                                  if (!isNaN(num) && num >= 0) {
                                    const updated = [...oneTimePayments];
                                    updated[index].amount = num;
                                    setOneTimePayments(updated);
                                  }
                                }
                              }}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors text-xs"
                              placeholder={`${CURRENCY_DATA[selectedCurrency].symbol}0`}
                            />
                          </div>
                          <div>
                            <button
                              onClick={() => {
                                setOneTimePayments(oneTimePayments.filter(p => p.id !== payment.id));
                              }}
                              className="w-full text-xs bg-gradient-to-r from-rose-100 to-red-100 text-rose-700 px-3 py-1.5 rounded-lg hover:from-rose-200 hover:to-red-200 shadow-md hover:shadow-lg transition-all font-bold border-2 border-rose-300 mt-5"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional Housing Costs - For Both Primary & Investment */}
                <div className={`pt-2 border-t-2 border-slate-200 rounded-lg p-3 border-l-4 ${
                  propertyType === 'investment' 
                    ? 'bg-gradient-to-br from-green-50/40 to-emerald-50/30 border-l-green-400' 
                    : 'bg-gradient-to-br from-blue-50/40 to-sky-50/30 border-l-blue-400'
                }`}>
                  <button
                    onClick={() => setShowAdditionalCosts(!showAdditionalCosts)}
                    className={`w-full flex items-center justify-between text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer transition-colors ${
                      propertyType === 'investment' ? 'hover:text-green-600' : 'hover:text-blue-600'
                    }`}
                    style={{ color: '#334155' }}
                  >
                    <span className="flex items-center">
                      <ChevronDown 
                        size={16} 
                        className={`mr-1 transition-transform duration-300 ${showAdditionalCosts ? 'rotate-180' : ''}`}
                      />
                      {propertyType === 'investment' ? 'Include Additional Property Costs' : 'Include Additional Housing Costs'}
                      <HelpTooltip content={
                        propertyType === 'investment' 
                          ? "Add property tax, insurance, and HOA fees. These costs are included in your cash flow calculation." 
                          : "Add property tax, insurance, PMI, and HOA fees to see your true monthly housing cost."
                      } />
                    </span>
                    <span className={`text-xs font-bold ${
                      totalMonthlyCosts > 0 
                        ? (propertyType === 'investment' ? 'text-green-600' : 'text-blue-600')
                        : 'text-slate-400'
                    }`}>
                      {totalMonthlyCosts > 0 ? `+${formatCurrency(totalMonthlyCosts)}/mo` : 'Optional'}
                    </span>
                  </button>

                  {showAdditionalCosts && (
                    <div className={`mt-3 space-y-3 pl-4 border-l animate-slideDown ${
                      propertyType === 'investment' ? 'border-green-200' : 'border-blue-200'
                    }`}>
                      {/* Property Tax */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Property Tax
                          </label>
                          <input
                            type="text"
                            value={propertyTax || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, '');
                              setPropertyTax(val === '' ? 0 : Number(val));
                            }}
                            className={INPUT_STYLE}
                            placeholder={`${CURRENCY_DATA[selectedCurrency].symbol}0`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Period
                          </label>
                          <select
                            value={propertyTaxPeriod}
                            onChange={(e) => setPropertyTaxPeriod(e.target.value as 'year' | 'month')}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors text-xs"
                          >
                            <option value="year">Per Year</option>
                            <option value="month">Per Month</option>
                          </select>
                        </div>
                      </div>

                      {/* Home Insurance */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Home Insurance
                          </label>
                          <input
                            type="text"
                            value={homeInsurance || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, '');
                              setHomeInsurance(val === '' ? 0 : Number(val));
                            }}
                            className={INPUT_STYLE}
                            placeholder={`${CURRENCY_DATA[selectedCurrency].symbol}0`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Period
                          </label>
                          <select
                            value={homeInsurancePeriod}
                            onChange={(e) => setHomeInsurancePeriod(e.target.value as 'year' | 'month')}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors text-xs"
                          >
                            <option value="year">Per Year</option>
                            <option value="month">Per Month</option>
                          </select>
                        </div>
                      </div>

                      {/* PMI */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          PMI (Private Mortgage Insurance)
                          {downPayment / homeValue < 0.2 && (
                            <span className="ml-1 text-xs text-amber-600 font-semibold">(Auto-calculated)</span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={pmiAmount || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            setPmiAmount(val === '' ? 0 : Number(val));
                          }}
                          className={INPUT_STYLE}
                          placeholder={`${CURRENCY_DATA[selectedCurrency].symbol}0/month`}
                        />
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {downPayment / homeValue < 0.2 
                            ? 'Required when down payment < 20%. You can override the auto-calculated amount.'
                            : 'Not required (down payment ≥ 20%)'}
                        </p>
                      </div>

                      {/* HOA Fees */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          HOA Fees (Monthly)
                        </label>
                        <input
                          type="text"
                          value={hoaFees || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            setHoaFees(val === '' ? 0 : Number(val));
                          }}
                          className={INPUT_STYLE}
                          placeholder={`${CURRENCY_DATA[selectedCurrency].symbol}0/month`}
                        />
                      </div>

                      {/* Monthly Summary */}
                      {totalMonthlyCosts > 0 && (
                        <div className="pt-2 border-t border-slate-200">
                          <div className={`rounded-lg p-2 border-2 ${
                            propertyType === 'investment' 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-blue-50 border-blue-200'
                          }`}>
                            <div className="text-xs text-slate-600 space-y-0.5">
                              <div className="flex justify-between">
                                <span>Property Tax:</span>
                                <span className="font-semibold">{formatCurrency(monthlyPropertyTax)}/mo</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Insurance:</span>
                                <span className="font-semibold">{formatCurrency(monthlyInsurance)}/mo</span>
                              </div>
                              {pmiAmount > 0 && (
                                <div className="flex justify-between">
                                  <span>PMI:</span>
                                  <span className="font-semibold">{formatCurrency(pmiAmount)}/mo</span>
                                </div>
                              )}
                              {hoaFees > 0 && (
                                <div className="flex justify-between">
                                  <span>HOA Fees:</span>
                                  <span className="font-semibold">{formatCurrency(hoaFees)}/mo</span>
                                </div>
                              )}
                              <div className={`flex justify-between pt-1 border-t font-bold ${
                                propertyType === 'investment' 
                                  ? 'border-green-300 text-green-700' 
                                  : 'border-blue-300 text-blue-700'
                              }`}>
                                <span>Total Add-On Costs:</span>
                                <span>{formatCurrency(totalMonthlyCosts)}/mo</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Save/Update Mortgage Button - Always visible, prompts login if not signed in */}
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <button
                        onClick={() => {
                        if (!currentUser) {
                          setShowLoginModal(true);
                          return;
                        }
                          if (selectedMortgageId) {
                            // If a mortgage is selected, pre-fill the name
                            const selectedMortgage = savedMortgages.find(m => m.id === selectedMortgageId);
                            if (selectedMortgage) {
                              setNewMortgageName(selectedMortgage.name);
                            }
                          } else {
                            setNewMortgageName('');
                          }
                          setShowSaveMortgageModal(true);
                        }}
                        className="w-full px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <Home className="w-4 h-4" />
                      {currentUser && selectedMortgageId ? 'Update Tracker' : 'Save & Track This Mortgage'}
                      </button>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Payment Summary, Cost Breakdown, and Comparison - Compact */}
          <div className="lg:col-span-3 space-y-2">
            {/* Payment Summary OR Investment Analysis (Full Width for Investment) - Compact */}
            <div className={propertyType === 'investment' ? '' : 'grid grid-cols-1 sm:grid-cols-2 gap-2'}>
              {propertyType === 'primary' ? (
                <>
                  {/* Primary Home - Payment Summary - Compact */}
                  <div className={CARD_STYLE} style={CARD_SHADOW}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-xl pointer-events-none"></div>
                    <div className="relative p-2">
                      <h2 className="text-sm font-serif text-slate-800 mb-1.5 tracking-wide border-b-2 pb-1 font-bold relative" style={{ borderImage: 'linear-gradient(to right, rgb(148, 163, 184), rgb(203, 213, 225)) 1' }}>
                        Payment Summary
                        <div className="absolute -bottom-0.5 left-0 w-10 h-0.5 bg-gradient-to-r from-slate-500 to-gray-500"></div>
                      </h2>
                      <table className="w-full text-[11px]">
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="py-1 px-1 text-slate-700">Loan Amount</td>
                            <td className="py-1 px-1 text-right font-semibold text-slate-900">{formatCurrency(loanAmount)}</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-1 px-1 text-slate-700">Payment</td>
                            <td className="py-1 px-1 text-right font-semibold text-slate-900">{formatCurrency(paymentAmount)}</td>
                          </tr>
                          {totalMonthlyCosts > 0 && (
                              <tr className="border-b-2 border-blue-300 bg-blue-50">
                              <td className="py-1 px-1 text-slate-800 font-bold text-[10px]">Total Monthly</td>
                              <td className="py-1 px-1 text-right font-bold text-blue-700">{formatCurrency(trueMonthlyPayment)}</td>
                              </tr>
                          )}
                          <tr>
                            <td className="py-1 px-1 text-slate-700 text-[10px]">Paid / Term</td>
                            <td className="py-1 px-1 text-right font-semibold text-slate-900 text-[10px]">{formatCurrency(totalPaid)} / {formatYearsMonths(yearsToPayoff)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Primary Home - Cost Breakdown - Compact */}
                  <div className={CARD_STYLE} style={CARD_SHADOW}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-xl pointer-events-none"></div>
                    <div className="relative p-2">
                      <h2 className="text-sm font-serif text-slate-800 mb-1.5 tracking-wide border-b-2 pb-1 font-bold relative flex items-center" style={{ borderImage: 'linear-gradient(to right, rgb(148, 163, 184), rgb(203, 213, 225)) 1' }}>
                        Cost Breakdown
                        <HelpTooltip content="Shows how your total payment is divided between the actual loan amount (principal) and the cost of borrowing (interest)." />
                        <div className="absolute -bottom-0.5 left-0 w-10 h-0.5 bg-gradient-to-r from-slate-500 to-gray-500"></div>
                      </h2>
                      <div className="flex flex-row gap-2 mb-2">
                    <div className="flex-1 bg-gradient-to-br from-emerald-50/80 to-green-100/80 rounded-lg p-2 border-2 border-emerald-300/60 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 hover:border-emerald-400 backdrop-blur-sm relative overflow-hidden group/card">
                      <div className="relative text-center">
                        <div className="text-base font-serif font-bold text-emerald-700 mb-0.5">
                          {((loanAmount / totalPaid) * 100).toFixed(0)}%
                        </div>
                        <div className="text-[10px] text-emerald-600 uppercase tracking-wide font-medium">
                          Principal
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                          {formatCurrency(loanAmount)}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 bg-gradient-to-br from-red-50/80 to-rose-100/80 rounded-lg p-2 border-2 border-red-300/60 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 hover:border-red-400 backdrop-blur-sm relative overflow-hidden group/card">
                      <div className="relative text-center">
                        <div className="text-base font-serif font-bold text-red-700 mb-0.5">
                          {((totalInterest / totalPaid) * 100).toFixed(0)}%
                        </div>
                        <div className="text-[10px] text-red-600 uppercase tracking-wide font-medium">
                          Interest
                        </div>
                        <div className="text-[10px] text-red-700 font-semibold mt-0.5">
                          {formatCurrency(totalInterest)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Visual Breakdown Bar - Compact */}
                  <div className="mt-1.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-slate-600">Total Payment</span>
                      <span className="text-xs font-bold text-slate-800">{formatCurrency(totalPaid)}</span>
                    </div>
                    <div 
                      className="flex h-6 rounded-lg overflow-hidden shadow-inner border-2 border-slate-200"
                      role="img"
                      aria-label={`Mortgage cost breakdown: ${((loanAmount / totalPaid) * 100).toFixed(0)}% principal (${formatCurrency(loanAmount)}) and ${((totalInterest / totalPaid) * 100).toFixed(0)}% interest (${formatCurrency(totalInterest)}) of total payment ${formatCurrency(totalPaid)}`}
                    >
                      <div 
                        className="bg-gradient-to-r from-emerald-400 to-emerald-500 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
                        style={{ width: `${((loanAmount / totalPaid) * 100).toFixed(1)}%` }}
                        aria-label={`Principal: ${((loanAmount / totalPaid) * 100).toFixed(0)}% or ${formatCurrency(loanAmount)}`}
                      >
                        {((loanAmount / totalPaid) * 100).toFixed(0)}%
                      </div>
                      <div 
                        className="bg-gradient-to-r from-red-400 to-red-500 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
                        style={{ width: `${((totalInterest / totalPaid) * 100).toFixed(1)}%` }}
                        aria-label={`Interest: ${((totalInterest / totalPaid) * 100).toFixed(0)}% or ${formatCurrency(totalInterest)}`}
                      >
                        {((totalInterest / totalPaid) * 100).toFixed(0)}%
                      </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Investment Property - Combined Card */}
                  <div className={`${CARD_STYLE} grid grid-cols-2 gap-3`} style={CARD_SHADOW}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-xl pointer-events-none"></div>
                    
                    {/* Left: Rental Income Inputs */}
                    <div className="relative p-3 border-r-2 border-slate-100">
                      <h2 className="text-sm font-serif text-slate-800 mb-2 tracking-wide border-b-2 pb-1.5 font-bold relative flex items-center gap-1" style={{ borderImage: 'linear-gradient(to right, rgb(34, 197, 94), rgb(16, 185, 129)) 1' }}>
                        <span className="text-base">💵</span>
                        <span className="text-xs">Rental Income & Expenses</span>
                        <div className="absolute -bottom-0.5 left-0 w-10 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                      </h2>
                      <div className="space-y-1.5">
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-700 mb-0.5">Monthly Rent</label>
                          <input
                            type="text"
                            value={monthlyRentInput.displayValue}
                            onChange={(e) => monthlyRentInput.handleChange(e.target.value)}
                            onBlur={monthlyRentInput.handleBlur}
                            onFocus={monthlyRentInput.handleFocus}
                            className="w-full px-2 py-1 border-2 border-green-200 rounded-md focus:ring-1 focus:ring-green-400 focus:border-green-400 text-[10px]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="block text-[9px] font-semibold text-slate-700 mb-0.5 flex items-center gap-0.5">
                              Vacancy <HelpTooltip content="Typical: 5-10%" />
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={vacancyRate}
                                onChange={(e) => setVacancyRate(Number(e.target.value))}
                                min="0"
                                max="100"
                                step="0.5"
                                className="w-full px-2 py-1 border-2 border-green-200 rounded-md focus:ring-1 focus:ring-green-400 text-[10px]"
                              />
                              <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-slate-500 text-[9px]">%</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9px] font-semibold text-slate-700 mb-0.5 flex items-center gap-0.5">
                              Mgmt Fee <HelpTooltip content="Typical: 8-12%" />
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={propertyManagementPercent}
                                onChange={(e) => setPropertyManagementPercent(Number(e.target.value))}
                                min="0"
                                max="20"
                                step="0.5"
                                className="w-full px-2 py-1 border-2 border-green-200 rounded-md focus:ring-1 focus:ring-green-400 text-[10px]"
                              />
                              <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-slate-500 text-[9px]">%</span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="block text-[9px] font-semibold text-slate-700 mb-0.5">Maintenance</label>
                            <input
                              type="text"
                              value={maintenanceInput.displayValue}
                              onChange={(e) => maintenanceInput.handleChange(e.target.value)}
                              onBlur={maintenanceInput.handleBlur}
                              onFocus={maintenanceInput.handleFocus}
                              className="w-full px-2 py-1 border-2 border-green-200 rounded-md focus:ring-1 focus:ring-green-400 text-[10px]"
                              placeholder="$500"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-semibold text-slate-700 mb-0.5">Utilities</label>
                            <input
                              type="text"
                              value={utilitiesInput.displayValue}
                              onChange={(e) => utilitiesInput.handleChange(e.target.value)}
                              onBlur={utilitiesInput.handleBlur}
                              onFocus={utilitiesInput.handleFocus}
                              className="w-full px-2 py-1 border-2 border-green-200 rounded-md focus:ring-1 focus:ring-green-400 text-[10px]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-700 mb-0.5">Rental Growth Rate</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={propertyAppreciationRate}
                              onChange={(e) => setPropertyAppreciationRate(Number(e.target.value))}
                              min="0"
                              max="20"
                              step="0.1"
                              className="w-full px-2 py-1 border-2 border-green-200 rounded-md focus:ring-1 focus:ring-green-400 text-[10px]"
                            />
                            <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-slate-500 text-[9px]">%/yr</span>
                          </div>
                        </div>
                        <div className="p-1.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-md border border-green-300 mt-2">
                          <p className="text-[9px] text-slate-600">Effective Rent:</p>
                          <p className="text-xs font-bold text-green-700">
                            {formatCurrency(monthlyRentInput.value * (1 - vacancyRate / 100))}/mo
                          </p>
                        </div>
                        
                        {/* Rental Income Projections */}
                        <div className="mt-3 pt-2 border-t border-green-200">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[9px] font-semibold text-slate-700 flex items-center gap-1">
                              <span aria-label="Chart icon">📊</span> Rental Projections
                              <HelpTooltip content={`Based on ${propertyAppreciationRate}% annual rental growth`} />
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <div className="p-1.5 rounded-md border border-green-200 bg-green-50/50">
                              <div className="text-[7px] text-slate-600 mb-0.5">5Y</div>
                              <div className="text-[10px] font-bold text-green-700">{formatCurrencyCompact(futureMonthlyRent5Year)}/mo</div>
                              <div className="text-[7px] text-slate-500 mt-0.5">+{formatCurrencyCompact(rentIncrease5Year)}</div>
                            </div>
                            <div className="p-1.5 rounded-md border border-green-300 bg-green-50">
                              <div className="text-[7px] text-slate-600 mb-0.5">10Y</div>
                              <div className="text-[10px] font-bold text-green-700">{formatCurrencyCompact(futureMonthlyRent10Year)}/mo</div>
                              <div className="text-[7px] text-slate-500 mt-0.5">+{formatCurrencyCompact(rentIncrease10Year)}</div>
                            </div>
                            <div className="p-1.5 rounded-md border border-green-400 bg-green-100/50">
                              <div className="text-[7px] text-slate-600 mb-0.5">15Y</div>
                              <div className="text-[10px] font-bold text-green-700">{formatCurrencyCompact(futureMonthlyRent15Year)}/mo</div>
                              <div className="text-[7px] text-slate-500 mt-0.5">+{formatCurrencyCompact(rentIncrease15Year)}</div>
                            </div>
                          </div>
                          <div className="mt-1 text-[7px] text-slate-500 text-center">
                            Growth: {propertyAppreciationRate}%/yr
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Investment Analysis KPIs */}
                    <div className="relative p-3">
                      <h2 className="text-sm font-serif text-slate-800 mb-2 tracking-wide border-b-2 pb-1.5 font-bold relative flex items-center gap-1" style={{ borderImage: 'linear-gradient(to right, rgb(34, 197, 94), rgb(16, 185, 129)) 1' }}>
                        <span className="text-base">💰</span>
                        <span className="text-xs">Investment Analysis</span>
                        <div className="absolute -bottom-0.5 left-0 w-10 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                      </h2>
                      
                      {/* Payment Details - Top Row */}
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="p-2 rounded-lg border-2 bg-blue-50 border-blue-300">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-semibold text-slate-700">Base Payment</span>
                            <span className="text-sm font-bold text-blue-700 mt-0.5">
                              {formatCurrency(paymentAmount)}
                            </span>
                            <span className="text-[8px] text-slate-600">{paymentType === 'monthly' ? 'Monthly' : 'Bi-weekly'}</span>
                          </div>
                        </div>
                        
                        {totalMonthlyCosts > 0 && (
                          <div className="p-2 rounded-lg border-2 bg-purple-50 border-purple-300">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-semibold text-slate-700">With Add'l Costs</span>
                              <span className="text-sm font-bold text-purple-700 mt-0.5">
                                {formatCurrency(paymentType === 'monthly' ? trueMonthlyPayment : paymentAmount + totalMonthlyCosts / 2)}
                              </span>
                              <span className="text-[8px] text-slate-600">+{formatCurrency(totalMonthlyCosts)}/mo</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Investment KPIs */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Cash Flow */}
                        <div className={`p-2 rounded-lg border-2 ${monthlyCashFlow >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-semibold text-slate-700 flex items-center gap-0.5">
                              Cash Flow <HelpTooltip content="Monthly profit after all expenses" />
                            </span>
                            <span className={`text-sm font-bold mt-0.5 ${monthlyCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              {formatCurrency(monthlyCashFlow)}
                            </span>
                            <span className="text-[8px] text-slate-600">Annual: {formatCurrencyCompact(annualCashFlow)}</span>
                          </div>
                        </div>
                        
                        {/* CoC Return */}
                        <div className="p-2 rounded-lg border-2 bg-blue-50 border-blue-300">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-semibold text-slate-700 flex items-center gap-0.5">
                              CoC Return <HelpTooltip content="Annual return on down payment" />
                            </span>
                            <span className="text-sm font-bold text-blue-700 mt-0.5">
                              {cashOnCashReturn.toFixed(1)}%
                            </span>
                            <span className="text-[8px] text-slate-600">
                              {cashOnCashReturn >= 12 ? '💚 Excellent' : cashOnCashReturn >= 8 ? '✅ Good' : '⚠️ Fair'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Cap Rate */}
                        <div className="p-2 rounded-lg border-2 bg-purple-50 border-purple-300">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-semibold text-slate-700 flex items-center gap-0.5">
                              Cap Rate <HelpTooltip content="Property earning potential" />
                            </span>
                            <span className="text-sm font-bold text-purple-700 mt-0.5">
                              {capRate.toFixed(1)}%
                            </span>
                            <span className="text-[8px] text-slate-600">
                              {capRate >= 8 ? '💚 Strong' : capRate >= 5 ? '✅ Average' : '⚠️ Low'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Break-Even */}
                        <div className="p-2 rounded-lg border-2 bg-amber-50 border-amber-300">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-semibold text-slate-700 flex items-center gap-0.5">
                              Break-Even <HelpTooltip content="Min occupancy needed" />
                            </span>
                            <span className="text-sm font-bold text-amber-700 mt-0.5">
                              {breakEvenOccupancy.toFixed(1)}%
                            </span>
                            <span className="text-[8px] text-slate-600">
                              {breakEvenOccupancy < 75 ? '💚 Safe' : breakEvenOccupancy < 85 ? '⚠️ Moderate' : '❌ Risky'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Cost Breakdown for Investment - Aligned with Rental Projections */}
                      <div className="mt-3 pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[9px] font-semibold text-slate-700 flex items-center gap-1">
                            <span aria-label="Money icon">💰</span> Loan Cost Breakdown
                            <HelpTooltip content="Shows how your total payment is divided between principal and interest" />
                          </p>
                        </div>
                        <div 
                          className="flex h-4 rounded-md overflow-hidden shadow-inner border border-slate-200 mb-1"
                          role="img"
                          aria-label={`Investment property loan cost breakdown: ${((loanAmount / totalPaid) * 100).toFixed(0)}% principal (${formatCurrency(loanAmount)}) and ${((totalInterest / totalPaid) * 100).toFixed(0)}% interest (${formatCurrency(totalInterest)}) of total payment ${formatCurrency(totalPaid)}`}
                        >
                          <div 
                            className="bg-gradient-to-r from-emerald-400 to-emerald-500 flex items-center justify-center text-[8px] font-bold text-white"
                            style={{ width: `${((loanAmount / totalPaid) * 100).toFixed(1)}%` }}
                            aria-label={`Principal: ${((loanAmount / totalPaid) * 100).toFixed(0)}%`}
                          >
                            {((loanAmount / totalPaid) * 100).toFixed(0)}%
                          </div>
                          <div 
                            className="bg-gradient-to-r from-red-400 to-red-500 flex items-center justify-center text-[8px] font-bold text-white"
                            style={{ width: `${((totalInterest / totalPaid) * 100).toFixed(1)}%` }}
                            aria-label={`Interest: ${((totalInterest / totalPaid) * 100).toFixed(0)}%`}
                          >
                            {((totalInterest / totalPaid) * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className="flex justify-between text-[7px] text-slate-600">
                          <span>Principal: {formatCurrencyCompact(loanAmount)}</span>
                          <span>Interest: {formatCurrencyCompact(totalInterest)}</span>
                        </div>
                        <div className="mt-1 text-[7px] text-slate-500 text-center">
                          Total: {formatCurrencyCompact(totalPaid)}
                        </div>
                      </div>
                      
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Comparison Section */}
            <div className={CARD_STYLE} style={CARD_SHADOW}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-xl pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-400/10 to-transparent rounded-bl-full"></div>
              <div className="relative p-2">
                <div className="mb-1.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                      <h2 className="text-sm font-serif text-slate-800 tracking-wide font-bold relative">
                      Payment Plan Comparison
                        <div className="absolute -bottom-0.5 left-0 w-10 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                    </h2>
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-full">
                        {isExtraPaymentComparison ? 'Regular vs Extra' : 'Monthly vs Bi-weekly'}
                    </span>
                  </div>
                    <button
                      onClick={() => {
                        // Reset to default values
                        interestRateInput.setValue(6.5);
                        tenureInput.setValue(30);
                        homeValueInput.setValue(400000);
                        downPaymentInput.setValue(80000);
                        setPaymentType('monthly');
                        setExtraPaymentEnabled(false);
                      }}
                      className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                      title="Reset to default values"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset
                    </button>
                  </div>
                  
                  {/* Dynamic English Description */}
                  <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-2 mb-1.5">
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                    {isExtraPaymentComparison 
                        ? `By making extra payments of ${formatCurrency(extraPaymentAmount)} ${extraPaymentFrequency === 'monthly' ? 'per month' : 'every two weeks'}, you'll save ${formatCurrency(Math.abs(interestSaved))} in remaining interest and pay off your loan ${formatYearsMonths(Math.abs(timeSaved))} faster. The chart shows outstanding interest you'll pay from today to payoff.`
                        : `With your current outstanding balance of ${formatCurrency(forwardProjections.outstandingBalance)}, switching to bi-weekly payments from today would save you ${formatCurrency(Math.abs(interestSaved))} in interest and pay off your loan ${formatYearsMonths(Math.abs(timeSaved))} sooner. Bi-weekly payments accelerate payoff because you make 26 payments per year (effectively one extra monthly payment). The chart compares forward projections from today.`}
                  </p>
                  </div>
                </div>

                {/* Savings Information - Compact */}
                <div className="flex flex-row gap-2 mb-2">
                  <div className="flex-1 bg-gradient-to-br from-emerald-50/80 to-green-100/80 rounded-lg p-2 border-2 border-emerald-300/60 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 hover:border-emerald-400 backdrop-blur-sm relative overflow-hidden group/card">
                    <div className="relative text-center">
                      <div className="text-sm font-serif font-bold text-emerald-700 mb-0.5">
                        {formatCurrency(Math.abs(interestSaved))}
                      </div>
                      <div className="text-[9px] text-emerald-600 uppercase tracking-wide font-medium">
                        Interest Saved
                      </div>
                      </div>
                    </div>
                  <div className="flex-1 bg-gradient-to-br from-emerald-50/80 to-green-100/80 rounded-lg p-2 border-2 border-emerald-300/60 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 hover:border-emerald-400 backdrop-blur-sm relative overflow-hidden group/card">
                    <div className="relative text-center">
                      <div className="text-sm font-serif font-bold text-emerald-700 mb-0.5">
                        {formatYearsMonths(Math.abs(timeSaved))}
                      </div>
                      <div className="text-[9px] text-emerald-600 uppercase tracking-wide font-medium">
                        Time Saved
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparison Bar Chart - Compact */}
                <div className="flex justify-center">
                  <div className="w-full sm:w-3/4 md:w-1/2">
                    <div className="sr-only">
                      <h3>Payment Plan Comparison Chart</h3>
                      <p>
                        {isExtraPaymentComparison 
                          ? `Bar chart comparing Regular ${paymentType === 'monthly' ? 'Monthly' : 'Bi-weekly'} Payments (${formatCurrency(graphRemainingInterestComparison)} remaining interest from today) vs With Extra Payments (${formatCurrency(graphRemainingInterest)} remaining interest from today). Extra payments save ${formatCurrency(Math.abs(interestSaved))} in remaining interest.`
                          : `Bar chart comparing Monthly Payments (${formatCurrency(paymentType === 'monthly' ? graphRemainingInterest : graphRemainingInterestComparison)} remaining interest from today) vs Bi-weekly Payments (${formatCurrency(paymentType === 'biweekly' ? graphRemainingInterest : graphRemainingInterestComparison)} remaining interest from today). Bi-weekly saves ${formatCurrency(Math.abs(interestSaved))} in remaining interest.`}
                      </p>
                    </div>
                    <ResponsiveContainer key={`comparison-chart-${chartRenderKey}`} width="100%" height={275} aria-label={isExtraPaymentComparison ? `Comparison chart showing Regular ${paymentType === 'monthly' ? 'Monthly' : 'Bi-weekly'} Payments with ${formatCurrency(graphRemainingInterestComparison)} remaining interest versus Extra Payments with ${formatCurrency(graphRemainingInterest)} remaining interest, saving ${formatCurrency(Math.abs(interestSaved))} from today forward` : `Comparison chart showing Monthly Payments with ${formatCurrency(paymentType === 'monthly' ? graphRemainingInterest : graphRemainingInterestComparison)} remaining interest versus Bi-weekly Payments with ${formatCurrency(paymentType === 'biweekly' ? graphRemainingInterest : graphRemainingInterestComparison)} remaining interest, saving ${formatCurrency(Math.abs(interestSaved))} from today forward`}>
                      <BarChart data={comparisonBarData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} aria-label="Payment plan comparison bar chart">
                        <defs>
                          <linearGradient id="redBarGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7} />
                          </linearGradient>
                          <linearGradient id="greenBarGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                          </linearGradient>
                          <filter id="barShadow">
                            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.2"/>
                          </filter>
                          <filter id="barGlow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                          stroke="#94a3b8"
                          angle={0}
                          textAnchor="middle"
                          height={60}
                        />
                        <YAxis 
                          tickFormatter={(value) => formatCurrencyCompact(value)}
                          tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                          stroke="#94a3b8"
                          label={{ value: 'Remaining Interest', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#475569', fontWeight: 700 } }}
                          domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.3)]}
                          width={60}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white border-2 border-slate-200 rounded-xl p-3 shadow-xl">
                                  <p className="text-sm font-bold text-slate-800 mb-2">{data.label}</p>
                                  <p className="text-lg font-bold text-blue-600">{formatCurrency(data.interest)}</p>
                                  <p className="text-xs text-slate-600 mt-1">Remaining Interest (from today)</p>
                                  <div className="border-t border-slate-200 mt-2 pt-2">
                                    <p className="text-xs text-slate-600">Paid off by: <span className="font-semibold text-slate-800">{data.endDate}</span></p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                        />
                        <Bar 
                          dataKey="interest" 
                          radius={[8, 8, 0, 0]}
                          animationDuration={800}
                          animationEasing="ease-out"
                          shape={(props: { x?: number; y?: number; width?: number; height?: number; value?: number; payload?: { type?: string; name?: string; label?: string; endDate?: string } }) => {
                            const { x = 0, y = 0, width = 0, height = 0, payload } = props;
                            const fillColor = isExtraPaymentComparison
                              ? (payload?.type === 'comparison' ? 'url(#redBarGradient)' : 'url(#greenBarGradient)')
                              : (payload?.type === 'monthly' ? 'url(#redBarGradient)' : 'url(#greenBarGradient)');
                            
                            return (
                              <g>
                                <rect 
                                  x={x} 
                                  y={y} 
                                  width={width} 
                                  height={height} 
                                  fill={fillColor}
                                  filter="url(#barShadow)"
                                  rx={8}
                                  ry={8}
                                />
                                <rect 
                                  x={x} 
                                  y={y} 
                                  width={width} 
                                  height={height / 3} 
                                  fill="rgba(255, 255, 255, 0.2)"
                                  rx={8}
                                  ry={8}
                                />
                              </g>
                            );
                          }}
                        >
                          <LabelList 
                            dataKey="interest" 
                            position="top" 
                            formatter={(value: number) => formatCurrencyCompact(value)}
                            style={{ fontSize: '9px', fontWeight: 700, fill: '#334155', textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
                            offset={5}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex justify-end gap-4 mt-0 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(to bottom, #ef4444, #dc2626)' }}></div>
                    <span className="text-slate-600 font-medium">{isExtraPaymentComparison ? 'Regular Payments' : 'Monthly'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(to bottom, #10b981, #059669)' }}></div>
                    <span className="text-slate-600 font-medium">{isExtraPaymentComparison ? 'With Extra Payments' : 'Bi-weekly'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amortization sections inside right column when additional costs are shown */}
            {showAdditionalCosts && (
              <>
                {/* Amortization Overview */}
                <div className="bg-gradient-to-br from-white/90 via-white/85 to-blue-50/40 rounded-xl shadow-xl border-2 border-blue-100/50 p-4 backdrop-blur-md hover:shadow-2xl transition-all duration-300 relative group" style={{ boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5) inset' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-xl pointer-events-none"></div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-transparent rounded-bl-full"></div>
                  
                  <div className="flex items-center justify-between mb-3 relative">
                    <h2 className="text-base font-serif font-bold text-slate-800 tracking-tight">
                      Amortization Overview
                      <div className="absolute -bottom-0.5 left-0 w-16 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    </h2>
                    <div className="flex items-center text-xs text-slate-500">
                      <span className="mr-1">Scroll for details</span>
                      <ChevronDown size={14} className="animate-bounce" />
                    </div>
                  </div>
                  
                  <div className="sr-only">
                    <h3>Amortization Overview Chart</h3>
                    <p>Area chart showing mortgage amortization over time with three data series: Remaining Balance (decreasing from {formatCurrency(loanAmount)} to {CURRENCY_DATA[selectedCurrency].symbol}0), Principal Paid (increasing from {CURRENCY_DATA[selectedCurrency].symbol}0 to {formatCurrency(loanAmount)}), and Cumulative Interest (increasing to {formatCurrency(totalInterest)}). The chart spans from {formatDate(startDate)} to {formatDate(endDate)}.</p>
                  </div>
                  <ResponsiveContainer key={`chart-${chartRenderKey}`} width="100%" height={250} aria-label={`Amortization chart showing remaining balance decreasing from ${formatCurrency(loanAmount)} to zero, principal paid increasing to ${formatCurrency(loanAmount)}, and cumulative interest reaching ${formatCurrency(totalInterest)} over ${yearsToPayoff.toFixed(1)} years`}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }} aria-label="Mortgage amortization area chart">
                      <defs>
                        <linearGradient id="balanceGradient2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                        </linearGradient>
                        <linearGradient id="principalGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                        </linearGradient>
                        <linearGradient id="interestGradient2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                        </linearGradient>
                        <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                        </linearGradient>
                        <filter id="lineShadow2">
                          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3"/>
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => {
                          const [year, month] = date.split('-');
                          return `${month}/${year.slice(2)}`;
                        }}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        stroke="#94a3b8"
                      />
                      <YAxis 
                        tickFormatter={(value) => formatCurrencyCompact(value)}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        stroke="#94a3b8"
                        label={{ value: `Amount (${CURRENCY_DATA[selectedCurrency].symbol})`, angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#334155', fontWeight: 600 } }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '2px solid #e2e8f0', 
                          borderRadius: '12px', 
                          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                          backdropFilter: 'blur(10px)',
                          fontSize: '11px',
                          padding: '8px'
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => formatDate(label)}
                        cursor={{ stroke: 'rgba(59, 130, 246, 0.3)', strokeWidth: 2 }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                        iconType="line"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        fill="url(#balanceGradient2)"
                        fillOpacity={1}
                        name="Remaining Balance"
                        activeDot={{ r: 6, strokeWidth: 2, fill: '#3b82f6', stroke: '#fff' }}
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                        filter="url(#lineShadow2)"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="principal" 
                        stroke="#10b981" 
                        strokeWidth={2.5}
                        fill="url(#principalGradient)"
                        fillOpacity={1}
                        name="Principal Paid"
                        activeDot={{ r: 5, strokeWidth: 2, fill: '#10b981', stroke: '#fff' }}
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                        animationBegin={200}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="interest" 
                        stroke="#ef4444" 
                        strokeWidth={2.5}
                        fill="url(#interestGradient2)"
                        fillOpacity={1}
                        name="Cumulative Interest"
                        activeDot={{ r: 5, strokeWidth: 2, fill: '#ef4444', stroke: '#fff' }}
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                        animationBegin={400}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Amortization Table */}
                <AmortizationTable schedule={schedule} />

                {/* Mortgage Tracker - Only show when logged in and has saved mortgages */}
                {currentUser && savedMortgages.length > 0 && (
                  <div id="mortgage-tracker" className="mt-6 mb-6">
                    <div className="bg-white rounded-xl shadow-xl border-2 border-blue-100 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Home className="w-6 h-6 text-blue-600" />
                        Mortgage Tracker
                          <span className="text-sm font-normal text-slate-600">
                            ({savedMortgages.length} {savedMortgages.length === 1 ? 'mortgage' : 'mortgages'})
                          </span>
                      </h2>
                        {savedMortgages.length > 1 && (
                          <button
                            onClick={() => setTrackerExpanded(!trackerExpanded)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            {trackerExpanded ? 'Show Less' : 'Show All'}
                            <ChevronDown className={`w-4 h-4 transition-transform ${trackerExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>
                      
                      {savedMortgages.slice(0, trackerExpanded ? savedMortgages.length : 1).map((mortgage) => {
                        // Calculate current mortgage metrics
                        const mortgageLoanAmount = mortgage.homeValue - mortgage.downPayment;
                        const isCurrentMortgage = selectedMortgageId === mortgage.id;
                        
                        // Calculate paid and remaining amounts from start date to today
                        let principalPaidFromPayments = 0; // Principal paid from loan payments (excluding down payment)
                        let principalPaid = mortgage.downPayment; // Total principal paid (including down payment)
                        let interestPaid = 0;
                        let principalRemaining = mortgageLoanAmount;
                        let interestRemaining = 0;
                        
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const startDateObj = new Date(mortgage.startDate);
                        startDateObj.setHours(0, 0, 0, 0);
                        
                        if (isCurrentMortgage && schedule.length > 0) {
                          // Use current schedule if this is the selected mortgage
                          // Only count payments from start date to today
                          schedule.forEach((item) => {
                            const paymentDate = new Date(item.date);
                            paymentDate.setHours(0, 0, 0, 0);
                            
                            if (paymentDate >= startDateObj && paymentDate <= today) {
                              principalPaidFromPayments += item.principal;
                              principalPaid += item.principal;
                              interestPaid += item.interest;
                            }
                          });
                          
                          // Outstanding loan = loan amount - principal paid from payments
                          principalRemaining = Math.max(0, mortgageLoanAmount - principalPaidFromPayments);
                          
                          // Calculate remaining interest (total interest - interest paid)
                          interestRemaining = Math.max(0, totalInterest - interestPaid);
                        } else {
                          // For other mortgages, recalculate schedule to get accurate numbers
                          const monthsElapsed = Math.max(0, Math.floor((today.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
                          const totalMonths = mortgage.tenure * 12;
                          
                          if (monthsElapsed > 0 && monthsElapsed < totalMonths) {
                            // Recalculate schedule for this mortgage
                            const mortgageLoan = mortgage.homeValue - mortgage.downPayment;
                            const monthlyRate = mortgage.interestRate / 100 / 12;
                            const numPayments = mortgage.paymentType === 'biweekly' ? mortgage.tenure * 26 : mortgage.tenure * 12;
                            const paymentAmount = mortgage.paymentType === 'biweekly' 
                              ? (mortgageLoan * monthlyRate * 2) / (1 - Math.pow(1 + monthlyRate * 2, -numPayments))
                              : (mortgageLoan * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numPayments));
                            
                            if (isNaN(paymentAmount) || !isFinite(paymentAmount)) {
                              // Fallback calculation if payment amount calculation fails
                              principalRemaining = mortgageLoanAmount;
                              interestRemaining = (mortgageLoanAmount * mortgage.interestRate / 100 * mortgage.tenure);
                            } else {
                              let balance = mortgageLoan;
                              for (let i = 0; i < monthsElapsed && i < totalMonths; i++) {
                                const interest = balance * monthlyRate;
                                const principal = paymentAmount - interest;
                                balance -= principal;
                                principalPaidFromPayments += principal;
                                principalPaid += principal;
                                interestPaid += interest;
                              }
                              
                              // Outstanding loan = loan amount - principal paid from payments
                              principalRemaining = Math.max(0, mortgageLoanAmount - principalPaidFromPayments);
                              
                              // Calculate total interest for the mortgage
                              const totalInterestForMortgage = (paymentAmount * numPayments) - mortgageLoan;
                              interestRemaining = Math.max(0, totalInterestForMortgage - interestPaid);
                            }
                          } else if (monthsElapsed >= totalMonths) {
                            // Loan is fully paid
                            principalPaidFromPayments = mortgageLoanAmount;
                            principalPaid = mortgage.downPayment + mortgageLoanAmount;
                            principalRemaining = 0;
                            const totalInterestForMortgage = (mortgageLoanAmount * mortgage.interestRate / 100 * mortgage.tenure);
                            interestPaid = totalInterestForMortgage;
                            interestRemaining = 0;
                          } else {
                            // Loan hasn't started yet
                            principalRemaining = mortgageLoanAmount;
                            const totalInterestForMortgage = (mortgageLoanAmount * mortgage.interestRate / 100 * mortgage.tenure);
                            interestRemaining = totalInterestForMortgage;
                          }
                        }
                        
                        return (
                          <div
                            key={mortgage.id}
                            className={`mb-4 p-4 rounded-lg border-2 ${
                              isCurrentMortgage
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 bg-slate-50'
                            }`}
                          >
                            {/* Mortgage Name */}
                            <div className="flex items-center justify-between mb-4">
                              {editingMortgageName === mortgage.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <input
                                    type="text"
                                    value={editingMortgageNameValue}
                                    onChange={(e) => setEditingMortgageNameValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleUpdateMortgageName(mortgage.id, editingMortgageNameValue);
                                      } else if (e.key === 'Escape') {
                                        setEditingMortgageName(null);
                                        setEditingMortgageNameValue('');
                                      }
                                    }}
                                    className="flex-1 px-3 py-2 text-base font-semibold border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleUpdateMortgageName(mortgage.id, editingMortgageNameValue)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                                  >
                                    <Check className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingMortgageName(null);
                                      setEditingMortgageNameValue('');
                                    }}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <h3 className="text-lg font-bold text-slate-800">{mortgage.name}</h3>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        handleLoadMortgage(mortgage);
                                        // Scroll to top of calculator to see the loaded values
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                      }}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                      title="Load and edit mortgage"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMortgage(mortgage.id)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* KPI Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                              {/* Loan Amount Taken */}
                              <div className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="text-xs text-slate-600 mb-1">Loan Amount Taken</div>
                                <div className="text-lg font-bold text-slate-800">
                                  {formatCurrency(mortgageLoanAmount, mortgage.currency)}
                                </div>
                              </div>

                              {/* Outstanding Loan */}
                              <div className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="text-xs text-slate-600 mb-1">Outstanding Loan</div>
                                <div className="text-lg font-bold text-red-600">
                                  {formatCurrency(isNaN(principalRemaining) || !isFinite(principalRemaining) ? mortgageLoanAmount : Math.max(0, principalRemaining), mortgage.currency)}
                                </div>
                              </div>

                              {/* Payment Type */}
                              <div className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="text-xs text-slate-600 mb-1">Payment Type</div>
                                <div className="text-lg font-bold text-slate-800 capitalize">
                                  {mortgage.paymentType}
                                </div>
                                <div className="text-xs text-slate-400 my-1">----</div>
                                <div className="text-xs text-slate-600 mt-2">Start Date</div>
                                <div className="text-sm font-semibold text-slate-700">
                                  {formatDate(mortgage.startDate)}
                                </div>
                              </div>

                              {/* Principal/Interest Paid */}
                              <div className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="text-xs text-slate-600 mb-1">Paid Till Now</div>
                                <div className="text-sm font-semibold text-green-600 mb-1">
                                  Principal: {formatCurrency(principalPaidFromPayments, mortgage.currency)}
                                </div>
                                <div className="text-xs text-slate-400 my-1">---</div>
                                <div className="text-sm font-semibold text-green-600">
                                  Interest: {formatCurrency(interestPaid, mortgage.currency)}
                                </div>
                              </div>

                              {/* Principal/Interest To Be Paid */}
                              <div className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="text-xs text-slate-600 mb-1">To Be Paid</div>
                                <div className="text-sm font-semibold text-orange-600 mb-1">
                                  Principal: {formatCurrency(isNaN(principalRemaining) || !isFinite(principalRemaining) ? 0 : Math.max(0, principalRemaining), mortgage.currency)}
                                </div>
                                <div className="text-xs text-slate-400 my-1">---</div>
                                <div className="text-sm font-semibold text-orange-600">
                                  Interest: {formatCurrency(isNaN(interestRemaining) || !isFinite(interestRemaining) ? 0 : Math.max(0, interestRemaining), mortgage.currency)}
                                </div>
                              </div>

                              {/* End Date */}
                              <div className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="text-xs text-slate-600 mb-1">End Date</div>
                                <div className="text-lg font-bold text-slate-800">
                                  {isCurrentMortgage ? formatDate(endDate) : (() => {
                                    const start = new Date(mortgage.startDate);
                                    const end = new Date(start);
                                    end.setFullYear(end.getFullYear() + mortgage.tenure);
                                    return formatDate(end.toISOString().split('T')[0]);
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {saveError && (
                        <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded">
                          {saveError}
                        </div>
                      )}
                      {isSavingMortgage && (
                        <div className="mt-4 text-sm text-blue-600">
                          Saving...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Export & Share Actions Section - Moved here for visibility */}
                <div className="mt-4 mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border-2 border-emerald-300 shadow-md">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                      <span className="text-2xl">📊</span>
                      Save & Share Your Results
                    </h3>
                    <p className="text-sm text-slate-600">
                      Download complete reports in Excel, PDF, or CSV format
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch gap-3">
                    <div className="flex-1">
                      <ExportDropdown 
                        onExportExcel={handleExportToExcel}
                        onExportPDF={handleExportToPDF}
                        onExportCSV={handleExportToCSV}
                      />
                    </div>
                    <button
                      onClick={() => setShowEmailCapture(true)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-base"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      Email Results
                    </button>
                  </div>
                  <div className="mt-3 text-xs text-slate-600 space-y-1">
                    <p className="font-semibold">Report Includes:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>Complete amortization schedule</li>
                      {propertyType === 'investment' && <li>Investment Property Analysis with cash flow projections</li>}
                      {showScenarioComparison && <li>Loan Comparison Charts</li>}
                      {showRefinanceAnalysis && <li>Refinance Analysis with break-even point</li>}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Amortization sections at bottom when additional costs are NOT shown */}
        {!showAdditionalCosts && (
          <>
            {/* Amortization Overview */}
            <div className="mt-4 bg-gradient-to-br from-white/90 via-white/85 to-blue-50/40 rounded-xl shadow-xl border-2 border-blue-100/50 p-4 backdrop-blur-md hover:shadow-2xl transition-all duration-300 relative group" style={{ boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5) inset' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-xl pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-transparent rounded-bl-full"></div>
              
              <div className="flex items-center justify-between mb-3 relative">
                <h2 className="text-base font-serif font-bold text-slate-800 tracking-tight">
                  Amortization Overview
                  <div className="absolute -bottom-0.5 left-0 w-16 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                </h2>
                <div className="flex items-center text-xs text-slate-500">
                  <span className="mr-1">Scroll for details</span>
                  <ChevronDown size={14} className="animate-bounce" />
                </div>
              </div>
              
              <div className="sr-only">
                <h3>Amortization Overview Chart</h3>
                <p>Area chart showing mortgage amortization over time with three data series: Remaining Balance (decreasing from {formatCurrency(loanAmount)} to {CURRENCY_DATA[selectedCurrency].symbol}0), Principal Paid (increasing from {CURRENCY_DATA[selectedCurrency].symbol}0 to {formatCurrency(loanAmount)}), and Cumulative Interest (increasing to {formatCurrency(totalInterest)}). The chart spans from {formatDate(startDate)} to {formatDate(endDate)}.</p>
              </div>
              <ResponsiveContainer width="100%" height={250} aria-label={`Amortization chart showing remaining balance decreasing from ${formatCurrency(loanAmount)} to zero, principal paid increasing to ${formatCurrency(loanAmount)}, and cumulative interest reaching ${formatCurrency(totalInterest)} over ${yearsToPayoff.toFixed(1)} years`}>
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }} aria-label="Mortgage amortization area chart">
                  <defs>
                    <linearGradient id="balanceGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="principalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="interestGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                    </linearGradient>
                    <filter id="lineShadow2">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3"/>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => {
                      const [year, month] = date.split('-');
                      return `${month}/${year.slice(2)}`;
                    }}
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                    stroke="#94a3b8"
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrencyCompact(value)}
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                    stroke="#94a3b8"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '2px solid #e2e8f0', 
                      borderRadius: '8px', 
                      fontSize: '11px' 
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                    iconType="line"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#3b82f6" 
                    strokeWidth={2.5}
                    fill="url(#balanceGradient2)"
                    fillOpacity={1}
                    name="Remaining Balance"
                    activeDot={{ r: 5, strokeWidth: 2, fill: '#3b82f6', stroke: '#fff' }}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="principal" 
                    stroke="#10b981" 
                    strokeWidth={2.5}
                    fill="url(#principalGradient)"
                    fillOpacity={1}
                    name="Principal Paid"
                    activeDot={{ r: 5, strokeWidth: 2, fill: '#10b981', stroke: '#fff' }}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                    animationBegin={200}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="interest" 
                    stroke="#ef4444" 
                    strokeWidth={2.5}
                    fill="url(#interestGradient2)"
                    fillOpacity={1}
                    name="Cumulative Interest"
                    activeDot={{ r: 5, strokeWidth: 2, fill: '#ef4444', stroke: '#fff' }}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                    animationBegin={400}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Amortization Table */}
            <AmortizationTable schedule={schedule} />

            {/* Mortgage Tracker - Only show when logged in and has saved mortgages */}
            {currentUser && savedMortgages.length > 0 && (
              <div id="mortgage-tracker" className="mt-6 mb-6">
                <div className="bg-white rounded-xl shadow-xl border-2 border-blue-100 p-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Home className="w-6 h-6 text-blue-600" />
                    Mortgage Tracker
                  </h2>
                  
                  {savedMortgages.map((mortgage) => {
                    // Calculate current mortgage metrics
                    const mortgageLoanAmount = mortgage.homeValue - mortgage.downPayment;
                    const isCurrentMortgage = selectedMortgageId === mortgage.id;
                    
                    // Calculate paid and remaining amounts from start date to today
                    let principalPaidFromPayments = 0; // Principal paid from loan payments (excluding down payment)
                    let principalPaid = mortgage.downPayment; // Total principal paid (including down payment)
                    let interestPaid = 0;
                    let principalRemaining = mortgageLoanAmount;
                    let interestRemaining = 0;
                    
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const startDateObj = new Date(mortgage.startDate);
                    startDateObj.setHours(0, 0, 0, 0);
                    
                    if (isCurrentMortgage && schedule.length > 0) {
                      // Use current schedule if this is the selected mortgage
                      // Only count payments from start date to today
                      schedule.forEach((item) => {
                        const paymentDate = new Date(item.date);
                        paymentDate.setHours(0, 0, 0, 0);
                        
                        if (paymentDate >= startDateObj && paymentDate <= today) {
                          principalPaidFromPayments += item.principal;
                          principalPaid += item.principal;
                          interestPaid += item.interest;
                        }
                      });
                      
                      // Outstanding loan = loan amount - principal paid from payments
                      principalRemaining = Math.max(0, mortgageLoanAmount - principalPaidFromPayments);
                      
                      // Calculate remaining interest (total interest - interest paid)
                      interestRemaining = Math.max(0, totalInterest - interestPaid);
                    } else {
                      // For other mortgages, recalculate schedule to get accurate numbers
                      const monthsElapsed = Math.max(0, Math.floor((today.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
                      const totalMonths = mortgage.tenure * 12;
                      
                      if (monthsElapsed > 0 && monthsElapsed < totalMonths) {
                        // Recalculate schedule for this mortgage
                        const mortgageLoan = mortgage.homeValue - mortgage.downPayment;
                        const monthlyRate = mortgage.interestRate / 100 / 12;
                        const numPayments = mortgage.paymentType === 'biweekly' ? mortgage.tenure * 26 : mortgage.tenure * 12;
                        const paymentAmount = mortgage.paymentType === 'biweekly' 
                          ? (mortgageLoan * monthlyRate * 2) / (1 - Math.pow(1 + monthlyRate * 2, -numPayments))
                          : (mortgageLoan * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numPayments));
                        
                        if (isNaN(paymentAmount) || !isFinite(paymentAmount)) {
                          // Fallback calculation if payment amount calculation fails
                          principalRemaining = mortgageLoanAmount;
                          interestRemaining = (mortgageLoanAmount * mortgage.interestRate / 100 * mortgage.tenure);
                        } else {
                          let balance = mortgageLoan;
                          for (let i = 0; i < monthsElapsed && i < totalMonths; i++) {
                            const interest = balance * monthlyRate;
                            const principal = paymentAmount - interest;
                            balance -= principal;
                            principalPaidFromPayments += principal;
                            principalPaid += principal;
                            interestPaid += interest;
                          }
                          
                          // Outstanding loan = loan amount - principal paid from payments
                          principalRemaining = Math.max(0, mortgageLoanAmount - principalPaidFromPayments);
                          
                          // Calculate total interest for the mortgage
                          const totalInterestForMortgage = (paymentAmount * numPayments) - mortgageLoan;
                          interestRemaining = Math.max(0, totalInterestForMortgage - interestPaid);
                        }
                      } else if (monthsElapsed >= totalMonths) {
                        // Loan is fully paid
                        principalPaidFromPayments = mortgageLoanAmount;
                        principalPaid = mortgage.downPayment + mortgageLoanAmount;
                        principalRemaining = 0;
                        const totalInterestForMortgage = (mortgageLoanAmount * mortgage.interestRate / 100 * mortgage.tenure);
                        interestPaid = totalInterestForMortgage;
                        interestRemaining = 0;
                      } else {
                        // Loan hasn't started yet
                        principalRemaining = mortgageLoanAmount;
                        const totalInterestForMortgage = (mortgageLoanAmount * mortgage.interestRate / 100 * mortgage.tenure);
                        interestRemaining = totalInterestForMortgage;
                      }
                    }
                    
                    return (
                      <div
                        key={mortgage.id}
                        className={`mb-4 p-4 rounded-lg border-2 ${
                          isCurrentMortgage
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        {/* Mortgage Name */}
                        <div className="flex items-center justify-between mb-4">
                          {editingMortgageName === mortgage.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={editingMortgageNameValue}
                                onChange={(e) => setEditingMortgageNameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateMortgageName(mortgage.id, editingMortgageNameValue);
                                  } else if (e.key === 'Escape') {
                                    setEditingMortgageName(null);
                                    setEditingMortgageNameValue('');
                                  }
                                }}
                                className="flex-1 px-3 py-2 text-base font-semibold border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoFocus
                              />
                              <button
                                onClick={() => handleUpdateMortgageName(mortgage.id, editingMortgageNameValue)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingMortgageName(null);
                                  setEditingMortgageNameValue('');
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <h3 className="text-lg font-bold text-slate-800">{mortgage.name}</h3>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    handleLoadMortgage(mortgage);
                                    // Scroll to top of calculator to see the loaded values
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Load and edit mortgage"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMortgage(mortgage.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                          {/* Loan Amount Taken */}
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <div className="text-xs text-slate-600 mb-1">Loan Amount Taken</div>
                            <div className="text-lg font-bold text-slate-800">
                              {formatCurrency(mortgageLoanAmount, mortgage.currency)}
                            </div>
                          </div>

                          {/* Outstanding Loan */}
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <div className="text-xs text-slate-600 mb-1">Outstanding Loan</div>
                            <div className="text-lg font-bold text-red-600">
                              {formatCurrency(isNaN(principalRemaining) || !isFinite(principalRemaining) ? mortgageLoanAmount : Math.max(0, principalRemaining), mortgage.currency)}
                            </div>
                          </div>

                          {/* Payment Type */}
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <div className="text-xs text-slate-600 mb-1">Payment Type</div>
                            <div className="text-lg font-bold text-slate-800 capitalize">
                              {mortgage.paymentType}
                            </div>
                            <div className="text-xs text-slate-400 my-1">----</div>
                            <div className="text-xs text-slate-600 mt-2">Start Date</div>
                            <div className="text-sm font-semibold text-slate-700">
                              {formatDate(mortgage.startDate)}
                            </div>
                          </div>

                          {/* Principal/Interest Paid */}
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <div className="text-xs text-slate-600 mb-1">Paid Till Now</div>
                            <div className="text-sm font-semibold text-green-600 mb-1">
                              Principal: {formatCurrency(principalPaidFromPayments, mortgage.currency)}
                            </div>
                            <div className="text-xs text-slate-400 my-1">---</div>
                            <div className="text-sm font-semibold text-green-600">
                              Interest: {formatCurrency(interestPaid, mortgage.currency)}
                            </div>
                          </div>

                          {/* Principal/Interest To Be Paid */}
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <div className="text-xs text-slate-600 mb-1">To Be Paid</div>
                            <div className="text-sm font-semibold text-orange-600 mb-1">
                              Principal: {formatCurrency(isNaN(principalRemaining) || !isFinite(principalRemaining) ? 0 : Math.max(0, principalRemaining), mortgage.currency)}
                            </div>
                            <div className="text-xs text-slate-400 my-1">---</div>
                            <div className="text-sm font-semibold text-orange-600">
                              Interest: {formatCurrency(isNaN(interestRemaining) || !isFinite(interestRemaining) ? 0 : Math.max(0, interestRemaining), mortgage.currency)}
                            </div>
                          </div>

                          {/* End Date */}
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <div className="text-xs text-slate-600 mb-1">End Date</div>
                            <div className="text-lg font-bold text-slate-800">
                              {isCurrentMortgage ? formatDate(endDate) : (() => {
                                const start = new Date(mortgage.startDate);
                                const end = new Date(start);
                                end.setFullYear(end.getFullYear() + mortgage.tenure);
                                return formatDate(end.toISOString().split('T')[0]);
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {saveError && (
                    <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded">
                      {saveError}
                    </div>
                  )}
                  {isSavingMortgage && (
                    <div className="mt-4 text-sm text-blue-600">
                      Saving...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Export & Share Actions Section - Moved here for visibility */}
            <div className="mt-4 mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border-2 border-emerald-300 shadow-md">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Save & Share Your Results
                </h3>
                <p className="text-sm text-slate-600">
                  Download complete reports in Excel, PDF, or CSV format
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                <div className="flex-1">
                  <ExportDropdown 
                    onExportExcel={handleExportToExcel}
                    onExportPDF={handleExportToPDF}
                    onExportCSV={handleExportToCSV}
                  />
                </div>
                <button
                  onClick={() => setShowEmailCapture(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-base"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Email Results
                </button>
              </div>
              <div className="mt-3 text-xs text-slate-600 space-y-1">
                <p className="font-semibold">Report Includes:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Complete amortization schedule</li>
                  {propertyType === 'investment' && <li>Investment Property Analysis with cash flow projections</li>}
                  {showScenarioComparison && <li>Loan Comparison Charts</li>}
                  {showRefinanceAnalysis && <li>Refinance Analysis with break-even point</li>}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Loan Scenario Comparison Modal - Rendered at body level */}
      {showScenarioComparison && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowScenarioComparison(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between shadow-lg z-10">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏆</span>
                <div>
                  <h2 className="text-xl font-bold">Compare Loan Options Side-by-Side</h2>
                  <p className="text-xs text-purple-100 mt-0.5">Find the best deal — Compare up to 3 different loan scenarios</p>
                </div>
              </div>
              <button
                onClick={() => setShowScenarioComparison(false)}
                className="text-white hover:text-purple-200 transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4 italic bg-purple-50 p-3 rounded-lg border border-purple-200">
                🛍️ <strong>Shopping for the best mortgage?</strong> Fill in up to 3 different loan scenarios and see which one saves you the most money. Your current loan is shown in the first column.
              </p>
              
              {/* Comparison Table */}
              <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
                <table className="w-full text-[10px] sm:text-xs border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b-2 border-purple-200">
                      <th className="text-left p-2 font-semibold text-slate-700 bg-slate-50 sticky left-0 z-20 min-w-[120px]">Metric</th>
                      <th className="p-2 font-semibold text-purple-700 bg-amber-50 border-l-2 border-amber-300 min-w-[150px]">
                        <div className="flex flex-col items-center">
                          <span>Current Loan</span>
                          <span className="text-[10px] text-amber-600 font-normal">⭐ Your Choice</span>
                        </div>
                      </th>
                      <th className="p-2 font-semibold text-purple-700 bg-purple-50 border-l-2 border-purple-200 min-w-[150px]">
                        <div className="flex flex-col items-center gap-2">
                          <span>Scenario 2</span>
                          <button
                            onClick={() => {
                              // Apply Scenario 2 using helper function
                              applyScenarioToCalculator(
                                scenarioB,
                                { homeValueInput, downPaymentInput, interestRateInput, tenureInput, extraPaymentAmountInput },
                                { setPaymentType, setStartDate, setExtraPaymentEnabled }
                              );
                              setShowScenarioComparison(false);
                            }}
                            className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-colors shadow-sm text-xs cursor-pointer"
                          >
                            <span className="font-bold whitespace-nowrap">🚀 Apply</span>
                          </button>
                        </div>
                      </th>
                      <th className="p-2 font-semibold text-purple-700 bg-purple-50 border-l-2 border-purple-200 min-w-[150px]">
                        <div className="flex flex-col items-center gap-2">
                          <span>Scenario 3</span>
                          <button
                            onClick={() => {
                              // Apply Scenario 3 using helper function
                              applyScenarioToCalculator(
                                scenarioC,
                                { homeValueInput, downPaymentInput, interestRateInput, tenureInput, extraPaymentAmountInput },
                                { setPaymentType, setStartDate, setExtraPaymentEnabled }
                              );
                              setShowScenarioComparison(false);
                            }}
                            className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-colors shadow-sm text-xs cursor-pointer"
                          >
                            <span className="font-bold whitespace-nowrap">🚀 Apply</span>
                          </button>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Home Value */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-2 text-slate-600 bg-slate-50 sticky left-0 z-10 min-w-[120px]">Home Value</td>
                      <td className="p-2 text-center font-semibold text-slate-800 bg-amber-50/30 border-l-2 border-amber-200 min-w-[150px]">
                        {formatCurrency(homeValueInput.value)}
                      </td>
                      <td className="p-2 border-l-2 border-purple-100 min-w-[150px]">
                        <input
                          type="text"
                          value={scenarioB.homeValue.toLocaleString()}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setScenarioB({ ...scenarioB, homeValue: val === '' ? 0 : Number(val) });
                          }}
                          className="w-full px-2 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center"
                          placeholder="$"
                        />
                      </td>
                      <td className="p-2 border-l-2 border-purple-100 min-w-[150px]">
                        <input
                          type="text"
                          value={scenarioC.homeValue.toLocaleString()}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setScenarioC({ ...scenarioC, homeValue: val === '' ? 0 : Number(val) });
                          }}
                          className="w-full px-2 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center"
                          placeholder="$"
                        />
                      </td>
                    </tr>

                    {/* Down Payment */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-2 text-slate-600 bg-slate-50 sticky left-0 z-10 min-w-[120px]">Down Payment</td>
                      <td className="p-2 text-center font-semibold text-slate-800 bg-amber-50/30 border-l-2 border-amber-200 min-w-[150px]">
                        {formatCurrency(downPaymentInput.value)}
                        <div className="text-[10px] text-slate-500">
                          {((downPaymentInput.value / homeValueInput.value) * 100).toFixed(1)}%
                        </div>
                      </td>
                      <td className="p-2 border-l-2 border-purple-100 min-w-[150px]">
                        <div className="flex items-center gap-1 justify-center">
                          <input
                            type="text"
                            value={scenarioB.downPayment.toLocaleString()}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setScenarioB({ ...scenarioB, downPayment: val === '' ? 0 : Number(val) });
                            }}
                            className="flex-1 px-2 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center text-xs"
                            placeholder="$"
                          />
                          <span className="text-purple-400 text-sm">|</span>
                          <input
                            type="text"
                            value={editingScenarioBPercent 
                              ? rawScenarioBPercent
                              : (scenarioB.homeValue > 0 ? ((scenarioB.downPayment / scenarioB.homeValue) * 100).toFixed(1) : '0.0')}
                            onChange={(e) => {
                              setEditingScenarioBPercent(true);
                              const cleaned = e.target.value.replace(/,/g, '');
                              setRawScenarioBPercent(cleaned);
                              if (cleaned && /^\d*\.?\d*$/.test(cleaned)) {
                                const percent = Number(cleaned);
                                if (!isNaN(percent) && percent >= 0 && percent <= 100) {
                                  setScenarioB({ ...scenarioB, downPayment: (scenarioB.homeValue * percent) / 100 });
                                }
                              }
                            }}
                            onFocus={() => {
                              setEditingScenarioBPercent(true);
                              setRawScenarioBPercent(scenarioB.homeValue > 0 ? ((scenarioB.downPayment / scenarioB.homeValue) * 100).toFixed(1) : '0.0');
                            }}
                            onBlur={() => {
                              setEditingScenarioBPercent(false);
                              setRawScenarioBPercent('');
                            }}
                            className="w-16 px-1 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center text-xs"
                            placeholder="%"
                          />
                        </div>
                      </td>
                      <td className="p-2 border-l-2 border-purple-100 min-w-[150px]">
                        <div className="flex items-center gap-1 justify-center">
                          <input
                            type="text"
                            value={scenarioC.downPayment.toLocaleString()}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setScenarioC({ ...scenarioC, downPayment: val === '' ? 0 : Number(val) });
                            }}
                            className="flex-1 px-2 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center text-xs"
                            placeholder="$"
                          />
                          <span className="text-purple-400 text-sm">|</span>
                          <input
                            type="text"
                            value={editingScenarioCPercent 
                              ? rawScenarioCPercent
                              : (scenarioC.homeValue > 0 ? ((scenarioC.downPayment / scenarioC.homeValue) * 100).toFixed(1) : '0.0')}
                            onChange={(e) => {
                              setEditingScenarioCPercent(true);
                              const cleaned = e.target.value.replace(/,/g, '');
                              setRawScenarioCPercent(cleaned);
                              if (cleaned && /^\d*\.?\d*$/.test(cleaned)) {
                                const percent = Number(cleaned);
                                if (!isNaN(percent) && percent >= 0 && percent <= 100) {
                                  setScenarioC({ ...scenarioC, downPayment: (scenarioC.homeValue * percent) / 100 });
                                }
                              }
                            }}
                            onFocus={() => {
                              setEditingScenarioCPercent(true);
                              setRawScenarioCPercent(scenarioC.homeValue > 0 ? ((scenarioC.downPayment / scenarioC.homeValue) * 100).toFixed(1) : '0.0');
                            }}
                            onBlur={() => {
                              setEditingScenarioCPercent(false);
                              setRawScenarioCPercent('');
                            }}
                            className="w-16 px-1 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center text-xs"
                            placeholder="%"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Loan Amount (Calculated) */}
                    <tr className="border-b-2 border-purple-200 bg-purple-50/30">
                      <td className="p-2 text-slate-700 font-semibold bg-slate-50 sticky left-0 z-10 min-w-[120px]">💰 Loan Amount</td>
                      <td className="p-2 text-center font-bold text-amber-700 bg-amber-50/50 border-l-2 border-amber-200 min-w-[150px]">
                        {formatCurrency(loanAmount)}
                      </td>
                      <td className="p-2 text-center font-bold text-purple-700 border-l-2 border-purple-100 min-w-[150px]">
                        {formatCurrency(scenarioBCalc.loanAmount)}
                      </td>
                      <td className="p-2 text-center font-bold text-purple-700 border-l-2 border-purple-100 min-w-[150px]">
                        {formatCurrency(scenarioCCalc.loanAmount)}
                      </td>
                    </tr>

                    {/* Interest Rate */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-2 text-slate-600 bg-slate-50 sticky left-0 z-10 min-w-[120px]">Interest Rate</td>
                      <td className="p-2 text-center font-semibold text-slate-800 bg-amber-50/30 border-l-2 border-amber-200 min-w-[150px]">
                        {interestRate}%
                      </td>
                      <td className="p-2 border-l-2 border-purple-100 min-w-[150px]">
                        <input
                          type="text"
                          value={scenarioB.interestRate}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            setScenarioB({ ...scenarioB, interestRate: val === '' ? 0 : Number(val) });
                          }}
                          className="w-full px-2 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center"
                          placeholder="%"
                        />
                      </td>
                      <td className="p-2 border-l-2 border-purple-100 min-w-[150px]">
                        <input
                          type="text"
                          value={scenarioC.interestRate}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            setScenarioC({ ...scenarioC, interestRate: val === '' ? 0 : Number(val) });
                          }}
                          className="w-full px-2 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center"
                          placeholder="%"
                        />
                      </td>
                    </tr>

                    {/* Loan Term */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-2 text-slate-600 bg-slate-50 sticky left-0 z-10 min-w-[120px]">Loan Term</td>
                      <td className="p-2 text-center font-semibold text-slate-800 bg-amber-50/30 border-l-2 border-amber-200 min-w-[150px]">
                        {tenure} years
                      </td>
                      <td className="p-2 border-l-2 border-purple-100 min-w-[150px]">
                        <input
                          type="text"
                          value={scenarioB.tenure}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setScenarioB({ ...scenarioB, tenure: val === '' ? 0 : Number(val) });
                          }}
                          className="w-full px-2 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center"
                          placeholder="years"
                        />
                      </td>
                      <td className="p-2 border-l-2 border-purple-100 min-w-[150px]">
                        <input
                          type="text"
                          value={scenarioC.tenure}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setScenarioC({ ...scenarioC, tenure: val === '' ? 0 : Number(val) });
                          }}
                          className="w-full px-2 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center"
                          placeholder="years"
                        />
                      </td>
                    </tr>

                    {/* Payment Type */}
                    <tr className="border-b-2 border-purple-200 hover:bg-slate-50/50 transition-colors">
                      <td className="p-2 text-slate-600 bg-slate-50 sticky left-0 z-10 min-w-[120px]">Payment Type</td>
                      <td className="p-2 text-center font-semibold text-slate-800 bg-amber-50/30 border-l-2 border-amber-200 min-w-[150px]">
                        {paymentType === 'monthly' ? 'Monthly' : 'Bi-weekly'}
                      </td>
                      <td className="p-2 border-l-2 border-purple-100 min-w-[150px]">
                        <select
                          value={scenarioB.paymentType}
                          onChange={(e) => setScenarioB({ ...scenarioB, paymentType: e.target.value as PaymentType })}
                          className="w-full px-2 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center text-xs"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="biweekly">Bi-weekly</option>
                        </select>
                      </td>
                      <td className="p-2 border-l-2 border-purple-100 min-w-[150px]">
                        <select
                          value={scenarioC.paymentType}
                          onChange={(e) => setScenarioC({ ...scenarioC, paymentType: e.target.value as PaymentType })}
                          className="w-full px-2 py-1 border border-purple-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-center text-xs"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="biweekly">Bi-weekly</option>
                        </select>
                      </td>
                    </tr>

                    {/* Results Header */}
                    <tr className="bg-purple-100">
                      <td colSpan={4} className="p-2 text-center font-bold text-purple-800 uppercase tracking-wider">
                        💰 Comparison Results
                      </td>
                    </tr>

                    {/* Monthly Payment */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-2 text-slate-600 bg-slate-50 sticky left-0 z-10 min-w-[120px]">Monthly Payment</td>
                      <td className="p-2 text-center font-bold text-slate-800 bg-amber-50/30 border-l-2 border-amber-200 min-w-[150px]">
                        {formatCurrency(currentScenarioBase.payment)}
                      </td>
                      <td className={`p-2 text-center font-bold border-l-2 border-purple-100 min-w-[150px] ${
                        scenarioBCalc.payment < currentScenarioBase.payment ? 'text-green-700 bg-green-50' : 
                        scenarioBCalc.payment > currentScenarioBase.payment ? 'text-red-700 bg-red-50' : 'text-slate-800'
                      }`}>
                        {formatCurrency(scenarioBCalc.payment)}
                        {scenarioBCalc.payment < currentScenarioBase.payment && <span className="ml-1">✓</span>}
                      </td>
                      <td className={`p-2 text-center font-bold border-l-2 border-purple-100 min-w-[150px] ${
                        scenarioCCalc.payment < currentScenarioBase.payment ? 'text-green-700 bg-green-50' : 
                        scenarioCCalc.payment > currentScenarioBase.payment ? 'text-red-700 bg-red-50' : 'text-slate-800'
                      }`}>
                        {formatCurrency(scenarioCCalc.payment)}
                        {scenarioCCalc.payment < currentScenarioBase.payment && <span className="ml-1">✓</span>}
                      </td>
                    </tr>

                    {/* Total Interest */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-2 text-slate-600 bg-slate-50 sticky left-0 z-10 min-w-[120px]">Total Interest Paid</td>
                      <td className="p-2 text-center font-bold text-slate-800 bg-amber-50/30 border-l-2 border-amber-200 min-w-[150px]">
                        {formatCurrency(currentScenarioBase.totalInterest)}
                      </td>
                      <td className={`p-2 text-center font-bold border-l-2 border-purple-100 min-w-[150px] ${
                        scenarioBCalc.totalInterest < currentScenarioBase.totalInterest ? 'text-green-700 bg-green-50' : 
                        scenarioBCalc.totalInterest > currentScenarioBase.totalInterest ? 'text-red-700 bg-red-50' : 'text-slate-800'
                      }`}>
                        {formatCurrency(scenarioBCalc.totalInterest)}
                        {scenarioBCalc.totalInterest < currentScenarioBase.totalInterest && <span className="ml-1">💚</span>}
                      </td>
                      <td className={`p-2 text-center font-bold border-l-2 border-purple-100 min-w-[150px] ${
                        scenarioCCalc.totalInterest < currentScenarioBase.totalInterest ? 'text-green-700 bg-green-50' : 
                        scenarioCCalc.totalInterest > currentScenarioBase.totalInterest ? 'text-red-700 bg-red-50' : 'text-slate-800'
                      }`}>
                        {formatCurrency(scenarioCCalc.totalInterest)}
                        {scenarioCCalc.totalInterest < currentScenarioBase.totalInterest && <span className="ml-1">💚</span>}
                      </td>
                    </tr>

                    {/* Total Amount Paid */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-2 text-slate-600 bg-slate-50 sticky left-0 z-10 min-w-[120px]">Total Amount Paid</td>
                      <td className="p-2 text-center font-bold text-slate-800 bg-amber-50/30 border-l-2 border-amber-200 min-w-[150px]">
                        {formatCurrency(currentScenarioBase.totalPaid)}
                      </td>
                      <td className={`p-2 text-center font-bold border-l-2 border-purple-100 min-w-[150px] ${
                        scenarioBCalc.totalPaid < currentScenarioBase.totalPaid ? 'text-green-700 bg-green-50' : 
                        scenarioBCalc.totalPaid > currentScenarioBase.totalPaid ? 'text-red-700 bg-red-50' : 'text-slate-800'
                      }`}>
                        {formatCurrency(scenarioBCalc.totalPaid)}
                      </td>
                      <td className={`p-2 text-center font-bold border-l-2 border-purple-100 min-w-[150px] ${
                        scenarioCCalc.totalPaid < currentScenarioBase.totalPaid ? 'text-green-700 bg-green-50' : 
                        scenarioCCalc.totalPaid > currentScenarioBase.totalPaid ? 'text-red-700 bg-red-50' : 'text-slate-800'
                      }`}>
                        {formatCurrency(scenarioCCalc.totalPaid)}
                      </td>
                    </tr>

                    {/* Payoff Time */}
                    <tr className="border-b-2 border-purple-200 hover:bg-slate-50/50 transition-colors">
                      <td className="p-2 text-slate-600 bg-slate-50 sticky left-0 z-10 min-w-[120px]">Time to Pay Off</td>
                      <td className="p-2 text-center font-bold text-slate-800 bg-amber-50/30 border-l-2 border-amber-200 min-w-[150px]">
                        {currentScenarioBase.tenure} years
                      </td>
                      <td className={`p-2 text-center font-bold border-l-2 border-purple-100 min-w-[150px] ${
                        scenarioBCalc.tenure < currentScenarioBase.tenure ? 'text-green-700 bg-green-50' : 
                        scenarioBCalc.tenure > currentScenarioBase.tenure ? 'text-red-700 bg-red-50' : 'text-slate-800'
                      }`}>
                        {scenarioBCalc.tenure} years
                        {scenarioBCalc.tenure < currentScenarioBase.tenure && <span className="ml-1">⚡</span>}
                      </td>
                      <td className={`p-2 text-center font-bold border-l-2 border-purple-100 min-w-[150px] ${
                        scenarioCCalc.tenure < currentScenarioBase.tenure ? 'text-green-700 bg-green-50' : 
                        scenarioCCalc.tenure > currentScenarioBase.tenure ? 'text-red-700 bg-red-50' : 'text-slate-800'
                      }`}>
                        {scenarioCCalc.tenure} years
                        {scenarioCCalc.tenure < currentScenarioBase.tenure && <span className="ml-1">⚡</span>}
                      </td>
                    </tr>

                    {/* Savings vs Current */}
                    <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 font-bold">
                      <td className="p-3 text-purple-800 bg-slate-50 sticky left-0 z-10 min-w-[120px]">💰 Savings vs Current</td>
                      <td className="p-3 text-center text-amber-700 bg-amber-100 border-l-2 border-amber-300 min-w-[150px]">
                        Current Choice
                      </td>
                      <td className={`p-3 text-center border-l-2 border-purple-200 min-w-[150px] ${
                        scenarioBCalc.totalInterest < currentScenarioBase.totalInterest 
                          ? 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-800' 
                          : 'bg-gradient-to-br from-red-100 to-rose-100 text-red-800'
                      }`}>
                        {scenarioBCalc.totalInterest < currentScenarioBase.totalInterest 
                          ? `💚 Save ${formatCurrency(currentScenarioBase.totalInterest - scenarioBCalc.totalInterest)}`
                          : `❌ Pay ${formatCurrency(scenarioBCalc.totalInterest - currentScenarioBase.totalInterest)} more`
                        }
                      </td>
                      <td className={`p-3 text-center border-l-2 border-purple-200 min-w-[150px] ${
                        scenarioCCalc.totalInterest < currentScenarioBase.totalInterest 
                          ? 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-800' 
                          : 'bg-gradient-to-br from-red-100 to-rose-100 text-red-800'
                      }`}>
                        {scenarioCCalc.totalInterest < currentScenarioBase.totalInterest 
                          ? `💚 Save ${formatCurrency(currentScenarioBase.totalInterest - scenarioCCalc.totalInterest)}`
                          : `❌ Pay ${formatCurrency(scenarioCCalc.totalInterest - currentScenarioBase.totalInterest)} more`
                        }
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                <p className="text-xs text-slate-600 text-center">
                  💡 <strong>Tip:</strong> Green = Better than current | Red = Worse than current | 
                  Lower interest rates and shorter terms typically save money but increase monthly payments.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refinance Analysis Modal - Rendered at body level */}
      {showRefinanceAnalysis && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
          onClick={() => setShowRefinanceAnalysis(false)}
        >
          <div 
            className="bg-white rounded-lg sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto transform transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-3 sm:px-6 py-3 sm:py-4 rounded-t-lg sm:rounded-t-2xl flex items-center justify-between shadow-lg z-10">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl">💡</span>
                <div>
                  <h2 className="text-base sm:text-xl font-bold">Should You Refinance? Let's Find Out</h2>
                  <p className="text-[10px] sm:text-xs text-orange-100 mt-0.5 hidden sm:block">Compare your current loan with new refinancing options — See savings & break-even point</p>
                </div>
              </div>
              <button
                onClick={() => setShowRefinanceAnalysis(false)}
                className="text-white hover:text-orange-200 transition-colors text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 flex-shrink-0"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4 italic bg-orange-50 p-3 rounded-lg border border-orange-200">
                🎯 <strong>Considering refinancing?</strong> Enter your current loan details and new loan offer to see if you'll actually save money, and how long it'll take to break even on closing costs.
              </p>

              {/* Input Section */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Current Loan */}
                <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="text-xl">📄</span>
                    Current Loan
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Remaining Balance</label>
                      <input
                        type="text"
                        value={refinanceData.remainingBalance.toLocaleString()}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setRefinanceData({ ...refinanceData, remainingBalance: val === '' ? 0 : Number(val) });
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
                        placeholder="$280,000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Current Interest Rate (%)</label>
                      <input
                        type="text"
                        value={editingCurrentRate ? rawCurrentRate : (refinanceData.currentRate === 0 ? '' : refinanceData.currentRate.toString())}
                        onChange={(e) => {
                          setEditingCurrentRate(true);
                          const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                          // Prevent multiple decimal points
                          const parts = cleaned.split('.');
                          const validValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
                          setRawCurrentRate(validValue);
                          if (validValue === '' || validValue === '.') {
                            setRefinanceData({ ...refinanceData, currentRate: 0 });
                          } else if (/^\d*\.?\d*$/.test(validValue)) {
                            const num = Number(validValue);
                            if (!isNaN(num) && num >= 0) {
                              setRefinanceData({ ...refinanceData, currentRate: num });
                            }
                          }
                        }}
                        onFocus={() => {
                          setEditingCurrentRate(true);
                          setRawCurrentRate(refinanceData.currentRate === 0 ? '' : refinanceData.currentRate.toString());
                        }}
                        onBlur={() => {
                          setEditingCurrentRate(false);
                          setRawCurrentRate('');
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
                        placeholder="7.5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Current Projected Payoff Date
                        <span className="text-orange-600 ml-1">*</span>
                      </label>
                      <DatePicker
                        value={refinanceData.currentPayoffDate}
                        onChange={(date) => setRefinanceData({ ...refinanceData, currentPayoffDate: date })}
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        📋 Check your mortgage statement - when will it be paid off?
                        {refinanceData.currentPayoffDate && (() => {
                          const dateParts = refinanceData.currentPayoffDate.split('-');
                          const year = parseInt(dateParts[0]);
                          const month = parseInt(dateParts[1]);
                          const day = dateParts.length > 2 ? parseInt(dateParts[2]) : 1;
                          const payoffDate = new Date(year, month - 1, day);
                          const today = new Date();
                          const months = Math.max(0, (payoffDate.getFullYear() - today.getFullYear()) * 12 + 
                                        (payoffDate.getMonth() - today.getMonth()));
                          const years = Math.floor(months / 12);
                          const remainingMonths = months % 12;
                          return (
                            <span className="block text-green-600 font-semibold mt-1">
                              {years > 0 && `${years} year${years > 1 ? 's' : ''}`}
                              {years > 0 && remainingMonths > 0 && ', '}
                              {remainingMonths > 0 && `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`}
                              {' remaining'}
                            </span>
                          );
                        })()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Future Extra Payment (Optional)</label>
                      <input
                        type="text"
                        value={refinanceData.currentExtraPayment > 0 ? refinanceData.currentExtraPayment.toLocaleString() : ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setRefinanceData({ ...refinanceData, currentExtraPayment: val === '' ? 0 : Number(val) });
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
                        placeholder="$0 (if planning to add)"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Will you make ADDITIONAL extras going forward?
                      </p>
                    </div>
                  </div>
                </div>

                {/* New Refinance Loan */}
                <div className="bg-orange-50 rounded-xl p-4 border-2 border-orange-200">
                  <h3 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    New Refinance
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">New Interest Rate (%)</label>
                      <input
                        type="text"
                        value={editingNewRate ? rawNewRate : (refinanceData.newRate === 0 ? '' : refinanceData.newRate.toString())}
                        onChange={(e) => {
                          setEditingNewRate(true);
                          const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                          // Prevent multiple decimal points
                          const parts = cleaned.split('.');
                          const validValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
                          setRawNewRate(validValue);
                          if (validValue === '' || validValue === '.') {
                            setRefinanceData({ ...refinanceData, newRate: 0 });
                          } else if (/^\d*\.?\d*$/.test(validValue)) {
                            const num = Number(validValue);
                            if (!isNaN(num) && num >= 0) {
                              setRefinanceData({ ...refinanceData, newRate: num });
                            }
                          }
                        }}
                        onFocus={() => {
                          setEditingNewRate(true);
                          setRawNewRate(refinanceData.newRate === 0 ? '' : refinanceData.newRate.toString());
                        }}
                        onBlur={() => {
                          setEditingNewRate(false);
                          setRawNewRate('');
                        }}
                        className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
                        placeholder="6.0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Closing Costs</label>
                      <input
                        type="text"
                        value={refinanceData.closingCosts.toLocaleString()}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setRefinanceData({ ...refinanceData, closingCosts: val === '' ? 0 : Number(val) });
                        }}
                        className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
                        placeholder="$3,500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">New Loan Term (years)</label>
                      <input
                        type="text"
                        value={refinanceData.newTerm}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setRefinanceData({ ...refinanceData, newTerm: val === '' ? 0 : Number(val) });
                        }}
                        className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
                        placeholder="30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Monthly Extra Payment (Optional)</label>
                      <input
                        type="text"
                        value={refinanceData.newExtraPayment > 0 ? refinanceData.newExtraPayment.toLocaleString() : ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setRefinanceData({ ...refinanceData, newExtraPayment: val === '' ? 0 : Number(val) });
                        }}
                        className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
                        placeholder="$0 (if planning extras)"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Will you make extra payments on new loan?
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results - Break-even Analysis */}
              <div className={`p-4 rounded-xl mb-4 border-2 ${
                refinanceCalc.worthIt 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' 
                  : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    {refinanceCalc.worthIt ? (
                      <>
                        <span className="text-2xl">✅</span>
                        <span className="text-green-800">Refinancing Makes Sense!</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">⚠️</span>
                        <span className="text-red-800">Consider Carefully</span>
                      </>
                    )}
                  </h3>
                  
                  {/* Apply to Main Calculator - Visible Location */}
                  <button
                    onClick={() => {
                      // Apply Refinance using helper function
                      applyScenarioToCalculator(
                        {
                          homeValue: refinanceData.remainingBalance,
                          downPayment: 0,
                          interestRate: refinanceData.newRate,
                          tenure: refinanceData.newTerm,
                          extraPayment: refinanceData.newExtraPayment
                        },
                        { homeValueInput, downPaymentInput, interestRateInput, tenureInput, extraPaymentAmountInput },
                        { setStartDate, setExtraPaymentEnabled, setExtraPaymentFrequency, setExtraStartDate: setExtraPaymentStartDate }
                      );
                      setShowRefinanceAnalysis(false);
                    }}
                    className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors shadow-md cursor-pointer"
                  >
                    <span className="text-sm font-bold whitespace-nowrap">🚀 Apply to Calculator</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center p-3 bg-orange-50/30 rounded-lg border border-orange-200">
                    <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1 break-words">
                      {refinanceCalc.breakEvenYears.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-600 uppercase tracking-wide font-semibold">Years to Break Even</div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      ({Math.ceil(refinanceCalc.breakEvenMonths)} months)
                    </div>
                  </div>
                  <div className="text-center p-3 bg-green-50/30 rounded-lg border border-green-200">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1 break-words">
                      {formatCurrency(refinanceCalc.monthlySavings)}
                    </div>
                    <div className="text-xs text-slate-600 uppercase tracking-wide font-semibold">Monthly Savings</div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Lower payment
                    </div>
                  </div>
                  <div className="text-center p-3 bg-blue-50/30 rounded-lg border border-blue-200">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 break-words">
                      {formatCurrency(Math.abs(refinanceCalc.totalSavings))}
                    </div>
                    <div className="text-xs text-slate-600 uppercase tracking-wide font-semibold">
                      {refinanceCalc.totalSavings > 0 ? 'Total Savings' : 'Extra Cost'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {refinanceCalc.totalSavings > 0 ? 'Over loan life' : 'Due to longer term'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-orange-200">
                      <th className="text-left p-3 font-semibold text-slate-700 bg-slate-50">Metric</th>
                      <th className="p-3 font-semibold text-slate-700 bg-slate-100 border-l-2 border-slate-200">Current Loan</th>
                      <th className="p-3 font-semibold text-orange-700 bg-orange-50 border-l-2 border-orange-200">Refinanced Loan</th>
                      <th className="p-3 font-semibold text-blue-700 bg-blue-50 border-l-2 border-blue-200">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-3 text-slate-600 font-medium">
                        Monthly Payment
                        {(refinanceData.currentExtraPayment > 0 || refinanceData.newExtraPayment > 0) && (
                          <div className="text-[10px] text-slate-500">(Base + Extra)</div>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-800 bg-slate-50">
                        {formatCurrency(refinanceCalc.currentMonthlyTotal)}
                        {refinanceData.currentExtraPayment > 0 && (
                          <div className="text-[10px] font-normal text-slate-600">
                            {formatCurrency(refinanceCalc.currentPayment)} + {formatCurrency(refinanceData.currentExtraPayment)}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold text-orange-700 bg-orange-50/30">
                        {formatCurrency(refinanceCalc.newMonthlyTotal)}
                        {refinanceData.newExtraPayment > 0 && (
                          <div className="text-[10px] font-normal text-slate-600">
                            {formatCurrency(refinanceCalc.newPayment)} + {formatCurrency(refinanceData.newExtraPayment)}
                          </div>
                        )}
                      </td>
                      <td className={`p-3 text-center font-bold ${refinanceCalc.currentMonthlyTotal > refinanceCalc.newMonthlyTotal ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                        {refinanceCalc.currentMonthlyTotal > refinanceCalc.newMonthlyTotal 
                          ? `💚 Save ${formatCurrency(refinanceCalc.currentMonthlyTotal - refinanceCalc.newMonthlyTotal)}`
                          : `❌ Pay ${formatCurrency(refinanceCalc.newMonthlyTotal - refinanceCalc.currentMonthlyTotal)} more`
                        }
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-3 text-slate-600 font-medium">Total Interest Paid</td>
                      <td className="p-3 text-center font-bold text-slate-800 bg-slate-50">{formatCurrency(refinanceCalc.currentTotalInterest)}</td>
                      <td className="p-3 text-center font-bold text-orange-700 bg-orange-50/30">{formatCurrency(refinanceCalc.newTotalInterest)}</td>
                      <td className={`p-3 text-center font-bold ${refinanceCalc.interestSavings > 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                        {refinanceCalc.interestSavings > 0 
                          ? `💚 Save ${formatCurrency(refinanceCalc.interestSavings)}`
                          : `❌ Pay ${formatCurrency(Math.abs(refinanceCalc.interestSavings))} more`
                        }
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-3 text-slate-600 font-medium">Total Amount Paid</td>
                      <td className="p-3 text-center font-bold text-slate-800 bg-slate-50">{formatCurrency(refinanceCalc.currentTotalPayments)}</td>
                      <td className="p-3 text-center font-bold text-orange-700 bg-orange-50/30">{formatCurrency(refinanceCalc.newTotalPayments)}</td>
                      <td className={`p-3 text-center font-bold ${refinanceCalc.totalSavings > 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                        {refinanceCalc.totalSavings > 0 
                          ? `💚 Save ${formatCurrency(refinanceCalc.totalSavings)}`
                          : `❌ Pay ${formatCurrency(Math.abs(refinanceCalc.totalSavings))} more`
                        }
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-3 text-slate-600 font-medium">Time to Pay Off</td>
                      <td className="p-3 text-center font-bold text-slate-800 bg-slate-50">
                        {(refinanceCalc.remainingMonths / 12).toFixed(1)} years
                        {refinanceData.currentExtraPayment > 0 && (
                          <div className="text-[10px] font-normal text-green-600">with extras</div>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold text-orange-700 bg-orange-50/30">
                        {(refinanceCalc.actualNewMonths / 12).toFixed(1)} years
                        {refinanceData.newExtraPayment > 0 && (
                          <div className="text-[10px] font-normal text-green-600">with extras</div>
                        )}
                      </td>
                      <td className={`p-3 text-center font-bold ${refinanceCalc.timeDifference < 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                        {refinanceCalc.timeDifference < 0 
                          ? `💚 ${Math.abs(refinanceCalc.timeDifference).toFixed(1)} years faster`
                          : `❌ ${refinanceCalc.timeDifference.toFixed(1)} years longer`
                        }
                      </td>
                    </tr>
                    <tr className="bg-orange-100 border-t-2 border-orange-300">
                      <td className="p-3 text-orange-800 font-bold">Closing Costs</td>
                      <td className="p-3 text-center text-slate-500">—</td>
                      <td className="p-3 text-center font-bold text-orange-700">{formatCurrency(refinanceData.closingCosts)}</td>
                      <td className="p-3 text-center font-bold text-red-700">Cost</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Recommendations */}
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-bold text-blue-800 mb-2">💡 Recommendation</h4>
                <div className="text-xs text-slate-700 space-y-1">
                  {refinanceCalc.worthIt ? (
                    <>
                      <p>✅ <strong>Refinancing is recommended!</strong> You'll break even in {refinanceCalc.breakEvenYears.toFixed(1)} years.</p>
                      <p>• Save {formatCurrency(refinanceCalc.monthlySavings)} per month</p>
                      <p>• Total savings: {formatCurrency(refinanceCalc.totalSavings)} over the life of the loan</p>
                      {refinanceCalc.breakEvenMonths < 24 && <p>• Quick break-even point makes this a strong candidate!</p>}
                    </>
                  ) : (
                    <>
                      <p>⚠️ <strong>Refinancing may not be worth it.</strong></p>
                      {refinanceCalc.breakEvenMonths > refinanceCalc.remainingMonths && (
                        <p>• You won't break even before the loan is paid off ({Math.ceil(refinanceCalc.breakEvenMonths)} months needed)</p>
                      )}
                      {refinanceCalc.totalSavings < 0 && (
                        <p>• You'll pay {formatCurrency(Math.abs(refinanceCalc.totalSavings))} more due to the longer term and closing costs</p>
                      )}
                      <p>• Consider staying with your current loan or negotiating lower closing costs</p>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SEO Content Section */}
      <div className="max-w-6xl mx-auto mt-12 px-4 pb-12">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 md:p-10 border border-slate-200">
          
          {/* Main H1 - Hidden visually but present for SEO */}
          <h1 className="sr-only">Mortgage Calculator: Primary & Investment Property, Bi-Weekly Payments & Extra Payment Optimizer</h1>
          
          {/* Subheading */}
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6 text-center border-b-2 border-blue-500 pb-3">
            Free Mortgage Calculator with Investment Property Analysis & Loan Comparison
          </h2>
          
          {/* Intro Paragraph */}
          <div className="prose prose-slate max-w-none mb-8">
            <p className="text-lg text-slate-700 leading-relaxed mb-6">
              Stop using 3-4 different calculators. Our comprehensive mortgage calculator combines everything you need: <strong>rental property analysis, bi-weekly payments, extra payment tracking, loan comparison, and refinance break-even analysis, Amortization Schedule</strong>—all in one place.
            </p>
          </div>
          
          {/* Feature Highlight Box */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 sm:p-8 mb-10 border-2 border-blue-200 shadow-md">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 text-center">What Makes This Calculator Different?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="text-lg font-bold text-slate-800 mb-2">
                  <span aria-label="Home icon - Rental Property Mode">🏠</span> Rental Property Mode
                </div>
                <p className="text-sm text-slate-600">Calculate CAP rate, Cash-on-Cash return, NOI, and break-even occupancy</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="text-lg font-bold text-slate-800 mb-2">
                  <span aria-label="Clock icon - Bi-Weekly Payments">⏱️</span> Bi-Weekly Payments
                </div>
                <p className="text-sm text-slate-600">Save $96,000+ in interest and pay off 6 years faster</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="text-lg font-bold text-slate-800 mb-2">
                  <span aria-label="Money bag icon - Extra Payments">💰</span> Extra Payments
                </div>
                <p className="text-sm text-slate-600">Track unlimited one-time and recurring extra payments</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="text-lg font-bold text-slate-800 mb-2">
                  <span aria-label="Balance scale icon - Loan Comparison">⚖️</span> Loan Comparison
                </div>
                <p className="text-sm text-slate-600">Compare 3 mortgage scenarios side-by-side instantly</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="text-lg font-bold text-slate-800 mb-2">
                  <span aria-label="Refresh icon - Refinance Analysis">🔄</span> Refinance Analysis
                </div>
                <p className="text-sm text-slate-600">Discover your break-even point and total savings</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="text-lg font-bold text-slate-800 mb-2">
                  <span aria-label="Chart icon - Full Amortization">📊</span> Full Amortization
                </div>
                <p className="text-sm text-slate-600">View detailed payment schedule and export to CSV</p>
              </div>
            </div>
          </div>

          {/* Pain Points Section */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 border-b-2 border-orange-500 pb-2">
              The Problems with Standard Calculators
            </h2>
            
            <h3 className="text-xl font-semibold text-slate-700 mb-3 mt-6">❌ Can't Handle Multiple Payment Scenarios</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Standard calculators limit you to one extra payment type. What if you receive a year-end bonus in December, a tax refund in April, and want to add $200 monthly? Our calculator supports <strong>unlimited one-time payments</strong> plus <strong>recurring extra payments</strong> (monthly or bi-weekly), giving you a true picture of your accelerated payoff timeline.
            </p>

            <h3 className="text-xl font-semibold text-slate-700 mb-3">❌ No Side-by-Side Loan Comparison</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Shopping for the best mortgage rate? Most calculators force you to manually track multiple scenarios in a spreadsheet. Our <strong>Compare Loans</strong> feature lets you evaluate three different loan scenarios simultaneously—comparing monthly payments, total interest, and payoff timelines in one interactive comparison table with visual graphs.
            </p>

            <h3 className="text-xl font-semibold text-slate-700 mb-3">❌ Missing Refinance Break-Even Analysis</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Considering refinancing but unsure if closing costs are worth it? Our <strong>refinance calculator</strong> instantly shows your break-even point, total savings, and provides clear recommendations on whether refinancing makes financial sense based on your specific situation.
            </p>

            <h3 className="text-xl font-semibold text-slate-700 mb-3">❌ Zero Investment Property Support</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Evaluating a rental property? Traditional mortgage calculators ignore rental income, vacancy rates, property management fees, and operating expenses. Our dedicated <strong>Investment Property mode</strong> calculates critical metrics like <strong>Cash-on-Cash Return</strong>, <strong>Cap Rate</strong>, <strong>Net Operating Income (NOI)</strong>, and <strong>Break-Even Occupancy</strong>—giving you institutional-grade analysis for free.
            </p>
          </div>

          {/* Feature Explanations */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6 border-b-2 border-green-500 pb-3">
              How to Use Each Feature
            </h2>

            <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-4 mt-8">1. Investment Property Rental Analysis</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Analyzing a rental property? Switch to <strong>Investment Property Mode</strong> to calculate:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-6 ml-4">
              <li><strong>Monthly & Annual Cash Flow:</strong> See your actual rental income minus expenses</li>
              <li><strong>Cash-on-Cash Return:</strong> Your annual return on the cash invested</li>
              <li><strong>Capitalization Rate (CAP Rate):</strong> Quick measure of property profitability</li>
              <li><strong>Net Operating Income (NOI):</strong> Rental income minus operating expenses</li>
              <li><strong>Break-Even Occupancy:</strong> Minimum occupancy rate needed to cover expenses</li>
            </ul>

            <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-4 mt-8">2. Bi-Weekly Mortgage Payments</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              One of the most powerful mortgage strategies is switching to <strong>bi-weekly payments</strong>. Here's how it works:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
              <li>Instead of 12 monthly payments per year, you make 26 bi-weekly payments</li>
              <li>This equals 13 full monthly payments annually (instead of 12)</li>
              <li>That extra payment goes directly toward principal, reducing interest dramatically</li>
            </ul>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
              <p className="text-slate-800 font-semibold mb-2">Real Example: On a $320,000 mortgage at 6.5% interest:</p>
              <ul className="list-disc list-inside text-slate-700 space-y-1 ml-4">
                <li>Monthly payments: $2,022.62/month for 30 years</li>
                <li>Bi-weekly payments: $1,011.31 every 2 weeks for 24 years</li>
                <li className="font-bold text-green-700">You save: $96,447 in interest + 6 years of payments</li>
              </ul>
            </div>

            <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-4 mt-8">3. Track Mortgage Extra Payments</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Use this feature to see the impact of any extra payment strategy:
            </p>
            <h4 className="text-lg font-semibold text-slate-700 mb-3 mt-4">One-Time Extra Payments</h4>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
              <li>Year-end bonuses</li>
              <li>Tax refunds</li>
              <li>Inheritance or gifts</li>
              <li>Side income windfalls</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mb-4">
              Specify the date and amount. The calculator shows exactly how many years/months you'll save and total interest reduction.
            </p>
            <h4 className="text-lg font-semibold text-slate-700 mb-3 mt-4">Recurring Extra Payments</h4>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
              <li>Add $100/month extra</li>
              <li>Add $500 bi-weekly</li>
              <li>Any recurring amount</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mb-6">
              See cumulative impact over your loan term.
            </p>

            <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-4 mt-8">4. Compare 3 Mortgage Loans Side-by-Side</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Shopping for the best rate? Use our <strong>3-way loan comparison</strong> to instantly see:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
              <li>Different interest rates (e.g., 5.5% vs 6.0% vs 6.5%)</li>
              <li>Different loan terms (e.g., 15-year vs 20-year vs 30-year)</li>
              <li>Different down payments</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mb-4 font-semibold">Visual charts show:</p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-6 ml-4">
              <li>Monthly payment differences</li>
              <li>Total interest paid</li>
              <li>Payoff timeline</li>
            </ul>

            <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-4 mt-8">5. Refinance Break-Even Calculator</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Considering refinancing? This feature instantly tells you:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4 ml-4">
              <li><strong>Months to break even:</strong> How long until refinance savings offset closing costs</li>
              <li><strong>Monthly savings:</strong> How much you'll save per payment</li>
              <li><strong>Total savings over loan life:</strong> Total money saved if you keep the loan to maturity</li>
            </ul>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-6">
              <p className="text-slate-800 font-semibold">
                <strong>Example:</strong> You'll see "Break even in 18 months" with monthly savings of $343 and total savings of $43,435.
              </p>
            </div>
          </div>

          {/* Comparison Table Section */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6 border-b-2 border-indigo-500 pb-3">
              How We Compare to Other Mortgage Calculators
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                    <th className="border border-slate-300 p-3 text-left font-bold">Feature</th>
                    <th className="border border-slate-300 p-3 text-center font-bold">Our Calculator</th>
                    <th className="border border-slate-300 p-3 text-center font-bold">Standard Calculators</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white hover:bg-slate-50">
                    <td className="border border-slate-300 p-3 font-semibold">Investment Property Analysis</td>
                    <td className="border border-slate-300 p-3 text-center text-green-600 font-bold">✓ Included</td>
                    <td className="border border-slate-300 p-3 text-center text-red-600">✗ Not Available</td>
                  </tr>
                  <tr className="bg-slate-50 hover:bg-slate-100">
                    <td className="border border-slate-300 p-3 font-semibold">Multiple One-Time Payments</td>
                    <td className="border border-slate-300 p-3 text-center text-green-600 font-bold">✓ Unlimited</td>
                    <td className="border border-slate-300 p-3 text-center text-red-600">✗ Limited/None</td>
                  </tr>
                  <tr className="bg-white hover:bg-slate-50">
                    <td className="border border-slate-300 p-3 font-semibold">Bi-Weekly Payment Comparison</td>
                    <td className="border border-slate-300 p-3 text-center text-green-600 font-bold">✓ Side-by-Side</td>
                    <td className="border border-slate-300 p-3 text-center text-red-600">✗ Separate Calculations</td>
                  </tr>
                  <tr className="bg-slate-50 hover:bg-slate-100">
                    <td className="border border-slate-300 p-3 font-semibold">3-Way Loan Comparison</td>
                    <td className="border border-slate-300 p-3 text-center text-green-600 font-bold">✓ Visual Charts</td>
                    <td className="border border-slate-300 p-3 text-center text-red-600">✗ Manual Comparison</td>
                  </tr>
                  <tr className="bg-white hover:bg-slate-50">
                    <td className="border border-slate-300 p-3 font-semibold">Refinance Break-Even Analysis</td>
                    <td className="border border-slate-300 p-3 text-center text-green-600 font-bold">✓ Automatic</td>
                    <td className="border border-slate-300 p-3 text-center text-red-600">✗ Manual Calculation</td>
                  </tr>
                  <tr className="bg-slate-50 hover:bg-slate-100">
                    <td className="border border-slate-300 p-3 font-semibold">Taxes & Insurance Included</td>
                    <td className="border border-slate-300 p-3 text-center text-green-600 font-bold">✓ Optional</td>
                    <td className="border border-slate-300 p-3 text-center text-yellow-600">⚠ Some Include</td>
                  </tr>
                  <tr className="bg-white hover:bg-slate-50">
                    <td className="border border-slate-300 p-3 font-semibold">Excel Export with Charts</td>
                    <td className="border border-slate-300 p-3 text-center text-green-600 font-bold">✓ Full Report</td>
                    <td className="border border-slate-300 p-3 text-center text-red-600">✗ CSV Only</td>
                  </tr>
                  <tr className="bg-slate-50 hover:bg-slate-100">
                    <td className="border border-slate-300 p-3 font-semibold">Recurring Extra Payments</td>
                    <td className="border border-slate-300 p-3 text-center text-green-600 font-bold">✓ Monthly/Bi-Weekly</td>
                    <td className="border border-slate-300 p-3 text-center text-yellow-600">⚠ Limited Options</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 border-b-2 border-purple-500 pb-2">
              Key Features at a Glance
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">🏠 Primary Home Mode</h4>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• Monthly or bi-weekly payments</li>
                  <li>• Multiple one-time extra payments</li>
                  <li>• Recurring extra payment tracking</li>
                  <li>• Full amortization schedule</li>
                  <li>• Interest savings visualization</li>
                </ul>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-2">🏘️ Investment Property Mode</h4>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• Rental income with vacancy rate</li>
                  <li>• Operating expense tracking</li>
                  <li>• Cash-on-Cash Return calculation</li>
                  <li>• Cap Rate & NOI analysis</li>
                  <li>• Break-Even Occupancy metric</li>
                </ul>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2">📊 Loan Comparison</h4>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• Compare 3 scenarios side-by-side</li>
                  <li>• Visual comparison graphs</li>
                  <li>• Instant "Apply to Calculator" button</li>
                  <li>• Home value & down payment inputs</li>
                  <li>• Total interest comparison</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">🔄 Refinance Analysis</h4>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• Break-even timeline calculation</li>
                  <li>• Total savings projection</li>
                  <li>• Closing costs consideration</li>
                  <li>• Clear refinance recommendation</li>
                  <li>• Current vs. new loan comparison</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Methodology Section */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 border-b-2 border-indigo-500 pb-2">
              Our Calculation Methodology
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              All calculations use industry-standard financial formulas to ensure accuracy and reliability. Here's how we compute your mortgage:
            </p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Monthly Payment Formula:</h4>
                <p className="text-sm text-slate-600 font-mono bg-white p-2 rounded border border-slate-300">
                  M = P [ r(1 + r)^n ] / [ (1 + r)^n - 1 ]
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Where: M = Monthly Payment, P = Principal (loan amount), r = Monthly interest rate (annual rate / 12), n = Number of payments (years × 12)
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Amortization Schedule:</h4>
                <p className="text-sm text-slate-600">
                  Each payment is split between principal and interest. Early payments have more interest; later payments have more principal. Extra payments reduce principal directly, shortening the loan term and reducing total interest.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Investment Property Metrics:</h4>
                <ul className="text-sm text-slate-600 space-y-1 ml-4">
                  <li>• <strong>Cash-on-Cash Return:</strong> Annual Cash Flow / Total Cash Invested × 100</li>
                  <li>• <strong>Cap Rate:</strong> Net Operating Income (NOI) / Property Value × 100</li>
                  <li>• <strong>Break-Even Occupancy:</strong> (Operating Expenses + Debt Service) / Gross Potential Rent × 100</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-300 text-center mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to Optimize Your Mortgage?</h3>
            <p className="text-slate-700 mb-4">
              Start using the calculator above to explore your options, compare loans, analyze refinancing, or evaluate investment properties. All features are 100% free with no signup required.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              Start Your New Analysis Now
            </button>
            <p className="text-sm text-slate-600 italic mt-4">
              💡 Tip: Try the "Compare Loans" feature to see how different down payments or interest rates affect your monthly payment and total interest paid.
            </p>
          </div>

          {/* Footer with Last Updated */}
          <div className="text-center text-sm text-slate-500 border-t border-slate-200 pt-4">
            <p className="mb-2">Last Updated: November 2025</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <a href="#privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#terms" className="hover:text-blue-600 transition-colors">Terms of Service</a>
              <span>•</span>
              <a href="#methodology" className="hover:text-blue-600 transition-colors" onClick={(e) => { e.preventDefault(); document.querySelector('h2:has-text("Calculation Methodology")')?.scrollIntoView({ behavior: 'smooth' }); }}>Methodology</a>
            </div>
          </div>

        </div>
      </div>

      {/* Viral Share & Email Capture Section */}
      {hasCalculated && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <ViralShareResults
            calculationData={{
              savingsAmount: interestSaved,
              savingsYears: timeSaved,
              paymentType: paymentType,
              loanAmount,
              totalInterest,
              monthlyPayment: paymentAmount
            }}
          />
        </div>
      )}

      {/* Testimonials Section */}
      {/* <Testimonials /> */}

      {/* SEO Content Section - Educational content and FAQs for better search rankings */}
      <SEOContent />
    </div>
  );
};

export default MortgageCalculator;

