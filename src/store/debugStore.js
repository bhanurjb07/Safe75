import { create } from 'zustand';
import { session, KEYS } from '../utils/storage.js';

// The debug panel is enabled by visiting any page with ?debug=1 (and off with ?debug=0).
const readFlag = () => {
  if (typeof window === 'undefined') return false;
  const q = new URLSearchParams(window.location.search).get('debug');
  if (q === '1') session.set(KEYS.debug, true);
  if (q === '0') session.remove(KEYS.debug);
  return Boolean(session.get(KEYS.debug, false));
};

export const useDebugStore = create((set) => ({
  enabled: readFlag(),
  requests: [],
  log: (entry) =>
    set((s) => (s.enabled ? { requests: [{ id: crypto.randomUUID?.() ?? String(Date.now()), ...entry }, ...s.requests].slice(0, 30) } : s)),
  clear: () => set({ requests: [] }),
}));

/** Describes a response's shape (keys and array sizes) without any values. */
export function describeShape(value, depth = 0) {
  if (Array.isArray(value)) return `array(${value.length})`;
  if (value && typeof value === 'object') {
    if (depth >= 1) return `object{${Object.keys(value).length} keys}`;
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, describeShape(v, depth + 1)]));
  }
  return value === null ? 'null' : typeof value;
}
