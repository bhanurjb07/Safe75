import { describe, expect, it } from 'vitest';
import { mapAttendance, mapProfile, mapSession } from './mappers.js';

// Small made-up fixture in the ERP's response shape.
const attendanceFixture = {
  stdSubAtdDetails: {
    overallPercentage: 80,
    overallPresent: 8,
    overallLecture: 10,
    subjects: [
      {
        id: 1,
        code: 'SUB-101',
        name: 'SAMPLE   COUMPTING',
        totalLeactures: 6,
        presentLeactures: 5,
        absentLeactures: 1,
        percentageAttendance: 83.33,
        totalExtraLeactureForSubject: 2,
        presentInExtraLeactureForSubject: 1,
        absentInExtraLeactureForSubject: 1,
        subjectType: null,
      },
      {
        id: 2,
        code: 'SUB-151',
        name: 'Sample   Lab',
        totalLeactures: 4,
        presentLeactures: 3,
        absentLeactures: 1,
        percentageAttendance: 75,
        totalExtraLeactureForSubject: 0,
        presentInExtraLeactureForSubject: 0,
        absentInExtraLeactureForSubject: 0,
        subjectType: 1,
      },
    ],
  },
  attendanceData: [
    { absentDate: '2026-01-06T00:00:00', subjectId: 2, subjectName: 'Sample   Lab', isAbsent: true, attandanceType: 'Practical' },
    { absentDate: '2026-01-05T00:00:00', subjectId: 1, subjectName: 'SAMPLE   COUMPTING', isAbsent: false, attandanceType: 'Lecture' },
    { absentDate: 'not a date', subjectId: 1, isAbsent: false },
  ],
  extraLectures: [],
  attendanceCopy: [],
};

describe('mapAttendance', () => {
  const data = mapAttendance(attendanceFixture);

  it('uses the headline numbers from the summary', () => {
    expect(data.overall).toMatchObject({ present: 8, total: 10, percentage: 80, absent: 2 });
  });

  it('cleans subject names and flags labs', () => {
    expect(data.subjects[0].name).toBe('Sample Computing');
    expect(data.subjects.filter((s) => s.isLab)).toHaveLength(1);
  });

  it('sorts day records by date and drops unparseable ones', () => {
    expect(data.records.map((r) => r.date)).toEqual(['2026-01-05', '2026-01-06']);
    expect(data.records[1].subjectName).toBe('Sample Lab');
  });

  it('counts extra lectures separately', () => {
    expect(data.extra).toEqual({ total: 2, present: 1 });
  });

  it('fails readably on a bad shape', () => {
    expect(() => mapAttendance({})).toThrow(/stdSubAtdDetails/);
  });
});

describe('mapSession', () => {
  it('maps tokens and expiry', () => {
    const now = Date.now();
    const s = mapSession({
      access_token: 'test-token',
      token_type: 'bearer',
      expires_in: 3600,
      'X-UserId': 42,
      'X-ContextId': 7,
      SessionId: 'test-session',
      X_Token: 'test-x',
      '.issued': new Date(now).toUTCString(),
      '.expires': new Date(now + 3600 * 1000).toUTCString(),
    });
    expect(s.userId).toBe('42');
    expect(s.expiresAt).toBeGreaterThan(now);
  });
  it('rejects a response without a token', () => {
    expect(() => mapSession({})).toThrow();
  });
});

describe('mapProfile', () => {
  it('keeps only name and roll number', () => {
    const p = mapProfile({
      firstName: 'JANE',
      middleName: '',
      lastName: 'DOE',
      loginName: 'jdoe',
      rollNumber: 'R-001',
      aadharNumber: '0000',
      mobileNumber: '999',
      fatherName: 'X',
    });
    expect(p).toEqual({ firstName: 'Jane', fullName: 'Jane Doe', loginName: 'jdoe', rollNumber: 'R-001' });
  });
});

describe('mapAttendance: merged day-wise log', () => {
  // Regular 3 + extra 2 = 5 classes, matching overallLecture. 2 absents → 3 present.
  const raw = {
    stdSubAtdDetails: {
      overallPercentage: 60,
      overallPresent: 3,
      overallLecture: 5,
      subjects: [
        { id: 7, code: 'S-1', name: 'Subject One', totalLeactures: 4, presentLeactures: 2, subjectType: null },
        { id: 8, code: 'S-2', name: 'Subject Two', totalLeactures: 1, presentLeactures: 1, subjectType: null },
      ],
    },
    attendanceData: [
      { absentDate: '2026-02-02T00:00:00', subjectId: 7, subjectName: 'Subject One', isAbsent: false },
      { absentDate: '2026-02-03T00:00:00', subjectId: 7, subjectName: 'Subject One', isAbsent: true },
      { absentDate: '2026-02-03T00:00:00', subjectId: 8, subjectName: 'Subject Two', isAbsent: false },
    ],
    extraLectures: [
      // Same subject and date as a regular class: must come after it.
      { absentDate: '2026-02-02T00:00:00', subjectId: 7, subjectName: null, attendanceLable: 'A' },
      // Different date field name, lower-case label.
      { lectureDate: '2026-02-04T00:00:00', subjectId: 7, subjectName: null, attendanceLable: 'p' },
    ],
  };
  const data = mapAttendance(raw);

  it('counts regular + extra and matches the ERP total', () => {
    expect(data.logStats).toEqual({ regular: 3, extra: 2, total: 5, absent: 2, present: 3, undated: 0 });
    expect(data.logStats.total).toBe(data.overall.total);
    expect(data.logStats.present).toBe(data.overall.present);
  });

  it('names extra records from their subjectId', () => {
    const extras = data.records.filter((r) => r.isExtra);
    expect(extras.map((r) => r.subjectName)).toEqual(['Subject One', 'Subject One']);
    expect(extras.map((r) => r.isAbsent)).toEqual([true, false]);
  });

  it('puts regular before extra for the same subject and date ("PA")', () => {
    const day = data.records.filter((r) => r.date === '2026-02-02' && r.subjectId === '7');
    expect(day.map((r) => (r.isAbsent ? 'A' : 'P')).join('')).toBe('PA');
    expect(day.map((r) => r.isExtra)).toEqual([false, true]);
  });

  it('counts extra records it cannot date instead of hiding them', () => {
    const res = mapAttendance({ ...raw, extraLectures: [{ subjectId: 7, attendanceLable: 'P' }] });
    expect(res.logStats).toMatchObject({ extra: 1, undated: 1 });
  });
});
