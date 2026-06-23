import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@store/index';
import { subscriptionService } from '@services/api';
import { USER_ROLES } from '@constants/index';

export const useAuth = () => {
  const { user, setUser, setLoading, setError } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize auth on mount
    setIsInitialized(true);
  }, []);

  return {
    user,
    setUser,
    setLoading,
    setError,
    isInitialized,
  };
};

export const useDebounce = (value: string, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

export const useAsync = (asyncFunction: () => Promise<unknown>, immediate = true) => {
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    setResponse(null);
    setError(null);
    try {
      const response = await asyncFunction();
      setStatus('success');
      setResponse(response as any);
      return response;
    } catch (error) {
      setStatus('error');
      setError(error instanceof Error ? error.message : 'An error occurred');
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, response, error };
};

export const useSubscription = (userId: string | null) => {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Only job seekers should have subscription records. Avoid fetching for other roles.
  const { user } = useAuthStore();

  useEffect(() => {
    if (!userId) return;
    if (!user || user.role !== USER_ROLES.JOB_SEEKER) return; // skip for recruiters/admins

    const fetchSubscription = async () => {
      setLoading(true);
      try {
        const data = await subscriptionService.getUserSubscription(userId);
        setSubscription(data);
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [userId, user]);

  return { subscription, loading };
};

export const useLocalStorage = (key: string, initialValue: unknown) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: unknown) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error('Error writing to localStorage:', error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
};

export { useThemeMode } from '../context/ThemeContext';
export { useMobileDetect } from './useMobileDetect';
export { useNotificationAlerts } from './useNotificationAlerts';
export { useTalentPool } from './useTalentPool';
