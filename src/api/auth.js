import { proxyRequest } from './client.js';
import { ApiError } from './errors.js';
import { mapSession } from './mappers.js';

/** True when the session is missing or within 30 s of expiring. */
export const isExpired = (sess) => !sess?.accessToken || !sess.expiresAt || Date.now() >= sess.expiresAt - 30_000;

/** Throws "unauthorized" if the session can't be used. */
export function ensureSession(sess) {
  if (isExpired(sess)) throw new ApiError('unauthorized');
}

/**
 * Logs in to the ERP. The password goes straight into the request body and is not kept anywhere.
 * @returns the mapped session
 */
export async function login(username, password) {
  let raw;
  try {
    raw = await proxyRequest({
      endpoint: '/Token',
      method: 'POST',
      body: { grant_type: 'password', username, password },
      contentType: 'application/x-www-form-urlencoded',
      headers: { 'X-WB': '1', 'X-RX': '1', Accept: '*/*', 'X-Requested-With': 'XMLHttpRequest' },
    });
  } catch (err) {
    // The token endpoint answers 400 (or sometimes 401) for wrong credentials.
    if (err instanceof ApiError && (err.code === 'bad_request' || err.code === 'unauthorized')) {
      throw new ApiError('credentials', undefined, { status: err.status, detail: err.detail });
    }
    throw err;
  }

  if (raw && typeof raw === 'object' && raw.error) {
    throw new ApiError(raw.error === 'invalid_grant' ? 'credentials' : 'bad_request', undefined, { detail: raw.error_description });
  }
  return mapSession(raw);
}
