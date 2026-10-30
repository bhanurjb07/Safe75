import { describe, expect, it } from 'vitest';
import { formatDate, formatValue } from '../utils/formatters.js';
import { isBlank, parseJsonObject, readField } from '../utils/responseParser.js';
import { buildProfileView } from './profile.js';

describe('parseJsonObject', () => {
  it('accepts objects and JSON strings, and never throws', () => {
    expect(parseJsonObject({ a: 1 })).toEqual({ a: 1 });
    expect(parseJsonObject('{"a":1}')).toEqual({ a: 1 });
    expect(parseJsonObject('{broken')).toEqual({});
    expect(parseJsonObject('[1,2]')).toEqual({});
    expect(parseJsonObject(null)).toEqual({});
    expect(parseJsonObject('')).toEqual({});
  });
});

describe('isBlank / readField', () => {
  it('treats ERP placeholders as blank', () => {
    for (const v of [null, undefined, '', '  ', 'null', 'NA', 'N/A', '--', 'Select', '0001-01-01T00:00:00', []]) expect(isBlank(v)).toBe(true);
    for (const v of [0, false, 'x', [1]]) expect(isBlank(v)).toBe(false);
  });
  it('prefers the root value, falls back to userDetails, then alternate keys', () => {
    expect(readField({ a: 'root' }, { a: 'nested' }, 'a')).toBe('root');
    expect(readField({ a: 'NA' }, { a: 'nested' }, 'a')).toBe('nested');
    expect(readField({ b: 'alt' }, {}, ['a', 'b'])).toBe('alt');
    expect(readField({}, {}, 'a')).toBeNull();
  });
});

describe('formatters', () => {
  it('formats dates in several input formats and rejects junk', () => {
    expect(formatDate('2005-03-09T00:00:00')).toBe(formatDate('09-03-2005'));
    expect(formatDate('09/03/2005')).toBe(formatDate('2005-03-09'));
    expect(formatDate('0001-01-01T00:00:00')).toBeNull();
    expect(formatDate('not a date')).toBeNull();
  });
  it('handles numbers sent as strings and treats 0 marks as not provided', () => {
    expect(formatValue('percent', '87.456')).toBe('87.46%');
    expect(formatValue('score', 0)).toBeNull();
    expect(formatValue('score', '0')).toBeNull();
    expect(formatValue('money', '125000')).toMatch(/1,25,000/);
  });
  it('maps boolean-ish values to Yes / No', () => {
    expect(formatValue('bool', 'Y')).toBe('Yes');
    expect(formatValue('bool', false)).toBe('No');
    expect(formatValue('bool', 'maybe')).toBeNull();
  });
  it('never stringifies objects', () => {
    expect(formatValue('text', { a: 1 })).toBeNull();
  });
});

describe('buildProfileView', () => {
  // Made-up values only.
  const raw = {
    firstName: 'JANE',
    lastName: 'DOE',
    dob: '2005-03-09T00:00:00',
    gender: 'FEMALE',
    religion: 'Sample',
    email: 'Jane@Example.test',
    phone: '9000000001',
    smsMobileNumber: '9000000001',
    fatherName: 'ROOT FATHER',
    tenthClassPercentage: '91.5',
    tenthCgpa: 0,
    twelfthPhysicMaxMark: '100',
    twelfthPhysicScoredMark: '88',
    twelfthMathPercentage: 95,
    hostelTaken: false,
    aadhaarNumber: '111122223333',
    courseId: 42,
    userDetails: JSON.stringify({ fatherName: 'NESTED FATHER', motherName: 'NESTED MOTHER', guardianName: 'GUARDIAN ONE', guardianEmailId: 'g@example.test' }),
    userAchievement: [{ id: 7, title: 'Hackathon winner', achievementDate: '2025-01-20T00:00:00', aadhaarNumber: '111122223333' }],
  };
  const view = buildProfileView(raw);
  const section = (id) => view.sections.find((s) => s.id === id);
  const value = (id, label) => section(id)?.fields.find((f) => f.label === label)?.value;

  it('uses root fields first and userDetails only for gaps', () => {
    expect(value('father', 'Name')).toBe('Root Father');
    expect(value('mother', 'Name')).toBe('Nested Mother');
    expect(value('guardian', 'Name')).toBe('Guardian One');
    expect(value('guardian', 'Email')).toBe('g@example.test');
  });

  it('hides blank and zero-score fields and drops empty cards', () => {
    expect(value('tenth', 'CGPA')).toBeUndefined();
    expect(value('tenth', 'Percentage')).toBe('91.5%');
    expect(section('diploma')).toBeUndefined();
    expect(section('permanentAddress')).toBeUndefined();
  });

  it('removes repeated values within a card (phone = SMS mobile)', () => {
    const phones = section('contact').fields.map((f) => f.value);
    expect(phones).toEqual(['9000000001']);
  });

  it('keeps different fields that happen to share a value', () => {
    const v = buildProfileView({ religion: 'Same', caste: 'Same' });
    expect(v.sections.find((s) => s.id === 'personal').fields.map((f) => f.label)).toEqual(['Religion', 'Category / caste']);
  });

  it('flags sensitive fields and never includes internal ids or Aadhaar in sections', () => {
    expect(section('personal').fields.find((f) => f.label === 'Religion').sensitive).toBe(true);
    const all = JSON.stringify(view.sections);
    expect(all).not.toContain('111122223333');
    expect(all).not.toContain('"42"');
  });

  it('formats dates and booleans', () => {
    expect(value('personal', 'Date of birth')).toBe(formatDate('2005-03-09'));
    expect(value('hostel', 'Hostel opted')).toBe('No');
  });

  it('builds 12th subject rows only from real values', () => {
    expect(view.twelfthSubjects).toEqual([
      { subject: 'Physics', max: '100', scored: '88', percent: 88 },
      { subject: 'Mathematics', max: null, scored: null, percent: 95 },
    ]);
  });

  it('renders list items generically without ids or Aadhaar', () => {
    const items = view.lists.find((l) => l.id === 'achievements').items;
    expect(items).toHaveLength(1);
    const flat = items[0].map(([k, v]) => `${k}=${v}`).join('|');
    expect(flat).toContain('Title=Hackathon winner');
    expect(flat).not.toMatch(/111122223333|=7\b/);
  });

  it('computes completion from the fixed checklist', () => {
    expect(view.completion.total).toBe(12);
    expect(view.completion.missing).toContain('Permanent address');
    expect(view.completion.missing).not.toContain("Mother's name"); // found in userDetails
    expect(view.completion.percent).toBe(Math.round((view.completion.done / 12) * 100));
  });

  it('survives an empty or broken response', () => {
    expect(buildProfileView({ userDetails: '{oops' })).toMatchObject({ sections: [], twelfthSubjects: [], lists: [] });
    expect(buildProfileView(null).completion.percent).toBe(0);
  });
});
