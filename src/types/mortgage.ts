// TypeScript interfaces for Mortgage Calculator

export interface ScheduleItem {
  paymentNum: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterest: number;
}

export interface GroupedScheduleItem extends ScheduleItem {
  displayDate?: string;
  count?: number;
  startPayment?: number;
  endPayment?: number;
}

export interface MortgageCalculation {
  loanAmount: number;
  paymentAmount: number;
  totalPayments: number;
  totalPaid: number;
  totalInterest: number;
  endDate: string;
  schedule: ScheduleItem[];
  yearsToPayoff: number;
}

export interface MortgageCalculationWithComparison extends MortgageCalculation {
  comparison: MortgageCalculation;
  comparisonMode: 'extra-payments' | 'payment-types';
}

export interface OneTimePayment {
  id: string;
  date: string;
  amount: number;
}

export interface NumberInputHook {
  value: number;
  displayValue: string;
  setValue: (value: number) => void;
  handleChange: (inputValue: string) => void;
  handleFocus: () => void;
  handleBlur: () => void;
  isEditing: boolean;
}

export type PaymentType = 'monthly' | 'biweekly';
export type ExtraPaymentFrequency = 'monthly' | 'biweekly';
export type GroupByOption = 'year' | 'month' | 'none';

