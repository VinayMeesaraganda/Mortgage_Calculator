// TypeScript interfaces for Stock Investments Calculator

export interface StockPurchase {
  id: string;
  purchaseDate: string; // YYYY-MM format
  purchasePrice: number;
  quantity: number;
}

export interface StockHolding {
  id: string;
  symbol: string; // Stock ticker symbol (e.g., "AAPL", "GOOGL")
  purchases: StockPurchase[]; // Multiple purchases of the same stock
  currentPrice: number;
}

export interface StockHoldingSummary {
  holding: StockHolding;
  totalQuantity: number;
  averageCostBasis: number;
  totalInvested: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

// Currency type is imported from mortgage.ts

