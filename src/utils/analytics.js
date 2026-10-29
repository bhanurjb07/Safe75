// Derived insights from the day-by-day records and subject stats.
import { fromDateKey, mondayIndex, monthKey } from './dates.js';
import { percentage, riskSort, summarize } from './attendance.js';
import { TARGET_FRACTION } from '../config/env.js';

/** Records grouped by "YYYY-MM-DD". */
export function groupByDate(records) {
  const map = new Map();
  for (const r of records) {
    if (!map.has(r.date)) map.set(r.date, []);
    map.get(r.date).push(r);
  }
  return map;
}

/** Running attendance % at the end of each day, in date order. */
export function runningPercentage(records) {
  let present = 0;
  let total = 0;
  const out = [];
  for (const [date, recs] of groupByDate([...records].sort((a, b) => a.date.localeCompare(b.date)))) {
    total += recs.length;
    present += recs.filter((r) => !r.isAbsent).length;
    out.push({ date, percentage: percentage(present, total), present, total });
  }
  return out;
}

/** Present / absent / total for one month (month is 0-based). */
export function monthSummary(records, year, month) {
  const key = `${year}-${String(month + 1).padStart(2, '0')}`;
  const recs = records.filter((r) => monthKey(r.date) === key);
  const absent = recs.filter((r) => r.isAbsent).length;
  return {
    total: recs.length,
    present: recs.length - absent,
    absent,
    percentage: percentage(recs.length - absent, recs.length),
    days: new Set(recs.map((r) => r.date)).size,
  };
}

/** Subject with the most absences (uses the ERP's own per-subject counts). */
export function mostMissedSubject(subjects) {
  return [...subjects].filter((s) => s.absent > 0).sort((a, b) => b.absent - a.absent || a.percentage - b.percentage)[0] ?? null;
}

/**
 * Longest run of consecutive class days on which you missed every class.
 * Days without any classes (weekends, holidays) don't break the streak.
 */
export function longestAbsentStreak(records) {
  let best = { days: 0, from: null, to: null };
  let cur = { days: 0, from: null, to: null };
  for (const [date, recs] of groupByDate([...records].sort((a, b) => a.date.localeCompare(b.date)))) {
    if (recs.every((r) => r.isAbsent)) {
      cur = { days: cur.days + 1, from: cur.from ?? date, to: date };
      if (cur.days > best.days) best = { ...cur };
    } else {
      cur = { days: 0, from: null, to: null };
    }
  }
  return best;
}

/** Absences by weekday (Monday first) and the weekday you miss most. */
export function absencesByWeekday(records) {
  const counts = Array.from({ length: 7 }, () => ({ absent: 0, total: 0 }));
  for (const r of records) {
    const i = mondayIndex(fromDateKey(r.date));
    counts[i].total++;
    if (r.isAbsent) counts[i].absent++;
  }
  let worst = -1;
  let worstRate = 0;
  counts.forEach((c, i) => {
    const rate = c.total ? c.absent / c.total : 0;
    if (rate > worstRate) {
      worstRate = rate;
      worst = i;
    }
  });
  return { counts, worstIndex: worst, worstRate };
}

/** Running % for one subject, for its trend chart. */
export const subjectTrend = (records, subjectId) => runningPercentage(records.filter((r) => r.subjectId === subjectId));

/** Dates you were absent for one subject, newest first. */
export const absentDates = (records, subjectId) =>
  records
    .filter((r) => r.subjectId === subjectId && r.isAbsent)
    .map((r) => r.date)
    .sort((a, b) => b.localeCompare(a));

/** Average classes per week for a subject, measured over the span of the records. */
export function classesPerWeek(records, subjectId, fallback = 3) {
  const recs = records.filter((r) => r.subjectId === subjectId);
  if (recs.length < 2) return fallback;
  const first = fromDateKey(recs[0].date);
  const last = fromDateKey(recs[recs.length - 1].date);
  const weeks = Math.max(1, (last - first) / (7 * 24 * 3600 * 1000));
  return Math.max(1, Math.round(recs.length / weeks));
}

