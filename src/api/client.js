// The single place that talks to the ERP proxy.
import { PROXY_URL, SUPABASE_ANON_KEY } from '../config/env.js';
import { describeShape, useDebugStore } from '../store/debugStore.js';
import { ApiError, redact } from './errors.js';

const TIMEOUT_MS = 30000;

/** Headers the ERP expects on every request. */
export const ERP_BASE_HEADERS = { 'X-WB': '1', 'X-RX': '1' };

/** ERP headers for an authenticated request, built from the stored session. */
export function authHeaders(sess) {
  return {
    Authorization: `Bearer ${sess.accessToken}`,
    X_Token: sess.xToken,
    SessionId: sess.sessionId,
    'X-UserId': String(sess.userId),
    'X-ContextId': String(sess.contextId),
    ...ERP_BASE_HEADERS,
  };
}

const maskEndpoint = (endpoint) => endpoint.replace(/(userId=|Id=)(\d+)/gi, (_, k, v) => `${k}${'•'.repeat(Math.min(v.length, 6))}`);

const isAuthDenied = (data) =>
  data && typeof data === 'object' && typeof data.Message === 'string' && /authori[sz]ation has been denied/i.test(data.Message);

/**
 * POSTs one request to the proxy, which forwards it to the ERP.
 * @returns parsed JSON (or text) from the ERP
 */
export async function proxyRequest({ endpoint, method = 'GET', headers = {}, body, contentType }) {
  if (!PROXY_URL || !SUPABASE_ANON_KEY) throw new ApiError('config');

  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const logEntry = { time: Date.now(), endpoint: maskEndpoint(endpoint.split('?')[0]) + (endpoint.includes('?') ? '?…' : ''), method };

  let res;
  try {
    res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ endpoint, method, headers, body, contentType }),
      signal: controller.signal,
    });
  } catch (err) {
    const timedOut = err?.name === 'AbortError';
    useDebugStore.getState().log({ ...logEntry, status: 0, ms: Math.round(performance.now() - started), error: timedOut ? 'timeout' : 'network' });
    throw new ApiError(timedOut ? 'timeout' : 'network', undefined, { detail: err?.message });
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text().catch(() => '');
  let data = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* not JSON: keep the text */
  }

  const ms = Math.round(performance.now() - started);
  const shape = describeShape(data);
  useDebugStore.getState().log({ ...logEntry, status: res.status, ms, shape });

  if (res.status === 401 || res.status === 403 || isAuthDenied(data)) {
    throw new ApiError('unauthorized', undefined, { status: res.status });
  }
  if (res.status >= 500) {
    throw new ApiError('server', undefined, { status: res.status, detail: typeof data === 'string' ? data : data?.Message || data?.error });
  }
  if (!res.ok) {
    const detail = typeof data === 'object' && data ? data.error_description || data.Message || data.error : text;
    throw new ApiError('bad_request', undefined, { status: res.status, detail: redact(detail) });
  }
  return data;
}
