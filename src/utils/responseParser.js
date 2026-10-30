// Safe helpers for reading ERP responses. Nothing here mutates the source object.

/** Accepts an object or a JSON string; returns a plain object, or {} for anything invalid. */
export function parseJsonObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

// Placeholder values the ERP uses for "nothing here".
const PLACEHOLDERS = new Set(['', 'null', 'undefined', 'na', 'n/a', 'nil', 'none', '-', '--', '---', 'select', '0001-01-01t00:00:00', '1900-01-01t00:00:00']);

/** True for null / undefined / empty or placeholder strings / empty arrays and objects. */
export function isBlank(v) {
  if (v == null) return true;
  if (typeof v === 'string') return PLACEHOLDERS.has(v.trim().toLowerCase());
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.keys(v).length === 0;
  if (typeof v === 'number') return !Number.isFinite(v);
  return false;
}

/**
 * Fallback strategy (documented in docs/API_INTEGRATION.md):
 * the root-level field is authoritative; userDetails (a JSON string) only fills gaps.
 * Each key in `keys` is tried in order, first on the root, then in userDetails.
 */
export function readField(root, details, keys) {
  const list = Array.isArray(keys) ? keys : [keys];
  for (const k of list) if (!isBlank(root?.[k])) return root[k];
  for (const k of list) if (!isBlank(details?.[k])) return details[k];
  return null;
}
