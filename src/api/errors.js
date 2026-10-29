// One error type for everything the API layer can throw, with friendly messages.

export class ApiError extends Error {
  /**
   * @param {string} code  network | timeout | unauthorized | credentials | server | bad_request | shape | config
   */
  constructor(code, message, { status = 0, detail = '' } = {}) {
    super(message || FRIENDLY[code] || FRIENDLY.unknown);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.detail = redact(detail);
  }
}

export const FRIENDLY = {
  network: "Can't reach the server. Check your internet connection and try again.",
  timeout: 'The college ERP is taking too long to respond. Please try again.',
  unauthorized: 'Your session expired. Please sign in again.',
  credentials: 'Wrong username or password. Please check them and try again.',
  server: 'The college ERP seems to be down right now. Please try again in a few minutes.',
  bad_request: 'The ERP rejected the request. Please try again.',
  shape: 'The ERP sent data in an unexpected format. It may have changed — please try again later.',
  config: 'Safe75 is not configured. Check the .env file.',
  unknown: 'Something went wrong. Please try again.',
};

const TOKENISH = /(bearer\s+)[\w\-.~+/]+=*/gi;
const JWTISH = /eyJ[\w-]+\.[\w-]+\.[\w-]+/g;
const KEYED = /("?(?:access_token|x_token|sessionid|authorization|apikey|password|refresh_token)"?\s*[:=]\s*"?)[^",}\s]+/gi;
// Aadhaar (12 digits, optionally grouped) and phone numbers (10+ digits) never appear in errors.
const AADHAAR = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
const PHONE = /(?:\+?\d[\s-]?){10,}/g;
const PERSONAL_KEYED = /("?(?:phone|smsMobileNumber|mobile\w*|address\w*|aadh?aar\w*|userDetails)"?\s*[:=]\s*)("[^"]*"|[^,}\n]+)/gi;

/** Strips tokens and secrets out of any text before it is shown or kept. */
export function redact(text) {
  if (text == null) return '';
  return String(text)
    .replace(TOKENISH, '$1[hidden]')
    .replace(JWTISH, '[hidden]')
    .replace(KEYED, '$1[hidden]')
    .replace(PERSONAL_KEYED, '$1[hidden]')
    .replace(AADHAAR, '[hidden]')
    .replace(PHONE, '[hidden]')
    .slice(0, 400);
}

/** Normalises anything thrown into an ApiError. */
export function toApiError(err) {
  if (err instanceof ApiError) return err;
  return new ApiError('unknown', undefined, { detail: err?.message });
}
