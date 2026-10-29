import { describe, expect, it } from 'vitest';
import { cleanSemesterName, cleanSubjectName, subjectInitials } from './subjectNames.js';

describe('cleanSubjectName', () => {
  it('collapses spaces and title cases', () => {
    expect(cleanSubjectName('Applied   Physics')).toBe('Applied Physics');
    expect(cleanSubjectName('ENGINEERING    MATHEMATICS')).toBe('Engineering Mathematics');
  });
  it('fixes known typos', () => {
    expect(cleanSubjectName('EDGE   COUMPTING')).toBe('Edge Computing');
  });
  it('keeps small words lowercase and acronyms uppercase', () => {
    expect(cleanSubjectName('PRINCIPLES OF THE ECONOMY AND SOCIETY')).toBe('Principles of the Economy and Society');
    expect(cleanSubjectName('sql lab')).toBe('SQL Lab');
  });
  it('handles separators', () => {
    expect(cleanSubjectName('Seminar / Viva   Voce')).toBe('Seminar / Viva Voce');
  });
  it('is safe with bad input', () => {
    expect(cleanSubjectName(null)).toBe('Unnamed subject');
    expect(cleanSubjectName('   ')).toBe('Unnamed subject');
  });
});

describe('subjectInitials', () => {
  it('abbreviates', () => {
    expect(subjectInitials('Principles of Economy and Society')).toBe('PES');
    expect(subjectInitials('Applied Physics')).toBe('AP');
  });
});

describe('cleanSemesterName', () => {
  it('formats batch names', () => {
    expect(cleanSemesterName('M.SC | 1ST Year_II Sem')).toBe('M.SC · 1st Year · II Sem');
  });
});
