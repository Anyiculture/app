import { useState, useEffect, useCallback, useRef } from 'react';

interface PersistenceOptions<T> {
  key: string;
  initialData: T;
  debounceMs?: number;
  onRestore?: (data: T) => void;
  enableBeforeUnload?: boolean;
}

/**
 * A hook for persisting form data to localStorage with debounced saving.
 * Includes a beforeunload listener to prevent accidental data loss.
 */
export function useFormPersistence<T>({
  key,
  initialData,
  debounceMs = 1000,
  onRestore,
  enableBeforeUnload = true
}: PersistenceOptions<T>) {
  const [data, setData] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...initialData, ...parsed };
      } catch (e) {
        console.error(`Error parsing persisted data for ${key}:`, e);
      }
    }
    return initialData;
  });

  const [isDirty, setIsDirty] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save to localStorage
  const saveToLocalStorage = useCallback((newData: T) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(newData));
      setIsDirty(false);
      saveTimeoutRef.current = null;
    }, debounceMs);
  }, [key, debounceMs]);

  // Update data and mark as dirty
  const setPersistedData = useCallback((newData: T | ((prev: T) => T)) => {
    setData((prev) => {
      const updated = typeof newData === 'function' ? (newData as Function)(prev) : newData;
      setIsDirty(true);
      saveToLocalStorage(updated);
      return updated;
    });
  }, [saveToLocalStorage]);

  // Handle beforeunload
  useEffect(() => {
    if (!enableBeforeUnload || !isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // standard message for most browsers
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enableBeforeUnload, isDirty]);

  // Manual clear
  const clearPersistence = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    localStorage.removeItem(key);
    setIsDirty(false);
  }, [key]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    setData: setPersistedData,
    isDirty,
    clearPersistence
  };
}
