import { describe, expect, it } from 'vitest';
import {
  adviceSentence,
  mustAttend,
  percentage,
  projected,
  safeToSkip,
  statusFor,
  summarize,
  whatIfAttend,
  whatIfSkip,
} from './attendance.js';

describe('percentage', () => {
  it('computes P / T', () => {
    expect(percentage(90, 110)).toBe(81.82);
  });
  it('is 0 when no classes were held', () => {
    expect(percentage(0, 0)).toBe(0);
  });
  it('rounds to 2 decimals', () => {
    expect(percentage(2, 3)).toBe(66.67);
  });
});

describe('safeToSkip', () => {
  it('90/110 can skip 10', () => {
    expect(safeToSkip(90, 110, 0.75)).toBe(10);
    // and skipping 10 really keeps you at or above 75 %
    expect(whatIfSkip(90, 110, 10)).toBeGreaterThanOrEqual(75);
    expect(whatIfSkip(90, 110, 11)).toBeLessThan(75);
  });
  it('is exact at the boundary', () => {
    expect(safeToSkip(3, 4, 0.75)).toBe(0);
    expect(safeToSkip(75, 100, 0.75)).toBe(0);
    expect(safeToSkip(4, 4, 0.75)).toBe(1);
  });
  it('handles awkward targets without float drift', () => {
    expect(safeToSkip(4, 4, 0.8)).toBe(1);
    expect(safeToSkip(60, 75, 0.8)).toBe(0);
  });
  it('is 0 below target or with no classes', () => {
    expect(safeToSkip(10, 20, 0.75)).toBe(0);
    expect(safeToSkip(0, 0, 0.75)).toBe(0);
  });
});

describe('mustAttend', () => {
  it('is 0 when already at or above target', () => {
    expect(mustAttend(90, 110, 0.75)).toBe(0);
    expect(mustAttend(3, 4, 0.75)).toBe(0);
  });
  it('computes classes needed in a row', () => {
    // 10/20 = 50 %, need ceil((15 - 10) / 0.25) = 20 → 30/40 = 75 %
    expect(mustAttend(10, 20, 0.75)).toBe(20);
    expect(whatIfAttend(10, 20, 20)).toBe(75);
    expect(whatIfAttend(10, 20, 19)).toBeLessThan(75);
  });
  it('rounds up partial classes', () => {
    // 2/4 → (3 - 2) / 0.25 = 4
    expect(mustAttend(2, 4, 0.75)).toBe(4);
    // 7/10 → (7.5 - 7) / 0.25 = 2
    expect(mustAttend(7, 10, 0.75)).toBe(2);
    // 29/40 → (30 - 29) / 0.25 = 4
    expect(mustAttend(29, 40, 0.75)).toBe(4);
  });
});

describe('what-if', () => {
  it('skip lowers the percentage', () => {
    expect(whatIfSkip(90, 110, 0)).toBe(81.82);
    // 90 / 115
    expect(whatIfSkip(90, 110, 5)).toBe(78.26);
  });
  it('attend raises the percentage', () => {
    // 100 / 120
    expect(whatIfAttend(90, 110, 10)).toBe(83.33);
  });
  it('projected combines both', () => {
    expect(projected(90, 110, { attend: 10, skip: 0 })).toBe(whatIfAttend(90, 110, 10));
    expect(projected(90, 110, { attend: 0, skip: 5 })).toBe(whatIfSkip(90, 110, 5));
    expect(projected(10, 20, { attend: 5, skip: 5 })).toBe(50);
  });
});

describe('statusFor', () => {
  it('uses target and target + 5 bands', () => {
    expect(statusFor(80, 75)).toBe('safe');
    expect(statusFor(79.99, 75)).toBe('borderline');
    expect(statusFor(75, 75)).toBe('borderline');
    expect(statusFor(74.99, 75)).toBe('danger');
  });
});

describe('summarize + advice', () => {
  it('summarises a safe record', () => {
    const s = summarize(90, 110, 0.75);
    expect(s).toMatchObject({ percentage: 81.82, status: 'safe', canSkip: 10, mustAttend: 0, absent: 20 });
    expect(adviceSentence(s, 75)).toBe('You can skip 10 more classes and stay above 75%.');
  });
  it('advises attending when in danger', () => {
    const s = summarize(10, 20, 0.75);
    expect(s.status).toBe('danger');
    expect(adviceSentence(s, 75)).toBe('Attend the next 20 classes to get back to 75%.');
  });
});
