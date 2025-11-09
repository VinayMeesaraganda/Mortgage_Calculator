import { Currency } from '../types/mortgage';

// Current mortgage rates by country (updated periodically)
// In production, these would come from an API like Freddie Mac or Bank APIs
export interface MortgageRateData {
  currency: Currency;
  country: string;
  rates: {
    year15: number;
    year30: number;
    arm5: number;
    arm7: number;
  };
  lastUpdated: string;
}

export const CURRENT_MORTGAGE_RATES: Record<Currency, MortgageRateData> = {
  USD: {
    currency: 'USD',
    country: 'United States',
    rates: {
      year15: 6.25,
      year30: 6.85,
      arm5: 6.10,
      arm7: 6.35
    },
    lastUpdated: '2025-11-09'
  },
  CAD: {
    currency: 'CAD',
    country: 'Canada',
    rates: {
      year15: 5.89,
      year30: 6.24,
      arm5: 5.75,
      arm7: 5.99
    },
    lastUpdated: '2025-11-09'
  },
  GBP: {
    currency: 'GBP',
    country: 'United Kingdom',
    rates: {
      year15: 5.15,
      year30: 5.65,
      arm5: 4.85,
      arm7: 5.10
    },
    lastUpdated: '2025-11-09'
  },
  EUR: {
    currency: 'EUR',
    country: 'Eurozone',
    rates: {
      year15: 3.95,
      year30: 4.35,
      arm5: 3.75,
      arm7: 3.95
    },
    lastUpdated: '2025-11-09'
  },
  AUD: {
    currency: 'AUD',
    country: 'Australia',
    rates: {
      year15: 6.15,
      year30: 6.55,
      arm5: 5.95,
      arm7: 6.15
    },
    lastUpdated: '2025-11-09'
  },
  INR: {
    currency: 'INR',
    country: 'India',
    rates: {
      year15: 8.50,
      year30: 9.00,
      arm5: 8.25,
      arm7: 8.50
    },
    lastUpdated: '2025-11-09'
  }
};

export const getSuggestedRate = (
  currency: Currency,
  tenureYears: number,
  mortgageType: 'fixed' | 'arm' = 'fixed'
): number => {
  const rateData = CURRENT_MORTGAGE_RATES[currency];
  
  if (mortgageType === 'arm') {
    return tenureYears <= 7 ? rateData.rates.arm5 : rateData.rates.arm7;
  }
  
  return tenureYears <= 15 ? rateData.rates.year15 : rateData.rates.year30;
};

