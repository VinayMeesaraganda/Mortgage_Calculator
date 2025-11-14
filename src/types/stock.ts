// TypeScript interfaces for Stock Investments Calculator

export interface StockTransaction {
  id: string;
  date: string; // YYYY-MM-DD format
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
}

export interface StockPurchase {
  id: string;
  purchaseDate: string; // YYYY-MM-DD format
  purchasePrice: number;
  quantity: number;
}

export interface StockHolding {
  id: string;
  symbol: string; // Stock ticker symbol (e.g., "AAPL", "RELIANCE")
  isSME: boolean; // True if this is an SME stock (uses different Yahoo Finance suffix)
  exchange?: string; // NSE or BSE
  purchases: StockPurchase[]; // Buy transactions
  transactions: StockTransaction[]; // All transactions (buy/sell)
  currentPrice: number;
  previousClose?: number; // Previous day's closing price
  openingPrice?: number; // Today's opening price (for daily P&L calculation)
  manualPrice: boolean; // True if price is manually entered, false if auto-fetched
  lastFetched?: string; // Timestamp of last price fetch
  lastFetchedDate?: string; // Date when price was last fetched (YYYY-MM-DD)
  status: 'active' | 'sold'; // Active if still holding shares, sold if all shares sold
  soldDate?: string; // Date when last share was sold
  realizedGainLoss?: number; // Total gain/loss from sold shares
}

export interface StockHoldingSummary {
  holding: StockHolding;
  totalQuantity: number; // Current quantity held (after accounting for sells)
  totalBought: number; // Total shares bought
  totalSold: number; // Total shares sold
  averageCostBasis: number;
  totalInvested: number; // Total money invested in current holdings
  currentValue: number;
  gainLoss: number; // Unrealized gain/loss
  gainLossPercent: number;
  dailyPL: number; // Profit/Loss since previous close
  dailyPLPercent: number;
  realizedGainLoss: number; // Total gain/loss from sold shares
  totalGainLoss: number; // Realized + Unrealized gain/loss
}

// Currency type is imported from mortgage.ts

