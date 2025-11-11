// Firestore service for Mutual Fund portfolio data
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { MutualFundHolding } from '../types/mutualFund';

const COLLECTION_NAME = 'mutualFunds';

/**
 * Save mutual fund holdings for a user
 */
export async function saveMutualFundHoldings(
  userId: string, 
  holdings: MutualFundHolding[]
): Promise<void> {
  try {
    if (!userId) {
      throw new Error('User ID is required to save portfolio');
    }

    const userDocRef = doc(db, COLLECTION_NAME, userId);
    
    // Prepare data for Firestore (ensure all fields are serializable)
    const firestoreData = {
      holdings: holdings.map(holding => ({
        id: holding.id,
        schemeCode: holding.schemeCode,
        schemeName: holding.schemeName,
        category: holding.category || 'flexi-cap',
        currentNAV: typeof holding.currentNAV === 'number' ? holding.currentNAV : 0,
        purchases: (holding.purchases || []).map(purchase => ({
          id: purchase.id,
          purchaseDate: purchase.purchaseDate, // Already a string
          purchasePrice: typeof purchase.purchasePrice === 'number' ? purchase.purchasePrice : 0,
          quantity: typeof purchase.quantity === 'number' ? purchase.quantity : 0,
          investmentAmount: typeof purchase.investmentAmount === 'number' ? purchase.investmentAmount : 0
        }))
      })),
      updatedAt: new Date().toISOString()
    };

    console.log('Saving portfolio to Firestore:', { userId, holdingsCount: holdings.length });
    await setDoc(userDocRef, firestoreData, { merge: false });
    console.log('Portfolio saved successfully');
  } catch (error: any) {
    console.error('Error saving mutual fund holdings:', error);
    console.error('Error details:', {
      code: error?.code,
      message: error?.message,
      userId,
      holdingsCount: holdings.length
    });

    // Provide more specific error messages
    if (error?.code === 'permission-denied') {
      throw new Error('Permission denied. Please check Firestore security rules. Make sure the mutualFunds collection allows writes for authenticated users.');
    } else if (error?.code === 'unavailable') {
      throw new Error('Firestore is unavailable. Please check your internet connection.');
    } else if (error?.code === 'unauthenticated') {
      throw new Error('You must be logged in to save your portfolio.');
    } else if (error?.message) {
      throw new Error(`Failed to save portfolio: ${error.message}`);
    } else {
      throw new Error('Failed to save mutual fund portfolio. Please check the browser console for details.');
    }
  }
}

/**
 * Load mutual fund holdings for a user
 */
export async function loadMutualFundHoldings(
  userId: string
): Promise<MutualFundHolding[]> {
  try {
    const userDocRef = doc(db, COLLECTION_NAME, userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return [];
    }
    
    const data = userDoc.data();
    return (data.holdings || []) as MutualFundHolding[];
  } catch (error) {
    console.error('Error loading mutual fund holdings:', error);
    throw new Error('Failed to load mutual fund portfolio');
  }
}

/**
 * Subscribe to real-time updates of mutual fund holdings for a user
 */
export function subscribeToMutualFundHoldings(
  userId: string,
  callback: (holdings: MutualFundHolding[]) => void
): () => void {
  const userDocRef = doc(db, COLLECTION_NAME, userId);
  
  const unsubscribe = onSnapshot(
    userDocRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const holdings = (data.holdings || []) as MutualFundHolding[];
        callback(holdings);
      } else {
        callback([]);
      }
    },
    (error) => {
      console.error('Error subscribing to mutual fund holdings:', error);
      callback([]);
    }
  );
  
  return unsubscribe;
}

/**
 * Delete all mutual fund holdings for a user
 */
export async function deleteMutualFundHoldings(userId: string): Promise<void> {
  try {
    const userDocRef = doc(db, COLLECTION_NAME, userId);
    await deleteDoc(userDocRef);
  } catch (error) {
    console.error('Error deleting mutual fund holdings:', error);
    throw new Error('Failed to delete mutual fund portfolio');
  }
}

