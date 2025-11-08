// Mortgage calculation functions

import type { ScheduleItem, OneTimePayment, MortgageCalculation } from '../types/mortgage';

// Extract shared extra payment logic to eliminate duplication
export const applyExtraPayments = (
  currentDate: Date,
  balance: number,
  principalPayment: number,
  extraPrincipal: number,
  extraPaymentEnabled: boolean,
  extraPaymentAmount: number,
  extraStartDate: Date | null,
  extraPaymentFrequency: string,
  extraPaymentMade: { value: boolean },
  oneTimePayments: Array<OneTimePayment>,
  appliedOneTimePayments: Set<string>
): number => {
  let totalExtra = extraPrincipal;
  
  // Apply recurring extra payments
  if (extraPaymentEnabled && extraPaymentAmount > 0 && balance > 0.01) {
    const currentDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const extraStartDateStr = extraStartDate ? `${extraStartDate.getFullYear()}-${String(extraStartDate.getMonth() + 1).padStart(2, '0')}` : '';
    
    if (!extraStartDate || currentDateStr >= extraStartDateStr || currentDate >= extraStartDate) {
      if (extraPaymentFrequency === 'one-time' && !extraPaymentMade.value) {
        totalExtra = Math.min(extraPaymentAmount, balance - principalPayment);
        extraPaymentMade.value = true;
      } else if (extraPaymentFrequency === 'monthly' || extraPaymentFrequency === 'biweekly') {
        totalExtra = Math.min(extraPaymentAmount, balance - principalPayment);
      }
    }
  }
  
  // Apply multiple one-time payments
  const currentDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  oneTimePayments.forEach(payment => {
    if (payment.date === currentDateStr && !appliedOneTimePayments.has(payment.id) && balance > 0.01) {
      const additionalPayment = Math.min(payment.amount, balance - principalPayment - totalExtra);
      totalExtra += additionalPayment;
      appliedOneTimePayments.add(payment.id);
    }
  });
  
  // Ensure we don't overpay
  if (principalPayment + totalExtra > balance) {
    totalExtra = Math.max(0, balance - principalPayment);
  }
  
  return totalExtra;
};

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
  
  // Calculate monthly payment
  const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                        (Math.pow(1 + monthlyRate, totalPayments) - 1);
  
  let balance = principal;
  const schedule: ScheduleItem[] = [];
  let totalInterestPaid = 0;
  let totalPaid = 0;
  // Parse date in local timezone to avoid timezone issues
  const [startYear, startMonth] = start.split('-').map(Number);
  let currentDate = new Date(startYear, startMonth - 1, 1);
  const extraStartDate = extraPaymentEnabled && extraPaymentStartDate ? (() => {
    const [year, month] = extraPaymentStartDate.split('-').map(Number);
    return new Date(year, month - 1, 1);
  })() : null;
  let extraPaymentMade = false;
  const appliedOneTimePayments = new Set<string>();
  
  for (let i = 1; i <= totalPayments && balance > 0.01; i++) {
    const interestPayment = balance * monthlyRate;
    let principalPayment = monthlyPayment - interestPayment;
    
    // Apply extra payments using shared logic
    const extraPaymentMadeRef: { value: boolean } = { value: extraPaymentMade };
    const extraPrincipal = applyExtraPayments(
      currentDate,
      balance,
      principalPayment,
      0,
      extraPaymentEnabled,
      extraPaymentAmount,
      extraStartDate,
      extraPaymentFrequency,
      extraPaymentMadeRef,
      oneTimePayments,
      appliedOneTimePayments
    );
    extraPaymentMade = extraPaymentMadeRef.value;
    
    principalPayment += extraPrincipal;
    
    // Final check: if this would pay off the loan, adjust to exact balance
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
      paymentNum: i,
      date: `${year}-${month}`,
      payment: totalPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: Math.max(0, balance),
      totalInterest: totalInterestPaid
    });
    
    currentDate.setMonth(currentDate.getMonth() + 1);
    
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
  const biweeklyPayment = monthlyPayment / 2;
  const dailyRate = annualRate / 365;
  
  let balance = principal;
  const schedule: ScheduleItem[] = [];
  let totalInterestPaid = 0;
  let totalPaid = 0;
  // Parse date in local timezone to avoid timezone issues
  const [startYear, startMonth] = start.split('-').map(Number);
  let currentDate = new Date(startYear, startMonth - 1, 1);
  const extraStartDate = extraPaymentEnabled && extraPaymentStartDate ? (() => {
    const [year, month] = extraPaymentStartDate.split('-').map(Number);
    return new Date(year, month - 1, 1);
  })() : null;
  let extraPaymentMade = false;
  const appliedOneTimePayments = new Set<string>();
  let paymentNum = 1;
  
  while (balance > 0.01 && paymentNum <= 2000) {
    const interestPayment = balance * dailyRate * 14;
    let principalPayment = biweeklyPayment - interestPayment;
    
    // Apply extra payments using shared logic
    const extraPaymentMadeRef: { value: boolean } = { value: extraPaymentMade };
    const extraPrincipal = applyExtraPayments(
      currentDate,
      balance,
      principalPayment,
      0,
      extraPaymentEnabled,
      extraPaymentAmount,
      extraStartDate,
      extraPaymentFrequency,
      extraPaymentMadeRef,
      oneTimePayments,
      appliedOneTimePayments
    );
    extraPaymentMade = extraPaymentMadeRef.value;
    
    principalPayment += extraPrincipal;
    
    // Final check: if this would pay off the loan, adjust to exact balance
    if (balance - principalPayment < 0.01) {
      principalPayment = balance;
      balance = 0;
    } else {
      balance -= principalPayment;
    }
    
    if (principalPayment < 0) {
      break;
    }
    
    totalInterestPaid += interestPayment;
    const actualPayment = interestPayment + principalPayment;
    totalPaid += actualPayment;
    
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    schedule.push({
      paymentNum: paymentNum,
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
  const endDate = schedule.length > 0 ? schedule[schedule.length - 1].date : start;
  
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

