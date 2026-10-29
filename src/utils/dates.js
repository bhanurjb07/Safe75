// Dates from the ERP look like "YYYY-MM-DDT00:00:00" with no zone. Treat them as local dates.

const pad = (n) => String(n).padStart(2, '0');

/** Local date → "YYYY-MM-DD". */
export const keyOf = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** ERP date string (or Date) → "YYYY-MM-DD", or null when unparseable. */
export function toDateKey(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : keyOf(value);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : keyOf(d);
}

/** "YYYY-MM-DD" → local Date at midnight. */
export function fromDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const todayKey = () => keyOf(new Date());

export const monthKey = (key) => key.slice(0, 7);

const fmt = (opts) => new Intl.DateTimeFormat(undefined, opts);
const dayFmt = fmt({ day: 'numeric', month: 'short' });
const longDayFmt = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
const monthFmt = fmt({ month: 'long', year: 'numeric' });
const timeFmt = fmt({ hour: 'numeric', minute: '2-digit' });

export const formatDay = (key) => dayFmt.format(fromDateKey(key));
export const formatLongDay = (key) => longDayFmt.format(fromDateKey(key));
export const formatMonth = (year, month) => monthFmt.format(new Date(year, month, 1));
export const formatTime = (ts) => timeFmt.format(new Date(ts));

/** "Last updated 10:42 AM", or with the day when it isn't today. */
export function formatUpdated(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const sameDay = keyOf(d) === todayKey();
  return sameDay ? formatTime(ts) : `${dayFmt.format(d)}, ${formatTime(ts)}`;
}

/** Weekday names starting Monday, localised. */
export const weekdayNames = (style = 'short') => {
  const f = fmt({ weekday: style });
  // 2024-01-01 was a Monday
  return Array.from({ length: 7 }, (_, i) => f.format(new Date(2024, 0, 1 + i)));
};

/** Monday-first weekday index (0 = Monday). */
export const mondayIndex = (date) => (date.getDay() + 6) % 7;

/** Cells for a month grid: leading blanks (null) then day keys. */
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: mondayIndex(first) }, () => null);
  for (let d = 1; d <= days; d++) cells.push(keyOf(new Date(year, month, d)));
  return cells;
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
