// TypeScript interfaces for Mutual Funds Calculator

export interface MutualFundPurchase {
  id: string;
  purchaseDate: string; // YYYY-MM-DD format
  purchasePrice: number; // NAV at purchase
  quantity: number; // Number of units
  investmentAmount: number; // Total amount invested
}

export interface MutualFundHolding {
  id: string;
  schemeCode: string; // MFapi.in scheme code
  schemeName: string;
  category: MutualFundCategory;
  purchases: MutualFundPurchase[]; // Multiple purchases (SIP support)
  currentNAV: number;
}

export interface MutualFundHoldingSummary {
  holding: MutualFundHolding;
  totalUnits: number;
  averagePurchasePrice: number;
  totalInvested: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  xirr?: number; // Extended Internal Rate of Return
}

export type MutualFundCategory = 'large-cap' | 'mid-cap' | 'small-cap' | 'flexi-cap';

export interface MutualFundScheme {
  schemeCode: string;
  schemeName: string;
  nav: number;
  date: string;
  category?: MutualFundCategory;
}

export interface MFAPIResponse {
  meta: {
    fund_house: string;
    scheme_type: string;
    scheme_category: string;
    scheme_code: number;
    scheme_name: string;
  };
  data: Array<{
    date: string;
    nav: string;
  }>;
  status: string;
}