/** Subjects enriched with summary stats, sorted by risk (lowest % first). */
export function subjectsWithStats(subjects, r = TARGET_FRACTION) {
  return subjects.map((s) => ({ ...s, ...summarize(s.present, s.total, r), name: s.name })).sort(riskSort);
}

/** Headline insights for the dashboard / insights page. */
export function buildInsights(data, r = TARGET_FRACTION) {
  const subjects = subjectsWithStats(data.subjects, r).filter((s) => s.total > 0);
  const weakest = subjects[0] ?? null;
  const strongest = [...subjects].sort((a, b) => b.percentage - a.percentage)[0] ?? null;
  const danger = subjects.filter((s) => s.status === 'danger');
  const edge = subjects.filter((s) => s.status === 'borderline');
  const recoverTotal = danger.reduce((a, s) => a + (Number.isFinite(s.mustAttend) ? s.mustAttend : 0), 0);
  return { subjects, weakest, strongest, danger, edge, recoverTotal };
}

const LINES = {
  safe: [
    'Comfortably above the line. Keep the rhythm going.',
    'Nice cushion. Spend your skips wisely.',
    'You’ve earned some breathing room.',
  ],
  borderline: [
    'Close to the line. A couple of extra classes buys real safety.',
    'You’re safe, but only just. Plan skips carefully.',
    'Stay steady this week and you’ll move into the green.',
  ],
  danger: [
    'Every class counts now. Show up and it climbs fast.',
    'A focused week of attendance turns this around.',
    'Start with tomorrow’s classes. Small streaks add up.',
  ],
};

/** A motivational line that fits the status; stable for the day. */
export function motivation(status, seed = new Date().getDate()) {
  const list = LINES[status] ?? LINES.safe;
  return list[seed % list.length];
}

/** Monday (local) of the week containing a "YYYY-MM-DD" key, as a key. */
export function weekStartKey(key) {
  const d = fromDateKey(key);
  d.setDate(d.getDate() - mondayIndex(d));
  return keyOfDate(d);
}

const keyOfDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Monday–Saturday of one week with present / absent counts per day. */
export function weekBuckets(records, mondayKey) {
  const byDate = groupByDate(records);
  const start = fromDateKey(mondayKey);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = keyOfDate(d);
    const recs = byDate.get(key) ?? [];
    const absent = recs.filter((r) => r.isAbsent).length;
    return { key, present: recs.length - absent, absent, total: recs.length };
  });
}

/**
 * Alerts derived from the data, newest first. `lastSeen` is the latest record date the
 * user had already seen (or null), used to mark new absences.
 */
export function buildAlerts(data, lastSeen, r = TARGET_FRACTION) {
  const alerts = [];
  const subjects = subjectsWithStats(data.subjects, r).filter((s) => s.total > 0);
  for (const s of subjects) {
    if (s.status === 'danger') {
      alerts.push({
        id: `danger-${s.id}`,
        tone: 'danger',
        title: `${s.name} is below ${Math.round(r * 100)}%`,
        body: `At ${s.percentage.toFixed(1)}%. Attend the next ${Number.isFinite(s.mustAttend) ? s.mustAttend : 'every'} classes to recover.`,
        subjectId: s.id,
      });
    } else if (s.status === 'borderline' && s.canSkip <= 1) {
      alerts.push({
        id: `edge-${s.id}`,
        tone: 'warn',
        title: `${s.name} is on the edge`,
        body: s.canSkip === 1 ? 'Only 1 skip left before you drop below the target.' : "You can't skip the next class.",
        subjectId: s.id,
      });
    }
  }
  // The 10 most recent days with an absence; ones after `lastSeen` are tagged new.
  const byDay = groupByDate(data.records.filter((x) => x.isAbsent));
  for (const [date, recs] of [...byDay].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 10)) {
    alerts.push({
      id: `absent-${date}`,
      tone: 'info',
      isNew: Boolean(lastSeen) && date > lastSeen,
      date,
      title: `Marked absent in ${recs.length} ${recs.length === 1 ? 'class' : 'classes'}`,
      body: recs.map((x) => x.subjectName).join(', '),
    });
  }
  return alerts;
}
