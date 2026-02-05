// Main Mortgage Calculator Component - Modularized Version
// This file demonstrates the clean architecture using separated modules

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChevronDown, ArrowLeft, Wallet, Home as HomeIcon, TrendingUp } from 'lucide-react';

// Import types
import type { OneTimePayment, PaymentType, Currency, SavedMortgage } from './types/mortgage';

// Import utilities
import { formatDate, setGlobalCurrency, formatCurrency } from './utils/formatting';
import { calculateMonthlyPayment, simulateMonthlyAmortization, simulateBiweeklyAmortization } from './utils/calculations-helpers';
import { applyRefinanceToCalculator, applyScenarioToCalculator } from './helpers/applyScenario';
import { exportToExcel } from './utils/excelExport';
import { exportToPDF } from './utils/pdfExport';
import { CURRENCY_DATA } from './utils/currency';

// Import hooks
import { useNumberInput } from './hooks/useNumberInput';
import { useMortgageCalculations } from './hooks/useMortgageCalculations';

// Import components
import SEOContent from './components/SEOContent';
import EmailCaptureModal from './components/EmailCaptureModal';
import ViralShareResults from './components/ViralShareResults';
import LoginModal from './components/LoginModal';

import { LoanInputs } from './components/MortgageCalculator/LoanInputs';
import { ExtraPayments } from './components/MortgageCalculator/ExtraPayments';
import { PropertyDetails } from './components/MortgageCalculator/PropertyDetails';
import { Stepper } from './components/Stepper';
import { StickySummary } from './components/MortgageCalculator/StickySummary';
import MortgageHeader from './components/MortgageCalculator/MortgageHeader';
import SaveMortgageModal from './components/MortgageCalculator/SaveMortgageModal';
import PrimarySummaryCards from './components/MortgageCalculator/PrimarySummaryCards';
import InvestmentSummaryCard from './components/MortgageCalculator/InvestmentSummaryCard';
import PaymentPlanComparison from './components/MortgageCalculator/PaymentPlanComparison';
import AmortizationOverview from './components/MortgageCalculator/AmortizationOverview';
import MortgageTracker from './components/MortgageCalculator/MortgageTracker';
import ScenarioComparisonModal from './components/MortgageCalculator/ScenarioComparisonModal';
import RefinanceAnalysisModal from './components/MortgageCalculator/RefinanceAnalysisModal';
import ExportShareSection from './components/MortgageCalculator/ExportShareSection';
import MortgageEducationalSection from './components/MortgageCalculator/MortgageEducationalSection';
import MetricCard from './components/ui/MetricCard';

