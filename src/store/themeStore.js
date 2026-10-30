import { create } from 'zustand';
import { KEYS } from '../utils/storage.js';

const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

// The terminal theme is dark-only; the mode is kept so the store's API stays the same.
const resolve = () => 'dark';

function apply(mode) {
  const resolved = resolve(mode);
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#000000');
  return resolved;
}

// Stored as a plain string so the inline script in index.html can read it before first paint.
const initialMode = (() => {
  try {
    const raw = window.localStorage.getItem(KEYS.theme);
    if (raw === 'light' || raw === 'system') return raw;
  } catch {
    /* ignore */
  }
  return 'dark';
})();

export const useThemeStore = create((set, get) => ({
  /** dark | light | system — dark is the default */
  mode: initialMode,
  resolved: typeof document !== 'undefined' ? apply(initialMode) : 'dark',
  setMode: (mode) => {
    try {
      window.localStorage.setItem(KEYS.theme, mode);
    } catch {
      /* ignore */
    }
    set({ mode, resolved: apply(mode) });
  },
  syncSystem: () => {
    if (get().mode === 'system') set({ resolved: apply('system') });
  },
}));

media?.addEventListener?.('change', () => useThemeStore.getState().syncSystem());
