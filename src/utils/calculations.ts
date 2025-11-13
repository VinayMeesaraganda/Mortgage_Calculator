// Mortgage calculation functions - Complete rewrite for accuracy

import type { ScheduleItem, OneTimePayment, MortgageCalculation } from '../types/mortgage';

/**
 * Calculate the standard monthly payment using the loan payment formula
 * Formula: M = P[r(1 + r)^n]/[(1 + r)^n - 1]
 * Where: P = principal, r = monthly rate, n = number of payments
 */
const calculateStandardMonthlyPayment = (
  principal: number,
  annualRate: number,
  years: number
): number => {
  const monthlyRate = annualRate / 12;
  const totalPayments = years * 12;
  
  if (monthlyRate === 0) return principal / totalPayments;
  
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
         (Math.pow(1 + monthlyRate, totalPayments) - 1);
};

/**
 * Parse date string (YYYY-MM) and return a Date object
 */
const parseDate = (dateStr: string): Date => {
  const [year, month] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, 1);
};

/**
 * Format date as YYYY-MM
 */
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Check if a payment date should receive an extra payment
 */
const shouldApplyExtraPayment = (
  currentDate: Date,
  extraStartDate: Date | null,
  extraPaymentFrequency: string,
  extraPaymentMade: { value: boolean }
): boolean => {
  if (!extraStartDate) return false;
  if (currentDate < extraStartDate) return false;
  
  if (extraPaymentFrequency === 'one-time') {
    if (!extraPaymentMade.value) {
      extraPaymentMade.value = true;
      return true;
    }
    return false;
  }
  
  // For monthly and biweekly, always apply after start date
  return true;
};

/**
 * Calculate monthly amortization schedule with extra payments
 */
export const calculateMonthlyAmortization = (
  principal: number,
  annualRate: number,
  years: number,
  start: string,
  extraPaymentEnabled: boolean = false,
  extraPaymentStartDate: string = '',
  extraPaymentFrequency: string = 'monthly',
  extraPaymentAmount: number = 0,
  oneTimePayments: Array<OneTimePayment> = []
): MortgageCalculation => {
  const monthlyRate = annualRate / 12;
  const totalPayments = years * 12;
  
  // Calculate standard monthly payment (no extra)
  const monthlyPayment = calculateStandardMonthlyPayment(principal, annualRate, years);
  
  let balance = principal;
  const schedule: ScheduleItem[] = [];
  let totalInterestPaid = 0;
  let totalPaid = 0;
  
  const [startYear, startMonth] = start.split('-').map(Number);
  let currentDate = new Date(startYear, startMonth - 1, 1);
  
  const extraStartDate = extraPaymentEnabled && extraPaymentStartDate
    ? parseDate(extraPaymentStartDate)
    : null;
  
  const extraPaymentMade = { value: false };
  const appliedOneTimePayments = new Set<string>();
  
  let paymentNum = 1;
  const maxPayments = totalPayments * 2; // Safety limit
  
  while (balance > 0.01 && paymentNum <= maxPayments) {
    const interestPayment = balance * monthlyRate;
    let principalPayment = monthlyPayment - interestPayment;
    
    // Ensure principal payment doesn't go negative
    if (principalPayment < 0) principalPayment = 0;
    
    let extraPrincipal = 0;
    
    // Apply recurring extra payments (monthly)
    if (
      extraPaymentEnabled &&
      extraPaymentAmount > 0 &&
      extraPaymentFrequency === 'monthly' &&
      shouldApplyExtraPayment(currentDate, extraStartDate, extraPaymentFrequency, extraPaymentMade)
    ) {
      extraPrincipal += extraPaymentAmount;
    }
    
    // Apply one-time payments for this month
    const currentDateStr = formatDate(currentDate);
    oneTimePayments.forEach(payment => {
      if (payment.date === currentDateStr && !appliedOneTimePayments.has(payment.id)) {
        extraPrincipal += payment.amount;
        appliedOneTimePayments.add(payment.id);
      }
    });
    
    // Total principal payment
    principalPayment += extraPrincipal;
    
    // Don't pay more than remaining balance
    if (principalPayment > balance) {
      principalPayment = balance;
    }
    
    balance -= principalPayment;
    if (balance < 0) balance = 0;
    
    totalInterestPaid += interestPayment;
    const totalPayment = interestPayment + principalPayment;
    totalPaid += totalPayment;
    
    schedule.push({
      paymentNum,
      date: currentDateStr,
      payment: totalPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: balance,
      totalInterest: totalInterestPaid
    });
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
    paymentNum++;
    
    if (balance < 0.01) break;
  }
  
  const endDate = schedule.length > 0 ? schedule[schedule.length - 1].date : start;
  const yearsToPayoff = schedule.length / 12;
  
  return {
    loanAmount: principal,
    paymentAmount: monthlyPayment,
    totalPayments: schedule.length,
    totalPaid: totalPaid,
    totalInterest: totalInterestPaid,
    endDate: endDate,
    schedule,
    yearsToPayoff: yearsToPayoff
  };
};

