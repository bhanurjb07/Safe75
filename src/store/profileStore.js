import { create } from 'zustand';

/**
 * The full mapped profile, including mobile, address and Aadhaar.
 * Memory only: never written to sessionStorage / localStorage, never shown in the debug
 * panel, and re-fetched on every login or page load. Cleared on logout.
 */
export const useProfileStore = create((set) => ({
  details: null, // { firstName…, mobile, address, aadhaar }
  view: null, // { sections, twelfthSubjects, lists, completion } for the Profile page tabs
  status: 'idle', // idle | loading | ready | error
  error: null,
  setLoading: () => set({ status: 'loading', error: null }),
  setDetails: (details, view = null) => set({ details, view, status: 'ready', error: null }),
  // Only the error's friendly message and code are kept, never response values.
  setError: (err) => set({ status: 'error', error: { code: err?.code, message: err?.message } }),
  clear: () => set({ details: null, view: null, status: 'idle', error: null }),
}));
