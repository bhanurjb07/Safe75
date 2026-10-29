// Pure attendance math. P = present, T = total, R = target fraction (0.75).
import { TARGET_FRACTION } from '../config/env.js';

const EPS = 1e-9;

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Attendance percentage, rounded to 2 decimals. 0 when no classes were held. */
export function percentage(present, total) {
  if (!total || total <= 0) return 0;
  return round2((present / total) * 100);
}

/** Classes you can still skip and stay at or above the target: floor(P / R - T). */
export function safeToSkip(present, total, r = TARGET_FRACTION) {
  if (!total || r <= 0) return 0;
  return Math.max(0, Math.floor(present / r - total + EPS));
}

/** Classes you must attend in a row to reach the target: ceil((R*T - P) / (1 - R)). */
export function mustAttend(present, total, r = TARGET_FRACTION) {
  if (r >= 1) return present >= total ? 0 : Infinity;
  return Math.max(0, Math.ceil((r * total - present) / (1 - r) - EPS));
}

/** Percentage after skipping k more classes: P / (T + k). */
export function whatIfSkip(present, total, k) {
  return percentage(present, total + k);
}

/** Percentage after attending m more classes: (P + m) / (T + m). */
export function whatIfAttend(present, total, m) {
  return percentage(present + m, total + m);
}

/** Percentage after attending m and skipping k more classes. */
export function projected(present, total, { attend = 0, skip = 0 } = {}) {
  return percentage(present + attend, total + attend + skip);
}

/**
 * Status band:
 *  - safe:       pct >= target + 5
 *  - borderline: target <= pct < target + 5
 *  - danger:     pct < target
 */
export function statusFor(pct, targetPct = TARGET_FRACTION * 100) {
  if (pct >= targetPct + 5) return 'safe';
  if (pct >= targetPct) return 'borderline';
  return 'danger';
}

/** Everything a card needs, computed in one place. */
export function summarize(present, total, r = TARGET_FRACTION) {
  const pct = percentage(present, total);
  const status = total > 0 ? statusFor(pct, r * 100) : 'safe';
  return {
    present,
    total,
    absent: Math.max(0, total - present),
    percentage: pct,
    status,
    canSkip: safeToSkip(present, total, r),
    mustAttend: mustAttend(present, total, r),
  };
}

/** Rank for sorting by risk: lowest margin over the target first. */
export const riskSort = (a, b) => a.percentage - b.percentage || a.name.localeCompare(b.name);

/** One human sentence for the headline. */
export function adviceSentence({ canSkip, mustAttend: need, total }, targetPct = TARGET_FRACTION * 100) {
  const t = `${round2(targetPct)}%`;
  if (!total) return 'No classes recorded yet.';
  if (need > 0) {
    return need === Infinity
      ? `You can't reach ${t} anymore this term.`
      : `Attend the next ${need} ${need === 1 ? 'class' : 'classes'} to get back to ${t}.`;
  }
  if (canSkip > 0) return `You can skip ${canSkip} more ${canSkip === 1 ? 'class' : 'classes'} and stay above ${t}.`;
  return `You're right on the line. Don't skip the next class.`;
}
