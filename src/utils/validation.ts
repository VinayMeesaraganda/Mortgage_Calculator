// Input validation utilities
// Provides comprehensive validation for user inputs

import { VALIDATION, ERROR_MESSAGES } from './constants';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Validate home value
export const validateHomeValue = (value: number): ValidationResult => {
  if (isNaN(value) || !isFinite(value)) {
    return { isValid: false, error: 'Home value must be a valid number' };
  }
  if (value < VALIDATION.MIN_HOME_VALUE) {
    return { isValid: false, error: `Home value must be at least $${VALIDATION.MIN_HOME_VALUE.toLocaleString()}` };
  }
  if (value > VALIDATION.MAX_HOME_VALUE) {
    return { isValid: false, error: `Home value cannot exceed $${VALIDATION.MAX_HOME_VALUE.toLocaleString()}` };
  }
  return { isValid: true };
};

// Validate down payment
export const validateDownPayment = (downPayment: number, homeValue: number): ValidationResult => {
  if (isNaN(downPayment) || !isFinite(downPayment)) {
    return { isValid: false, error: 'Down payment must be a valid number' };
  }
  if (downPayment < 0) {
    return { isValid: false, error: 'Down payment cannot be negative' };
  }
  if (downPayment > homeValue) {
    return { isValid: false, error: 'Down payment cannot exceed home value' };
  }
  return { isValid: true };
};

// Validate interest rate
export const validateInterestRate = (rate: number): ValidationResult => {
  if (isNaN(rate) || !isFinite(rate)) {
    return { isValid: false, error: 'Interest rate must be a valid number' };
  }
  if (rate < VALIDATION.MIN_INTEREST_RATE) {
    return { isValid: false, error: `Interest rate must be at least ${VALIDATION.MIN_INTEREST_RATE}%` };
  }
  if (rate > VALIDATION.MAX_INTEREST_RATE) {
    return { isValid: false, error: `Interest rate cannot exceed ${VALIDATION.MAX_INTEREST_RATE}%` };
  }
  return { isValid: true };
};

// Validate tenure
export const validateTenure = (years: number): ValidationResult => {
  if (isNaN(years) || !isFinite(years)) {
    return { isValid: false, error: 'Loan tenure must be a valid number' };
  }
  if (years < VALIDATION.MIN_TENURE) {
    return { isValid: false, error: `Loan tenure must be at least ${VALIDATION.MIN_TENURE} year` };
  }
  if (years > VALIDATION.MAX_TENURE) {
    return { isValid: false, error: `Loan tenure cannot exceed ${VALIDATION.MAX_TENURE} years` };
  }
  if (!Number.isInteger(years)) {
    return { isValid: false, error: 'Loan tenure must be a whole number' };
  }
  return { isValid: true };
};

// Validate mortgage name
export const validateMortgageName = (
  name: string,
  existingNames: string[],
  currentMortgageId?: string
): ValidationResult => {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return { isValid: false, error: ERROR_MESSAGES.EMPTY_MORTGAGE_NAME };
  }
  
  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Mortgage name must be at least 2 characters' };
  }
  
  if (trimmedName.length > 50) {
    return { isValid: false, error: 'Mortgage name cannot exceed 50 characters' };
  }
  
  // Check for duplicate names
  const isDuplicate = existingNames.some(
    (existingName) => existingName.toLowerCase() === trimmedName.toLowerCase()
  );
  
  if (isDuplicate && !currentMortgageId) {
    return { isValid: false, error: ERROR_MESSAGES.DUPLICATE_MORTGAGE_NAME };
  }
  
  return { isValid: true };
};

// Validate extra payment amount
export const validateExtraPayment = (amount: number): ValidationResult => {
  if (isNaN(amount) || !isFinite(amount)) {
    return { isValid: false, error: 'Extra payment must be a valid number' };
  }
  if (amount < 0) {
    return { isValid: false, error: 'Extra payment cannot be negative' };
  }
  return { isValid: true };
};

// Validate percentage
export const validatePercentage = (value: number, fieldName: string = 'Value'): ValidationResult => {
  if (isNaN(value) || !isFinite(value)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }
  if (value < 0) {
    return { isValid: false, error: `${fieldName} cannot be negative` };
  }
  if (value > 100) {
    return { isValid: false, error: `${fieldName} cannot exceed 100%` };
  }
  return { isValid: true };
};

// Validate date format (YYYY-MM or YYYY-MM-DD)
export const validateDate = (dateString: string): ValidationResult => {
  if (!dateString) {
    return { isValid: false, error: 'Date is required' };
  }
  
  const datePattern = /^\d{4}-\d{2}(-\d{2})?$/;
  if (!datePattern.test(dateString)) {
    return { isValid: false, error: 'Invalid date format. Use YYYY-MM or YYYY-MM-DD' };
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date' };
  }
  
  return { isValid: true };
};

// Validate loan amount (derived from home value and down payment)
export const validateLoanAmount = (loanAmount: number): ValidationResult => {
  if (isNaN(loanAmount) || !isFinite(loanAmount)) {
    return { isValid: false, error: 'Loan amount must be a valid number' };
  }
  if (loanAmount <= 0) {
    return { isValid: false, error: 'Loan amount must be greater than zero' };
  }
  return { isValid: true };
};

// Validate all mortgage inputs at once
export interface MortgageInputs {
  homeValue: number;
  downPayment: number;
  interestRate: number;
  tenure: number;
  startDate: string;
}

export const validateMortgageInputs = (inputs: MortgageInputs): ValidationResult => {
  // Validate each field
  const homeValueResult = validateHomeValue(inputs.homeValue);
  if (!homeValueResult.isValid) return homeValueResult;
  
  const downPaymentResult = validateDownPayment(inputs.downPayment, inputs.homeValue);
  if (!downPaymentResult.isValid) return downPaymentResult;
  
  const interestRateResult = validateInterestRate(inputs.interestRate);
  if (!interestRateResult.isValid) return interestRateResult;
  
  const tenureResult = validateTenure(inputs.tenure);
  if (!tenureResult.isValid) return tenureResult;
  
  const dateResult = validateDate(inputs.startDate);
  if (!dateResult.isValid) return dateResult;
  
  // Validate derived loan amount
  const loanAmount = inputs.homeValue - inputs.downPayment;
  const loanAmountResult = validateLoanAmount(loanAmount);
  if (!loanAmountResult.isValid) return loanAmountResult;
  
  return { isValid: true };
};

