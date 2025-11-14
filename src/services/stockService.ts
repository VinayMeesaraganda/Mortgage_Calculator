// Firestore service for Stock Investments data
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { StockHolding } from '../types/stock';
import { logger, logFirestoreOperation, logFirestoreError } from '../utils/logger';
import { ERROR_MESSAGES } from '../utils/constants';

const COLLECTION_NAME = 'stockHoldings';

/**
 * Save stock holdings for a user
 */
export async function saveStockHoldings(
  userId: string, 
  holdings: StockHolding[]
): Promise<void> {
  try {
    if (!userId) {
      throw new Error('User ID is required to save stock holdings');
    }

    if (!db) {
      throw new Error('Firestore is not initialized. Please check your Firebase configuration.');
    }

    const userDocRef = doc(db, COLLECTION_NAME, userId);
    
    // Prepare data for Firestore (ensure all fields are serializable and no undefined values)
    // Firestore doesn't allow undefined values, so we need to either omit them or use null
    const firestoreData: any = {
      holdings: holdings.map(holding => {
        const holdingData: any = {
          id: holding.id,
          symbol: holding.symbol,
          isSME: holding.isSME || false,
          exchange: holding.exchange || '',
          currentPrice: typeof holding.currentPrice === 'number' ? holding.currentPrice : 0,
          manualPrice: holding.manualPrice || false,
          lastFetched: holding.lastFetched || '',
          lastFetchedDate: holding.lastFetchedDate || '',
          status: holding.status || 'active',
          purchases: (holding.purchases || []).map(purchase => ({
            id: purchase.id,
            purchaseDate: purchase.purchaseDate,
            purchasePrice: typeof purchase.purchasePrice === 'number' ? purchase.purchasePrice : 0,
            quantity: typeof purchase.quantity === 'number' ? purchase.quantity : 0
          })),
          transactions: (holding.transactions || []).map(transaction => ({
            id: transaction.id,
            date: transaction.date,
            type: transaction.type,
            price: typeof transaction.price === 'number' ? transaction.price : 0,
            quantity: typeof transaction.quantity === 'number' ? transaction.quantity : 0
          }))
        };

        // Only include optional fields if they have valid values (not undefined)
        if (typeof holding.previousClose === 'number' && holding.previousClose > 0) {
          holdingData.previousClose = holding.previousClose;
        }
        if (typeof holding.openingPrice === 'number' && holding.openingPrice > 0) {
          holdingData.openingPrice = holding.openingPrice;
        }
        if (holding.soldDate && holding.soldDate.trim() !== '') {
          holdingData.soldDate = holding.soldDate;
        }
        if (typeof holding.realizedGainLoss === 'number') {
          holdingData.realizedGainLoss = holding.realizedGainLoss;
        }

        return holdingData;
      }),
      updatedAt: new Date().toISOString()
    };

    logFirestoreOperation('save stock holdings', { userId, holdingsCount: holdings.length });
    await setDoc(userDocRef, firestoreData, { merge: false });
    logger.info('Stock holdings saved successfully');
  } catch (error) {
    logFirestoreError('save stock holdings', error);
    
    const firebaseError = error as { code?: string; message?: string };
    logger.error('Error details:', {
      code: firebaseError?.code,
      message: firebaseError?.message,
      userId,
      holdingsCount: holdings.length
    });

    // Provide more specific error messages
    if (firebaseError?.code === 'permission-denied') {
      throw new Error(ERROR_MESSAGES.FIRESTORE_PERMISSION_DENIED);
    } else if (firebaseError?.code === 'unavailable') {
      throw new Error(ERROR_MESSAGES.FIRESTORE_UNAVAILABLE);
    } else if (firebaseError?.code === 'unauthenticated') {
      throw new Error(ERROR_MESSAGES.FIRESTORE_UNAUTHENTICATED);
    } else if (firebaseError?.message) {
      throw new Error(`Failed to save stock holdings: ${firebaseError.message}`);
    } else {
      throw new Error('Failed to save stock holdings');
    }
  }
}

/**
 * Load stock holdings for a user
 */
export async function loadStockHoldings(
  userId: string
): Promise<StockHolding[]> {
  try {
    if (!userId) {
      throw new Error('User ID is required to load stock holdings');
    }

    if (!db) {
      throw new Error('Firestore is not initialized. Please check your Firebase configuration.');
    }

    logFirestoreOperation('load stock holdings', { userId });
    const userDocRef = doc(db, COLLECTION_NAME, userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      logger.info('No stock holdings found for user, returning empty array');
      return [];
    }
    
    const data = userDoc.data();
    const holdings = (data.holdings || []) as StockHolding[];
    logger.info('Stock holdings loaded successfully', { count: holdings.length });
    return holdings;
  } catch (error) {
    logFirestoreError('load stock holdings', error);
    
    const firebaseError = error as { code?: string; message?: string };
    
    // Provide more specific error messages
    if (firebaseError?.code === 'permission-denied') {
      throw new Error(ERROR_MESSAGES.FIRESTORE_PERMISSION_DENIED);
    } else if (firebaseError?.code === 'unavailable') {
      throw new Error(ERROR_MESSAGES.FIRESTORE_UNAVAILABLE);
    } else if (firebaseError?.code === 'unauthenticated') {
      throw new Error(ERROR_MESSAGES.FIRESTORE_UNAUTHENTICATED);
    } else if (firebaseError?.message) {
      throw new Error(`Failed to load stock holdings: ${firebaseError.message}`);
    } else {
      throw new Error('Failed to load stock holdings');
    }
  }
}

/**
 * Subscribe to real-time updates of stock holdings for a user
 */
export function subscribeToStockHoldings(
  userId: string,
  callback: (holdings: StockHolding[]) => void
): () => void {
  try {
    if (!userId) {
      logger.warn('User ID is required to subscribe to stock holdings');
      return () => {};
    }

    if (!db) {
      logger.error('Firestore is not initialized');
      return () => {};
    }

    logFirestoreOperation('subscribe to stock holdings', { userId });
    const userDocRef = doc(db, COLLECTION_NAME, userId);
    
    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          logger.info('No stock holdings document found');
          callback([]);
          return;
        }
        
        const data = snapshot.data();
        const holdings = (data.holdings || []) as StockHolding[];
        logger.info('Stock holdings updated from Firestore', { count: holdings.length });
        callback(holdings);
      },
      (error) => {
        logFirestoreError('subscribe to stock holdings', error);
        logger.error('Error in stock holdings subscription:', error);
      }
    );

    return unsubscribe;
  } catch (error) {
    logFirestoreError('subscribe to stock holdings', error);
    return () => {};
  }
}

