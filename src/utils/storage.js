// Storage wrappers that never throw (private mode, blocked storage, SSR).

const make = (getStore) => ({
  get(key, fallback = null) {
    try {
      const raw = getStore()?.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      getStore()?.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or blocked: the app still works in memory */
    }
  },
  remove(key) {
    try {
      getStore()?.removeItem(key);
    } catch {
      /* ignore */
    }
  },
});

export const session = make(() => (typeof window !== 'undefined' ? window.sessionStorage : null));
export const local = make(() => (typeof window !== 'undefined' ? window.localStorage : null));

export const KEYS = {
  session: 'safe75.session',
  profile: 'safe75.profile',
  cache: 'safe75.cache',
  confetti: 'safe75.confetti',
  debug: 'safe75.debug',
  pastSemesters: 'safe75.pastSemesters',
  theme: 'safe75.theme', // localStorage: a preference, not personal data
};

/** Removes everything Safe75 keeps in sessionStorage. */
export function clearSessionData() {
  [KEYS.session, KEYS.profile, KEYS.cache, KEYS.confetti, KEYS.pastSemesters].forEach((k) => session.remove(k));
}
