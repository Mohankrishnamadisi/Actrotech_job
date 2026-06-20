import { create } from 'zustand';
import { subscriptionService, paymentService } from '@services/api';
import type { User } from '../types';

interface AuthStore {
  user: User | null;
  loading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,
  error: null,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  logout: () => set({ user: null, error: null }),
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
