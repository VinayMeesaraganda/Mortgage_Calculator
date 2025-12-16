// Firestore service for Fixed Deposit data
import {
    doc,
    getDoc,
    setDoc,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { FixedDeposit } from '../types/fd';
import { logger, logFirestoreOperation, logFirestoreError } from '../utils/logger';

const COLLECTION_NAME = 'fixed_deposits';

/**
 * Save FDs for a user
 */
export async function saveFDs(
    userId: string,
    fds: FixedDeposit[]
): Promise<void> {
    try {
        if (!userId) {
            throw new Error('User ID is required to save investments');
        }

        if (!db) {
            throw new Error('Firestore is not initialized');
        }

        const userDocRef = doc(db, COLLECTION_NAME, userId);

        // Ensure data is serializable
        const firestoreData = {
            investments: fds.map(fd => ({
                ...fd,
                updatedAt: new Date().toISOString()
            })),
            updatedAt: new Date().toISOString()
        };

        logFirestoreOperation('save FDs', { userId, count: fds.length });
        await setDoc(userDocRef, firestoreData, { merge: false });
        logger.info('Investments saved successfully');
    } catch (error) {
        logFirestoreError('save FDs', error);
        throw error;
    }
}

/**
 * Load FDs for a user
 */
export async function loadFDs(userId: string): Promise<FixedDeposit[]> {
    try {
        if (!userId) throw new Error('User ID required');
        if (!db) throw new Error('Firestore not initialized');

        logFirestoreOperation('load FDs', { userId });
        const userDocRef = doc(db, COLLECTION_NAME, userId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            return [];
        }

        const data = userDoc.data();
        return (data.investments || []) as FixedDeposit[];
    } catch (error) {
        logFirestoreError('load FDs', error);
        throw error;
    }
}

/**
 * Subscribe to real-time updates
 */
export function subscribeToFDs(
    userId: string,
    callback: (fds: FixedDeposit[]) => void
): () => void {
    const userDocRef = doc(db, COLLECTION_NAME, userId);

    return onSnapshot(
        userDocRef,
        (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                callback((data.investments || []) as FixedDeposit[]);
            } else {
                callback([]);
            }
        },
        (error) => {
            logFirestoreError('subscribe to FDs', error);
            callback([]);
        }
    );
}
