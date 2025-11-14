// Yahoo Finance Service for fetching stock prices
// Supports NSE and BSE exchanges with regular and SME stocks

export interface YahooFinanceQuote {
  symbol: string;
  price: number;
  previousClose: number;
  open: number; // Today's opening price
  change: number;
  changePercent: number;
  currency: string;
  exchange: string;
  success: boolean;
  error?: string;
}

interface YahooApiResponse {
  chart: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        regularMarketOpen?: number;
        previousClose?: number;
        currency?: string;
        exchangeName?: string;
        symbol?: string;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: (number | null)[];
          volume?: (number | null)[];
        }>;
      };
    }>;
    error?: {
      code: string;
      description: string;
    };
  };
}

/**
 * Fetch stock price from Yahoo Finance
 * Tries NSE first, then BSE if NSE fails
 */
export async function fetchStockPrice(
  symbol: string,
  isSME: boolean = false
): Promise<YahooFinanceQuote> {
  const cleanSymbol = symbol.trim().toUpperCase();
  
  // Try NSE first
  const nseResult = await tryFetchFromExchange(cleanSymbol, 'NSE', isSME);
  if (nseResult.success) {
    return nseResult;
  }
  
  // If NSE fails, try BSE
  const bseResult = await tryFetchFromExchange(cleanSymbol, 'BSE', isSME);
  if (bseResult.success) {
    return bseResult;
  }
  
  // If both fail, return error
  return {
    symbol: cleanSymbol,
    price: 0,
    previousClose: 0,
    open: 0,
    change: 0,
    changePercent: 0,
    currency: 'INR',
    exchange: 'Unknown',
    success: false,
    error: nseResult.error || 'Unable to fetch stock price from NSE or BSE'
  };
}

/**
 * Try to fetch stock price from a specific exchange
 */
async function tryFetchFromExchange(
  symbol: string,
  exchange: 'NSE' | 'BSE',
  isSME: boolean
): Promise<YahooFinanceQuote> {
  try {
    const yahooSymbol = buildYahooSymbol(symbol, exchange, isSME);
    
    // Using Yahoo Finance API v8 with CORS proxy fallback
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
    
    // Try direct fetch first
    let data: YahooApiResponse;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      data = await response.json();
    } catch (corsError) {
      // If CORS fails, try with a public CORS proxy
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const proxyResponse = await fetch(proxyUrl);
      
      if (!proxyResponse.ok) {
        throw new Error(`Proxy HTTP error! status: ${proxyResponse.status}`);
      }
      
      const proxyData = await proxyResponse.json();
      data = JSON.parse(proxyData.contents);
    }
    
    // Check for API errors
    if (data.chart.error) {
      throw new Error(data.chart.error.description || 'Unknown API error');
    }
    
    // Extract price data
    const result = data.chart.result?.[0];
    if (!result || !result.meta) {
      throw new Error('Invalid response structure');
    }
    
    const { regularMarketPrice, regularMarketOpen, previousClose, currency, exchangeName } = result.meta;
    
    if (regularMarketPrice === undefined || regularMarketPrice === null) {
      throw new Error('Price data not available');
    }
    
    const prevClose = previousClose || regularMarketPrice;
    const openPrice = regularMarketOpen || regularMarketPrice; // Use current price as fallback if open not available
    const change = regularMarketPrice - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
    
    return {
      symbol: yahooSymbol,
      price: regularMarketPrice,
      previousClose: prevClose,
      open: openPrice,
      change,
      changePercent,
      currency: currency || 'INR',
      exchange: exchangeName || exchange,
      success: true
    };
    
  } catch (error) {
    return {
      symbol,
      price: 0,
      previousClose: 0,
      open: 0,
      change: 0,
      changePercent: 0,
      currency: 'INR',
      exchange,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Build Yahoo Finance symbol based on exchange and stock type
 */
function buildYahooSymbol(symbol: string, exchange: 'NSE' | 'BSE', isSME: boolean): string {
  const suffix = exchange === 'NSE' ? '.NS' : '.BO';
  const smeSuffix = isSME ? '-SM' : '';
  
  return `${symbol}${smeSuffix}${suffix}`;
}

/**
 * Validate if a stock symbol exists and is tradeable
 */
export async function validateStockSymbol(
  symbol: string,
  isSME: boolean = false
): Promise<{ valid: boolean; exchange?: string; error?: string }> {
  const result = await fetchStockPrice(symbol, isSME);
  
  if (result.success) {
    return {
      valid: true,
      exchange: result.exchange
    };
  }
  
  return {
    valid: false,
    error: result.error
  };
}

/**
 * Fetch multiple stock prices in parallel
 */
export async function fetchMultipleStockPrices(
  stocks: Array<{ symbol: string; isSME: boolean }>
): Promise<YahooFinanceQuote[]> {
  const promises = stocks.map(stock => fetchStockPrice(stock.symbol, stock.isSME));
  return Promise.all(promises);
}

/**
 * Get stock history data (for charts and analysis)
 */
export async function fetchStockHistory(
  symbol: string,
  isSME: boolean = false,
  range: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y' = '1mo'
): Promise<{
  success: boolean;
  data?: Array<{ date: string; close: number; volume: number }>;
  error?: string;
}> {
  try {
    const cleanSymbol = symbol.trim().toUpperCase();
    
    // Try NSE first
    let yahooSymbol = buildYahooSymbol(cleanSymbol, 'NSE', isSME);
    let url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=${range}&interval=1d`;
    
    let response = await fetch(url);
    
    // If NSE fails, try BSE
    if (!response.ok) {
      yahooSymbol = buildYahooSymbol(cleanSymbol, 'BSE', isSME);
      url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=${range}&interval=1d`;
      response = await fetch(url);
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch stock history');
    }
    
    const data: YahooApiResponse = await response.json();
    
    if (data.chart.error) {
      throw new Error(data.chart.error.description);
    }
    
    const result = data.chart.result?.[0];
    if (!result) {
      throw new Error('No data available');
    }
    
    // Extract historical data
    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const volumes = result.indicators?.quote?.[0]?.volume || [];
    
    const historyData = timestamps.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      close: closes[index] || 0,
      volume: volumes[index] || 0
    }));
    
    return {
      success: true,
      data: historyData
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