/**
 * Calculate biweekly amortization schedule with extra payments
 */
export const calculateBiweeklyAmortization = (
  principal: number,
  annualRate: number,
  monthlyPayment: number,
  start: string,
  extraPaymentEnabled: boolean = false,
  extraPaymentStartDate: string = '',
  extraPaymentFrequency: string = 'biweekly',
  extraPaymentAmount: number = 0,
  oneTimePayments: Array<OneTimePayment> = []
): MortgageCalculation => {
  // Biweekly payment is half of monthly payment
  const biweeklyPayment = monthlyPayment / 2;
  
  // Daily interest rate for 14-day periods
  const dailyRate = annualRate / 365;
  
  let balance = principal;
  const schedule: ScheduleItem[] = [];
  let totalInterestPaid = 0;
  let totalPaid = 0;
  
  const [startYear, startMonth] = start.split('-').map(Number);
  let currentDate = new Date(startYear, startMonth - 1, 1);
  
  const extraStartDate = extraPaymentEnabled && extraPaymentStartDate
    ? parseDate(extraPaymentStartDate)
    : null;
  
  const extraPaymentMade = { value: false };
  const appliedOneTimePayments = new Set<string>();
  
  let paymentNum = 1;
  const maxPayments = 2000; // Safety limit
  
  while (balance > 0.01 && paymentNum <= maxPayments) {
    // Interest for 14 days
    const interestPayment = balance * dailyRate * 14;
    let principalPayment = biweeklyPayment - interestPayment;
    
    // Ensure principal payment doesn't go negative
    if (principalPayment < 0) principalPayment = 0;
    
    let extraPrincipal = 0;
    
    // Apply recurring extra payments (biweekly)
    if (
      extraPaymentEnabled &&
      extraPaymentAmount > 0 &&
      extraPaymentFrequency === 'biweekly' &&
      shouldApplyExtraPayment(currentDate, extraStartDate, extraPaymentFrequency, extraPaymentMade)
    ) {
      extraPrincipal += extraPaymentAmount;
    }
    
    // Apply one-time payments for this month
    const currentDateStr = formatDate(currentDate);
    oneTimePayments.forEach(payment => {
      if (payment.date === currentDateStr && !appliedOneTimePayments.has(payment.id)) {
        extraPrincipal += payment.amount;
        appliedOneTimePayments.add(payment.id);
      }
    });
    
    // Total principal payment
    principalPayment += extraPrincipal;
    
    // Don't pay more than remaining balance
    if (principalPayment > balance) {
      principalPayment = balance;
    }
    
    balance -= principalPayment;
    if (balance < 0) balance = 0;
    
    totalInterestPaid += interestPayment;
    const totalPayment = interestPayment + principalPayment;
    totalPaid += totalPayment;
    
    schedule.push({
      paymentNum,
      date: currentDateStr,
      payment: totalPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: balance,
      totalInterest: totalInterestPaid
    });
    
    // Move to next biweekly period (14 days)
    currentDate.setDate(currentDate.getDate() + 14);
    paymentNum++;
    
    if (balance < 0.01) break;
  }
  
  const endDate = schedule.length > 0 ? schedule[schedule.length - 1].date : start;
  const yearsToPayoff = schedule.length / 26; // 26 biweekly periods per year
  
  return {
    loanAmount: principal,
    paymentAmount: biweeklyPayment,
    totalPayments: schedule.length,
    totalPaid: totalPaid,
    totalInterest: totalInterestPaid,
    endDate: endDate,
    schedule,
    yearsToPayoff: yearsToPayoff
  };
};
