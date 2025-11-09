// Formatting utility functions
import { formatCurrencyValue, formatCurrencyCompactValue } from './currency';
import type { Currency } from '../types/mortgage';

// Global currency state (can be set from components)
let globalCurrency: Currency = 'USD';

export const setGlobalCurrency = (currency: Currency) => {
  globalCurrency = currency;
};

export const getGlobalCurrency = (): Currency => {
  return globalCurrency;
};

export const formatCurrency = (value: number, currency?: Currency): string => {
  const curr = currency || globalCurrency;
  return formatCurrencyValue(value, curr, true);
};

export const formatCurrencyCompact = (value: number, currency?: Currency): string => {
  const curr = currency || globalCurrency;
  return formatCurrencyCompactValue(value, curr);
};

export const formatDate = (dateStr: string): string => {
  const [year, month] = dateStr.split('-');
  return `${new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'short' })} ${year}`;
};

export const formatYearsMonths = (years: number): string => {
  const wholeYears = Math.floor(years);
  const months = Math.round((years - wholeYears) * 12);
  if (months === 0) return `${wholeYears} years`;
  return `${wholeYears} years ${months} ${months === 1 ? 'month' : 'months'}`;
};

