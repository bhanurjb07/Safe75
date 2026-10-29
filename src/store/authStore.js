import { create } from 'zustand';
import { isExpired, login as apiLogin } from '../api/auth.js';
import { fetchProfile } from '../api/profile.js';
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
      get().loadProfile();
      return true;
    } catch (err) {
      set({ error: toApiError(err), loggingIn: false });
      return false;
    }
  },

  /** Name and roll number only. Optional: the app works without it. */
  loadProfile: async () => {
    const sess = get().session;
    if (!sess) return;
    try {
      const profile = await fetchProfile(sess);
      store.set(KEYS.profile, profile);
      set({ profile });
    } catch (err) {
      if (toApiError(err).code === 'unauthorized') get().logout('expired');
    }
  },

  /** reason: 'expired' | 'logout' | null */
  logout: (reason = 'logout') => {
    clearSessionData();
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
