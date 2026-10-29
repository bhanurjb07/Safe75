import { ensureSession } from './auth.js';
import { authHeaders, proxyRequest } from './client.js';
import { mapProfile } from './mappers.js';

/**
 * Endpoint C. The raw response holds very sensitive personal data; mapProfile keeps only
 * name and roll number and the rest is dropped right here, never stored or logged.
 */
export async function fetchProfile(sess) {
  ensureSession(sess);
  const raw = await proxyRequest({
    endpoint: `/api/User?Id=${encodeURIComponent(sess.userId)}&val=0&val1=0&val2=0&val3=0`,
    method: 'GET',
    headers: authHeaders(sess),
  });
  return mapProfile(raw);
}