// Import constants
import { CARD_STYLE, CARD_SHADOW } from './constants/styles';
import { ERROR_MESSAGES, DEBOUNCE_DELAYS, FIRESTORE_SYNC, MORTGAGE } from './utils/constants';

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
  const [propertyType, setPropertyType] = useState<'primary' | 'investment'>('primary');

  const [currentStep, setCurrentStep] = useState(0);

  const steps = ['Loan Details', 'Property Expenses', 'Extra Payments'];

  const mortgagePortfolioSummary = useMemo(() => {
    if (savedMortgages.length === 0) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const normalizeDate = (value?: string) => {
      if (!value) return null;
      const safeValue = value.length === 7 ? `${value}-01` : value;
      const date = new Date(safeValue);
      if (Number.isNaN(date.getTime())) return null;
      date.setHours(0, 0, 0, 0);
      return date;
    };

    let totalMonthlyOutflow = 0;
    let totalPrincipalPaid = 0;
    let totalPrincipalRemaining = 0;

    savedMortgages.forEach((mortgage) => {
      const loanAmount = mortgage.homeValue - mortgage.downPayment;
      const monthlyPayment = calculateMonthlyPayment(loanAmount, mortgage.interestRate, mortgage.tenure);
      const monthlyEquivalent = mortgage.paymentType === 'biweekly'
        ? (monthlyPayment / 2) * (26 / 12)
        : monthlyPayment;

      let extraMonthly = 0;
      if (mortgage.extraPaymentEnabled && mortgage.extraPaymentAmount > 0) {
        if (mortgage.extraPaymentFrequency === 'monthly') {
          extraMonthly = mortgage.extraPaymentAmount;
        } else if (mortgage.extraPaymentFrequency === 'biweekly') {
          extraMonthly = mortgage.extraPaymentAmount * (26 / 12);
        }
      }

      const taxMonthly = mortgage.propertyTax
        ? (mortgage.propertyTaxPeriod === 'month' ? mortgage.propertyTax : mortgage.propertyTax / 12)
        : 0;
      const insuranceMonthly = mortgage.homeInsurance
        ? (mortgage.homeInsurancePeriod === 'month' ? mortgage.homeInsurance : mortgage.homeInsurance / 12)
        : 0;
      const hoaMonthly = mortgage.hoaFees || 0;

      totalMonthlyOutflow += monthlyEquivalent + extraMonthly + taxMonthly + insuranceMonthly + hoaMonthly;

      const startDateObj = normalizeDate(mortgage.startDate) || today;
      const extraStartDate = mortgage.extraPaymentEnabled ? normalizeDate(mortgage.extraPaymentStartDate) : null;
      const oneTimePayments = mortgage.oneTimePayments || [];

      let principalPaidFromPayments = 0;
      let principalPaid = mortgage.downPayment;
      let principalRemaining = loanAmount;

      if (loanAmount > 0 && startDateObj <= today) {
        if (mortgage.paymentType === 'biweekly') {
          const dailyRate = mortgage.interestRate / 100 / 365;
          const biweeklyPayment = monthlyPayment / 2;
          let balance = loanAmount;
          let paymentDate = new Date(startDateObj);
          const appliedOneTime = new Set<string>();
          const maxPayments = mortgage.tenure * 26;

          for (let i = 0; i < maxPayments && balance > 0.01; i++) {
            if (paymentDate > today) break;
            const interest = balance * dailyRate * 14;
            let principal = biweeklyPayment - interest;
            if (principal < 0) principal = 0;

            if (
              mortgage.extraPaymentEnabled &&
              mortgage.extraPaymentFrequency === 'biweekly' &&
              extraStartDate &&
              paymentDate >= extraStartDate
            ) {
              principal += mortgage.extraPaymentAmount;
            }

            const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
            oneTimePayments.forEach((payment) => {
              if (payment.date === monthKey && !appliedOneTime.has(payment.id)) {
                principal += payment.amount;
                appliedOneTime.add(payment.id);
              }
            });

            principal = Math.min(principal, balance);
            balance -= principal;
            principalPaidFromPayments += principal;
            principalPaid += principal;

            paymentDate.setDate(paymentDate.getDate() + 14);
          }

          principalRemaining = Math.max(0, loanAmount - principalPaidFromPayments);
        } else {
          const monthlyRate = mortgage.interestRate / 100 / 12;
          let balance = loanAmount;
          let paymentDate = new Date(startDateObj);
          const totalMonths = mortgage.tenure * 12;

          for (let i = 0; i < totalMonths && balance > 0.01; i++) {
            if (paymentDate > today) break;
            const interest = balance * monthlyRate;
            let principal = monthlyPayment - interest;
            if (principal < 0) principal = 0;

            if (
              mortgage.extraPaymentEnabled &&
              mortgage.extraPaymentFrequency === 'monthly' &&
              extraStartDate &&
              paymentDate >= extraStartDate
            ) {
              principal += mortgage.extraPaymentAmount;
            }

            const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
            oneTimePayments.forEach((payment) => {
              if (payment.date === monthKey) {
                principal += payment.amount;
              }
            });

            principal = Math.min(principal, balance);
            balance -= principal;
            principalPaidFromPayments += principal;
            principalPaid += principal;
            paymentDate.setMonth(paymentDate.getMonth() + 1);
          }

          principalRemaining = Math.max(0, loanAmount - principalPaidFromPayments);
        }
      }

      totalPrincipalPaid += principalPaid;
      totalPrincipalRemaining += principalRemaining;
    });

    return {
      count: savedMortgages.length,
      totalMonthlyOutflow,
      totalPrincipalPaid,
      totalPrincipalRemaining
    };
  }, [savedMortgages]);
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
  const [oneTimePaymentsExpanded, setOneTimePaymentsExpanded] = useState(false);

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

  const [amortizationView, setAmortizationView] = useState<'chart' | 'table'>('chart');
  const [paymentPlanViewMode, setPaymentPlanViewMode] = useState<'text' | 'chart'>('chart');

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

  // Load mortgages from Firestore on mount OR Local Storage if guest
  useEffect(() => {
    if (!currentUser) {
      try {
        const localData = localStorage.getItem('mortgage_calculator_local_saves');
        if (localData) {
          setSavedMortgages(JSON.parse(localData));
        } else {
          setSavedMortgages([]);
        }
      } catch (e) {
        console.error('Error loading local saves:', e);
        setSavedMortgages([]);
      }
      return;
    }

    // Reset initial load state when user changes to ensure we fetch fresh data
    isInitialLoadRef.current = true;

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

  // Sync to Local Storage for guests
  useEffect(() => {
    if (!currentUser && !isLoadingMortgages) {
      if (savedMortgages.length > 0) {
        localStorage.setItem('mortgage_calculator_local_saves', JSON.stringify(savedMortgages));
      }
    }
  }, [savedMortgages, currentUser, isLoadingMortgages]);

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
    // allow guest save
    // if (!currentUser) {
    //   setShowLoginModal(true);
    //   return;
    // }

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
          updatedAt: new Date().toISOString(),
          propertyType,
          monthlyRent: monthlyRentInput.value,
          vacancyRate,
          propertyManagementPercent,
          maintenance: maintenanceInput.value,
          utilities: utilitiesInput.value,
          propertyAppreciationRate,
          propertyTax,
          propertyTaxPeriod,
          homeInsurance,
          homeInsurancePeriod,
          hoaFees
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
        updatedAt: new Date().toISOString(),
        propertyType,
        monthlyRent: monthlyRentInput.value,
        vacancyRate,
        propertyManagementPercent,
        maintenance: maintenanceInput.value,
        utilities: utilitiesInput.value,
        propertyAppreciationRate,
        propertyTax,
        propertyTaxPeriod,
        homeInsurance,
        homeInsurancePeriod,
        hoaFees
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
  }, [currentUser, newMortgageName, savedMortgages, selectedMortgageId, homeValueInput.value, downPaymentInput.value, interestRateInput.value, tenureInput.value, startDate, paymentType, extraPaymentEnabled, extraPaymentAmountInput.value, extraPaymentStartDate, extraPaymentFrequency, oneTimePayments, selectedCurrency, propertyType, monthlyRentInput.value, vacancyRate, propertyManagementPercent, maintenanceInput.value, utilitiesInput.value, propertyAppreciationRate, propertyTax, propertyTaxPeriod, homeInsurance, homeInsurancePeriod, hoaFees]);

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

    // Load investment fields
    setPropertyType(mortgage.propertyType || 'primary');
    monthlyRentInput.setValue(mortgage.monthlyRent || 2500);
    setVacancyRate(mortgage.vacancyRate || 8);
    setPropertyManagementPercent(mortgage.propertyManagementPercent || 10);
    maintenanceInput.setValue(mortgage.maintenance || 500);
    utilitiesInput.setValue(mortgage.utilities || 0);
    setPropertyAppreciationRate(mortgage.propertyAppreciationRate || 3.5);

    // Load additional costs
    setPropertyTax(mortgage.propertyTax || 0);
    setPropertyTaxPeriod(mortgage.propertyTaxPeriod || 'year');
    setHomeInsurance(mortgage.homeInsurance || 0);
    setHomeInsurancePeriod(mortgage.homeInsurancePeriod || 'year');
    setHoaFees(mortgage.hoaFees || 0);
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
    setNewMortgageName,
    setPropertyType,
    monthlyRentInput,
    setVacancyRate,
    setPropertyManagementPercent,
    maintenanceInput,
    utilitiesInput,
    setPropertyAppreciationRate,
    setPropertyTax,
    setPropertyTaxPeriod,
    setHomeInsurance,
    setHomeInsurancePeriod,
    setHoaFees
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
        updatedAt: new Date().toISOString(),
        propertyType,
        monthlyRent: monthlyRentInput.value,
        vacancyRate,
        propertyManagementPercent,
        maintenance: maintenanceInput.value,
        utilities: utilitiesInput.value,
        propertyAppreciationRate,
        propertyTax,
        propertyTaxPeriod,
        homeInsurance,
        homeInsurancePeriod,
        hoaFees
      } : m
    ));
  }, [selectedMortgageId, currentUser, homeValueInput.value, downPaymentInput.value, interestRateInput.value, tenureInput.value, startDate, paymentType, extraPaymentEnabled, extraPaymentAmountInput.value, extraPaymentStartDate, extraPaymentFrequency, oneTimePayments, selectedCurrency, propertyType, monthlyRentInput.value, vacancyRate, propertyManagementPercent, maintenanceInput.value, utilitiesInput.value, propertyAppreciationRate, propertyTax, propertyTaxPeriod, homeInsurance, homeInsurancePeriod, hoaFees]);

  // Auto-update selected mortgage when form values change (debounced)
  useEffect(() => {
    if (selectedMortgageId && currentUser) {
      const updateTimer = setTimeout(() => {
        handleUpdateCurrentMortgage();
      }, DEBOUNCE_DELAYS.MORTGAGE_UPDATE);

      return () => clearTimeout(updateTimer);
    }
  }, [selectedMortgageId, currentUser, homeValueInput.value, downPaymentInput.value, interestRateInput.value, tenureInput.value, startDate, paymentType, extraPaymentEnabled, extraPaymentAmountInput.value, extraPaymentStartDate, extraPaymentFrequency, oneTimePayments.length, selectedCurrency, handleUpdateCurrentMortgage, propertyType, monthlyRentInput.value, vacancyRate, propertyManagementPercent, maintenanceInput.value, utilitiesInput.value, propertyAppreciationRate, propertyTax, propertyTaxPeriod, homeInsurance, homeInsurancePeriod, hoaFees]);

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

  const handleResetComparisonDefaults = useCallback(() => {
    interestRateInput.setValue(MORTGAGE.DEFAULT_INTEREST_RATE);
    tenureInput.setValue(MORTGAGE.DEFAULT_TENURE_YEARS);
    homeValueInput.setValue(MORTGAGE.DEFAULT_HOME_VALUE);
    downPaymentInput.setValue(MORTGAGE.DEFAULT_DOWN_PAYMENT);
    setPaymentType('monthly');
    setExtraPaymentEnabled(false);
  }, [interestRateInput, tenureInput, homeValueInput, downPaymentInput, setPaymentType, setExtraPaymentEnabled]);

  const handleApplyScenario = useCallback((scenario: { homeValue: number; downPayment: number; interestRate: number; tenure: number; paymentType: PaymentType }) => {
    applyScenarioToCalculator(
      scenario,
      { homeValueInput, downPaymentInput, interestRateInput, tenureInput, extraPaymentAmountInput },
      { setPaymentType, setStartDate, setExtraPaymentEnabled },
      () => setShowScenarioComparison(false)
    );
  }, [
    applyScenarioToCalculator,
    homeValueInput,
    downPaymentInput,
    interestRateInput,
    tenureInput,
    extraPaymentAmountInput,
    setPaymentType,
    setStartDate,
    setExtraPaymentEnabled,
    setShowScenarioComparison
  ]);

  const handleApplyRefinance = useCallback(() => {
    applyRefinanceToCalculator(
      refinanceData.remainingBalance,
      refinanceData.newRate,
      refinanceData.newTerm,
      refinanceData.newExtraPayment,
      { homeValueInput, downPaymentInput, interestRateInput, tenureInput, extraPaymentAmountInput },
      { setStartDate, setExtraPaymentEnabled, setExtraPaymentFrequency, setExtraStartDate: setExtraPaymentStartDate },
      () => setShowRefinanceAnalysis(false)
    );
  }, [
    applyRefinanceToCalculator,
    refinanceData,
    homeValueInput,
    downPaymentInput,
    interestRateInput,
    tenureInput,
    extraPaymentAmountInput,
    setStartDate,
    setExtraPaymentEnabled,
    setExtraPaymentFrequency,
    setExtraPaymentStartDate,
    setShowRefinanceAnalysis
  ]);

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
    <div
      id="mortgage-calculator-section"
      key={`currency-${currencyRenderKey}`}
      className="min-h-screen bg-gray-50 p-1 sm:p-2 md:p-4 relative overflow-hidden scroll-mt-24"
    >
      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      

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

      <SaveMortgageModal
        isOpen={showSaveMortgageModal}
        isUpdate={Boolean(selectedMortgageId)}
        mortgageName={newMortgageName}
        onMortgageNameChange={setNewMortgageName}
        onConfirm={handleSaveCurrentMortgage}
        onCancel={() => {
          setShowSaveMortgageModal(false);
          if (!selectedMortgageId) {
            setNewMortgageName('');
          }
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
        <MortgageHeader
          isAuthenticated={Boolean(currentUser)}
          onLoginClick={() => setShowLoginModal(true)}
          propertyType={propertyType}
          onPropertyTypeChange={setPropertyType}
          selectedCurrency={selectedCurrency}
          onCurrencyChange={setSelectedCurrency}
        />

        {currentUser ? (
          mortgagePortfolioSummary && (
            <div className="mt-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Portfolio Summary
                </div>
                <div className="text-xs text-slate-400">
                  {mortgagePortfolioSummary.count} saved {mortgagePortfolioSummary.count === 1 ? 'mortgage' : 'mortgages'}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  label="Total monthly outflow"
                  value={formatCurrency(mortgagePortfolioSummary.totalMonthlyOutflow)}
                  icon={<Wallet className="w-4 h-4" />}
                />
                <MetricCard
                  label="Outstanding balance"
                  value={formatCurrency(mortgagePortfolioSummary.totalPrincipalRemaining)}
                  icon={<HomeIcon className="w-4 h-4" />}
                />
                <MetricCard
                  label="Principal paid"
                  value={formatCurrency(mortgagePortfolioSummary.totalPrincipalPaid)}
                  icon={<TrendingUp className="w-4 h-4" />}
                />
              </div>
            </div>
          )
        ) : (
          <div className="mt-4 mb-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-6 text-center">
            <h3 className="text-sm font-semibold text-slate-800">Sign in to see your portfolio summary</h3>
            <p className="text-xs text-slate-500 mt-2">
              Track all saved mortgages, monthly outflow, and payoff progress in one place.
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              Sign in
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 sm:gap-3">
          {/* Loan Details */}
          {/* Loan Details - Takes 2 columns (40% width) on desktop, full width on mobile */}
          <div className="lg:col-span-2">
            <div className={CARD_STYLE} style={{ ...CARD_SHADOW }}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-transparent rounded-bl-full"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-indigo-400/20 to-transparent rounded-tr-full"></div>

              <div className="relative p-3 space-y-3">
                <Stepper steps={steps} currentStep={currentStep} onStepChange={setCurrentStep} />

                <div className="min-h-[400px]">
                  {currentStep === 0 && (
                    <div id="mortgage-refinance-section" className="animate-fadeIn scroll-mt-24">
                      <LoanInputs
                        homeValueInput={homeValueInput}
                        downPaymentInput={downPaymentInput}
                        interestRateInput={interestRateInput}
                        tenureInput={tenureInput}
                        startDate={startDate}
                        setStartDate={setStartDate}
                        paymentType={paymentType}
                        setPaymentType={setPaymentType}
                        savedMortgages={savedMortgages}
                        selectedMortgageId={selectedMortgageId}
                        setSelectedMortgageId={setSelectedMortgageId}
                        handleLoadMortgage={handleLoadMortgage}
                        currentUser={currentUser}
                        setNewMortgageName={setNewMortgageName}
                        propertyType={propertyType}
                        downPayment={downPayment}
                        homeValue={homeValue}
                        editingDownPaymentPercent={editingDownPaymentPercent}
                        setEditingDownPaymentPercent={setEditingDownPaymentPercent}
                        rawDownPaymentPercent={rawDownPaymentPercent}
                        setRawDownPaymentPercent={setRawDownPaymentPercent}
                        showCurrentRates={showCurrentRates}
                        setShowCurrentRates={setShowCurrentRates}
                        selectedCurrency={selectedCurrency}
                        showScenarioComparison={showScenarioComparison}
                        setShowScenarioComparison={setShowScenarioComparison}
                        showRefinanceAnalysis={showRefinanceAnalysis}
                        setShowRefinanceAnalysis={setShowRefinanceAnalysis}
                      />
                    </div>
                  )}

                  {currentStep === 1 && (
                    <div className="animate-fadeIn">
                      <PropertyDetails
                        propertyType={propertyType}
                        propertyTax={propertyTax}
                        setPropertyTax={setPropertyTax}
                        propertyTaxPeriod={propertyTaxPeriod}
                        setPropertyTaxPeriod={setPropertyTaxPeriod}
                        homeInsurance={homeInsurance}
                        setHomeInsurance={setHomeInsurance}
                        homeInsurancePeriod={homeInsurancePeriod}
                        setHomeInsurancePeriod={setHomeInsurancePeriod}
                        pmiAmount={pmiAmount}
                        setPmiAmount={setPmiAmount}
                        downPayment={downPayment}
                        homeValue={homeValue}
                        hoaFees={hoaFees}
                        setHoaFees={setHoaFees}
                        selectedCurrency={selectedCurrency}
                      />
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="animate-fadeIn">
                      <ExtraPayments
                        extraPaymentEnabled={extraPaymentEnabled}
                        setExtraPaymentEnabled={setExtraPaymentEnabled}
                        extraPaymentStartDate={extraPaymentStartDate}
                        setExtraPaymentStartDate={setExtraPaymentStartDate}
                        extraPaymentFrequency={extraPaymentFrequency}
                        setExtraPaymentFrequency={setExtraPaymentFrequency}
                        extraPaymentAmountInput={extraPaymentAmountInput}
                        oneTimePaymentsExpanded={oneTimePaymentsExpanded}
                        setOneTimePaymentsExpanded={setOneTimePaymentsExpanded}
                        oneTimePayments={oneTimePayments}
                        setOneTimePayments={setOneTimePayments}
                        startDate={startDate}
                        selectedCurrency={selectedCurrency}
                      />
                    </div>
                  )}


                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                    disabled={currentStep === 0}
                    className={`
                      px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2
                      ${currentStep === 0
                        ? 'text-slate-400 cursor-not-allowed bg-slate-100'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-300'
                      }
                    `}
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>

                  <button
                    onClick={() => {
                      if (currentStep < steps.length - 1) {
                        setCurrentStep(prev => prev + 1);
                      } else {
                        // On last step, maybe scroll to results or just do nothing (user can see results on right)
                        // For mobile, we might want to scroll down
                        const resultsElement = document.getElementById('results-section');
                        if (resultsElement) {
                          resultsElement.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                    className="px-6 py-2 rounded-lg font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
                  >
                    {currentStep === steps.length - 1 ? 'View Results' : 'Next'}
                    {currentStep < steps.length - 1 && <ChevronDown size={16} className="-rotate-90" />}
                    {currentStep < steps.length - 1 && <ChevronDown size={16} className="-rotate-90" />}
                  </button>

                  <button
                    onClick={() => {
                      if (!selectedMortgageId) {
                        setShowSaveMortgageModal(true);
                      } else {
                        handleSaveCurrentMortgage();
                      }
                    }}
                    className="px-4 py-2 rounded-lg font-semibold text-sm bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-800 shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
                    title="Save current progress"
                  >
                    <span className="hidden xs:inline">Save</span>
                    <span className="xs:hidden">Save</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Payment Summary, Cost Breakdown, and Comparison - Compact */}
          <div className="lg:col-span-3 space-y-2">
            {/* Payment Summary OR Investment Analysis (Full Width for Investment) - Compact */}
            <div className={propertyType === 'investment' ? '' : 'grid grid-cols-1 sm:grid-cols-2 gap-2'}>
              {propertyType === 'primary' ? (
                <PrimarySummaryCards
                  loanAmount={loanAmount}
                  paymentAmount={paymentAmount}
                  totalMonthlyCosts={totalMonthlyCosts}
                  trueMonthlyPayment={trueMonthlyPayment}
                  totalPaid={totalPaid}
                  yearsToPayoff={yearsToPayoff}
                  endDate={endDate}
                  totalInterest={totalInterest}
                />
              ) : (
                <InvestmentSummaryCard
                  monthlyRentInput={monthlyRentInput}
                  vacancyRate={vacancyRate}
                  setVacancyRate={setVacancyRate}
                  propertyManagementPercent={propertyManagementPercent}
                  setPropertyManagementPercent={setPropertyManagementPercent}
                  maintenanceInput={maintenanceInput}
                  utilitiesInput={utilitiesInput}
                  propertyAppreciationRate={propertyAppreciationRate}
                  setPropertyAppreciationRate={setPropertyAppreciationRate}
                  futureMonthlyRent5Year={futureMonthlyRent5Year}
                  futureMonthlyRent10Year={futureMonthlyRent10Year}
                  futureMonthlyRent15Year={futureMonthlyRent15Year}
                  rentIncrease5Year={rentIncrease5Year}
                  rentIncrease10Year={rentIncrease10Year}
                  rentIncrease15Year={rentIncrease15Year}
                  paymentAmount={paymentAmount}
                  paymentType={paymentType}
                  totalMonthlyCosts={totalMonthlyCosts}
                  trueMonthlyPayment={trueMonthlyPayment}
                  monthlyCashFlow={monthlyCashFlow}
                  annualCashFlow={annualCashFlow}
                  cashOnCashReturn={cashOnCashReturn}
                  capRate={capRate}
                  breakEvenOccupancy={breakEvenOccupancy}
                  loanAmount={loanAmount}
                  totalPaid={totalPaid}
                  totalInterest={totalInterest}
                />
              )}
            </div>

            {/* Comparison Section */}
            <section id="mortgage-compare-section" className="scroll-mt-24">
              <PaymentPlanComparison
                paymentPlanViewMode={paymentPlanViewMode}
                onPaymentPlanViewModeChange={setPaymentPlanViewMode}
                onReset={handleResetComparisonDefaults}
                interestSaved={interestSaved}
                timeSaved={timeSaved}
                isExtraPaymentComparison={isExtraPaymentComparison}
                extraPaymentAmount={extraPaymentAmount}
                extraPaymentFrequency={extraPaymentFrequency}
                forwardProjections={forwardProjections}
                paymentType={paymentType}
                graphRemainingInterest={graphRemainingInterest}
                graphRemainingInterestComparison={graphRemainingInterestComparison}
                comparisonBarData={comparisonBarData}
                chartRenderKey={chartRenderKey}
              />
            </section>

            {propertyType === 'investment' && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Investment Insights</h3>
                    <p className="text-xs text-slate-500">Rental performance at a glance</p>
                  </div>
                  <span className="text-xs text-emerald-600 font-semibold">Investment mode</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <MetricCard
                    label="Effective rent"
                    value={formatCurrency(effectiveMonthlyRent)}
                  />
                  <MetricCard
                    label="Operating expenses"
                    value={formatCurrency(totalOperatingExpenses)}
                  />
                  <MetricCard
                    label="Monthly cash flow"
                    value={formatCurrency(monthlyCashFlow)}
                  />
                  <MetricCard
                    label="Annual cash flow"
                    value={formatCurrency(annualCashFlow)}
                  />
                  <MetricCard
                    label="Cap rate"
                    value={`${capRate.toFixed(1)}%`}
                  />
                  <MetricCard
                    label="Break-even occupancy"
                    value={`${breakEvenOccupancy.toFixed(1)}%`}
                  />
                </div>
              </div>
            )}

            {/* Amortization sections inside right column when additional costs are shown */}

          </div>
        </div >

        {/* Amortization sections at bottom */}
        <>
          <AmortizationOverview
            amortizationView={amortizationView}
            onViewChange={setAmortizationView}
            chartData={chartData}
            schedule={schedule}
            loanAmount={loanAmount}
            totalInterest={totalInterest}
            startDate={startDate}
            endDate={endDate}
            yearsToPayoff={yearsToPayoff}
            selectedCurrency={selectedCurrency}
          />

          <section id="mortgage-tracker-section" className="scroll-mt-24">
            {currentUser ? (
              savedMortgages.length > 0 ? (
                <MortgageTracker
                  savedMortgages={savedMortgages}
                  selectedMortgageId={selectedMortgageId}
                  schedule={schedule}
                  totalInterest={totalInterest}
                  endDate={endDate}
                  saveError={saveError}
                  isSavingMortgage={isSavingMortgage}
                  editingMortgageName={editingMortgageName}
                  editingMortgageNameValue={editingMortgageNameValue}
                  setEditingMortgageName={setEditingMortgageName}
                  setEditingMortgageNameValue={setEditingMortgageNameValue}
                  onLoadMortgage={handleLoadMortgage}
                  onDeleteMortgage={handleDeleteMortgage}
                  onUpdateMortgageName={handleUpdateMortgageName}
                />
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
                  <h3 className="text-lg font-semibold text-slate-800">No saved mortgages yet</h3>
                  <p className="text-sm text-slate-500 mt-2">
                    Save a mortgage from the calculator to start tracking payoff progress and milestones.
                  </p>
                </div>
              )
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
                <h3 className="text-lg font-semibold text-slate-800">Track mortgages across sessions</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Sign in to save mortgages, track payoff progress, and compare scenarios over time.
                </p>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  Sign in to enable tracker
                </button>
              </div>
            )}
          </section>

          {/* Export & Share Actions Section - Moved here for visibility */}
          <ExportShareSection
            onExportExcel={handleExportToExcel}
            onExportPDF={handleExportToPDF}
            onExportCSV={handleExportToCSV}
            onEmailResults={() => setShowEmailCapture(true)}
            propertyType={propertyType}
            showScenarioComparison={showScenarioComparison}
            showRefinanceAnalysis={showRefinanceAnalysis}
          />
        </>

        {/* Loan Scenario Comparison Modal - Rendered at body level */}
        <ScenarioComparisonModal
          isOpen={showScenarioComparison}
          onClose={() => setShowScenarioComparison(false)}
          onApplyScenario={handleApplyScenario}
          homeValue={homeValueInput.value}
          downPayment={downPaymentInput.value}
          interestRate={interestRate}
          tenure={tenure}
          paymentType={paymentType}
          loanAmount={loanAmount}
          scenarioB={scenarioB}
          scenarioC={scenarioC}
          setScenarioB={setScenarioB}
          setScenarioC={setScenarioC}
          editingScenarioBPercent={editingScenarioBPercent}
          setEditingScenarioBPercent={setEditingScenarioBPercent}
          rawScenarioBPercent={rawScenarioBPercent}
          setRawScenarioBPercent={setRawScenarioBPercent}
          editingScenarioCPercent={editingScenarioCPercent}
          setEditingScenarioCPercent={setEditingScenarioCPercent}
          rawScenarioCPercent={rawScenarioCPercent}
          setRawScenarioCPercent={setRawScenarioCPercent}
          currentScenarioBase={currentScenarioBase}
          scenarioBCalc={scenarioBCalc}
          scenarioCCalc={scenarioCCalc}
        />

        {/* Refinance Analysis Modal - Rendered at body level */}
        <RefinanceAnalysisModal
          isOpen={showRefinanceAnalysis}
          onClose={() => setShowRefinanceAnalysis(false)}
          refinanceData={refinanceData}
          setRefinanceData={setRefinanceData}
          editingCurrentRate={editingCurrentRate}
          setEditingCurrentRate={setEditingCurrentRate}
          rawCurrentRate={rawCurrentRate}
          setRawCurrentRate={setRawCurrentRate}
          editingNewRate={editingNewRate}
          setEditingNewRate={setEditingNewRate}
          rawNewRate={rawNewRate}
          setRawNewRate={setRawNewRate}
          refinanceCalc={refinanceCalc}
          onApplyRefinance={handleApplyRefinance}
        />

        <MortgageEducationalSection />

        {/* Viral Share & Email Capture Section */}
        {
          hasCalculated && (
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
          )
        }

        

        {/* SEO Content Section - Educational content and FAQs for better search rankings */}
        <SEOContent />

        <StickySummary
          monthlyPayment={paymentAmount}
          currency={selectedCurrency}
          propertyType={propertyType}
          cashFlow={monthlyCashFlow}
          onExpand={() => {
            const resultsElement = document.getElementById('results-section');
            if (resultsElement) {
              resultsElement.scrollIntoView({ behavior: 'smooth' });
            } else {
              // Fallback if results-section ID is not found (it might be named differently or dynamically rendered)
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
          }}
        />
      </div >
    </div>
  );
};

export default MortgageCalculator;
