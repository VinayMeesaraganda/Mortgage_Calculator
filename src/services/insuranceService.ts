// Firestore service for Insurance data
import {
    doc,
    getDoc,
    setDoc,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Insurance, Claim, Renewal } from '../types/insurance';
import { logger, logFirestoreOperation, logFirestoreError } from '../utils/logger';

const COLLECTION_NAME = 'insurances';

/**
 * Save insurance policies for a user
 */
export async function saveInsurances(
    userId: string,
    insurances: Insurance[]
): Promise<void> {
    try {
        if (!userId) {
            throw new Error('User ID is required to save insurances');
        }

        if (!db) {
            throw new Error('Firestore is not initialized');
        }

        const userDocRef = doc(db, COLLECTION_NAME, userId);

        const firestoreData = {
            policies: insurances.map(insurance => ({
                ...insurance,
                updatedAt: new Date().toISOString()
            })),
            updatedAt: new Date().toISOString()
        };

        logFirestoreOperation('save insurances', { userId, count: insurances.length });
        await setDoc(userDocRef, firestoreData, { merge: false });
        logger.info('Insurances saved successfully');
    } catch (error) {
        logFirestoreError('save insurances', error);
        throw error;
    }
}

/**
 * Load insurance policies for a user
 */
export async function loadInsurances(userId: string): Promise<Insurance[]> {
    try {
        if (!userId) throw new Error('User ID required');
        if (!db) throw new Error('Firestore not initialized');

        logFirestoreOperation('load insurances', { userId });
        const userDocRef = doc(db, COLLECTION_NAME, userId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            return [];
        }

        const data = userDoc.data();
        return (data.policies || []) as Insurance[];
    } catch (error) {
        logFirestoreError('load insurances', error);
        throw error;
    }
}

/**
 * Subscribe to real-time insurance updates
 */
export function subscribeToInsurances(
    userId: string,
    callback: (insurances: Insurance[]) => void
): () => void {
    const userDocRef = doc(db, COLLECTION_NAME, userId);

    return onSnapshot(
        userDocRef,
        (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                callback((data.policies || []) as Insurance[]);
            } else {
                callback([]);
            }
        },
        (error) => {
            logFirestoreError('subscribe to insurances', error);
            callback([]);
        }
    );
}

/**
 * Save claims for a user
 */
export async function saveClaims(
    userId: string,
    claims: Claim[]
): Promise<void> {
    try {
        if (!userId) throw new Error('User ID required');
        if (!db) throw new Error('Firestore not initialized');

        const userDocRef = doc(db, `${COLLECTION_NAME}/${userId}/claims`, 'data');

        await setDoc(userDocRef, {
            claims: claims.map(claim => ({
                ...claim,
                updatedAt: new Date().toISOString()
            })),
            updatedAt: new Date().toISOString()
        });

        logger.info('Claims saved successfully');
    } catch (error) {
        logFirestoreError('save claims', error);
        throw error;
    }
}

/**
 * Load claims for a user
 */
export async function loadClaims(userId: string): Promise<Claim[]> {
    try {
        if (!userId) throw new Error('User ID required');
        if (!db) throw new Error('Firestore not initialized');

        const claimsDocRef = doc(db, `${COLLECTION_NAME}/${userId}/claims`, 'data');
        const claimsDoc = await getDoc(claimsDocRef);

        if (!claimsDoc.exists()) {
            return [];
        }

        const data = claimsDoc.data();
        return (data.claims || []) as Claim[];
    } catch (error) {
        logFirestoreError('load claims', error);
        throw error;
    }
}

/**
 * Save renewals for a user
 */
export async function saveRenewals(
    userId: string,
    renewals: Renewal[]
): Promise<void> {
    try {
        if (!userId) throw new Error('User ID required');
        if (!db) throw new Error('Firestore not initialized');

        const userDocRef = doc(db, `${COLLECTION_NAME}/${userId}/renewals`, 'data');

        await setDoc(userDocRef, {
            renewals: renewals.map(renewal => ({
                ...renewal,
                updatedAt: new Date().toISOString()
            })),
            updatedAt: new Date().toISOString()
        });

        logger.info('Renewals saved successfully');
    } catch (error) {
        logFirestoreError('save renewals', error);
        throw error;
    }
}

/**
 * Load renewals for a user
 */
export async function loadRenewals(userId: string): Promise<Renewal[]> {
    try {
        if (!userId) throw new Error('User ID required');
        if (!db) throw new Error('Firestore not initialized');

        const renewalsDocRef = doc(db, `${COLLECTION_NAME}/${userId}/renewals`, 'data');
        const renewalsDoc = await getDoc(renewalsDocRef);

        if (!renewalsDoc.exists()) {
            return [];
        }

        const data = renewalsDoc.data();
        return (data.renewals || []) as Renewal[];
    } catch (error) {
        logFirestoreError('load renewals', error);
        throw error;
    }
}
