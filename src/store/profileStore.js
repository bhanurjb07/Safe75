import { create } from 'zustand';

/**
 * The full mapped profile, including mobile, address and Aadhaar.
 * Memory only: never written to sessionStorage / localStorage, never shown in the debug
 * panel, and re-fetched on every login or page load. Cleared on logout.
 */
export const useProfileStore = create((set) => ({
  details: null,
  status: 'idle', // idle | loading | ready | error
  error: null,
  setLoading: () => set({ status: 'loading', error: null }),
  setDetails: (details) => set({ details, status: 'ready', error: null }),
  // Only the error's friendly message and code are kept, never response values.
  setError: (err) => set({ status: 'error', error: { code: err?.code, message: err?.message } }),
  clear: () => set({ details: null, status: 'idle', error: null }),
}));
