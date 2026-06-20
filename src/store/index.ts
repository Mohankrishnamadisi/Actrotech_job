import { create } from 'zustand';
import { subscriptionService, paymentService } from '@services/api';
import type { User } from '../types';
import { STORAGE_KEYS } from '@constants/index';

interface AuthStore {
  user: User | null;
  loading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

const loadInitialUser = (): User | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch (err) {
    return null;
  }
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: loadInitialUser(),
  loading: false,
  error: null,
  setUser: (user) => {
    try {
      if (user) localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (err) {
      console.error('Failed to persist user to localStorage', err);
    }
    set({ user });
  },
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  logout: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (err) {
      console.error('Failed to remove user from localStorage', err);
    }
    set({ user: null, error: null });
  },
}));

interface JobStore {
  jobs: unknown[];
  loading: boolean;
  error: string | null;
  setJobs: (jobs: unknown[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useJobStore = create<JobStore>((set) => ({
  jobs: [],
  loading: false,
  error: null,
  setJobs: (jobs) => set({ jobs }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

interface SubscriptionStore {
  subscription: unknown | null;
  loading: boolean;
  error: string | null;
  setSubscription: (subscription: unknown | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  subscription: null,
  loading: false,
  error: null,
  setSubscription: (subscription) => set({ subscription }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
