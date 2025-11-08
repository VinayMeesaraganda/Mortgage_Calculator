// Helper function for applying loan scenarios to the main calculator
// Eliminates duplicate "Apply" button logic across modals

import type { PaymentType } from '../types/mortgage';

interface ScenarioInputs {
  homeValue?: number;
  downPayment?: number;
  interestRate: number;
  tenure: number;
  paymentType?: PaymentType;
  extraPayment?: number;
}

interface CalculatorInputs {
  homeValueInput: { setValue: (val: number) => void };
  downPaymentInput: { setValue: (val: number) => void };
  interestRateInput: { setValue: (val: number) => void };
  tenureInput: { setValue: (val: number) => void };
  extraPaymentAmountInput: { setValue: (val: number) => void };
}

interface CalculatorSetters {
  setPaymentType?: (type: PaymentType) => void;
  setStartDate: (date: string) => void;
  setExtraPaymentEnabled: (enabled: boolean) => void;
  setExtraPaymentFrequency?: (freq: string) => void;
  setExtraStartDate?: (date: string) => void;
}

/**
 * Apply a loan scenario to the main calculator
 * Handles setting all input values and closing the modal
 */
export const applyScenarioToCalculator = (
  scenario: ScenarioInputs,
  inputs: CalculatorInputs,
  setters: CalculatorSetters,
  closeModal?: () => void
): void => {
  const { homeValueInput, downPaymentInput, interestRateInput, tenureInput, extraPaymentAmountInput } = inputs;
  const { setPaymentType, setStartDate, setExtraPaymentEnabled, setExtraPaymentFrequency, setExtraStartDate } = setters;
  
  // Set basic loan inputs
  if (scenario.homeValue !== undefined) {
    homeValueInput.setValue(scenario.homeValue);
  }
  if (scenario.downPayment !== undefined) {
    downPaymentInput.setValue(scenario.downPayment);
  }
  interestRateInput.setValue(scenario.interestRate);
  tenureInput.setValue(scenario.tenure);
  
  // Set payment type if provided
  if (scenario.paymentType && setPaymentType) {
    setPaymentType(scenario.paymentType);
  }
  
  // Reset start date to today
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  setStartDate(todayString);
  
  // Handle extra payments
  if (scenario.extraPayment && scenario.extraPayment > 0) {
    setExtraPaymentEnabled(true);
    extraPaymentAmountInput.setValue(scenario.extraPayment);
    if (setExtraPaymentFrequency) {
      setExtraPaymentFrequency('monthly');
    }
    if (setExtraStartDate) {
      setExtraStartDate(todayString);
    }
  } else {
    setExtraPaymentEnabled(false);
    extraPaymentAmountInput.setValue(0);
  }
  
  // Close modal if callback provided
  if (closeModal) {
    closeModal();
  }
};

/**
 * Apply refinance scenario to main calculator
 * Similar to applyScenarioToCalculator but handles refinance-specific logic
 */
export const applyRefinanceToCalculator = (
  remainingBalance: number,
  newRate: number,
  newTerm: number,
  newExtraPayment: number,
  inputs: CalculatorInputs,
  setters: CalculatorSetters,
  closeModal?: () => void
): void => {
  applyScenarioToCalculator(
    {
      homeValue: remainingBalance,
      downPayment: 0, // No down payment for refinance
      interestRate: newRate,
      tenure: newTerm,
      extraPayment: newExtraPayment
    },
    inputs,
    setters,
    closeModal
  );
};
