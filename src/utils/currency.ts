import { Currency, CurrencyInfo } from '../types/mortgage';

// Currency symbols only - NO conversion
export const CURRENCY_DATA: Record<Currency, CurrencyInfo> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rate: 1.0
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    rate: 1.0
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    rate: 1.0
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    rate: 1.0
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    rate: 1.0
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    rate: 1.0
  }
};

export const formatCurrencyValue = (
  value: number,
  currency: Currency = 'USD',
  showDecimals: boolean = true
): string => {
  const currencyInfo = CURRENCY_DATA[currency];
  
  if (showDecimals) {
    return `${currencyInfo.symbol}${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
  
  return `${currencyInfo.symbol}${Math.round(value).toLocaleString('en-US')}`;
};

export const formatCurrencyCompactValue = (
  value: number,
  currency: Currency = 'USD'
): string => {
  const currencyInfo = CURRENCY_DATA[currency];
  
  if (value >= 1000000) {
    return `${currencyInfo.symbol}${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${currencyInfo.symbol}${(value / 1000).toFixed(0)}K`;
  }
  return `${currencyInfo.symbol}${Math.round(value).toLocaleString('en-US')}`;
};

// Convert from selected currency to USD (for calculations)
export const convertToUSD = (value: number, fromCurrency: Currency): number => {
  return value / CURRENCY_DATA[fromCurrency].rate;
};

// Convert from USD to selected currency (for display)
export const convertFromUSD = (value: number, toCurrency: Currency): number => {
  return value * CURRENCY_DATA[toCurrency].rate;
};

