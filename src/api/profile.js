import { ensureSession } from './auth.js';
import { authHeaders, proxyRequest } from './client.js';
import { ApiError } from './errors.js';

const clean = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');
const title = (v) => clean(v).toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase());
const orNull = (v) => clean(v) || null;

/** `userDetails` arrives as a JSON string. Parse it only for the fallback fields, never keep it. */
function parseUserDetails(value) {
  if (typeof value !== 'string' || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

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

/** Endpoint C: the logged-in student's profile, mapped. */
export async function fetchProfile(sess) {
  ensureSession(sess);
  const raw = await proxyRequest({
    endpoint: `/api/User?Id=${encodeURIComponent(sess.userId)}&val=0&val1=0&val2=0&val3=0`,
    method: 'GET',
    headers: authHeaders(sess),
  });
  return mapProfile(raw);
}
