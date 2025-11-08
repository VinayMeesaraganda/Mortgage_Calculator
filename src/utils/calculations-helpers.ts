// Utility functions for mortgage calculations
// Extracted from redundant code to follow DRY principle

/**
 * Calculate standard monthly payment using the loan payment formula
 * Formula: P = L[c(1 + c)^n]/[(1 + c)^n - 1]
 * Where: L = loan amount, c = monthly rate, n = number of payments
 */
export const calculateMonthlyPayment = (
  principal: number,
  annualRate: number,
  years: number
): number => {
  if (principal <= 0 || annualRate <= 0 || years <= 0) return 0;
  
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
};

/**
 * Simulate monthly amortization for quick calculations
 * Returns total months, interest, and extra payments without building full schedule
 */
export const simulateMonthlyAmortization = (
  balance: number,
  monthlyPayment: number,
  monthlyRate: number,
  extraPayment: number = 0,
  maxMonths: number = 360
): { monthsPaid: number; totalInterest: number; totalExtraPaid: number } => {
  let currentBalance = balance;
  let monthsPaid = 0;
  let totalInterest = 0;
  let totalExtraPaid = 0;
  
  while (currentBalance > 0.01 && monthsPaid < maxMonths) {
    const interestPayment = currentBalance * monthlyRate;
    let principalPayment = monthlyPayment - interestPayment;
    
    // Add extra payment if specified
    if (extraPayment > 0) {
      principalPayment += extraPayment;
      totalExtraPaid += extraPayment;
    }
    
    principalPayment = Math.min(principalPayment, currentBalance);
    
    if (principalPayment <= 0) break; // Safety check
    
    currentBalance -= principalPayment;
    totalInterest += interestPayment;
    monthsPaid++;
  }
  
  return { monthsPaid, totalInterest, totalExtraPaid };
};

/**
 * Simulate biweekly amortization for quick calculations
 * Uses daily interest compounding for 14-day periods
 */
export const simulateBiweeklyAmortization = (
  balance: number,
  biweeklyPayment: number,
  annualRate: number,
  maxPayments: number = 780
): { paymentsCount: number; totalInterest: number } => {
  const dailyRate = annualRate / 100 / 365;
  let currentBalance = balance;
  let totalInterest = 0;
  let paymentsCount = 0;
  
  while (currentBalance > 0.01 && paymentsCount < maxPayments) {
    const interestPayment = currentBalance * dailyRate * 14; // 14 days interest
    const principalPayment = Math.min(biweeklyPayment - interestPayment, currentBalance);
    
    if (principalPayment <= 0) break; // Safety check
    
    currentBalance -= principalPayment;
    totalInterest += interestPayment;
    paymentsCount++;
  }
  
  return { paymentsCount, totalInterest };
};

