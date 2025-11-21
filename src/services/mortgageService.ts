// Firestore service for Mortgage data
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { SavedMortgage } from '../types/mortgage';
import { logger, logFirestoreOperation, logFirestoreError } from '../utils/logger';
import { ERROR_MESSAGES } from '../utils/constants';

const COLLECTION_NAME = 'mortgages';

/**
 * Save mortgages for a user
 */
export async function saveMortgages(
  userId: string,
  mortgages: SavedMortgage[]
): Promise<void> {
  try {
    if (!userId) {
      throw new Error('User ID is required to save mortgages');
    }

    if (!db) {
      throw new Error('Firestore is not initialized. Please check your Firebase configuration.');
    }

    const userDocRef = doc(db, COLLECTION_NAME, userId);

    // Prepare data for Firestore (ensure all fields are serializable)
    const firestoreData = {
      mortgages: mortgages.map(mortgage => ({
        id: mortgage.id,
        name: mortgage.name,
        homeValue: typeof mortgage.homeValue === 'number' ? mortgage.homeValue : 0,
        downPayment: typeof mortgage.downPayment === 'number' ? mortgage.downPayment : 0,
        interestRate: typeof mortgage.interestRate === 'number' ? mortgage.interestRate : 0,
        tenure: typeof mortgage.tenure === 'number' ? mortgage.tenure : 0,
        startDate: mortgage.startDate,
        paymentType: mortgage.paymentType,
        extraPaymentEnabled: mortgage.extraPaymentEnabled || false,
        extraPaymentAmount: typeof mortgage.extraPaymentAmount === 'number' ? mortgage.extraPaymentAmount : 0,
        extraPaymentStartDate: mortgage.extraPaymentStartDate || '',
        extraPaymentFrequency: mortgage.extraPaymentFrequency || 'monthly',
        oneTimePayments: (mortgage.oneTimePayments || []).map(payment => ({
          id: payment.id,
          date: payment.date,
          amount: typeof payment.amount === 'number' ? payment.amount : 0
        })),
        currency: mortgage.currency || 'USD',
        createdAt: mortgage.createdAt,
        updatedAt: new Date().toISOString(),

        // Investment Property Fields
        propertyType: mortgage.propertyType || 'primary',
        monthlyRent: typeof mortgage.monthlyRent === 'number' ? mortgage.monthlyRent : 0,
        vacancyRate: typeof mortgage.vacancyRate === 'number' ? mortgage.vacancyRate : 0,
        propertyManagementPercent: typeof mortgage.propertyManagementPercent === 'number' ? mortgage.propertyManagementPercent : 0,
        maintenance: typeof mortgage.maintenance === 'number' ? mortgage.maintenance : 0,
        utilities: typeof mortgage.utilities === 'number' ? mortgage.utilities : 0,
        propertyAppreciationRate: typeof mortgage.propertyAppreciationRate === 'number' ? mortgage.propertyAppreciationRate : 0,

        // Additional Costs
        propertyTax: typeof mortgage.propertyTax === 'number' ? mortgage.propertyTax : 0,
        propertyTaxPeriod: mortgage.propertyTaxPeriod || 'year',
        homeInsurance: typeof mortgage.homeInsurance === 'number' ? mortgage.homeInsurance : 0,
        homeInsurancePeriod: mortgage.homeInsurancePeriod || 'year',
        hoaFees: typeof mortgage.hoaFees === 'number' ? mortgage.hoaFees : 0
      })),
      updatedAt: new Date().toISOString()
    };

    logFirestoreOperation('save mortgages', { userId, mortgagesCount: mortgages.length });
    await setDoc(userDocRef, firestoreData, { merge: false });
    logger.info('Mortgages saved successfully');
  } catch (error) {
    logFirestoreError('save mortgages', error);

    const firebaseError = error as { code?: string; message?: string };
    logger.error('Error details:', {
      code: firebaseError?.code,
      message: firebaseError?.message,
      userId,
      mortgagesCount: mortgages.length
    });

    // Provide more specific error messages
    if (firebaseError?.code === 'permission-denied') {
      throw new Error(ERROR_MESSAGES.FIRESTORE_PERMISSION_DENIED);
    } else if (firebaseError?.code === 'unavailable') {
      throw new Error(ERROR_MESSAGES.FIRESTORE_UNAVAILABLE);
    } else if (firebaseError?.code === 'unauthenticated') {
      throw new Error(ERROR_MESSAGES.FIRESTORE_UNAUTHENTICATED);
    } else if (firebaseError?.message) {
      throw new Error(`Failed to save mortgages: ${firebaseError.message}`);
    } else {
      throw new Error(ERROR_MESSAGES.SAVE_MORTGAGE_FAILED);
    }
  }
}

/**
 * Load mortgages for a user
 */
export async function loadMortgages(
  userId: string
): Promise<SavedMortgage[]> {
  try {
    if (!userId) {
      throw new Error('User ID is required to load mortgages');
    }

    if (!db) {
      throw new Error('Firestore is not initialized. Please check your Firebase configuration.');
    }

    logFirestoreOperation('load mortgages', { userId });
    const userDocRef = doc(db, COLLECTION_NAME, userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      logger.info('No mortgages found for user, returning empty array');
      return [];
    }

    const data = userDoc.data();
    const mortgages = (data.mortgages || []) as SavedMortgage[];
    logger.info('Mortgages loaded successfully', { count: mortgages.length });
    return mortgages;
  } catch (error) {
    logFirestoreError('load mortgages', error);

    const firebaseError = error as { code?: string; message?: string };

    // Provide more specific error messages
    if (firebaseError?.code === 'permission-denied') {
      throw new Error(ERROR_MESSAGES.FIRESTORE_PERMISSION_DENIED);
    } else if (firebaseError?.code === 'unavailable') {
      throw new Error(ERROR_MESSAGES.FIRESTORE_UNAVAILABLE);
    } else if (firebaseError?.code === 'unauthenticated') {
      throw new Error(ERROR_MESSAGES.FIRESTORE_UNAUTHENTICATED);
    } else if (firebaseError?.message) {
      throw new Error(`Failed to load mortgages: ${firebaseError.message}`);
    } else {
      throw new Error(ERROR_MESSAGES.LOAD_MORTGAGE_FAILED);
    }
  }
}

/**
 * Subscribe to real-time updates of mortgages for a user
 */
export function subscribeToMortgages(
  userId: string,
  callback: (mortgages: SavedMortgage[]) => void
): () => void {
  const userDocRef = doc(db, COLLECTION_NAME, userId);

  const unsubscribe = onSnapshot(
    userDocRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const mortgages = (data.mortgages || []) as SavedMortgage[];
        callback(mortgages);
      } else {
        callback([]);
      }
    },
    (error) => {
      logFirestoreError('subscribe to mortgages', error);
      callback([]);
    }
  );

  return unsubscribe;
}

/**
 * Delete all mortgages for a user
 */
export async function deleteMortgages(userId: string): Promise<void> {
  try {
    const userDocRef = doc(db, COLLECTION_NAME, userId);
    await deleteDoc(userDocRef);
  } catch (error) {
    logFirestoreError('delete mortgages', error);
    throw new Error(ERROR_MESSAGES.DELETE_MORTGAGE_FAILED);
  }
}

