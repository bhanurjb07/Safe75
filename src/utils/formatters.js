// Turn raw ERP values into display strings. Every formatter returns null when there is
// nothing meaningful to show, so the UI can hide the field instead of printing "null".
import { isBlank } from './responseParser.js';

const toNumber = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const n = Number(v.replace(/[,\s₹%]/g, ''));
  return v.trim() && Number.isFinite(n) ? n : null;
};

const text = (v) => {
  if (isBlank(v)) return null;
  if (typeof v === 'object') return null; // nested objects are rendered elsewhere, never stringified
  return String(v).replace(/\s+/g, ' ').trim() || null;
};

const titleCase = (v) => {
  const t = text(v);
  if (!t) return null;
  // Only re-case ALL-CAPS or all-lowercase strings; leave mixed case as the ERP wrote it.
  return t === t.toUpperCase() || t === t.toLowerCase() ? t.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase()) : t;
};

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Accepts "YYYY-MM-DD…", "DD-MM-YYYY", "DD/MM/YYYY" or a timestamp. */
export function formatDate(v) {
  if (isBlank(v)) return null;
  const s = String(v).trim();
  let d = null;
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) d = new Date(+m[1], +m[2] - 1, +m[3]);
  else if ((m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(s))) d = new Date(+m[3], +m[2] - 1, +m[1]);
  else if (/^\d{10,13}$/.test(s)) d = new Date(Number(s.length === 10 ? s + '000' : s));
  if (!d || Number.isNaN(d.getTime()) || d.getFullYear() < 1901) return null;
  return dateFmt.format(d);
}

/** Yes / No for booleans the ERP sends as true, "true", 1, "Y", "Yes"… */
export function formatBool(v) {
  if (v === true || v === 1) return 'Yes';
  if (v === false || v === 0) return 'No';
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase();
  if (['true', 'yes', 'y', '1'].includes(s)) return 'Yes';
  if (['false', 'no', 'n', '0'].includes(s)) return 'No';
  return null;
}

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

/**
 * type: text | name | date | bool | email | phone | money | score | percent | aadhaar
 * "score", "percent" and "money" treat 0 as "not provided" (the ERP's default for empty marks).
 */
export function formatValue(type, v) {
  switch (type) {
    case 'name':
      return titleCase(v);
    case 'date':
      return formatDate(v);
    case 'bool':
      return formatBool(v);
    case 'email':
      return text(v)?.toLowerCase() ?? null;
    case 'phone': {
      const t = text(v);
      return t && /\d{6,}/.test(t.replace(/\D/g, '')) ? t : null;
    }
    case 'money': {
      const n = toNumber(v);
      return n ? inr.format(n) : null;
    }
    case 'score': {
      const n = toNumber(v);
      return n ? String(Math.round(n * 100) / 100) : null;
    }
    case 'percent': {
      const n = toNumber(v);
      return n ? `${Math.round(n * 100) / 100}%` : null;
    }
    case 'aadhaar': {
      const d = String(v ?? '').replace(/\D/g, '');
      return d.length === 12 ? d : null;
    }
    default:
      return text(v);
  }
}

/** "fatherOfficeAdd" → "Father office add" (only for generic list items with unknown keys). */
export const humanizeKey = (k) =>
  String(k)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
