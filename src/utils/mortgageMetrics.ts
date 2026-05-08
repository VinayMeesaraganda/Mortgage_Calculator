import { calculateMonthlyPayment } from './calculations-helpers';
import { calculateMonthlyAmortization, calculateBiweeklyAmortization } from './calculations';
import type { SavedMortgage } from '../types/mortgage';

export interface MortgageMetrics {
  loanAmount: number;
  baseMonthly: number;
  additionalMonthly: number;
  trueMonthly: number;
  principalPaid: number;
  interestPaid: number;
  principalRemaining: number;
  interestRemaining: number;
  totalInterest: number;
  percentPaid: number;
  payoffDate: string;
}

const normalise = (d: Date) => { d.setHours(0, 0, 0, 0); return d; };

export function computeMortgageMetrics(mortgage: SavedMortgage): MortgageMetrics {
  const loanAmount = mortgage.homeValue - mortgage.downPayment;
  const baseMonthly = calculateMonthlyPayment(loanAmount, mortgage.interestRate, mortgage.tenure);

  const taxMonthly = mortgage.propertyTax
    ? (mortgage.propertyTaxPeriod === 'month' ? mortgage.propertyTax : mortgage.propertyTax / 12)
    : 0;
  const insMonthly = mortgage.homeInsurance
    ? (mortgage.homeInsurancePeriod === 'month' ? mortgage.homeInsurance : mortgage.homeInsurance / 12)
    : 0;
  const additionalMonthly = taxMonthly + insMonthly + (mortgage.pmiAmount || 0) + (mortgage.hoaFees || 0);

  const annualRate = mortgage.interestRate / 100;
  const extraFreq = mortgage.extraPaymentEnabled
    ? (mortgage.extraPaymentFrequency === 'biweekly' && mortgage.paymentType === 'biweekly' ? 'biweekly' : 'monthly')
    : 'monthly';
  const oneTimePmts = mortgage.oneTimePayments || [];

  const calc = mortgage.paymentType === 'biweekly'
    ? calculateBiweeklyAmortization(
        loanAmount, annualRate,
        calculateMonthlyPayment(loanAmount, mortgage.interestRate, mortgage.tenure),
        mortgage.startDate,
        mortgage.extraPaymentEnabled && extraFreq === 'biweekly',
        mortgage.extraPaymentStartDate, 'biweekly',
        mortgage.extraPaymentAmount, oneTimePmts
      )
    : calculateMonthlyAmortization(
        loanAmount, annualRate, mortgage.tenure, mortgage.startDate,
        mortgage.extraPaymentEnabled && extraFreq === 'monthly',
        mortgage.extraPaymentStartDate, 'monthly',
        mortgage.extraPaymentAmount, oneTimePmts
      );

  const today = normalise(new Date());
  const start = normalise(new Date(mortgage.startDate));

  let principalPaid = 0;
  let interestPaid = 0;
  calc.schedule.forEach(item => {
    const d = normalise(new Date(item.date));
    if (d >= start && d <= today) {
      principalPaid += item.principal;
      interestPaid += item.interest;
    }
  });

  const principalRemaining = Math.max(0, loanAmount - principalPaid);
  const interestRemaining = Math.max(0, calc.totalInterest - interestPaid);
  const percentPaid = loanAmount > 0 ? Math.min(100, (principalPaid / loanAmount) * 100) : 0;

  return {
    loanAmount,
    baseMonthly,
    additionalMonthly,
    trueMonthly: baseMonthly + additionalMonthly,
    principalPaid,
    interestPaid,
    principalRemaining,
    interestRemaining,
    totalInterest: calc.totalInterest,
    percentPaid,
    payoffDate: calc.endDate,
  };
}
