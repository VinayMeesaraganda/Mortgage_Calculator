// MFapi.in API integration for Indian Mutual Funds
// Documentation: https://www.mfapi.in/

import type { MutualFundScheme, MFAPIResponse } from '../types/mutualFund';

const MFAPI_BASE_URL = 'https://api.mfapi.in/mf';

/**
 * Search for mutual funds by name
 * @param query Search query (fund name)
 * @returns List of matching mutual fund schemes
 */
export async function searchMutualFunds(query: string): Promise<MutualFundScheme[]> {
  try {
    const response = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch mutual funds');
    }
    const data = await response.json();
    
    // Transform API response to our format
    return data.map((item: any) => ({
      schemeCode: item.schemeCode?.toString() || '',
      schemeName: item.schemeName || '',
      nav: 0, // Will be fetched separately
      date: '',
      category: undefined // Will be determined by scheme name/category
    }));
  } catch (error) {
    console.error('Error searching mutual funds:', error);
    return [];
  }
}

/**
 * Get latest NAV for a mutual fund scheme
 * @param schemeCode Scheme code from MFapi.in
 * @returns Latest NAV and date
 */
export async function getLatestNAV(schemeCode: string): Promise<{ nav: number; date: string } | null> {
  try {
    const response = await fetch(`${MFAPI_BASE_URL}/${schemeCode}`);
    if (!response.ok) {
      throw new Error('Failed to fetch NAV');
    }
    const data: MFAPIResponse = await response.json();
    
    if (data.data && data.data.length > 0) {
      const latest = data.data[0];
      return {
        nav: parseFloat(latest.nav),
        date: latest.date
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching NAV:', error);
    return null;
  }
}

/**
 * Get NAV for a specific date (or closest available date)
 * @param schemeCode Scheme code from MFapi.in
 * @param targetDate Target date in YYYY-MM format
 * @returns NAV for the target date (or closest available date)
 */
export async function getNAVForDate(schemeCode: string, targetDate: string): Promise<{ nav: number; date: string } | null> {
  try {
    const response = await fetch(`${MFAPI_BASE_URL}/${schemeCode}`);
    if (!response.ok) {
      throw new Error('Failed to fetch NAV');
    }
    const data: MFAPIResponse = await response.json();
    
    if (!data.data || data.data.length === 0) {
      return null;
    }

    // Parse target date (format: YYYY-MM-DD or YYYY-MM)
    const dateParts = targetDate.split('-');
    const targetYear = parseInt(dateParts[0]);
    const targetMonth = parseInt(dateParts[1]);
    const targetMonthStart = new Date(targetYear, targetMonth - 1, 1);

    // First, try to find NAV within the target month (preferred)
    // Since data is sorted latest first, the first match will be the latest NAV in that month
    let navInTargetMonth = null;
    let navBeforeTargetMonth = null;
    let minDiffBefore = Infinity;

    for (const item of data.data) {
      // Handle different date formats: "2020-01-15" or "15-01-2020"
      const itemDateStr = item.date.trim();
      let itemYear: number;
      let itemMonth: number;
      let itemDay: number = 1;
      
      // Try parsing as YYYY-MM-DD or YYYY-MM
      if (itemDateStr.includes('-')) {
        const parts = itemDateStr.split('-');
        if (parts.length >= 2) {
          // Check if first part is year (4 digits) or day (1-2 digits)
          if (parts[0].length === 4) {
            // Format: YYYY-MM-DD or YYYY-MM
            itemYear = parseInt(parts[0]);
            itemMonth = parseInt(parts[1]);
            itemDay = parts.length > 2 ? parseInt(parts[2]) || 1 : 1;
          } else {
            // Format: DD-MM-YYYY
            itemDay = parseInt(parts[0]);
            itemMonth = parseInt(parts[1]);
            itemYear = parseInt(parts[2] || parts[parts.length - 1]);
          }
        } else {
          continue;
        }
      } else {
        continue;
      }

      if (isNaN(itemYear) || isNaN(itemMonth) || itemYear < 1900 || itemMonth < 1 || itemMonth > 12) {
        continue;
      }

      const itemDateObj = new Date(itemYear, itemMonth - 1, itemDay);
      
      // Check if NAV is within target month
      if (itemYear === targetYear && itemMonth === targetMonth) {
        // Found NAV in target month - use the first one (latest in month since sorted)
        if (!navInTargetMonth) {
          navInTargetMonth = item;
        }
      } 
      // If before target month, track the closest one
      else if (itemDateObj < targetMonthStart) {
        const diff = targetMonthStart.getTime() - itemDateObj.getTime();
        if (diff < minDiffBefore) {
          minDiffBefore = diff;
          navBeforeTargetMonth = item;
        }
      }
    }

    // Prefer NAV from target month, otherwise use closest before
    if (navInTargetMonth) {
      return {
        nav: parseFloat(navInTargetMonth.nav),
        date: navInTargetMonth.date
      };
    }

    if (navBeforeTargetMonth) {
      return {
        nav: parseFloat(navBeforeTargetMonth.nav),
        date: navBeforeTargetMonth.date
      };
    }
    
    // If no NAV found, return null
    return null;
  } catch (error) {
    console.error('Error fetching NAV for date:', error);
    return null;
  }
}

/**
 * Get historical NAV data for a mutual fund scheme
 * @param schemeCode Scheme code from MFapi.in
 * @returns Historical NAV data
 */
export async function getHistoricalNAV(schemeCode: string): Promise<MFAPIResponse | null> {
  try {
    const response = await fetch(`${MFAPI_BASE_URL}/${schemeCode}`);
    if (!response.ok) {
      throw new Error('Failed to fetch historical NAV');
    }
    const data: MFAPIResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching historical NAV:', error);
    return null;
  }
}

/**
 * Get scheme information
 * @param schemeCode Scheme code from MFapi.in
 * @returns Scheme metadata
 */
export async function getSchemeInfo(schemeCode: string): Promise<MFAPIResponse['meta'] | null> {
  try {
    const response = await fetch(`${MFAPI_BASE_URL}/${schemeCode}`);
    if (!response.ok) {
      throw new Error('Failed to fetch scheme info');
    }
    const data: MFAPIResponse = await response.json();
    return data.meta || null;
  } catch (error) {
    console.error('Error fetching scheme info:', error);
    return null;
  }
}

/**
 * Categorize mutual fund based on scheme name
 * This is a simple heuristic - in production, you'd use the API's category field
 */
export function categorizeFund(schemeName: string, schemeCategory?: string): 'large-cap' | 'mid-cap' | 'small-cap' | 'flexi-cap' {
  const name = schemeName.toLowerCase();
  const category = schemeCategory?.toLowerCase() || '';
  
  if (category.includes('flexi') || name.includes('flexi')) {
    return 'flexi-cap';
  }
  if (category.includes('large') || name.includes('large cap')) {
    return 'large-cap';
  }
  if (category.includes('mid') || name.includes('mid cap')) {
    return 'mid-cap';
  }
  if (category.includes('small') || name.includes('small cap')) {
    return 'small-cap';
  }
  
  // Default to flexi-cap if uncertain
  return 'flexi-cap';
}

