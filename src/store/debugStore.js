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

// Personal / contact fields are never described, not even by key, anywhere in the debug panel.
const SENSITIVE_KEY = /phone|mobile|address|aadh?a+r|userdetails|email|father|mother|guardian|dob|birth/i;

/** Describes a response's shape (keys and array sizes) without any values. */
export function describeShape(value, depth = 0) {
  if (Array.isArray(value)) return `array(${value.length})`;
  if (value && typeof value === 'object') {
    if (depth >= 1) return `object{${Object.keys(value).length} keys}`;
    const safe = Object.entries(value).filter(([k]) => !SENSITIVE_KEY.test(k));
    const hidden = Object.keys(value).length - safe.length;
    const out = Object.fromEntries(safe.map(([k, v]) => [k, describeShape(v, depth + 1)]));
    if (hidden) out['(hidden personal fields)'] = hidden;
    return out;
  }
  return value === null ? 'null' : typeof value;
}
