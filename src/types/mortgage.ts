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
export type Currency = 'USD' | 'CAD' | 'GBP' | 'EUR' | 'AUD' | 'INR';
export type MortgageType = 'fixed' | 'arm';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  rate: number; // Exchange rate to USD
}

export interface ARMDetails {
  initialRate: number;
  initialPeriodYears: number;
  adjustmentPeriodYears: number;
  rateCapPerAdjustment: number;
  lifetimeRateCap: number;
  indexRate: number;
  margin: number;
}

// Saved Mortgage for tracking
export interface SavedMortgage {
  id: string;
  name: string; // User-friendly name for the mortgage
  homeValue: number;
  downPayment: number;
  interestRate: number;
  tenure: number; // in years
  startDate: string; // YYYY-MM-DD format
  paymentType: PaymentType;
  extraPaymentEnabled: boolean;
  extraPaymentAmount: number;
  extraPaymentStartDate: string; // YYYY-MM-DD format
  extraPaymentFrequency: ExtraPaymentFrequency;
  oneTimePayments: OneTimePayment[];
  currency: Currency;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp

  // Investment Property Fields
  propertyType?: 'primary' | 'investment';
  monthlyRent?: number;
  vacancyRate?: number;
  propertyManagementPercent?: number;
  maintenance?: number;
  utilities?: number;
  propertyAppreciationRate?: number;

  // Additional Costs
  propertyTax?: number;
  propertyTaxPeriod?: 'year' | 'month';
  homeInsurance?: number;
  homeInsurancePeriod?: 'year' | 'month';
  hoaFees?: number;
}

