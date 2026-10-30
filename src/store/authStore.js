import { create } from 'zustand';
import { isExpired, login as apiLogin } from '../api/auth.js';
import { fetchProfile, toBasicProfile } from '../api/profile.js';
import { useProfileStore } from './profileStore.js';
import { toApiError } from '../api/errors.js';
import { clearSessionData, KEYS, session as store } from '../utils/storage.js';

function initialState() {
  let sess = store.get(KEYS.session, null);
  let notice = null;
  if (sess && isExpired(sess)) {
    clearSessionData();
    sess = null;
    notice = 'expired';
  }
  return {
    session: sess,
    profile: sess ? store.get(KEYS.profile, null) : null,
    notice,
  };
}

export const useAuthStore = create((set, get) => ({
  ...initialState(),
  loggingIn: false,
  error: null,

  /** Logs in. The password is only passed through to the API call, never stored. */
  login: async (username, password) => {
    set({ loggingIn: true, error: null, notice: null });
    try {
      const sess = await apiLogin(username, password);
      store.set(KEYS.session, sess);
      set({ session: sess, loggingIn: false });
      return true;
    } catch (err) {
      set({ error: toApiError(err), loggingIn: false });
      return false;
    }
  },

  /**
   * Fetches the profile. Name + roll number go to sessionStorage (for the header);
   * the full details (mobile, address, Aadhaar) stay in the memory-only profile store.
   * Called on login and on every app load, so the details are never persisted.
   */
  loadProfile: async () => {
    const sess = get().session;
    const profileStore = useProfileStore.getState();
    if (!sess || profileStore.status === 'loading') return;
    profileStore.setLoading();
    try {
      const { details, view } = await fetchProfile(sess);
      if (get().session !== sess) return; // logged out meanwhile
      const basic = toBasicProfile(details);
      store.set(KEYS.profile, basic);
      set({ profile: basic });
      useProfileStore.getState().setDetails(details, view);
    } catch (err) {
      const e = toApiError(err);
      useProfileStore.getState().setError(e);
      if (e.code === 'unauthorized') get().logout('expired');
    }
  },

  /** reason: 'expired' | 'logout' | null */
  logout: (reason = 'logout') => {
    clearSessionData();
    useProfileStore.getState().clear();
    set({ session: null, profile: null, notice: reason, error: null, loggingIn: false });
  },

  clearError: () => set({ error: null }),
  clearNotice: () => set({ notice: null }),

  /** Called periodically: ends the session once `.expires` has passed. */
  checkExpiry: () => {
    const sess = get().session;
    if (sess && isExpired(sess)) get().logout('expired');
  },
}));
