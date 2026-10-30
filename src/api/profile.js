import { ensureSession } from './auth.js';
import { authHeaders, proxyRequest } from './client.js';
import { ApiError } from './errors.js';
import { COMPLETION_CHECKS, PROFILE_LISTS, PROFILE_SECTIONS, TWELFTH_SUBJECTS } from './profileSchema.js';
import { formatValue, humanizeKey } from '../utils/formatters.js';
import { isBlank, parseJsonObject, readField } from '../utils/responseParser.js';

const clean = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');
const title = (v) => clean(v).toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase());
const orNull = (v) => clean(v) || null;

/** `userDetails` arrives as a JSON string. Parse it only for the fallback fields, never keep it. */
const parseUserDetails = parseJsonObject;

/** Digits only, or null when it doesn't look like a 12-digit Aadhaar number. */
const aadhaarDigits = (v) => {
  const d = String(v ?? '').replace(/\D/g, '');
  return d.length === 12 ? d : null;
};

/**
 * Endpoint C → the student's own profile. Fields are picked one by one; the raw response
 * (which holds far more personal data) is never spread, stored or logged.
 */
export function mapProfile(raw) {
  const src = Array.isArray(raw) ? raw[0] : raw;
  if (!src || typeof src !== 'object') throw new ApiError('shape', 'The ERP profile response was empty.');
  // Top-level fields first; userDetails only fills gaps.
  const needsDetails = !(src.phone || src.smsMobileNumber) || !(src.address || src.addressLine1) || !src.aadhaarNumber;
  const extra = needsDetails ? parseUserDetails(src.userDetails) : {};
  return {
    firstName: title(src.firstName),
    middleName: title(src.middleName),
    lastName: title(src.lastName),
    rollNumber: clean(src.rollNumber),
    admissionNumber: clean(src.admissionNumber),
    mobile: orNull(src.phone) || orNull(src.smsMobileNumber) || orNull(extra.phone) || orNull(extra.smsMobileNumber),
    address: orNull(src.address) || orNull(src.addressLine1) || orNull(extra.address) || orNull(extra.addressLine1),
    aadhaar: aadhaarDigits(src.aadhaarNumber) || aadhaarDigits(extra.aadhaarNumber),
  };
}

/** The non-sensitive part used by the header and greeting (name + roll number only). */
export function toBasicProfile(p) {
  const fullName = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');
  return {
    firstName: p.firstName || 'Student',
    fullName: fullName || 'Student',
    rollNumber: p.rollNumber || p.admissionNumber || '',
  };
}

// Keys never shown from generic list items (ids and anything personal beyond the student's own view).
const HIDDEN_ITEM_KEY = /(^id$|Id$|_id$|aadh?a+r|pan|bank|account|ifsc|password|token)/i;

function listItem(item) {
  if (isBlank(item)) return null;
  if (typeof item !== 'object') {
    const v = formatValue('text', item);
    return v ? [['', v]] : null;
  }
  const rows = Object.entries(item)
    .filter(([k, v]) => !HIDDEN_ITEM_KEY.test(k) && !isBlank(v) && typeof v !== 'object')
    .map(([k, v]) => [humanizeKey(k), formatValue(/date/i.test(k) ? 'date' : typeof v === 'boolean' ? 'bool' : 'text', v)])
    .filter(([, v]) => v)
    .slice(0, 8);
  return rows.length ? rows : null;
}

/**
 * The full Profile page view, built only from the fields listed in profileSchema.js.
 * Root-level values win; the userDetails JSON string only fills gaps. Blank / placeholder
 * values are dropped, so the page never shows "null". The raw response is not kept.
 */
export function buildProfileView(raw) {
  const root = (Array.isArray(raw) ? raw[0] : raw) ?? {};
  const details = parseJsonObject(root.userDetails);
  const read = (keys) => readField(root, details, keys);

  const sections = PROFILE_SECTIONS.map((s) => {
    const seen = new Set();
    const fields = s.fields
      .map((fd) => ({ label: fd.label, type: fd.type, sensitive: Boolean(fd.sensitive), copy: Boolean(fd.copy), value: formatValue(fd.type, read(fd.keys)) }))
      .filter((fd) => {
        if (!fd.value) return false;
        // Phone numbers and emails often repeat under several keys (phone == smsMobileNumber):
        // show each number / address once per card. Other fields may legitimately share a value.
        if (fd.type !== 'phone' && fd.type !== 'email') return true;
        const key = fd.value.replace(/\s+/g, '').toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    return { id: s.id, tab: s.tab, title: s.title, icon: s.icon, fields };
  }).filter((s) => s.fields.length);

  const twelfthSubjects = TWELFTH_SUBJECTS.map(([subject, maxK, scoredK, pctK]) => {
    const max = formatValue('score', read(maxK));
    const scored = formatValue('score', read(scoredK));
    let pct = formatValue('score', read(pctK));
    // Percentage only derived when both marks are present; never invented.
    if (!pct && max && scored) pct = String(Math.round((Number(scored) / Number(max)) * 10000) / 100);
    return max || scored || pct ? { subject, max, scored, percent: pct ? Number(pct) : null } : null;
  }).filter(Boolean);

  const lists = PROFILE_LISTS.map(({ id, key, title }) => {
    const value = read(key);
    const arr = Array.isArray(value) ? value : typeof value === 'string' ? Object.values(parseJsonObject(value)) : [];
    const items = arr.map(listItem).filter(Boolean);
    return items.length ? { id, title, items } : null;
  }).filter(Boolean);

  const checks = COMPLETION_CHECKS.map((c) => ({ label: c.label, done: c.keys.some((k) => !isBlank(read(k))) }));
  const done = checks.filter((c) => c.done).length;
  const completion = { percent: Math.round((done / checks.length) * 100), done, total: checks.length, missing: checks.filter((c) => !c.done).map((c) => c.label) };

  return { sections, twelfthSubjects, lists, completion };
}

/** Endpoint C: the logged-in student's profile, mapped (contact shape + full page view). */
export async function fetchProfile(sess) {
  ensureSession(sess);
  const raw = await proxyRequest({
    endpoint: `/api/User?Id=${encodeURIComponent(sess.userId)}&val=0&val1=0&val2=0&val3=0`,
    method: 'GET',
    headers: authHeaders(sess),
  });
  return { details: mapProfile(raw), view: buildProfileView(raw) };
}
