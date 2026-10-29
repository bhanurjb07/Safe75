import { ensureSession } from './auth.js';
import { authHeaders, proxyRequest } from './client.js';
import { mapAttendance, mapSemesters } from './mappers.js';

/** Endpoint A: overall + per-subject attendance and the day-by-day log. */
export async function fetchAttendance(sess, userId = sess?.userId) {
  ensureSession(sess);
  const raw = await proxyRequest({
    endpoint: `/api/SubjectAttendance/GetPresentAbsentStudent?isDateWise=false&termId=0&userId=${encodeURIComponent(userId)}&y=0`,
    method: 'GET',
    headers: authHeaders(sess),
  });
  return mapAttendance(raw);
}

/** Endpoint B: semester / batch history, newest first. */
export async function fetchSemesters(sess) {
  ensureSession(sess);
  const raw = await proxyRequest({
    endpoint: `/api/SubjectAttendance?userFromClient=0&userId=${encodeURIComponent(sess.userId)}`,
    method: 'GET',
    headers: authHeaders(sess),
  });
  return mapSemesters(raw);
}
