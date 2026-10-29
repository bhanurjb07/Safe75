// The ONLY place that reads import.meta.env. Every other module imports from here.
const raw = import.meta.env ?? {};

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const bool = (v) => str(v).toLowerCase() === 'true';

const parsedTarget = Number(str(raw.VITE_ATTENDANCE_TARGET));

export const PROXY_URL = str(raw.VITE_PROXY_URL);
export const SUPABASE_ANON_KEY = str(raw.VITE_SUPABASE_ANON_KEY);

/** Attendance target in percent, clamped to a sane range. */
export const ATTENDANCE_TARGET =
  Number.isFinite(parsedTarget) && parsedTarget >= 1 && parsedTarget <= 99 ? parsedTarget : 75;
export const TARGET_FRACTION = ATTENDANCE_TARGET / 100;

/** Experimental: try fetching attendance of past semesters. Hidden automatically if unsupported. */
export const ENABLE_PAST_SEMESTERS = bool(raw.VITE_ENABLE_PAST_SEMESTERS);

export const IS_DEV = Boolean(raw.DEV);
export const IS_PROD = Boolean(raw.PROD);

/** Names of required variables that are missing. */
export const MISSING_ENV = [
  ['VITE_PROXY_URL', PROXY_URL],
  ['VITE_SUPABASE_ANON_KEY', SUPABASE_ANON_KEY],
]
  .filter(([, value]) => !value)
  .map(([name]) => name);

/** Host of the proxy, safe to show in the debug panel. */
export const PROXY_HOST = (() => {
  try {
    return PROXY_URL ? new URL(PROXY_URL).host : '(not set)';
  } catch {
    return '(invalid URL)';
  }
})();
