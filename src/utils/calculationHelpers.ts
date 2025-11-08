// Reusable Calculation Helper Functions
// These eliminate code duplication across the application

/**
 * Calculate monthly loan payment using standard amortization formula
 * Formula: P × [r(1 + r)^n] / [(1 + r)^n - 1]
 */
export const calculateMonthlyPayment = (
  principal: number,
  annualRate: number,
  years: number
): number => {
  if (principal <= 0 || years <= 0) return 0;
  if (annualRate === 0) return principal / (years * 12);
  
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
};

/**
 * Simulate monthly amortization and calculate totals
 * Returns: months paid, total interest, total extra payments, final balance
 */
export const simulateMonthlyAmortization = (
  balance: number,
  monthlyPayment: number,
  monthlyRate: number,
  extraPayment: number = 0,
  maxMonths: number = 360
): {
  monthsPaid: number;
  totalInterest: number;
  totalExtra: number;
  finalBalance: number;
} => {
  let currentBalance = balance;
  let monthsPaid = 0;
  let totalInterest = 0;
  let totalExtra = 0;
  
  while (currentBalance > 0.01 && monthsPaid < maxMonths) {
    const interest = currentBalance * monthlyRate;
    let principal = monthlyPayment - interest;
    
    // Add extra payment if specified
    if (extraPayment > 0) {
      principal += extraPayment;
      totalExtra += extraPayment;
    }
    
    principal = Math.min(principal, currentBalance);
    
    if (principal <= 0) {
      // Payment doesn't cover interest
      monthsPaid = maxMonths;
      break;
    }
    
    currentBalance -= principal;
    totalInterest += interest;
    monthsPaid++;
  }
  
  return { 
    monthsPaid, 
    totalInterest, 
    totalExtra,
    finalBalance: currentBalance
  };
};

/**
 * Simulate bi-weekly amortization with daily compounding
 * Returns: payments made, total interest, total extra payments
 */
export const simulateBiweeklyAmortization = (
  balance: number,
  biweeklyPayment: number,
  annualRate: number,
  extraPayment: number = 0,
  maxPayments: number = 780 // 30 years × 26 periods
): {
  paymentsMade: number;
  totalInterest: number;
  totalExtra: number;
  finalBalance: number;
} => {
  const dailyRate = annualRate / 100 / 365;
  let currentBalance = balance;
  let paymentsMade = 0;
  let totalInterest = 0;
  let totalExtra = 0;
  
  while (currentBalance > 0.01 && paymentsMade < maxPayments) {
    const interest = currentBalance * dailyRate * 14; // 14 days interest
    let principal = biweeklyPayment - interest;
    
    // Add extra payment if specified
    if (extraPayment > 0) {
      principal += extraPayment;
      totalExtra += extraPayment;
    }
    
    principal = Math.min(principal, currentBalance);
    
    if (principal <= 0) break; // Safety check
    
    currentBalance -= principal;
    totalInterest += interest;
    paymentsMade++;
  }
  
  return {
    paymentsMade,
    totalInterest,
    totalExtra,
    finalBalance: currentBalance
  };
};

