import { describe, expect, it } from 'vitest';
import { absencesByWeekday, buildAlerts, longestAbsentStreak, monthSummary, mostMissedSubject, runningPercentage, weekBuckets, weekStartKey } from './analytics.js';

const rec = (date, isAbsent, subjectId = 'a') => ({ date, isAbsent, subjectId });

describe('runningPercentage', () => {
  it('accumulates day by day', () => {
    const out = runningPercentage([rec('2026-08-03', false), rec('2026-08-03', true), rec('2026-08-04', false)]);
    expect(out.map((d) => d.percentage)).toEqual([50, 66.67]);
  });
});

describe('longestAbsentStreak', () => {
  it('counts consecutive fully-absent class days', () => {
    const recs = [
      rec('2026-08-03', true),
      rec('2026-08-04', true),
      rec('2026-08-04', true, 'b'),
      rec('2026-08-05', false),
      rec('2026-08-06', true),
    ];
    expect(longestAbsentStreak(recs)).toEqual({ days: 2, from: '2026-08-03', to: '2026-08-04' });
  });
  it('a partly attended day breaks the streak', () => {
    expect(longestAbsentStreak([rec('2026-08-03', true), rec('2026-08-03', false, 'b')]).days).toBe(0);
  });
});

describe('monthSummary', () => {
  it('summarises one month', () => {
    const s = monthSummary([rec('2026-08-03', false), rec('2026-08-31', true), rec('2026-09-01', true)], 2026, 7);
    expect(s).toMatchObject({ total: 2, present: 1, absent: 1, percentage: 50, days: 2 });
  });
});

describe('mostMissedSubject', () => {
  it('picks the most absences', () => {
    expect(mostMissedSubject([{ id: 1, absent: 3, percentage: 80 }, { id: 2, absent: 9, percentage: 70 }]).id).toBe(2);
    expect(mostMissedSubject([{ id: 1, absent: 0, percentage: 100 }])).toBeNull();
  });
});

describe('absencesByWeekday', () => {
  it('finds the most-missed weekday', () => {
    // 2026-08-03 is a Monday
    const res = absencesByWeekday([rec('2026-08-03', true), rec('2026-08-04', false)]);
    expect(res.worstIndex).toBe(0);
  });
});

describe('weekStartKey / weekBuckets', () => {
  it('finds the Monday and buckets Mon–Sat', () => {
    // 2026-08-05 is a Wednesday
    expect(weekStartKey('2026-08-05')).toBe('2026-08-03');
    const days = weekBuckets([rec('2026-08-03', true), rec('2026-08-03', false), rec('2026-08-08', false)], '2026-08-03');
    expect(days).toHaveLength(6);
    expect(days[0]).toMatchObject({ key: '2026-08-03', present: 1, absent: 1 });
    expect(days[5]).toMatchObject({ key: '2026-08-08', present: 1, absent: 0 });
  });
});

describe('buildAlerts', () => {
  const data = {
    subjects: [
      { id: 'a', name: 'Low', code: '', present: 5, total: 10, isLab: false },
      { id: 'b', name: 'Fine', code: '', present: 10, total: 10, isLab: false },
    ],
    records: [rec('2026-08-03', true), rec('2026-08-10', true)].map((r) => ({ ...r, subjectName: 'Low' })),
  };
  it('flags danger subjects and recent absences', () => {
    const alerts = buildAlerts(data, null);
    expect(alerts.find((a) => a.id === 'danger-a')).toBeTruthy();
    expect(alerts.filter((a) => a.tone === 'info')).toHaveLength(2);
  });
  it('only marks absences after lastSeen as new', () => {
    const alerts = buildAlerts(data, '2026-08-05');
    const absences = alerts.filter((a) => a.tone === 'info');
    expect(absences).toHaveLength(2);
    expect(absences[0]).toMatchObject({ date: '2026-08-10', isNew: true });
    expect(absences[1]).toMatchObject({ date: '2026-08-03', isNew: false });
  });
});
