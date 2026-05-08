import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToMortgages } from '../services/mortgageService';
import type { SavedMortgage } from '../types/mortgage';

export function useSavedMortgages() {
  const { currentUser } = useAuth();
  const [mortgages, setMortgages] = useState<SavedMortgage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const prevRef = useRef<string>('');

  useEffect(() => {
    if (!currentUser) {
      try {
        const raw = localStorage.getItem('mortgage_calculator_local_saves');
        setMortgages(raw ? JSON.parse(raw) : []);
      } catch {
        setMortgages([]);
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsub = subscribeToMortgages(currentUser.uid, (updated) => {
      const next = JSON.stringify(updated);
      if (next !== prevRef.current) {
        prevRef.current = next;
        setMortgages(updated);
      }
      setIsLoading(false);
    });

    return unsub;
  }, [currentUser]);

  return { mortgages, isLoading };
}
