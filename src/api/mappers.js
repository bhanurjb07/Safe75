// Convert raw ERP responses into small, clean app models.
// Anything not picked here is dropped immediately.
import { cleanSemesterName, cleanSubjectName } from '../utils/subjectNames.js';
import { toDateKey } from '../utils/dates.js';
import { percentage } from '../utils/attendance.js';
import { ApiError } from './errors.js';

const num = (v) => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

const parseTime = (v) => {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? null : t;
};

/** Login response → session. Tokens stay in memory / sessionStorage only. */
export function mapSession(raw) {
  if (!raw || typeof raw !== 'object' || !raw.access_token) {
    throw new ApiError('shape', 'Login worked, but the ERP did not send a session token.');
  }
  const issuedAt = parseTime(raw['.issued']) ?? Date.now();
  const expiresIn = num(raw.expires_in);
  const expiresAt = parseTime(raw['.expires']) ?? (expiresIn ? issuedAt + expiresIn * 1000 : issuedAt + 24 * 3600 * 1000);
  const userId = raw['X-UserId'];
  if (userId == null || userId === '') {
    throw new ApiError('shape', 'Login worked, but the ERP did not say which student you are.');
  }
  return {
    accessToken: raw.access_token,
    tokenType: raw.token_type || 'bearer',
    xToken: raw.X_Token ?? '',
    sessionId: raw.SessionId ?? '',
    userId: String(userId),
    contextId: raw['X-ContextId'] != null ? String(raw['X-ContextId']) : '',
    logoId: raw['X-LogoId'] ?? null,
    issuedAt,
    expiresAt,
  };
}

/** Endpoint A → attendance model. */
export function mapAttendance(raw) {
  const d = raw?.stdSubAtdDetails;
  if (!d || typeof d !== 'object') {
    throw new ApiError('shape', "The ERP's attendance response is missing its summary (stdSubAtdDetails).");
  }

  const subjects = (Array.isArray(d.subjects) ? d.subjects : []).map((s, i) => {
    const total = num(s.totalLeactures) ?? 0;
    const present = num(s.presentLeactures) ?? 0;
    return {
      id: String(s.id ?? `subject-${i}`),
      code: (s.code || '').trim(),
      name: cleanSubjectName(s.name),
      isLab: s.subjectType === 1 || s.subjectType === '1',
      present,
      total,
      absent: num(s.absentLeactures) ?? Math.max(0, total - present),
      percentage: num(s.percentageAttendance) ?? percentage(present, total),
      extra: {
        total: num(s.totalExtraLeactureForSubject) ?? 0,
        present: num(s.presentInExtraLeactureForSubject) ?? 0,
        absent: num(s.absentInExtraLeactureForSubject) ?? 0,
      },
    };
  });

  const sumPresent = subjects.reduce((a, s) => a + s.present, 0);
  const sumTotal = subjects.reduce((a, s) => a + s.total, 0);
  const student = Array.isArray(d.studentSubjectAttendance) ? d.studentSubjectAttendance[0] : null;

  const present = num(d.overallPresent) ?? num(student?.studentPresentAttendance) ?? sumPresent;
  const total = num(d.overallLecture) ?? num(student?.studentTotalAttendance) ?? sumTotal;
  const overall = {
    present,
    total,
    absent: Math.max(0, total - present),
    percentage: num(d.overallPercentage) ?? num(student?.studentPercentage) ?? percentage(present, total),
  };

  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  // Day-wise log = regular classes (attendanceData) + extra classes (extraLectures).
  // Together they add up to the ERP's total. Every record is matched to its subject by
  // subjectId (extra records have subjectName: null).
  const regularList = Array.isArray(raw.attendanceData) ? raw.attendanceData : [];
  const extraList = Array.isArray(raw.extraLectures) ? raw.extraLectures : [];
  const nameFor = (r) => {
    const id = r.subjectId != null ? String(r.subjectId) : null;
    return subjectById.get(id)?.name ?? (r.subjectName ? cleanSubjectName(r.subjectName) : 'Unknown subject');
  };
  let undated = 0;
  const toRecord = (r, i, isExtra) => {
    const date = toDateKey(isExtra ? extraDateOf(r) : r.absentDate ?? r.date);
    if (!date) {
      undated++;
      return null;
    }
    const subjectId = r.subjectId != null ? String(r.subjectId) : null;
    return {
      id: `${isExtra ? 'x' : 'r'}-${date}-${subjectId ?? 'none'}-${i}`,
      date,
      subjectId,
      subjectName: nameFor(r),
      isAbsent: isExtra ? extraLabel(r) === 'A' : Boolean(r.isAbsent),
      isExtra,
      kind: isExtra ? 'Extra lecture' : r.attandanceType ?? null,
    };
  };
  // Regular first, then extra; the sort is stable, so within one subject and date
  // the regular marks stay ahead of the extra ones.
  const records = [
    ...regularList.map((r, i) => toRecord(r, i, false)),
    ...extraList.map((r, i) => toRecord(r, i, true)),
  ]
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));

  const logStats = {
    regular: regularList.length,
    extra: extraList.length,
    total: regularList.length + extraList.length,
    absent: records.filter((r) => r.isAbsent).length,
    undated,
  };
  logStats.present = records.length - logStats.absent;
  const extraFromSubjects = subjects.reduce(
    (a, s) => ({ total: a.total + s.extra.total, present: a.present + s.extra.present }),
    { total: 0, present: 0 },
  );
  // Prefer the extraLectures log itself; fall back to the per-subject summary fields.
  const extra = extraList.length
    ? { total: extraList.length, present: extraList.filter((e) => extraLabel(e) !== 'A').length }
    : extraFromSubjects;

  if (!subjects.length && !total) {
    throw new ApiError('shape', 'The ERP returned no subjects or classes for this semester yet.');
  }

  return { overall, subjects, records, extra, logStats };
}

/** "P" / "A" for an extra lecture (the ERP spells it attendanceLable). */
const extraLabel = (r) => String(r.attendanceLable ?? r.attendanceLabel ?? '').trim().toUpperCase();

const EXTRA_DATE_KEYS = ['absentDate', 'lectureDate', 'extraLectureDate', 'attendanceDate', 'date'];

/** An extra lecture's date: known field names first, then any field whose name contains "date". */
function extraDateOf(r) {
  for (const k of EXTRA_DATE_KEYS) if (r[k] && toDateKey(r[k])) return r[k];
  const k = Object.keys(r).find((key) => /date/i.test(key) && r[key] && toDateKey(r[key]));
  return k ? r[k] : null;
}

/** Endpoint B → semesters, newest first. */
export function mapSemesters(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && s.userId != null)
    .map((s) => ({
      userId: String(s.userId),
      batchName: cleanSemesterName(s.batchName) || [s.courseName, s.semester].filter(Boolean).join(' · '),
      semester: s.semester ?? '',
      financialYear: s.financialYear ?? '',
      courseName: s.courseName ?? '',
    }));
}

/** Endpoint C → only name and roll number. Everything else in the response is discarded. */
export function mapProfile(raw) {
  const src = Array.isArray(raw) ? raw[0] : raw;
  if (!src || typeof src !== 'object') throw new ApiError('shape', 'The ERP profile response was empty.');
  const clean = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');
  const title = (v) => clean(v).toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase());
  const firstName = title(src.firstName);
  const fullName = [src.firstName, src.middleName, src.lastName].map(title).filter(Boolean).join(' ');
  return {
    firstName: firstName || 'Student',
    fullName: fullName || 'Student',
    loginName: clean(src.loginName),
    rollNumber: clean(src.rollNumber) || clean(src.admissionNumber),
  };
}
