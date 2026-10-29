// Exports the user's own attendance as a CSV file. Built on the device; nothing is uploaded.
import { subjectsWithStats } from './analytics.js';
import { todayKey } from './dates.js';

const cell = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows) => rows.map((r) => r.map(cell).join(',')).join('\r\n');

function download(text, filename, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Per-subject summary CSV. */
export function exportSubjectsCsv(data) {
  const rows = [
    ['Subject', 'Code', 'Type', 'Present', 'Total', 'Absent', 'Percentage', 'Can skip', 'Must attend'],
    ...subjectsWithStats(data.subjects).map((s) => [
      s.name,
      s.code,
      s.isLab ? 'Lab' : 'Theory',
      s.present,
      s.total,
      s.absent,
      s.percentage.toFixed(2),
      s.canSkip,
      Number.isFinite(s.mustAttend) ? s.mustAttend : 'all',
    ]),
    [],
    ['Overall', '', '', data.overall.present, data.overall.total, data.overall.absent, data.overall.percentage.toFixed(2)],
  ];
  download(toCsv(rows), `safe75-subjects-${todayKey()}.csv`, 'text/csv;charset=utf-8');
}

/** Day-by-day log CSV. */
export function exportRecordsCsv(data) {
  const rows = [
    ['Date', 'Subject', 'Type', 'Status'],
    ...[...data.records].sort((a, b) => b.date.localeCompare(a.date)).map((r) => [r.date, r.subjectName, r.kind ?? '', r.isAbsent ? 'Absent' : 'Present']),
  ];
  download(toCsv(rows), `safe75-daily-log-${todayKey()}.csv`, 'text/csv;charset=utf-8');
}
