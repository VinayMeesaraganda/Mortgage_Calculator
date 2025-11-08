// Main Mortgage Calculator Component - Modularized Version
// This file demonstrates the clean architecture using separated modules

import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList
} from 'recharts';

// Import types
import type { OneTimePayment, PaymentType } from './types/mortgage';

// Import utilities
import { formatCurrency, formatCurrencyCompact, formatDate, formatYearsMonths } from './utils/formatting';
import { calculateMonthlyPayment, simulateMonthlyAmortization, simulateBiweeklyAmortization } from './utils/calculations-helpers';
import { applyScenarioToCalculator } from './helpers/applyScenario';

// Import hooks
import { useNumberInput } from './hooks/useNumberInput';
import { useMortgageCalculations } from './hooks/useMortgageCalculations';

// Import components
import { HelpTooltip } from './components/HelpTooltip';
import { MonthYearPicker } from './components/MonthYearPicker';
import { AmortizationTable } from './components/AmortizationTable';
import { ShareButtons } from './components/ShareButtons';

// Import constants
import { INPUT_STYLE, CARD_STYLE, CARD_SHADOW } from './constants/styles';

const MortgageCalculator: React.FC = () => {
  // Use custom hooks for number inputs - eliminates ~150 lines of repetitive code
  const homeValueInput = useNumberInput(400000, 400000, 'homeValue');
  const downPaymentInput = useNumberInput(80000, 80000, 'downPayment', (val) => Math.min(val, homeValueInput.value));
  const interestRateInput = useNumberInput(6.5, 6.5, 'interestRate');
  const tenureInput = useNumberInput(30, 30, 'tenure', (val) => Math.floor(val));
  const extraPaymentAmountInput = useNumberInput(0, 0, 'extraPaymentAmount');
  
  const [startDate, setStartDate] = useState('2025-01');
  const [paymentType, setPaymentType] = useState<PaymentType>('monthly');
  const [extraPaymentEnabled, setExtraPaymentEnabled] = useState(false);
  const [extraPaymentStartDate, setExtraPaymentStartDate] = useState('2025-01');
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
    currentPayoffDate: '', // Projected payoff date from mortgage statement (YYYY-MM format)
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
  const calculateScenario = (scenario: { homeValue: number; downPayment: number; interestRate: number; tenure: number; paymentType: PaymentType }) => {
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
  };

  const scenarioBCalc = calculateScenario(scenarioB);
  const scenarioCCalc = calculateScenario(scenarioC);
  
  // Calculate current scenario WITHOUT extra payments for fair comparison
  const currentScenarioBase = calculateScenario({
    homeValue: homeValueInput.value,
    downPayment: downPaymentInput.value,
    interestRate: interestRate,
    tenure: tenure,
    paymentType: paymentType
  });
  
  // Calculate refinance analysis - Using helper functions to eliminate duplication
  const calculateRefinance = () => {
    const monthlyRate = refinanceData.currentRate / 100 / 12;
    
    // Calculate remaining months from payoff date
    let actualRemainingMonths = 360; // Default
    let currentPayment = paymentAmount; // Default to calculated
    
    if (refinanceData.currentPayoffDate) {
      const [year, month] = refinanceData.currentPayoffDate.split('-').map(Number);
      const payoffDate = new Date(year, month - 1, 1);
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
  };
  
  const refinanceCalc = calculateRefinance();
  
  // Calculate savings based on comparison mode
  let interestSaved, timeSaved;
  
  if (comparisonMode === 'extra-payments') {
    // Comparing with vs without extra payments
    // comparisonCalc = without extra, primaryCalc = with extra
    interestSaved = comparisonCalc.totalInterest - totalInterest;
    timeSaved = comparisonCalc.yearsToPayoff - yearsToPayoff;
  } else {
    // Comparing monthly vs biweekly
    // Always show savings as: monthly - biweekly (biweekly saves money)
    const monthlyInterest = paymentType === 'monthly' ? totalInterest : comparisonCalc.totalInterest;
    const biweeklyInterest = paymentType === 'biweekly' ? totalInterest : comparisonCalc.totalInterest;
    const monthlyYears = paymentType === 'monthly' ? yearsToPayoff : comparisonCalc.yearsToPayoff;
    const biweeklyYears = paymentType === 'biweekly' ? yearsToPayoff : comparisonCalc.yearsToPayoff;
    
    interestSaved = monthlyInterest - biweeklyInterest;
    timeSaved = monthlyYears - biweeklyYears;
  }

  const isExtraPaymentComparison = comparisonMode === 'extra-payments';

  // Chart data for balance over time
  const chartData = schedule
    .filter((_, i) => i % Math.ceil(schedule.length / 100) === 0 || i === schedule.length - 1)
    .map(item => ({
      date: item.date,
      balance: item.balance,
      principal: loanAmount - item.balance,
      interest: item.totalInterest,
      cumulative: item.totalInterest + (loanAmount - item.balance)
    }));

  // Comparison bar chart data
  const comparisonBarData = isExtraPaymentComparison
    ? [
        { 
          name: `Regular ${paymentType === 'monthly' ? 'Monthly' : 'Bi-weekly'}`, 
          interest: comparisonCalc.totalInterest,
          type: 'comparison',
          label: `Regular ${paymentType === 'monthly' ? 'Monthly' : 'Bi-weekly'} Payments`,
          endDate: formatDate(comparisonCalc.endDate)
        },
        { 
          name: `With Extra Payments`, 
          interest: totalInterest,
          type: 'primary',
          label: 'With Extra Payments',
          endDate: formatDate(endDate)
        }
      ]
    : [
        { 
          name: 'Monthly Payments',
          interest: paymentType === 'monthly' ? totalInterest : comparisonCalc.totalInterest,
          type: 'monthly',
          label: 'Monthly Payments',
          endDate: formatDate(paymentType === 'monthly' ? endDate : comparisonCalc.endDate)
        },
        {
          name: 'Bi-weekly Payments',
          interest: paymentType === 'biweekly' ? totalInterest : comparisonCalc.totalInterest,
          type: 'biweekly',
          label: 'Bi-weekly Payments',
          endDate: formatDate(paymentType === 'biweekly' ? endDate : comparisonCalc.endDate)
        }
      ];

  return (
    <div className="min-h-screen bg-gray-50 p-1 sm:p-2 md:p-4 relative overflow-hidden">
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
          {/* Centered Heading */}
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif font-bold text-slate-800 tracking-tight animate-fadeIn text-center px-2 mb-3">
            Mortgage Calculator: The Ultimate Loan & Rental Property Analyzer
          </h1>
          
          {/* Toggle - Below Header, Centered */}
          <div className="flex justify-center">
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
                <span className="text-sm sm:text-base">🏠</span>
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
                <span className="text-sm sm:text-base">🏢</span>
                <span>Investment</span>
              </button>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider" style={{ color: '#334155' }}>
                    Home Value
                  </label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider" style={{ color: '#334155' }}>
                    Interest Rate (%)
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
                    <MonthYearPicker
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
                      <MonthYearPicker
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
                        setOneTimePayments([...oneTimePayments, { id: Date.now().toString(), date: startDate, amount: 0 }]);
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
                            <MonthYearPicker
                              value={payment.date}
                              onChange={(newDate) => {
                                const updated = [...oneTimePayments];
                                updated[index].date = newDate;
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
                              placeholder="$0"
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
                            placeholder="$0"
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
                            placeholder="$0"
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
                          placeholder="$0/month"
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
                          placeholder="$0/month"
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
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Payment Summary, Cost Breakdown, and Comparison */}
          <div className="lg:col-span-3 space-y-3">
            {/* Payment Summary OR Investment Analysis (Full Width for Investment) */}
            <div className={propertyType === 'investment' ? '' : 'grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3'}>
              {propertyType === 'primary' ? (
                <>
                  {/* Primary Home - Payment Summary */}
                  <div className={CARD_STYLE} style={CARD_SHADOW}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-xl pointer-events-none"></div>
                    <div className="relative p-3">
                      <h2 className="text-base font-serif text-slate-800 mb-2 tracking-wide border-b-2 pb-1.5 font-bold relative" style={{ borderImage: 'linear-gradient(to right, rgb(148, 163, 184), rgb(203, 213, 225)) 1' }}>
                        Payment Summary
                        <div className="absolute -bottom-0.5 left-0 w-12 h-0.5 bg-gradient-to-r from-slate-500 to-gray-500 animate-pulse"></div>
                      </h2>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-1 px-1 font-semibold text-slate-600 uppercase tracking-wider">Metric</th>
                            <th className="text-right py-1 px-1 font-semibold text-slate-600 uppercase tracking-wider">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="py-1.5 px-1 text-slate-700">Loan Amount</td>
                            <td className="py-1.5 px-1 text-right font-semibold text-slate-900">{formatCurrency(loanAmount)}</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-1.5 px-1 text-slate-700">Mortgage Payment</td>
                            <td className="py-1.5 px-1 text-right font-semibold text-slate-900">{formatCurrency(paymentAmount)}</td>
                          </tr>
                          {totalMonthlyCosts > 0 && (
                            <>
                              <tr className="border-b border-slate-100">
                                <td className="py-1.5 px-1 text-slate-700 pl-3 text-[11px]">+ Additional Costs</td>
                                <td className="py-1.5 px-1 text-right font-semibold text-blue-600">{formatCurrency(totalMonthlyCosts)}</td>
                              </tr>
                              <tr className="border-b-2 border-blue-300 bg-blue-50">
                                <td className="py-1.5 px-1 text-slate-800 font-bold">True Monthly Cost</td>
                                <td className="py-1.5 px-1 text-right font-bold text-blue-700">{formatCurrency(trueMonthlyPayment)}</td>
                              </tr>
                            </>
                          )}
                          <tr className="border-b border-slate-100">
                            <td className="py-1.5 px-1 text-slate-700">Total Paid & Duration</td>
                            <td className="py-1.5 px-1 text-right font-semibold text-slate-900">{formatCurrency(totalPaid)} / {formatYearsMonths(yearsToPayoff)}</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-1 text-slate-700">End Date</td>
                            <td className="py-1.5 px-1 text-right font-semibold text-slate-900">{formatDate(endDate)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Primary Home - Cost Breakdown */}
                  <div className={CARD_STYLE} style={CARD_SHADOW}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-xl pointer-events-none"></div>
                    <div className="relative p-3">
                      <h2 className="text-base font-serif text-slate-800 mb-2 tracking-wide border-b-2 pb-1.5 font-bold relative flex items-center" style={{ borderImage: 'linear-gradient(to right, rgb(148, 163, 184), rgb(203, 213, 225)) 1' }}>
                        Cost Breakdown
                        <HelpTooltip content="Shows how your total payment is divided between the actual loan amount (principal) and the cost of borrowing (interest)." />
                        <div className="absolute -bottom-0.5 left-0 w-12 h-0.5 bg-gradient-to-r from-slate-500 to-gray-500 animate-pulse"></div>
                      </h2>
                      <div className="flex flex-row gap-3 mb-3">
                    <div className="flex-1 bg-gradient-to-br from-emerald-50/80 to-green-100/80 rounded-lg p-3 border-2 border-emerald-300/60 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-emerald-400 backdrop-blur-sm relative overflow-hidden group/card">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative text-center">
                        <div className="text-lg font-serif font-bold text-emerald-700 mb-0.5">
                          {((loanAmount / totalPaid) * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-emerald-600 uppercase tracking-wide font-medium">
                          Principal
                        </div>
                        <div className="text-xs text-emerald-700 font-semibold mt-1">
                          {formatCurrency(loanAmount)}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 bg-gradient-to-br from-red-50/80 to-rose-100/80 rounded-lg p-3 border-2 border-red-300/60 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-red-400 backdrop-blur-sm relative overflow-hidden group/card">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative text-center">
                        <div className="text-lg font-serif font-bold text-red-700 mb-0.5">
                          {((totalInterest / totalPaid) * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-red-600 uppercase tracking-wide font-medium">
                          Interest
                        </div>
                        <div className="text-xs text-red-700 font-semibold mt-1">
                          {formatCurrency(totalInterest)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Visual Breakdown Bar */}
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-slate-600">Total Payment</span>
                      <span className="text-xs font-bold text-slate-800">{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="flex h-6 rounded-lg overflow-hidden shadow-inner border-2 border-slate-200">
                      <div 
                        className="bg-gradient-to-r from-emerald-400 to-emerald-500 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
                        style={{ width: `${((loanAmount / totalPaid) * 100).toFixed(1)}%` }}
                      >
                        {((loanAmount / totalPaid) * 100).toFixed(0)}%
                      </div>
                      <div 
                        className="bg-gradient-to-r from-red-400 to-red-500 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
                        style={{ width: `${((totalInterest / totalPaid) * 100).toFixed(1)}%` }}
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
                              📊 Rental Projections
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
                            💰 Loan Cost Breakdown
                            <HelpTooltip content="Shows how your total payment is divided between principal and interest" />
                          </p>
                        </div>
                        <div className="flex h-4 rounded-md overflow-hidden shadow-inner border border-slate-200 mb-1">
                          <div 
                            className="bg-gradient-to-r from-emerald-400 to-emerald-500 flex items-center justify-center text-[8px] font-bold text-white"
                            style={{ width: `${((loanAmount / totalPaid) * 100).toFixed(1)}%` }}
                          >
                            {((loanAmount / totalPaid) * 100).toFixed(0)}%
                          </div>
                          <div 
                            className="bg-gradient-to-r from-red-400 to-red-500 flex items-center justify-center text-[8px] font-bold text-white"
                            style={{ width: `${((totalInterest / totalPaid) * 100).toFixed(1)}%` }}
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
              <div className="relative p-3">
                <div className="mb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-serif text-slate-800 tracking-wide font-bold relative">
                      Payment Plan Comparison
                      <div className="absolute -bottom-0.5 left-0 w-12 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse"></div>
                    </h2>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      {isExtraPaymentComparison ? 'Regular vs Extra Payments' : 'Monthly vs Bi-weekly'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {isExtraPaymentComparison 
                      ? 'Extra payments help you save money by reducing your principal faster, which decreases the total interest paid over the loan term.' 
                      : 'Bi-weekly payments result in one extra monthly payment per year, helping you pay off your mortgage faster and save on interest.'}
                  </p>
                </div>

                {/* Savings Information - Clean, no redundant payment details */}
                <div className="flex flex-row gap-2 mb-3">
                  <div className="flex-1 bg-gradient-to-br from-emerald-50/80 to-green-100/80 rounded-lg p-2.5 border-2 border-emerald-300/60 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-emerald-400 backdrop-blur-sm relative overflow-hidden group/card">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative text-center">
                      <div className="text-base font-serif font-bold text-emerald-700 mb-0.5">
                        {formatCurrency(interestSaved)}
                      </div>
                      <div className="text-[10px] text-emerald-600 uppercase tracking-wide font-medium">
                        Interest Saved
                      </div>
                      <div className="text-[9px] text-emerald-500 mt-0.5">
                        {isExtraPaymentComparison 
                          ? 'vs Regular Payments' 
                          : 'Bi-weekly vs Monthly'}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 bg-gradient-to-br from-emerald-50/80 to-green-100/80 rounded-lg p-2.5 border-2 border-emerald-300/60 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-emerald-400 backdrop-blur-sm relative overflow-hidden group/card">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative text-center">
                      <div className="text-base font-serif font-bold text-emerald-700 mb-0.5">
                        {formatYearsMonths(timeSaved)}
                      </div>
                      <div className="text-[10px] text-emerald-600 uppercase tracking-wide font-medium">
                        Time Saved
                      </div>
                      <div className="text-[9px] text-emerald-500 mt-0.5">
                        {isExtraPaymentComparison 
                          ? 'Pay off faster' 
                          : 'Bi-weekly advantage'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparison Bar Chart */}
                <div className="flex justify-center">
                  <div style={{ width: '50%' }}>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={comparisonBarData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
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
                          tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                          stroke="#94a3b8"
                        />
                        <YAxis 
                          tickFormatter={formatCurrencyCompact}
                          tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                          stroke="#94a3b8"
                          label={{ value: 'Interest Paid', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#475569', fontWeight: 700 } }}
                          domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white border-2 border-slate-200 rounded-xl p-3 shadow-xl">
                                  <p className="text-sm font-bold text-slate-800 mb-2">{data.label}</p>
                                  <p className="text-lg font-bold text-blue-600">{formatCurrency(data.interest)}</p>
                                  <p className="text-xs text-slate-600 mt-1">Total Interest</p>
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
                          shape={(props: any) => {
                            const { x, y, width, height, payload } = props;
                            const fillColor = isExtraPaymentComparison
                              ? (payload.type === 'comparison' ? 'url(#redBarGradient)' : 'url(#greenBarGradient)')
                              : (payload.type === 'monthly' ? 'url(#redBarGradient)' : 'url(#greenBarGradient)');
                            
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
                            formatter={(value: number) => formatCurrency(value)}
                            style={{ fontSize: '11px', fontWeight: 700, fill: '#334155', textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
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
                  
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
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
                        tickFormatter={formatCurrencyCompact}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        stroke="#94a3b8"
                        label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#334155', fontWeight: 600 } }}
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
              
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
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
                    tickFormatter={formatCurrencyCompact}
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
                      <MonthYearPicker
                        value={refinanceData.currentPayoffDate}
                        onChange={(date) => setRefinanceData({ ...refinanceData, currentPayoffDate: date })}
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        📋 Check your mortgage statement - when will it be paid off?
                        {refinanceData.currentPayoffDate && (() => {
                          const [year, month] = refinanceData.currentPayoffDate.split('-').map(Number);
                          const payoffDate = new Date(year, month - 1, 1);
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
          
          {/* Introduction */}
          <div className="prose prose-slate max-w-none mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 border-b-2 border-blue-500 pb-2">
              Why Choose Our Advanced Mortgage Calculator?
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Most standard mortgage calculators fall short when you need real-world flexibility. Whether you're planning to make <strong>multiple one-time lump-sum payments</strong>, comparing <strong>three different loan offers side-by-side</strong>, or analyzing a <strong>rental property investment</strong>, traditional calculators simply can't keep up. Our comprehensive mortgage and refinance calculator was built to solve these exact problems, giving you the power to model complex payment scenarios that match your actual financial situation.
            </p>
            <p className="text-slate-700 leading-relaxed">
              From <strong>bi-weekly mortgage payments</strong> to <strong>extra monthly contributions</strong>, and from <strong>refinance break-even analysis</strong> to <strong>investment property cash flow calculations</strong>, this tool provides everything you need to make informed decisions about your home loan or rental property purchase.
            </p>
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

          {/* Solutions Section */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 border-b-2 border-green-500 pb-2">
              Our Powerful Solutions
            </h2>

            <h3 className="text-xl font-semibold text-slate-700 mb-3 mt-6 flex items-center gap-2">
              <span className="text-2xl">💰</span> Multiple One-Time Payments & Flexible Extra Payments
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Add unlimited lump-sum payments at any date, plus set up recurring extra payments (monthly or bi-weekly). See exactly how each additional payment accelerates your mortgage payoff and reduces total interest. Our calculator tracks every dollar and shows you the cumulative impact on your loan timeline.
            </p>

            <h3 className="text-xl font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="text-2xl">📊</span> Three-Way Loan Comparison with Interactive Graphs
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Compare your current scenario against two alternative loan offers. Adjust home values, down payments, interest rates, and loan terms—then instantly see which option saves you the most money. Visual bar graphs highlight the differences in monthly payments, total interest, and payoff dates. Perfect for shopping multiple lenders or deciding between 15-year vs. 30-year mortgages.
            </p>

            <h3 className="text-xl font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="text-2xl">🔄</span> Instant Refinancing Break-Even Recommendation
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Enter your current loan details and new refinance offer, including closing costs. Our calculator instantly tells you: How many months until you break even? What's your total savings? Should you refinance or stay put? It even accounts for your current remaining balance and projected payoff date, giving you a personalized, data-driven recommendation.
            </p>

            <h3 className="text-xl font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="text-2xl">🏘️</span> Full Rental Property Investment Analysis
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Toggle to <strong>Investment Property mode</strong> to unlock rental-specific features. Input monthly rent, vacancy rate, property management percentage, maintenance costs, and other operating expenses. The calculator automatically computes your monthly cash flow, annual cash flow, Cash-on-Cash Return, Cap Rate, NOI, and Break-Even Occupancy percentage—all the metrics real estate investors need to evaluate deals.
            </p>

            <h3 className="text-xl font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="text-2xl">📅</span> Bi-Weekly Payment Optimization
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Switch from monthly to bi-weekly payments and watch your payoff timeline shrink. By making 26 half-payments per year (equivalent to 13 full monthly payments), you can save years off your mortgage and thousands in interest. Our calculator shows the exact savings and new payoff date.
            </p>

            <h3 className="text-xl font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="text-2xl">📥</span> Complete Amortization Schedule with CSV Export
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              View your complete amortization schedule month-by-month, including principal, interest, extra payments, and remaining balance. Need to share it with your financial advisor or import into Excel? Export the entire schedule to CSV with one click. Every payment, every extra contribution, every detail—all downloadable.
            </p>
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

          {/* Share Section */}
          <div className="mb-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <h3 className="text-lg font-bold text-slate-800 mb-3">Love This Calculator? Share It!</h3>
            <ShareButtons />
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
    </div>
  );
};

export default MortgageCalculator;

