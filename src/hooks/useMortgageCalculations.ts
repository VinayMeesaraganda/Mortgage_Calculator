// Custom hook for mortgage calculations - consolidates calculation logic

import { useMemo } from 'react';
import type { PaymentType, OneTimePayment, MortgageCalculationWithComparison } from '../types/mortgage';
import { calculateMonthlyAmortization, calculateBiweeklyAmortization } from '../utils/calculations';

interface UseMortgageCalculationsParams {
  homeValue: number;
  downPayment: number;
  interestRate: number;
  tenure: number;
  startDate: string;
  paymentType: PaymentType;
  extraPaymentEnabled: boolean;
  extraPaymentStartDate: string;
  extraPaymentFrequency: string;
  extraPaymentAmount: number;
  oneTimePayments: OneTimePayment[];
}

export const useMortgageCalculations = ({
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
}: UseMortgageCalculationsParams): MortgageCalculationWithComparison => {
  return useMemo(() => {
    const principal = homeValue - downPayment;
    const annualRate = interestRate / 100;
    
    // Check if any extra payments are configured
    const hasExtraPayments = (extraPaymentEnabled && extraPaymentAmount > 0) || oneTimePayments.length > 0;
    
    // Determine extra payment frequency based on payment type
    const effectiveExtraFrequency = extraPaymentEnabled 
      ? (extraPaymentFrequency === 'biweekly' && paymentType === 'biweekly' ? 'biweekly' : 'monthly')
      : 'monthly';
    
    // Calculate baseline monthly (no extra payments)
    const monthlyCalcBase = calculateMonthlyAmortization(
      principal, 
      annualRate, 
      tenure, 
      startDate,
      false,
      extraPaymentStartDate,
      'monthly',
      0,
      []
    );
    
    // Calculate baseline biweekly (no extra payments)
    const biweeklyCalcBase = calculateBiweeklyAmortization(
      principal, 
      annualRate, 
      monthlyCalcBase.paymentAmount, 
      startDate,
      false,
      extraPaymentStartDate,
      'biweekly',
      0,
      []
    );
    
    if (hasExtraPayments) {
      // If extra payments are enabled, compare selected payment type WITH vs WITHOUT extra payments
      if (paymentType === 'monthly') {
        const monthlyWithExtra = calculateMonthlyAmortization(
          principal, 
          annualRate, 
          tenure, 
          startDate,
          extraPaymentEnabled && effectiveExtraFrequency === 'monthly',
          extraPaymentStartDate,
          'monthly',
          extraPaymentAmount,
          oneTimePayments
        );
        return {
          ...monthlyWithExtra,
          comparison: monthlyCalcBase,
          comparisonMode: 'extra-payments'
        };
      } else {
        const biweeklyWithExtra = calculateBiweeklyAmortization(
          principal, 
          annualRate, 
          monthlyCalcBase.paymentAmount, 
          startDate,
          extraPaymentEnabled && effectiveExtraFrequency === 'biweekly',
          extraPaymentStartDate,
          'biweekly',
          extraPaymentAmount,
          oneTimePayments
        );
        return {
          ...biweeklyWithExtra,
          comparison: biweeklyCalcBase,
          comparisonMode: 'extra-payments'
        };
      }
    } else {
      // Default: compare monthly vs biweekly
      if (paymentType === 'monthly') {
        return {
          ...monthlyCalcBase,
          comparison: biweeklyCalcBase,
          comparisonMode: 'payment-types'
        };
      } else {
        return {
          ...biweeklyCalcBase,
          comparison: monthlyCalcBase,
          comparisonMode: 'payment-types'
        };
      }
    }
  }, [homeValue, downPayment, interestRate, tenure, startDate, paymentType, extraPaymentEnabled, extraPaymentStartDate, extraPaymentFrequency, extraPaymentAmount, oneTimePayments]);
};

